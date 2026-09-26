const AppDataSource = require("../config/database");
const Auction = require("../entities/Auction");
const { createAuditLog } = require("./audit.repository");
const Wallet = require("../entities/Wallet");
const LedgerEntry = require("../entities/LedgerEntry");
const User = require("../entities/User");
const Category = require("../entities/Category");

const findExpiredActiveAuctions = async () => {
  const auctionRepository = AppDataSource.getRepository(Auction);

  return await auctionRepository
    .createQueryBuilder("auction")
    .leftJoinAndSelect("auction.currentWinner", "currentWinner")
    .leftJoinAndSelect("auction.seller", "seller")
    .where("auction.status = :status", {
      status: "ACTIVE",
    })
    .andWhere("auction.endDate <= :now", {
      now: new Date(),
    })
    .getMany();
};

const findUpcomingAuctionsToActivate = async () => {
  const auctionRepository = AppDataSource.getRepository(Auction);
  const now = new Date();

  return auctionRepository
    .createQueryBuilder("auction")
    .where("auction.status = :status", { status: "UPCOMING" })
    .andWhere("auction.startDate <= :now", { now })
    .getMany();
};

const activateAuction = async (auctionId) => {
  return await AppDataSource.transaction(async (manager) => {
    const auctionRepository = manager.getRepository(Auction);

    const auction = await auctionRepository.findOne({
      where: {
        id: Number(auctionId),
      },
      relations: {
        seller: true,
      },
    });

    if (!auction) {
      const error = new Error("Subasta no encontrada");
      error.statusCode = 404;
      throw error;
    }

    if (auction.status !== "UPCOMING") {
      return auction;
    }

    const now = new Date();

    if (now < new Date(auction.startDate)) {
      return auction;
    }

    const expectedVersion = auction.version;

    if (now >= new Date(auction.endDate)) {
      const updateResult = await auctionRepository
        .createQueryBuilder()
        .update(Auction)
        .set({
          status: "DESERTED",
          version: () => "version + 1",
        })
        .where("id = :auctionId", {
          auctionId: auction.id,
        })
        .andWhere("version = :expectedVersion", {
          expectedVersion,
        })
        .andWhere("status = :status", {
          status: "UPCOMING",
        })
        .execute();

      if (updateResult.affected !== 1) {
        const error = new Error(
          "La subasta ya fue modificada por otro proceso"
        );
        error.statusCode = 409;
        throw error;
      }

      auction.status = "DESERTED";
      auction.version = expectedVersion + 1;

      await createAuditLog(manager, {
        eventType: "AUCTION_DESERTED",
        entityType: "AUCTION",
        entityId: auction.id,
        description:
          "La subasta venció antes de ser activada y pasó a estado DESERTED",
        metadata: {
          startDate: auction.startDate,
          endDate: auction.endDate,
        },
        user: auction.seller,
      });

      return auction;
    }

    const updateResult = await auctionRepository
      .createQueryBuilder()
      .update(Auction)
      .set({
        status: "ACTIVE",
        version: () => "version + 1",
      })
      .where("id = :auctionId", {
        auctionId: auction.id,
      })
      .andWhere("version = :expectedVersion", {
        expectedVersion,
      })
      .andWhere("status = :status", {
        status: "UPCOMING",
      })
      .execute();

    if (updateResult.affected !== 1) {
      const error = new Error(
        "La subasta ya fue modificada por otro proceso"
      );
      error.statusCode = 409;
      throw error;
    }

    auction.status = "ACTIVE";
    auction.version = expectedVersion + 1;

    await createAuditLog(manager, {
      eventType: "AUCTION_ACTIVATED",
      entityType: "AUCTION",
      entityId: auction.id,
      description: "La subasta comenzó y pasó a estado ACTIVE",
      metadata: {
        startDate: auction.startDate,
      },
      user: auction.seller,
    });

    return auction;
  });
};

const closeExpiredAuction = async (auctionId) => {
  return await AppDataSource.transaction(async (manager) => {
    const auctionRepository = manager.getRepository(Auction);

    const auction = await auctionRepository.findOne({
      where: {
        id: Number(auctionId),
      },
      relations: {
        currentWinner: true,
        seller: true,
      },
    });

    if (!auction) {
      const error = new Error("Subasta no encontrada");
      error.statusCode = 404;
      throw error;
    }
    const expectedVersion = auction.version;

    if (auction.status !== "ACTIVE") {
      return auction;
    }

    const now = new Date();

    if (now < new Date(auction.endDate)) {
      return auction;
    }

    if (!auction.currentWinner) {
      const updateResult = await auctionRepository
        .createQueryBuilder()
        .update(Auction)
        .set({
          status: "DESERTED",
          version: () => "version + 1",
        })
        .where("id = :auctionId", {
          auctionId: auction.id,
        })
        .andWhere("version = :expectedVersion", {
          expectedVersion,
        })
        .andWhere("status = :status", {
          status: "ACTIVE",
        })
        .execute();

      if (updateResult.affected !== 1) {
        const error = new Error(
          "La subasta ya fue modificada o cerrada por otro proceso",
        );
        error.statusCode = 409;
        throw error;
      }

      auction.status = "DESERTED";
      auction.version = expectedVersion + 1;

      const savedAuction = auction;

      await createAuditLog(manager, {
        eventType: "AUCTION_DESERTED",
        entityType: "AUCTION",
        entityId: auction.id,
        description: "Subasta finalizada sin ofertas",
        metadata: {
          endDate: auction.endDate,
        },
        user: auction.seller,
      });

      return savedAuction;
    }

    const walletRepository = manager.getRepository(Wallet);
    const ledgerRepository = manager.getRepository(LedgerEntry);

    const winningAmount = Number(auction.currentBid);

    const winnerWallet = await walletRepository.findOne({
      where: {
        user: {
          id: auction.currentWinner.id,
        },
      },
      relations: {
        user: true,
      },
    });

    if (!winnerWallet) {
      const error = new Error("Billetera del ganador no encontrada");
      error.statusCode = 500;
      throw error;
    }

    if (Number(winnerWallet.heldBalance) < winningAmount) {
      const error = new Error(
        "El saldo retenido del ganador no alcanza para liquidar la subasta",
      );
      error.statusCode = 409;
      throw error;
    }

    const sellerWallet = await walletRepository.findOne({
      where: {
        user: {
          id: auction.seller.id,
        },
      },
      relations: {
        user: true,
      },
    });

    if (!sellerWallet) {
      const error = new Error("Billetera del vendedor no encontrada");
      error.statusCode = 500;
      throw error;
    }

    const updateResult = await auctionRepository
      .createQueryBuilder()
      .update(Auction)
      .set({
        status: "FINALIZED",
        version: () => "version + 1",
      })
      .where("id = :auctionId", {
        auctionId: auction.id,
      })
      .andWhere("version = :expectedVersion", {
        expectedVersion,
      })
      .andWhere("status = :status", {
        status: "ACTIVE",
      })
      .execute();

    if (updateResult.affected !== 1) {
      const error = new Error(
        "La subasta ya fue modificada o cerrada por otro proceso",
      );
      error.statusCode = 409;
      throw error;
    }

    winnerWallet.totalBalance =
      Number(winnerWallet.totalBalance) - winningAmount;

    winnerWallet.heldBalance = Number(winnerWallet.heldBalance) - winningAmount;

    await walletRepository.save(winnerWallet);

    const commissionRate = Number(process.env.AUCTION_COMMISSION_RATE || 0);

    const commission = winningAmount * commissionRate;
    const sellerCredit = winningAmount - commission;

    sellerWallet.totalBalance =
      Number(sellerWallet.totalBalance) + sellerCredit;

    await walletRepository.save(sellerWallet);

    const debitEntry = ledgerRepository.create({
      wallet: winnerWallet,
      type: "FINAL_DEBIT",
      amount: winningAmount,
      balanceAfter:
        Number(winnerWallet.totalBalance) - Number(winnerWallet.heldBalance),
      relatedAuction: auction,
    });

    await ledgerRepository.save(debitEntry);

    const creditEntry = ledgerRepository.create({
      wallet: sellerWallet,
      type: "SALE_CREDIT",
      amount: sellerCredit,
      balanceAfter:
        Number(sellerWallet.totalBalance) - Number(sellerWallet.heldBalance),
      relatedAuction: auction,
    });

    await ledgerRepository.save(creditEntry);

    auction.status = "FINALIZED";
    auction.version = expectedVersion + 1;

    const savedAuction = auction;

    await createAuditLog(manager, {
      eventType: "AUCTION_FINALIZED",
      entityType: "AUCTION",
      entityId: auction.id,
      description: "Subasta finalizada con ganador",
      metadata: {
        winnerId: auction.currentWinner.id,
        sellerId: auction.seller.id,
        winningAmount,
        commission,
        sellerCredit,
      },
      user: auction.currentWinner,
    });

    return savedAuction;
  });
};

const findSellerById = async (sellerId) => {
  const userRepository = AppDataSource.getRepository(User);

  return await userRepository.findOne({
    where: {
      id: Number(sellerId),
    },
  });
};

const findCategoryById = async (categoryId) => {
  const categoryRepository = AppDataSource.getRepository(Category);

  return await categoryRepository.findOne({
    where: {
      id: Number(categoryId),
    },
  });
};

const createAuction = async ({
  seller,
  category,
  title,
  description,
  imageUrl,
  basePrice,
  minimumIncrement,
  startDate,
  endDate,
  status,
}) => {
  const auctionRepository = AppDataSource.getRepository(Auction);

  const auction = auctionRepository.create({
    seller,
    category,
    title,
    description,
    imageUrl,
    basePrice,
    minimumIncrement,
    startDate,
    endDate,
    status,
  });

  return await auctionRepository.save(auction);
};

module.exports = {
  findExpiredActiveAuctions,
  closeExpiredAuction,
  findSellerById,
  findCategoryById,
  createAuction,
  findUpcomingAuctionsToActivate,
  activateAuction,
};

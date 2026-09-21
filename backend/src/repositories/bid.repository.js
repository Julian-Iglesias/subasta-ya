const Auction = require("../entities/Auction");
const User = require("../entities/User");
const AppDataSource = require("../config/database");
const Wallet = require("../entities/Wallet");
const LedgerEntry = require("../entities/LedgerEntry");
const Bid = require("../entities/Bid");
const {createAuditLog} = require('./audit.repository')
const AuditLog = require("../entities/AuditLog");
const { getAuctionById } = require("../services/auction.service");
const { getIO } = require("../socket");

const findAuctionById = async (auctionId) => {
  const auctionRepository = AppDataSource.getRepository(Auction);
  return await auctionRepository.findOne({
    where: { id: Number(auctionId) },
    relations: { seller: true, currentWinner: true },
  });
};

const findUserById = async (userId) => {
  const userRepository = AppDataSource.getRepository(User);
  return await userRepository.findOne({ where: { id: Number(userId) } });
};

const findWalletByUserId = async (userId) => {
  const walletRepository = AppDataSource.getRepository(Wallet);
  return await walletRepository.findOne({
    where: { user: { id: Number(userId) } },
    relations: { user: true },
  });
};

const createBidWithEscrow = async ({ auctionId, userId, amount }) => {
  const result = await AppDataSource.transaction(async (manager) => {
    const auctionRepository = manager.getRepository(Auction);
    const walletRepository = manager.getRepository(Wallet);
    const bidRepository = manager.getRepository(Bid);
    const ledgerRepository = manager.getRepository(LedgerEntry);
    const auditRepository = manager.getRepository(AuditLog);

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

    const now = new Date();

    if (auction.status !== "ACTIVE") {
      const error = new Error("La subasta no está activa");
      error.statusCode = 409;
      throw error;
    }

    if (now < new Date(auction.startDate)) {
      const error = new Error("La subasta todavía no comenzó");
      error.statusCode = 409;
      throw error;
    }

    if (now >= new Date(auction.endDate)) {
      const error = new Error("La subasta ya finalizó");
      error.statusCode = 409;
      throw error;
    }

    if (auction.seller.id === Number(userId)) {
      const error = new Error(
        "El vendedor no puede pujar en su propia subasta",
      );
      error.statusCode = 400;
      throw error;
    }


    const millisecondsRemaining =
      new Date(auction.endDate).getTime() - now.getTime();
    const oldEndDate = new Date(auction.endDate)
    let newEndDate = new Date(auction.endDate);
    let wasExtended = false;

    if (millisecondsRemaining > 0 && millisecondsRemaining <= 60000) {
      newEndDate = new Date(
        new Date(auction.endDate).getTime() + 2 * 60 * 1000,
      );

      wasExtended = true;
    }


    const wallet = await walletRepository.findOne({
      where: {
        user: {
          id: Number(userId),
        },
      },
      relations: {
        user: true,
      },
    });

    if (!wallet) {
      const error = new Error("Billetera no encontrada");
      error.statusCode = 404;
      throw error;
    }

    const previousBid = auction.currentBid ? Number(auction.currentBid) : 0;
    const minimumBid = auction.currentBid
      ? Number(auction.currentBid) + Number(auction.minimumIncrement)
      : Number(auction.basePrice);

    if (Number(amount) < minimumBid) {
      const error = new Error(`La puja mínima permitida es ${minimumBid}`);
      error.statusCode = 409;
      throw error;
    }

    const isCurrentWinner = auction.currentWinner?.id === Number(userId);

    let amountToHold;

    if (isCurrentWinner) {
      amountToHold = Number(amount) - previousBid;
    } else {
      amountToHold = Number(amount);
    }

    const availableBalance =
      Number(wallet.totalBalance) - Number(wallet.heldBalance);

    if (availableBalance < amountToHold) {
      const error = new Error("Saldo insuficiente");
      error.statusCode = 422;
      throw error;
    }

    if (auction.currentWinner && auction.currentWinner.id !== Number(userId)) {
      const previousWinnerWallet = await walletRepository.findOne({
        where: {
          user: {
            id: auction.currentWinner.id,
          },
        },
        relations: {
          user: true,
        },
      });

      if (!previousWinnerWallet) {
        const error = new Error("Billetera del ganador anterior no encontrada");
        error.statusCode = 500;
        throw error;
      }

      previousWinnerWallet.heldBalance =
        Number(previousWinnerWallet.heldBalance) - previousBid;

      await walletRepository.save(previousWinnerWallet);

      const releaseEntry = ledgerRepository.create({
        wallet: previousWinnerWallet,
        type: "RELEASE",
        amount: previousBid,
        balanceAfter:
          Number(previousWinnerWallet.totalBalance) -
          Number(previousWinnerWallet.heldBalance),
        relatedAuction: auction,
      });

      await ledgerRepository.save(releaseEntry);
    }

    wallet.heldBalance = Number(wallet.heldBalance) + amountToHold;

    await walletRepository.save(wallet);

    const newBid = bidRepository.create({
      auction: auction,
      bidder: wallet.user,
      amount: Number(amount),
    });

    const savedBid = await bidRepository.save(newBid);

    const updateResult = await auctionRepository
      .createQueryBuilder()
      .update(Auction)
      .set({
        currentBid: Number(amount),
        currentWinner: wallet.user,
        version: () => "version + 1", endDate:newEndDate
      })
      .where("id = :auctionId", {
        auctionId: Number(auctionId),
      })
      .andWhere("version = :expectedVersion", {
        expectedVersion,
      })
      .execute();

    if (updateResult.affected !== 1) {
      try {
        await AppDataSource.getRepository(AuditLog).save(
          AppDataSource.getRepository(AuditLog).create({
            eventType: "BID_REJECTED_CONCURRENCY",
            entityType: "Auction",
            entityId: Number(auctionId),
            user: wallet.user,
            description: "La puja fue rechazada por un conflicto de versión concurrente.",
            metadata: {
              auctionId: Number(auctionId),
              amount: Number(amount),
              expectedVersion,
            },
          }),
        );
      } catch (auditError) {
        console.error("No se pudo registrar la auditoría de concurrencia", auditError);
      }

      const error = new Error("La subasta fue modificada por otra puja");
      error.statusCode = 409;
      throw error;
    }
    if (wasExtended) {
      await createAuditLog(manager, {
        eventType: "ANTI_SNIPING_EXTENDED",
        entityType: "AUCTION",
        entityId: Number(auctionId),
        description: "Subasta extendida por una puja en el último minuto",
        metadata: {
          oldEndDate: oldEndDate.toISOString(),
          newEndDate: newEndDate.toISOString(),
          bidAmount: Number(amount),
        },
        user: wallet.user,
      });
    }

    const holdEntry = ledgerRepository.create({
      wallet: wallet,
      type: "HOLD",
      amount: amountToHold,
      balanceAfter: Number(wallet.totalBalance) - Number(wallet.heldBalance),
      relatedAuction: auction,
      relatedBid: savedBid,
    });

    await ledgerRepository.save(holdEntry);

    await auditRepository.save(
      auditRepository.create({
        eventType: "BID_PLACED",
        entityType: "Auction",
        entityId: auction.id,
        user: wallet.user,
        description: `Puja aceptada por ${Number(amount)}${auction.currentWinner ? " y superó al postor anterior" : ""}.`,
        metadata: {
          amount: Number(amount),
          previousBid,
        },
      }),
    );

    if (wasExtended) {
      await auditRepository.save(
        auditRepository.create({
          eventType: "ANTI_SNIPING_EXTENSION",
          entityType: "Auction",
          entityId: auction.id,
          user: wallet.user,
          description: "La fecha de cierre se extendió 2 minutos por Anti-Sniping.",
          metadata: {
            previousEndDate: auction.endDate,
            newEndDate,
          },
        }),
      );
    }

    return { savedBid, wasExtended };
  });

  const auction = await getAuctionById(auctionId);
  const io = getIO();

  if (io) {
    io.to(`auction-${auctionId}`).emit("auction-updated", {
      ...auction,
      wasExtended: result.wasExtended,
    });
  }

  return result.savedBid;
};

module.exports = {
  findWalletByUserId,
  findUserById,
  findAuctionById,
  createBidWithEscrow,
};

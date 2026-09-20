const { LessThan } = require('typeorm')
const AppDataSource = require('../config/database')
const Auction = require('../entities/Auction')
const Wallet = require('../entities/Wallet')
const LedgerEntry = require('../entities/LedgerEntry')
const AuditLog = require('../entities/AuditLog')

const closeExpiredAuctions = async () => {
    const auctionRepository = AppDataSource.getRepository(Auction)
    const expiredAuctions = await auctionRepository.find({
        where: {
            status: 'ACTIVE',
            endDate: LessThan(new Date())
        },
        relations: {
            currentWinner: true,
            seller: true
        }
    })

    for (const expiredAuction of expiredAuctions) {
        try {
            await AppDataSource.transaction(async (manager) => {
                const transactionAuctionRepository = manager.getRepository(Auction)
                const walletRepository = manager.getRepository(Wallet)
                const ledgerRepository = manager.getRepository(LedgerEntry)
                const auditRepository = manager.getRepository(AuditLog)
                const auction = await transactionAuctionRepository.findOne({
                    where: {
                        id: expiredAuction.id,
                        status: 'ACTIVE',
                        endDate: LessThan(new Date())
                    },
                    relations: {
                        currentWinner: true,
                        seller: true
                    }
                })

                if (!auction) return

                if (auction.currentWinner && auction.currentBid !== null) {
                    const settlementAmount = Number(auction.currentBid)
                    const buyerWallet = await walletRepository.findOne({
                        where: { user: { id: auction.currentWinner.id } },
                        relations: { user: true }
                    })
                    const sellerWallet = await walletRepository.findOne({
                        where: { user: { id: auction.seller.id } },
                        relations: { user: true }
                    })

                    if (!buyerWallet || !sellerWallet) {
                        throw new Error(`No se encontraron las billeteras de la subasta ${auction.id}`)
                    }

                    buyerWallet.totalBalance = Number(buyerWallet.totalBalance) - settlementAmount
                    buyerWallet.heldBalance = Number(buyerWallet.heldBalance) - settlementAmount
                    sellerWallet.totalBalance = Number(sellerWallet.totalBalance) + settlementAmount

                    await walletRepository.save(buyerWallet)
                    await walletRepository.save(sellerWallet)

                    await ledgerRepository.save(ledgerRepository.create({
                        wallet: buyerWallet,
                        type: 'SETTLEMENT',
                        amount: -settlementAmount,
                        balanceAfter: Number(buyerWallet.totalBalance),
                        relatedAuction: auction
                    }))
                    await ledgerRepository.save(ledgerRepository.create({
                        wallet: sellerWallet,
                        type: 'SETTLEMENT',
                        amount: settlementAmount,
                        balanceAfter: Number(sellerWallet.totalBalance),
                        relatedAuction: auction
                    }))

                    auction.status = 'FINALIZADA'
                    await transactionAuctionRepository.save(auction)

                    await auditRepository.save(auditRepository.create({
                        eventType: 'AUCTION_STATUS_CHANGE',
                        entityType: 'Auction',
                        entityId: auction.id,
                        user: auction.currentWinner,
                        description: 'La subasta pasó de ACTIVE a FINALIZADA y fue liquidada.',
                        metadata: {
                            previousStatus: 'ACTIVE',
                            newStatus: 'FINALIZADA',
                            amount: settlementAmount,
                            winnerId: auction.currentWinner.id
                        }
                    }))
                } else {
                    auction.status = 'DESIERTA'
                    await transactionAuctionRepository.save(auction)

                    await auditRepository.save(auditRepository.create({
                        eventType: 'AUCTION_STATUS_CHANGE',
                        entityType: 'Auction',
                        entityId: auction.id,
                        user: null,
                        description: 'La subasta pasó de ACTIVE a DESIERTA porque no recibió pujas.',
                        metadata: {
                            previousStatus: 'ACTIVE',
                            newStatus: 'DESIERTA'
                        }
                    }))
                }
            })
        } catch (error) {
            console.error(`No se pudo cerrar la subasta ${expiredAuction.id}`, error)
        }
    }
}

module.exports = { closeExpiredAuctions }

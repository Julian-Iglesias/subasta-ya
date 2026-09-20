const AppDataSource=require('../config/database')
const Wallet = require('../entities/Wallet')
const LedgerEntry=require('../entities/LedgerEntry')
const {createAuditLog} = require('./audit.repository')

const findWalletByUserId=async(userId)=>{
    const walletRepository=AppDataSource.getRepository(Wallet)
    return await walletRepository.findOne({where:{user:{id:Number(userId)}},relations:{user:true}})
}

const depositToWallet=async(userId,amount)=>{
    return await AppDataSource.transaction(async(manager)=>{
        const walletRepository=manager.getRepository(Wallet)
        const ledgerRepository=manager.getRepository(LedgerEntry)
        const wallet=await walletRepository.findOne({where:{user:{id:Number(userId)}},relations:{user:true}})
        if(!wallet){return null}
        wallet.totalBalance=Number(wallet.totalBalance)+Number(amount)
        const savedWallet=await walletRepository.save(wallet)
        const ledgerEntry=ledgerRepository.create({wallet:savedWallet,type:'DEPOSIT',amount: Number(amount),balanceAfter:Number(savedWallet.totalBalance)})
        await ledgerRepository.save(ledgerEntry)

        await createAuditLog(manager, {eventType: 'WALLET_DEPOSIT',entityType: 'WALLET',entityId: savedWallet.id,description: 'Carga manual de saldo en billetera',metadata: {amount: Number(amount),newBalance: Number(savedWallet.totalBalance)},user: savedWallet.user})
        
        return savedWallet
    })
}



const findLedgerByUserId=async(userId)=>{const ledgerRepository=AppDataSource.getRepository(LedgerEntry)
    return await ledgerRepository.find({where:{wallet:{user:{id:Number(userId)}}},relations:{wallet:{user:true},relatedAuction:true,relatedBid:true},order:{createdAt:'DESC'}})
}


module.exports={findWalletByUserId,depositToWallet,findLedgerByUserId}

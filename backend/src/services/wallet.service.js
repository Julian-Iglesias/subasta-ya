const {findWalletByUserId,depositToWallet,findLedgerByUserId}=require('../repositories/wallet.repository')

const getWalletBalance=async(userId)=>{
    const wallet=await findWalletByUserId(userId)
    if(!wallet){
        const error = new Error('Billetera no encontrada')
        error.statusCode=404
        throw error
    }
    const totalBalance=Number(wallet.totalBalance)
    const heldBalance=Number(wallet.heldBalance)
    const availableBalance=totalBalance-heldBalance
    return{totalBalance,heldBalance,availableBalance}
}


const depositBalance=async(userId,amount)=>{
    const numericAmount=Number(amount)
    if(!numericAmount||numericAmount<=0){
        const error=new Error('El monto debe ser mayor a 0')
        error.statusCode=400
        throw error
    }
    const wallet=await depositToWallet(userId,numericAmount)
    if(!wallet){
        const error=new Error('Billetera no encontrada')
        error.statusCode=404
        throw error
    }
    const totalBalance=Number(wallet.totalBalance)
    const heldBalance=Number(wallet.heldBalance)
    return{
        message:'Saldo acreditado correctamente', totalBalance,heldBalance,availableBalance:totalBalance-heldBalance
    }
}


const getWalletTransactions=async(userId)=>{
    const wallet= await findWalletByUserId(userId)
    if(!wallet){
        const error=new Error('Billetera no encontrada')
        error.statusCode=404
        throw error
    }
    const movement=await findLedgerByUserId(userId)
    return movement.map((movement)=>({
        id:movement.id,type:movement.type,amount:Number(movement.amount),balanceAfter:Number(movement.balanceAfter),createdAt:movement.createdAt, auctionId:movement.relatedAuction?.id||null,bidId:movement.relatedBid?.id||null
    }))
}

module.exports={getWalletBalance,depositBalance,getWalletTransactions}



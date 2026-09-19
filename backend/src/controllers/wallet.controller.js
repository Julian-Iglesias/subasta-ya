const{getWalletBalance,depositBalance,getWalletTransactions}=require('../services/wallet.service')
const getWallet=async(req,res)=>{
    try{
        const{userId}=req.params
        const wallet=await getWalletBalance(userId)
        return res.status(200).json(wallet)
    }catch(error){return res.status(error.statusCode||500).json({message:error.message||'No se pudo obtener la billetera'})}
}


const deposit=async(req,res)=>{
    try{
        const{userId}=req.params
        const{amount}=req.body
        const result = await depositBalance(userId,amount)
        return res.status(200).json(result)
    }catch(error){return res.status(error.statusCode||500).json({message:error.message||'No se pudo acreditar el saldo'})}
}



const getTransactions=async(req,res)=>{
    try{
        const {userId}=req.params
        const transactions = await getWalletTransactions(userId)
        return res.status(200).json(transactions)
    } catch(error){
        return res.status(error.statusCode||500).json({message: error.message||'No se pudo obtener el historial de movimiento'})
    }
}


module.exports={getWallet,deposit,getTransactions}
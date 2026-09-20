const {findAuctionById,findUserById,findWalletByUserId,createBidWithEscrow}=require('../repositories/bid.repository')

const validateBid=async ({auctionId,userId,amount})=>{
    const auction =await findAuctionById(auctionId)
    if(!auction){
        const error=new Error('Subasta no encontrada') 
        error.statusCode=404 
        throw error
    }
    const user=await findUserById(userId)
    if(!user){
        const error = new Error('Usuario no encontrado')
        error.statusCode=404
        throw error
    }
    const now =new Date()
    if(auction.status!=='ACTIVE'){
        const error = new Error('La subasta no está activa')
        error.statusCode=409
        throw error
    }
    if(now<new Date(auction.startDate)){
        const error=new Error('La subasta todavía no comenzó')
        error.statusCode=409
        throw error
    }
    if(now >=new Date(auction.endDate)){
        const error = new Error('La subasta ya finalizo')
        error.statusCode=409
        throw error
    }
    if(auction.seller.id===Number(userId)){
        const error= new Error('El vendedor no puede pujar en su propia subasta')
        error.statusCode=400
        throw error
    }
    const numericAmount=Number(amount)
    if(!numericAmount||numericAmount<=0){
        const error= new Error('El monto de la puja debe ser mayor a 0')
        error.statusCode=400
        throw error
    }
    const currentBid=auction.currentBid? Number(auction.currentBid):null
    const basePrice=Number(auction.basePrice)
    const minimumIncrement= Number(auction.minimumIncrement)
    const minimumBid=currentBid!==null?currentBid+minimumIncrement:basePrice

    if(numericAmount<minimumBid){
        const error=new Error(
            `La puja minima permitida es ${minimumBid}`
        )
        error.statusCode=400
        throw error
    }
    
    const wallet=await findWalletByUserId(userId)
    if(!wallet){
        const error=new Error('Billetera no encontrada')
        error.statusCode=404
        throw error
    }

    const totalBalance=Number(wallet.totalBalance)
    const heldBalance=Number(wallet.heldBalance)
    const availableBalance= totalBalance-heldBalance

    const isCurrentWinner=auction.currentWinner?.id===Number(userId)
    const requiredBalance=isCurrentWinner?numericAmount-Number(auction.currentBid):numericAmount

    if (availableBalance<requiredBalance) {
    const error = new Error('Saldo insuficiente')
    error.statusCode = 422
    throw error
    }

    return{auction,user,wallet,amount:numericAmount}
}


const placeBid = async ({ auctionId, userId, amount }) => {

    const validation = await validateBid({
        auctionId,
        userId,
        amount
    })

    const savedBid = await createBidWithEscrow({
        auctionId,
        userId,
        amount: validation.amount
    })

    return {
        message: 'Puja realizada correctamente',
        bid: {
            id: savedBid.id,
            amount: Number(savedBid.amount),
            createdAt: savedBid.createdAt
        }
    }
}

module.exports={validateBid, placeBid}
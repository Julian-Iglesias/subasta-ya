const bcrypt =require('bcryptjs')
const{createUserWhitWallet, findUserByEmail, createUserWithWallet}=require('../repositories/users.repository')
const AppDataSource = require('../config/database')
const Auction = require('../entities/Auction')
const Bid = require('../entities/Bid')

const registerUser=async({name,email,password})=>{
    if(!name||!email||!password){
        const error = new Error('name, email y password son obligatorios')
        error.statusCode=400
        throw error
    }
    const existingUser=await findUserByEmail(email)
    if(existingUser){
        const error = new Error('El email ya esta registrado')
        error.statusCode=409
        throw error
    }
    const passwordHash = await bcrypt.hash(password,10)
    const user = await createUserWithWallet({name,email,password:passwordHash})

    return{id:user.id,name:user.name,email:user.email}

}

const getUserAuctions = async (userId) => {
    const auctions = await AppDataSource.getRepository(Auction).find({
        where: { seller: { id: Number(userId) } },
        relations: { category: true },
        order: { endDate: 'ASC' }
    })
    const bidRepository = AppDataSource.getRepository(Bid)

    return Promise.all(auctions.map(async (auction) => ({
        id: auction.id,
        title: auction.title,
        status: auction.status,
        currentBid: auction.currentBid === null ? null : Number(auction.currentBid),
        bidCount: await bidRepository.count({ where: { auction: { id: auction.id } } }),
        category: auction.category ? { id: auction.category.id, name: auction.category.name } : null
    })))
}

const getUserBids = async (userId) => {
    const bids = await AppDataSource.getRepository(Bid).find({
        where: { bidder: { id: Number(userId) } },
        relations: { auction: { currentWinner: true } },
        order: { createdAt: 'DESC' }
    })

    return bids.map((bid) => ({
        id: bid.id,
        amount: Number(bid.amount),
        createdAt: bid.createdAt,
        status: bid.auction.status === 'FINALIZED' && bid.auction.currentWinner?.id === Number(userId)
            ? 'WON'
            : bid.auction.currentWinner?.id === Number(userId) ? 'LEADING' : 'OUTBID',
        auction: {
            id: bid.auction.id,
            title: bid.auction.title,
            status: bid.auction.status,
            currentBid: bid.auction.currentBid === null ? null : Number(bid.auction.currentBid)
        }
    }))
}

module.exports={registerUser, getUserAuctions, getUserBids}
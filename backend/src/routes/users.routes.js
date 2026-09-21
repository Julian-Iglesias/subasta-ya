const express=require('express')
const{createUser, getAuctionsByUser, getBidsByUser}=require('../controllers/users.controller')

const router=express.Router()
router.post('/',createUser)
router.get('/:userId/auctions', getAuctionsByUser)
router.get('/:userId/bids', getBidsByUser)
module.exports=router
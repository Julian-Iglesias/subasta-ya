const express = require('express')
const {
    createUser,
    getAuctionsByUser,
    getBidsByUser
} = require('../controllers/users.controller')

const { authMiddleware } = require('../middlewares/auth.middleware')

const router = express.Router()

router.post('/', createUser)

router.get('/me/auctions', authMiddleware, getAuctionsByUser)
router.get('/me/bids', authMiddleware, getBidsByUser)

module.exports = router
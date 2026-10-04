const express = require('express')
const { createBid } = require('../controllers/bid.controller')
const { authMiddleware } = require('../middlewares/auth.middleware')

const router = express.Router()

router.post('/:auctionId/bids', authMiddleware, createBid)

module.exports = router
const express = require('express')
const { createBid } = require('../controllers/bid.controller')

const router = express.Router()

router.post('/:auctionId/bids', createBid)

module.exports = router
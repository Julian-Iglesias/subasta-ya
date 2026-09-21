const express = require('express')
const { createAuction, getAuctions, getAuctionById } = require('../controllers/auction.controller')

const router = express.Router()

router.get('/', getAuctions)
router.get('/:id', getAuctionById)
router.post('/', createAuction)

module.exports = router
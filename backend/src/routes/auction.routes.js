const express = require('express')
const {
    createAuction,
    getAuctions,
    getAuctionById
} = require('../controllers/auction.controller')

const { authMiddleware } = require('../middlewares/auth.middleware')

const router = express.Router()

router.get('/', getAuctions)
router.get('/:id', getAuctionById)
router.post('/', authMiddleware, createAuction)

module.exports = router
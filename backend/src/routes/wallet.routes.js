const express = require('express')
const {
    getWallet,
    deposit,
    getTransactions
} = require('../controllers/wallet.controller.js')

const { authMiddleware } = require('../middlewares/auth.middleware')

const router = express.Router()

router.get('/', authMiddleware, getWallet)
router.post('/deposits', authMiddleware, deposit)
router.get('/transactions', authMiddleware, getTransactions)

module.exports = router
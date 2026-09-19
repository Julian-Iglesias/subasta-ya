const express = require('express')
const {getWallet,deposit,getTransactions}=require('../controllers/wallet.controller.js')

const router=express.Router()
router.get('/:userId',getWallet)
router.post('/:userId/deposits',deposit)
router.get('/:userId/transactions',getTransactions)

module.exports=router
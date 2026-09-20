const express = require('express')
const { createAuction, getAuctions } = require('../controllers/auction.controller')

const router = express.Router()

router.get('/', getAuctions)
router.post('/', createAuction)

module.exports = router
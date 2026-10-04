const express = require('express')
const { login } = require('../controllers/auth.controller')
const { authMiddleware } = require('../middlewares/auth.middleware')

const router = express.Router()

router.post('/login', login)

router.get('/me', authMiddleware, (req, res) => {
  return res.status(200).json({
    user: req.user
  })
})

module.exports = router
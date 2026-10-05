const express = require('express')
const {
    getWallet,
    deposit,
    getTransactions
} = require('../controllers/wallet.controller.js')

const { authMiddleware } = require('../middlewares/auth.middleware')

const router = express.Router()


/**
 * @openapi
 * /api/wallets:
 *   get:
 *     summary: Obtener la billetera del usuario autenticado
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billetera obtenida correctamente
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Billetera no encontrada
 */
router.get('/', authMiddleware, getWallet)

/**
 * @openapi
 * /api/wallets/deposits:
 *   post:
 *     summary: Depositar saldo en la billetera
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 50000
 *     responses:
 *       200:
 *         description: Depósito realizado correctamente
 *       400:
 *         description: Monto inválido
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.post('/deposits', authMiddleware, deposit)


/**
 * @openapi
 * /api/wallets/transactions:
 *   get:
 *     summary: Obtener movimientos de la billetera
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Movimientos obtenidos correctamente
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get('/transactions', authMiddleware, getTransactions)

module.exports = router
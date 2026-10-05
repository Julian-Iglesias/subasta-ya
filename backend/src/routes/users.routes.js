const express = require('express')
const {
    createUser,
    getAuctionsByUser,
    getBidsByUser
} = require('../controllers/users.controller')

const { authMiddleware } = require('../middlewares/auth.middleware')

const router = express.Router()

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Registrar un usuario
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan Perez
 *               email:
 *                 type: string
 *                 example: juan@subastaya.com
 *               password:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', createUser)


/**
 * @openapi
 * /api/users/me/auctions:
 *   get:
 *     summary: Obtener las subastas del usuario autenticado
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subastas del usuario obtenidas correctamente
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get('/me/auctions', authMiddleware, getAuctionsByUser)


/**
 * @openapi
 * /api/users/me/bids:
 *   get:
 *     summary: Obtener las pujas del usuario autenticado
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pujas del usuario obtenidas correctamente
 *       401:
 *         description: Token inválido o no proporcionado
 */
router.get('/me/bids', authMiddleware, getBidsByUser)

module.exports = router
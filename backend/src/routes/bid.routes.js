const express = require('express')
const { createBid } = require('../controllers/bid.controller')
const { authMiddleware } = require('../middlewares/auth.middleware')

const router = express.Router()

/**
 * @openapi
 * /api/auctions/{auctionId}/bids:
 *   post:
 *     summary: Realizar una puja
 *     tags:
 *       - Bids
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la subasta
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
 *                 example: 105000
 *     responses:
 *       201:
 *         description: Puja realizada correctamente
 *       400:
 *         description: Puja inválida
 *       401:
 *         description: Token inválido o no proporcionado
 *       404:
 *         description: Subasta o usuario no encontrado
 *       409:
 *         description: Conflicto de concurrencia
 */
router.post('/:auctionId/bids', authMiddleware, createBid)

module.exports = router
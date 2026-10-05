const express = require('express')
const {
    createAuction,
    getAuctions,
    getAuctionById
} = require('../controllers/auction.controller')

const { authMiddleware } = require('../middlewares/auth.middleware')

const router = express.Router()


/**
 * @openapi
 * /api/auctions:
 *   get:
 *     summary: Listar subastas
 *     tags:
 *       - Auctions
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Filtrar por categoría
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Precio máximo
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [time_asc, bid_desc]
 *         description: Orden de resultados
 *     responses:
 *       200:
 *         description: Lista de subastas
 *       400:
 *         description: Filtros inválidos
 */
router.get('/', getAuctions)


/**
 * @openapi
 * /api/auctions/{id}:
 *   get:
 *     summary: Obtener una subasta por ID
 *     tags:
 *       - Auctions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subasta encontrada
 *       404:
 *         description: Subasta no encontrada
 */

router.get('/:id', getAuctionById)


/**
 * @openapi
 * /api/auctions:
 *   post:
 *     summary: Crear una subasta
 *     tags:
 *       - Auctions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - categoryId
 *               - basePrice
 *               - minimumIncrement
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: PlayStation 5
 *               description:
 *                 type: string
 *                 example: Consola en excelente estado
 *               imageUrl:
 *                 type: string
 *                 example: https://ejemplo.com/ps5.jpg
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *               basePrice:
 *                 type: number
 *                 example: 100000
 *               minimumIncrement:
 *                 type: number
 *                 example: 5000
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-10-04T22:00:00
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-10-05T22:00:00
 *     responses:
 *       201:
 *         description: Subasta creada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token inválido o no proporcionado
 */


router.post('/', authMiddleware, createAuction)

module.exports = router
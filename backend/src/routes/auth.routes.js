const express = require('express')
const { login } = require('../controllers/auth.controller')
const { authMiddleware } = require('../middlewares/auth.middleware')

const router = express.Router()

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: julian@subastaya.com
 *               password:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       200:
 *         description: Login correcto
 *       400:
 *         description: Faltan datos
 *       401:
 *         description: Email o contraseña incorrectos
 */


router.post('/login', login)


/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Obtener usuario autenticado
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado correctamente
 *       401:
 *         description: Token inválido o no proporcionado
 */

router.get('/me', authMiddleware, (req, res) => {
  return res.status(200).json({
    user: req.user
  })
})

module.exports = router
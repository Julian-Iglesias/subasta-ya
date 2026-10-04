const bcrypt = require('bcryptjs')
const { findUserByEmail } = require('../repositories/users.repository')
const jwt = require('jsonwebtoken')

const loginUser = async ({ email, password }) => {
    if (!email || !password) {
        const error = new Error('El email y password son obligatorios')
        error.statusCode = 400
        throw error
    }

    const user = await findUserByEmail(email)

    if (!user || !(await bcrypt.compare(password, user.password))) {
        const error = new Error('Email o password incorrectos')
        error.statusCode = 401
        throw error
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        }
    )

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        },
        token
    }
}
module.exports = { loginUser }
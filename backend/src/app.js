const express = require('express')
const path = require('path')
const bcrypt = require('bcryptjs')
const pool = require('./config/database')

const app = express()

app.use(express.json())
app.use(express.static(path.join(__dirname, '../../frontend')))

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204)
    }

    next()
})

app.post('/api/users', async (req, res) => {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'name, email y password son obligatorios' })
    }

    let connection

    try {
        connection = await pool.getConnection()
        await connection.beginTransaction()
        const passwordHash = await bcrypt.hash(password, 10)
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, passwordHash]
        )

        await connection.execute(
            'INSERT INTO wallets (user_id) VALUES (?)',
            [result.insertId]
        )

        await connection.commit()

        return res.status(201).json({
            id: result.insertId,
            name,
            email
        })
    } catch (error) {
        if (connection) {
            await connection.rollback()
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El email ya está registrado' })
        }

        return res.status(500).json({ message: 'No se pudo crear el usuario' })
    } finally {
        if (connection) {
            connection.release()
        }
    }
})

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: 'email y password son obligatorios' })
    }

    try {
        const [users] = await pool.execute(
            'SELECT id, name, email, password FROM users WHERE email = ?',
            [email]
        )

        if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
            return res.status(401).json({ message: 'Email o password incorrectos' })
        }

        return res.status(200).json({
            message: 'Login correcto',
            user: {
                id: users[0].id,
                name: users[0].name,
                email: users[0].email
            }
        })
    } catch (error) {
        return res.status(500).json({ message: 'No se pudo iniciar sesión' })
    }
})

app.get('/api/healt',(req,res)=>{
    res.status(200).json({
        status:'ok',
        message: 'SubastaYa api funcionando'
    })
})

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'SubastaYa api funcionando'
    })
})

module.exports=app
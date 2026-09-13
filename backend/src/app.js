const express = require('express')
const path = require('path')
const bcrypt = require('bcryptjs')
const AppDataSource = require('./config/database')
const User = require('./entities/User')
const Wallet = require('./entities/Wallet')

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

    try {
        const passwordHash = await bcrypt.hash(password, 10)
        const user = await AppDataSource.transaction(async (transactionalEntityManager) => {
            const userRepository = transactionalEntityManager.getRepository(User)
            const walletRepository = transactionalEntityManager.getRepository(Wallet)

            const newUser = userRepository.create({
                name,
                email,
                password: passwordHash
            })
            const savedUser = await userRepository.save(newUser)

            const wallet = walletRepository.create({ user: savedUser })
            await walletRepository.save(wallet)

            return savedUser
        })

        return res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email
        })
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El email ya está registrado' })
        }

        return res.status(500).json({ message: 'No se pudo crear el usuario' })
    }
})




app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: 'email y password son obligatorios' })
    }

    try {
        const userRepository = AppDataSource.getRepository(User)
        const user = await userRepository.findOneBy({ email })

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Email o password incorrectos' })
        }

        return res.status(200).json({
            message: 'Login correcto',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
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

module.exports=app
const express = require('express')
const path = require('path')
const bcrypt = require('bcryptjs')
const AppDataSource = require('./config/database')
const User = require('./entities/User')
const usersRoutes=require('./routes/users.routes')

const app = express()

app.use(express.json())
app.use(express.static(path.join(__dirname, '../../frontend')))

app.use('/api/users',usersRoutes)

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204)
    }

    next()
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




app.get('/api/health',(req,res)=>{
    res.status(200).json({
        status:'ok',
        message: 'SubastaYa api funcionando'
    })
})

module.exports=app
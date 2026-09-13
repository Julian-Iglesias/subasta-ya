const express = require('express')
const path = require('path')
const bcrypt = require('bcryptjs')
const AppDataSource = require('./config/database')
const User = require('./entities/User')
const usersRoutes=require('./routes/users.routes')
const authRoutes=require('./routes/auth.routes')

const app = express()

app.use(express.json())
app.use(express.static(path.join(__dirname, '../../frontend')))

app.use('/api/users',usersRoutes)
app.use('/api/auth',authRoutes) 

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204)
    }

    next()
})









app.get('/api/health',(req,res)=>{
    res.status(200).json({
        status:'ok',
        message: 'SubastaYa api funcionando'
    })
})

module.exports=app
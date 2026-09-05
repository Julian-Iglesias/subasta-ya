const express = require('express')

const app= express()

app.use(express.json())

app.get('/api/healt',(req,res)=>{
    res.status(200).json({
        status:'ok',
        message: 'SubastaYa api funcionando'
    })
})

module.exports=app
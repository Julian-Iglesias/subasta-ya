require('dotenv').config()
const app = require('./app')
const AppDataSource=require('./config/database')

const PORT = process.env.PORT || 3000


AppDataSource.initialize().then(()=>{
    console.log('Base de datos conectada')
    
    app.listen(PORT,()=> {
        console.log(`Servidor corriendo en http://localhost:${PORT}`)
    })
}).catch((error)=>{console.error('Error al conectar la BD: ',error)})
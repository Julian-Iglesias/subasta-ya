const{loginUser}= require('../services/auth.service')

const login = async(req,res)=>{
    try{
        const user = await loginUser(req.body)
        return res.status(200).json({
            message:'login correcto',user
        })
    }catch (error){
        return res.status(error.statusCode||500).json({
            message:error.message||'No se pudo iniciar sesion'
        })
    }
}

module.exports={login}
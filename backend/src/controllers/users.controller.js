const{registerUser}=require('../services/users.service')
const createUser=async(req,res)=>{
    try{
        const user=await registerUser(req.body)
        return res.status(201).json(user)
    } catch (error){
        return res.status(error.statusCode||500).json({
            message:error.message||'No se pudo craer el usuario'
        })
    }
}

module.exports={createUser}
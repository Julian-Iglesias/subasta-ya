const bcrypt=require('bcryptjs')
const {findUserByEmail}=require('../repositories/users.repository')

const loginUser=async({email,password})=>{
    if (!email || !password) {
        const error =new Error('El email y password son obligatorios')
        error.statusCode=400
        throw error
    }

    const user=await findUserByEmail(email)

    if (!user || !(await bcrypt.compare(password, user.password))) {
        const error =new Error('Email o password incorrectos')
        error.statusCode=401 
        throw error
        }

        return{id:user.id, name:user.name, email:user.email}
}
module.exports={loginUser}
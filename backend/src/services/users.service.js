const bcrypt =require('bcryptjs')
const{createUserWhitWallet, findUserByEmail, createUserWithWallet}=require('../repositories/users.repository')

const registerUser=async({name,email,password})=>{
    if(!name||!email||!password){
        const error = new Error('name, email y password son obligatorios')
        error.statusCode=400
        throw error
    }
    const existingUser=await findUserByEmail(email)
    if(existingUser){
        const error = new Error('El email ya esta registrado')
        error.statusCode=409
        throw error
    }
    const passwordHash = await bcrypt.hash(password,10)
    const user = await createUserWithWallet({name,email,password:passwordHash})

    return{id:user.id,name:user.name,email:user.email}

}
module.exports={registerUser}
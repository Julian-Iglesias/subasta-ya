const AppDataSource = require('../config/database')
const User=require('../entities/User')
const Wallet = require('../entities/Wallet')

const createUserWithWallet=async({name,email,password})=>{
    return await AppDataSource.transaction(async(transactionalEntityManager)=>{
        const userRepository=transactionalEntityManager.getRepository(User)
        const walletRepository=transactionalEntityManager.getRepository(Wallet)
        const newUser=userRepository.create({name,email,password})
        const savedUser=await userRepository.save(newUser)
        const wallet= walletRepository.create({user:savedUser})
        await walletRepository.save(wallet)
        return savedUser
    })    
}


const findUserByEmail=async(email)=>{
    const userRepository=AppDataSource.getRepository(User)
    return await userRepository.findOneBy({email})
}


module.exports={createUserWithWallet,findUserByEmail}

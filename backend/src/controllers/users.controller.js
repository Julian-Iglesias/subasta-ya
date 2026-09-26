const{registerUser, getUserAuctions, getUserBids}=require('../services/users.service')
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

const getAuctionsByUser = async (req, res) => {
    try {
        return res.status(200).json(await getUserAuctions(req.params.userId))
    } catch (error) {
        return res.status(error.statusCode || 500).json({ message: error.message || 'No se pudieron cargar tus publicaciones.' })
    }
}

const getBidsByUser = async (req, res) => {
    try {
        return res.status(200).json(await getUserBids(req.params.userId))
    } catch (error) {
        return res.status(error.statusCode || 500).json({ message: error.message || 'No se pudieron cargar tus pujas.' })
    }
}

module.exports={createUser, getAuctionsByUser, getBidsByUser}
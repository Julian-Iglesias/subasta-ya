const { placeBid } = require('../services/bid.service')

const createBid = async (req, res) => {
    try {
        const auctionId = req.params.auctionId
        const { userId, amount } = req.body

        const result = await placeBid({
            auctionId,
            userId,
            amount
        })

        return res.status(201).json(result)

    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json({
                message: error.message || 'Error interno del servidor'
            })
    }
}

module.exports = {
    createBid
}
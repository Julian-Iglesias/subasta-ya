const { publishAuction, listAuctions, getAuctionById: getAuctionByIdService } = require('../services/auction.service')

const getAuctions = async (req, res) => {
    try {
        const auctions = await listAuctions(req.query)
        return res.status(200).json(auctions)
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || 'No se pudieron cargar las subastas.'
        })
    }
}

const getAuctionById = async (req, res) => {
    try {
        const auction = await getAuctionByIdService(req.params.id)
        return res.status(200).json(auction)
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || 'No se pudo cargar la subasta.'
        })
    }
}

const createAuction = async (req, res) => {
    try {
        const auction = await publishAuction(req.body)
        return res.status(201).json(auction)
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || 'No se pudo crear la subasta.'
        })
    }
}

module.exports = { createAuction, getAuctions, getAuctionById }
const AppDataSource = require('../config/database')
const Auction = require('../entities/Auction')
const User = require('../entities/User')
const Category = require('../entities/Category')
const Bid = require('../entities/Bid')

const listAuctions = async (filters) => {
    const auctionRepository = AppDataSource.getRepository(Auction)
    const queryBuilder = auctionRepository.createQueryBuilder('auction')
        .leftJoinAndSelect('auction.category', 'category')
        .leftJoinAndSelect('auction.seller', 'seller')
        .leftJoinAndSelect('auction.currentWinner', 'currentWinner')

    if (filters.status) queryBuilder.andWhere('auction.status = :status', { status: filters.status })
    if (filters.category_id) queryBuilder.andWhere('category.id = :categoryId', { categoryId: Number(filters.category_id) })

    if (filters.sort === 'bid_desc') {
        queryBuilder.orderBy('auction.current_bid', 'DESC')
    } else {
        queryBuilder.orderBy('auction.end_date', 'ASC')
    }

    const auctions = await queryBuilder.getMany()
    const bidRepository = AppDataSource.getRepository(Bid)
    const auctionsWithBidCount = await Promise.all(auctions.map(async (auction) => ({
        auction,
        bidCount: await bidRepository.count({ where: { auction: { id: auction.id } } })
    })))

    return auctionsWithBidCount.map(({ auction, bidCount }) => ({
        id: auction.id,
        title: auction.title,
        description: auction.description,
        imageUrl: auction.imageUrl,
        category: auction.category ? { id: auction.category.id, name: auction.category.name } : null,
        basePrice: Number(auction.basePrice),
        minimumIncrement: Number(auction.minimumIncrement),
        startDate: auction.startDate,
        endDate: auction.endDate,
        status: auction.status,
        currentBid: auction.currentBid === null ? null : Number(auction.currentBid),
        bidCount,
        seller: auction.seller ? { id: auction.seller.id, name: auction.seller.name } : null,
        currentWinner: auction.currentWinner ? { id: auction.currentWinner.id, name: auction.currentWinner.name } : null
    }))
}

const publishAuction = async (data) => {
    const title = String(data.title || '').trim()
    const description = String(data.description || '').trim()
    const imageUrl = data.imageUrl ? String(data.imageUrl).trim() : null
    const sellerId = Number(data.sellerId)
    const categoryId = Number(data.categoryId)
    const basePrice = Number(data.basePrice)
    const minimumIncrement = Number(data.minimumIncrement)
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (!title) throw createValidationError('El título es obligatorio.')
    if (!description) throw createValidationError('La descripción es obligatoria.')
    if (!Number.isInteger(sellerId)) throw createValidationError('El usuario vendedor no es válido.')
    if (!Number.isInteger(categoryId)) throw createValidationError('La categoría no es válida.')
    if (!Number.isFinite(basePrice) || basePrice <= 0) throw createValidationError('El precio base debe ser mayor a 0.')
    if (!Number.isFinite(minimumIncrement) || minimumIncrement <= 0) throw createValidationError('El incremento mínimo debe ser mayor a 0.')
    if (Number.isNaN(startDate.getTime())) throw createValidationError('La fecha de inicio no es válida.')
    if (Number.isNaN(endDate.getTime())) throw createValidationError('La fecha de fin no es válida.')
    if (endDate <= startDate) throw createValidationError('La fecha de fin debe ser posterior a la fecha de inicio.')

    const userRepository = AppDataSource.getRepository(User)
    const categoryRepository = AppDataSource.getRepository(Category)
    const auctionRepository = AppDataSource.getRepository(Auction)
    const seller = await userRepository.findOneBy({ id: sellerId })
    const category = await categoryRepository.findOneBy({ id: categoryId })

    if (!seller) throw createNotFoundError('El usuario vendedor no existe.')
    if (!category) throw createNotFoundError('La categoría seleccionada no existe.')

    const auction = auctionRepository.create({
        title,
        description,
        imageUrl,
        basePrice,
        minimumIncrement,
        startDate,
        endDate,
        status: startDate <= new Date() ? 'ACTIVE' : 'UPCOMING',
        seller,
        category
    })
    const savedAuction = await auctionRepository.save(auction)

    return {
        message: 'Subasta creada correctamente.',
        auction: {
            id: savedAuction.id,
            title: savedAuction.title,
            description: savedAuction.description,
            imageUrl: savedAuction.imageUrl,
            category: { id: category.id, name: category.name },
            basePrice: Number(savedAuction.basePrice),
            minimumIncrement: Number(savedAuction.minimumIncrement),
            startDate: savedAuction.startDate,
            endDate: savedAuction.endDate,
            status: savedAuction.status,
            currentBid: null,
            currentWinner: null,
            seller: { id: seller.id, name: seller.name, email: seller.email }
        }
    }
}

function createValidationError(message) {
    const error = new Error(message)
    error.statusCode = 400
    return error
}

function createNotFoundError(message) {
    const error = new Error(message)
    error.statusCode = 404
    return error
}

module.exports = { publishAuction, listAuctions }
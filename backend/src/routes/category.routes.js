const express = require('express')
const AppDataSource = require('../config/database')
const Category = require('../entities/Category')

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const categories = await AppDataSource.getRepository(Category).find({ order: { name: 'ASC' } })
        return res.status(200).json(categories)
    } catch (error) {
        return res.status(500).json({ message: 'No se pudieron cargar las categorías.' })
    }
})

module.exports = router
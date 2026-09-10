require('dotenv').config()
require('reflect-metadata')
const {DataSource} = require('typeorm')
const User=require('../entities/User')
const Wallet=require('../entities/Wallet')
const Category=require('../entities/Category')
const Auction=require('../entities/Auction')
const Bid=require('../entities/Bid')

const AppDataSource=new DataSource({
	type:'mysql',
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || 3306),
	username: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'subastaya',

	synchronize: false,
	logging:false,
	entities: [User, Wallet, Category, Auction, Bid],
	migrations: [__dirname+'/../migrations/*.js'],
})

module.exports=AppDataSource


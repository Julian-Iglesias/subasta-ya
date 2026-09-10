const {EntitySchema}=require('typeorm')
const User=new EntitySchema({
    name:'User', tableName:'users',
    columns:{id:{type:Number,primary:true,generated:true},
    name:{type:String,length:100},
    email:{type:String,length:150,unique:true},
    password:{type:String,length:255}
    },
    relations:{
        wallet:{type:'one-to-one',target:'Wallet',inverseSide:'user'},
        auctions:{type:'one-to-many',target:'Auction',inverseSide:'seller'},
        bids:{type:'one-to-many',target:'Bid',inverseSide:'bidder'},
        wonAuctions:{type:'one-to-many',target:'Auction',inverseSide:'currentWinner'}
    }
})

module.exports=User
const {EntitySchema}=require('typeorm')

const Auction=new EntitySchema({
    name:'Auction',
    tableName:'auctions',
    columns:{
        id:{type:Number,primary:true,generated:true},
        title:{type:String,length:200},
        description:{type:'text',nullable:true},
        imageUrl:{name:'image_url',type:String,length:500,nullable:true},
        basePrice:{name:'base_price',type:'decimal',precision:12,scale:2},
        minimumIncrement:{name:'minimum_increment',type:'decimal',precision:12,scale:2},
        startDate:{name:'start_date',type:'datetime'},
        endDate:{name:'end_date',type:'datetime'},
        status:{type:String,length:20,default:'UPCOMING'},
        currentBid:{name:'current_bid',type:'decimal',precision:12,scale:2,nullable:true},
        version:{type:Number,version:true}
    },
    relations:{
        seller:{type:'many-to-one',target:'User',inverseSide:'auctions',joinColumn:{name:'seller_id'}},
        category:{type:'many-to-one',target:'Category',inverseSide:'auctions',joinColumn:{name:'category_id'}},
        currentWinner:{type:'many-to-one',target:'User',inverseSide:'wonAuctions',joinColumn:{name:'current_winner_id',nullable:true}},
        bids:{type:'one-to-many',target:'Bid',inverseSide:'auction'}
    }
})

module.exports=Auction
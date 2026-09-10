const {EntitySchema}=require('typeorm')

const Bid=new EntitySchema({
    name:'Bid',
    tableName:'bids',
    columns:{
        id:{type:Number,primary:true,generated:true},
        amount:{type:'decimal',precision:12,scale:2},
        createdAt:{name:'created_at',type:'datetime',createDate:true}
    },
    relations:{
        auction:{type:'many-to-one',target:'Auction',inverseSide:'bids',joinColumn:{name:'auction_id'}},
        bidder:{type:'many-to-one',target:'User',inverseSide:'bids',joinColumn:{name:'bidder_id'}}
    }
})

module.exports=Bid
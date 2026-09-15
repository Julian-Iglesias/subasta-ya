const {EntitySchema}=require('typeorm')

const LedgerEntry=new EntitySchema({
    name:'LedgerEntry',
    tableName:'ledger_entries',
    columns:{
        id:{type:Number,primary:true,generated:true},
        type:{type:String,length:50},
        amount:{type:'decimal',precision:12,scale:2},
        balanceAfter:{name:'balance_after',type:'decimal',precision:12,scale:2},
        createdAt:{name:'created_at',type:'datetime',createDate:true}
    },
    relations:{
        wallet:{type:'many-to-one',target:'Wallet',joinColumn:{name:'wallet_id'}},
        relatedAuction:{type:'many-to-one',target:'Auction',joinColumn:{name:'auction_id',nullable:true},nullable:true},
        relatedBid:{type:'many-to-one',target:'Bid',joinColumn:{name:'bid_id',nullable:true},nullable:true}
    }
})

module.exports=LedgerEntry
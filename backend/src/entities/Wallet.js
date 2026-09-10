const {EntitySchema}=require('typeorm')

const Wallet=new EntitySchema({
    name:'Wallet',
    tableName:'wallets',
    columns:{
        id:{type:Number,primary:true,generated:true},
        totalBalance:{name:'total_balance',type:'decimal',precision:12,scale:2,default:0},
        heldBalance:{name:'held_balance',type:'decimal',precision:12,scale:2,default:0},
        version:{type:Number,version:true}
    },
    relations:{
        user:{type:'one-to-one',target:'User',inverseSide:'wallet',joinColumn:{name:'user_id'},unique:true}
    }
})

module.exports=Wallet
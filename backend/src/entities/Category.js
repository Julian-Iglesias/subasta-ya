const {EntitySchema}=require('typeorm')

const Category=new EntitySchema({
    name:'Category',
    tableName:'categories',
    columns:{
        id:{type:Number,primary:true,generated:true},
        name:{type:String,length:100,unique:true}
    },
    relations:{
        auctions:{type:'one-to-many',target:'Auction',inverseSide:'category'}
    }
})

module.exports=Category
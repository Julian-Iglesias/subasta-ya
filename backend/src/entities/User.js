const {EntitySchema}=require('typeorm')
const User=new EntitySchema({
    name:'User', tableName:'users',
    columns:{id:{type:Number,primary:true,generated:true},
    name:{type:String,length:100},
    email:{type:String,length:150,unique:true},
    password:{type:String},
    createdAt:{type:'timestamp',createDate:true}
}
})

module.exports=User
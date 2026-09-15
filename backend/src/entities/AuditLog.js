const {EntitySchema}=require('typeorm')

const AuditLog=new EntitySchema({
    name:'AuditLog',
    tableName:'audit_logs',
    columns:{
        id:{type:Number,primary:true,generated:true},
        eventType:{name:'event_type',type:String,length:50},
        entityType:{name:'entity_type',type:String,length:50},
        entityId:{name:'entity_id',type:Number},
        description:{type:'text'},
        metadata:{type:'json',nullable:true},
        createdAt:{name:'created_at',type:'datetime',createDate:true}
    },
    relations:{
        user:{type:'many-to-one',target:'User',joinColumn:{name:'user_id',nullable:true},nullable:true}
    }
})

module.exports=AuditLog
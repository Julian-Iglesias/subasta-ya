const AuditLog = require('../entities/AuditLog')
const AppDataSource = require('../config/database')
const User = require('../entities/User')

const createAuditLog = async (
    manager,{eventType,entityType,entityId,description,metadata = null,user = null}
) => {
    const auditRepository = manager.getRepository(AuditLog)
    const auditLog = auditRepository.create({ eventType,entityType,entityId,description,metadata,user
    })
    return await auditRepository.save(auditLog)
}


const createAuditLogStandalone = async ({eventType,entityType,entityId,description,metadata = null,userId = null}) => {
    const auditRepository = AppDataSource.getRepository(AuditLog)
    let user = null
    if (userId) {
        const userRepository = AppDataSource.getRepository(User)
        user = await userRepository.findOne({ where: {id: Number(userId)}})}

    const auditLog = auditRepository.create({eventType,entityType,entityId,description,metadata,user})
    return await auditRepository.save(auditLog)
}



module.exports = {createAuditLog,createAuditLogStandalone}
class CreateAuditLogs1788916145573 {
  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE \`audit_logs\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`event_type\` varchar(50) NOT NULL,
        \`entity_type\` varchar(50) NOT NULL,
        \`entity_id\` int NOT NULL,
        \`user_id\` int NULL,
        \`description\` text NOT NULL,
        \`metadata\` json NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX \`IDX_audit_logs_entity_type_entity_id\` (\`entity_type\`, \`entity_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_audit_logs_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
      ) ENGINE=InnoDB
    `)
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX \`IDX_audit_logs_entity_type_entity_id\` ON \`audit_logs\``)
    await queryRunner.query(`DROP TABLE \`audit_logs\``)
  }
}

module.exports = { CreateAuditLogs1788916145573 }
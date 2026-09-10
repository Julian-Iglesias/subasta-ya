class CreateWallets1788916145568 {
  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE \`wallets\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` int NOT NULL,
        \`total_balance\` decimal(12,2) NOT NULL DEFAULT '0.00',
        \`held_balance\` decimal(12,2) NOT NULL DEFAULT '0.00',
        \`version\` int NOT NULL DEFAULT 1,
        UNIQUE INDEX \`IDX_wallets_user_id\` (\`user_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_wallets_users\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
      ) ENGINE=InnoDB
    `)
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE \`wallets\``)
  }
}

module.exports = { CreateWallets1788916145568 }
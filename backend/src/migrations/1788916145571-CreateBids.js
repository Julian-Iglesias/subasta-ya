class CreateBids1788916145571 {
  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE \`bids\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`auction_id\` int NOT NULL,
        \`bidder_id\` int NOT NULL,
        \`amount\` decimal(12,2) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_bids_auction\` FOREIGN KEY (\`auction_id\`) REFERENCES \`auctions\` (\`id\`),
        CONSTRAINT \`FK_bids_bidder\` FOREIGN KEY (\`bidder_id\`) REFERENCES \`users\` (\`id\`)
      ) ENGINE=InnoDB
    `)
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE \`bids\``)
  }
}

module.exports = { CreateBids1788916145571 }
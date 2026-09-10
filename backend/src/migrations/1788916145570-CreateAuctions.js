class CreateAuctions1788916145570 {
  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE \`auctions\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`seller_id\` int NOT NULL,
        \`category_id\` int NOT NULL,
        \`title\` varchar(200) NOT NULL,
        \`description\` text NULL,
        \`image_url\` varchar(500) NULL,
        \`base_price\` decimal(12,2) NOT NULL,
        \`minimum_increment\` decimal(12,2) NOT NULL,
        \`start_date\` datetime NOT NULL,
        \`end_date\` datetime NOT NULL,
        \`status\` varchar(20) NOT NULL DEFAULT 'UPCOMING',
        \`current_bid\` decimal(12,2) NULL,
        \`current_winner_id\` int NULL,
        \`version\` int NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_auctions_seller\` FOREIGN KEY (\`seller_id\`) REFERENCES \`users\` (\`id\`),
        CONSTRAINT \`FK_auctions_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`),
        CONSTRAINT \`FK_auctions_winner\` FOREIGN KEY (\`current_winner_id\`) REFERENCES \`users\` (\`id\`)
      ) ENGINE=InnoDB
    `)
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE \`auctions\``)
  }
}

module.exports = { CreateAuctions1788916145570 }
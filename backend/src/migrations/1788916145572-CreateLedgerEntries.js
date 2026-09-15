class CreateLedgerEntries1788916145572 {
  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE \`ledger_entries\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`wallet_id\` int NOT NULL,
        \`type\` varchar(50) NOT NULL,
        \`amount\` decimal(12,2) NOT NULL,
        \`auction_id\` int NULL,
        \`bid_id\` int NULL,
        \`balance_after\` decimal(12,2) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX \`IDX_ledger_entries_wallet_id\` (\`wallet_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_ledger_entries_wallet\` FOREIGN KEY (\`wallet_id\`) REFERENCES \`wallets\` (\`id\`),
        CONSTRAINT \`FK_ledger_entries_auction\` FOREIGN KEY (\`auction_id\`) REFERENCES \`auctions\` (\`id\`),
        CONSTRAINT \`FK_ledger_entries_bid\` FOREIGN KEY (\`bid_id\`) REFERENCES \`bids\` (\`id\`)
      ) ENGINE=InnoDB
    `)
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX \`IDX_ledger_entries_wallet_id\` ON \`ledger_entries\``)
    await queryRunner.query(`DROP TABLE \`ledger_entries\``)
  }
}

module.exports = { CreateLedgerEntries1788916145572 }
class CreateCategories1788916145569 {
  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE \`categories\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        UNIQUE INDEX \`IDX_categories_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `)
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE \`categories\``)
  }
}

module.exports = { CreateCategories1788916145569 }
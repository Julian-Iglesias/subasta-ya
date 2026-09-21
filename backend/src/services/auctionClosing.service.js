const {
  findExpiredActiveAuctions,
  closeExpiredAuction,
} = require("../repositories/auction.repository");

const closeExpiredAuctions = async () => {
  const expiredAuctions = await findExpiredActiveAuctions();

  for (const auction of expiredAuctions) {
    try {
      await closeExpiredAuction(auction.id);

      console.log(`Subasta ${auction.id} cerrada`);
    } catch (error) {
      console.error(`Error cerrando subasta ${auction.id}:`, error.message);
    }
  }
};

module.exports = {
  closeExpiredAuctions,
};

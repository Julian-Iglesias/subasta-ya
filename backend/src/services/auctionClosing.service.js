const {
  findExpiredActiveAuctions,
  closeExpiredAuction,
  findUpcomingAuctionsToActivate,
  activateAuction
} = require('../repositories/auction.repository')



const activateUpcomingAuctions = async () => {
  const upcomingAuctions =
    await findUpcomingAuctionsToActivate()

  for (const auction of upcomingAuctions) {
    try {
      await activateAuction(auction.id)

      console.log(`Subasta ${auction.id} activada`)
    } catch (error) {
      console.error(
        `Error activando subasta ${auction.id}:`,
        error.message
      )
    }
  }
}


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
  activateUpcomingAuctions
}
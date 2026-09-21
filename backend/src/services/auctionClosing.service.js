const {
  findExpiredActiveAuctions,
  closeExpiredAuction,
  findUpcomingAuctionsToActivate,
  activateAuction,
} = require("../repositories/auction.repository");

const { getIO } = require("../socket");

const activateUpcomingAuctions = async () => {
  const upcomingAuctions = await findUpcomingAuctionsToActivate();

  for (const auction of upcomingAuctions) {
    try {
      const updatedAuction = await activateAuction(auction.id);

      console.log(
        `Subasta ${auction.id} actualizada a ${updatedAuction.status}`,
      );
    } catch (error) {
      console.error(`Error actualizando subasta ${auction.id}:`, error.message);
    }
  }
};

const closeExpiredAuctions = async () => {
  const expiredAuctions = await findExpiredActiveAuctions();

  for (const auction of expiredAuctions) {
    try {
      const closedAuction = await closeExpiredAuction(auction.id);

      const io = getIO();
      if (io && ["FINALIZED", "DESERTED"].includes(closedAuction.status)) {
        io.to(`auction-${auction.id}`).emit("auction-closed", {
          status: closedAuction.status,
        });
      }

      console.log(`Subasta ${auction.id} cerrada`);
    } catch (error) {
      console.error(`Error cerrando subasta ${auction.id}:`, error.message);
    }
  }
};

module.exports = {
  closeExpiredAuctions,
  activateUpcomingAuctions,
};

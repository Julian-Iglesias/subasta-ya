let io

const init = (server) => {
  io = server;

  server.on("connection", (socket) => {
    socket.on("join-auction", (auctionId) => {
      socket.join(`auction-${auctionId}`);
    });
  });

};

const getIO = () => io;

module.exports = { init, getIO };

require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const AppDataSource = require("./config/database");
const { closeExpiredAuctions } = require("./services/auctionClosing.service");
const { init } = require("./socket");

const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
init(io);

AppDataSource.initialize()
  .then(() => {
    console.log("Base de datos conectada");

    httpServer.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      setInterval(async () => {
        try {
          await closeExpiredAuctions();
        } catch (error) {
          console.error("Error revisando subastas vencidas:", error.message);
        }
      }, 30000);
    });
  })
  .catch((error) => {
    console.error("Error al conectar la BD: ", error);
  });

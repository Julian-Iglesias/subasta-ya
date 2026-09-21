require("dotenv").config();
const app = require("./app");
const AppDataSource = require("./config/database");
const { closeExpiredAuctions } = require("./services/auctionClosing.service");

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log("Base de datos conectada");

    app.listen(PORT, () => {
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

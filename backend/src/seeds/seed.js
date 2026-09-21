const bcrypt = require("bcryptjs");

const AppDataSource = require("../config/database");
const User = require("../entities/User");
const Category = require("../entities/Category");
const Wallet = require("../entities/Wallet");
const Auction = require("../entities/Auction");

const runSeed = async () => {
  try {
    await AppDataSource.initialize();

    console.log("Base de datos conectada");

    const userRepository = AppDataSource.getRepository(User);
    const categoryRepository = AppDataSource.getRepository(Category);
    const walletRepository = AppDataSource.getRepository(Wallet);
    const auctionRepository = AppDataSource.getRepository(Auction);

    // =========================
    // USUARIOS
    // =========================

    const usersData = [
      {
        name: "Julian",
        email: "julian@subastaya.com",
        password: "12345678",
      },
      {
        name: "Lucas",
        email: "lucas@subastaya.com",
        password: "12345678",
      },
      {
        name: "Maria",
        email: "maria@subastaya.com",
        password: "12345678",
      },
      {
        name: "Sofia",
        email: "sofia@subastaya.com",
        password: "12345678",
      },
    ];

    const users = [];

    for (const userData of usersData) {
      let user = await userRepository.findOne({
        where: {
          email: userData.email,
        },
      });

      if (!user) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        user = userRepository.create({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
        });

        user = await userRepository.save(user);

        console.log(`Usuario creado: ${user.email}`);
      }

      users.push(user);
    }

    // =========================
    // BILLETERAS
    // =========================

    for (const user of users) {
      let wallet = await walletRepository.findOne({
        where: {
          user: {
            id: user.id,
          },
        },
        relations: {
          user: true,
        },
      });

      if (!wallet) {
        wallet = walletRepository.create({
          user,
          totalBalance: 500000,
          heldBalance: 0,
        });

        await walletRepository.save(wallet);

        console.log(`Billetera creada para ${user.email}`);
      }
    }

    // =========================
    // CATEGORÍAS
    // =========================

    const categoryNames = [
      "Tecnologia",
      "Gaming",
      "Hogar",
      "Coleccionables",
    ];

    const categories = [];

    for (const name of categoryNames) {
      let category = await categoryRepository.findOne({
        where: {
          name,
        },
      });

      if (!category) {
        category = categoryRepository.create({
          name,
        });

        category = await categoryRepository.save(category);

        console.log(`Categoría creada: ${name}`);
      }

      categories.push(category);
    }

    // =========================
    // FECHAS
    // =========================

    const now = new Date();

    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    // =========================
    // SUBASTAS
    // =========================

    const auctionsData = [
      {
        title: "PlayStation 5",
        description: "PlayStation 5 en excelente estado con joystick.",
        imageUrl: null,
        basePrice: 300000,
        minimumIncrement: 10000,
        startDate: new Date(now.getTime() - oneHour),
        endDate: new Date(now.getTime() + 2 * oneHour),
        status: "ACTIVE",
        seller: users[0],
        category: categories[1],
      },
      {
        title: "Notebook Gamer",
        description: "Notebook gamer ideal para estudiar y jugar.",
        imageUrl: null,
        basePrice: 400000,
        minimumIncrement: 15000,
        startDate: new Date(now.getTime() - 2 * oneHour),
        endDate: new Date(now.getTime() + 3 * oneHour),
        status: "ACTIVE",
        seller: users[1],
        category: categories[0],
      },
      {
        title: "iPhone 15",
        description: "iPhone 15 de 128 GB en excelente estado.",
        imageUrl: null,
        basePrice: 500000,
        minimumIncrement: 20000,
        startDate: new Date(now.getTime() + oneHour),
        endDate: new Date(now.getTime() + oneDay),
        status: "UPCOMING",
        seller: users[2],
        category: categories[0],
      },
      {
        title: "Nintendo Switch OLED",
        description: "Nintendo Switch OLED con accesorios.",
        imageUrl: null,
        basePrice: 250000,
        minimumIncrement: 10000,
        startDate: new Date(now.getTime() + 2 * oneHour),
        endDate: new Date(now.getTime() + oneDay),
        status: "UPCOMING",
        seller: users[3],
        category: categories[1],
      },
      {
        title: "Sillon Gamer",
        description: "Sillón gamer reclinable en buen estado.",
        imageUrl: null,
        basePrice: 100000,
        minimumIncrement: 5000,
        startDate: new Date(now.getTime() - 2 * oneDay),
        endDate: new Date(now.getTime() - oneDay),
        status: "DESERTED",
        seller: users[0],
        category: categories[2],
      },
    ];

    for (const auctionData of auctionsData) {
      const existingAuction = await auctionRepository.findOne({
        where: {
          title: auctionData.title,
        },
      });

      if (!existingAuction) {
        const auction = auctionRepository.create(auctionData);

        await auctionRepository.save(auction);

        console.log(`Subasta creada: ${auctionData.title}`);
      }
    }

    console.log("");
    console.log("Seed ejecutada correctamente");
    console.log("4 usuarios");
    console.log("4 billeteras");
    console.log("4 categorías");
    console.log("5 subastas");

  } catch (error) {
    console.error("Error ejecutando seed:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
};

runSeed();
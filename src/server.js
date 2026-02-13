require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error("CRITICAL ERROR: JWT_SECRET is not defined in .env file");
  process.exit(1);
}
const seedAdmin = require('./config/seedAdmin');
const app = require('./app');
const connectDB = require('./config/DataBase');

const port = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB(); //Attend la connexion
    await seedAdmin();
    

    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1); // Arrêt immédiat
  }
})();




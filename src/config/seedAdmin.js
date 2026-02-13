const bcrypt = require('bcrypt');
const User = require('../modules/users/User.model');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log("Admin already exists");
      return;
    }

    // const hashedPassword = await bcrypt.hash("Admin123", 10);
    // console.log("Hashed password for seeding:", hashedPassword);

    await User.create({
      contact: "admin@local.com",
      password: "Admin123",
      role: "admin",
      status: "actif"
    });

    console.log("Default admin created:");
    console.log("Contact: admin@local.com");
    console.log("Password: Admin123");
  } catch (error) {
    console.error("Error seeding admin:", error.message);
    throw error; // IMPORTANT pour que ton try/catch principal fonctionne
  }
};

module.exports = seedAdmin;

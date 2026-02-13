const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const { MONGODB_URL } = process.env;

        if (!MONGODB_URL) {
            throw new Error("MONGODB_URL is not defined in environment variables");
        }

        await mongoose.connect(MONGODB_URL, {
            autoIndex: false,
            maxPoolSize: 10,
        });
        console.log("MongoDB connected successfully");

        // Connection events
        mongoose.connection.on("error", (err) => {
            console.error("MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("MongoDB disconnected");
        });

        // Optional: Graceful shutdown
        process.on("SIGINT", async () => {
            await mongoose.connection.close();
            console.log("MongoDB connection closed due to app termination");
            process.exit(0);
        });

    } catch (error) {
        console.error("MongoDB initial connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;

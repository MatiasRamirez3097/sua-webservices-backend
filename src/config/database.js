import mongoose from "mongoose";
import "dotenv/config.js";

mongoose
    .connect(process.env.DATABASE_URL)
    .then(() => {
        console.log("Database connected");
    })
    .catch(() => {
        console.log("Connection failed");
    });

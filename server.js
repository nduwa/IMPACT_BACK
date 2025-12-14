import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./src/database/connectDb.js";
import router from "./src/routes/index.js";

dotenv.config();

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use("/", router);

const PORT = process.env.PORT || 5001;

// Connect to DB and start server
(async () => {
  try {
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
  }
})();

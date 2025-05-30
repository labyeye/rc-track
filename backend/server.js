require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const { protect } = require("./middleware/auth");
const dashboardRoutes = require("./routes/dashboardRoutes");
const rcRoutes = require("./routes/rcRoutes");
const path = require("path");
const cors = require("cors");

const app = express();

connectDB();

app.use(express.json());
app.use(
  cors({
    origin: "https://rc-track.vercel.app",
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/users", protect, userRoutes);
app.use("/api/rc", rcRoutes);
app.use("/api/dashboard", dashboardRoutes);
const uploadsPath = path.join(__dirname, "utils/uploads");
app.use(
  "/utils/uploads",  // Changed from "/uploads" to match the URL structure
  express.static(uploadsPath, {
    setHeaders: (res, path) => {
      if (path.endsWith(".pdf")) {
        res.set("Content-Type", "application/pdf");
        res.set("Content-Disposition", "inline; filename=" + path.basename(path));
      }
    },
  })
);
const PORT = 2500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

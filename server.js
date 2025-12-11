import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./shared/middlewares/connect-db.js";
import cookieParser from "cookie-parser";

// Routers
import usersRouter from "./modules/users/routes/users.routes.js";
import examsRouter from "./modules/exams/routes/exams.routes.js";
import vocabRouter from "./modules/vocab/routes/vocab.routes.js";
import feedbackRouter from "./modules/feedback/routes/feedback.routes.js";
import resourcesRouter from "./modules/resources/routes/resources.routes.js";
import authRouter from "./modules/auth/routes/auth.routes.js";

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// === Application-level Middlewares ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "FrancoPass API – Phase 3 (MongoDB)",
    routes: [
      "/api/users",
      "/api/exams",
      "/api/vocab",
      "/api/feedback",
      "/api/resources",
    ],
  });
});

// === Feature Routers (independent) ===
app.use("/api/users", usersRouter);
app.use("/api/exams", examsRouter);
app.use("/api/vocab", vocabRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/resources", resourcesRouter);
app.use("/api/auth", authRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// === Start Server ===
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(PORT, () => {
    console.log(`FrancoPass API listening on http://localhost:${PORT}`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Free the port or set a different PORT.`
      );
      process.exit(1);
    }
    console.error("Server error:", err);
    process.exit(1);
  });
}

export default app;

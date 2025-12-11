import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../modules/users/models/user.model.js";

dotenv.config();

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to Mongo for admin creation");

  const email = process.env.ADMIN_EMAIL || "admin@francopass.local";
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "adminpass";

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("Admin user already exists:", existing.email);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const admin = await User.create({
      username,
      email,
      password: hashed,
      role: "admin",
    });

    console.log("Admin user created:", admin.email);
    process.exit(0);
  } catch (err) {
    console.error("Failed creating admin:", err);
    process.exit(1);
  }
};

run();

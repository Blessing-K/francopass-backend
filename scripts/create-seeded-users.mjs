import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../modules/users/models/user.model.js";

dotenv.config();

const users = [
  {
    username: "Tee",
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    role: "admin",
  },
  {
    username: "Babs",
    email: process.env.SEED_CUSTOMER_EMAIL,
    password: process.env.SEED_CUSTOMER_PASSWORD,
    role: "student",
  },
];

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to Mongo for creating seeded users");

  try {
    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`User already exists: ${u.email}`);
        continue;
      }
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(u.password, salt);
      const created = await User.create({
        username: u.username,
        email: u.email,
        password: hashed,
        role: u.role,
      });
      console.log(`Created user: ${created.email} (${created.role})`);
    }

    console.log("Seeded users creation finished");
    process.exit(0);
  } catch (err) {
    console.error("Failed creating seeded users:", err);
    process.exit(1);
  }
};

run();

import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";

dotenv.config();

import User from "../modules/users/models/user.model.js";
import bcrypt from "bcrypt";
import Exam from "../modules/exams/models/exam.model.js";
import Vocab from "../modules/vocab/models/vocab.model.js";
import Resource from "../modules/resources/models/resource.model.js";
import Feedback from "../modules/feedback/models/feedback.model.js";

const dataDir = path.resolve("data");

const mapExamType = (str) => {
  if (!str) return str;
  if (str.toUpperCase().includes("DELF")) return "DELF";
  if (str.toUpperCase().includes("TCF")) return "TCF";
  return str;
};

const scoreToRating = (p, f) => {
  const avg = ((Number(p) || 0) + (Number(f) || 0)) / 2;
  const rating = Math.max(1, Math.min(5, Math.round(avg / 20)));
  return rating;
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to Mongo for seeding");

  try {
    // Read files
    const usersRaw = JSON.parse(
      await fs.readFile(path.join(dataDir, "users.json"), "utf8")
    );
    const examsRaw = JSON.parse(
      await fs.readFile(path.join(dataDir, "exams.json"), "utf8")
    );
    const vocabRaw = JSON.parse(
      await fs.readFile(path.join(dataDir, "vocab.json"), "utf8")
    );
    const resourcesRaw = JSON.parse(
      await fs.readFile(path.join(dataDir, "resources.json"), "utf8")
    );
    const feedbackRaw = JSON.parse(
      await fs.readFile(path.join(dataDir, "feedback.json"), "utf8")
    );

    // Clear collections (careful in production)
    await Promise.all([
      User.deleteMany({}),
      Exam.deleteMany({}),
      Vocab.deleteMany({}),
      Resource.deleteMany({}),
      Feedback.deleteMany({}),
    ]);

    // Insert users and build id map. Hash passwords and set role if provided.
    const idMap = {};
    const adminEmail = process.env.ADMIN_EMAIL;
    for (const u of usersRaw) {
      const payload = {
        username: u.username,
        email: u.email,
        subscription: u.subscription || "free",
        role:
          u.role ||
          (adminEmail && u.email === adminEmail ? "admin" : undefined),
      };

      // If a plain password exists, hash it before creating the user
      const plain =
        u.password || process.env.DEFAULT_USER_PASSWORD || "password";
      const salt = await bcrypt.genSalt(10);
      payload.password = await bcrypt.hash(plain, salt);

      const created = await User.create(payload);
      if (u.id) idMap[u.id] = created._id;
    }

    // Insert exams
    for (const e of examsRaw) {
      await Exam.create({
        examType: mapExamType(e.examType),
        sections: e.sections || [],
        difficulty: e.difficulty || "",
        timer: e.timer || 0,
      });
    }

    // Insert vocab
    for (const v of vocabRaw) {
      await Vocab.create({
        word: v.word,
        definition: v.translation || v.definition || "",
        exampleSentence: v.exampleSentence || "",
        partOfSpeech: v.category || v.partOfSpeech || "",
        difficultyLevel: v.difficultyLevel || "beginner",
      });
    }

    // Insert resources
    for (const r of resourcesRaw) {
      await Resource.create({
        title: r.title,
        description: r.description || `Instructor: ${r.instructor || ""}`,
        url: r.link || r.url || "",
        resourceType: r.resourceType || "article",
        languageLevel: r.languageLevel || "beginner",
      });
    }

    // Insert feedback, mapping user ids and computing rating
    for (const f of feedbackRaw) {
      const mappedUser = idMap[f.userId] || null;
      await Feedback.create({
        userId: mappedUser,
        message: `${f.transcript || ""} ${f.feedbackText || ""}`.trim(),
        rating: f.rating || scoreToRating(f.pronunciationScore, f.fluencyScore),
      });
    }

    console.log("Seeding complete");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error", err);
    process.exit(1);
  }
};

run();

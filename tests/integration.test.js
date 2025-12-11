import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.NODE_ENV = "test";

  // Import app after setting MONGO_URI so connectDB uses the in-memory server
  const server = await import("../server.js");
  app = server.default;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  // clear db
  const collections = Object.keys(mongoose.connection.collections);
  for (const collName of collections) {
    await mongoose.connection.collections[collName].deleteMany({});
  }
});

describe("API basic integration", () => {
  test("GET / returns API index", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("routes");
  });

  test("Users: create validation and create", async () => {
    // missing fields -> 400
    const bad = await request(app).post("/api/users").send({ username: "x" });
    expect(bad.status).toBe(400);

    const good = await request(app)
      .post("/api/users")
      .send({ username: "testuser", email: "t@e.com", password: "secret123" });
    expect(good.status).toBe(201);
    expect(good.body).toHaveProperty("_id");

    const list = await request(app).get("/api/users");
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBe(1);
  });

  test("Vocab: create and query", async () => {
    const r = await request(app)
      .post("/api/vocab")
      .send({ word: "chat", definition: "cat", difficultyLevel: "beginner" });
    expect(r.status).toBe(201);
    const q = await request(app).get("/api/vocab?search=chat");
    expect(q.status).toBe(200);
    expect(q.body.length).toBeGreaterThanOrEqual(1);
  });
});

import mongoose from "mongoose";

// Mongoose Schema and Model (for future use)
const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    url: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resourceType: {
      type: String,
      enum: ["article", "video", "book", "course"],
    },
    languageLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Resource", resourceSchema);

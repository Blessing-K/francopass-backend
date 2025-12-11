import mongoose from "mongoose";

// Mongoose Schema and Model (for future use)
const vocabSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, trim: true },
    definition: { type: String, required: true },
    exampleSentence: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    partOfSpeech: { type: String },
    difficultyLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Vocab", vocabSchema);

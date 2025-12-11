import mongoose from "mongoose";

// Mongoose Schema and Model (for future use)
const examSchema = new mongoose.Schema(
  {
    examType: { type: String, enum: ["DELF", "TCF"], required: true },
    sections: [{ type: String }],
    difficulty: { type: String },
    timer: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);

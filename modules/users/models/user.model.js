import mongoose from "mongoose";

// Mongoose Schema and Model (for future use)
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      default: "student",
    },
    subscription: { type: String, enum: ["free", "premium"], default: "free" },
    // Temporary OTP for email-based MFA
    otp: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

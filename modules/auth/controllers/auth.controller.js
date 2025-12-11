import User from "../../users/models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const createTransporter = async () => {
  // If Google OAuth2 credentials are provided, prefer using Gmail via OAuth2.
  // This works on platforms that block SMTP ports (e.g., Render free tier).
  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    process.env.SMTP_USER
  ) {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    let accessToken;
    try {
      const tokenResponse = await oAuth2Client.getAccessToken();
      accessToken = tokenResponse?.token || tokenResponse;
    } catch (err) {
      console.error(
        "Failed to obtain Google access token:",
        err?.message || err
      );
      throw err;
    }

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.SMTP_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken,
      },
    });
  }

  // If SMTP credentials are provided, use them. Otherwise create an Ethereal test account for local dev.
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465; // port 465 typically uses SSL
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // allow self-signed certs when necessary for some servers; keep false for production
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
      },
    });
  }

  // Create test account for development
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username
    if (!identifier || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    // Generate OTP, store on user with expiry (5 minutes)
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // Send OTP via email
    const transporter = await createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || "no-reply@francopass.local",
      to: user.email,
      subject: "Your FrancoPass OTP",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    };

    // Verify transporter before sending (helps surface SMTP config issues)
    try {
      await transporter.verify();
    } catch (err) {
      console.error("SMTP verification failed:", err?.message || err);
      return res.status(500).json({
        error: "SMTP verification failed",
        details: err?.message || String(err),
      });
    }

    let info;
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error("Failed sending OTP email:", err?.message || err);
      // Return useful info to the client in development to aid debugging
      if (
        process.env.NODE_ENV !== "production" ||
        process.env.DEV_SHOW_OTP === "true"
      ) {
        return res.status(500).json({
          error: "Failed sending OTP email",
          details: err?.message || String(err),
          otp,
        });
      }
      return res.status(500).json({ error: "Failed sending OTP email" });
    }

    const isTestPreview = info && nodemailer.getTestMessageUrl(info);
    // Only include the OTP in the response when explicitly requested (DEV_SHOW_OTP=true)
    // or when using a test mail provider like Ethereal (no real email delivery available).
    const showOtp =
      process.env.DEV_SHOW_OTP === "true" || Boolean(isTestPreview);

    const response = {
      message: "OTP sent to registered email",
      email: user.email,
    };
    if (showOtp) response.otp = otp;
    // If nodemailer test account used, return preview URL to view message
    if (isTestPreview) {
      response.previewUrl = nodemailer.getTestMessageUrl(info);
    }

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Missing data" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or OTP" });

    if (!user.otp || !user.otpExpires)
      return res.status(400).json({ error: "No OTP pending for this user" });

    if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
    if (new Date() > user.otpExpires)
      return res.status(400).json({ error: "OTP expired" });

    // OTP valid -> generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error(
        "JWT_SECRET is not configured. Please set JWT_SECRET in .env"
      );
      return res
        .status(500)
        .json({ error: "Server misconfiguration: JWT_SECRET not set" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES || "1h" }
    );

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const me = async (req, res) => {
  try {
    // `authenticate` middleware sets req.user
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { _id, username, email, role, subscription } = req.user;
    return res.json({ id: _id, username, email, role, subscription });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const debugSmtp = async (req, res) => {
  if (process.env.NODE_ENV === "production")
    return res.status(404).json({ error: "Not found" });

  try {
    const transporter = await createTransporter();
    await transporter.verify();
    return res.json({ ok: true, message: "SMTP verified" });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, error: err?.message || String(err) });
  }
};

export default { login, verifyOtp };

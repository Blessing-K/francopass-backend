import User from "../../users/models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Send email using Gmail API (HTTP-based, no SMTP ports needed)
 * Works on platforms that block SMTP ports like Render free tier
 */
const sendEmailViaGmailAPI = async (to, subject, text) => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REFRESH_TOKEN ||
    !process.env.SMTP_USER
  ) {
    throw new Error("Gmail API credentials not configured");
  }

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  // Construct RFC 2822 formatted email
  const emailLines = [
    `From: ${process.env.EMAIL_FROM || process.env.SMTP_USER}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "",
    text,
  ];
  const email = emailLines.join("\r\n");

  // Encode in base64url format (Gmail API requirement)
  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Send via Gmail API
  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedEmail,
    },
  });

  return result.data;
};

/**
 * Fallback: Create nodemailer transporter for SMTP or Ethereal test accounts
 */
const createTransporter = async () => {
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
    let info;
    let isGmailAPI = false;

    // Try Gmail API first (works on Render free tier - no SMTP ports needed)
    if (
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.SMTP_USER
    ) {
      try {
        console.log("Sending email via Gmail API...");
        const result = await sendEmailViaGmailAPI(
          user.email,
          "Your FrancoPass OTP",
          `Your OTP is ${otp}. It expires in 5 minutes.`
        );
        console.log("Email sent successfully via Gmail API:", result.id);
        isGmailAPI = true;
      } catch (err) {
        console.error("Gmail API failed:", err?.message || err);
        // If Gmail API fails, fall through to SMTP fallback
      }
    }

    // Fallback to SMTP if Gmail API not configured or failed
    if (!isGmailAPI) {
      try {
        console.log("Falling back to SMTP...");
        const transporter = await createTransporter();
        const mailOptions = {
          from: process.env.EMAIL_FROM || "no-reply@francopass.local",
          to: user.email,
          subject: "Your FrancoPass OTP",
          text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        };

        // Verify transporter before sending
        await transporter.verify();
        info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully via SMTP");
      } catch (err) {
        console.error("SMTP also failed:", err?.message || err);
        // Return useful info to the client in development
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
    }

    const response = {
      message: "OTP sent to registered email",
      email: user.email,
    };

    // Only include the OTP in the response when explicitly requested (DEV_SHOW_OTP=true)
    // or when using a test mail provider like Ethereal
    const isTestPreview = info && nodemailer.getTestMessageUrl(info);
    const showOtp =
      process.env.DEV_SHOW_OTP === "true" || Boolean(isTestPreview);

    if (showOtp) response.otp = otp;
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
    // Test Gmail API if configured
    if (
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.SMTP_USER
    ) {
      const result = await sendEmailViaGmailAPI(
        process.env.SMTP_USER,
        "FrancoPass Email Test",
        "This is a test email from the Gmail API."
      );
      return res.json({
        ok: true,
        method: "Gmail API",
        messageId: result.id,
      });
    }

    // Fallback to SMTP test
    const transporter = await createTransporter();
    await transporter.verify();
    return res.json({ ok: true, method: "SMTP", message: "SMTP verified" });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, error: err?.message || String(err) });
  }
};

export default { login, verifyOtp };

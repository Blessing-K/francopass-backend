import readline from "readline";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT || "http://localhost:3000/oauth2callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env before running this script"
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Request full Gmail scope so the token can send emails
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://mail.google.com/"],
  prompt: "consent",
});

console.log("\n1) Open the following URL in your browser and grant access:");
console.log(authUrl);
console.log(
  "\n2) After granting access, you will be redirected to your redirect URI with a code parameter."
);
console.log("   Copy that `code` value and paste it below.");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.question("\nEnter the code here: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log("\nSuccess! Save these into your .env file:");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(
      `ACCESS_TOKEN (expires_in=${tokens.expiry_date || "unknown"}): ${
        tokens.access_token
      }`
    );
    console.log("\nExample .env entries:");
    console.log("SMTP_USER=your-email@gmail.com");
    console.log("GOOGLE_CLIENT_ID=" + CLIENT_ID);
    console.log("GOOGLE_CLIENT_SECRET=" + CLIENT_SECRET);
    console.log("GOOGLE_REFRESH_TOKEN=" + tokens.refresh_token);
  } catch (err) {
    console.error("Failed to get tokens:", err?.message || err);
  } finally {
    rl.close();
  }
});

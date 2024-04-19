import express from "express";
import { sendMail } from "./mail.js";
import { track } from "./track.js";
import { google } from "googleapis";
import { config } from "dotenv";
import { json } from "body-parser";

config();

const app = express();

app.use(json());

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENTID,
  process.env.CLIENTSECRET,
  process.env.REDIRECTURL
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESHTOKEN });

const url = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/pubsub",
  ],
});

console.log(url);

async function startGmailWatch(authClient, userEmail) {
  const gmail = google.gmail({ version: "v1", auth: authClient });

  try {
    const res = await gmail.users.watch({
      userId: userEmail, // Use 'me' to indicate the authenticated user.
      requestBody: {
        topicName: `projects/mail-tester-420819/topics/emails`,
        labelIds: ["INBOX"], // Optional: specify labels to watch; remove if watching all.
        labelFilterAction: "include", // Can be 'include' or 'exclude'
      },
    });
    console.log("Successfully set up watch:", res.data);
    return res.data;
  } catch (error) {
    console.error("Failed to set up Gmail watch:", error);
  }
}

startGmailWatch(oAuth2Client, "me");

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    console.log("Tokens acquired:", tokens);
    res.send("Authentication successful! You can now close this page.");
  } catch (error) {
    console.error("Error during token exchange:", error);
    res.status(500).send("Authentication failed.");
  }
});

app.get("/", (req, res) => {
  res.send(`<h1>Hello Mailer</h1>
    <p>Send an email by sending a POST request to /send-email</p>
    <p>Change the email template by changing the file at the path ./sample.html</p>
    <p>Listen to Email Events in /updates</p>`);
});

app.get("/send-email", (req, res) => {
  let mailIds = [
    {
      name: "raj",
      email: "rajxryn@gmail.com",
    },
  ];

  mailIds.forEach(async (email) => {
    const result = await sendMail(email, oAuth2Client);
    console.log(result);
    res.send("Emails Sent!");
  });
});

app.get("/track", track);
app;
app.post("/track", (req, res) => {
  res.status(204).end();

  const message = req.body.message;
  const attributes = message.attributes;
  const messageId = attributes.messageId;
  const emailData = Buffer.from(message.data, "base64").toString("utf-8");

  console.log("Received message ID:", messageId);
  console.log("Email notification data:", emailData);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

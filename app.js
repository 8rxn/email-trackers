import express from "express";
import { sendMail } from "./mail.js";
import { track } from "./track.js";
import { google } from "googleapis";
import { config } from "dotenv";
import bodyparser from "body-parser";
import mailparser from "mailparser";

config();

const app = express();

app.use(bodyparser.json());

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
app.post("/track", async (req, res) => {
  res.status(204).end();

  const message = req.body.message;
  console.log({ message });
  const messageId = message.messageId;
  const emailData = Buffer.from(message.data, "base64").toString("utf-8");

  console.log("Received message ID:", messageId);
  console.log("Email notification data:", emailData);
  const data = JSON.parse(emailData);
  if (data.historyId) {
    try {
      const history = await fetchHistory(oAuth2Client, "me", data.historyId);
      console.log(history);
      if (history && history.history && history.history.length > 0) {
        history.history.forEach(async (historyItem) => {
          console.log(historyItem);
          historyItem.messages.forEach(async (msg) => {
            console.log({ msg });
            const message = await fetchEmail(oAuth2Client, msg.id);
            if (message) {
              const html = extractHtmlContent(message.payload);
              console.log(html);

              if (html) {
              }
            }
          });
        });
      }
    } catch (error) {
      console.error("Error fetching email:", error);
    }
  }
});

function extractHtmlContent(payload) {
  if (payload.mimeType === "text/html") {
    return Buffer.from(payload.body.data, "base64").toString("utf8");
  } else if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html") {
        return Buffer.from(part.body.data, "base64").toString("utf8");
      }
      if (part.parts) {
        const html = extractHtmlContent(part);
        if (html) {
          findID(html);
        }
      }
    }
  }
  return null;
}

async function fetchHistory(auth, userId, historyId) {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const response = await gmail.users.history.list({
      userId: userId,
      startHistoryId: historyId,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to list history:", error);
    throw error;
  }
}

async function fetchEmail(auth, messageId) {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });
    return response.data;
  } catch (error) {
    console.error("The API returned an error: " + error);
    throw error;
  }
}

async function findID(emailHtml) {
  const regex = /<img\s+[^>]*src="[^"]*\?id=([^"&]+)/;
  const match = emailHtml.match(regex);
  console.log(match ? match[1] : null);
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

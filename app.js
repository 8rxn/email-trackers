import express from "express";
import { sendMail } from "./handlers/mail.js";
import { trackOpens, trackReplies } from "./handlers/track.js";
import { google } from "googleapis";
import { config } from "dotenv";
import bodyparser from "body-parser";
import { viewUpdates } from "./handlers/updates.js";
import db from "./lib/db.js";
import cron from "node-cron";
import scheduleView from "./handlers/schedule.js";
// import { init, sql } from "./lib/db.js";

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

url;

async function startGmailWatch(authClient, userEmail) {
  const gmail = google.gmail({ version: "v1", auth: authClient });

  try {
    const res = await gmail.users.watch({
      userId: userEmail,
      requestBody: {
        topicName: `projects/mail-tester-420819/topics/emails`,
        labelIds: ["INBOX"],
        labelFilterAction: "include",
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
    res.send("Authentication successful! You can now close this page.");
  } catch (error) {
    console.error("Error during token exchange:", error);
    res.status(500).send("Authentication failed.");
  }
});

app.get("/", (req, res) => {
  res.status(200).send(`<h1>Hello Mailer</h1>
    <p>Send an email by sending a GET request to /send-email?email=<youremail></p>
    <p>Schedule an email by sending a GET request to /schedule?email=<youremail></p>
    <p>Add temp addreses by going to /schedule/test</p>
    <p>View Pending Scheduled Emails in /schedule/view</p>
    <p>Checkout Email Events in /updates</p>
    `);
});

app.get("/send-email", (req, res) => {
  const { email } = req.query;
  console.log(email);

  let mailIds = [];
  if (!email) {
    mailIds.push({ email: "rajxryn@gmail.com" });
  }
  if (email) {
    mailIds.push({ email });
  }

  mailIds.forEach(async (email) => {
    await sendMail(email, oAuth2Client);
  });
  res.send(`Emails Sent to ${mailIds.map((mail) => mail.email).join(", ")}`);
});

app.get("/schedule", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).send("Email is required");
    }
    console.log(email);

    await db.scheduledEmails.create({
      data: {
        email: email,
        status: "PENDING",
      },
    });
    res.send(`Email Scheduled to ${email}`);
  } catch (error) {
    console.error("Error scheduling email:", error);
    res.status(500).send("Error scheduling email");
  }
});

app.get("/schedule/test", async (req, res) => {
  try {
    const emails = [
      "androvalleyprince@gmail.com",
      "rajxryn@gmail.com",
      "abhiraj@workerai.co",
      "anshuman@workerai.co",
    ];

    await db.scheduledEmails.createMany({
      data: emails.map((e) => ({ email: e })),
    });
    res.send(`Email Scheduled \n ${emails}`);
  } catch (error) {
    console.error("Error scheduling email:", error);
    res.status(500).send("Error scheduling email");
  }
});

app.get("/schedule/view", scheduleView);

app.get("/track.gif", trackOpens);

app.post("/track", (req, res) => {
  res.status(204).end();
  trackReplies(req, oAuth2Client);
});

app.get("/updates", viewUpdates);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

cron.schedule("*/10 * * * *", async () => {
  console.log(
    "Sending any pending Scheduled Emails At ",
    new Date().toISOString()
  );
  const emails = await db.scheduledEmails.findMany({
    where: {
      status: "PENDING",
    },
  });
  console.log(emails);
  const emailPromise = emails.map(async (email) => {
    return sendMail(email, oAuth2Client);
  });

  await Promise.all(emailPromise);
});

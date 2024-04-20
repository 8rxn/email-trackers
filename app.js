import express from "express";
import { sendMail } from "./handlers/mail.js";
import { trackOpens, trackReplies } from "./handlers/track.js";
import { google } from "googleapis";
import { config } from "dotenv";
import bodyparser from "body-parser";
import { viewUpdates } from "./handlers/updates.js";

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
    <p>Checkout Email Events in /updates</p>`);
});

app.get("/send-email", (req, res) => {
  const { email } = req.query;
  console.log(email);

	let mailIds = [  ];
if(!email){
mailIds.push({ email:"rajxryn@gmail.com" });
}
	if (email) {
    mailIds.push({ email });
  }

  mailIds.forEach(async (email) => {
    const result = await sendMail(email, oAuth2Client);
    console.log(result);
    
  });
	res
      .send(`Emails Sent to ${mailIds.map((mail) => mail.email).join(", ")}`);
});

app.get("/track.gif", trackOpens);

app.post("/track", (req, res) => {
  res.status(204).end();
  trackReplies(req, oAuth2Client);
});

app.get("/updates", viewUpdates);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

// import fs from "fs";
// import { readFileAsync } from "../lib/utils.js";
import { google } from "googleapis";
import db from "../lib/db.js";

export async function trackOpens(req, res) {
  const { email, id } = req.query;

  if (!email || !id) {
    return res.status(400).send("Missing email or id");
  }

  res.sendFile("transparent.gif", { root: "." });

  console.log("Tracking the email opening");
  await db.tracker.upsert({
    data: {
      type: "OPEN",
      emailId: id,
    },
  });
}

let processedHistoryIds = new Set();

export async function trackReplies(req, oAuth2Client) {
  const message = req.body.message;
  //   console.log({ message });
  const messageId = message.messageId;
  console.log({ messageId });
  const emailData = Buffer.from(message.data, "base64").toString("utf-8");

  //   console.log("Received message ID:", messageId);
  console.log("Email notification data:", emailData);
  console.log(emailData);
  let data;
  console.log(typeof emailData);
  try {
    data = JSON.parse(emailData);
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
  // console.log(processedHistoryIds, data.historyId);
  if (processedHistoryIds.has(data.historyId)) {
    console.log("Duplicate message received, skipping processing.");
    return;
  }
  if (data.historyId) {
    processedHistoryIds.add(data.historyId);

    try {
      const response = await fetchLatestEmail(oAuth2Client, "me");
      //      console.log(response.data.messages);

      for (const message of response.data.messages) {
        const email = await fetchEmail(oAuth2Client, message.id);
        const parsedEmail = extractHtmlContent(email.payload);
        //      console.log(parsedEmail);
        if (parsedEmail) {
          const id = await findID(parsedEmail);
          if (
            id &&
            email.payload.headers.find(
              (header) => header.name === "In-Reply-To"
            ) &&
            email.payload.headers.find((header) => header.name === "From")
              .value !== message.email
          ) {
            //         console.log(email.payload.headers);
            // const fromAddress = email.payload.headers.find(
            //   (header) => header.name.toLowerCase() === "from"
            // ).value;

            logReplies(id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching email:", error);
    }
  }
}

function fetchLatestEmail(auth, userId) {
  const gmail = google.gmail({ version: "v1", auth });
  return gmail.users.messages.list({
    userId: userId,
    maxResults: 1,
  });
}

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
          return html;
        }
      }
    }
  }
  return null;
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
  const regex = /<img\s+[^>]*src="[^"]*\&amp;id=([^"&]+)/;
  const match = emailHtml.match(regex);

  return match ? match[1] : null;
}

async function logReplies(id) {
  console.log({ id });

  await db.tracker.upsert({
    data: {
      type: "REPLY",
      emailId: id,
    },
  });
}

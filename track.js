import fs from "fs";
import { readFileAsync } from "./lib/utils.js";
import { google } from "googleapis";

export async function trackOpens(req, res) {
  const { email, id } = req.query;

  const filePath = "dataStore.json";

  let logs = JSON.parse(await readFileAsync(filePath));

  if (!email || !id) {
    return res.status(400).send("Missing email or id");
  }

  const log = {
    email,
    id,
    timeStamp: new Date().toISOString(),
    action: "Opened",
  };
  console.log(log);

  logs.logs.push(log);

  const updatedJsonData = JSON.stringify(logs, null, 2);

  fs.writeFile(filePath, updatedJsonData, "utf8", (err) => {
    if (err) {
      console.error("Error writing to file:", err);
      return;
    }
    console.log("Successfully updated the file with new data.");
  });

  console.log("Tracking the email");

  res.type("image/png");
  res.send();
}

export async function trackReplies(req, res, oAuth2Client) {
  res.status(204).end();

  const message = req.body.message;
  //   console.log({ message });
  const messageId = message.messageId;
  const emailData = Buffer.from(message.data, "base64").toString("utf-8");

  //   console.log("Received message ID:", messageId);
  console.log("Email notification data:", emailData);
  const data = JSON.parse(emailData);
  if (data.historyId) {
    try {
      const response = await fetchLatestEmail(oAuth2Client, "me");
      //   console.log(response.data.messages);

      for (const message of response.data.messages) {
        const email = await fetchEmail(oAuth2Client, message.id);
        const parsedEmail = extractHtmlContent(email.payload);
        // console.log(parsedEmail);
        if (parsedEmail) {
          const id = findID(parsedEmail);
          if (id) {
            const fromAddress = email.payload.headers.find(
              (header) => header.name.toLowerCase() === "from"
            ).value;

            console.log(fromAddress);

            logReplies(fromAddress, match[1]);
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
          findID(html);
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
  const regex = /<img\s+[^>]*src="[^"]*\?id=([^"&]+)/;
  const match = emailHtml.match(regex);

  console.log(match ? match[1] : null);
}

async function logReplies(email, id) {
  const filePath = "dataStore.json";

  let logs = JSON.parse(await readFileAsync(filePath));

  logs.logs.push({
    email,
    id,
    timeStamp: new Date().toISOString(),
    action: "Replied",
  });

  const updatedJsonData = JSON.stringify(logs, null, 2);

  fs.writeFile(filePath, updatedJsonData, "utf8", (err) => {
    if (err) {
      console.error("Error writing to file:", err);
      return;
    }
    console.log("Successfully updated the file with new data.");
  });
}

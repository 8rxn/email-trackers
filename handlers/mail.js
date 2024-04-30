import { createTransport } from "nodemailer";
import { config } from "dotenv";
import { readFileAsync } from "../lib/utils.js";

import db from "../lib/db.js";

config();

const filePath = "./sample.html";

export async function sendMail(email, oAuth2Client, scheduled) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "rajxryn@gmail.com",
        clientId: process.env.CLIENTID,
        clientSecret: process.env.CLIENTSECRET,
        refreshToken: process.env.REFRESHTOKEN,
        accessToken: accessToken,
      },
    });

    const htmlEmail = await readFileAsync(filePath);

    const dbEmail = await db.emailLogs.create({
      data: { emailTo: email.email },
    });

    const endpoint = process.env.ENDPOINT;

    const mailOptions = {
      from: "Raj from Some Test Email <test-email@rajaryan.work>",
      to: email.email,
      subject: "Test Email from Node.js using Nodemailer & Gmail OAuth2.0",
      text: "Just Testing Out whether you see my email or not",
      cc: email?.cc,
      html: htmlEmail.replace(
        `</body>`,
        `<img src="${endpoint}/track.gif?email=${email.email}&id=${dbEmail.id}" width="1" height="1" display="none" /></body>`
      ),
    };

    if (!mailOptions.html) {
      return "Abort due to no mail options, missing html";
    }

    const result = await transport.sendMail(mailOptions);

    if (scheduled) {
      db.scheduledEmails.update({
        data: { logsId: dbEmail.id, sentAt: new Date(), status: "SENT" },
      });
    }

    return result;
  } catch (error) {
    return error;
  }
}

export default sendMail;

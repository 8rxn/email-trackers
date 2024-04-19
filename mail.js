import { createTransport } from "nodemailer";
import { google } from "googleapis";
import { readFile } from "fs";
import { config } from "dotenv";

import { randomUUID } from "crypto";

// Change this File Path to Change Templates:

config();

const filePath = "./sample.html";

function readFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export async function sendMail(email,oAuth2Client) {
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

    const uniqueID = randomUUID();

    const endpoint = "https://via.placeholder.com/150";

    const mailOptions = {
      from: "Raj from Some Test Email <raj@rajaryan.work>",
      to: email.email,
      subject: "Test Email from Node.js using Nodemailer & Gmail OAuth2.0",
      text: "Just Testing Out whether you see my email or not",
      cc: email?.cc,
      html: htmlEmail.replace(
        `</body>`,
        `<img src="${endpoint}/footer.gif?user=${email.email}?id=${uniqueID}" width="1" height="1" /></body>`
      ),
    };

    if (!mailOptions.html) {
      return "Abort due to no mail options, missing html";
    }

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

export default sendMail;

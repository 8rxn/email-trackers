import fs from "fs";

function readFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export async function track(req, res) {
  const { email, id } = req.query;

  const filePath = "dataStore.json";

  let logs = JSON.parse(await readFileAsync(filePath));

  if (!email || !id) {
    return res.status(400).send("Missing email or id");
  }

  logs.logs.push({ email, id, timeStamp: new Date().toISOString() });

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

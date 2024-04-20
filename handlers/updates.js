import { readFileAsync } from "../lib/utils.js";

export async function viewUpdates(req, res) {
  const filePath = "./dataStore.json";
  const logs = JSON.parse(await readFileAsync(filePath));

  res.send(`<h1>Updates from the Mails</h1> 
  <p>${logs.logs.map((log) => JSON.stringify(log).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')).join("<br>")}</p>`);
}

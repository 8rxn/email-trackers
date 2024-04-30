import db from "../lib/db.js";

export async function viewUpdates(req, res) {
  const logs = await db.emailLogs.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      Tracker: true,
      ScheduledEmails: false,
    },
  });

  logs.forEach((log) => {
    log.Tracker.forEach((track) => {
      console.log(track);
    });
  });

  res.send(`<h1>Updates from the Mails</h1> 
  <p>${logs
    .map((log) =>
      JSON.stringify(log)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
    )
    .join("<br>")}</p>`);
}

import db from "../lib/db.js";

export async function viewUpdates(req, res) {
  const logs = await db.emailLogs.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      Tracker: true,
      ScheduledEmails: false,
    },
  });

  let htmlOutput = `<h1>Updates from the Mails</h1>
  <table border="1">
    <tr>
      <th>ID</th>
      <th>Email To</th>
      <th>Sent At</th>
      <th>Latest Open At</th>
      <th>Latest Reply At</th>
    </tr>`;

  logs.forEach((log) => {
    const latestOpen = log.Tracker.filter(
      (track) => track.type === "OPEN"
    ).reduce(
      (latest, track) =>
        !latest || track.createdAt > latest.createdAt ? track : latest,
      null
    );

    const latestReply = log.Tracker.filter(
      (track) => track.type === "REPLY"
    ).reduce(
      (latest, track) =>
        !latest || track.createdAt > latest.createdAt ? track : latest,
      null
    );

    htmlOutput += `
    <tr>
      <td style="padding: 2px 10px;">${log.id}</td>
      <td style="padding: 2px 10px;">${log.emailTo}</td>
      <td style="padding: 2px 10px;">${log.createdAt.toString()}</td>
      <td style="padding: 2px 10px;">${
        latestOpen ? latestOpen.createdAt.toString() : "Haven't Opened yet"
      }</td>
      <td style="padding: 2px 10px;">${
        latestReply ? latestReply.createdAt.toString() : "Haven't Replied yet"
      }</td>
    </tr>`;
  });

  htmlOutput += `</table>`;

  const trackers = await db.tracker.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      email: true,
    },
  });

  htmlOutput += `<h2>All Trackers</h2>`;
  htmlOutput += `<table border="1">
    <tr>
      <th>ID</th>
      <th>Email Address</th>
      <th>Type</th>
      <th>Created At</th>
    </tr>`;
  trackers.forEach((track) => {
    htmlOutput += `
    <tr>
      <td style="padding: 2px 10px;">${track.id}</td>
      <td style="padding: 2px 10px;">${track.email.emailTo}</td>
      <td style="padding: 2px 10px;">${track.type}</td>
      <td style="padding: 2px 10px;">${track.createdAt.toString()}</td>
    </tr>`;
  });

  htmlOutput += `</table>`;

  res.send(htmlOutput);
}

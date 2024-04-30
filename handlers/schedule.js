import db from "../lib/db.js";

async function scheduleView(req, res) {
  const emails = await db.scheduledEmails.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  const htmlOutput = `<h1>Pending Scheduled Mails</h1>
  
  <p>Emails Are sent every 10 minutes to all pending scheduled addresses</p>
  <br/>
  <p>Add temp addreses by going to /schedule/test</p>
  

  <table border="1">
    <tr>
      <th>ID</th>
      <th>Email To</th>
      <th>Created At</th>
    </tr>`;

  emails.forEach((e) => {
    htmlOutput += `;<tr>
    <td style="padding: 2px 10px;">${e.id}</td>
    <td style="padding: 2px 10px;">${e.email}</td>
    <td style="padding: 2px 10px;">${e.createdAt}</td>
  </tr>`;
  });
}

export default scheduleView;

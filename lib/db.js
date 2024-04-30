// app.js
// import postgres from "postgres";
// import dotenv from "dotenv";

// dotenv.config();

// let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

// let sql;

// export async function init() {
//   sql = postgres({
//     host: PGHOST,
//     database: PGDATABASE,
//     username: PGUSER,
//     password: PGPASSWORD,
//     port: 5432,
//     ssl: "require",
//     connection: {
//       options: `project=${ENDPOINT_ID}`,
//     },
//   });
// }

// export { sql };


import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["query", "info", "warn","error"] });

export default prisma;
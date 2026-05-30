import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(path.join(__dirname, "..", ".env.local"));
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      process.env[key.trim()] = values.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  });
}

async function run() {
  console.log("Connecting to database to alter table...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log("Adding column data_saldo_inicial to contas_financeiras if not exists...");
    await connection.execute(`
      ALTER TABLE contas_financeiras
      ADD COLUMN IF NOT EXISTS data_saldo_inicial DATE DEFAULT '2025-12-30'
    `);
    console.log("Updating existing accounts to have data_saldo_inicial = '2025-12-30' if null...");
    await connection.execute(`
      UPDATE contas_financeiras
      SET data_saldo_inicial = '2025-12-30'
      WHERE data_saldo_inicial IS NULL OR data_saldo_inicial = '0000-00-00'
    `);
    console.log("✅ Column added and values updated successfully!");
  } catch (error) {
    console.error("❌ SQL Alter failed:", error.message);
  } finally {
    await connection.end();
  }
}

run();

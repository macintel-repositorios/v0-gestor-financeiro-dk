import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually load env variables from .env.local if not already loaded
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
  console.log("Connecting to database:", process.env.DB_HOST, process.env.DB_NAME);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const sqlPath = path.resolve(path.join(__dirname, "create-fluxo-caixa-tables.sql"));
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");

    // Split statements by semicolon (crude but works for standard schemas)
    const statements = sqlContent
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const stmt of statements) {
      console.log("Executing statement...");
      await connection.execute(stmt);
    }

    console.log("✅ Fluxo de Caixa migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();

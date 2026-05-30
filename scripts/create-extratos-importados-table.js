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
  console.log("Connecting to database to create extratos_importados table...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log("Creating table extratos_importados if not exists...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS extratos_importados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conta_id INT NOT NULL,
        ano_mes VARCHAR(7) NOT NULL,
        nome_arquivo VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conta_id) REFERENCES contas_financeiras(id) ON DELETE CASCADE,
        UNIQUE KEY uq_conta_periodo (conta_id, ano_mes)
      )
    `);
    console.log("✅ Table extratos_importados created successfully!");
  } catch (error) {
    console.error("❌ SQL execution failed:", error.message);
  } finally {
    await connection.end();
  }
}

run();

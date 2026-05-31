import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
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
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    // 1. Check if 2026-08, 2026-09, 2026-10 statements are already imported for account 5
    const [imported2026] = await connection.execute(
      "SELECT id, conta_id, ano_mes, nome_arquivo, created_at FROM extratos_importados WHERE conta_id = 5 AND ano_mes IN ('2026-08', '2026-09', '2026-10')"
    );
    console.log("\n--- Already Imported Statements for Nubank in 2026 ---");
    console.log(imported2026);

    // 2. Check if there are transactions in 2026 for those months
    const [txCount2026] = await connection.execute(
      "SELECT count(*) as count, DATE_FORMAT(data, '%Y-%m') as mes FROM transacoes_financeiras WHERE conta_id = 5 AND data >= '2026-08-01' AND data <= '2026-10-31' AND ativo = 1 GROUP BY mes"
    );
    console.log("\n--- Transactions Count in 2026 for Nubank (Aug-Oct) ---");
    console.log(txCount2026);

  } catch (error) {
    console.error("❌ Checking failed:", error);
  } finally {
    await connection.end();
  }
}

run();

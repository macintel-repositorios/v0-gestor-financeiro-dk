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
    // Start transaction
    await connection.beginTransaction();
    console.log("Database transaction started.");

    // 1. Update transactions from 2027 to 2026 for account 5 (Nubank)
    const [txResult] = await connection.execute(
      `UPDATE transacoes_financeiras 
       SET data = DATE_SUB(data, INTERVAL 1 YEAR) 
       WHERE data LIKE '2027%' AND conta_id = 5 AND ativo = 1`
    );
    console.log(`Updated ${txResult.affectedRows} transactions in transacoes_financeiras.`);

    // 2. Update imported statements log from 2027 to 2026 for account 5
    const [importResult] = await connection.execute(
      `UPDATE extratos_importados 
       SET ano_mes = REPLACE(ano_mes, '2027-', '2026-') 
       WHERE conta_id = 5 AND ano_mes LIKE '2027%'`
    );
    console.log(`Updated ${importResult.affectedRows} records in extratos_importados.`);

    // Commit transaction
    await connection.commit();
    console.log("✅ Transaction committed successfully!");

    // Verification queries
    console.log("\n--- Verification Queries ---");
    
    // Check 2027 transactions remaining
    const [rem2027] = await connection.execute(
      "SELECT count(*) as count FROM transacoes_financeiras WHERE data LIKE '2027%' AND ativo = 1"
    );
    console.log(`Remaining 2027 active transactions: ${rem2027[0].count}`);

    // Check 2026 transactions for Nubank in Aug-Oct
    const [new2026] = await connection.execute(
      "SELECT count(*) as count, DATE_FORMAT(data, '%Y-%m') as mes FROM transacoes_financeiras WHERE conta_id = 5 AND data >= '2026-08-01' AND data <= '2026-10-31' AND ativo = 1 GROUP BY mes"
    );
    console.log("New 2026 Nubank transactions count:");
    console.log(new2026);

    // Check statement log for Nubank in 2026
    const [newLogs2026] = await connection.execute(
      "SELECT id, conta_id, ano_mes, nome_arquivo FROM extratos_importados WHERE conta_id = 5 AND ano_mes IN ('2026-08', '2026-09', '2026-10')"
    );
    console.log("New 2026 Nubank statement logs:");
    console.log(newLogs2026);

  } catch (error) {
    console.error("❌ Fix failed, rolling back changes:", error);
    await connection.rollback();
  } finally {
    await connection.end();
  }
}

run();

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
    // 1. Get credit card accounts
    const [accounts] = await connection.execute(
      "SELECT id, nome, tipo, saldo_inicial, data_saldo_inicial FROM contas_financeiras WHERE tipo = 'cartao_credito'"
    );
    console.log("\n--- Credit Card Accounts ---");
    console.log(accounts);

    // 2. Count 2027 transactions
    const [transactionsCount] = await connection.execute(
      "SELECT count(*) as count, conta_id, tipo FROM transacoes_financeiras WHERE data LIKE '2027%' AND ativo = 1 GROUP BY conta_id, tipo"
    );
    console.log("\n--- 2027 Transactions Count (grouped by account and type) ---");
    console.log(transactionsCount);

    // 3. Get 2027 transactions details (up to 10)
    const [transactionsDetails] = await connection.execute(
      "SELECT t.id, t.conta_id, c.nome as conta_nome, t.data, t.descricao, t.tipo, t.valor, t.categoria FROM transacoes_financeiras t JOIN contas_financeiras c ON t.conta_id = c.id WHERE t.data LIKE '2027%' AND t.ativo = 1 LIMIT 10"
    );
    console.log("\n--- Sample 2027 Transactions (up to 10) ---");
    console.log(transactionsDetails);

    // 4. Get 2027 imported statements log
    const [importedStatements] = await connection.execute(
      "SELECT id, conta_id, ano_mes, nome_arquivo, created_at FROM extratos_importados WHERE ano_mes LIKE '2027%'"
    );
    console.log("\n--- 2027 Imported Statements Log ---");
    console.log(importedStatements);

  } catch (error) {
    console.error("❌ Inspection failed:", error);
  } finally {
    await connection.end();
  }
}

run();

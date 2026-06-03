const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || '3306'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  console.log("Reverting false positive transfers (IDs 161 and 39)...");

  // Revert customer invoice to Faturamento
  await pool.execute(
    "UPDATE transacoes_financeiras SET categoria = 'Faturamento' WHERE id = 161"
  );

  // Revert supplier payment to Fornecedores
  await pool.execute(
    "UPDATE transacoes_financeiras SET categoria = 'Fornecedores' WHERE id = 39"
  );

  console.log("Revert complete!");

  pool.end();
}

run();

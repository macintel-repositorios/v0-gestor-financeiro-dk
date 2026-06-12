const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value.trim();
  }
});

async function run() {
  const pool = mysql.createPool({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: Number(env.DB_PORT || '3306'),
  });

  try {
    const [txs] = await pool.execute(
      "SELECT id, data, descricao, tipo, valor, categoria FROM transacoes_financeiras WHERE conta_id = 6 ORDER BY data ASC, id ASC"
    );

    // Scenario 1: Keep all, start with 0
    let bal1 = 0;
    // Scenario 2: Keep all, start with 993.10
    let bal2 = 993.10;
    // Scenario 3: Ignore "Renda Fixa" completely, start with 0
    let bal3 = 0;
    // Scenario 4: Ignore "Renda Fixa" completely, start with 993.10
    let bal4 = 993.10;

    txs.forEach((t) => {
      const val = parseFloat(t.valor);
      const isRendaFixa = t.descricao.includes("Renda Fixa");

      // Scenario 1 & 2
      if (t.tipo === 'entrada') {
        bal1 += val;
        bal2 += val;
      } else {
        bal1 -= val;
        bal2 -= val;
      }

      // Scenario 3 & 4
      if (!isRendaFixa) {
        if (t.tipo === 'entrada') {
          bal3 += val;
          bal4 += val;
        } else {
          bal3 -= val;
          bal4 -= val;
        }
      }
    });

    console.log("Scenario 1 (Keep all, start 0):", bal1);
    console.log("Scenario 2 (Keep all, start 993.10):", bal2);
    console.log("Scenario 3 (Ignore Renda Fixa, start 0):", bal3);
    console.log("Scenario 4 (Ignore Renda Fixa, start 993.10):", bal4);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();

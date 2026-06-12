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
    console.log("1. Resetting PagBank (id = 6) initial balance to 0.00...");
    const [accUpdate] = await pool.execute(
      "UPDATE contas_financeiras SET saldo_inicial = 0.00 WHERE id = 6"
    );
    console.log("Account update result:", accUpdate);

    console.log("2. Deleting transactions on 2026-01-02 and 2026-01-05 for PagBank...");
    const [txDelete] = await pool.execute(
      "DELETE FROM transacoes_financeiras WHERE conta_id = 6 AND data IN ('2026-01-02', '2026-01-05')"
    );
    console.log("Transaction delete result:", txDelete);

    // Verify current state
    const [updatedAcc] = await pool.execute(
      "SELECT id, nome, saldo_inicial FROM contas_financeiras WHERE id = 6"
    );
    console.log("Verified Account info:", updatedAcc);

    const [remainingTxs] = await pool.execute(
      "SELECT COUNT(*) as count FROM transacoes_financeiras WHERE conta_id = 6 AND data IN ('2026-01-02', '2026-01-05')"
    );
    console.log("Verified remaining transactions on 02/01 and 05/01 (should be 0):", remainingTxs[0].count);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();

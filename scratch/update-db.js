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
    console.log("Updating PagBank (id = 6) initial balance to 1002.10...");
    const [result] = await pool.execute(
      "UPDATE contas_financeiras SET saldo_inicial = 1002.10 WHERE id = 6"
    );
    console.log("Update result:", result);

    const [updated] = await pool.execute(
      "SELECT id, nome, saldo_inicial FROM contas_financeiras WHERE id = 6"
    );
    console.log("Updated Account info:", updated);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();

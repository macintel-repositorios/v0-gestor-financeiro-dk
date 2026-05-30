const fs = require('fs');
const path = require('path');

const projectPath = 'c:/Users/User/OneDrive/Área de Trabalho/projetos/gestor-financeiro - 80';

const envFile = fs.readFileSync(path.join(projectPath, '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) {
    let v = m[2] || '';
    v = v.trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
    env[m[1]] = v;
  }
});

const mysql = require(path.join(projectPath, 'node_modules/mysql2/promise'));
mysql.createConnection({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: Number(env.DB_PORT || 3306)
}).then(async (c) => {
  const [nullDates] = await c.execute(`
    SELECT COUNT(*) as count, SUM(valor) as sum
    FROM boletos 
    WHERE status = 'pago' AND data_pagamento IS NULL
  `);
  console.log("Paid boletos with NULL data_pagamento:", nullDates);

  const [dateComparison] = await c.execute(`
    SELECT id, numero, valor, data_vencimento, data_pagamento
    FROM boletos
    WHERE status = 'pago' AND data_pagamento IS NOT NULL
    LIMIT 10
  `);
  console.log("Sample of paid boletos with dates:", dateComparison);

  await c.end();
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});

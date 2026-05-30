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
  const [clients] = await c.execute(`
    SELECT id, nome FROM clientes LIMIT 50
  `);
  console.log("Clients sample:", clients);

  const [boletosSample] = await c.execute(`
    SELECT b.id, b.numero, b.valor, c.nome as cliente_nome
    FROM boletos b
    JOIN clientes c ON b.cliente_id = c.id
    LIMIT 20
  `);
  console.log("Boletos sample with client names:", boletosSample);

  await c.end();
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});

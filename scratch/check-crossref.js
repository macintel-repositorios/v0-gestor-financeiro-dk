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
  // Let's search boletos table for any invoice/nota number from the Contabilizei descriptions
  const [matchingBoletos] = await c.execute(`
    SELECT id, numero, valor, cliente_id, status 
    FROM boletos 
    WHERE numero LIKE '%729862622%' OR numero_nota LIKE '%729862622%' OR observacoes LIKE '%729862622%'
  `);
  console.log("Matching Boletos for 729862622:", matchingBoletos);

  const [macintelClient] = await c.execute(`
    SELECT id, nome FROM clientes WHERE nome LIKE '%MACINTEL%'
  `);
  console.log("MACINTEL Client:", macintelClient);

  if (macintelClient.length > 0) {
    const [macintelBoletos] = await c.execute(`
      SELECT id, numero, valor, data_vencimento, status 
      FROM boletos 
      WHERE cliente_id = ?
    `, [macintelClient[0].id]);
    console.log("MACINTEL Boletos:", macintelBoletos);
  }

  await c.end();
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});

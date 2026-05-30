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
  const [boletosStats] = await c.execute('SELECT status, COUNT(*), SUM(valor), SUM(valor_pago) FROM boletos GROUP BY status');
  console.log("Boletos Stats:", boletosStats);

  const [contas] = await c.execute('SELECT id, nome FROM contas_financeiras');
  console.log("Contas:", contas);

  const [transacoesStats] = await c.execute(`
    SELECT c.nome as conta, t.tipo, COUNT(*), SUM(t.valor) 
    FROM transacoes_financeiras t 
    JOIN contas_financeiras c ON t.conta_id = c.id 
    WHERE t.ativo = 1 
    GROUP BY c.nome, t.tipo
  `);
  console.log("Transacoes Stats:", transacoesStats);

  // Let's check some examples of entries in Contabilizei and Asaas
  const [contabilizeiInflows] = await c.execute(`
    SELECT t.data, t.valor, t.descricao 
    FROM transacoes_financeiras t 
    JOIN contas_financeiras c ON t.conta_id = c.id 
    WHERE t.ativo = 1 AND t.tipo = 'entrada' AND c.nome LIKE '%Contabilizei%'
    LIMIT 20
  `);
  console.log("Contabilizei Inflow Examples:", contabilizeiInflows);

  await c.end();
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});

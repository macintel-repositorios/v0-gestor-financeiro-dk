const mysql = require('mysql2/promise');
const fs = require('fs');

function loadEnv() {
  if (fs.existsSync('.env.local')) {
    const content = fs.readFileSync('.env.local', 'utf8');
    content.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
      }
    });
  }
}

async function main() {
  loadEnv();
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || '3306'),
  });

  try {
    const [rows] = await pool.execute(`
      SELECT 
        c.nome as conta_nome,
        t.categoria,
        t.tipo,
        SUBSTRING(t.data, 1, 7) as ano_mes,
        count(*) as qtd,
        sum(t.valor) as total_valor
      FROM transacoes_financeiras t
      JOIN contas_financeiras c ON t.conta_id = c.id
      WHERE t.ativo = 1 AND t.categoria = 'Outras Receitas'
      GROUP BY c.nome, t.categoria, t.tipo, SUBSTRING(t.data, 1, 7)
    `);
    console.log('--- Outras Receitas Ativas Restantes no DB ---');
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();

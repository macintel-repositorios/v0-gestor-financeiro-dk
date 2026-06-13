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
    console.log("Searching for transactions matching fee keywords that are not classified as 'Tarifas Bancárias'...");
    
    // Look at matches first
    const queryStr = `
      SELECT id, descricao, categoria, valor, data 
      FROM transacoes_financeiras 
      WHERE (
        descricao LIKE '%taxa%pix%' 
        OR descricao LIKE '%taxa%mensage%' 
        OR descricao LIKE '%taxa%boleto%' 
        OR descricao LIKE '%tarifa%intermed%'
        OR descricao LIKE '%taxa%admin%'
        OR descricao LIKE '%taxa%antec%'
      ) AND categoria != 'Tarifas Bancárias'
    `;
    const [matches] = await pool.execute(queryStr);
    console.log(`Found ${matches.length} transactions needing recategorization:`);
    matches.forEach(m => {
      console.log(`- ID: ${m.id} | Date: ${m.data.toISOString().split('T')[0]} | Value: ${m.valor} | Cat: ${m.categoria} | Desc: ${m.descricao}`);
    });

    if (matches.length > 0) {
      console.log("\nUpdating transactions to 'Tarifas Bancárias'...");
      const updateStr = `
        UPDATE transacoes_financeiras 
        SET categoria = 'Tarifas Bancárias' 
        WHERE (
          descricao LIKE '%taxa%pix%' 
          OR descricao LIKE '%taxa%mensage%' 
          OR descricao LIKE '%taxa%boleto%' 
          OR descricao LIKE '%tarifa%intermed%'
          OR descricao LIKE '%taxa%admin%'
          OR descricao LIKE '%taxa%antec%'
        ) AND categoria != 'Tarifas Bancárias'
      `;
      const [updateResult] = await pool.execute(updateStr);
      console.log("Update result:", updateResult);
    } else {
      console.log("No transactions needed updating.");
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();

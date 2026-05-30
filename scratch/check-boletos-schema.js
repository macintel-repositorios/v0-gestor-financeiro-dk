const fs = require('fs');
const path = require('path');

const projectPath = 'c:/Users/User/OneDrive/Área de Trabalho/projetos/gestor-financeiro - 80';

try {
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
    const [boletosCols] = await c.execute('DESCRIBE boletos');
    console.log("boletos table columns:", boletosCols);
    const [recibosCols] = await c.execute('DESCRIBE recibos');
    console.log("recibos table columns:", recibosCols);
    await c.end();
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}

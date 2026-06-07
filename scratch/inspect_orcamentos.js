const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'srv1079.hstgr.io',
    user: 'u880459407_gestorFinanc',
    password: 'Cfh@.0433',
    database: 'u880459407_gestorFinanc',
    port: 3306
  });

  try {
    const [columns] = await connection.execute('DESCRIBE orcamentos');
    console.log('orcamentos columns:', columns);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

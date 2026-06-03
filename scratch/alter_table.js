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
    // Add columns or run alter table
    await connection.execute('ALTER TABLE equipamentos ADD COLUMN salario_minimo DECIMAL(10,2) DEFAULT 0.00');
    console.log('Successfully added salario_minimo column to equipamentos table!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

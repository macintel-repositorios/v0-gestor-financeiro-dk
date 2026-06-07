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
    const [rows] = await connection.execute(`
      SELECT 
        p.*,
        tp.nome as categoria_nome,
        tp.codigo as categoria_codigo,
        tp.id as categoria_id,
        m.nome as marca_nome,
        m.sigla as marca_sigla,
        m.id as marca_id
      FROM produtos p
      LEFT JOIN tipos_produtos tp ON p.tipo = tp.nome
      LEFT JOIN marcas m ON p.marca = m.nome
      WHERE p.id = ?
    `, ['910']);
    console.log('Product 910:', rows);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

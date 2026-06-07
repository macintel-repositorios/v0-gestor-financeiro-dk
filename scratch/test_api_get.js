// Test database query directly
// Let's write a JS script that mimics the database query in the GET handler.

const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'srv1079.hstgr.io',
    user: 'u880459407_gestorFinanc',
    password: 'Cfh@.0433',
    database: 'u880459407_gestorFinanc',
    port: 3306
  });

  const numero = '20260509002';

  try {
    const [orcamentos] = await connection.execute(`
      SELECT 
        o.*,
        c.nome as cliente_nome,
        c.codigo as cliente_codigo
      FROM orcamentos o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      WHERE o.numero = ?
    `, [numero]);

    console.log('Orcamento:', orcamentos);

    const [itens] = await connection.execute(`
      SELECT 
        oi.*,
        p.codigo as produto_codigo,
        p.descricao as produto_descricao,
        p.unidade as produto_unidade,
        p.ncm as produto_ncm
      FROM orcamentos_itens oi
      LEFT JOIN produtos p ON oi.produto_id = p.id
      WHERE oi.orcamento_numero = ?
      ORDER BY oi.ordem ASC, oi.created_at ASC
    `, [numero]);

    console.log('Itens loaded from DB:', itens);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

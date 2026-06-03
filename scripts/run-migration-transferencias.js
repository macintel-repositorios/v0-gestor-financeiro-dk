const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || '3306'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  console.log("Connected to database:", process.env.DB_NAME);

  try {
    // 1. Ensure "Transferências entre contas" exists in categories
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categorias_financeiras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        tipo ENUM('entrada', 'saida') NOT NULL DEFAULT 'saida',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.execute(
      "INSERT IGNORE INTO categorias_financeiras (nome, tipo) VALUES ('Transferências entre contas', 'saida')"
    );
    console.log("Seeded 'Transferências entre contas' category.");

    // 2. Fetch all active transactions
    const [transactions] = await pool.execute(`
      SELECT t.id, t.data, t.valor, t.tipo, t.descricao, c.nome as conta_nome, t.conta_id, c.tipo as conta_tipo
      FROM transacoes_financeiras t
      JOIN contas_financeiras c ON t.conta_id = c.id
      WHERE t.ativo = 1
    `);

    console.log(`Found ${transactions.length} active transactions.`);

    // Group transactions by date and value to find pairs
    const pairs = {};
    transactions.forEach((t) => {
      let dateKey = "0000-00-00";
      if (t.data) {
        try {
          const d = new Date(t.data);
          if (!isNaN(d.getTime())) {
            dateKey = d.toISOString().split("T")[0];
          }
        } catch (err) {}
      }
      const valueKey = parseFloat(t.valor).toFixed(2);
      const key = `${dateKey}_${valueKey}`;
      if (!pairs[key]) pairs[key] = [];
      pairs[key].push(t);
    });

    let updatedCount = 0;
    
    for (const key in pairs) {
      const list = pairs[key];
      if (list.length >= 2) {
        // Separate inflows and outflows
        const entradas = list.filter((x) => x.tipo === "entrada");
        const saidas = list.filter((x) => x.tipo === "saida");
        
        // Match them (if we have matching entrada and saida)
        const matchCount = Math.min(entradas.length, saidas.length);
        
        for (let i = 0; i < matchCount; i++) {
          const ent = entradas[i];
          const sai = saidas[i];
          
          // Update category to "Transferências entre contas"
          await pool.execute(
            "UPDATE transacoes_financeiras SET categoria = 'Transferências entre contas' WHERE id IN (?, ?)",
            [ent.id, sai.id]
          );
          
          console.log(`Categorized Pair: R$ ${parseFloat(ent.valor).toFixed(2)} on ${key} | IDs: [${ent.id}, ${sai.id}]`);
          updatedCount += 2;
        }
      }
    }

    console.log(`Migration complete! Successfully categorized ${updatedCount} transactions as 'Transferências entre contas'.`);
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await pool.end();
  }
}

run();

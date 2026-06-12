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
    // 1. Get accounts mapping
    const [accounts] = await pool.execute("SELECT id, nome, tipo FROM contas_financeiras");
    const accMap = {};
    accounts.forEach(a => {
      accMap[a.id] = `${a.nome} (${a.tipo === 'conta_corrente' ? 'CC' : a.tipo})`;
    });

    // 2. Query all transactions in Jan 2026 that could be transfers
    const [txs] = await pool.execute(`
      SELECT id, conta_id, data, descricao, tipo, valor, categoria 
      FROM transacoes_financeiras 
      WHERE data >= '2026-01-01' AND data <= '2026-01-31'
        AND (
          categoria = 'Transferências entre contas' 
          OR descricao LIKE '%transferencia%' 
          OR descricao LIKE '%transferência%' 
          OR descricao LIKE '%pix%' 
          OR descricao LIKE '%pagseguro%'
        )
      ORDER BY data ASC, valor ASC
    `);

    console.log(`FOUND ${txs.length} POTENTIAL TRANSFER TRANSACTIONS IN JAN 2026:`);
    
    // Group them by amount and date to find pairs
    const pairs = [];
    const unmatched = [];
    const visited = new Set();

    for (let i = 0; i < txs.length; i++) {
      if (visited.has(txs[i].id)) continue;
      
      let foundPair = false;
      const tx1 = txs[i];
      const val1 = parseFloat(tx1.valor);
      const date1Str = tx1.data.toISOString().split('T')[0];

      // Look for a matching transaction on the same or adjacent day with the opposite type and same/similar value
      for (let j = i + 1; j < txs.length; j++) {
        if (visited.has(txs[j].id)) continue;
        
        const tx2 = txs[j];
        const val2 = parseFloat(tx2.valor);
        const date2Str = tx2.data.toISOString().split('T')[0];
        
        // Match conditions:
        // 1. Opposite type (one is entrada, other is saida)
        // 2. Same value (within 0.05 margin for fees or rounding)
        // 3. Same date or within 1 day (Pix is usually instant, but let's allow same day first)
        const isOppositeType = tx1.tipo !== tx2.tipo;
        const isSameValue = Math.abs(val1 - val2) < 0.05;
        const isSameDate = date1Str === date2Str; // Pix is instant, so same day

        if (isOppositeType && isSameValue && isSameDate && tx1.conta_id !== tx2.conta_id) {
          pairs.push({ from: tx1.tipo === 'saida' ? tx1 : tx2, to: tx1.tipo === 'entrada' ? tx1 : tx2 });
          visited.add(tx1.id);
          visited.add(tx2.id);
          foundPair = true;
          break;
        }
      }

      if (!foundPair) {
        unmatched.push(tx1);
      }
    }

    console.log("\n=== MATCHED PIX / TRANSFER PAIRS (OUT -> IN) ===");
    pairs.forEach(p => {
      const dateStr = p.from.data.toISOString().split('T')[0];
      console.log(`[${dateStr}] R$ ${p.from.valor} | Origin: ${accMap[p.from.conta_id]} -> Dest: ${accMap[p.to.conta_id]}`);
      console.log(`   - OUT: ${p.from.descricao}`);
      console.log(`   - IN : ${p.to.descricao}`);
    });

    console.log("\n=== UNMATCHED OR SINGLE-LEG TRANSFERS ===");
    unmatched.forEach(t => {
      const dateStr = t.data.toISOString().split('T')[0];
      console.log(`[${dateStr}] ${t.tipo.toUpperCase()} | R$ ${t.valor} | Account: ${accMap[t.conta_id]} | Cat: ${t.categoria}`);
      console.log(`   Desc: ${t.descricao}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();

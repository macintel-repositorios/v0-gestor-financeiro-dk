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

  console.log("Searching for loose transfer pairs (date difference <= 2 days)...");

  // Fetch all active transactions from checking accounts
  const [transactions] = await pool.execute(`
    SELECT t.id, t.data, t.valor, t.tipo, t.descricao, c.nome as conta_nome, t.conta_id, c.tipo as conta_tipo, t.categoria
    FROM transacoes_financeiras t
    JOIN contas_financeiras c ON t.conta_id = c.id
    WHERE t.ativo = 1 AND c.tipo = 'conta_corrente'
  `);

  const entradas = transactions.filter(t => t.tipo === 'entrada');
  const saidas = transactions.filter(t => t.tipo === 'saida');

  const matchedIds = new Set();
  const loosePairs = [];

  for (const ent of entradas) {
    const entVal = parseFloat(ent.valor);
    const entDate = new Date(ent.data);

    for (const sai of saidas) {
      if (sai.conta_id === ent.conta_id) continue; // Must be different accounts
      if (matchedIds.has(ent.id) || matchedIds.has(sai.id)) continue;

      const saiVal = parseFloat(sai.valor);
      if (Math.abs(entVal - saiVal) > 0.01) continue; // Must have same value

      const saiDate = new Date(sai.data);
      const diffMs = Math.abs(entDate - saiDate);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays <= 2) {
        // Double check description for keywords to prevent false positives (e.g. paying same amount to two different suppliers)
        const descMatch = (ent.descricao + ' ' + sai.descricao).toLowerCase();
        const hasKeywords = descMatch.includes('transfer') || 
                            descMatch.includes('pix') || 
                            descMatch.includes('ted') || 
                            descMatch.includes('doc') || 
                            descMatch.includes('pagamento') ||
                            descMatch.includes('saldo') ||
                            descMatch.includes('recebido') ||
                            descMatch.includes('marcus') ||
                            descMatch.includes('macintel') ||
                            ent.categoria === 'Transferências entre contas' ||
                            sai.categoria === 'Transferências entre contas';

        if (hasKeywords) {
          loosePairs.push({ ent, sai, diffDays });
          matchedIds.add(ent.id);
          matchedIds.add(sai.id);
        }
      }
    }
  }

  console.log(`=== FOUND ${loosePairs.length} LOOSE TRANSFER PAIRS ===`);
  loosePairs.forEach((pair, index) => {
    console.log(`[Pair ${index + 1}] Date Inflow: ${new Date(pair.ent.data).toLocaleDateString('pt-BR')} | Date Outflow: ${new Date(pair.sai.data).toLocaleDateString('pt-BR')} | Diff: ${pair.diffDays.toFixed(2)} days | Value: R$ ${parseFloat(pair.ent.valor).toFixed(2)}`);
    console.log(`  <- INFLOW:  [ID ${pair.ent.id}] ${pair.ent.descricao} (${pair.ent.conta_nome}) | Cat: ${pair.ent.categoria}`);
    console.log(`  -> OUTFLOW: [ID ${pair.sai.id}] ${pair.sai.descricao} (${pair.sai.conta_nome}) | Cat: ${pair.sai.categoria}`);
  });

  // Let's ask if we want to run update for these loose pairs
  if (loosePairs.length > 0) {
    console.log("\nUpdating these loose pairs in the database to 'Transferências entre contas'...");
    for (const pair of loosePairs) {
      await pool.execute(
        "UPDATE transacoes_financeiras SET categoria = 'Transferências entre contas' WHERE id IN (?, ?)",
        [pair.ent.id, pair.sai.id]
      );
    }
    console.log("Successfully updated all loose transfer pairs!");
  }

  pool.end();
}

run();

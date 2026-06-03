const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables from .env.local
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
  });

  console.log("Connected to DB:", process.env.DB_NAME);

  // 1. Fetch all financial transactions
  const [transactions] = await pool.execute(`
    SELECT t.data, t.valor, t.tipo, t.descricao, c.nome as conta_nome, c.tipo as conta_tipo
    FROM transacoes_financeiras t
    JOIN contas_financeiras c ON t.conta_id = c.id
    WHERE t.ativo = 1
  `);

  console.log(`Total active transactions: ${transactions.length}`);

  // Deduplicate like the API does:
  const transacoes = [];
  const seenTx = new Set();
  for (const t of transactions) {
    let dStr = "0000-00-00";
    if (t.data) {
      try {
        const parsed = new Date(t.data);
        if (!isNaN(parsed.getTime())) {
          dStr = parsed.toISOString().split("T")[0];
        }
      } catch {}
    }
    const valStr = parseFloat(t.valor || 0).toFixed(2);
    const key = `${dStr}_${valStr}_${t.tipo}_${t.descricao || ""}`;
    if (!seenTx.has(key)) {
      seenTx.add(key);
      transacoes.push(t);
    }
  }

  // 2. Identify transfers to ignore (opposite transaction type on same day and same value)
  const transferIdsToIgnore = new Set();
  const pairs = {};
  transacoes.forEach((t, i) => {
    let dateKey = "0000-00-00";
    if (t.data) {
      const d = new Date(t.data);
      if (!isNaN(d.getTime())) {
        dateKey = d.toISOString().split("T")[0];
      }
    }
    const valueKey = parseFloat(t.valor).toFixed(2);
    const key = `${dateKey}_${valueKey}`;
    if (!pairs[key]) pairs[key] = [];
    pairs[key].push({ t, originalIndex: i });
  });

  for (const key in pairs) {
    const list = pairs[key];
    if (list.length >= 2) {
      const entradas = list.filter((x) => x.t.tipo === "entrada");
      const saidas = list.filter((x) => x.t.tipo === "saida");
      const matchCount = Math.min(entradas.length, saidas.length);
      for (let i = 0; i < matchCount; i++) {
        transferIdsToIgnore.add(entradas[i].originalIndex);
        transferIdsToIgnore.add(saidas[i].originalIndex);
      }
    }
  }

  // Calculate sums by month (e.g. for Jan 2026)
  const stats = {};

  transacoes.forEach((t, index) => {
    if (transferIdsToIgnore.has(index)) {
      // console.log("Ignored transfer:", t.descricao, t.valor, t.tipo, t.data);
      return;
    }

    if (t.conta_tipo === "aplicacao" || t.conta_tipo === "cartao_credito") {
      return;
    }

    const d = new Date(t.data);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    if (!stats[month]) {
      stats[month] = { entradas: 0, saidas: 0, itemsEntrada: [], itemsSaida: [] };
    }

    const val = parseFloat(t.valor) || 0;
    if (t.tipo === "entrada") {
      stats[month].entradas += val;
      stats[month].itemsEntrada.push({ descricao: t.descricao, valor: val, data: t.data, conta: t.conta_nome });
    } else {
      stats[month].saidas += val;
      stats[month].itemsSaida.push({ descricao: t.descricao, valor: val, data: t.data, conta: t.conta_nome });
    }
  });

  console.log("\n--- MONTHLY SUMMARY ---");
  for (const month in stats) {
    console.log(`Month: ${month}`);
    console.log(`  Entradas: R$ ${stats[month].entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`  Saídas:   R$ ${stats[month].saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    
    // If this month matches our target values, print detailed items:
    // User mentioned R$ 50.832,05 entries and R$ 30.950,80 outputs.
    // Let's print details of all months to check which one it is.
    console.log(`  Detailed Inflows:`);
    stats[month].itemsEntrada.forEach(item => {
      console.log(`    - ${new Date(item.data).toLocaleDateString('pt-BR')} | ${item.descricao} | R$ ${item.valor} | ${item.conta}`);
    });
    console.log(`  Detailed Outflows:`);
    stats[month].itemsSaida.forEach(item => {
      console.log(`    - ${new Date(item.data).toLocaleDateString('pt-BR')} | ${item.descricao} | R$ ${item.valor} | ${item.conta}`);
    });
  }

  pool.end();
}

run();

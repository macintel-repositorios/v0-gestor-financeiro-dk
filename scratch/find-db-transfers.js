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
  });

  const [transactions] = await pool.execute(`
    SELECT t.id, t.data, t.valor, t.tipo, t.descricao, c.nome as conta_nome, t.conta_id, t.categoria
    FROM transacoes_financeiras t
    JOIN contas_financeiras c ON t.conta_id = c.id
    WHERE t.ativo = 1
  `);

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

  const pairs = {};
  transacoes.forEach((t) => {
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
    pairs[key].push(t);
  });

  const transferPairs = [];
  for (const key in pairs) {
    const list = pairs[key];
    if (list.length >= 2) {
      const entradas = list.filter((x) => x.tipo === "entrada");
      const saidas = list.filter((x) => x.tipo === "saida");
      const matchCount = Math.min(entradas.length, saidas.length);
      for (let i = 0; i < matchCount; i++) {
        transferPairs.push({
          entrada: entradas[i],
          saida: saidas[i]
        });
      }
    }
  }

  console.log(`=== FOUND ${transferPairs.length} TRANSFER PAIRS ===`);
  transferPairs.forEach((pair, index) => {
    const dateStr = new Date(pair.entrada.data).toLocaleDateString('pt-BR');
    console.log(`[Pair ${index + 1}] Date: ${dateStr} | Value: R$ ${parseFloat(pair.entrada.valor).toFixed(2)}`);
    console.log(`  <- INFLOW:  [ID ${pair.entrada.id}] ${pair.entrada.descricao} (${pair.entrada.conta_nome}) | Current Cat: ${pair.entrada.categoria}`);
    console.log(`  -> OUTFLOW: [ID ${pair.saida.id}] ${pair.saida.descricao} (${pair.saida.conta_nome}) | Current Cat: ${pair.saida.categoria}`);
  });

  pool.end();
}

run();

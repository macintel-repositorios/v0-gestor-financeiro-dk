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

  // 1. Fetch transactions
  const [transactions] = await pool.execute(`
    SELECT t.data, t.valor, t.tipo, t.descricao, c.nome as conta_nome, t.conta_id, c.tipo as conta_tipo
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

  // 2. Unpaid boletos
  const [boletos] = await pool.execute(`
    SELECT data_vencimento as data, valor, status 
    FROM boletos 
    WHERE status IN ('pendente', 'aguardando_pagamento') AND data_vencimento IS NOT NULL
  `);

  // 3. Active recibos
  const [recibos] = await pool.execute(`
    SELECT data_emissao as data, valor 
    FROM recibos 
    WHERE ativo = 1
  `);

  const hoje = new Date();
  const currentMonthKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  const getMonthKey = (dateString) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "Outros";
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } catch {
      return "Outros";
    }
  };

  // Let's test combinations of:
  // - Filter by a specific month (e.g. 2026-02, 2026-03, etc.)
  // - With/without boletos and recibos
  // - With/without card accounts
  // - With/without deduplication
  // - With/without ignored transfers

  const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];

  console.log("Searching combinations...");

  for (const month of months) {
    // Scenario A: Standard API Logic (deduped, ignored transfers, applying account filter)
    let standardEntradas = 0;
    let standardSaidas = 0;
    let standardEntradasProjetadas = 0;
    let standardSaidasProjetadas = 0;

    transacoes.forEach((t, i) => {
      if (transferIdsToIgnore.has(i)) return;
      if (t.conta_tipo === "aplicacao" || t.conta_tipo === "cartao_credito") {
        if (t.conta_tipo === "cartao_credito" && t.tipo === "saida" && getMonthKey(t.data) === month && new Date(t.data) > hoje) {
          standardSaidasProjetadas += parseFloat(t.valor) || 0;
        }
        return;
      }
      if (getMonthKey(t.data) !== month) return;

      const val = parseFloat(t.valor) || 0;
      const isFutura = new Date(t.data) > hoje;

      if (t.tipo === "entrada") {
        if (isFutura) standardEntradasProjetadas += val;
        else standardEntradas += val;
      } else {
        if (isFutura) standardSaidasProjetadas += val;
        else standardSaidas += val;
      }
    });

    // Add boletos & recibos
    if (month >= currentMonthKey) {
      boletos.forEach(b => {
        if (getMonthKey(b.data) === month) {
          standardEntradasProjetadas += parseFloat(b.valor) || 0;
        }
      });
      recibos.forEach(r => {
        if (getMonthKey(r.data) === month) {
          standardEntradasProjetadas += parseFloat(r.valor) || 0;
        }
      });
    }

    const totalInflow = standardEntradas + standardEntradasProjetadas;
    const totalOutflow = standardSaidas + standardSaidasProjetadas;

    console.log(`Month ${month} (Standard flow totals): Inflow=${totalInflow.toFixed(2)}, Outflow=${totalOutflow.toFixed(2)} (Realized: In=${standardEntradas.toFixed(2)}, Out=${standardSaidas.toFixed(2)}; Proj: In=${standardEntradasProjetadas.toFixed(2)}, Out=${standardSaidasProjetadas.toFixed(2)})`);

    // Scenario B: Without ignoring transfers or deduplicating, raw database values for this month
    let rawEntradas = 0;
    let rawSaidas = 0;
    transactions.forEach(t => {
      const d = new Date(t.data);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (m !== month) return;
      if (t.conta_tipo === "aplicacao" || t.conta_tipo === "cartao_credito") return;
      const val = parseFloat(t.valor) || 0;
      if (t.tipo === "entrada") rawEntradas += val;
      else rawSaidas += val;
    });
    console.log(`Month ${month} (Raw transactions): Inflow=${rawEntradas.toFixed(2)}, Outflow=${rawSaidas.toFixed(2)}`);
  }

  pool.end();
}

run();

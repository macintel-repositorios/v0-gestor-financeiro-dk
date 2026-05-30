const fs = require('fs');
const path = require('path');

const projectPath = 'c:/Users/User/OneDrive/Área de Trabalho/projetos/gestor-financeiro - 80';

const envFile = fs.readFileSync(path.join(projectPath, '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) {
    let v = m[2] || '';
    v = v.trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
    env[m[1]] = v;
  }
});

const mysql = require(path.join(projectPath, 'node_modules/mysql2/promise'));
mysql.createConnection({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: Number(env.DB_PORT || 3306)
}).then(async (c) => {
  // Let's perform the exact cash flow logic from route.ts
  const [boletos] = await c.execute(`
    SELECT data_pagamento as data, valor 
    FROM boletos 
    WHERE status = 'pago' AND data_pagamento IS NOT NULL
  `);

  const [recibos] = await c.execute(`
    SELECT data_emissao as data, valor 
    FROM recibos 
    WHERE ativo = 1
  `);

  const [transacoes] = await c.execute(`
    SELECT t.id, t.data, t.valor, t.tipo, t.descricao, c.nome as conta_nome, t.conta_id
    FROM transacoes_financeiras t
    JOIN contas_financeiras c ON t.conta_id = c.id
    WHERE t.ativo = 1
  `);

  const monthlyData = {};
  const getMonthKey = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Outros";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const initMonth = (month) => {
    if (!monthlyData[month]) {
      monthlyData[month] = { mes: month, boletosVal: 0, recibosVal: 0, transacoesIn: 0, transacoesOut: 0, totalIn: 0, totalOut: 0 };
    }
  };

  // Internal transfers to ignore
  const transferIdsToIgnore = new Set();
  const pairs = {};
  for (const t of transacoes) {
    const dateKey = t.data instanceof Date ? t.data.toISOString().split("T")[0] : String(t.data).split("T")[0];
    const valueKey = parseFloat(t.valor).toFixed(2);
    const key = `${dateKey}_${valueKey}`;
    if (!pairs[key]) pairs[key] = [];
    pairs[key].push(t);
  }
  for (const key in pairs) {
    const list = pairs[key];
    if (list.length >= 2) {
      const entradas = list.filter((x) => x.tipo === "entrada");
      const saidas = list.filter((x) => x.tipo === "saida");
      const matchCount = Math.min(entradas.length, saidas.length);
      for (let i = 0; i < matchCount; i++) {
        transferIdsToIgnore.add(entradas[i].id);
        transferIdsToIgnore.add(saidas[i].id);
      }
    }
  }

  // Add paid boletos
  for (const b of boletos) {
    const month = getMonthKey(b.data);
    initMonth(month);
    monthlyData[month].boletosVal += parseFloat(b.valor) || 0;
  }

  // Add recibos
  for (const r of recibos) {
    const month = getMonthKey(r.data);
    initMonth(month);
    monthlyData[month].recibosVal += parseFloat(r.valor) || 0;
  }

  // Add transacoes
  for (const t of transacoes) {
    if (transferIdsToIgnore.has(t.id)) continue;

    const isAsaasAccount = t.conta_nome?.toLowerCase().includes("asaas");
    const isBoletoInflow = t.descricao?.toLowerCase().match(/(cobranca|cobrança|boleto|recebimento|liquidacao|liquidação)/);
    
    if (t.tipo === "entrada" && (isAsaasAccount || isBoletoInflow)) {
      continue;
    }

    const month = getMonthKey(t.data);
    initMonth(month);
    const val = parseFloat(t.valor) || 0;
    if (t.tipo === "entrada") {
      monthlyData[month].transacoesIn += val;
    } else {
      monthlyData[month].transacoesOut += val;
    }
  }

  for (const month in monthlyData) {
    const m = monthlyData[month];
    m.totalIn = m.boletosVal + m.recibosVal + m.transacoesIn;
    m.totalOut = m.transacoesOut;
    m.saldo = m.totalIn - m.totalOut;
  }

  console.log("Monthly Details:", monthlyData);
  await c.end();
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});

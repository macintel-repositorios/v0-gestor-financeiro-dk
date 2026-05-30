const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      process.env[key.trim()] = values.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  });
}

async function run() {
  const pool = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const [boletos] = await pool.execute(`
      SELECT data_vencimento as data, valor, status 
      FROM boletos 
      WHERE status IN ('pendente', 'aguardando_pagamento') AND data_vencimento IS NOT NULL
    `)

    const [recibos] = await pool.execute(`
      SELECT data_emissao as data, valor 
      FROM recibos 
      WHERE ativo = 1
    `)

    const [transacoes] = await pool.execute(`
      SELECT t.id, t.data, t.valor, t.tipo, t.descricao, c.nome as conta_nome, t.conta_id, c.tipo as conta_tipo
      FROM transacoes_financeiras t
      JOIN contas_financeiras c ON t.conta_id = c.id
      WHERE t.ativo = 1
    `)

    const monthlyData = {}

    const getMonthKey = (dateString) => {
      try {
        const d = new Date(dateString)
        if (isNaN(d.getTime())) return "Outros"
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, "0")
        return `${year}-${month}`
      } catch {
        return "Outros"
      }
    }

    const initMonth = (month) => {
      if (!monthlyData[month]) {
        let label = month
        if (month !== "Outros") {
          const [year, m] = month.split("-")
          const date = new Date(parseInt(year), parseInt(m) - 1, 1)
          label = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
          label = label.replace(/^\w/, (c) => c.toUpperCase()).replace(".", "")
        }
        monthlyData[month] = { mes: label, entradas: 0, saidas: 0, saldo: 0, rendimentos: 0 }
      }
    }

    const transferIdsToIgnore = new Set()
    const pairs = {}
    
    for (const t of transacoes) {
      let dateKey = "0000-00-00"
      if (t.data) {
        try {
          const d = t.data instanceof Date ? t.data : new Date(t.data)
          if (!isNaN(d.getTime())) {
            dateKey = d.toISOString().split("T")[0]
          }
        } catch (err) {}
      }
      const valueKey = parseFloat(t.valor).toFixed(2)
      const key = `${dateKey}_${valueKey}`
      if (!pairs[key]) pairs[key] = []
      pairs[key].push(t)
    }

    for (const key in pairs) {
      const list = pairs[key]
      if (list.length >= 2) {
        const entradas = list.filter((x) => x.tipo === "entrada")
        const saidas = list.filter((x) => x.tipo === "saida")
        const matchCount = Math.min(entradas.length, saidas.length)
        for (let i = 0; i < matchCount; i++) {
          transferIdsToIgnore.add(entradas[i].id)
          transferIdsToIgnore.add(saidas[i].id)
        }
      }
    }

    for (const t of transacoes) {
      if (transferIdsToIgnore.has(t.id)) {
        continue
      }

      const month = getMonthKey(t.data)
      initMonth(month)
      const val = parseFloat(t.valor) || 0

      if (t.conta_tipo === "aplicacao" || t.conta_tipo === "cartao_credito") {
        if (t.conta_tipo === "aplicacao" && t.tipo === "entrada") {
          const desc = t.descricao?.toLowerCase() || ""
          if (desc.match(/(rendimento|juros|renda|yield|rend)/)) {
            monthlyData[month].rendimentos += val
          }
        }
        continue
      }

      if (t.tipo === "entrada") {
        monthlyData[month].entradas += val
      } else {
        monthlyData[month].saidas += val
      }
    }

    const hoje = new Date()
    const currentMonthKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
    
    for (const b of boletos) {
      const month = getMonthKey(b.data)
      if (month >= currentMonthKey && month !== "Outros") {
        initMonth(month)
        monthlyData[month].entradas += parseFloat(b.valor) || 0
      }
    }

    for (const r of recibos) {
      const month = getMonthKey(r.data)
      if (month >= currentMonthKey && month !== "Outros") {
        initMonth(month)
        monthlyData[month].entradas += parseFloat(r.valor) || 0
      }
    }

    const sortedMonths = Object.keys(monthlyData)
      .filter((m) => m !== "Outros")
      .sort()

    console.log("Keys in monthlyData:", Object.keys(monthlyData));
    console.log("Sorted months:", sortedMonths);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();

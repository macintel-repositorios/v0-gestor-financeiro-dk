import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

function classifyCategory(description: string, tipo: string): string {
  const desc = description.toLowerCase();
  
  if (tipo === "entrada") {
    if (desc.match(/(cobranca|cobrança|boleto|recebimento|faturamento|liquidacao|liquidação|venda|cliente)/)) {
      return "Faturamento";
    }
    if (desc.match(/(rendimento|aplicacao|aplicação|resgate|juros|rend)/)) {
      return "Investimentos";
    }
    return "Outras Receitas";
  } else {
    // Expenses
    if (desc.match(/(fornecedor|fornecedores|distribuidor|compra material|insumos|pagamento a|pagto a)/)) {
      return "Fornecedores";
    }
    if (desc.match(/(infinity|combustivel|combustível|posto)/)) {
      return "Combustível";
    }
    if (desc.match(/(tarifa|iof|juros|mensalidade conta|banco|manutencao conta|doc|ted|taxa de boleto|taxa mensageira|taxa de mensageria|taxa de cobranca|taxa de cobrança|taxa de transferencia|taxa de transferência|taxa de pix|taxa pix|taxa bancaria|taxa de saque)/)) {
      return "Tarifas Bancárias";
    }
    if (desc.match(/(receita federal|simples nacional|das|darf|tributo|imposto|taxa|prefeitura|gps|fgts|federal)/)) {
      return "Impostos & Tributos";
    }
    if (desc.match(/(aws|google|cloud|vercel|github|microsoft|adobe|hostgator|software|saas|digitalocean|dropbox|slack|zoom)/)) {
      return "Tecnologia & SaaS";
    }
    if (desc.match(/(uber|99app|taxi|pedagio|pedágio|estacionamento|viagem|passagem|aerea|aérea)/)) {
      return "Transporte & Viagem";
    }
    if (desc.match(/(ifood|restaurante|mercado|alimento|pao|padaria|cafe|café|refeicao|refeição|supermercado|carrefour|pao de acucar)/)) {
      return "Alimentação";
    }
    if (desc.match(/(aluguel|condominio|condomínio|imobiliaria|imobiliária)/)) {
      return "Aluguel & Condomínio";
    }
    if (desc.match(/(copel|enel|luz|energia|energisa|celesc|light)/)) {
      return "Energia Elétrica";
    }
    if (desc.match(/(sanepar|sabesp|agua|água|embasa|cedae|gas|gás|comgas|comgás)/)) {
      return "Água, Esgoto & Gás";
    }
    if (desc.match(/(telefone|internet|net|claro|vivo|tim|oi|embratel)/)) {
      return "Internet & Telefone";
    }
    if (desc.match(/(marketing|ads|anuncio|anúncio|facebook|metaads|googleads|adwords|panfleto|comunicacao|comunicação)/)) {
      return "Marketing & Anúncios";
    }
    if (desc.match(/(salario|salário|pro-labore|pro labore|folha|decimo|férias|ferias|beneficio|benefício|vale)/)) {
      return "Pessoal & Pro-labore";
    }
    if (desc.match(/(papelaria|copia|cópia|impressao|impressão|cartucho|toner|escritorio|escritório)/)) {
      return "Material de Escritório";
    }
    return "Outras Despesas";
  }
}

export async function POST(request: Request) {
  try {
    const { fileContent, fileName, contaId, importMonth, importYear, forceImport } = await request.json()
    if (!fileContent || !contaId) {
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 })
    }

    // Check if this month has already been imported
    if (importMonth && importYear) {
      const period = `${importYear}-${importMonth.padStart(2, "0")}`
      const [existingImport]: any = await pool.execute(
        `SELECT nome_arquivo, created_at FROM extratos_importados WHERE conta_id = ? AND ano_mes = ?`,
        [contaId, period]
      )
      
      if (Array.isArray(existingImport) && existingImport.length > 0 && !forceImport) {
        return NextResponse.json({
          success: false,
          alreadyImported: true,
          fileName: existingImport[0].nome_arquivo,
          createdAt: existingImport[0].created_at
        })
      }
    }

    const transactions: any[] = []

    if (fileName.toLowerCase().endsWith(".ofx")) {
      // OFX Parsing using Regex
      const stmttrns = fileContent.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/g) || []
      for (const trn of stmttrns) {
        const type = trn.match(/<TRNTYPE>([^<\r\n]+)/)?.[1]?.trim()
        const dateStr = trn.match(/<DTPOSTED>([^<\r\n]+)/)?.[1]?.trim() // e.g. 20260528...
        const amtStr = trn.match(/<TRNAMT>([^<\r\n]+)/)?.[1]?.trim() // e.g. -150.00
        const memo = trn.match(/<MEMO>([^<\r\n]+)/)?.[1]?.trim() || trn.match(/<NAME>([^<\r\n]+)/)?.[1]?.trim() || "Transação OFX"

        if (dateStr && amtStr) {
          const year = dateStr.substring(0, 4)
          const month = dateStr.substring(4, 6)
          const day = dateStr.substring(6, 8)
          
          let finalYear = year
          let finalMonth = month
          if (importYear && importMonth) {
            finalYear = importYear
            finalMonth = importMonth.padStart(2, "0")
          }
          
          const dataFormatted = `${finalYear}-${finalMonth}-${day}`
          const valor = parseFloat(amtStr)
          const isSaida = valor < 0
          
          transactions.push({
            data: dataFormatted,
            descricao: memo,
            tipo: isSaida ? "saida" : "entrada",
            valor: Math.abs(valor),
            categoria: classifyCategory(memo, isSaida ? "saida" : "entrada")
          })
        }
      }
    } else {
      // CSV Parsing
      const lines = fileContent.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean)
      const delimiter = fileContent.includes(";") ? ";" : ","
      
      let headerIndices = {
        date: 0,
        desc: 1,
        amount: 2,
        entrada: -1,
        saida: -1
      }
      
      let hasHeader = false
      if (lines.length > 0) {
        const firstLineCols = lines[0].split(delimiter).map((c: string) => c.replace(/^["']|["']$/g, "").trim().toLowerCase())
        if (firstLineCols.some((col: string) => col.includes("data") || col.includes("date") || col.includes("lançamento") || col.includes("lancamento"))) {
          hasHeader = true
          
          const dateIdx = firstLineCols.findIndex((col: string) => col.includes("data") || col.includes("date"))
          const descIdx = firstLineCols.findIndex((col: string) => col.includes("descri") || col.includes("memo") || col.includes("histórico") || col.includes("historico"))
          const entradaIdx = firstLineCols.findIndex((col: string) => col.includes("entrada") || col.includes("crédito") || col.includes("credito") || col.includes("recebido"))
          const saidaIdx = firstLineCols.findIndex((col: string) => col.includes("saída") || col.includes("saida") || col.includes("débito") || col.includes("debito") || col.includes("pago"))
          const amountIdx = firstLineCols.findIndex((col: string) => col.includes("valor") || col.includes("value") || col.includes("quantia") || col.includes("monto") || col.includes("lançamento") || col.includes("lancamento"))
          
          if (dateIdx !== -1) headerIndices.date = dateIdx
          if (descIdx !== -1) headerIndices.desc = descIdx
          
          if (entradaIdx !== -1 && saidaIdx !== -1) {
            headerIndices.entrada = entradaIdx
            headerIndices.saida = saidaIdx
          } else if (amountIdx !== -1) {
            headerIndices.amount = amountIdx
          }
        }
      }
      
      for (let i = 0; i < lines.length; i++) {
        // Skip header row
        if (i === 0 && hasHeader) {
          continue
        }
        
        const cols = lines[i].split(delimiter).map((c: string) => c.replace(/^["']|["']$/g, "").trim())
        if (cols.length > Math.max(headerIndices.date, headerIndices.desc)) {
          let dateVal = cols[headerIndices.date]
          let descVal = cols[headerIndices.desc]
          
          if (!dateVal || dateVal === "-") continue

          let day = "01"
          let month = "01"
          let year = "2026"
          
          if (dateVal.includes("/")) {
            const parts = dateVal.split("/")
            if (parts.length === 3) {
              day = parts[0].padStart(2, "0")
              month = parts[1].padStart(2, "0")
              year = parts[2]
            } else if (parts.length === 2) {
              day = parts[0].padStart(2, "0")
              month = parts[1].padStart(2, "0")
            }
          } else if (dateVal.includes("-")) {
            const parts = dateVal.split("-")
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                year = parts[0]
                month = parts[1].padStart(2, "0")
                day = parts[2].padStart(2, "0")
              } else {
                day = parts[0].padStart(2, "0")
                month = parts[1].padStart(2, "0")
                year = parts[2]
              }
            }
          }
          
          if (importYear && importMonth) {
            year = importYear
            month = importMonth.padStart(2, "0")
          }
          
          const formattedDate = `${year}-${month}-${day}`
          
          let parsedVal = 0
          let isSaida = false
          let isValid = false
          
          if (headerIndices.entrada !== -1 && headerIndices.saida !== -1) {
            const entradaValStr = cols[headerIndices.entrada] || ""
            const saidaValStr = cols[headerIndices.saida] || ""
            
            const parsedEntrada = parseFloat(entradaValStr.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", "."))
            const parsedSaida = parseFloat(saidaValStr.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", "."))
            
            if (!isNaN(parsedEntrada) && entradaValStr !== "-") {
              parsedVal = parsedEntrada
              isSaida = false
              isValid = true
            } else if (!isNaN(parsedSaida) && saidaValStr !== "-") {
              parsedVal = parsedSaida
              isSaida = true
              isValid = true
            }
          } else {
            let amtVal = cols[headerIndices.amount] || ""
            parsedVal = parseFloat(amtVal.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", "."))
            if (isNaN(parsedVal)) {
              parsedVal = parseFloat(cols[cols.length - 1].replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", "."))
              descVal = cols.slice(1, cols.length - 1).join(" ")
            }
            if (!isNaN(parsedVal)) {
              isSaida = parsedVal < 0
              parsedVal = Math.abs(parsedVal)
              isValid = true
            }
          }

          if (formattedDate && descVal && isValid) {
            transactions.push({
              data: formattedDate,
              descricao: descVal,
              tipo: isSaida ? "saida" : "entrada",
              valor: parsedVal,
              categoria: classifyCategory(descVal, isSaida ? "saida" : "entrada")
            })
          }
        }
      }
    }

    // Insert into DB (with smart duplicates count check)
    let importedCount = 0
    if (transactions.length > 0) {
      const insertedInSession: Record<string, number> = {}

      for (const tx of transactions) {
        const key = `${contaId}_${tx.data}_${tx.descricao}_${tx.valor}_${tx.tipo}`
        insertedInSession[key] = (insertedInSession[key] || 0) + 1

        const [existing]: any = await pool.execute(
          "SELECT COUNT(*) as count FROM transacoes_financeiras WHERE conta_id = ? AND data = ? AND descricao = ? AND valor = ? AND tipo = ? AND ativo = 1",
          [contaId, tx.data, tx.descricao, tx.valor, tx.tipo]
        )
        const dbCount = existing[0]?.count || 0

        if (insertedInSession[key] <= dbCount) {
          continue
        }
        
        await pool.execute(
          "INSERT INTO transacoes_financeiras (conta_id, data, descricao, tipo, valor, categoria, ativo) VALUES (?, ?, ?, ?, ?, ?, 1)",
          [contaId, tx.data, tx.descricao, tx.tipo, tx.valor, tx.categoria]
        )
        importedCount++
      }
    }

    // Collect all unique periods parsed from transactions, or fallback to selected period
    const uniquePeriods = new Set<string>()
    if (importMonth && importYear) {
      uniquePeriods.add(`${importYear}-${importMonth.padStart(2, "0")}`)
    } else {
      for (const tx of transactions) {
        if (tx.data) {
          uniquePeriods.add(tx.data.substring(0, 7))
        }
      }
    }

    // Save all imported periods in the database
    for (const period of uniquePeriods) {
      await pool.execute(
        `INSERT INTO extratos_importados (conta_id, ano_mes, nome_arquivo) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE nome_arquivo = ?, created_at = CURRENT_TIMESTAMP`,
        [contaId, period, fileName, fileName]
      )
    }

    return NextResponse.json({ success: true, count: importedCount, total: transactions.length })
  } catch (error: any) {
    console.error("Erro ao importar transações:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contaId = searchParams.get("contaId")
    const anoMes = searchParams.get("anoMes") // e.g. "2026-02"

    if (!contaId || !anoMes) {
      return NextResponse.json({ success: false, error: "Parâmetros inválidos" }, { status: 400 })
    }

    // 1. Delete transactions from transacoes_financeiras for this account and month
    const startDate = `${anoMes}-01`
    await pool.execute(
      "DELETE FROM transacoes_financeiras WHERE conta_id = ? AND data >= ? AND data <= LAST_DAY(?)",
      [contaId, startDate, startDate]
    )

    // 2. Remove the period record from extratos_importados
    await pool.execute(
      "DELETE FROM extratos_importados WHERE conta_id = ? AND ano_mes = ?",
      [contaId, anoMes]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao desfazer importação:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

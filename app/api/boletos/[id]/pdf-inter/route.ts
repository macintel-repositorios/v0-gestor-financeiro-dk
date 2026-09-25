import { type NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import { query } from "@/lib/db"
import { getInterAPI } from "@/lib/inter"

// Serve o PDF do boleto emitido no Banco Inter, com cabeçalho personalizado (estilo Asaas)
// e a ficha de compensação oficial do Inter recortada do PDF original.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const boletos: any = await query(
      `SELECT b.*, c.nome AS cliente_nome
       FROM boletos b LEFT JOIN clientes c ON b.cliente_id = c.id
       WHERE b.id = ?`,
      [id]
    )
    if (boletos.length === 0 || !boletos[0].asaas_id) {
      return NextResponse.json({ success: false, message: "Boleto não emitido no Banco Inter" }, { status: 404 })
    }
    const boleto = boletos[0]

    const inter = getInterAPI()
    const pdfBase64 = await inter.obterPdfBoleto(boleto.asaas_id)
    const interPdf = Buffer.from(pdfBase64, "base64")

    let pdf: Uint8Array | Buffer = interPdf
    try {
      pdf = await montarPdfPersonalizado(boleto, interPdf)
    } catch (e) {
      console.warn("[Banco Inter] Falha ao personalizar PDF, usando original:", e)
    }

    return new NextResponse(pdf as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="boleto-${boleto.numero}.pdf"`,
        "Cache-Control": "private, max-age=300",
      },
    })
  } catch (error: any) {
    console.error("Erro ao obter PDF do Banco Inter:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Erro ao obter PDF do Banco Inter" },
      { status: 500 }
    )
  }
}

const AZUL = rgb(0.11, 0.3, 0.75)
const CINZA = rgb(0.35, 0.35, 0.4)
const PRETO = rgb(0.1, 0.1, 0.12)
const BORDA = rgb(0.85, 0.87, 0.9)
const FUNDO = rgb(0.97, 0.975, 0.98)

async function montarPdfPersonalizado(boleto: any, interPdf: Buffer): Promise<Uint8Array> {
  const [empresaRows, logoRows]: any = await Promise.all([
    query("SELECT * FROM timbrado_config WHERE ativo = 1 ORDER BY created_at DESC LIMIT 1"),
    query("SELECT dados, formato FROM logos_sistema WHERE tipo = 'impressao' AND ativo = 1 LIMIT 1"),
  ])
  const empresa = empresaRows[0] || {}

  // Pix copia e cola vem da consulta da cobrança
  let pixCopiaECola = ""
  let linhaDigitavel = boleto.asaas_linha_digitavel || ""
  try {
    const cob = await getInterAPI().consultarCobranca(boleto.asaas_id)
    pixCopiaECola = cob.pixCopiaECola || ""
    linhaDigitavel = linhaDigitavel || cob.linhaDigitavel || ""
  } catch {}

  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const M = 40
  const W = 595.28 - M * 2

  // Saudação
  txt(page, `Olá, ${boleto.cliente_nome || ""}`, M, 800, bold, 12, AZUL)
  txt(page, "Aqui está seu boleto.", M, 785, font, 10, PRETO)

  // Logo + dados da empresa
  const topoEmpresa = 765
  let xTexto = M
  if (logoRows[0]?.dados) {
    try {
      const raw = String(logoRows[0].dados).replace(/^data:image\/\w+;base64,/, "")
      const bytes = Buffer.from(raw, "base64")
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50
      const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes)
      const s = img.scaleToFit(90, 90)
      page.drawImage(img, { x: M, y: topoEmpresa - s.height, width: s.width, height: s.height })
      xTexto = M + 105
    } catch (e) {
      console.warn("[Banco Inter] Logo não pôde ser incorporado:", e)
    }
  }
  let y = topoEmpresa - 10
  for (const linha of wrap(empresa.empresa_nome || "", bold, 11, W - (xTexto - M))) {
    txt(page, linha, xTexto, y, bold, 11, PRETO)
    y -= 14
  }
  y -= 2
  const linhasEmpresa = [
    empresa.empresa_cnpj && `CNPJ: ${empresa.empresa_cnpj}`,
    [empresa.empresa_endereco, empresa.empresa_bairro].filter(Boolean).join(", "),
    [empresa.empresa_cidade, empresa.empresa_uf].filter(Boolean).join(" - "),
    empresa.empresa_cep && `CEP: ${empresa.empresa_cep}`,
    empresa.empresa_telefone,
    empresa.empresa_email,
    empresa.empresa_site,
  ].filter(Boolean) as string[]
  for (const l of linhasEmpresa) {
    txt(page, l, xTexto, y, font, 8, CINZA)
    y -= 11
  }

  // Cartões: vencimento, valor, após o vencimento
  const valor = Number(boleto.valor) || 0
  const multaPct = Number(boleto.multa) || 0
  const jurosPct = Number(boleto.juros) || 0
  const cardY = 600
  const cardW = (W - 20) / 3
  const cards: [string, string[]][] = [
    ["Vencimento", [formatarData(boleto.data_vencimento)]],
    ["Valor", [moeda(valor)]],
    [
      "Após o vencimento",
      [
        multaPct > 0 ? `${moeda((valor * multaPct) / 100)} de multa` : "Sem multa",
        jurosPct > 0 ? `${num(jurosPct)}% de juros ao mês` : "Sem juros",
      ],
    ],
  ]
  cards.forEach(([titulo, valores], i) => {
    const x = M + i * (cardW + 10)
    page.drawRectangle({ x, y: cardY, width: cardW, height: 58, color: FUNDO, borderColor: BORDA, borderWidth: 1 })
    txt(page, titulo, x + 10, cardY + 42, font, 8, CINZA)
    valores.forEach((v, j) => txt(page, v, x + 10, cardY + 24 - j * 12, valores.length > 1 ? font : bold, valores.length > 1 ? 8 : 11, AZUL))
  })

  // Como realizar o pagamento
  txt(page, "Como realizar o pagamento:", M, 575, bold, 11, PRETO)
  const larguraTexto = W - 140
  y = 556
  if (pixCopiaECola) {
    txt(page, "Código Pix copia e cola", M, y, bold, 9, PRETO)
    y -= 12
    for (const l of wrap(pixCopiaECola, font, 7, larguraTexto, true)) {
      txt(page, l, M, y, font, 7, AZUL)
      y -= 9
    }
    y -= 8
  }
  if (linhaDigitavel) {
    txt(page, "Linha digitável", M, y, bold, 9, PRETO)
    y -= 12
    txt(page, formatarLinha(linhaDigitavel), M, y, font, 8.5, AZUL)
  }

  // Recortes do PDF oficial do Inter (coordenadas em pontos da página A4 do Inter)
  const [interPage] = await PDFDocument.load(interPdf).then((d) => d.getPages())
  const qr = await doc.embedPage(interPage, { left: 44, bottom: 528, right: 175, top: 660 })
  page.drawPage(qr, { x: 595.28 - M - 100, y: 470, width: 100, height: 100 * (132 / 131) })
  txt(page, "Pague com Pix pelo QR Code", 595.28 - M - 100, 460, font, 6.5, CINZA)

  page.drawLine({ start: { x: M, y: 445 }, end: { x: 595.28 - M, y: 445 }, thickness: 0.8, color: CINZA, dashArray: [3, 3] })

  const ficha = await doc.embedPage(interPage, { left: 0, bottom: 70, right: 595.28, top: 402 })
  const escala = (W + 30) / 595.28
  page.drawPage(ficha, { x: M - 15, y: 435 - 332 * escala, width: 595.28 * escala, height: 332 * escala })

  return doc.save()
}

// Helvetica padrão usa WinAnsi: remove caracteres fora dessa tabela
function limpar(s: string) {
  return String(s ?? "").replace(/[^\x20-\x7E -ÿ]/g, "")
}

function txt(page: PDFPage, s: string, x: number, y: number, font: PDFFont, size: number, color = PRETO) {
  page.drawText(limpar(s), { x, y, size, font, color })
}

function wrap(s: string, font: PDFFont, size: number, max: number, quebrarQualquer = false): string[] {
  const texto = limpar(s)
  const linhas: string[] = []
  if (quebrarQualquer) {
    let atual = ""
    for (const ch of texto) {
      if (font.widthOfTextAtSize(atual + ch, size) > max) {
        linhas.push(atual)
        atual = ch
      } else atual += ch
    }
    if (atual) linhas.push(atual)
    return linhas
  }
  let atual = ""
  for (const p of texto.split(/\s+/)) {
    const tentativa = atual ? `${atual} ${p}` : p
    if (font.widthOfTextAtSize(tentativa, size) > max && atual) {
      linhas.push(atual)
      atual = p
    } else atual = tentativa
  }
  if (atual) linhas.push(atual)
  return linhas
}

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function num(v: number) {
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
}

function formatarData(d: any) {
  if (!d) return ""
  const iso = d instanceof Date ? d.toISOString() : String(d)
  const [a, m, dia] = iso.split("T")[0].split("-")
  return `${dia}/${m}/${a}`
}

// 47 dígitos -> AAAAA.AAAAA BBBBB.BBBBBB CCCCC.CCCCCC D EEEEEEEEEEEEEE
function formatarLinha(l: string) {
  const d = l.replace(/\D/g, "")
  if (d.length !== 47) return l
  return `${d.slice(0, 5)}.${d.slice(5, 10)} ${d.slice(10, 15)}.${d.slice(15, 21)} ${d.slice(21, 26)}.${d.slice(26, 32)} ${d[32]} ${d.slice(33)}`
}

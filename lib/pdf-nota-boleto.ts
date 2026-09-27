"use client"

import { PDFDocument } from "pdf-lib"
import { urlPdfBoleto } from "@/lib/boleto-gateway"

/**
 * Junta o PDF da nota fiscal com os PDFs dos boletos da mesma nota (Inter ou Asaas)
 * e, opcionalmente, outros PDFs no final (ex.: OS preventiva).
 * Os boletos são baixados pelo servidor (/api/boletos/merge-pdfs) para evitar bloqueio de CORS
 * e combinados aqui no navegador. Ordem: nota → boletos → extras.
 */
export async function juntarNotaComBoletos(
  notaPdf: Blob,
  numeroNota: string | number,
  extras: Blob[] = []
): Promise<{ blob: Blob; totalBoletos: number; avisos: string[] }> {
  const avisos: string[] = []
  const partes: ArrayBuffer[] = [await notaPdf.arrayBuffer()]
  let totalBoletos = 0

  try {
    const res = await fetch(`/api/boletos?numeroBase=${encodeURIComponent(String(numeroNota))}`)
    const result = await res.json()
    const boletos: any[] = (result.success && result.data) || []

    const urls = boletos
      .filter((b) => String(b.numero_nota) === String(numeroNota) && b.status !== "cancelado")
      .sort((a, b) => Number(a.numero_parcela || 0) - Number(b.numero_parcela || 0))
      .map((b) => urlPdfBoleto(b))
      .filter(Boolean) as string[]

    if (urls.length === 0) {
      avisos.push("Nenhum boleto emitido (Inter ou Asaas) encontrado para esta nota.")
    } else {
      const mergeRes = await fetch("/api/boletos/merge-pdfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      })
      if (!mergeRes.ok || !mergeRes.headers.get("Content-Type")?.includes("application/pdf")) {
        const erro = await mergeRes.json().catch(() => null)
        avisos.push(erro?.error || "Não foi possível baixar os PDFs dos boletos.")
      } else {
        partes.push(await mergeRes.arrayBuffer())
        totalBoletos = urls.length
      }
    }
  } catch (e: any) {
    avisos.push(e?.message || "Erro ao buscar os boletos.")
  }

  for (const extra of extras) partes.push(await extra.arrayBuffer())

  const final = await PDFDocument.create()
  for (const bytes of partes) {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const paginas = await final.copyPages(doc, doc.getPageIndices())
    paginas.forEach((p) => final.addPage(p))
  }
  final.setTitle(`Nota_${numeroNota}_completa`)

  const saida = await final.save()
  return { blob: new Blob([saida as BlobPart], { type: "application/pdf" }), totalBoletos, avisos }
}

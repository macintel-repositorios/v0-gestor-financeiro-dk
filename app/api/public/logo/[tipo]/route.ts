import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Logo público (sem login), lido de Configurações > Logos. Usado por sites externos, ex.: macintel.com.br/cartao
//   /api/public/logo/sistema           -> imagem original
//   /api/public/logo/impressao?cor=branco -> mesma imagem em branco (SVG com filtro), fundo transparente
// Cache curto: ao trocar o logo nas Configurações, os sites passam a mostrar o novo em até 5 minutos.

const TIPOS = ["sistema", "menu", "impressao", "favicon"] as const

export async function GET(request: NextRequest, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params
  if (!TIPOS.includes(tipo as any)) {
    return NextResponse.json({ success: false, message: "Tipo de logo inválido" }, { status: 404 })
  }

  try {
    const rows: any = await query(
      `SELECT dados, formato FROM logos_sistema WHERE tipo = ? AND ativo = 1 ORDER BY id DESC LIMIT 1`,
      [tipo]
    )
    const dados = String(rows[0]?.dados || "")
    if (!dados) return NextResponse.json({ success: false, message: "Logo não cadastrado" }, { status: 404 })

    const m = dados.match(/^data:(image\/[\w+.-]+);base64,(.+)$/)
    const mime = m?.[1] || `image/${rows[0].formato === "jpg" ? "jpeg" : rows[0].formato || "png"}`
    const base64 = m?.[2] || dados
    const bytes = Buffer.from(base64, "base64")

    const headers = {
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
      "Access-Control-Allow-Origin": "*",
    }

    if (request.nextUrl.searchParams.get("cor") === "branco") {
      const { largura, altura } = dimensoes(bytes)
      // Filtro que pinta tudo de branco preservando a transparência
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
<filter id="b"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>
<image width="${largura}" height="${altura}" filter="url(#b)" xlink:href="data:${mime};base64,${base64}"/>
</svg>`
      return new NextResponse(svg, { headers: { ...headers, "Content-Type": "image/svg+xml; charset=utf-8" } })
    }

    return new NextResponse(bytes, { headers: { ...headers, "Content-Type": mime } })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// Largura/altura de PNG (cabeçalho IHDR) ou JPEG (marcador SOF); padrão 300x100
function dimensoes(b: Buffer): { largura: number; altura: number } {
  if (b[0] === 0x89 && b[1] === 0x50) return { largura: b.readUInt32BE(16), altura: b.readUInt32BE(20) }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i < b.length) {
      if (b[i] !== 0xff) break
      const marcador = b[i + 1]
      const tamanho = b.readUInt16BE(i + 2)
      if (marcador >= 0xc0 && marcador <= 0xc3) return { largura: b.readUInt16BE(i + 7), altura: b.readUInt16BE(i + 5) }
      i += 2 + tamanho
    }
  }
  return { largura: 300, altura: 100 }
}

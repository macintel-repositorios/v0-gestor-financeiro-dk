import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getInterAPI } from "@/lib/inter"

// Serve o PDF do boleto emitido no Banco Inter (buscado sob demanda na API v3)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const boletos = await query(`SELECT asaas_id, gateway, numero FROM boletos WHERE id = ?`, [id])
    if (boletos.length === 0 || !boletos[0].asaas_id) {
      return NextResponse.json({ success: false, message: "Boleto não emitido no Banco Inter" }, { status: 404 })
    }

    const pdfBase64 = await getInterAPI().obterPdfBoleto(boletos[0].asaas_id)
    const pdf = Buffer.from(pdfBase64, "base64")

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="boleto-${boletos[0].numero}.pdf"`,
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

import { type NextRequest, NextResponse } from "next/server"
import { getInterAPI } from "@/lib/inter"

export async function GET() {
  try {
    const inter = getInterAPI()
    const webhook = await inter.obterWebhook()

    return NextResponse.json({
      success: true,
      data: webhook,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Erro ao consultar webhook do Banco Inter",
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { webhookUrl } = await req.json()

    if (!webhookUrl || !webhookUrl.startsWith("https://")) {
      return NextResponse.json(
        {
          success: false,
          message: "A URL do Webhook é obrigatória e deve começar com HTTPS://",
        },
        { status: 400 }
      )
    }

    const inter = getInterAPI()
    await inter.cadastrarWebhook(webhookUrl)

    return NextResponse.json({
      success: true,
      message: `Webhook cadastrado com sucesso para: ${webhookUrl}`,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Erro ao cadastrar webhook no Banco Inter",
      },
      { status: 500 }
    )
  }
}

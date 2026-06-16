import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { gerarXmlCancelamento } from "@/lib/nfe/xml-builder"
import { assinarXmlEvento, extrairCertKeyDoPfx } from "@/lib/nfe/xml-signer"
import { enviarEventoNFe } from "@/lib/nfe/soap-client"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const justificativa = String(body?.motivo || body?.justificativa || "").trim()

    // Validar justificativa (SEFAZ exige 15 a 255 caracteres)
    if (justificativa.length < 15) {
      return NextResponse.json(
        { success: false, message: "A justificativa do cancelamento deve ter no minimo 15 caracteres." },
        { status: 400 },
      )
    }
    if (justificativa.length > 255) {
      return NextResponse.json(
        { success: false, message: "A justificativa do cancelamento deve ter no maximo 255 caracteres." },
        { status: 400 },
      )
    }

    // Buscar NF-e
    const [nfeRows] = await pool.execute("SELECT * FROM nfe_emitidas WHERE id = ?", [id])
    const nfes = nfeRows as any[]
    if (nfes.length === 0) {
      return NextResponse.json({ success: false, message: "NF-e nao encontrada" }, { status: 404 })
    }
    const nfe = nfes[0]

    if (nfe.status !== "autorizada") {
      return NextResponse.json(
        { success: false, message: "Apenas notas autorizadas podem ser canceladas" },
        { status: 400 },
      )
    }
    if (!nfe.chave_acesso) {
      return NextResponse.json({ success: false, message: "NF-e sem chave de acesso" }, { status: 400 })
    }
    if (!nfe.protocolo) {
      return NextResponse.json(
        { success: false, message: "NF-e sem numero de protocolo de autorizacao. Consulte o status antes de cancelar." },
        { status: 400 },
      )
    }

    // Buscar config e certificado
    const [configRows] = await pool.execute("SELECT * FROM nfe_config WHERE ativo = 1 LIMIT 1")
    const configs = configRows as any[]
    if (configs.length === 0) {
      return NextResponse.json({ success: false, message: "Configuracao NF-e nao encontrada" }, { status: 400 })
    }
    const config = configs[0]
    const ambiente = config.ambiente || 2

    // Buscar certificado - prioridade: NF-e proprio > NFS-e (fallback)
    let certificadoBase64 = ""
    let certificadoSenha = ""

    if (config.certificado_base64) {
      certificadoBase64 = config.certificado_base64
      certificadoSenha = config.certificado_senha || ""
    } else if (config.usar_certificado_nfse) {
      const [nfseRows] = await pool.execute(
        "SELECT certificado_base64, certificado_senha FROM nfse_config WHERE ativo = 1 LIMIT 1",
      )
      const nfseConfigs = nfseRows as any[]
      if (nfseConfigs.length > 0 && nfseConfigs[0].certificado_base64) {
        certificadoBase64 = nfseConfigs[0].certificado_base64
        certificadoSenha = nfseConfigs[0].certificado_senha
      }
    }

    if (!certificadoBase64) {
      return NextResponse.json(
        { success: false, message: "Certificado digital nao encontrado. Configure em Configuracoes > NF-e Material." },
        { status: 400 },
      )
    }

    // Gerar XML do evento de cancelamento (110111)
    const xmlCancelamento = gerarXmlCancelamento({
      chaveAcesso: nfe.chave_acesso,
      cnpj: config.cnpj || nfe.emitente_cnpj || "",
      tipoAmbiente: ambiente,
      protocolo: nfe.protocolo,
      justificativa,
    })

    // Assinar o evento (XMLDSIG - Signature dentro de <evento>, referenciando infEvento)
    const { certPem, keyPem } = extrairCertKeyDoPfx(certificadoBase64, certificadoSenha)
    const xmlAssinado = assinarXmlEvento(xmlCancelamento, certPem, keyPem)

    // Enviar para a SEFAZ (RecepcaoEvento4)
    const resultado = await enviarEventoNFe(xmlAssinado, ambiente, certificadoBase64, certificadoSenha)

    // O status REAL do cancelamento esta no cStat de dentro de <retEvento><infEvento>,
    // nao no cStat do lote (que pode ser 128 = "Lote de Evento Processado").
    const retEventoMatch = resultado.xml.match(/<retEvento[^>]*>([\s\S]*?)<\/retEvento>/)
    const escopoEvento = retEventoMatch ? retEventoMatch[1] : resultado.xml
    const cStat = escopoEvento.match(/<cStat>(\d+)<\/cStat>/)?.[1] || ""
    const xMotivo = escopoEvento.match(/<xMotivo>([^<]+)<\/xMotivo>/)?.[1] || resultado.erro || ""
    const nProtEvento = escopoEvento.match(/<nProt>([^<]+)<\/nProt>/)?.[1] || ""

    // Registrar transmissao
    await pool.execute(
      `INSERT INTO nfe_transmissoes (nfe_id, tipo, xml_envio, xml_retorno, sucesso, codigo_status, mensagem_status, tempo_resposta_ms)
       VALUES (?, 'cancelamento', ?, ?, ?, ?, ?, ?)`,
      [
        nfe.id,
        xmlAssinado.substring(0, 65535),
        (resultado.xml || "").substring(0, 65535),
        cStat === "135" || cStat === "155" ? 1 : 0,
        cStat,
        xMotivo,
        resultado.tempoMs,
      ],
    )

    // 135 = Evento registrado e vinculado a NF-e
    // 155 = Evento registrado, mas vinculacao a NF-e foi feita fora do prazo (cancelamento homologado)
    if (cStat === "135" || cStat === "155") {
      try {
        await pool.execute(
          "UPDATE nfe_emitidas SET status = 'cancelada', data_cancelamento = NOW(), motivo_cancelamento = ? WHERE id = ?",
          [justificativa, nfe.id],
        )
      } catch {
        // Fallback caso a coluna motivo_cancelamento nao exista no schema
        await pool.execute(
          "UPDATE nfe_emitidas SET status = 'cancelada', data_cancelamento = NOW() WHERE id = ?",
          [nfe.id],
        )
      }

      return NextResponse.json({
        success: true,
        message: `NF-e cancelada com sucesso! (${cStat}: ${xMotivo})`,
        data: { cStat, xMotivo, protocoloCancelamento: nProtEvento },
      })
    }

    // Rejeitado pela SEFAZ
    return NextResponse.json({
      success: false,
      message: `Cancelamento rejeitado pela SEFAZ${cStat ? ` (${cStat})` : ""}: ${xMotivo || "motivo nao informado"}`,
      data: { cStat, xMotivo },
    })
  } catch (error: any) {
    console.error("Erro ao cancelar NF-e:", error)
    return NextResponse.json({ success: false, message: "Erro interno: " + error.message }, { status: 500 })
  }
}

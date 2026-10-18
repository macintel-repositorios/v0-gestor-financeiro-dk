import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import nodemailer from "nodemailer"
import { resolverSmtp } from "@/lib/smtp-config"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validações básicas
    if (!data.assunto?.trim()) {
      return NextResponse.json({ success: false, message: "Assunto é obrigatório" }, { status: 400 })
    }
    if (!data.corpo?.trim()) {
      return NextResponse.json({ success: false, message: "Corpo do email é obrigatório" }, { status: 400 })
    }
    if (!data.destinatarios || data.destinatarios.length === 0) {
      return NextResponse.json({ success: false, message: "Selecione pelo menos um destinatário" }, { status: 400 })
    }
    // Senha vazia na tela = usar a configuração/senha salva
    data.smtp = await resolverSmtp(data.smtp)
    if (!data.smtp?.host || !data.smtp?.user || !data.smtp?.pass) {
      return NextResponse.json(
        { success: false, message: "Configurações SMTP incompletas" },
        { status: 400 }
      )
    }

    // 1. Criar a campanha no banco
    const campanhaResult: any = await query(
      `INSERT INTO email_campanhas (assunto, corpo, filtros, total_destinatarios, status, smtp_host, smtp_from, created_at)
       VALUES (?, ?, ?, ?, 'enviando', ?, ?, NOW())`,
      [
        data.assunto,
        data.corpo,
        data.filtros ? JSON.stringify(data.filtros) : null,
        data.destinatarios.length,
        data.smtp.host,
        data.smtp.from || data.smtp.user,
      ]
    )
    const campanhaId = campanhaResult.insertId

    // 2. Inserir destinatários
    for (const dest of data.destinatarios) {
      await query(
        `INSERT INTO email_campanha_destinatarios 
         (campanha_id, cliente_id, cliente_nome, email, tipo_email, status)
         VALUES (?, ?, ?, ?, ?, 'pendente')`,
        [campanhaId, dest.cliente_id, dest.cliente_nome, dest.email, dest.tipo || "principal"]
      )
    }

    // 3. Configurar transporter SMTP
    const transporter = nodemailer.createTransport({
      host: data.smtp.host,
      port: data.smtp.port || 587,
      secure: data.smtp.port === 465,
      auth: {
        user: data.smtp.user,
        pass: data.smtp.pass,
      },
    })

    // Assinatura (imagem) embutida como anexo inline (cid): aparece no Gmail/Outlook sem bloqueio
    // Texto digitado sem tags de bloco: preserva as quebras de linha no e-mail
    let html: string = /<(br|p|div|table)\b/i.test(data.corpo) ? data.corpo : String(data.corpo).replace(/\r?\n/g, "<br>")
    let attachments: any[] = []
    if (data.incluirAssinatura) {
      const rows: any = await query(`SELECT dados, formato FROM email_assinatura ORDER BY id DESC LIMIT 1`)
      const m = String(rows[0]?.dados || "").match(/^data:(image\/(?:png|jpe?g));base64,(.+)$/)
      if (m) {
        const cid = "assinatura@gestor-financeiro"
        html += `<br><br><img src="cid:${cid}" alt="Assinatura" style="max-width:600px;height:auto;display:block;border:0">`
        attachments = [
          { filename: `assinatura.${rows[0].formato || "png"}`, content: Buffer.from(m[2], "base64"), contentType: m[1], cid },
        ]
      }
    }

    let totalEnviados = 0
    let totalErros = 0
    const erros: { email: string; erro: string }[] = []

    // 4. Enviar emails em lote
    for (const dest of data.destinatarios) {
      try {
        await transporter.sendMail({
          from: `"${data.smtp.fromName || "Gestor Financeiro"}" <${data.smtp.from || data.smtp.user}>`,
          to: dest.email,
          subject: data.assunto,
          html,
          attachments,
        })

        // Atualizar status do destinatário
        await query(
          `UPDATE email_campanha_destinatarios 
           SET status = 'enviado', enviado_at = NOW()
           WHERE campanha_id = ? AND email = ?`,
          [campanhaId, dest.email]
        )

        totalEnviados++
        // Delay de 200ms entre envios para evitar bloqueio SMTP
        await new Promise((r) => setTimeout(r, 200))
      } catch (err: any) {
        totalErros++
        const errMsg = err?.message || "Erro desconhecido"
        erros.push({ email: dest.email, erro: errMsg })

        await query(
          `UPDATE email_campanha_destinatarios 
           SET status = 'erro', erro_msg = ?
           WHERE campanha_id = ? AND email = ?`,
          [errMsg, campanhaId, dest.email]
        )
      }
    }

    // 5. Finalizar campanha
    await query(
      `UPDATE email_campanhas 
       SET status = ?, total_enviados = ?, total_erros = ?, enviado_at = NOW()
       WHERE id = ?`,
      [totalErros > 0 && totalEnviados === 0 ? "erro" : "concluido", totalEnviados, totalErros, campanhaId]
    )

    return NextResponse.json({
      success: true,
      message: `Campanha finalizada: ${totalEnviados} enviados, ${totalErros} erros`,
      data: {
        campanha_id: campanhaId,
        total_enviados: totalEnviados,
        total_erros: totalErros,
        erros: erros.slice(0, 10), // Retornar no máximo 10 erros no response
      },
    })
  } catch (error: any) {
    console.error("Erro ao enviar campanha de email:", error)
    return NextResponse.json(
      { success: false, message: error?.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

"use client"

import { useEffect, useState } from "react"
import { OrdemServicoPrint } from "@/components/ordem-servico-print"

/**
 * Gera (fora da tela) o PDF da OS preventiva concluída ligada a uma NFS-e.
 * Chama onReady com o PDF, ou com null e o motivo quando não há OS concluída.
 */
export function OsPreventivaPdf({
  numeroNota,
  onReady,
}: {
  numeroNota: string
  onReady: (pdf: Blob | null, motivo?: string) => void
}) {
  const [dados, setDados] = useState<{ os: any; itens: any[]; fotos: any[]; assinaturas: any[] } | null>(null)

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      try {
        const res = await fetch(`/api/ordens-servico/preventiva-por-nota?numeroNota=${encodeURIComponent(numeroNota)}`)
        const result = await res.json()
        if (!result.success || !result.data) {
          if (!cancelado) onReady(null, result.motivo || result.message)
          return
        }
        const osId = result.data.id
        const [itensRes, fotosRes, assinaturasRes, osRes] = await Promise.all([
          fetch(`/api/ordens-servico/${osId}/itens`).then((r) => r.json()),
          fetch(`/api/ordens-servico/${osId}/fotos`).then((r) => r.json()),
          fetch(`/api/ordens-servico/${osId}/assinaturas`).then((r) => r.json()),
          fetch(`/api/ordens-servico/${osId}`).then((r) => r.json()),
        ])
        if (!osRes.success) {
          if (!cancelado) onReady(null, "Não foi possível carregar a OS")
          return
        }
        const os = osRes.data
        if (os.cliente_id) {
          const clienteRes = await fetch(`/api/clientes/${os.cliente_id}`).then((r) => r.json())
          if (clienteRes.success) os.cliente = clienteRes.data
        }
        if (!cancelado) {
          setDados({
            os,
            itens: itensRes.success ? itensRes.data : [],
            fotos: fotosRes.success ? fotosRes.data : [],
            assinaturas: assinaturasRes.success ? assinaturasRes.data : [],
          })
        }
      } catch (e: any) {
        if (!cancelado) onReady(null, e?.message || "Erro ao carregar a OS")
      }
    })()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeroNota])

  if (!dados) return null
  return (
    <OrdemServicoPrint
      ordemServico={dados.os}
      itens={dados.itens}
      fotos={dados.fotos}
      assinaturas={dados.assinaturas}
      onClose={() => {}}
      onPdfReady={(pdf) => onReady(pdf, pdf ? undefined : "Erro ao gerar o PDF da OS")}
    />
  )
}

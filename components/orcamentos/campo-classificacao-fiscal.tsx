"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NBS_OPCOES, SERVICOS_FISCAIS, getServicoFiscal } from "@/lib/nfse/servicos-fiscais"

/** Classificação fiscal do orçamento (tipo de serviço da NFS-e + NBS) */
export function CampoClassificacaoFiscal({
  servicoFiscal,
  onServicoFiscal,
  nbs,
  onNbs,
  obrigatorio = false,
}: {
  servicoFiscal: string
  onServicoFiscal: (v: string) => void
  nbs: string
  onNbs: (v: string) => void
  obrigatorio?: boolean
}) {
  const servico = getServicoFiscal(servicoFiscal)
  const nbsAtual = nbs || servico?.nbsPadrao || ""

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div>
        <Label className="text-xs">Classificação fiscal (NFS-e){obrigatorio ? " *" : ""}</Label>
        <Select
          value={servicoFiscal || undefined}
          onValueChange={(v) => {
            onServicoFiscal(v)
            onNbs(getServicoFiscal(v)?.nbsPadrao || "")
          }}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Selecione o tipo de serviço da nota" />
          </SelectTrigger>
          <SelectContent>
            {SERVICOS_FISCAIS.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {servico && (
        <>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            CNAE {servico.cnae} · Anexo {servico.anexo} · Código nacional {servico.codigoTributacaoNacional} · Municipal{" "}
            {servico.codigoTributacaoMunicipal} · Local: {servico.indOp === "050101" ? "na oficina" : "no cliente"} ({servico.indOp})
          </p>
          <div>
            <Label className="text-[10px]">Detalhamento do serviço (NBS)</Label>
            <Select value={nbsAtual} onValueChange={onNbs}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NBS_OPCOES.map((o) => (
                  <SelectItem key={o.codigo} value={o.codigo} className="text-xs">
                    {o.codigo} — {o.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  )
}

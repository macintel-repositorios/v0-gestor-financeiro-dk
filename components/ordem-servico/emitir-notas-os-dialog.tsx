"use client"

// Emissão de nota a partir de uma OS de manutenção concluída (serviço avulso, sem orçamento).
// Reaproveita as telas de emissão existentes: NFS-e (serviço) e NF-e (material fornecido pela Macintel).
import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FileText, Package, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EmitirNfseDialog } from "@/components/nfse/emitir-nfse-dialog"
import { EmitirNfeDialog } from "@/components/nfe/emitir-nfe-dialog"

export interface OsParaNota {
  id: number
  numero: string
  cliente_id: number
  servico_realizado?: string | null
}

export interface NotasDaOs {
  nfse?: string | null // número da NFS-e já emitida
  nfe?: string | null // número da NF-e já autorizada
}

export function EmitirNotasOsDialog({
  os,
  emitidas,
  open,
  onOpenChange,
  onEmitida,
}: {
  os: OsParaNota | null
  emitidas: NotasDaOs
  open: boolean
  onOpenChange: (open: boolean) => void
  onEmitida?: () => void
}) {
  const { toast } = useToast()
  const [querNfse, setQuerNfse] = useState(false)
  const [querNfe, setQuerNfe] = useState(false)
  const [cliente, setCliente] = useState<any>(null)
  const [carregando, setCarregando] = useState(false)
  // etapa atual: escolha → nfse → nfe
  const [etapa, setEtapa] = useState<"escolha" | "nfse" | "nfe" | null>(null)
  // ref: onSuccess e onOpenChange(false) da NFS-e chegam no mesmo ciclo (estado ainda não atualizado)
  const nfseOk = useRef(false)

  useEffect(() => {
    if (!open || !os) return
    setQuerNfse(!emitidas.nfse)
    setQuerNfe(false)
    setEtapa("escolha")
    nfseOk.current = false
    setCarregando(true)
    fetch(`/api/clientes/${os.cliente_id}`)
      .then((r) => r.json())
      .then((r) => setCliente(r.success ? r.data : null))
      .catch(() => setCliente(null))
      .finally(() => setCarregando(false))
    // só ao abrir para uma OS: o objeto `os` é recriado a cada render da lista e reiniciaria a emissão no meio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, os?.id])

  const fechar = () => {
    setEtapa(null)
    onOpenChange(false)
  }

  const continuar = () => {
    if (!querNfse && !querNfe) {
      toast({ title: "Selecione o tipo de nota", description: "Marque NFS-e, NF-e ou as duas.", variant: "destructive" })
      return
    }
    if (!cliente) {
      toast({ title: "Cliente não encontrado", description: "Verifique o cliente da OS.", variant: "destructive" })
      return
    }
    setEtapa(querNfse ? "nfse" : "nfe")
  }

  // Ao concluir a NFS-e, segue para a NF-e se ela também foi escolhida; se a NFS-e for cancelada, encerra
  // A tela da NFS-e chama onOpenChange(false) ANTES de onSuccess: decide no próximo ciclo
  const aposNfse = () => {
    setTimeout(() => {
      if (querNfe && nfseOk.current) setEtapa("nfe")
      else fechar()
    }, 0)
  }

  if (!os) return null

  const descricao =
    `${String(os.servico_realizado || "").trim() || "Serviço de manutenção"}\n` + `Ref. OS nº ${os.numero}`

  const dadosCliente = cliente
    ? {
        cliente_id: Number(os.cliente_id),
        cliente_nome: cliente.nome,
        cliente_cnpj: cliente.cnpj || "",
        cliente_cpf: cliente.cpf || "",
        cliente_email: cliente.email || "",
        cliente_telefone: cliente.telefone || "",
        cliente_endereco: cliente.endereco || "",
        cliente_bairro: cliente.bairro || "",
        cliente_cidade: cliente.cidade || "",
        cliente_uf: cliente.estado || "",
        cliente_cep: cliente.cep || "",
      }
    : {}

  return (
    <>
      <Dialog open={open && etapa === "escolha"} onOpenChange={(v) => !v && fechar()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Emitir nota — OS {os.numero}</DialogTitle>
            <DialogDescription>
              {cliente?.nome || "Carregando cliente..."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div
              role="button"
              onClick={() => !emitidas.nfse && setQuerNfse((v) => !v)}
              className={`flex items-start gap-3 rounded-md border p-3 ${emitidas.nfse ? "opacity-50" : "cursor-pointer hover:bg-muted/40"}`}
            >
              <Checkbox
                checked={querNfse}
                disabled={!!emitidas.nfse}
                onCheckedChange={(v) => setQuerNfse(v === true)}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label className="flex items-center gap-1.5 font-semibold">
                  <FileText className="h-4 w-4 text-emerald-500" /> NFS-e — Serviço
                </Label>
                <p className="text-xs text-muted-foreground">
                  Conserto / manutenção corretiva (14.01.01). Descrição = Serviço Realizado da OS; informe o valor.
                </p>
                {emitidas.nfse && <p className="text-xs font-semibold text-emerald-600">Já emitida: {emitidas.nfse}</p>}
              </div>
            </div>

            <div
              role="button"
              onClick={() => !emitidas.nfe && setQuerNfe((v) => !v)}
              className={`flex items-start gap-3 rounded-md border p-3 ${emitidas.nfe ? "opacity-50" : "cursor-pointer hover:bg-muted/40"}`}
            >
              <Checkbox
                checked={querNfe}
                disabled={!!emitidas.nfe}
                onCheckedChange={(v) => setQuerNfe(v === true)}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label className="flex items-center gap-1.5 font-semibold">
                  <Package className="h-4 w-4 text-blue-500" /> NF-e — Material fornecido pela Macintel
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inclua os materiais pelo cadastro de produtos (valor preenchido pelo cadastro).
                </p>
                {emitidas.nfe && <p className="text-xs font-semibold text-blue-600">Já emitida: NF-e {emitidas.nfe}</p>}
              </div>
            </div>
            {querNfse && querNfe && (
              <p className="text-xs text-muted-foreground">A NFS-e será emitida primeiro; em seguida abre a NF-e.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={fechar}>
              Cancelar
            </Button>
            <Button onClick={continuar} disabled={carregando || (!!emitidas.nfse && !!emitidas.nfe)}>
              {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {etapa === "nfse" && (
        <EmitirNfseDialog
          open
          onOpenChange={(v) => !v && aposNfse()}
          onSuccess={() => {
            nfseOk.current = true
            onEmitida?.()
          }}
          dadosOrigem={{
            origem: "ordem_servico",
            origem_id: Number(os.id),
            origem_numero: os.numero,
            ...dadosCliente,
            descricao,
            valor: 0, // obrigatório: a própria tela exige valor maior que zero
            servico_fiscal: "conserto",
          }}
        />
      )}

      {etapa === "nfe" && (
        <EmitirNfeDialog
          open
          onOpenChange={(v) => !v && fechar()}
          onSuccess={() => onEmitida?.()}
          dadosOrigem={{
            origem: "ordem_servico",
            origem_id: Number(os.id),
            origem_numero: os.numero,
            ...dadosCliente,
            itens: [],
          }}
        />
      )}
    </>
  )
}

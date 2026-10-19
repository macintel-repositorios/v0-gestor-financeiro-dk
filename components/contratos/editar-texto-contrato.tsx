"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/rich-text-editor"
import { toast } from "@/hooks/use-toast"
import { Loader2, RotateCcw, Save } from "lucide-react"

/**
 * Edição do texto (cláusulas) de UM contrato — para exigências específicas do cliente.
 * Não altera o modelo geral (Configurações > Termos).
 */
export function EditarTextoContrato({
  open,
  onOpenChange,
  numero,
  conteudoAtual,
  onSalvo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  numero: string
  conteudoAtual: string
  onSalvo: (conteudo: string) => void
}) {
  const [conteudo, setConteudo] = useState(conteudoAtual || "")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (open) setConteudo(conteudoAtual || "")
  }, [open, conteudoAtual])

  const salvar = async (body: Record<string, unknown>, mensagem: string) => {
    setSalvando(true)
    try {
      const r = await fetch(`/api/contratos/${numero}/texto`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((x) => x.json())
      if (!r.success) throw new Error(r.message)
      setConteudo(r.data.conteudo_contrato)
      onSalvo(r.data.conteudo_contrato)
      toast({ title: mensagem })
      return true
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.message, variant: "destructive" })
      return false
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card text-foreground border-l border-border w-full sm:max-w-5xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Texto do Contrato Nº {numero}</SheetTitle>
          <SheetDescription>
            Ajuste as cláusulas só deste contrato (exigências do cliente). O modelo geral em Configurações &gt; Termos não
            é alterado. Mantenha os campos entre colchetes, como [NOME] e [VALOR_MENSAL] — eles são preenchidos
            automaticamente na impressão.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 border border-border rounded-md overflow-hidden">
          <RichTextEditor papel value={conteudo} onChange={setConteudo} placeholder="Texto do contrato" />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-4">
          <Button
            variant="outline"
            disabled={salvando}
            onClick={() => {
              if (
                confirm(
                  "Substituir o texto deste contrato pelo modelo atual de Configurações > Termos?\n\nAs alterações feitas só neste contrato serão perdidas."
                )
              ) {
                salvar({ restaurarModelo: true }, "Texto restaurado a partir do modelo atual")
              }
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar do modelo atual
          </Button>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={salvando}
              onClick={async () => {
                if (await salvar({ conteudo_contrato: conteudo }, "Texto do contrato salvo")) onOpenChange(false)
              }}
            >
              {salvando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar texto
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

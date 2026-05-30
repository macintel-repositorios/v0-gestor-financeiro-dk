"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Save, Wrench, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NovoServicoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NovoServicoDialog({ open, onOpenChange, onSuccess }: NovoServicoDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [gerandoCodigo, setGerandoCodigo] = useState(false)
  const [codigo, setCodigo] = useState("")
  const [formData, setFormData] = useState({
    descricao: "",
    valor_mao_obra: 180,
    observacoes: "",
    ativo: true,
  })

  // Gerar código automaticamente quando abrir
  useEffect(() => {
    if (open) {
      setFormData({
        descricao: "",
        valor_mao_obra: 180,
        observacoes: "",
        ativo: true,
      })
      setCodigo("")
      gerarCodigoServico()
    }
  }, [open])

  const gerarCodigoServico = async () => {
    try {
      setGerandoCodigo(true)
      const response = await fetch("/api/produtos/generate-service-code")
      const result = await response.json()

      if (result.success) {
        setCodigo(result.data.codigo)
      } else {
        const timestamp = Date.now().toString().slice(-3)
        setCodigo(`015${timestamp}`)
      }
    } catch (error) {
      console.error("Erro ao gerar código:", error)
      const timestamp = Date.now().toString().slice(-3)
      setCodigo(`015${timestamp}`)
    } finally {
      setGerandoCodigo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Descrição do serviço é obrigatória",
        variant: "destructive",
      })
      return
    }

    if (!codigo) {
      toast({
        title: "Erro",
        description: "Erro ao gerar código do serviço",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: codigo,
          descricao: formData.descricao.trim(),
          tipo: "Serviços",
          marca: "Nenhuma marca",
          ncm: null,
          unidade: "SV",
          valor_unitario: 0,
          valor_mao_obra: formData.valor_mao_obra,
          valor_custo: 0,
          margem_lucro: 0,
          estoque: 0,
          estoque_minimo: 0,
          observacoes: formData.observacoes.trim() || null,
          ativo: formData.ativo,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: `Serviço ${result.data.codigo} criado com sucesso!`,
        })
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao criar serviço",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar serviço:", error)
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Novo Serviço
          </SheetTitle>
          <SheetDescription>Cadastre um novo serviço no sistema</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2 flex-1 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código do Serviço</Label>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 mt-1.5">
                {gerandoCodigo ? (
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Gerando código...</span>
                  </div>
                ) : (
                  <p className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">{codigo}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição do Serviço *
              </Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Ex: Instalação de ar condicionado..."
                required
                className="w-full border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valor_mao_obra" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Valor da Mão de Obra (R$) *
              </Label>
              <Input
                id="valor_mao_obra"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_mao_obra}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, valor_mao_obra: Number.parseFloat(e.target.value) || 0 }))
                }
                placeholder="180.00"
                required
                className="w-full border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacoes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Detalhes adicionais..."
                rows={3}
                className="w-full resize-none border-border bg-background"
              />
            </div>

            <div className="flex items-center space-x-3 p-3 bg-muted/40 rounded-lg border border-border">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, ativo: checked }))}
              />
              <div>
                <Label htmlFor="ativo" className="text-xs font-semibold">
                  Serviço ativo
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Aparece nas listagens e pode ser selecionado
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 mt-auto border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || gerandoCodigo}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-10"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

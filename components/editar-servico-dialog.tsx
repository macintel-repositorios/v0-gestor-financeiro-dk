"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Save, Loader2, Lock, Wrench } from "lucide-react"

interface EditarServicoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  servico: {
    id: string
    codigo: string
    descricao: string
    valor_mao_obra: number
    observacoes?: string
    ativo: boolean
  } | null
  onSuccess?: () => void
}

export function EditarServicoDialog({ open, onOpenChange, servico, onSuccess }: EditarServicoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    descricao: "",
    valor_mao_obra: 180,
    observacoes: "",
    ativo: true,
  })

  const { toast } = useToast()

  // Carregar dados do serviço quando o modal abrir
  useEffect(() => {
    if (open && servico) {
      setFormData({
        descricao: servico.descricao || "",
        valor_mao_obra: servico.valor_mao_obra || 180,
        observacoes: servico.observacoes || "",
        ativo: servico.ativo !== false,
      })
    }
  }, [open, servico])

  // Resetar formulário quando fechar
  useEffect(() => {
    if (!open) {
      setFormData({
        descricao: "",
        valor_mao_obra: 180,
        observacoes: "",
        ativo: true,
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!servico?.id) return

    if (!formData.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/produtos/${servico.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          descricao: formData.descricao.trim(),
          tipo: "Serviços",
          marca: "Nenhuma marca",
          ncm: null,
          unidade: "SV",
          valor_unitario: 0, // Para serviços, valor unitário deve ser 0
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
          title: "Sucesso!",
          description: "Serviço atualizado com sucesso",
        })
        onSuccess?.()
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao atualizar serviço",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!servico) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Editar Serviço
          </SheetTitle>
          <SheetDescription>Edite as informações do serviço</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Código (somente leitura) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código do Serviço</Label>
              <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg border border-border">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono font-bold text-foreground text-sm">{servico.codigo}</span>
                <span className="text-[10px] text-muted-foreground ml-2">(não pode ser alterado)</span>
              </div>
            </div>

            {/* Descrição do Serviço */}
            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição do Serviço *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData((prev) => ({ ...prev, ...{ descricao: e.target.value } }))}
                placeholder="Ex: Instalação de ar condicionado, Manutenção preventiva..."
                required
                className="h-9 border-border bg-background text-xs"
              />
            </div>

            {/* Tipo (fixo) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</Label>
              <div className="bg-muted/40 border border-border rounded-lg p-3">
                <p className="text-foreground text-xs font-semibold">Serviços</p>
              </div>
            </div>

            {/* Valor da Mão de Obra */}
            <div className="space-y-1.5">
              <Label htmlFor="valor_mao_obra" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor da Mão de Obra (R$) *</Label>
              <Input
                id="valor_mao_obra"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_mao_obra}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ...{ valor_mao_obra: Number.parseFloat(e.target.value) || 0 } }))
                }
                placeholder="180.00"
                required
                className="h-9 border-border bg-background text-xs"
              />
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label htmlFor="observacoes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData((prev) => ({ ...prev, ...{ observacoes: e.target.value } }))}
                placeholder="Detalhes sobre o serviço..."
                rows={3}
                className="resize-none border-border bg-background text-xs"
              />
            </div>

            {/* Serviço Ativo */}
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, ...{ ativo: checked } }))}
              />
              <Label htmlFor="ativo" className="text-xs font-semibold cursor-pointer">
                Serviço ativo
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 mt-auto border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1 h-10">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
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

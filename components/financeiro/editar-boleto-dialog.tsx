"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Edit, Save, X } from "lucide-react"

interface Boleto {
  id: number
  numero: string
  cliente_id: number
  cliente_nome: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: string
  numero_parcela: number
  total_parcelas: number
  observacoes?: string
}

interface EditarBoletoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boleto: Boleto
  onSuccess: () => void
}

export function EditarBoletoDialog({ open, onOpenChange, boleto, onSuccess }: EditarBoletoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    valor: "",
    data_vencimento: "",
    data_pagamento: "",
    status: "",
    observacoes: "",
  })

  // Função para converter data ISO para formato YYYY-MM-DD
  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  useEffect(() => {
    if (boleto && open) {
      setFormData({
        valor: boleto.valor.toString(),
        data_vencimento: formatDateForInput(boleto.data_vencimento),
        data_pagamento: boleto.data_pagamento ? formatDateForInput(boleto.data_pagamento) : "",
        status: boleto.status,
        observacoes: boleto.observacoes || "",
      })
    }
  }, [boleto, open])

  // Função para lidar com mudança de status
  const handleStatusChange = (newStatus: string) => {
    setFormData((prev) => {
      const updated = { ...prev, status: newStatus }

      // Se mudou para "pago" e não tem data de pagamento, usar data de vencimento
      if (newStatus === "pago" && !prev.data_pagamento) {
        updated.data_pagamento = prev.data_vencimento
      }

      // Se mudou para outro status que não seja "pago", limpar data de pagamento
      if (newStatus !== "pago") {
        updated.data_pagamento = ""
      }

      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.valor || !formData.data_vencimento || !formData.status) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Validar data de pagamento se status for "pago"
    if (formData.status === "pago" && !formData.data_pagamento) {
      toast({
        title: "Erro",
        description: "Data de pagamento é obrigatória quando o status é 'Pago'",
        variant: "destructive",
      })
      return
    }

    const valor = Number.parseFloat(formData.valor)
    if (isNaN(valor) || valor <= 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser um número positivo",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/boletos/${boleto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valor,
          data_vencimento: formData.data_vencimento,
          data_pagamento: formData.status === "pago" ? formData.data_pagamento : null,
          status: formData.status,
          observacoes: formData.observacoes,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Boleto atualizado com sucesso!",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao atualizar boleto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar boleto:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar boleto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl h-full flex flex-col p-0 gap-0 overflow-hidden border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="border-b border-border p-6 flex-shrink-0 bg-muted/30">
          <SheetTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="p-2 bg-muted rounded-lg text-foreground">
              <Edit className="h-5 w-5" />
            </div>
            Editar Boleto
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            Altere as informações do boleto conforme necessário
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Número</Label>
                <Input value={boleto.numero} disabled className="bg-muted/50 border-border text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Parcela</Label>
                <Input
                  value={`${boleto.numero_parcela}/${boleto.total_parcelas}`}
                  disabled
                  className="bg-muted/50 border-border text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Cliente</Label>
              <Input value={boleto.cliente_nome} disabled className="bg-muted/50 border-border text-muted-foreground" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor" className="text-sm font-semibold text-foreground">
                  Valor *
                </Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-indigo-500 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_vencimento" className="text-sm font-semibold text-foreground">
                  Data de Vencimento *
                </Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-indigo-500 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold text-foreground">
                Status *
              </Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="border-border bg-background text-foreground focus:border-indigo-500 focus:ring-indigo-500/20">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aguardando_pagamento">Aguardando Pagamento</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === "pago" && (
              <div className="space-y-2">
                <Label htmlFor="data_pagamento" className="text-sm font-semibold text-foreground">
                  Data de Pagamento *
                </Label>
                <Input
                  id="data_pagamento"
                  type="date"
                  value={formData.data_pagamento}
                  onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-indigo-500 focus:ring-indigo-500/20"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-sm font-semibold text-foreground">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                className="border-border bg-background text-foreground focus:border-indigo-500 focus:ring-indigo-500/20 min-h-[80px]"
              />
            </div>
          </div>

          <SheetFooter className="gap-3 p-6 border-t border-border bg-muted/30 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-border hover:bg-muted bg-card text-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

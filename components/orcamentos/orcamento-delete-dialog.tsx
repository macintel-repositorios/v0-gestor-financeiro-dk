"use client"

import type React from "react"
import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Orcamento {
  id: string
  numero: string
  cliente_nome: string
  valor_total: number
  situacao: string
  data_orcamento: string
}

interface OrcamentoDeleteDialogProps {
  orcamento: Orcamento
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function OrcamentoDeleteDialog({ orcamento, onSuccess, trigger }: OrcamentoDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/orcamentos/${orcamento.numero}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Orçamento excluído com sucesso!",
        })
        setOpen(false)
        onSuccess()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao excluir orçamento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir orçamento",
        variant: "destructive",
      })
      console.error("Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pendente: "bg-yellow-500/10 text-yellow-500 border-0",
      aprovado: "bg-emerald-500/10 text-emerald-500 border-0",
      "enviado por email": "bg-blue-500/10 text-blue-500 border-0",
      "nota fiscal emitida": "bg-purple-500/10 text-purple-500 border-0",
      concluido: "bg-emerald-500/10 text-emerald-500 border-0",
    }
    const label = {
      pendente: "Pendente",
      aprovado: "Aprovado",
      "enviado por email": "Enviado",
      "nota fiscal emitida": "NF Emitida",
      concluido: "Concluído",
    }
    return (
      <Badge className={config[status as keyof typeof config] || "bg-muted text-muted-foreground"}>
        {label[status as keyof typeof label] || status}
      </Badge>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 hover:bg-red-500/10 border-red-200 dark:border-red-900/50 bg-transparent h-8 w-8 p-0" title="Excluir">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md h-full flex flex-col p-6 border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <SheetTitle className="text-red-600">Confirmar Exclusão</SheetTitle>
          </div>
          <SheetDescription>
            Esta ação não pode ser desfeita. O orçamento será permanentemente removido do sistema.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Número:</span>
              <span className="font-mono text-foreground">{orcamento.numero}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Cliente:</span>
              <span className="text-right max-w-[200px] truncate text-foreground">{orcamento.cliente_nome}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Data:</span>
              <span className="text-foreground">{formatDate(orcamento.data_orcamento)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Valor Total:</span>
              <span className="font-semibold text-foreground">{formatCurrency(orcamento.valor_total)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Situação:</span>
              <span>{getStatusBadge(orcamento.situacao)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 border-t border-border pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="flex-1 bg-transparent border-border hover:bg-muted">
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

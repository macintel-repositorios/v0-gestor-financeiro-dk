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
import { Trash2, AlertTriangle, Loader2, Clock, Calendar, PlayCircle, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OrdemServico {
  id: number
  numero: string
  cliente_nome?: string
  tipo_servico: string
  situacao: string
  data_atual: string
}

interface OrdemServicoDeleteDialogProps {
  ordemServico: OrdemServico
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function OrdemServicoDeleteDialog({ ordemServico, onSuccess, trigger }: OrdemServicoDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ordens-servico/${ordemServico.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success || response.ok) {
        toast({
          title: "Sucesso",
          description: "Ordem de serviço excluída com sucesso!",
        })
        setOpen(false)
        onSuccess()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao excluir ordem de serviço",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir ordem de serviço",
        variant: "destructive",
      })
      console.error("Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (situacao: string) => {
    switch (situacao) {
      case "rascunho":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-0">
            <AlertCircle className="w-3 h-3 mr-1" /> Rascunho
          </Badge>
        )
      case "aberta":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-0">
            <Clock className="w-3 h-3 mr-1" /> Aberta
          </Badge>
        )
      case "agendada":
        return (
          <Badge className="bg-cyan-100 text-cyan-800 border-0">
            <Calendar className="w-3 h-3 mr-1" /> Agendada
          </Badge>
        )
      case "em_andamento":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-0">
            <PlayCircle className="w-3 h-3 mr-1" /> Em Andamento
          </Badge>
        )
      case "concluida":
        return (
          <Badge className="bg-green-100 text-green-800 border-0">
            <CheckCircle className="w-3 h-3 mr-1" /> Concluída
          </Badge>
        )
      case "cancelada":
        return (
          <Badge className="bg-red-100 text-red-800 border-0">
            <XCircle className="w-3 h-3 mr-1" /> Cancelada
          </Badge>
        )
      default:
        return <Badge variant="secondary">Indefinido</Badge>
    }
  }

  const getTipoServicoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      manutencao: "Manutenção",
      orcamento: "Orçamento",
      vistoria_contrato: "Vistoria Contrato",
      preventiva: "Preventiva",
    }
    return tipos[tipo] || tipo
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
            Esta ação não pode ser desfeita. A ordem de serviço será permanentemente removida do sistema.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Número:</span>
              <span className="font-mono text-foreground">{ordemServico.numero}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Cliente:</span>
              <span className="text-right max-w-[200px] truncate text-foreground">{ordemServico.cliente_nome}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Tipo de Serviço:</span>
              <span className="text-foreground">{getTipoServicoLabel(ordemServico.tipo_servico)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Data:</span>
              <span className="text-foreground">
                {ordemServico.data_atual
                  ? new Date(ordemServico.data_atual.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR")
                  : "Não informada"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Situação:</span>
              <span>{getStatusBadge(ordemServico.situacao)}</span>
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

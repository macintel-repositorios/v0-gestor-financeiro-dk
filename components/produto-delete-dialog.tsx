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
import { toast } from "sonner"

interface Produto {
  id: string
  codigo: string
  descricao: string
  categoria_nome?: string
  marca_nome?: string
  valor_unitario: number
  estoque: number
  ativo: boolean
}

interface ProdutoDeleteDialogProps {
  produto: Produto
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function ProdutoDeleteDialog({ produto, onSuccess, trigger }: ProdutoDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/produtos/${produto.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Produto excluído com sucesso!")
        setOpen(false)
        onSuccess()
      } else {
        toast.error(result.message || "Erro ao excluir produto")
      }
    } catch (error) {
      toast.error("Erro ao excluir produto")
      console.error("Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
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
            Esta ação não pode ser desfeita. O produto será permanentemente removido do sistema.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Código:</span>
              <span className="font-mono text-foreground">{produto.codigo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Descrição:</span>
              <span className="text-right max-w-[200px] truncate text-foreground">{produto.descricao}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Categoria:</span>
              <span className="text-foreground">{produto.categoria_nome || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Marca:</span>
              <span className="text-foreground">{produto.marca_nome || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Valor:</span>
              <span className="font-medium text-foreground">{formatCurrency(produto.valor_unitario)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Estoque:</span>
              <span className="text-foreground">{produto.estoque}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <Badge variant={produto.ativo ? "default" : "secondary"}>{produto.ativo ? "Ativo" : "Inativo"}</Badge>
            </div>
          </div>

          {produto.estoque > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500 font-medium">Não é possível excluir!</span>
              </div>
              <p className="text-xs text-red-500 mt-1">
                Este produto possui {produto.estoque} unidades em estoque. Para excluir, primeiro zere o estoque.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6 border-t border-border pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="flex-1 bg-transparent border-border hover:bg-muted">
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading || produto.estoque > 0}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {produto.estoque > 0 ? "Estoque não zerado" : "Excluir"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

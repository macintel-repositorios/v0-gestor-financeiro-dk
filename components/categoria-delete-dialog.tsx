"use client"

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

interface Categoria {
  id: string
  codigo: string
  nome: string
  ativo: boolean
  total_produtos: number
}

interface CategoriaDeleteDialogProps {
  categoria: Categoria
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function CategoriaDeleteDialog({ categoria, onSuccess, trigger }: CategoriaDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/categorias/${categoria.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Categoria excluída com sucesso!",
        })
        setOpen(false)
        onSuccess()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao excluir categoria",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria",
        variant: "destructive",
      })
      console.error("Erro:", error)
    } finally {
      setLoading(false)
    }
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
            Esta ação não pode ser desfeita. A categoria será permanentemente removida do sistema.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Código:</span>
              <span className="font-mono text-foreground">{categoria.codigo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Nome:</span>
              <span className="font-medium text-foreground">{categoria.nome}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Produtos vinculados:</span>
              <Badge variant="outline" className="border-border text-foreground">{categoria.total_produtos}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <Badge variant={categoria.ativo ? "default" : "secondary"}>{categoria.ativo ? "Ativo" : "Inativo"}</Badge>
            </div>
          </div>

          {categoria.total_produtos > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500 font-medium">Atenção!</span>
              </div>
              <p className="text-xs text-red-500 mt-1">
                Esta categoria possui {categoria.total_produtos} produto(s) vinculado(s). A exclusão não será permitida.
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
            disabled={loading || categoria.total_produtos > 0}
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

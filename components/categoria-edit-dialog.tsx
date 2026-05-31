"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Tag, Loader2, Save } from "lucide-react"

interface Categoria {
  id: string
  nome: string
  codigo: string
  descricao?: string
  ativo: boolean
}

interface CategoriaEditDialogProps {
  categoria: Categoria | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CategoriaEditDialog({ categoria, open, onOpenChange, onSuccess }: CategoriaEditDialogProps) {
  const [nome, setNome] = useState("")
  const [codigo, setCodigo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (categoria) {
      setNome(categoria.nome)
      setCodigo(categoria.codigo)
      setDescricao(categoria.descricao || "")
      setAtivo(categoria.ativo)
    }
  }, [categoria])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoria) return

    setLoading(true)

    try {
      const response = await fetch(`/api/categorias/${categoria.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          codigo,
          descricao,
          ativo,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao atualizar categoria",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error)
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
            <Tag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Editar Categoria
          </SheetTitle>
          <SheetDescription>Faça as alterações necessárias na categoria.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nome *
              </Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="border-border bg-background" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="codigo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Código
              </Label>
              <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} className="border-border bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição
              </Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="resize-none border-border bg-background text-xs"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
              <Label htmlFor="ativo" className="text-xs font-semibold cursor-pointer">
                Categoria ativa
              </Label>
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-4 mt-auto border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1 h-10">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-10">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
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

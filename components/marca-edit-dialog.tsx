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
import { Award, Loader2, Save } from "lucide-react"

interface Marca {
  id: string
  nome: string
  sigla: string
  contador: number
  descricao?: string
  ativo: boolean
}

interface MarcaEditDialogProps {
  marca: Marca | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function MarcaEditDialog({ marca, open, onOpenChange, onSuccess }: MarcaEditDialogProps) {
  const [nome, setNome] = useState("")
  const [sigla, setSigla] = useState("")
  const [descricao, setDescricao] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (marca) {
      setNome(marca.nome)
      setSigla(marca.sigla)
      setDescricao(marca.descricao || "")
      setAtivo(marca.ativo)
    }
  }, [marca])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!marca) return

    setLoading(true)

    try {
      const response = await fetch(`/api/marcas/${marca.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          sigla,
          descricao,
          ativo,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Marca atualizada com sucesso",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao atualizar marca",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar marca:", error)
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
            <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Editar Marca
          </SheetTitle>
          <SheetDescription>Faça as alterações necessárias na marca.</SheetDescription>
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
              <Label htmlFor="sigla" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sigla
              </Label>
              <Input
                id="sigla"
                value={sigla}
                onChange={(e) => setSigla(e.target.value)}
                className="border-border bg-background"
                maxLength={10}
              />
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
                Marca ativa
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

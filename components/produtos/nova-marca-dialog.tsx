"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Save, Award, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NovaMarcaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NovaMarcaDialog({ open, onOpenChange, onSuccess }: NovaMarcaDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [previewSigla, setPreviewSigla] = useState("")
  const [formData, setFormData] = useState({
    nome: "",
    ativo: true,
  })

  // Reset form
  useEffect(() => {
    if (open) {
      setFormData({
        nome: "",
        ativo: true,
      })
      setPreviewSigla("")
    }
  }, [open])

  const generatePreviewSigla = (nome: string) => {
    if (!nome.trim()) {
      setPreviewSigla("")
      return
    }

    // Gerar sigla com consoantes
    const consoantes = nome
      .toUpperCase()
      .replace(/[AEIOUÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜ\s]/g, "")
      .substring(0, 3)

    setPreviewSigla(consoantes)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/marcas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Marca criada com sucesso!",
          description: `Marca "${formData.nome}" foi cadastrada.`,
        })
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast({
          title: "Erro ao criar marca",
          description: result.message || "Ocorreu um erro inesperado.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar marca:", error)
      toast({
        title: "Erro ao criar marca",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "nome") {
      generatePreviewSigla(value)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Nova Marca
          </SheetTitle>
          <SheetDescription>Cadastre uma nova marca de produto</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            {previewSigla && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Award className="h-4 w-4" />
                  <span className="font-medium text-xs">Sigla que será gerada:</span>
                  <span className="font-mono font-bold">{previewSigla}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Gerada automaticamente usando as consoantes do nome</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nome" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nome da Marca *
              </Label>
              <Input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Ex: Samsung, Apple, Nike..."
                required
                className="w-full h-10 border-border bg-background"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border border-border">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-xs text-muted-foreground">Marca ativa pode ser usada em produtos</p>
              </div>
              <Switch checked={formData.ativo} onCheckedChange={(checked) => handleInputChange("ativo", checked)} />
            </div>
          </div>

          <div className="flex gap-3 pt-6 mt-auto border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.nome.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-10"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
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

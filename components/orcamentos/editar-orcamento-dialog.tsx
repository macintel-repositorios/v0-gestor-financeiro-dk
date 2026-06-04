"use client"

import { useState, useEffect, useRef } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EditarOrcamentoClient } from "@/components/editar-orcamento-client"
import { Loader2, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EditarOrcamentoDialogProps {
  numero: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditarOrcamentoDialog({
  numero,
  open,
  onOpenChange,
  onSuccess,
}: EditarOrcamentoDialogProps) {
  const [orcamento, setOrcamento] = useState<any>(null)
  const [itensIniciais, setItensIniciais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  const triggerSaveRef = useRef<(() => Promise<boolean>) | null>(null)

  useEffect(() => {
    if (open && numero) {
      loadOrcamento()
    }
  }, [open, numero])

  const loadOrcamento = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orcamentos/${numero}`)
      const result = await response.json()

      if (result.success) {
        const data = result.data
        setOrcamento(data)
        setItensIniciais(data.itens || [])
      } else {
        toast({
          title: "Erro",
          description: "Erro ao buscar orçamento para edição",
          variant: "destructive",
        })
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Erro ao buscar orçamento para edição:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão ao buscar orçamento",
        variant: "destructive",
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = async (openState: boolean) => {
    if (!openState) {
      // Auto-save changes before closing
      if (triggerSaveRef.current) {
        toast({
          title: "Salvando...",
          description: "Gravando alterações antes de fechar o painel.",
        })
        await triggerSaveRef.current()
      }
      onOpenChange(false)
    } else {
      onOpenChange(true)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Editar Orçamento
          </SheetTitle>
          <SheetDescription>Faça as alterações necessárias e recalcule os valores.</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-xs text-muted-foreground mt-2">Carregando dados do orçamento...</p>
          </div>
        ) : orcamento ? (
          <div className="flex-1">
            <EditarOrcamentoClient
              orcamento={orcamento}
              itensIniciais={itensIniciais}
              onClose={() => handleOpenChange(false)}
              onSuccess={() => {
                onSuccess()
              }}
              asDrawer={true}
              triggerSaveRef={triggerSaveRef}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground text-sm">Erro ao carregar orçamento.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

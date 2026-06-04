"use client"

import { useRef } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FileText } from "lucide-react"
import EditarPropostaPage from "@/app/contratos/proposta/[numero]/editar/page"
import { useToast } from "@/hooks/use-toast"

interface EditarPropostaDialogProps {
  numero: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditarPropostaDialog({ numero, open, onOpenChange, onSuccess }: EditarPropostaDialogProps) {
  const { toast } = useToast()
  const triggerSaveRef = useRef<(() => Promise<boolean>) | null>(null)

  if (!numero) return null

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
            <FileText className="h-5 w-5 text-purple-600" />
            Editar Proposta {numero}
          </SheetTitle>
          <SheetDescription>Ajuste os parâmetros comerciais e equipamentos da proposta.</SheetDescription>
        </SheetHeader>

        <div className="flex-1">
          <EditarPropostaPage
            numero={numero}
            onClose={() => handleOpenChange(false)}
            onSuccess={onSuccess}
            asDrawer={true}
            triggerSaveRef={triggerSaveRef}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

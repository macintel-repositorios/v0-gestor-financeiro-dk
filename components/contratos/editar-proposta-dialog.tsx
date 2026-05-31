"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FileText } from "lucide-react"
import EditarPropostaPage from "@/app/contratos/proposta/[numero]/editar/page"

interface EditarPropostaDialogProps {
  numero: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditarPropostaDialog({ numero, open, onOpenChange, onSuccess }: EditarPropostaDialogProps) {
  if (!numero) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
            asDrawer={true}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

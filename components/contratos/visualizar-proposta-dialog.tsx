"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FileText } from "lucide-react"
import VisualizarPropostaPage from "@/app/contratos/proposta/[numero]/page"

interface VisualizarPropostaDialogProps {
  numero: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditClick: (numero: string) => void
}

export function VisualizarPropostaDialog({ numero, open, onOpenChange, onEditClick }: VisualizarPropostaDialogProps) {
  if (!numero) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Visualizar Proposta
          </SheetTitle>
          <SheetDescription>Detalhes comerciais e equipamentos da proposta.</SheetDescription>
        </SheetHeader>

        <div className="flex-1">
          <VisualizarPropostaPage
            numero={numero}
            onClose={() => onOpenChange(false)}
            onEditClick={onEditClick}
            asDrawer={true}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

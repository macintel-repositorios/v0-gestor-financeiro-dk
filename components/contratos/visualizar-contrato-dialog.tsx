"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FileText } from "lucide-react"
import ContratoPage from "@/app/contratos/[numero]/page"

interface VisualizarContratoDialogProps {
  numero: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditClick: (numero: string) => void
  onSuccess: () => void
}

export function VisualizarContratoDialog({ numero, open, onOpenChange, onEditClick, onSuccess }: VisualizarContratoDialogProps) {
  if (!numero) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Visualizar Contrato
          </SheetTitle>
          <SheetDescription>Confira o termo, serviços, equipamentos e histórico do contrato.</SheetDescription>
        </SheetHeader>

        <div className="flex-1">
          <ContratoPage
            numero={numero}
            onClose={() => onOpenChange(false)}
            onEditClick={onEditClick}
            onSuccess={onSuccess}
            asDrawer={true}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

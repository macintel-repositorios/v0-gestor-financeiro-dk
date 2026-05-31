"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FileText } from "lucide-react"
import EditarContratoPage from "@/app/contratos/[numero]/editar/page"

interface EditarContratoDialogProps {
  numero: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditarContratoDialog({ numero, open, onOpenChange, onSuccess }: EditarContratoDialogProps) {
  if (!numero) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Editar Contrato {numero}
          </SheetTitle>
          <SheetDescription>Atualize os dados e condições comerciais do contrato.</SheetDescription>
        </SheetHeader>

        <div className="flex-1">
          <EditarContratoPage
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

"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Wrench } from "lucide-react"
import EditarOrdemServicoPage from "@/app/ordem-servico/[id]/editar/page"

interface EditarOSDialogProps {
  id: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditarOSDialog({ id, open, onOpenChange, onSuccess }: EditarOSDialogProps) {
  if (!id) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Executar Ordem de Serviço
          </SheetTitle>
          <SheetDescription>Complete as informações de execução do serviço.</SheetDescription>
        </SheetHeader>

        <div className="flex-1">
          <EditarOrdemServicoPage
            id={id}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
            asDrawer={true}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

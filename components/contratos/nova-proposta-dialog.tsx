"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { FileText } from "lucide-react"
import NovaPropostaPage from "@/app/contratos/proposta/nova/page"

interface NovaPropostaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NovaPropostaDialog({ open, onOpenChange, onSuccess }: NovaPropostaDialogProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Nova Proposta
          </SheetTitle>
          <SheetDescription>Gere uma nova proposta comercial de contrato.</SheetDescription>
        </SheetHeader>

        <div className="flex-1">
          <NovaPropostaPage
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
            asDrawer={true}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

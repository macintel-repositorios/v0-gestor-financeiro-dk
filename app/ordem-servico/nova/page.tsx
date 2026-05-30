"use client"

import { useRouter } from "next/navigation"
import { NovaOSDialog } from "@/components/ordem-servico/nova-os-dialog"

export default function NovaOrdemServicoPage() {
  const router = useRouter()
  return (
    <div className="p-6">
      <NovaOSDialog
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            router.back()
          }
        }}
        onSuccess={() => {
          router.push("/ordem-servico")
        }}
      />
    </div>
  )
}

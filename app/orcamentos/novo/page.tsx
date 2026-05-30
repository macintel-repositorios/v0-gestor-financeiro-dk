"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NovoOrcamentoRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/orcamentos?novo=true")
  }, [router])

  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )
}

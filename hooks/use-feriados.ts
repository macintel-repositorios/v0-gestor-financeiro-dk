"use client"

import { useEffect, useState } from "react"
import type { Feriado } from "@/lib/orcamento-parcelas"

// Feriados de Configurações > Feriados (buscados uma vez e compartilhados entre as telas)
let cache: Promise<Feriado[]> | null = null

export function useFeriados(): Feriado[] {
  const [feriados, setFeriados] = useState<Feriado[]>([])
  useEffect(() => {
    if (!cache) {
      cache = fetch("/api/configuracoes/feriados")
        .then((r) => r.json())
        .then((r) => (r.success && Array.isArray(r.data) ? r.data : []))
        .catch(() => {
          cache = null
          return []
        })
    }
    let ativo = true
    cache.then((f) => ativo && setFeriados(f))
    return () => {
      ativo = false
    }
  }, [])
  return feriados
}

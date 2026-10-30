"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

/** Botãozinho que copia um texto para a área de transferência (mostra ✓ por 1,5 s). */
export function CopiarBotao({ texto, titulo = "Copiar" }: { texto: string; titulo?: string }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      // Navegadores sem permissão de clipboard: usa um campo temporário
      const campo = document.createElement("textarea")
      campo.value = texto
      document.body.appendChild(campo)
      campo.select()
      document.execCommand("copy")
      campo.remove()
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={copiar}
      title={copiado ? "Copiado!" : titulo}
      className="inline-flex shrink-0 items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {copiado ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

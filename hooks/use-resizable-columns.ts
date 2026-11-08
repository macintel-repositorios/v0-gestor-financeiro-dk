import { useState, useCallback, useRef, useEffect } from "react"

type ColumnWidths = Record<string, number>

// v2: larguras passaram a ser ajustadas pelo conteúdo; ignora larguras antigas salvas
const chave = (storageKey: string) => `table-cols-v2-${storageKey}`

export function useResizableColumns(defaultWidths: ColumnWidths, storageKey?: string) {
  // Larguras salvas = o usuário ajustou manualmente (não sobrescrever com o ajuste automático)
  const [ajusteManual, setAjusteManual] = useState(false)
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => defaultWidths)

  // Lê do localStorage só no cliente (evita divergência de hidratação)
  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = localStorage.getItem(chave(storageKey))
      if (saved) {
        setColumnWidths((prev) => ({ ...prev, ...JSON.parse(saved) }))
        setAjusteManual(true)
      }
    } catch {}
  }, [storageKey])

  const salvar = useCallback(
    (larguras: ColumnWidths) => {
      if (!storageKey) return
      try {
        localStorage.setItem(chave(storageKey), JSON.stringify(larguras))
      } catch {}
    },
    [storageKey],
  )

  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null)

  const startResize = useCallback(
    (key: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const startWidth = columnWidths[key] ?? 120
      resizingRef.current = { key, startX, startWidth }

      const onMouseMove = (ev: MouseEvent) => {
        // Usa valores locais: o updater do setState roda depois e o ref já pode ter sido limpo no mouseup
        // (era isso que quebrava a página ao arrastar)
        const newWidth = Math.max(40, startWidth + (ev.clientX - startX))
        setColumnWidths((prev) => ({ ...prev, [key]: newWidth }))
      }

      const onMouseUp = () => {
        resizingRef.current = null
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        setAjusteManual(true)
        setColumnWidths((prev) => {
          salvar(prev)
          return prev
        })
      }

      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [columnWidths, salvar],
  )

  /** Aplica larguras calculadas pelo conteúdo (não marca como ajuste manual) */
  const aplicarAutomatico = useCallback((larguras: ColumnWidths) => {
    setColumnWidths((prev) => ({ ...prev, ...larguras }))
  }, [])

  /** Ajuste de uma coluna pelo usuário (duplo clique na alça) — fica salvo */
  const definirLargura = useCallback(
    (key: string, largura: number) => {
      setAjusteManual(true)
      setColumnWidths((prev) => {
        const novo = { ...prev, [key]: largura }
        salvar(novo)
        return novo
      })
    },
    [salvar],
  )

  const resetWidths = useCallback(() => {
    setAjusteManual(false)
    setColumnWidths(defaultWidths)
    if (storageKey) {
      try {
        localStorage.removeItem(chave(storageKey))
      } catch {}
    }
  }, [defaultWidths, storageKey])

  return { columnWidths, startResize, resetWidths, ajusteManual, aplicarAutomatico, definirLargura }
}

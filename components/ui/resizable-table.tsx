"use client"

import React from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useResizableColumns } from "@/hooks/use-resizable-columns"
import { useSortableTable } from "@/hooks/use-sortable-table"

export interface ColumnDef<T = Record<string, unknown>> {
  /** Unique key — also used as the sort/accessor key on the data object */
  key: string
  label: string
  /** Default pixel width */
  width?: number
  /** Minimum pixel width when resizing (default 60) */
  minWidth?: number
  /** Enable click-to-sort on this column (default false) */
  sortable?: boolean
  /** Custom accessor for sorting — if omitted, uses `key` */
  accessor?: (row: T) => unknown
  /** Align cell content */
  align?: "left" | "center" | "right"
  /** Do not allow resizing this column */
  noResize?: boolean
  /**
   * Stick this column to the right edge when the table scrolls horizontally.
   * Perfect for action columns on mobile. Defaults to true when noResize is true.
   */
  sticky?: boolean
}

interface ResizableTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  /** Function to render a cell given the row and column key */
  renderCell: (row: T, colKey: string, rowIndex: number) => React.ReactNode
  /** Unique key used to persist column widths in localStorage */
  storageKey?: string
  /** Row key extractor */
  rowKey?: (row: T, index: number) => string | number
  /** Additional className on the wrapper div */
  className?: string
  /** Show empty state when data is empty */
  emptyState?: React.ReactNode
  /** Called when a row is clicked */
  onRowClick?: (row: T) => void
  /** Extra classes applied to each row */
  rowClassName?: (row: T, index: number) => string
}

export function ResizableTable<T extends object>({
  columns,
  data,
  renderCell,
  storageKey,
  rowKey,
  className,
  emptyState,
  onRowClick,
  rowClassName,
}: ResizableTableProps<T>) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  // Build default widths map
  const defaultWidths = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const col of columns) map[col.key] = col.width ?? 120
    return map
  }, [columns])

  const { columnWidths, startResize, ajusteManual, aplicarAutomatico, definirLargura } = useResizableColumns(
    defaultWidths,
    storageKey,
  )
  const { sort, toggleSort, sortedData } = useSortableTable(data)
  const tableRef = React.useRef<HTMLTableElement>(null)

  /**
   * Largura "natural" (sem quebra de linha) do conteúdo de cada coluna, medida no DOM.
   * Textos longos (ex.: descrição) são limitados a LARGURA_MAX e passam a quebrar linha.
   */
  const medirColunas = React.useCallback(
    (somente?: string): Record<string, number> => {
      const table = tableRef.current
      if (!table) return {}
      const LARGURA_MAX = 340
      const probe = document.createElement("div")
      probe.style.cssText = "position:absolute;visibility:hidden;left:-99999px;top:0;white-space:nowrap;"
      table.parentElement?.appendChild(probe)
      const linhas = Array.from(table.querySelectorAll("tbody tr")).slice(0, 60)
      const ths = Array.from(table.querySelectorAll("thead th"))
      const res: Record<string, number> = {}
      columns.forEach((col, i) => {
        if (somente && col.key !== somente) return
        // Colunas fixas (ações): mede os botões reais na tela (o grupo de botões tem largura própria);
        // nunca fica menor que a largura definida na página
        if (col.noResize || col.sticky) {
          let maxBotoes = 0
          for (const tr of linhas) {
            const td = tr.children[i] as HTMLElement | undefined
            td?.querySelectorAll<HTMLElement>("div").forEach((d) => {
              if (d.offsetParent !== null && getComputedStyle(d).display === "flex") maxBotoes = Math.max(maxBotoes, d.scrollWidth)
            })
          }
          const base = col.width ?? 120
          if (maxBotoes > 0) res[col.key] = Math.max(base, Math.ceil(maxBotoes + 24 + 4))
          return
        }
        let max = 0
        const medir = (el: Element | undefined, extra: number) => {
          if (!el) return
          const cs = getComputedStyle(el)
          probe.style.font = cs.font
          probe.style.letterSpacing = cs.letterSpacing
          probe.style.textTransform = cs.textTransform
          probe.innerHTML = (el as HTMLElement).innerHTML
          // filhos "block/truncate" não podem limitar a largura durante a medição
          probe.querySelectorAll<HTMLElement>("*").forEach((n) => {
            n.style.maxWidth = "none"
            n.style.overflow = "visible"
            n.style.whiteSpace = "nowrap"
          })
          max = Math.max(max, probe.scrollWidth + extra)
        }
        // cabeçalho: rótulo + ícone de ordenação
        const th = ths[i]
        if (th) {
          const label = th.querySelector("span.truncate")
          if (label) {
            probe.style.font = getComputedStyle(label).font
            probe.style.letterSpacing = getComputedStyle(label).letterSpacing
            probe.style.textTransform = getComputedStyle(label).textTransform
            probe.innerHTML = label.innerHTML
            max = Math.max(max, probe.scrollWidth + 24 + (col.sortable ? 18 : 0) + 4)
          }
        }
        for (const tr of linhas) medir(tr.children[i], 24 + 4) // px-3 dos dois lados + folga
        if (max > 0) res[col.key] = Math.min(LARGURA_MAX, Math.max(col.minWidth ?? 56, Math.ceil(max)))
      })
      probe.remove()
      return res
    },
    [columns],
  )

  // Coluna que recebe a sobra de espaço (a de maior largura, normalmente a descrição);
  // sem isso o navegador distribui a sobra entre todas e colunas curtas (ex.: estoque) ficam largas
  const colunaFlex = React.useMemo(() => {
    let melhor = ""
    let maior = -1
    for (const c of columns) {
      if (c.noResize || c.sticky) continue
      const w = columnWidths[c.key] ?? 0
      if (w > maior) {
        maior = w
        melhor = c.key
      }
    }
    return melhor
  }, [columns, columnWidths])
  const larguraTotal = columns.reduce((t, c) => t + (columnWidths[c.key] ?? 120), 0)

  // Ajuste automático pelo conteúdo quando os dados chegam (se o usuário não ajustou manualmente)
  const assinaturaDados = sortedData.length > 0 ? `${columns.map((c) => c.key).join(",")}|${sortedData.length}` : ""
  React.useEffect(() => {
    if (ajusteManual || !assinaturaDados) return
    const id = requestAnimationFrame(() => {
      const medidas = medirColunas()
      if (!Object.keys(medidas).length) return
      // Cabe na área visível: encolhe só colunas de texto longo (> 220px) até 200px; o resto rola na horizontal
      const disponivel = (wrapperRef.current?.clientWidth || 0) - 2
      const total = columns.reduce((t, c) => t + (medidas[c.key] ?? columnWidths[c.key] ?? 120), 0)
      let excesso = total - disponivel
      if (disponivel > 0 && excesso > 0) {
        const MIN = 200 // colunas curtas (etiquetas, datas, valores) nunca são encolhidas
        for (let rodada = 0; rodada < 5 && excesso > 0.5; rodada++) {
          const largas = columns.filter((c) => !c.noResize && !c.sticky && (medidas[c.key] ?? 0) > 220)
          const folga = largas.reduce((t, c) => t + (medidas[c.key] - MIN), 0)
          if (folga <= 0) break
          const corte = Math.min(excesso, folga)
          for (const c of largas) {
            const reduz = Math.round((corte * (medidas[c.key] - MIN)) / folga)
            medidas[c.key] -= reduz
            excesso -= reduz
          }
        }
      }
      aplicarAutomatico(medidas)
    })
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinaturaDados, ajusteManual])

  // Determine which columns are sticky (noResize columns default to sticky)
  const stickyKeys = React.useMemo(
    () => new Set(columns.filter((c) => c.sticky === true || (c.noResize && c.sticky !== false)).map((c) => c.key)),
    [columns]
  )

  // Track scroll state for the shadow indicator
  const handleScroll = React.useCallback(() => {
    const el = wrapperRef.current
    if (!el) return
    setIsScrolled(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  React.useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    handleScroll()
    el.addEventListener("scroll", handleScroll, { passive: true })
    const ro = new ResizeObserver(handleScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", handleScroll)
      ro.disconnect()
    }
  }, [handleScroll])

  return (
    <div className={cn("relative w-full", className)}>
      {/* Left shadow — appears when table is scrolled right */}
      <div
        className={cn(
          "pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-20 transition-opacity duration-200",
          "bg-gradient-to-r from-black/10 to-transparent",
          isScrolled ? "opacity-100" : "opacity-0"
        )}
      />
      {/* Right shadow — appears when there's more content to scroll */}
      <div
        className={cn(
          "pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-20 transition-opacity duration-200",
          "bg-gradient-to-l from-black/10 to-transparent",
          canScrollRight ? "opacity-100" : "opacity-0"
        )}
      />

      <div ref={wrapperRef} className="w-full overflow-x-auto">
        <table
          ref={tableRef}
          className="w-full border-collapse text-sm"
          style={{ tableLayout: "fixed", minWidth: larguraTotal }}
        >
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.key === colunaFlex ? undefined : columnWidths[col.key] }} />
            ))}
          </colgroup>

          {/* ── Header ─────────────────────────────────────── */}
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              {columns.map((col) => {
                const isSorted = sort.key === col.key
                const isAsc = isSorted && sort.dir === "asc"
                const isDesc = isSorted && sort.dir === "desc"
                const isSticky = stickyKeys.has(col.key)

                return (
                  <th
                    key={col.key}
                    className={cn(
                      "relative select-none px-3 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide",
                      "border-r border-border last:border-r-0",
                      col.sortable && "cursor-pointer hover:bg-muted transition-colors",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      isSorted && "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
                      // Sticky column styles
                      isSticky && "sticky right-0 z-10 bg-muted/90 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]",
                      isSticky && isSorted && "bg-indigo-500/15"
                    )}
                    style={{ width: col.key === colunaFlex ? undefined : columnWidths[col.key], overflow: "hidden" }}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    {/* Label + sort icon */}
                    <div
                      className={cn(
                        "flex items-center gap-1 overflow-hidden",
                        col.align === "right" && "justify-end",
                        col.align === "center" && "justify-center"
                      )}
                    >
                      <span className="truncate">{col.label}</span>
                      {col.sortable && (
                        <span className="flex-shrink-0">
                          {isAsc ? (
                            <ChevronUp className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          ) : isDesc ? (
                            <ChevronDown className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Resize handle */}
                    {!col.noResize && (
                      <div
                        className={cn(
                          "absolute right-0 top-0 h-full w-3 flex items-center justify-center",
                          "cursor-col-resize opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100",
                          "z-10"
                        )}
                        onMouseDown={(e) => startResize(col.key, e)}
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          const m = medirColunas(col.key)[col.key]
                          if (m) definirLargura(col.key, m)
                        }}
                        title="Arraste para redimensionar · duplo clique ajusta ao conteúdo"
                      >
                        <div className="w-0.5 h-4 bg-indigo-400 rounded-full" />
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* ── Body ───────────────────────────────────────── */}
          <tbody>
            {sortedData.length === 0 && emptyState ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {emptyState}
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={rowKey ? rowKey(row, idx) : idx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "group border-b border-border transition-colors text-foreground",
                    "hover:bg-muted/30",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row, idx)
                  )}
                >
                  {columns.map((col) => {
                    const isSticky = stickyKeys.has(col.key)
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-2.5 overflow-hidden",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          // Sticky column: solid backgrounds to cover scrolled content
                          // group-hover:bg-muted matches the row hover so it blends in
                          isSticky && "sticky right-0 z-10 bg-card group-hover:bg-muted shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]"
                        )}
                        style={{ maxWidth: col.key === colunaFlex ? undefined : columnWidths[col.key] }}
                      >
                        {renderCell(row, col.key, idx)}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFeriados } from "@/hooks/use-feriados"
import {
  cronogramaParcelas,
  formatarDataBR,
  mesesAdiamento,
  sugerirDataPrimeiraParcela,
} from "@/lib/orcamento-parcelas"

/** Campo "Data da 1ª parcela" + prévia das datas (dia útil) de MDO e material */
export function CampoPrimeiraParcela({
  value,
  onChange,
  parcelamentoMdo,
  parcelamentoMaterial,
  materialAVista,
  dataOrcamento,
  id = "data_primeira_parcela",
}: {
  value: string
  onChange: (v: string) => void
  parcelamentoMdo: number
  parcelamentoMaterial: number
  materialAVista: boolean
  dataOrcamento?: string
  id?: string
}) {
  const feriados = useFeriados()
  const { mdo, material } = cronogramaParcelas(
    { parcelamentoMdo, parcelamentoMaterial, materialAVista, dataPrimeiraParcela: value },
    feriados
  )
  const adiamento = mesesAdiamento(dataOrcamento, value)
  const lista = (datas: string[]) => datas.map(formatarDataBR).join(", ")

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[10px]">
        Data da 1ª parcela {parcelamentoMdo > 0 ? "(mão de obra)" : "(material)"}
      </Label>
      <div className="flex gap-1">
        <Input id={id} type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />
        <button
          type="button"
          title="Voltar para o padrão: dia 10 do mês seguinte (dia útil)"
          onClick={() => onChange(sugerirDataPrimeiraParcela(dataOrcamento, feriados))}
          className="shrink-0 rounded-md border border-border px-2 text-[10px] text-muted-foreground hover:bg-muted"
        >
          Padrão
        </button>
      </div>
      {value && (
        <div className="rounded-md bg-muted/40 p-2 text-[10px] leading-relaxed text-muted-foreground">
          {mdo.length > 0 && (
            <div>
              <span className="font-medium text-foreground">MDO:</span> {lista(mdo)}
            </div>
          )}
          {material.length > 0 && (
            <div>
              <span className="font-medium text-foreground">Material:</span> {lista(material)}
            </div>
          )}
          {materialAVista && <div>Material: à vista</div>}
          {adiamento > 0 && (
            <div className="text-amber-500">
              Adiado {adiamento} {adiamento === 1 ? "mês" : "meses"} além do padrão: +{adiamento}{" "}
              {adiamento === 1 ? "mês" : "meses"} de juros no material
            </div>
          )}
          <div className="text-[9px] opacity-70">Fim de semana e feriado vão para o próximo dia útil.</div>
        </div>
      )}
    </div>
  )
}

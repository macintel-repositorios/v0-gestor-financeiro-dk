// Parcelamento do orçamento: datas das parcelas (MDO e material) e juros do material.
// Regra: 1ª parcela padrão = dia 10 do mês seguinte à data do orçamento; parcelas seguintes no mesmo dia
// dos meses seguintes; datas em fim de semana/feriado vão para o próximo dia útil.
// MDO >= 1: a 1ª parcela da MDO cai na data; o material começa no mês seguinte à última parcela da MDO.
// MDO = 0: a 1ª parcela do material cai na data.

export type Feriado = { data: string; recorrente?: number | boolean | null }

const pad = (n: number) => String(n).padStart(2, "0")
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "2026-11-06", "2026-11-06T03:00:00Z" ou Date -> Date local (meio-dia, sem efeito de fuso) */
export function parseData(valor?: string | Date | null): Date | null {
  if (!valor) return null
  if (valor instanceof Date) return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate(), 12)
  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null
}

/** Soma meses mantendo o dia (dia 31 em mês curto vira o último dia do mês) */
function somarMeses(base: Date, meses: number, dia: number): Date {
  const alvo = new Date(base.getFullYear(), base.getMonth() + meses, 1, 12)
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate()
  alvo.setDate(Math.min(dia, ultimoDia))
  return alvo
}

/** Avança fim de semana e feriados (datas exatas ou recorrentes por dia/mês) até o próximo dia útil */
export function proximoDiaUtil(data: Date, feriados: Feriado[] = []): Date {
  const exatos = new Set<string>()
  const recorrentes = new Set<string>()
  for (const f of feriados) {
    const iso = String(f.data || "").slice(0, 10)
    if (!iso) continue
    exatos.add(iso)
    if (f.recorrente === true || Number(f.recorrente) === 1) recorrentes.add(iso.slice(5))
  }
  const d = new Date(data)
  for (let i = 0; i < 15; i++) {
    const iso = toISO(d)
    const dia = d.getDay()
    if (dia !== 0 && dia !== 6 && !exatos.has(iso) && !recorrentes.has(iso.slice(5))) return d
    d.setDate(d.getDate() + 1)
  }
  return d
}

/** Dia 10 do mês seguinte à data do orçamento (sem ajuste de dia útil) — referência dos juros */
export function dataPadraoPrimeiraParcela(dataOrcamento?: string | Date | null): string {
  const base = parseData(dataOrcamento) || parseData(new Date())!
  return toISO(new Date(base.getFullYear(), base.getMonth() + 1, 10, 12))
}

/** Data sugerida para o campo: dia 10 do mês seguinte, já ajustado para dia útil */
export function sugerirDataPrimeiraParcela(dataOrcamento?: string | Date | null, feriados: Feriado[] = []): string {
  return toISO(proximoDiaUtil(parseData(dataPadraoPrimeiraParcela(dataOrcamento))!, feriados))
}

export interface ParametrosParcelamento {
  parcelamentoMdo: number
  parcelamentoMaterial: number
  materialAVista: boolean
  dataPrimeiraParcela?: string | null
}

/** Datas (ISO) das parcelas de MDO e de material; vazio quando não há data da 1ª parcela */
export function cronogramaParcelas(p: ParametrosParcelamento, feriados: Feriado[] = []) {
  const inicio = parseData(p.dataPrimeiraParcela)
  const mdo: string[] = []
  const material: string[] = []
  if (!inicio) return { mdo, material }
  const dia = inicio.getDate()
  const nMdo = Math.max(0, Number(p.parcelamentoMdo) || 0)
  const nMat = p.materialAVista ? 0 : Math.max(0, Number(p.parcelamentoMaterial) || 0)
  for (let i = 0; i < nMdo; i++) mdo.push(toISO(proximoDiaUtil(somarMeses(inicio, i, dia), feriados)))
  for (let j = 0; j < nMat; j++) material.push(toISO(proximoDiaUtil(somarMeses(inicio, nMdo + j, dia), feriados)))
  return { mdo, material }
}

/**
 * Juros do material (simples, ao mês), sobre o valor do material:
 * meses = (parcelas MDO + parcelas material − 1)  [regra atual]
 *       + meses de adiamento da 1ª parcela em relação ao padrão (dia 10 do mês seguinte ao orçamento).
 * Antecipar a data não reduz os juros abaixo da regra atual.
 */
export function calcularJurosMaterial(
  p: ParametrosParcelamento & { jurosAm: number; valorMaterial: number; dataOrcamento?: string | Date | null }
): number {
  const nMat = Number(p.parcelamentoMaterial) || 0
  if (p.materialAVista || nMat === 0) return 0
  const nMdo = Number(p.parcelamentoMdo) || 0
  return ((nMdo + nMat - 1 + mesesAdiamento(p.dataOrcamento, p.dataPrimeiraParcela)) * (Number(p.jurosAm) || 0) * (Number(p.valorMaterial) || 0)) / 100
}

/** Meses de calendário entre o padrão (dia 10 do mês seguinte) e a data escolhida; nunca negativo */
export function mesesAdiamento(dataOrcamento?: string | Date | null, dataPrimeiraParcela?: string | null): number {
  const escolhida = parseData(dataPrimeiraParcela)
  if (!escolhida) return 0
  const padrao = parseData(dataPadraoPrimeiraParcela(dataOrcamento))!
  const meses = (escolhida.getFullYear() - padrao.getFullYear()) * 12 + (escolhida.getMonth() - padrao.getMonth())
  return Math.max(0, meses)
}

export const formatarDataBR = (iso: string) => {
  const d = parseData(iso)
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : iso
}

/** Orçamentos pendentes/enviados recebem a data da 1ª parcela ao serem editados */
export const situacaoRecebeDataPrimeiraParcela = (situacao?: string | null) =>
  ["pendente", "enviado", "enviado por email"].includes(String(situacao || "").toLowerCase())

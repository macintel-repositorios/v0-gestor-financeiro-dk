// Classificação fiscal dos serviços da Macintel (padrão NFS-e Nacional — LC 116 / NBS / IBS-CBS).
// Definida no orçamento (ou fixa nos contratos) e usada na emissão da NFS-e, sem precisar escolher códigos.
// Códigos levantados no emissor (Contabilizei / Emissor Nacional) e validados pelo contador em 06/11/2026.
// Simples Nacional: cClassTrib (IBS/CBS) não é obrigatório em 2026; o campo principal é o código nacional.

export interface ServicoFiscal {
  id: string
  nome: string
  cnae: string
  anexo: "III" | "IV"
  codigoTributacaoNacional: string // cTribNac (LC 116)
  codigoTributacaoMunicipal: string // desdobramento municipal de São Paulo
  nbsPadrao: string
  indOp: string // 050102 = serviço prestado fora do estabelecimento (no cliente)
  /** Equivalência no cadastro de serviços da emissão atual (lib/nfse/servicos.ts) */
  servicoEmissao: { servicoId: string; caracteristicaId?: string }
}

export const SERVICOS_FISCAIS: ServicoFiscal[] = [
  {
    id: "contrato_manutencao",
    nome: "Contrato de manutenção (limpeza e lubrificação)",
    cnae: "3314-7/10",
    anexo: "III",
    codigoTributacaoNacional: "14.01.01",
    codigoTributacaoMunicipal: "005",
    nbsPadrao: "1.2001.89.00",
    indOp: "050102",
    servicoEmissao: { servicoId: "3314-7/10" },
  },
  {
    id: "conserto",
    nome: "Conserto / manutenção corretiva",
    cnae: "3314-7/10",
    anexo: "III",
    codigoTributacaoNacional: "14.01.01",
    codigoTributacaoMunicipal: "009",
    nbsPadrao: "1.2001.89.00",
    indOp: "050102",
    servicoEmissao: { servicoId: "3314-7/10" },
  },
  {
    // Validado pelo contador: conserto feito dentro da oficina usa indOp 050101 (no estabelecimento)
    id: "conserto_bancada",
    nome: "Conserto em bancada (na oficina da Macintel)",
    cnae: "3314-7/10",
    anexo: "III",
    codigoTributacaoNacional: "14.01.01",
    codigoTributacaoMunicipal: "009",
    nbsPadrao: "1.2001.89.00",
    indOp: "050101",
    servicoEmissao: { servicoId: "3314-7/10" },
  },
  {
    id: "instalacao_material_macintel",
    nome: "Instalação com material da Macintel (serviço isolado)",
    cnae: "4321-5/00",
    anexo: "III",
    codigoTributacaoNacional: "07.02.01",
    codigoTributacaoMunicipal: "097",
    nbsPadrao: "1.0106.19.00",
    indOp: "050102",
    servicoEmissao: { servicoId: "01023", caracteristicaId: "4321-5/00-isolado" },
  },
  {
    id: "instalacao_obra",
    nome: "Instalação dentro de obra de engenharia",
    cnae: "4321-5/00",
    anexo: "IV",
    codigoTributacaoNacional: "07.02.01",
    codigoTributacaoMunicipal: "097",
    nbsPadrao: "1.0106.19.00",
    indOp: "050102",
    servicoEmissao: { servicoId: "01023", caracteristicaId: "4321-5/00-obra" },
  },
  {
    id: "instalacao_material_cliente",
    nome: "Instalação com material do cliente (só mão de obra)",
    cnae: "4321-5/00",
    anexo: "III",
    codigoTributacaoNacional: "14.06.01",
    codigoTributacaoMunicipal: "001",
    nbsPadrao: "1.2003.29.00",
    indOp: "050102",
    servicoEmissao: { servicoId: "01023", caracteristicaId: "4321-5/00-isolado" },
  },
]

export const SERVICO_FISCAL_CONTRATO = "contrato_manutencao"

/** NBS mais específicos que podem substituir o padrão (por tipo de equipamento) */
export const NBS_OPCOES: { codigo: string; descricao: string }[] = [
  { codigo: "1.2001.89.00", descricao: "Manutenção/reparação de outros maquinários e equipamentos (padrão manutenção)" },
  { codigo: "1.2001.70.00", descricao: "Manutenção/reparação de equipamentos de telecomunicações" },
  { codigo: "1.2001.60.00", descricao: "Manutenção/reparação de maquinários de uso comercial" },
  { codigo: "1.0106.19.00", descricao: "Instalação elétrica (padrão instalação)" },
  { codigo: "1.0106.13.00", descricao: "Instalação de alarmes antifurto / sistemas de segurança" },
  { codigo: "1.0106.14.00", descricao: "Instalação de antenas" },
  { codigo: "1.0107.60.00", descricao: "Instalação de cercas e grades (cerca elétrica)" },
  { codigo: "1.0106.90.00", descricao: "Instalação não classificada (construção)" },
  { codigo: "1.2003.23.00", descricao: "Instalação de equipamentos de comunicação" },
  { codigo: "1.2003.29.00", descricao: "Instalação de maquinários/equipamentos (padrão material do cliente)" },
]

export const getServicoFiscal = (id?: string | null) => SERVICOS_FISCAIS.find((s) => s.id === id) || null

/** Sugestão pelo título livre do orçamento ("Tipo de Serviço") */
export function sugerirServicoFiscal(titulo?: string | null): string {
  const t = String(titulo || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
  if (t.includes("INSTALA")) return "instalacao_material_macintel"
  return "conserto"
}

/** Dados fiscais a gravar na nota a partir do tipo + NBS escolhido */
export function dadosFiscaisDoServico(id?: string | null, nbs?: string | null) {
  const s = getServicoFiscal(id)
  if (!s) return null
  return {
    servico_fiscal: s.id,
    cnae: s.cnae,
    codigo_tributacao_nacional: s.codigoTributacaoNacional,
    codigo_tributacao_municipal: s.codigoTributacaoMunicipal,
    nbs: nbs || s.nbsPadrao,
    ind_op: s.indOp,
  }
}

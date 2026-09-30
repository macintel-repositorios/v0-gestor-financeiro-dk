// Serviços prestados disponíveis na emissão de NFS-e (Prefeitura de SP).
// O webservice (layout versão 1) recebe apenas o código de serviço municipal (5 dígitos) e a alíquota.
// Alíquotas conforme o portal da prefeitura.

export interface CaracteristicaServicoNfse {
  id: string
  cnae: string
  descricao: string
  aliquota: number // fração (0.0721 = 7,21%)
  tags: string[]
}

export interface ServicoNfse {
  id: string
  /** Código de serviço municipal; null = usa o código padrão de Configurações > NFS-e */
  codigoServico: string | null
  titulo: string
  descricao: string
  aliquota?: number
  tags?: string[]
  /** Quando existir, o usuário precisa escolher uma característica (define a alíquota) */
  caracteristicas?: CaracteristicaServicoNfse[]
}

export const SERVICOS_NFSE: ServicoNfse[] = [
  {
    id: "3314-7/10",
    codigoServico: null,
    titulo: "3314-7/10",
    descricao: "Manutenção e reparação de máquinas e equipamentos para uso geral não especificados anteriormente",
    aliquota: 0.0926,
    tags: ["Não intelectual"],
  },
  {
    id: "01023",
    codigoServico: "01023",
    titulo: "01023",
    descricao:
      "Execução, por administração, empreitada ou subempreitada, de obras de construção civil, elétrica e de outras obras semelhantes, e respectivos serviços auxiliares ou complementares, inclusive terraplanagem, pavimentação, concretagem e a instalação e montagem de produtos, peças e equipamentos que se agreguem ao imóvel (exceto o fornecimento de mercadorias produzidas pelo prestador de serviços fora do local da prestação dos serviços, que fica sujeito ao ICMS)",
    caracteristicas: [
      {
        id: "4321-5/00-obra",
        cnae: "4321-5/00",
        descricao:
          "Serviço de construção de imóvel ou obra de engenharia, onde o serviço de instalação e manutenção elétrica faça parte do contrato",
        aliquota: 0.0721,
        tags: ["Anexo 4"],
      },
      {
        id: "4321-5/00-isolado",
        cnae: "4321-5/00",
        descricao: "Serviços isolados de instalação e manutenção elétrica em todos os tipos de construções",
        aliquota: 0.0926,
        tags: ["Não intelectual", "Anexo 3"],
      },
    ],
  },
]

export const SERVICO_NFSE_PADRAO = SERVICOS_NFSE[0].id

export const formatarAliquota = (a: number) => `${(a * 100).toFixed(2).replace(".", ",")}%`

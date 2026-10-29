import { query } from "@/lib/db"

/**
 * Dados cadastrais da empresa — fonte única: Configurações > Empresa (timbrado_config).
 * As configurações de NFS-e/NF-e ficam só com dados fiscais (inscrição, códigos, alíquotas, certificado).
 * Fallback para nfse_config apenas se o cadastro da empresa estiver vazio.
 */
export interface DadosEmpresa {
  nome: string
  cnpj: string
  endereco: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  telefone: string
  email: string
  site: string
  representanteLegal: string
}

export async function getEmpresa(): Promise<DadosEmpresa> {
  const [timbrado, nfse]: any = await Promise.all([
    query(`SELECT * FROM timbrado_config WHERE ativo = 1 ORDER BY created_at DESC LIMIT 1`).catch(() => []),
    query(`SELECT * FROM nfse_config WHERE ativo = 1 LIMIT 1`).catch(() => []),
  ])
  const t = timbrado[0] || {}
  const n = nfse[0] || {}
  const enderecoNfse = [n.endereco, n.numero_endereco].filter(Boolean).join(", ") + (n.complemento ? ` - ${n.complemento}` : "")

  return {
    nome: t.empresa_nome || n.razao_social || "",
    cnpj: t.empresa_cnpj || n.cnpj || "",
    endereco: t.empresa_endereco || enderecoNfse,
    bairro: t.empresa_bairro || n.bairro || "",
    cidade: t.empresa_cidade || n.cidade || "",
    uf: t.empresa_uf || n.uf || "",
    cep: t.empresa_cep || n.cep || "",
    telefone: t.empresa_telefone || "",
    email: t.empresa_email || "",
    site: t.empresa_site || "",
    representanteLegal: t.empresa_representante_legal || "",
  }
}

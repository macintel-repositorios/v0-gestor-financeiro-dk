// Emissão de NFS-e pelo padrão nacional (Sefin Nacional) a partir do mesmo corpo usado em /api/nfse/emitir.
import type { PoolConnection } from "mysql2/promise"
import { montarDps, agoraSaoPaulo, COD_MUN_SAO_PAULO } from "./dps-builder"
import { emitirDps, type AmbienteNacional } from "./cliente"
import { normalizarEmail } from "@/lib/email"
import { verificarEConcluirOrcamento } from "@/lib/orcamentos"

/** Número exibido/usado como chave dos boletos: N12 (produção) | HOM-12 (homologação).
 * O prefixo evita colisão com os números antigos da Nota Fiscal Paulistana e dos boletos já gravados. */
export const numeroExibicaoNacional = (n: string | number, ambiente: AmbienteNacional) =>
  `${ambiente === "producao" ? "N" : "HOM-"}${n}`

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim()
const cacheMunicipios = new Map<string, string | null>()

/** Código IBGE do município do tomador (necessário para o endereço na DPS) */
export async function codigoIbge(cidade?: string | null, uf?: string | null, informado?: string | null) {
  const inf = String(informado || "").replace(/[^0-9]/g, "")
  if (inf.length === 7) return inf
  if (!cidade) return null
  const c = semAcento(cidade)
  if (c === "SAO PAULO" && (!uf || semAcento(uf) === "SP")) return COD_MUN_SAO_PAULO
  if (!uf) return null
  const k = `${c}/${semAcento(uf)}`
  if (cacheMunicipios.has(k)) return cacheMunicipios.get(k)!
  try {
    const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${semAcento(uf)}/municipios`)
    const lista = (await r.json()) as { id: number; nome: string }[]
    const m = lista.find((x) => semAcento(x.nome) === c)
    cacheMunicipios.set(k, m ? String(m.id) : null)
    return m ? String(m.id) : null
  } catch {
    return null
  }
}

export async function emitirNfseNacional(connection: PoolConnection, body: any, fiscal: any) {
  const so = (v: unknown) => String(v ?? "").replace(/[^0-9]/g, "")

  if (!fiscal?.codigo_tributacao_nacional) {
    return { status: 400, json: { success: false, message: "Selecione a classificação fiscal do serviço (código nacional)." } }
  }

  // Reserva do número da DPS (produção) — mesma lógica atômica do RPS
  await connection.query("START TRANSACTION")
  const [rows] = await connection.query("SELECT * FROM nfse_config WHERE ativo = 1 FOR UPDATE")
  const config = (rows as any[])[0]
  if (!config?.certificado_base64) {
    await connection.query("ROLLBACK")
    return { status: 400, json: { success: false, message: "Configuração NFS-e/certificado digital não encontrado." } }
  }
  const ambiente: AmbienteNacional = config.ambiente_nacional === "producao" ? "producao" : "homologacao"
  let serie: string
  let numeroDps: number
  if (ambiente === "producao") {
    serie = String(config.serie_dps || "1")
    numeroDps = Number(config.proximo_numero_dps || 1)
    await connection.query("UPDATE nfse_config SET proximo_numero_dps = proximo_numero_dps + 1 WHERE id = ?", [config.id])
  } else {
    // Homologação: série de teste e número único, sem consumir a numeração real
    serie = "900"
    numeroDps = Math.floor(Date.now() / 1000)
  }
  await connection.query("COMMIT")

  const valor = Number(body.valor_servicos)
  const aliquota = Number(body.aliquota_iss || config.aliquota_iss || 0)
  const { dhEmi, data } = agoraSaoPaulo()
  const docTomador = so(body.tomador_cpf_cnpj)
  const codMunTomador = await codigoIbge(body.tomador_cidade, body.tomador_uf, body.tomador_codigo_municipio)

  const { xml } = montarDps({
    ambiente,
    dhEmi,
    dCompet: data,
    serie,
    numero: numeroDps,
    prestador: { cnpj: config.cnpj },
    tomador: {
      cpfCnpj: docTomador,
      nome: body.tomador_razao_social,
      email: normalizarEmail(body.tomador_email),
      codMunicipio: codMunTomador,
      cep: body.tomador_cep,
      logradouro: body.tomador_endereco,
      numero: body.tomador_numero,
      complemento: body.tomador_complemento,
      bairro: body.tomador_bairro,
    },
    servico: {
      codTribNacional: fiscal.codigo_tributacao_nacional,
      codTribMunicipal: fiscal.codigo_tributacao_municipal,
      nbs: fiscal.nbs,
      descricao: body.descricao_servico || config.descricao_servico || "Serviço prestado",
    },
    valor,
    percTotTribSN: aliquota * 100,
    // Produção: valores aproximados por esfera (Lei 12.741), ISS ≈ 32,5% da alíquota do Simples (Anexo III),
    // mesmo critério da NFS-e nº 1 emitida pelo portal (R$ 250 → R$ 7,69 municipal)
    valorTotTribMun: valor * aliquota * 0.325,
    valorTotTribFed: valor * aliquota * 0.675,
  })

  const [ins] = await connection.execute(
    `INSERT INTO notas_fiscais (
      padrao_emissao, numero_dps, serie_dps, origem, origem_id, origem_numero,
      prestador_cnpj, prestador_inscricao_municipal,
      cliente_id, tomador_tipo, tomador_cpf_cnpj, tomador_inscricao_municipal,
      tomador_razao_social, tomador_email, tomador_telefone,
      tomador_endereco, tomador_numero, tomador_complemento,
      tomador_bairro, tomador_cidade, tomador_uf, tomador_cep, tomador_codigo_municipio,
      codigo_servico, descricao_servico, codigo_cnae,
      valor_servicos, valor_deducoes, valor_iss, aliquota_iss, iss_retido, valor_total, status, xml_envio,
      servico_fiscal, cnae, codigo_tributacao_nacional, codigo_tributacao_municipal, nbs, ind_op
    ) VALUES ('nacional', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?, 'processando', ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(numeroDps), serie, body.origem, body.origem_id || null, body.origem_numero || null,
      config.cnpj, config.inscricao_municipal,
      body.cliente_id || null, docTomador.length === 11 ? "PF" : "PJ", docTomador, body.tomador_inscricao_municipal || null,
      body.tomador_razao_social, normalizarEmail(body.tomador_email), body.tomador_telefone || null,
      body.tomador_endereco || null, body.tomador_numero || null, body.tomador_complemento || null,
      body.tomador_bairro || null, body.tomador_cidade || null, body.tomador_uf || null,
      so(body.tomador_cep) || null, codMunTomador,
      fiscal.codigo_tributacao_nacional, body.descricao_servico || config.descricao_servico, fiscal.cnae,
      valor, valor * aliquota, aliquota, valor, xml,
      fiscal.servico_fiscal, fiscal.cnae, fiscal.codigo_tributacao_nacional,
      fiscal.codigo_tributacao_municipal, fiscal.nbs, fiscal.ind_op,
    ],
  )
  const notaId = (ins as any).insertId

  const inicio = Date.now()
  let r
  try {
    r = await emitirDps({ ambiente, pfxBase64: config.certificado_base64, senha: config.certificado_senha }, xml)
  } catch (e: any) {
    await connection.execute(`UPDATE notas_fiscais SET status = 'erro', mensagem_erro = ? WHERE id = ?`, [
      "Falha de comunicação com a Sefin Nacional: " + (e?.message || e), notaId,
    ])
    return { status: 502, json: { success: false, message: "Falha de comunicação com o Emissor Nacional: " + (e?.message || e), data: { id: notaId } } }
  }

  await connection.execute(
    `INSERT INTO nfse_transmissoes (nota_fiscal_id, tipo, xml_envio, xml_retorno, sucesso, codigo_erro, mensagem_erro, tempo_resposta_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [notaId, `nacional_${ambiente}`, r.xmlDpsAssinado, r.xmlNfse || r.respostaBruta, r.sucesso ? 1 : 0,
      null, r.erros.join("; ") || null, Date.now() - inicio],
  )

  if (!r.sucesso) {
    const msg = r.erros.join("; ") || `HTTP ${r.status}`
    await connection.execute(`UPDATE notas_fiscais SET status = 'erro', mensagem_erro = ?, xml_retorno = ? WHERE id = ?`, [
      msg, r.respostaBruta, notaId,
    ])
    return { status: 200, json: { success: false, message: "Erro ao emitir NFS-e (Emissor Nacional): " + msg, data: { id: notaId, erros: r.erros } } }
  }

  const numero = numeroExibicaoNacional(r.numeroNfse || "", ambiente)
  await connection.execute(
    `UPDATE notas_fiscais SET numero_nfse = ?, chave_acesso = ?, codigo_verificacao = ?, status = ?,
       data_emissao = NOW(), xml_envio = ?, xml_retorno = ?, mensagem_erro = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [numero, r.chaveAcesso, r.chaveAcesso || null, ambiente === "producao" ? "emitida" : "homologacao", r.xmlDpsAssinado, r.xmlNfse,
      ambiente === "homologacao" ? "HOMOLOGAÇÃO — nota de teste sem valor fiscal" : null, notaId],
  )

  if (ambiente === "producao" && body.origem === "orcamento" && body.origem_numero) {
    await verificarEConcluirOrcamento(connection, body.origem_numero)
  }

  return {
    status: 200,
    json: {
      success: true,
      message:
        ambiente === "producao"
          ? `NFS-e emitida no Emissor Nacional! Número: ${numero}`
          : `NFS-e de HOMOLOGAÇÃO (sem valor fiscal) gerada: ${numero}`,
      data: { id: notaId, numero_nfse: numero, chave_acesso: r.chaveAcesso, codigo_verificacao: r.chaveAcesso, ambiente },
    },
  }
}

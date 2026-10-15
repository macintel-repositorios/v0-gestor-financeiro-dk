import { NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * API de migração automática — adiciona colunas novas à tabela clientes
 * caso ainda não existam. Seguro para executar múltiplas vezes (idempotente).
 * GET /api/marketing/migrar
 */
export async function GET() {
  const resultados: string[] = []
  const erros: string[] = []

  // Helper para executar cada ALTER silenciosamente
  const tentarAlter = async (sql: string, descricao: string) => {
    try {
      await query(sql)
      resultados.push(`✅ ${descricao}`)
    } catch (err: any) {
      // MySQL 1060 = "Duplicate column name" → coluna já existe, OK
      if (err?.errno === 1060 || err?.code === "ER_DUP_FIELDNAME") {
        resultados.push(`⏭ ${descricao} (já existia)`)
      } else {
        erros.push(`❌ ${descricao}: ${err?.message || err}`)
      }
    }
  }

  // 1. Colunas na tabela clientes
  await tentarAlter(
    `ALTER TABLE clientes ADD COLUMN email_sindico VARCHAR(255) NULL AFTER cpf_sindico`,
    "Coluna email_sindico"
  )
  await tentarAlter(
    `ALTER TABLE clientes ADD COLUMN emails_extras TEXT NULL AFTER email`,
    "Coluna emails_extras"
  )

  // 2. Tabela de campanhas
  await tentarAlter(
    `CREATE TABLE IF NOT EXISTS email_campanhas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assunto VARCHAR(500) NOT NULL,
      corpo LONGTEXT NOT NULL,
      filtros JSON NULL,
      total_destinatarios INT DEFAULT 0,
      total_enviados INT DEFAULT 0,
      total_erros INT DEFAULT 0,
      status ENUM('rascunho','enviando','concluido','erro') DEFAULT 'rascunho',
      smtp_host VARCHAR(255) NULL,
      smtp_from VARCHAR(255) NULL,
      created_at DATETIME DEFAULT NOW(),
      enviado_at DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    "Tabela email_campanhas"
  )

  // 3. Tabela de destinatários
  await tentarAlter(
    `CREATE TABLE IF NOT EXISTS email_campanha_destinatarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      campanha_id INT NOT NULL,
      cliente_id INT NOT NULL,
      cliente_nome VARCHAR(255) NULL,
      email VARCHAR(255) NOT NULL,
      tipo_email ENUM('principal','sindico','contato_extra') NOT NULL DEFAULT 'principal',
      status ENUM('pendente','enviado','erro') DEFAULT 'pendente',
      erro_msg TEXT NULL,
      enviado_at DATETIME NULL,
      FOREIGN KEY (campanha_id) REFERENCES email_campanhas(id) ON DELETE CASCADE,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
      INDEX idx_campanha (campanha_id),
      INDEX idx_cliente (cliente_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    "Tabela email_campanha_destinatarios"
  )

  return NextResponse.json({
    success: erros.length === 0,
    resultados,
    erros,
    mensagem:
      erros.length === 0
        ? "Migração concluída com sucesso!"
        : `Migração concluída com ${erros.length} erro(s)`,
  })
}

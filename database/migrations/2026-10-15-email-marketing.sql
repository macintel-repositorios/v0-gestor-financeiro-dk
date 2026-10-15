-- =================================================================
-- Migration: Email Marketing
-- Data: 2026-10-15
-- Descrição: Adiciona campos de email do síndico, emails extras de 
--            contato e cria tabelas para campanhas de email marketing
-- =================================================================

-- 1. Adicionar colunas na tabela clientes
ALTER TABLE clientes
  ADD COLUMN email_sindico VARCHAR(255) NULL AFTER cpf_sindico,
  ADD COLUMN emails_extras TEXT NULL AFTER email;

-- emails_extras é armazenado como JSON (ex: '["a@b.com","c@d.com"]')

-- 2. Tabela de campanhas de email marketing
CREATE TABLE IF NOT EXISTS email_campanhas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assunto VARCHAR(500) NOT NULL,
  corpo LONGTEXT NOT NULL,
  filtros JSON NULL COMMENT 'Filtros usados: tem_contrato, distancia_max, cidade, etc.',
  total_destinatarios INT DEFAULT 0,
  total_enviados INT DEFAULT 0,
  total_erros INT DEFAULT 0,
  status ENUM('rascunho', 'enviando', 'concluido', 'erro') DEFAULT 'rascunho',
  smtp_host VARCHAR(255) NULL,
  smtp_from VARCHAR(255) NULL,
  created_at DATETIME DEFAULT NOW(),
  enviado_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabela de destinatários por campanha
CREATE TABLE IF NOT EXISTS email_campanha_destinatarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campanha_id INT NOT NULL,
  cliente_id INT NOT NULL,
  cliente_nome VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL,
  tipo_email ENUM('principal', 'sindico', 'contato_extra') NOT NULL DEFAULT 'principal',
  status ENUM('pendente', 'enviado', 'erro') DEFAULT 'pendente',
  erro_msg TEXT NULL,
  enviado_at DATETIME NULL,
  FOREIGN KEY (campanha_id) REFERENCES email_campanhas(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  INDEX idx_campanha (campanha_id),
  INDEX idx_cliente (cliente_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

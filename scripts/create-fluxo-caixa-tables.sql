-- Criar tabela de contas financeiras se não existir
CREATE TABLE IF NOT EXISTS contas_financeiras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo ENUM('conta_corrente', 'cartao_credito', 'aplicacao') NOT NULL,
  saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  data_saldo_inicial DATE DEFAULT '2025-12-30',
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tipo (tipo),
  INDEX idx_ativo (ativo)
);

-- Criar tabela de transações/movimentações financeiras se não existir
CREATE TABLE IF NOT EXISTS transacoes_financeiras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conta_id INT NOT NULL,
  data DATE NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  tipo ENUM('entrada', 'saida') NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(50) DEFAULT 'Outros',
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (conta_id) REFERENCES contas_financeiras(id) ON DELETE CASCADE,
  INDEX idx_conta_id (conta_id),
  INDEX idx_data (data),
  INDEX idx_tipo (tipo),
  INDEX idx_ativo (ativo)
);

-- Criar tabela de log de extratos importados se não existir
CREATE TABLE IF NOT EXISTS extratos_importados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conta_id INT NOT NULL,
  ano_mes VARCHAR(7) NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conta_id) REFERENCES contas_financeiras(id) ON DELETE CASCADE,
  UNIQUE KEY uq_conta_periodo (conta_id, ano_mes)
);

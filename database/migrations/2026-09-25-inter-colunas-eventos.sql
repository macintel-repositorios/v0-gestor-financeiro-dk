-- Colunas próprias do Banco Inter, tabela de eventos de gateway e remoção das colunas do BTG
-- Backup prévio: CREATE TABLE boletos_backup_20260925 AS SELECT * FROM boletos;

-- 1. Colunas do Banco Inter
ALTER TABLE boletos
  ADD COLUMN inter_codigo_solicitacao VARCHAR(100) NULL AFTER gateway,
  ADD COLUMN inter_nosso_numero VARCHAR(50) NULL AFTER inter_codigo_solicitacao,
  ADD COLUMN inter_linha_digitavel VARCHAR(100) NULL AFTER inter_nosso_numero,
  ADD COLUMN inter_barcode VARCHAR(100) NULL AFTER inter_linha_digitavel,
  ADD COLUMN inter_pix_copia_cola TEXT NULL AFTER inter_barcode,
  ADD COLUMN inter_situacao VARCHAR(30) NULL AFTER inter_pix_copia_cola,
  ADD COLUMN inter_atualizado_em DATETIME NULL AFTER inter_situacao,
  ADD UNIQUE INDEX idx_boletos_inter_codigo (inter_codigo_solicitacao);

-- 2. Migra boletos já emitidos no Inter (estavam gravados nas colunas asaas_*)
UPDATE boletos SET
  inter_codigo_solicitacao = asaas_id,
  inter_nosso_numero = asaas_nosso_numero,
  inter_linha_digitavel = asaas_linha_digitavel,
  inter_barcode = asaas_barcode,
  asaas_id = NULL,
  asaas_nosso_numero = NULL,
  asaas_linha_digitavel = NULL,
  asaas_barcode = NULL,
  asaas_bankslip_url = NULL
WHERE gateway = 'inter';

-- 3. Histórico de eventos recebidos dos gateways (webhooks e sincronizações)
CREATE TABLE IF NOT EXISTS boletos_eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  boleto_id INT NULL,
  gateway VARCHAR(20) NOT NULL,
  origem VARCHAR(20) NOT NULL,          -- webhook | sincronizacao | emissao
  referencia VARCHAR(100) NULL,         -- codigoSolicitacao (Inter) / payment id (Asaas)
  evento VARCHAR(50) NULL,
  situacao VARCHAR(30) NULL,
  payload JSON NULL,
  processado TINYINT(1) NOT NULL DEFAULT 0,
  erro TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_eventos_boleto (boleto_id),
  INDEX idx_eventos_referencia (referencia)
);

-- 4. Boleto de teste do BTG (sandbox) volta a ficar pendente, sem gateway
UPDATE boletos SET gateway = NULL, status = 'pendente' WHERE gateway = 'btg';

-- 5. Remove colunas do BTG (integração descontinuada)
ALTER TABLE boletos
  DROP COLUMN btg_id,
  DROP COLUMN btg_nosso_numero,
  DROP COLUMN btg_pix_qrcode,
  DROP COLUMN btg_pix_emv,
  DROP COLUMN btg_bankslip_url,
  DROP COLUMN btg_barcode,
  DROP COLUMN btg_linha_digitavel;

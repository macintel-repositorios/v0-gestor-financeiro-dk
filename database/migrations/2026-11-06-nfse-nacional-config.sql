-- NFS-e Nacional: ambiente e numeração da DPS emitida pelo sistema
-- Série própria do sistema (1) — a série 11111 é usada pela Contabilizei/portal.
ALTER TABLE nfse_config
  ADD COLUMN ambiente_nacional VARCHAR(12) NOT NULL DEFAULT 'homologacao', -- 'homologacao' (produção restrita) | 'producao'
  ADD COLUMN serie_dps VARCHAR(5) NOT NULL DEFAULT '1',
  ADD COLUMN proximo_numero_dps BIGINT NOT NULL DEFAULT 1;

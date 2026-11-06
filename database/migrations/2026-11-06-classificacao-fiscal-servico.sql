-- Classificação fiscal do serviço (padrão NFS-e Nacional) definida no orçamento e registrada na nota emitida
ALTER TABLE orcamentos
  ADD COLUMN servico_fiscal VARCHAR(40) NULL AFTER tipo_servico,
  ADD COLUMN nbs VARCHAR(20) NULL AFTER servico_fiscal;

ALTER TABLE notas_fiscais
  ADD COLUMN servico_fiscal VARCHAR(40) NULL AFTER codigo_servico,
  ADD COLUMN cnae VARCHAR(12) NULL AFTER servico_fiscal,
  ADD COLUMN codigo_tributacao_nacional VARCHAR(10) NULL AFTER cnae,
  ADD COLUMN codigo_tributacao_municipal VARCHAR(10) NULL AFTER codigo_tributacao_nacional,
  ADD COLUMN nbs VARCHAR(20) NULL AFTER codigo_tributacao_municipal,
  ADD COLUMN ind_op VARCHAR(10) NULL AFTER nbs;

-- Proposta: início do contrato e prazo de instalação dos equipamentos em consignação (levados ao contrato)
ALTER TABLE proposta_contratos
  ADD COLUMN data_inicio DATE NULL AFTER data_validade,
  ADD COLUMN prazo_instalacao_consignacao DATE NULL AFTER equipamentos_consignacao;

ALTER TABLE contratos_conservacao
  ADD COLUMN prazo_instalacao_consignacao DATE NULL AFTER equipamentos_consignacao;

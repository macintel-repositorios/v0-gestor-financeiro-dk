-- Proposta: dia do contrato (dia de vencimento da mensalidade), levado ao contrato na aprovação
ALTER TABLE proposta_contratos ADD COLUMN dia_vencimento TINYINT NULL AFTER data_inicio;

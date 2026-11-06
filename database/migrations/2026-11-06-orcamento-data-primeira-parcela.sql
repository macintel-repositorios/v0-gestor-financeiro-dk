-- Orçamento: data da 1ª parcela (padrão: dia 10 do mês seguinte ao orçamento, ajustado para dia útil)
ALTER TABLE orcamentos ADD COLUMN data_primeira_parcela DATE NULL AFTER material_a_vista;

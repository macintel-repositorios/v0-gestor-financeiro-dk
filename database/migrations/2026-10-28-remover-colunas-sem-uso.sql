-- Colunas sem uso no código e sem dados (backup: database/backups/tabelas-removidas-2026-10-28/colunas-removidas.json)
ALTER TABLE layout_impressao_config DROP FOREIGN KEY fk_layout_termo;
ALTER TABLE layout_impressao_config DROP INDEX idx_layout_termo, DROP COLUMN termo_id;
ALTER TABLE clientes DROP COLUMN data_contrato;
ALTER TABLE documentos DROP COLUMN template_usado, DROP COLUMN assinatura_empresa;
ALTER TABLE orcamentos DROP COLUMN contrato_gerado;
ALTER TABLE produtos DROP COLUMN new_categoria_id;
ALTER TABLE nfe_emitidas DROP COLUMN valor_outras_despesas;

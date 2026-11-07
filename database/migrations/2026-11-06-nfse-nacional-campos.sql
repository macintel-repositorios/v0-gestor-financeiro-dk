-- NFS-e Nacional (Sefin Nacional): numeração própria, identificada pela chave de acesso
ALTER TABLE notas_fiscais
  ADD COLUMN padrao_emissao VARCHAR(12) NOT NULL DEFAULT 'municipal' AFTER numero_nfse, -- 'municipal' (Nota Fiscal Paulistana) | 'nacional'
  ADD COLUMN chave_acesso VARCHAR(50) NULL AFTER padrao_emissao,
  ADD COLUMN numero_dps VARCHAR(20) NULL AFTER chave_acesso,
  ADD COLUMN serie_dps VARCHAR(10) NULL AFTER numero_dps,
  ADD UNIQUE INDEX idx_notas_chave_acesso (chave_acesso);

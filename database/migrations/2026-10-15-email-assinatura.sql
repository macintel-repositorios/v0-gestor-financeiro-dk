-- Assinatura (imagem) anexada no final dos e-mails de marketing
CREATE TABLE IF NOT EXISTS email_assinatura (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  dados LONGTEXT NOT NULL,          -- data URL (data:image/png;base64,...)
  formato VARCHAR(10) NOT NULL,     -- png | jpg
  tamanho INT NULL,                 -- bytes
  dimensoes VARCHAR(20) NULL,       -- ex.: 600x200
  created_at DATETIME DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

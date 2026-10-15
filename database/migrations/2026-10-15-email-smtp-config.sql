-- Configuração SMTP do e-mail marketing (registro único). A senha é gravada criptografada (AES-256-GCM).
CREATE TABLE IF NOT EXISTS email_smtp_config (
  id INT PRIMARY KEY DEFAULT 1,
  host VARCHAR(255) NOT NULL,
  port INT NOT NULL DEFAULT 587,
  usuario VARCHAR(255) NOT NULL,
  senha_cripto TEXT NULL,
  from_email VARCHAR(255) NULL,
  from_name VARCHAR(255) NULL,
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

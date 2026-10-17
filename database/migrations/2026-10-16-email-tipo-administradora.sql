-- E-mail marketing: novo tipo de destinatário "administradora" (clientes.email_adm)
ALTER TABLE email_campanha_destinatarios
  MODIFY tipo_email ENUM('principal', 'sindico', 'administradora', 'contato_extra') NOT NULL DEFAULT 'principal';

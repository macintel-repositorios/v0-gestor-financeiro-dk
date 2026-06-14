# 📚 Documentação Geral do Sistema - Gestor Financeiro ERP

Este documento apresenta a especificação técnica, arquitetura, módulos de negócio e guias de implantação/execução do **Gestor Financeiro**, um sistema ERP completo voltado para gestão financeira, operacional e faturamento de empresas prestadoras de serviço.

---

## 💻 1. Visão Geral & Arquitetura

O **Gestor Financeiro** é construído sobre a stack moderna do ecossistema React/Next.js, com foco em alta performance, responsividade (Mobile-Friendly), e recursos interativos (impressão de PDFs, geração de XMLs fiscais e automações de atendimento via WhatsApp).

### Stack Tecnológica
* **Framework Principal**: [Next.js 15 (App Router)](https://nextjs.org/) — versão `15.5.7`
* **Linguagem**: [TypeScript](https://www.typescriptlang.org/) `^5`
* **UI / Runtime**: [React 19](https://react.dev/)
* **Estilização**: [Tailwind CSS](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/) para componentes de interface dinâmicos e acessíveis
* **Banco de Dados**: [MySQL](https://github.com/sidorares/node-mysql2) via `mysql2/promise` (pool de conexões em [`lib/db.ts`](../lib/db.ts)). O pacote [`@neondatabase/serverless`](https://neon.tech/) está disponível no projeto, mas a conexão ativa atual é **MySQL**.
* **Autenticação**: JWT próprio (`jsonwebtoken`) com hash de senha via `bcryptjs`
* **Validação de dados**: [`zod`](https://zod.dev/)
* **Faturamento & Cobrança**: Gateway de Pagamentos [Asaas](https://www.asaas.com/) ([`lib/asaas.ts`](../lib/asaas.ts))
* **Mensageria**: API oficial [WhatsApp Business](https://developers.facebook.com/docs/whatsapp)
* **Documentos / PDF**: `jspdf`, `html2canvas`, `pdf-lib`, `jszip` (geração e empacotamento)
* **NF-e / Assinatura digital**: `node-forge`, `xml-crypto`, `libxmljs2`
* **Relatórios / Tabelas**: `recharts`, `@tanstack/react-table`
* **Armazenamento de arquivos**: `@vercel/blob`

> **Nota:** As dependências de IA (`@ai-sdk/openai` e `ai` / Vercel AI SDK) estão instaladas no `package.json`, porém **ainda não há integração ativa** referenciada no código-fonte. Trate como provisionado para uso futuro.

---

## 📂 2. Estrutura de Pastas e Componentes

A organização do projeto segue as convenções do Next.js App Router:

```bash
gestor-financeiro/
├── app/                  # Rotas da Aplicação (Páginas e Endpoints de API)
│   ├── api/              # Endpoints back-end (ver subpastas abaixo)
│   ├── dashboard/        # Painel principal / indicadores
│   ├── financeiro/       # Gestão de fluxo de caixa, transações e conciliações
│   ├── orcamentos/       # Criação e aprovação de orçamentos/propostas
│   ├── ordem-servico/    # Abertura, controle e laudos de Ordens de Serviço
│   ├── contratos/        # Contratos e propostas de contrato
│   ├── clientes/         # Cadastro de clientes (CRM)
│   ├── produtos/         # Catálogo de produtos / equipamentos
│   ├── nota-fiscal/      # Emissão e gerenciamento de notas fiscais (NF-e/NFSe)
│   ├── calendario/       # Calendário operacional / agendamentos
│   ├── relatorios/       # Relatórios gerenciais
│   ├── documentos/       # Gestão de documentos
│   ├── usuarios/         # Gestão de usuários e permissões
│   ├── configuracoes/    # Configurações do sistema
│   ├── pagamento/        # Páginas de pagamento (Asaas)
│   ├── logs/             # Visualização de logs/auditoria
│   └── login/            # Autenticação
├── app/api/              # Endpoints back-end, incluindo:
│   ├── asaas/  auth/  backup/  boletos/  categorias/  clientes/
│   ├── configuracoes/  contratos/  contratos-conservacao/  dashboard/
│   ├── documentos/  equipamentos/  financeiro/  logs/  marcas/
│   ├── nfe/  nfse/  orcamentos/  ordens-servico/  produtos/
│   ├── propostas-contratos/  recibos/  relatorios/  timbrado-config/
│   ├── usuarios/  utils/  whatsapp/  (+ rotas de teste: test-db, teste-asaas...)
├── components/           # Componentes React reutilizáveis e customizados
│   ├── ui/               # Componentes visuais atômicos (Button, Dialog, Select...)
│   ├── financeiro/       # Componentes do fluxo de caixa e transações
│   ├── orcamentos/       # Formulários e editores de impressão de orçamentos
│   ├── ordem-servico/    # Componentes para OS e laudos técnicos
│   ├── contratos/        # Componentes de contratos
│   ├── nfe/  nfse/        # Componentes de notas fiscais
│   ├── produtos/         # Componentes de catálogo
│   ├── usuarios/         # Componentes de usuários
│   └── configuracoes/    # Componentes de configuração
├── lib/                  # Bibliotecas auxiliares e clientes de APIs
│   ├── asaas.ts          # Integração completa com o Asaas
│   ├── db.ts             # Pool de conexão MySQL (mysql2)
│   ├── database.ts       # Funções de acesso/queries ao banco
│   ├── api-client.ts     # Cliente HTTP interno
│   ├── logger.ts         # Logging centralizado
│   ├── generate-id.ts    # Geração de IDs
│   ├── orcamentos.ts     # Regras de orçamentos
│   ├── utils.ts / utils-centralized.ts / redirect-helper.ts
│   ├── whatsapp-conversation.ts # Máquina de estados para chatbot de WhatsApp
│   ├── nfe/              # Geração e assinatura de XML (soap-client, xml-builder, xml-signer)
│   └── nfse/             # Geração de NFSe
├── docs/                 # Documentação técnica setorial
├── public/               # Ativos estáticos (imagens, fontes, etc.)
└── scripts/              # Scripts utilitários de banco e validação (SQL, Node.js, Python)
```

---

## ⚙️ 3. Variáveis de Ambiente (`.env.local`)

O sistema necessita das seguintes variáveis para o funcionamento pleno de suas integrações. **Os nomes abaixo refletem o que é efetivamente lido no código** (`process.env.*`):

```env
# Banco de Dados (MySQL)
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="senha"
DB_NAME="gestor_financeiro"
DB_PORT="3306"
DB_SSL="false"            # "true" habilita SSL na conexão

# URL pública da aplicação (usada em links de WhatsApp, OS, pagamento)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Integração Asaas
ASAAS_API_KEY="$aact_..."
ASAAS_ENVIRONMENT="sandbox"   # "sandbox" ou "production"

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID="seu_phone_number_id"
WHATSAPP_ACCESS_TOKEN="seu_access_token"
WHATSAPP_VERIFY_TOKEN="seu_token_de_verificacao_webhook"

# Cron (proteção do endpoint de timeouts do WhatsApp)
CRON_SECRET="segredo_do_cron"

# Armazenamento de arquivos (Vercel Blob)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

> **Atenção:** versões anteriores desta documentação citavam `DATABASE_URL`, `MYSQL_*`, `ASAAS_API_URL` e `OPENAI_API_KEY`. Essas variáveis **não são lidas pelo código atual** — use os nomes acima. A definição de produção/sandbox do Asaas é feita por `ASAAS_ENVIRONMENT`, não por uma URL.

---

## 🚀 4. Módulos do Sistema e Regras de Negócio

### 📈 Módulo Financeiro & Fluxo de Caixa
* **Visualização Central**: Painel com entradas, saídas, saldo operacional e conciliação bancária diária.
* **Importação de extratos**: Importação de extratos bancários e classificação automática de transações (ver scripts em `scripts/`).

### 📝 Orçamentos & Ordens de Serviço (OS)
* **Editor de Propostas**: Layout customizável com edição rica (Rich Text) e exportação em PDF via `jspdf` / `html2canvas`.
* **Fluxo de O.S.**:
  1. Criação a partir de orçamento aprovado ou solicitação de cliente.
  2. Atribuição de técnicos e agendamento no Calendário Operacional.
  3. Preenchimento de Laudo Técnico e checklist de atendimento.
  4. Envio de link de assinatura e PDF final para o cliente.

### 📄 Contratos
* Geração e gestão de contratos e propostas de contrato, com editor de impressão dedicado.

### 🧾 Nota Fiscal Eletrônica (NF-e & NFSe)
* **Emissão no Padrão SEFAZ (PL_009_V4)**: Integrado para assinar e emitir notas eletrônicas (assinatura via `node-forge` / `xml-crypto`).
* **Exportação em Lote**: Permite baixar notas fiscais em XML em conformidade com o XSD nacional da SEFAZ, gerando arquivos ZIP automáticos (`jszip`) quando múltiplas notas são selecionadas.
* **Utilitários de Validação**: scripts de validação de XML disponíveis — `validate-nfe-xml.sh` (na **raiz** do projeto) e versões em Node.js/Python na pasta `scripts/` (`validate-nfe-xml.js`, `validate-xsd-real.js`, `validate_xsd.py`, `validate_final.py`).

### 💬 Automação via WhatsApp (Chatbot)
* **Atendimento Conversacional**: Permite que clientes finais abram chamados e consultem o status de Ordens de Serviço sem intervenção humana (máquina de estados em [`lib/whatsapp-conversation.ts`](../lib/whatsapp-conversation.ts)).
* **Notificações Ativas**: Envio automatizado de lembretes de vencimento de parcelas e atualizações de status de OS ("Técnico a caminho", "OS Concluída").
* **Timeouts via Cron**: endpoint `api/whatsapp/check-timeouts` protegido por `CRON_SECRET`.

---

## 🛠️ 5. Como Executar o Projeto Localmente

### Pré-requisitos
* Node.js **18.18+** (recomendado 20+) — exigência do Next.js 15.5. *Obs.: o `package.json` não declara `engines`; recomenda-se adicioná-lo e/ou um `.nvmrc`.*
* Banco de dados **MySQL** ativo.

### Passo a Passo

1. **Instalar Dependências**:
   ```bash
   npm install
   ```

2. **Configurar as Variáveis de Ambiente**:
   Crie o arquivo `.env.local` na raiz do projeto com as variáveis da seção 3.
   *(Recomendação: manter um `.env.example` versionado como referência — atualmente não existe no repositório.)*

3. **Iniciar Servidor de Desenvolvimento**:
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:3000`.

4. **Lint**:
   ```bash
   npm run lint
   ```

5. **Gerar Build de Produção** (opcional):
   ```bash
   npm run build
   npm run start
   ```

> **Nota:** o projeto atualmente **não possui suíte de testes automatizados** nem pipeline de CI (`.github/workflows`). São melhorias recomendadas para evolução do sistema.

---

## 📄 6. Guias Técnicos de Apoio
Para detalhes específicos sobre integrações, consulte a raiz do projeto e a pasta [docs](file:///e:/projetos/gestor-financeiro%20-%2080/docs):
* 📘 [README do Projeto](file:///e:/projetos/gestor-financeiro%20-%2080/README.md)
* 💬 [Integração WhatsApp - Visão Geral](file:///e:/projetos/gestor-financeiro%20-%2080/docs/whatsapp-integration.md)
* ⚙️ [Configurações do WhatsApp Business](file:///e:/projetos/gestor-financeiro%20-%2080/docs/CONFIGURACAO_WHATSAPP.md)
* 🔧 [Configurar Variáveis do WhatsApp](file:///e:/projetos/gestor-financeiro%20-%2080/docs/CONFIGURAR_VARIAVEIS_WHATSAPP.md)
* ⏰ [Configurar Cron do WhatsApp](file:///e:/projetos/gestor-financeiro%20-%2080/docs/CONFIGURAR_CRON_WHATSAPP.md)
* 🚀 [Guia de Integração XML SEFAZ](file:///e:/projetos/gestor-financeiro%20-%2080/GUIA_USO_SEFAZ.md)
* ☁️ [Configuração na Vercel](file:///e:/projetos/gestor-financeiro%20-%2080/docs/VERCEL_CONFIG.md)

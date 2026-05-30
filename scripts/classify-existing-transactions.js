import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(path.join(__dirname, "..", ".env.local"));
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      process.env[key.trim()] = values.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  });
}

function classifyCategory(description, tipo) {
  const desc = description.toLowerCase();
  
  if (tipo === "entrada") {
    if (desc.match(/(cobranca|cobrança|boleto|recebimento|faturamento|liquidacao|liquidação|venda|cliente)/)) {
      return "Faturamento";
    }
    if (desc.match(/(rendimento|aplicacao|aplicação|resgate|juros|rend)/)) {
      return "Investimentos";
    }
    return "Outras Receitas";
  } else {
    // Expenses
    if (desc.match(/(receita federal|simples nacional|das|darf|tributo|imposto|taxa|prefeitura|gps|fgts|federal)/)) {
      return "Impostos & Tributos";
    }
    if (desc.match(/(infinity|combustivel|combustível|posto)/)) {
      return "Combustível";
    }
    if (desc.match(/(aws|google|cloud|vercel|github|microsoft|adobe|hostgator|software|saas|digitalocean|dropbox|slack|zoom)/)) {
      return "Tecnologia & SaaS";
    }
    if (desc.match(/(uber|99app|taxi|pedagio|pedágio|estacionamento|viagem|passagem|aerea|aérea)/)) {
      return "Transporte & Viagem";
    }
    if (desc.match(/(ifood|restaurante|mercado|alimento|pao|padaria|cafe|café|refeicao|refeição|supermercado|carrefour|pao de acucar)/)) {
      return "Alimentação";
    }
    if (desc.match(/(aluguel|condominio|condomínio|imobiliaria|imobiliária)/)) {
      return "Infraestrutura & Aluguel";
    }
    if (desc.match(/(copel|enel|luz|energia|sanepar|sabesp|agua|água|telefone|internet|net|claro|vivo|tim)/)) {
      return "Utilidades (Luz/Água/Tel)";
    }
    if (desc.match(/(marketing|ads|anuncio|anúncio|facebook|metaads|googleads|adwords|panfleto|comunicacao|comunicação)/)) {
      return "Marketing & Anúncios";
    }
    if (desc.match(/(salario|salário|pro-labore|pro labore|folha|decimo|férias|ferias|beneficio|benefício|vale)/)) {
      return "Pessoal & Pro-labore";
    }
    if (desc.match(/(tarifa|iof|juros|mensalidade conta|banco|manutencao conta|doc|ted)/)) {
      return "Tarifas Bancárias";
    }
    if (desc.match(/(papelaria|copia|cópia|impressao|impressão|cartucho|toner|escritorio|escritório)/)) {
      return "Material de Escritório";
    }
    return "Outras Despesas";
  }
}

async function run() {
  console.log("Connecting to database to categorize existing records...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const [rows] = await connection.execute(`SELECT id, descricao, tipo FROM transacoes_financeiras`);
    console.log(`Found ${rows.length} existing transactions to classify.`);
    
    let count = 0;
    for (const row of rows) {
      const category = classifyCategory(row.descricao, row.tipo);
      await connection.execute(
        `UPDATE transacoes_financeiras SET categoria = ? WHERE id = ?`,
        [category, row.id]
      );
      count++;
    }
    console.log(`✅ Classification complete! Updated ${count} records.`);
  } catch (error) {
    console.error("❌ Classification script failed:", error.message);
  } finally {
    await connection.end();
  }
}

run();

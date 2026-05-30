const http = require('http');

const reports = ['notas_fiscais', 'propostas_contratos', 'contratos_ativos', 'usuarios', 'logs_sistema', 'feriados', 'equipamentos'];

async function testReport(type) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000/api/relatorios?tipo=${type}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`Report [${type}]: Status = ${res.statusCode}, Success = ${json.success}`);
          if (!json.success) {
            console.log("Error Message:", json.message);
          }
        } catch (e) {
          console.log(`Report [${type}]: Failed to parse JSON. Status = ${res.statusCode}`);
          console.log("Raw Output:", data.substring(0, 200));
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`Report [${type}]: Request Error:`, err.message);
      resolve();
    });
  });
}

async function main() {
  // Wait a bit for dev server to boot
  await new Promise(r => setTimeout(r, 3000));
  for (const r of reports) {
    await testReport(r);
  }
}

main();

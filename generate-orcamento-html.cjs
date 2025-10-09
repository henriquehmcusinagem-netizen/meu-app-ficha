// Script para gerar HTML do orçamento da FTC 2025999
const fs = require('fs');
const path = require('path');

// Dados da FTC 2025999 (DPWORLD) com orçamento
const fichaId = '70d3d78c-0cc9-4975-8c67-a14d3570bbaa';
const numeroFTC = '2025999';

// URL do HTML do orçamento (que seria gerado pelo sistema)
const htmlUrl = `http://localhost:8084/consultar-fichas`;

console.log(`✅ Para testar os modais de aprovação:`);
console.log(`\n📋 FTC: ${numeroFTC}`);
console.log(`👤 Cliente: DPWORLD`);
console.log(`\n🔗 Abra manualmente no navegador:`);
console.log(`   1. Acesse: ${htmlUrl}`);
console.log(`   2. Localize a FTC ${numeroFTC}`);
console.log(`   3. Clique em "Baixar HTML"`);
console.log(`   4. Abra o arquivo HTML baixado`);
console.log(`   5. Teste os 3 botões:`);
console.log(`      - 🔄 SOLICITAR ALTERAÇÕES`);
console.log(`      - ❌ REJEITAR ORÇAMENTO`);
console.log(`      - ✅ APROVAR ORÇAMENTO`);
console.log(`\n⚠️  Como o popup blocker está impedindo abertura automática,`);
console.log(`    é necessário fazer o download manual do HTML.`);

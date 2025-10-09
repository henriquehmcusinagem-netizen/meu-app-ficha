// Script de teste para gerar HTML do orçamento
const fs = require('fs');

// Dados de teste da FTC 2025999
const fichaTeste = {
  id: '70d3d78c-0cc9-4975-8c67-a14d3570bbaa',
  numeroFTC: '2025999',
  formData: {
    cliente: 'DPWORLD',
    solicitante: 'João Silva',
    contato: '(13) 99999-9999',
    nome_peca: 'SUPORTE PARA INSTALAÇÃO SENSOR FORBE',
    quantidade: '10',
    dados_orcamento: {
      itens: [{
        descricao: 'SUPORTE PARA INSTALAÇÃO SENSOR FORBE',
        quantidade: 10,
        valorUnitario: 352,
        valorTotal: 3520
      }],
      config: {
        garantia: '90',
        prazoEntrega: '10',
        prazoPagamento: '28',
        validadeProposta: '30',
        condicoesPagamento: '28 DIAS'
      },
      custos: {
        valorHora: 53,
        margemLucro: 30,
        despesasFixas: 10,
        despesasVariaveis: 25
      },
      precoVendaFinal: 3520
    }
  }
};

console.log('✅ Ficha de teste criada');
console.log('📝 Cliente:', fichaTeste.formData.cliente);
console.log('💰 Valor:', fichaTeste.formData.dados_orcamento.precoVendaFinal);
console.log('\n⚠️  Para gerar o HTML, execute o botão "Baixar HTML" na interface web da FTC 2025999');
console.log('📂 O HTML será salvo automaticamente via browser');

/**
 * Script para testar o webhook do Asaas localmente
 * 
 * Uso: node scripts/test-webhook-asaas.js
 * 
 * Este script simula um webhook do Asaas para testar a integração
 */

const http = require('http');

// Dados de exemplo de um webhook do Asaas
const webhookData = {
  event: 'PAYMENT_RECEIVED',
  payment: {
    id: 'pay_test123456',
    customer: 'cus_test123',
    billingType: 'PIX',
    value: 100.00,
    netValue: 100.00,
    originalValue: 100.00,
    interestValue: 0,
    description: 'Pedido #123',
    status: 'RECEIVED',
    dueDate: '2025-01-15',
    paymentDate: new Date().toISOString().split('T')[0],
    clientPaymentDate: new Date().toISOString().split('T')[0],
    installmentNumber: null,
    invoiceUrl: 'https://www.asaas.com/i/test123',
    bankSlipUrl: null,
    transactionReceiptUrl: null,
    invoiceNumber: '001',
    externalReference: 'order_123',
    deleted: false,
    anticipated: false,
    anticipable: false,
    refunds: null,
    dateCreated: new Date().toISOString(),
    dateCreatedFormatted: new Date().toLocaleString('pt-BR'),
  }
};

// Configurações
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:5000/api/payments/webhook/asaas';
const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || null;

console.log('🧪 Testando Webhook do Asaas\n');
console.log('URL:', WEBHOOK_URL);
console.log('Dados:', JSON.stringify(webhookData, null, 2));
console.log('\n');

// Fazer requisição POST
const url = new URL(WEBHOOK_URL);
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Asaas-Webhook/1.0',
  }
};

// Adicionar token se configurado
if (WEBHOOK_TOKEN) {
  options.headers['asaas-access-token'] = WEBHOOK_TOKEN;
  console.log('✅ Token de autenticação incluído\n');
}

const req = http.request(options, (res) => {
  console.log(`📡 Status da resposta: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📦 Resposta:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.success) {
        console.log('\n✅ Webhook processado com sucesso!');
      } else {
        console.log('\n⚠️ Webhook recebido mas houve erro:', json.error);
      }
    } catch (e) {
      console.log(data);
    }
    
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (error) => {
  console.error('❌ Erro ao enviar webhook:', error.message);
  process.exit(1);
});

req.write(JSON.stringify(webhookData));
req.end();


// Script para testar conexão com a API
const axios = require('axios');

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

async function testConnection() {
  console.log('🔍 Testando conexão com a API...\n');
  console.log(`URL da API: ${API_URL}\n`);

  // Teste 1: Health Check
  try {
    console.log('1️⃣ Testando Health Check...');
    const healthResponse = await axios.get(`${API_URL.replace('/api', '')}/api/health`);
    console.log('✅ Health Check OK:', healthResponse.data);
  } catch (error) {
    console.error('❌ Health Check FALHOU:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  Servidor não está rodando ou porta incorreta');
    }
    return;
  }

  // Teste 2: Buscar produtos
  try {
    console.log('\n2️⃣ Testando busca de produtos...');
    const productsResponse = await axios.get(`${API_URL}/products?limit=5`);
    console.log('✅ Produtos encontrados:', productsResponse.data.length || productsResponse.data.products?.length || 0);
  } catch (error) {
    console.error('❌ Busca de produtos FALHOU:', error.response?.data || error.message);
  }

  // Teste 3: Buscar categorias
  try {
    console.log('\n3️⃣ Testando busca de categorias...');
    const categoriesResponse = await axios.get(`${API_URL.replace('/api', '')}/api/categories`);
    console.log('✅ Categorias encontradas:', categoriesResponse.data.length || 0);
  } catch (error) {
    console.error('❌ Busca de categorias FALHOU:', error.response?.data || error.message);
  }

  // Teste 4: Teste de login (sem credenciais reais)
  try {
    console.log('\n4️⃣ Testando endpoint de login (esperado: erro de validação)...');
    const loginResponse = await axios.post(`${API_URL.replace('/api', '')}/api/auth/login`, {
      email: 'test@test.com',
      password: 'test'
    });
    console.log('⚠️  Login retornou sucesso (inesperado)');
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 401) {
      console.log('✅ Endpoint de login está funcionando (retornou erro esperado)');
    } else {
      console.error('❌ Erro inesperado no login:', error.message);
    }
  }

  console.log('\n✅ Testes concluídos!');
}

testConnection();

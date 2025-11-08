### src/types.ts:TypeScript

// src/types.ts

export interface NavItem {
  id: number;
  label: string;
  url: string;
  subItems?: NavItem[];
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  imageUrl: string;
  installments: string;
  sizes: string[];
}

export interface PromoBanner {
  text: string;
  id: number;
}

////////////////////////////////

Componentes Principais
Componente de Cartão de Produto (src/components/ProductCard.tsx)
Este componente exibe um único item de roupa na página.

TypeScript

// src/components/ProductCard.tsx
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div style={{ 
      border: '1px solid #eee', 
      padding: '15px', 
      textAlign: 'center', 
      maxWidth: '300px',
      margin: '10px'
    }}>
      {/* Imagem do Produto */}
      <img 
        src={product.imageUrl} 
        alt={product.name} 
        style={{ width: '100%', height: 'auto', objectFit: 'cover' }} 
      />
      
      {/* Marca e Nome */}
      <p style={{ margin: '5px 0', fontSize: '14px', color: '#888' }}>{product.brand}</p>
      <h3 style={{ fontSize: '16px', fontWeight: 'normal', minHeight: '40px' }}>{product.name}</h3>

      {/* Desconto */}
      {product.originalPrice && product.discountPercentage && (
        <div style={{ color: 'red', fontSize: '12px', marginBottom: '5px' }}>
          {product.discountPercentage}% OFF
          <span style={{ textDecoration: 'line-through', marginLeft: '10px', color: '#888' }}>
            R${product.originalPrice.toFixed(2).replace('.', ',')}
          </span>
        </div>
      )}

      {/* Preço Atual */}
      <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: '5px 0' }}>
        R${product.price.toFixed(2).replace('.', ',')}
      </p>

      {/* Parcelamento */}
      <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 10px' }}>
        ou {product.installments}
      </p>
      
      {/* Botões de Ação */}
      <div style={{ marginBottom: '10px' }}>
        {product.sizes.map(size => (
          <span key={size} style={{ 
            display: 'inline-block', 
            padding: '5px 8px', 
            margin: '2px', 
            border: '1px solid #ccc', 
            borderRadius: '3px', 
            fontSize: '12px'
          }}>
            {size}
          </span>
        ))}
      </div>

      <button style={{ 
        backgroundColor: '#f5c6cb', 
        color: '#333', 
        border: 'none', 
        padding: '10px 20px', 
        cursor: 'pointer', 
        fontSize: '14px',
        fontWeight: 'bold',
        width: '100%'
      }}>
        Ver + Detalhes
      </button>
    </div>
  );
};

export default ProductCard;
Componente de Navegação Principal (src/components/Navbar.tsx)
Este componente lida com o complexo menu de categorias do site.

TypeScript

// src/components/Navbar.tsx
import React from 'react';
import { NavItem } from '../types';

const navData: NavItem[] = [
  {
    id: 1,
    label: 'MENINAS',
    url: '/meninas',
    subItems: [
      { id: 101, label: 'Conjuntos', url: '/meninas/conjuntos' },
      { id: 102, label: 'Vestidos e Saias', url: '/meninas/vestidos' },
      // ... outras subcategorias
    ],
  },
  {
    id: 2,
    label: 'MENINOS',
    url: '/meninos',
    subItems: [
      { id: 201, label: 'Conjuntos', url: '/meninos/conjuntos' },
      { id: 202, label: 'Macacões', url: '/meninos/macacoes' },
      // ... outras subcategorias
    ],
  },
  { id: 3, label: 'FAMÍLIA', url: '/familia' },
  { id: 4, label: 'OUTLET', url: '/outlet' },
  { id: 5, label: 'COLEÇÕES', url: '/colecoes' },
  { id: 6, label: 'MARCAS', url: '/marcas' },
  { id: 7, label: 'LANÇAMENTOS', url: '/lancamentos' },
];

const Navbar: React.FC = () => {
  const primaryNavStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottom: '1px solid #eee',
    padding: '10px 0',
  };

  const navItemStyle: React.CSSProperties = {
    padding: '0 15px',
    listStyle: 'none',
  };

  const navLinkStyle: React.CSSProperties = {
    textDecoration: 'none',
    color: '#333',
    fontWeight: 'bold',
    fontSize: '14px',
    textTransform: 'uppercase',
  };

  return (
    <nav style={primaryNavStyle}>
      <ul style={{ display: 'flex', margin: 0, padding: 0 }}>
        {navData.map((item) => (
          <li key={item.id} style={navItemStyle}>
            <a href={item.url} style={navLinkStyle}>
              {item.label}
            </a>
            {/* Implementação do menu dropdown/mega-menu (opcional, mas necessário para a cópia fiel) */}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
Componente Principal da Aplicação (src/App.tsx)
Este componente agrega os outros, simulando a página inicial.

TypeScript

// src/App.tsx
import React from 'react';
import ProductCard from './components/ProductCard';
import Navbar from './components/Navbar';
import { Product } from './types';

// Dados simulados baseados no site original
const mockProducts: Product[] = [
  {
    id: 1,
    name: "Vestido Infantil Laço Tule Pituchinus",
    brand: "Pituchinus",
    price: 499.90,
    originalPrice: 599.90,
    discountPercentage: 17,
    imageUrl: "placeholder-vestido.jpg", // Substitua com URLs reais
    installments: "10x de R$ 49,99 Sem juros",
    sizes: ["02", "04", "06", "08"],
  },
  {
    id: 2,
    name: "Conjunto Infantil Dino Refresh Marinho Kyly",
    brand: "Kyly",
    price: 53.90,
    originalPrice: 79.90,
    discountPercentage: 33,
    imageUrl: "placeholder-conjunto.jpg", // Substitua com URLs reais
    installments: "R$ 51,21 à vista com desconto",
    sizes: ["M", "01"],
  },
  // Adicione mais produtos mockados...
];

const App: React.FC = () => {
  const headerStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderBottom: '1px solid #ccc',
    padding: '15px 0',
    textAlign: 'center',
  };

  const mainTitleStyle: React.CSSProperties = {
    margin: '20px 0',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center'
  };
  ///////////////////////////////////////////////////////////////////////////////////////////////
  // O Header do site Infantilita é complexo, com Top Bar, Logo/Busca e Nav principal.
  // Aqui, simulamos o Header e usamos o Navbar.

  return (
    <div className="infantilita-app">
      {/* Top Bar e Header (Simplificado) */}
      <header style={headerStyle}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', padding: '0 20px'}}>
            <div className="user-actions">
                <a href="/login">Entre ou cadastre-se</a>
            </div>
            <h1 style={{ fontSize: '28px', color: '#c3507d' }}>Infantilitá</h1> 
            <div className="cart-search" style={{display: 'flex', gap: '15px'}}>
                <input type="text" placeholder="Buscar..." style={{padding: '5px'}}/>
                <button>Sacola (0)</button>
            </div>
        </div>
      </header>

      {/* Barra de Navegação */}
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
        {/* Banner Rotativo (Simulação) */}
        <div style={{ height: '300px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
          <h2>Carrossel de Banners Principal</h2>
        </div>

        {/* Seção de Destaque - Meninas */}
        <h2 style={mainTitleStyle}>Destaques Meninas</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
          {mockProducts.filter((_, index) => index % 2 === 0).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Seção de Destaque - Meninos */}
        <h2 style={mainTitleStyle}>Destaques Meninos</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
          {mockProducts.filter((_, index) => index % 2 !== 0).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {/* Aqui você adicionaria outras seções: Compre por Tamanho, Depoimentos, Footer, etc. */}
      </main>

      {/* Footer (Simplificado) */}
      <footer style={{ backgroundColor: '#333', color: '#fff', padding: '40px 20px', marginTop: '50px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <p>Copyright © 2025 - infantilita.com.br. Todos os direitos reservados.</p>
              <p>Contato: (41) 3013-6146 | contato@infantilita.com.br</p>
          </div>
      </footer>
    </div>
  );
};

export default App;
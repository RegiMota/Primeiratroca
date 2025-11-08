import { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '../lib/mockData';

interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, size: string, color: string) => void;
  removeFromCart: (productId: number, size?: string, color?: string) => void;
  updateQuantity: (productId: number, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number, size: string, color: string) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id && item.size === size && item.color === color
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id && item.size === size && item.color === color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevItems, { product, quantity, size, color }];
    });
  };

  const removeFromCart = (productId: number, size?: string, color?: string) => {
    setItems((prevItems) => {
      // Se size e color foram fornecidos, remover apenas o item específico
      if (size !== undefined && color !== undefined) {
        return prevItems.filter(
          (item) =>
            !(item.product.id === productId && item.size === size && item.color === color)
        );
      }
      // Caso contrário, remover todos os itens do produto (comportamento antigo para compatibilidade)
      return prevItems.filter((item) => item.product.id !== productId);
    });
  };

  const updateQuantity = (productId: number, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        // Se size e color foram fornecidos, atualizar apenas o item específico
        if (size !== undefined && color !== undefined) {
          return item.product.id === productId && item.size === size && item.color === color
            ? { ...item, quantity }
            : item;
        }
        // Caso contrário, atualizar todos os itens do produto (comportamento antigo para compatibilidade)
        return item.product.id === productId ? { ...item, quantity } : item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

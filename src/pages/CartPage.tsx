import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import { useLocation } from 'wouter';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Separator } from '../components/ui/separator';

export function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();
  const [, setLocation] = useLocation();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
        <div className="rounded-xl sm:rounded-2xl lg:rounded-3xl bg-white p-6 sm:p-8 lg:p-16 text-center shadow-lg border border-gray-200 transition-colors">
          <ShoppingBag className="mx-auto mb-4 sm:mb-6 h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-gray-300" />
          <h1 className="mb-3 sm:mb-4 text-sky-500 text-xl sm:text-2xl lg:text-[2rem] font-bold sm:font-extrabold lg:font-black" style={{ fontWeight: 900 }}>
            Seu Carrinho Está Vazio
          </h1>
          <p className="mb-6 sm:mb-8 text-gray-600 text-sm sm:text-base">
            Parece que você ainda não adicionou nenhum item ao seu carrinho
          </p>
          <Button
            onClick={() => setLocation('/shop')}
            size="lg"
            className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 sm:px-8 lg:px-12 py-3 sm:py-4 text-white hover:from-amber-500 hover:to-orange-600 text-sm sm:text-base"
            style={{ fontWeight: 700 }}
          >
            Começar a Comprar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-12">
      <h1 className="mb-4 sm:mb-6 lg:mb-8 text-sky-500 text-2xl sm:text-3xl lg:text-[2.5rem] font-bold sm:font-extrabold lg:font-black" style={{ fontWeight: 900 }}>
        Carrinho de Compras
      </h1>

      <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-[1fr_400px]">
        {/* Cart Items */}
        <div className="space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div key={`${item.product.id}-${item.size}-${item.color}`} className="rounded-lg sm:rounded-xl lg:rounded-2xl bg-white p-3 sm:p-4 lg:p-6 shadow-md border border-gray-200 transition-colors">
              <div className="flex gap-3 sm:gap-4 lg:gap-6">
                {/* Product Image */}
                <div className="h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32 flex-shrink-0 overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50 to-orange-50">
                  <ImageWithFallback
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div className="flex-1">
                    <h3 className="mb-1 sm:mb-2 text-gray-900 text-sm sm:text-base lg:text-[1.25rem] font-semibold sm:font-bold lg:font-extrabold leading-tight sm:leading-snug" style={{ fontWeight: 700 }}>
                      {item.product.name}
                    </h3>
                    <div className="mb-1.5 sm:mb-2 flex flex-wrap gap-2 sm:gap-3 lg:gap-4 text-gray-600 text-xs sm:text-sm lg:text-[0.875rem]">
                      <span>Tamanho: {item.size}</span>
                      <span>Cor: {item.color}</span>
                    </div>
                    <p className="text-sky-500 text-base sm:text-lg lg:text-[1.25rem] font-bold sm:font-extrabold lg:font-black" style={{ fontWeight: 700 }}>
                      R$ {item.product.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3 mt-3 sm:mt-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size, item.color)}
                        className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-md sm:rounded-lg border-2 border-gray-300 hover:border-sky-500"
                      >
                        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="text-base sm:text-lg lg:text-[1.125rem] font-semibold sm:font-bold min-w-[1.5rem] sm:min-w-[2rem] text-center" style={{ fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size, item.color)}
                        className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-md sm:rounded-lg border-2 border-gray-300 hover:border-sky-500"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                    >
                      <Trash2 className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Remover</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <div className="rounded-lg sm:rounded-xl lg:rounded-2xl bg-white p-4 sm:p-5 lg:p-6 shadow-lg border border-gray-200 transition-colors">
            <h2 className="mb-4 sm:mb-5 lg:mb-6 text-sky-500 text-lg sm:text-xl lg:text-[1.5rem] font-bold sm:font-extrabold lg:font-black" style={{ fontWeight: 700 }}>
              Resumo do Pedido
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">Subtotal</span>
                <span className="text-gray-900 text-sm sm:text-base font-semibold sm:font-bold" style={{ fontWeight: 600 }}>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">Frete</span>
                <span className="text-gray-900 text-sm sm:text-base font-semibold sm:font-bold" style={{ fontWeight: 600 }}>GRÁTIS</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-900 text-base sm:text-lg lg:text-[1.25rem] font-bold sm:font-extrabold lg:font-black" style={{ fontWeight: 700 }}>Total</span>
                <span className="text-sky-500 text-lg sm:text-xl lg:text-[1.5rem] font-extrabold sm:font-black lg:font-black" style={{ fontWeight: 900 }}>
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setLocation('/checkout')}
              size="lg"
              className="mt-4 sm:mt-5 lg:mt-6 w-full rounded-lg sm:rounded-xl lg:rounded-full bg-gradient-to-r from-amber-400 to-orange-500 py-4 sm:py-5 lg:py-6 text-white shadow-lg hover:from-amber-500 hover:to-orange-600 text-sm sm:text-base lg:text-lg"
              style={{ fontWeight: 700 }}
            >
              Finalizar Compra
            </Button>

            <Button
              onClick={() => setLocation('/shop')}
              variant="outline"
              size="lg"
              className="mt-2 sm:mt-3 w-full rounded-lg sm:rounded-xl lg:rounded-full border-2 border-sky-500 py-4 sm:py-5 lg:py-6 text-sky-500 hover:bg-sky-50 text-sm sm:text-base"
              style={{ fontWeight: 700 }}
            >
              Continuar Comprando
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

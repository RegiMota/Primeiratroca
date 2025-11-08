import { useState } from 'react';
import { couponsAPI } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Tag, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface CouponInputProps {
  subtotal: number;
  onCouponApplied: (coupon: { code: string; discountAmount: number; finalTotal: number }) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: { code: string; discountAmount: number; finalTotal: number } | null;
}

export function CouponInput({ subtotal, onCouponApplied, onCouponRemoved, appliedCoupon }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Digite um código de cupom');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const result = await couponsAPI.validate(couponCode.trim(), subtotal);

      if (result.valid) {
        onCouponApplied({
          code: result.coupon.code,
          discountAmount: result.discountAmount,
          finalTotal: result.finalTotal,
        });
        toast.success('Cupom aplicado com sucesso!', {
          description: `Desconto de R$ ${result.discountAmount.toFixed(2)} aplicado.`,
        });
        setCouponCode('');
      } else {
        setError(result.error || 'Cupom inválido');
        toast.error('Cupom inválido', {
          description: result.error || 'Verifique o código e tente novamente.',
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao validar cupom';
      setError(errorMessage);
      toast.error('Erro ao validar cupom', {
        description: errorMessage,
      });
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setCouponCode('');
    setError(null);
    toast.success('Cupom removido');
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="couponCode">Cupom de Desconto</Label>
      
      {appliedCoupon ? (
        <div className="flex items-center justify-between rounded-lg border-2 border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-900">
                Cupom {appliedCoupon.code} aplicado
              </p>
              <p className="text-xs text-green-700">
                Desconto de R$ {appliedCoupon.discountAmount.toFixed(2)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            className="h-8 w-8 p-0 text-green-700 hover:bg-green-100 hover:text-green-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="couponCode"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleValidateCoupon();
                }
              }}
              placeholder="Digite o código do cupom"
              className={error ? 'border-red-500' : ''}
              disabled={validating}
            />
            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={handleValidateCoupon}
            disabled={validating || !couponCode.trim()}
            className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
            style={{ fontWeight: 600 }}
          >
            {validating ? 'Validando...' : <Tag className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}


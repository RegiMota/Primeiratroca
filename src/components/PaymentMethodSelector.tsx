import { useState } from 'react';
import { CreditCard, Wallet, FileText, QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

export type PaymentMethod = 'credit_card' | 'pix' | 'boleto';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod) => void;
  installments?: number;
  onInstallmentsChange?: (installments: number) => void;
}

const paymentMethods = [
  {
    value: 'credit_card' as PaymentMethod,
    label: 'Cartão de Crédito',
    icon: CreditCard,
    description: 'Pague com cartão de crédito',
    available: true,
  },
  {
    value: 'pix' as PaymentMethod,
    label: 'PIX',
    icon: QrCode,
    description: 'Pagamento instantâneo via PIX',
    available: true,
  },
  {
    value: 'boleto' as PaymentMethod,
    label: 'Boleto Bancário',
    icon: FileText,
    description: 'Pague com boleto bancário',
    available: true,
  },
];

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  installments = 1,
  onInstallmentsChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Método de Pagamento</Label>
        <p className="text-sm text-gray-600 mt-1">Escolha como deseja pagar</p>
      </div>

      <RadioGroup value={selectedMethod || ''} onValueChange={(value) => onMethodChange(value as PaymentMethod)}>
        <div className="grid gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <label
                key={method.value}
                htmlFor={method.value}
                className={`block cursor-pointer transition-all ${
                  !method.available ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Card
                  className={`transition-all ${
                    selectedMethod === method.value
                      ? 'border-2 border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                      : 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem
                        value={method.value}
                        id={method.value}
                        className="mt-1"
                        disabled={!method.available}
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg transition-colors ${
                          selectedMethod === method.value
                            ? 'bg-sky-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <Label
                            htmlFor={method.value}
                            className="text-base font-medium cursor-pointer"
                          >
                            {method.label}
                          </Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </label>
            );
          })}
        </div>
      </RadioGroup>

      {/* Seleção de parcelas para cartão de crédito */}
      {selectedMethod === 'credit_card' && onInstallmentsChange && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Parcelamento</CardTitle>
            <CardDescription>Escolha em quantas vezes deseja parcelar</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={installments}
              onChange={(e) => onInstallmentsChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}x {num === 1 ? 'sem juros' : 'com juros'}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


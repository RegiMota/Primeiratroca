import { useState } from 'react';
import { CreditCard, Wallet, FileText, QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod) => void;
  installments?: number | null;
  onInstallmentsChange?: (installments: number | null) => void;
  totalAmount?: number; // Valor total para calcular parcelas
}

/**
 * Calcula o valor da parcela usando a Tabela Price
 * @param principal Valor principal (valor total)
 * @param installments Número de parcelas
 * @param monthlyRate Taxa de juros mensal (ex: 0.0299 para 2.99%)
 * @returns Valor da parcela
 */
function calculateInstallmentValue(
  principal: number,
  installments: number,
  monthlyRate: number = 0.0299 // 2.99% ao mês (taxa comum no Brasil)
): number {
  if (installments <= 0) return principal;
  if (installments === 1) return principal; // Sem juros na primeira parcela
  
  // Fórmula da Tabela Price: P = PV * (i * (1 + i)^n) / ((1 + i)^n - 1)
  const i = monthlyRate;
  const n = installments;
  const numerator = i * Math.pow(1 + i, n);
  const denominator = Math.pow(1 + i, n) - 1;
  const installmentValue = principal * (numerator / denominator);
  
  return installmentValue;
}

const paymentMethods = [
  {
    value: 'credit_card' as PaymentMethod,
    label: 'Cartão de Crédito',
    icon: CreditCard,
    description: 'Pague com cartão de crédito em até 12x',
    available: true,
  },
  {
    value: 'debit_card' as PaymentMethod,
    label: 'Cartão de Débito',
    icon: Wallet,
    description: 'Pague com cartão de débito',
    available: true,
  },
  {
    value: 'pix' as PaymentMethod,
    label: 'PIX',
    icon: QrCode,
    description: 'Pagamento instantâneo via PIX',
    available: true,
  },
];

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  installments = 1,
  onInstallmentsChange,
  totalAmount = 0,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Método de Pagamento</Label>
        <p className="text-sm text-gray-600 mt-1">Escolha como deseja pagar</p>
      </div>

      <RadioGroup 
        value={selectedMethod || ''} 
        onValueChange={(value) => {
          onMethodChange(value as PaymentMethod);
          // Resetar parcelamento quando mudar método de pagamento
          if (onInstallmentsChange && value !== 'credit_card') {
            onInstallmentsChange(1);
          } else if (onInstallmentsChange && value === 'credit_card') {
            // Resetar para null quando selecionar cartão de crédito
            onInstallmentsChange(null);
          }
        }}
      >
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
            <div className="space-y-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                const installmentValue = totalAmount > 0 
                  ? calculateInstallmentValue(totalAmount, num)
                  : 0;
                const formattedValue = installmentValue > 0
                  ? `R$ ${installmentValue.toFixed(2).replace('.', ',')}`
                  : '';
                const isSelected = installments === num;
                
                return (
                  <label
                    key={num}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="installments"
                        value={num}
                        checked={isSelected}
                        onChange={(e) => {
                          const value = e.target.value;
                          console.log('Installments select changed:', { value, installments });
                          if (value) {
                            const numValue = Number(value);
                            console.log('Setting installments to:', numValue);
                            onInstallmentsChange(numValue);
                          } else {
                            console.log('Resetting installments to null');
                            onInstallmentsChange(null);
                          }
                        }}
                        className="h-4 w-4 text-sky-500 focus:ring-sky-500"
                      />
                      <span className={`text-sm font-medium ${
                        isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {num}x {num === 1 ? 'sem juros' : 'com juros'}
                      </span>
                    </div>
                    {formattedValue && (
                      <span className={`text-sm font-bold ${
                        isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {formattedValue}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


// Barra de pesquisa para o Admin Panel
// Versão 2.0

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface AdminSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function AdminSearchBar({
  placeholder = 'Buscar...',
  onSearch,
  value: controlledValue,
  onChange,
  className = '',
}: AdminSearchBarProps) {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleClear = () => {
    handleChange('');
    onSearch?.('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(value);
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyPress={handleKeyPress}
        className="w-full pl-10 pr-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-1 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}


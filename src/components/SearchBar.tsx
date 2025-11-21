import { Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { productsAPI } from '../lib/api';
import { useLocation } from 'wouter';

interface SearchBarProps {
  onSearch: (query: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

interface SearchSuggestion {
  id: number;
  name: string;
  category: string;
}

export function SearchBar({ onSearch, inputRef }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const loadSuggestions = async () => {
      // Mostrar sugestões a partir de 1 caractere (mais responsivo)
      if (query.trim().length >= 1) {
        try {
          const data = await productsAPI.getSearchSuggestions(query);
          setSuggestions(data);
          setShowSuggestions(data.length > 0 && query.trim().length > 0);
        } catch (error) {
          console.error('Error loading suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    // Reduzir debounce para resposta mais rápida (200ms em vez de 300ms)
    const debounce = setTimeout(loadSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.name);
    onSearch(suggestion.name);
    setShowSuggestions(false);
    // Navegar para a página de detalhes do produto
    setLocation(`/product/${suggestion.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSubmit(e as any);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    setShowSuggestions(false);
  };

  return (
    <div ref={searchRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Buscar produtos..."
          value={query}
          onChange={(e) => {
            const newQuery = e.target.value;
            setQuery(newQuery);
            // Não chamar onSearch enquanto está digitando (só ao submeter)
            // Isso evita navegação prematura enquanto o usuário digita
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="w-full rounded-full border-2 border-gray-200 py-2 pl-10 pr-10 focus:border-emerald-500 focus:ring-emerald-500"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors ${
                  index === selectedIndex ? 'bg-emerald-50' : ''
                }`}
              >
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  {suggestion.name}
                </div>
                {suggestion.category && (
                  <div className="text-sm text-gray-500 mt-1 ml-6">{suggestion.category}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface FilterSidebarProps {
  categories?: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  selectedSizes?: string[];
  onSizesChange?: (sizes: string[]) => void;
  selectedColors?: string[];
  onColorsChange?: (colors: string[]) => void;
  inStockOnly?: boolean;
  onInStockChange?: (inStock: boolean) => void;
  featuredOnly?: boolean;
  onFeaturedChange?: (featured: boolean) => void;
  availableSizes?: string[];
  availableColors?: string[];
  onClearFilters?: () => void;
  activeFiltersCount?: number;
}

export function FilterSidebar({
  categories = [],
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  selectedSizes = [],
  onSizesChange,
  selectedColors = [],
  onColorsChange,
  inStockOnly = false,
  onInStockChange,
  featuredOnly = false,
  onFeaturedChange,
  availableSizes = [],
  availableColors = [],
  onClearFilters,
  activeFiltersCount = 0,
}: FilterSidebarProps) {
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(priceRange);
  const [expandedSections, setExpandedSections] = useState<{
    categories: boolean;
    price: boolean;
    sizes: boolean;
    colors: boolean;
    other: boolean;
  }>({
    categories: true,
    price: true,
    sizes: false,
    colors: false,
    other: false,
  });

  // Sincronizar quando priceRange mudar externamente
  useEffect(() => {
    setLocalPriceRange(priceRange);
  }, [priceRange]);

  const handlePriceChange = (value: number[]) => {
    setLocalPriceRange([value[0], value[1]]);
  };

  const applyPriceFilter = () => {
    onPriceRangeChange(localPriceRange);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSizeToggle = (size: string) => {
    if (!onSizesChange) return;
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    onSizesChange(newSizes);
  };

  const handleColorToggle = (color: string) => {
    if (!onColorsChange) return;
    const newColors = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    onColorsChange(newColors);
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    priceRange[0] > 0 ||
    priceRange[1] < 500 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    inStockOnly ||
    featuredOnly;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-200 transition-colors">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sky-500" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          Filtros
        </h3>
        {activeFiltersCount > 0 && (
          <Badge className="bg-sky-500 text-white">
            {activeFiltersCount} {activeFiltersCount === 1 ? 'ativo' : 'ativos'}
          </Badge>
        )}
      </div>

      {/* Botão Limpar Filtros */}
      {hasActiveFilters && onClearFilters && (
        <Button
          onClick={onClearFilters}
          variant="outline"
          className="mb-6 w-full border-red-300 text-red-600 hover:bg-red-50"
        >
          <X className="mr-2 h-4 w-4" />
          Limpar Filtros
        </Button>
      )}

      {/* Categories */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('categories')}
          className="mb-3 flex w-full items-center justify-between text-gray-700"
        >
          <Label className="text-base font-semibold">Categoria</Label>
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.categories && (
          <div className="space-y-2">
            <button
              onClick={() => onCategoryChange('All')}
              className={`w-full rounded-lg px-4 py-2 text-left transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ fontWeight: selectedCategory === 'All' ? 600 : 400 }}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.name)}
                className={`w-full rounded-lg px-4 py-2 text-left transition-colors ${
                  selectedCategory === category.name
                    ? 'bg-sky-500 dark:bg-sky-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                style={{ fontWeight: selectedCategory === category.name ? 600 : 400 }}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('price')}
          className="mb-3 flex w-full items-center justify-between text-gray-700"
        >
          <Label className="text-base font-semibold">Faixa de Preço</Label>
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.price && (
          <div>
            <div className="mb-4">
              <Slider
                min={0}
                max={500}
                step={10}
                value={localPriceRange}
                onValueChange={handlePriceChange}
                className="mb-3"
              />
              <div className="flex items-center justify-between text-gray-600" style={{ fontSize: '0.875rem' }}>
                <span>R$ {localPriceRange[0]}</span>
                <span>R$ {localPriceRange[1]}</span>
              </div>
            </div>
            <Button
              onClick={applyPriceFilter}
              className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
              style={{ fontWeight: 600 }}
            >
              Aplicar Filtro
            </Button>
          </div>
        )}
      </div>

      {/* Tamanhos */}
      {availableSizes.length > 0 && onSizesChange && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('sizes')}
            className="mb-3 flex w-full items-center justify-between text-gray-700"
          >
            <Label className="text-base font-semibold">Tamanhos</Label>
            {expandedSections.sizes ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.sizes && (
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    selectedSizes.includes(size)
                      ? 'bg-sky-500 dark:bg-sky-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  style={{ fontWeight: selectedSizes.includes(size) ? 600 : 400 }}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cores */}
      {availableColors.length > 0 && onColorsChange && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('colors')}
            className="mb-3 flex w-full items-center justify-between text-gray-700"
          >
            <Label className="text-base font-semibold">Cores</Label>
            {expandedSections.colors ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.colors && (
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorToggle(color)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    selectedColors.includes(color)
                      ? 'bg-sky-500 dark:bg-sky-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  style={{ fontWeight: selectedColors.includes(color) ? 600 : 400 }}
                >
                  {color}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Outros Filtros */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('other')}
          className="mb-3 flex w-full items-center justify-between text-gray-700"
        >
          <Label className="text-base font-semibold">Outros Filtros</Label>
          {expandedSections.other ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.other && (
          <div className="space-y-3">
            {onInStockChange && (
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => onInStockChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-gray-700">Apenas em estoque</span>
              </label>
            )}
            {onFeaturedChange && (
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => onFeaturedChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-gray-700">Apenas em destaque</span>
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

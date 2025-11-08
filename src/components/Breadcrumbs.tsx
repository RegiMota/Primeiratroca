import { ChevronRight, Home } from 'lucide-react';
import { useLocation } from 'wouter';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const [, setLocation] = useLocation();

  return (
    <nav className="flex items-center gap-2 py-4 text-sm text-gray-600">
      <button
        onClick={() => setLocation('/')}
        className="flex items-center gap-1 hover:text-sky-600 transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Início</span>
      </button>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.href ? (
            <button
              onClick={() => setLocation(item.href!)}
              className="hover:text-sky-600 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}


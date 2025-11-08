import { useLocation } from 'wouter';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface NavItem {
  id: number;
  label: string;
  url: string;
  subItems?: NavItem[];
}

const navData: NavItem[] = [
  {
    id: 1,
    label: 'MENINAS',
    url: '/shop?gender=girls',
    subItems: [
      { id: 101, label: 'Conjuntos', url: '/shop?category=conjuntos&gender=girls' },
      { id: 102, label: 'Vestidos e Saias', url: '/shop?category=vestidos&gender=girls' },
      { id: 103, label: 'Blusas e Camisetas', url: '/shop?category=blusas&gender=girls' },
      { id: 104, label: 'Calças e Shorts', url: '/shop?category=calcas&gender=girls' },
      { id: 105, label: 'Acessórios', url: '/shop?category=acessorios&gender=girls' },
    ],
  },
  {
    id: 2,
    label: 'MENINOS',
    url: '/shop?gender=boys',
    subItems: [
      { id: 201, label: 'Conjuntos', url: '/shop?category=conjuntos&gender=boys' },
      { id: 202, label: 'Macacões', url: '/shop?category=macacoes&gender=boys' },
      { id: 203, label: 'Camisetas', url: '/shop?category=camisetas&gender=boys' },
      { id: 204, label: 'Calças e Shorts', url: '/shop?category=calcas&gender=boys' },
      { id: 205, label: 'Acessórios', url: '/shop?category=acessorios&gender=boys' },
    ],
  },
  { id: 3, label: 'FAMÍLIA', url: '/shop?category=familia' },
  { id: 4, label: 'OUTLET', url: '/shop?outlet=true' },
  { id: 5, label: 'COLEÇÕES', url: '/shop?collections=true' },
  { id: 6, label: 'MARCAS', url: '/shop?brands=true' },
  { id: 7, label: 'LANÇAMENTOS', url: '/shop?new=true' },
];

export function MainNavbar() {
  const [, setLocation] = useLocation();

  const handleNavigate = (url: string) => {
    setLocation(url);
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-6">
        <ul className="flex items-center justify-center gap-1 md:gap-4 py-3 overflow-x-auto">
          {navData.map((item) => {
            if (item.subItems && item.subItems.length > 0) {
              return (
                <li key={item.id} className="flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 px-3 md:px-4 py-2 text-sm font-bold text-gray-700 uppercase transition-all duration-200 hover:text-sky-500 hover:bg-sky-50 rounded-md">
                        {item.label}
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[200px]">
                      {item.subItems.map((subItem) => (
                        <DropdownMenuItem
                          key={subItem.id}
                          onClick={() => handleNavigate(subItem.url)}
                          className="cursor-pointer"
                        >
                          {subItem.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            }

            return (
              <li key={item.id} className="flex-shrink-0">
                <button
                  onClick={() => handleNavigate(item.url)}
                  className="px-3 md:px-4 py-2 text-sm font-bold text-gray-700 uppercase transition-all duration-200 hover:text-sky-500 hover:bg-sky-50 rounded-md whitespace-nowrap"
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}


// Componente para aplicar o tema no frontend principal
import { useEffect } from 'react';
import { settingsAPI } from '../lib/api';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyTheme = async () => {
      try {
        const theme = await settingsAPI.getTheme();
        
        // Aplicar cores como CSS variables
        const root = document.documentElement;
        root.style.setProperty('--color-primary', theme.colors.primary);
        root.style.setProperty('--color-secondary', theme.colors.secondary);
        root.style.setProperty('--color-accent', theme.colors.accent);
        root.style.setProperty('--color-background', theme.colors.background);
        root.style.setProperty('--color-text', theme.colors.text);
        
        // Aplicar tamanhos
        root.style.setProperty('--card-width', theme.sizes.cardWidth);
        root.style.setProperty('--card-height', theme.sizes.cardHeight);
        root.style.setProperty('--border-radius', theme.sizes.borderRadius);
        
        // Aplicar CSS customizado
        if (theme.customCSS) {
          let styleElement = document.getElementById('custom-theme-styles');
          if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'custom-theme-styles';
            document.head.appendChild(styleElement);
          }
          styleElement.textContent = theme.customCSS;
        } else {
          // Remover CSS customizado se não houver
          const styleElement = document.getElementById('custom-theme-styles');
          if (styleElement) {
            styleElement.remove();
          }
        }
      } catch (error) {
        console.error('Error applying theme:', error);
      }
    };
    
    applyTheme();
  }, []);
  
  return <>{children}</>;
}


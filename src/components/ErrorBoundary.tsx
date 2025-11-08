import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Suprimir erros conhecidos do React Strict Mode com portais
    if (error.name === 'NotFoundError' && error.message.includes('removeChild')) {
      // Não definir hasError para esses erros, apenas logar silenciosamente
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Suprimir erros conhecidos do React Strict Mode com portais
    if (error.name === 'NotFoundError' && error.message.includes('removeChild')) {
      // Erro conhecido do React Strict Mode com portais do Radix UI
      // Não fazer nada, apenas suprimir
      return;
    }
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded-2xl bg-red-50 p-6 text-center">
            <p className="text-red-600">Ocorreu um erro ao carregar este componente.</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}


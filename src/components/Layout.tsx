import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileTabBar } from './MobileTabBar';
import { FloatingElements } from './FloatingElements';
import { AnnouncementBanner } from './AnnouncementBanner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden" style={{ width: '100%', maxWidth: '100vw' }}>
      <AnnouncementBanner />
      <Header />
      <main className="flex-1 pb-20 md:pb-0 w-full overflow-x-hidden">
        {children}
      </main>
      <Footer />
      <MobileTabBar />
      <FloatingElements />
    </div>
  );
}


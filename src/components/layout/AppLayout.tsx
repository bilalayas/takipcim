import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

export const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background">
    <div className="max-w-lg mx-auto pb-20">
      {children}
    </div>
    <BottomNav />
  </div>
);

import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

export const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 mx-auto w-full max-w-2xl md:max-w-3xl lg:max-w-5xl px-5 md:px-10 lg:pl-28 pt-8 pb-32 md:pb-12">
        {children}
      </div>
      <BottomNav />
    </div>
  );
};

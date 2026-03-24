import React from 'react';
import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { BottomNav } from '../components/BottomNav';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white max-w-2xl mx-auto shadow-2xl relative overflow-x-hidden flex flex-col">
      <div className="flex-1 pb-20">
        <Outlet />
      </div>
      <BottomNav />
      <Toaster position="bottom-center" />
    </div>
  );
};

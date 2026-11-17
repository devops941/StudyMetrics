import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
      <Navbar />
      <div className="flex flex-1 items-start">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-[calc(100vh-4rem)]">
          <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 w-full">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

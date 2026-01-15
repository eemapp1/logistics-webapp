import React from 'react';
import { Sidebar } from './Sidebar';
import { useTheme } from '../contexts/ThemeContext';
import { User } from '../types';
import { Sun, Moon, Bell, Search, Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const { isSidebarCollapsed, toggleSidebar, isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-[#F5F8FA] dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={onLogout} />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Header - Professional/Medical Style (Light, Thin Border) */}
        <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar} 
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-white">{user?.agency}</span>
              <span className="text-slate-300">•</span>
              <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search (Visual Only) */}
            <div className="hidden md:flex items-center bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Recherche rapide..." 
                className="bg-transparent border-none outline-none text-sm ml-2 w-48 text-slate-700 dark:text-slate-200 placeholder-slate-400"
              />
            </div>

            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            <div className="flex items-center gap-3 pl-1 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {user?.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
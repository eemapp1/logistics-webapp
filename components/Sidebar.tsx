import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  Wallet, 
  Settings, 
  LogOut, 
  Truck,
  Send
} from 'lucide-react';
import { User } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const { isSidebarCollapsed, themeSettings } = useTheme();

  // Updated colors to match professional theme
  const activeClass = "flex items-center gap-3 px-3 py-2.5 bg-primary-600 text-white rounded-lg transition-all shadow-md shadow-primary-900/20 font-medium";
  const inactiveClass = "flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all";

  const renderLink = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink to={to} className={({ isActive }) => isActive ? activeClass : inactiveClass} title={isSidebarCollapsed ? label : ''}>
      <span className="min-w-[20px]">{icon}</span>
      <span className={`whitespace-nowrap transition-all duration-300 origin-left ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
        {label}
      </span>
    </NavLink>
  );

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-[#1E293B] border-r border-slate-700/50 text-white flex flex-col z-20 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50 bg-[#1A2332]">
        <div className="flex items-center gap-2 transition-all duration-300">
          {themeSettings.logoUrl ? (
            <img 
              src={themeSettings.logoUrl}
              alt="Logo" 
              className={`flex-shrink-0 transition-all duration-300 object-contain ${isSidebarCollapsed ? 'w-12 h-12' : 'w-16 h-16'}`}
            />
          ) : (
            <>
              <img 
                src="/logo.svg" 
                alt="EEM Transport" 
                className={`flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-12 h-12' : 'w-16 h-16'}`}
              />
              <span className={`font-bold text-white tracking-tight transition-all duration-300 text-sm ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                EEM<span className="text-primary-400">trans</span>
              </span>
            </>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {renderLink("/dashboard", <LayoutDashboard size={20} />, "Tableau de bord")}
        
        <div className={`pt-6 pb-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          Gestion
        </div>
        
        {renderLink("/new-shipment", <PlusCircle size={20} />, "Nouveau Colis")}
        {renderLink("/shipments", <Package size={20} />, "Liste des Colis")}
        {renderLink("/departures", <Send size={20} />, "Départ Chauffeur")}
        {renderLink("/cash-register", <Wallet size={20} />, "Caisse & Finance")}

        <div className={`pt-6 pb-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          Admin
        </div>

        {renderLink("/settings", <Settings size={20} />, "Paramètres")}
      </nav>

      <div className="p-3 border-t border-slate-700/50 bg-[#1A2332]">
        <button 
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-900/10 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
          title="Déconnexion"
        >
          <LogOut size={20} />
          <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            Déconnexion
          </span>
        </button>
      </div>
    </aside>
  );
};
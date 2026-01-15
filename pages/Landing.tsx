import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Shield, BarChart3, Printer, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
            <Truck size={28} strokeWidth={2.5} />
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              EEM<span className="text-blue-600">Transport</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
            >
              Accès Espace Pro <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Nouvelle Version V2.0
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              La gestion de transport <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">simplifiée et intelligente</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              Une solution tout-en-un pour les agences de transport : gestion des colis, suivi financier, impression de tickets thermiques et statistiques en temps réel.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:transform hover:-translate-y-1 transition-all shadow-xl"
              >
                Se connecter
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                En savoir plus
              </button>
            </div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-40">
           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-200/50 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-200/50 rounded-full blur-[100px]"></div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white dark:bg-slate-900 py-24 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="space-y-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Printer size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Billetterie Thermique</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Générez des tickets professionnels instantanément. Compatible avec toutes les imprimantes thermiques standards.
              </p>
            </div>

            <div className="space-y-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Finance & Statistiques</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Suivez votre chiffre d'affaires, gérez la caisse (MAD/EUR) et visualisez vos performances en temps réel.
              </p>
            </div>

            <div className="space-y-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sécurité & Rôles</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Gestion multi-utilisateurs avec niveaux de permission (Admin, Gérant, Lecture seule). Données cryptées.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <Truck size={20} />
            <span className="font-semibold text-slate-700 dark:text-slate-200">EEM Transport</span>
          </div>
          <p className="text-sm text-slate-500">© 2024 EEM Transport. Tous droits réservés.</p>
          <div className="flex gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Mentions légales</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Lock, User as UserIcon, Loader2, ArrowLeft } from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Mock Authentication Logic
    setTimeout(() => {
      setLoading(false);
      if (email === 'admin@eem.com' && password === 'admin') {
        onLogin({
          id: '1',
          name: 'EEM Admin',
          email: email,
          role: UserRole.ADMIN,
          agency: 'Siège Principal'
        });
        navigate('/dashboard');
      } else if (email === 'manager@eem.com' && password === 'manager') {
         onLogin({
          id: '2',
          name: 'Gérant Paris',
          email: email,
          role: UserRole.MANAGER,
          agency: 'Paris Centre'
        });
        navigate('/dashboard');
      } else {
        setError('Identifiants incorrects. Essayez admin@eem.com / admin');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      
      <div className="w-full max-w-md">
        <button 
          onClick={() => navigate('/')} 
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Retour à l'accueil
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600 text-white mb-6 shadow-lg shadow-blue-900/20">
              <Truck size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Connexion Espace Pro</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Saisissez vos identifiants pour accéder au dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Identifiant</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all"
                  placeholder="nom@eem-transport.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
               <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mot de passe</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg border border-red-100 dark:border-red-800/30 flex items-center gap-2">
                <span className="w-1 h-4 bg-red-500 rounded-full"></span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Problème de connexion ? Contacter le support IT.<br />
              Version v2.0.4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Wallet, CreditCard, Banknote, TrendingDown, 
  ArrowUpRight, Package, ArrowRight 
} from 'lucide-react';
import { useShipments } from '../contexts/ShipmentContext';
import { PaymentStatus, PaymentMethod, Currency, TransactionType } from '../types';

const StatCard: React.FC<{ title: string; amount: string; icon: React.ReactNode; trend?: string; color: string }> = ({ title, amount, icon, trend, color }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
        {React.cloneElement(icon as React.ReactElement, { className: color.replace('bg-', 'text-') })}
      </div>
      {trend && (
        <span className="flex items-center text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
          <ArrowUpRight size={12} className="mr-1" /> {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{amount}</h3>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { shipments, expenses } = useShipments();
  const navigate = useNavigate();

  // --- 1. Real-time Calculation Logic (Strictly synchronized with CashRegister) ---
  const stats = useMemo(() => {
    let cashMAD = 0;
    let cashTotal = 0;
    let totalEUR = 0;
    let totalBank = 0;
    let totalExpenses = 0;

    // Process Incomes (Shipments)
    shipments.forEach(s => {
      // Only count what is actually paid (advanceAmount)
      const amount = s.advanceAmount;
      if (amount <= 0) return;

      const isCash = s.paymentMethod === PaymentMethod.CASH;
      const isBank = s.paymentMethod === PaymentMethod.BANK || s.paymentMethod === PaymentMethod.CHECK;
      const isMAD = s.currency === Currency.MAD;
      const isEUR = s.currency === Currency.EUR;

      if (isCash) {
        if (isMAD) {
          cashMAD += amount;
          cashTotal += amount;
        } else if (isEUR) {
          totalEUR += amount;
        }
      } else if (isBank) {
        // Bank is usually separated, we don't mix currencies for Bank in this summary view
        // Assuming Bank payments are tracked in MAD equivalent or kept separate.
        // For this dashboard, we just sum up the raw number for the "Bank" card 
        // (or ideally, convert, but let's stick to raw sum or MAD filter).
        // Let's assume Bank is mostly MAD for local business, or display raw.
        totalBank += amount;
      }
    });

    // Process Expenses (Deducted from Cash MAD for balance)
    expenses.forEach(e => {
       // Expenses are typically paid in Cash MAD
       totalExpenses += e.amount;
       cashMAD -= e.amount;
    });

    return {
      cashMAD, // Net balance
      cashTotal, // Gross total cash received
      totalEUR,
      totalBank,
      totalExpenses
    };
  }, [shipments, expenses]);

  // --- 2. Chart Data Aggregation (Monthly) ---
  const chartData = useMemo(() => {
    const monthsMap: Record<string, { name: string, entrees: number, depenses: number, order: number }> = {};
    const today = new Date();

    // Initialize last 6 months to ensure continuity in graph
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsMap[key] = {
        name: d.toLocaleDateString('fr-FR', { month: 'short' }),
        entrees: 0,
        depenses: 0,
        order: d.getTime()
      };
    }

    // Aggregate Incomes (MAD Cash only for graph consistency or All MAD?)
    // Usually graphs show Volume. Let's show MAD Cash Flow + Bank Flow combined for "Entrées"
    shipments.forEach(s => {
      if (s.currency !== Currency.MAD) return; // Graph in MAD
      if (s.advanceAmount <= 0) return;
      
      const date = new Date(s.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthsMap[key]) {
        monthsMap[key].entrees += s.advanceAmount;
      }
    });

    // Aggregate Expenses
    expenses.forEach(e => {
      const date = new Date(e.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthsMap[key]) {
        monthsMap[key].depenses += e.amount;
      }
    });

    return Object.values(monthsMap).sort((a, b) => a.order - b.order);
  }, [shipments, expenses]);


  // Get top 10 recent shipments
  const recentShipments = shipments.slice(0, 10);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Tableau de Bord</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Vue d'ensemble synchronisée avec la caisse.</p>
      </div>

      {/* KPI Cards (Dynamic) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Solde Caisse (MAD)" 
          amount={`${stats.cashMAD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`} 
          icon={<Banknote size={24} />} 
          trend="Net"
          color="bg-green-500"
        />
        <StatCard 
          title="Total Espèces (MAD)" 
          amount={`${stats.cashTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`} 
          icon={<Wallet size={24} />} 
          trend="Reçu"
          color="bg-blue-500"
        />
        <StatCard 
          title="Solde Banque (Total)" 
          amount={`${stats.totalBank.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          icon={<CreditCard size={24} />} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Fonds Euro (Espèces)" 
          amount={`${stats.totalEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`} 
          icon={<Wallet size={24} />} 
          color="bg-purple-500"
        />
        <StatCard 
          title="Dépenses (Total)" 
          amount={`${stats.totalExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`} 
          icon={<TrendingDown size={24} />} 
          color="bg-red-500"
        />
      </div>

      {/* Main Chart Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Flux Financiers (MAD)</h3>
          <span className="text-xs text-slate-500">6 derniers mois</span>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#1e293b' }}
              />
              <Area type="monotone" dataKey="entrees" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="Entrées" />
              <Area type="monotone" dataKey="depenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Dépenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Shipments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package size={20} className="text-blue-600" />
              Derniers Colis Ajoutés
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Aperçu des 10 dernières expéditions enregistrées.</p>
          </div>
          <button 
            onClick={() => navigate('/shipments')}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg"
          >
            Voir tout <ArrowRight size={16} />
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Code Bon</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Expéditeur</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Destinataire</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Ville / Adresse</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Détails</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Prix Total</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {recentShipments.length > 0 ? (
                recentShipments.map((shipment) => {
                  const parcelSummary = `${shipment.totalItems} colis (${shipment.parcels.map(p => p.type).slice(0, 1).join(', ')}${shipment.parcels.length > 1 ? '...' : ''})`;
                  
                  return (
                    <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{shipment.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">{shipment.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 dark:text-white">{shipment.senderName}</div>
                        <div className="text-[10px] text-slate-500">{shipment.senderPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 dark:text-white">{shipment.receiverName}</div>
                        <div className="text-[10px] text-slate-500">{shipment.receiverPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{shipment.city}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                           {shipment.receiverAddress}, {shipment.zipCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-700 dark:text-slate-300 w-fit">
                           <Package size={12} /> {parcelSummary}
                         </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900 dark:text-white">
                        {shipment.price.toFixed(2)} {shipment.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                         <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                           ${shipment.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-700' : 
                             shipment.paymentStatus === PaymentStatus.PARTIAL ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                           {shipment.paymentStatus}
                         </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Aucun colis enregistré pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
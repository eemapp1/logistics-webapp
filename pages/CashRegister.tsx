import React, { useState, useMemo } from 'react';
import { 
  ArrowDownRight, ArrowUpRight, Plus, Download, Printer, Search, 
  Filter, Trash2, Calendar, TrendingDown, TrendingUp, Wallet, 
  CreditCard, Euro, MoreHorizontal, X, FileSpreadsheet, Package, Banknote 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { useShipments } from '../contexts/ShipmentContext';
import { TransactionType, PaymentMethod, Currency, Shipment, Transaction } from '../types';
import { DateRangePicker } from '../components/DateRangePicker';

// --- Interfaces for Unified Rows ---
interface FinancialRow {
  id: string;
  date: string;
  code: string;
  type: TransactionType;
  label: string; // Sender Name or Expense Reason
  description: string;
  details?: any; // For popup
  amountMAD: number;
  amountEUR: number;
  amountBank: number;
  paymentMethod: string; // 'Espèces', 'Banque', etc.
  originalObject: Shipment | Transaction;
}

export const CashRegister: React.FC = () => {
  const { shipments, expenses, addExpense, deleteExpense, deleteShipment } = useShipments();

  // --- Local State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [detailPopupId, setDetailPopupId] = useState<string | null>(null);

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    reason: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // --- Data Processing ---
  
  // 1. Unified Rows Creation
  const financialData: FinancialRow[] = useMemo(() => {
    const rows: FinancialRow[] = [];

    // Process Incomes (Shipments)
    shipments.forEach(s => {
      // Logic: 
      // Cash MAD -> amountMAD
      // Cash EUR -> amountEUR
      // Bank -> amountBank (regardless of currency usually, but we display value)
      
      const isCash = s.paymentMethod === PaymentMethod.CASH;
      const isBank = s.paymentMethod === PaymentMethod.BANK || s.paymentMethod === PaymentMethod.CHECK;
      const isMAD = s.currency === Currency.MAD;
      const isEUR = s.currency === Currency.EUR;

      // Only count what is actually paid (Encaissement / advanceAmount)
      const amount = s.advanceAmount;

      if (amount > 0) {
        rows.push({
          id: s.id,
          date: s.date,
          code: s.code,
          type: TransactionType.INCOME,
          label: s.senderName,
          description: `${s.totalItems} Colis - ${s.city}`,
          details: s.parcels,
          amountMAD: (isCash && isMAD) ? amount : 0,
          amountEUR: (isCash && isEUR) ? amount : 0,
          amountBank: isBank ? amount : 0,
          paymentMethod: s.paymentMethod,
          originalObject: s
        });
      }
    });

    // Process Expenses
    expenses.forEach(e => {
      rows.push({
        id: e.id,
        date: e.date,
        code: '-',
        type: TransactionType.EXPENSE,
        label: e.reason || 'Dépense',
        description: e.description,
        details: null,
        amountMAD: e.amount, // Expenses are always MAD cash in this logic
        amountEUR: 0,
        amountBank: 0,
        paymentMethod: 'Espèces',
        originalObject: e
      });
    });

    // Sort by Date Descending
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [shipments, expenses]);

  // 2. Filtering
  const filteredData = useMemo(() => {
    return financialData.filter(row => {
      const matchesSearch = 
        row.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate = 
        (!filterDateFrom || row.date >= filterDateFrom) &&
        (!filterDateTo || row.date <= filterDateTo);

      const matchesType = filterType === 'all' || row.type === filterType;

      return matchesSearch && matchesDate && matchesType;
    });
  }, [financialData, searchTerm, filterDateFrom, filterDateTo, filterType]);

  // 3. Stats Calculation (Global Scope for Balance, Filtered for Display if needed)
  // Balance should typically reflect the CURRENT REAL STATE, not just filtered view.
  // But summary cards can reflect filtered view for reporting. Let's do Global for Balance Card, Filtered for others.
  
  const globalStats = useMemo(() => {
    let cashMAD = 0;
    let cashTotal = 0;
    let totalEUR = 0;
    let totalBank = 0;
    let totalExpenses = 0;

    financialData.forEach(row => {
      if (row.type === TransactionType.INCOME) {
        cashMAD += row.amountMAD;
        cashTotal += row.amountMAD;
        totalEUR += row.amountEUR;
        totalBank += row.amountBank;
      } else {
        // Expense
        cashMAD -= row.amountMAD; // Deduct from MAD Cash for balance
        totalExpenses += row.amountMAD;
      }
    });

    return { cashMAD, cashTotal, totalEUR, totalBank, totalExpenses };
  }, [financialData]);

  // 4. Chart Data (Monthly)
  const chartData = useMemo(() => {
    const months: Record<string, { name: string, entrees: number, depenses: number }> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
       const d = new Date();
       d.setMonth(d.getMonth() - i);
       const key = d.toISOString().slice(0, 7); // YYYY-MM
       months[key] = { 
         name: d.toLocaleDateString('fr-FR', { month: 'short' }), 
         entrees: 0, 
         depenses: 0 
       };
    }

    financialData.forEach(row => {
      const key = row.date.slice(0, 7);
      if (months[key]) {
        if (row.type === TransactionType.INCOME) {
          // Chart tracks MAD Flow
          months[key].entrees += row.amountMAD;
        } else {
          months[key].depenses += row.amountMAD;
        }
      }
    });

    return Object.values(months);
  }, [financialData]);

  // --- Handlers ---

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.reason) return;

    const newExpense: Transaction = {
      id: Date.now().toString(),
      date: expenseForm.date,
      type: TransactionType.EXPENSE,
      description: expenseForm.description || expenseForm.reason,
      reason: expenseForm.reason,
      amount: parseFloat(expenseForm.amount),
      currency: Currency.MAD
    };

    addExpense(newExpense);
    setIsExpenseModalOpen(false);
    setExpenseForm({ amount: '', reason: '', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = () => {
    if (confirm(`Supprimer ${selectedIds.length} éléments ?`)) {
      selectedIds.forEach(id => {
        const row = financialData.find(r => r.id === id);
        if (row?.type === TransactionType.EXPENSE) {
          deleteExpense(id);
        } else if (row?.type === TransactionType.INCOME) {
          // Optional: Allow deleting shipment from here? 
          // Usually risky. Let's block or allow. Prompt says "Suppression".
          // We will delete shipment.
          deleteShipment(id);
        }
      });
      setSelectedIds([]);
    }
  };

  const handleExport = () => {
     const headers = ['Date', 'Code', 'Type', 'Motif/Client', 'Description', 'Montant MAD', 'Montant EUR', 'Montant Banque', 'Mode Paiement'];
     const rows = filteredData.map(r => [
       r.date, r.code, r.type, r.label, r.description, r.amountMAD, r.amountEUR, r.amountBank, r.paymentMethod
     ]);
     
     const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `eem_caisse_${new Date().toISOString().slice(0,10)}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      if (!printWindow) {
        // Fonction helper pour les instructions selon le navigateur
        const getBrowserPopupInstructions = (): string => {
          const userAgent = navigator.userAgent.toLowerCase();

          if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
            return `Chrome: Cliquez sur l'icône 🔒 dans la barre d'adresse → "Paramètres du site" → "Popups et redirections" → Autoriser`;
          } else if (userAgent.includes('firefox')) {
            return `Firefox: Cliquez sur l'icône 🛡️ dans la barre d'adresse → "Autoriser les popups pour ce site"`;
          } else if (userAgent.includes('edg') || userAgent.includes('edge')) {
            return `Edge: Cliquez sur l'icône 🔒 dans la barre d'adresse → "Permissions du site" → "Popups et redirections" → Autoriser`;
          } else if (userAgent.includes('safari')) {
            return `Safari: Safari → Préférences → Sécurité → "Bloquer les popups" → Décochez`;
          } else {
            return `Navigateur inconnu: Recherchez "autoriser popups" dans les paramètres de votre navigateur`;
          }
        };

        const browserInstructions = getBrowserPopupInstructions();
        alert(`Les popups sont bloquées par votre navigateur.\n\n${browserInstructions}\n\nAprès avoir autorisé les popups, actualisez la page et réessayez.`);
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Journal de Caisse - EEM Transport</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: sans-serif; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .amount { text-align: right; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .footer-totals { margin-top: 20px; display: flex; justify-content: flex-end; gap: 20px; }
            .box { border: 1px solid #000; padding: 10px; width: 150px; text-align: right; }
            .income { color: green; }
            .expense { color: red; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EEM TRANSPORT - JOURNAL DE CAISSE</h1>
            <p>Période: ${filterDateFrom || 'Début'} au ${filterDateTo || 'Ce jour'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Code</th>
                <th>Type</th>
                <th>Libellé</th>
                <th>Espèces (MAD)</th>
                <th>Espèces (EUR)</th>
                <th>Banque</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(r => `
                <tr>
                  <td>${r.date}</td>
                  <td>${r.code}</td>
                  <td class="${r.type === TransactionType.INCOME ? 'income' : 'expense'}">${r.type}</td>
                  <td>${r.label} <small>(${r.description})</small></td>
                  <td class="amount">${r.amountMAD !== 0 ? r.amountMAD.toFixed(2) : '-'}</td>
                  <td class="amount">${r.amountEUR !== 0 ? r.amountEUR.toFixed(2) : '-'}</td>
                  <td class="amount">${r.amountBank !== 0 ? r.amountBank.toFixed(2) : '-'}</td>
                  <td>${r.paymentMethod}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer-totals">
            <div class="box">
              <strong>Solde Caisse (MAD)</strong><br>
              <span style="font-size:14px">${globalStats.cashMAD.toFixed(2)}</span>
            </div>
            <div class="box">
              <strong>Total Espèces (MAD)</strong><br>
              <span style="font-size:14px">${globalStats.cashTotal.toFixed(2)}</span>
            </div>
            <div class="box">
              <strong>Total EUR</strong><br>
              <span style="font-size:14px">${globalStats.totalEUR.toFixed(2)}</span>
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      // Attendre que le contenu soit chargé avant d'imprimer
      printWindow.onload = function() {
        setTimeout(() => {
          try {
            printWindow.print();
            // Ne pas fermer automatiquement
          } catch (error) {
            console.error('Erreur lors de l\'impression du journal:', error);
            alert('Erreur lors de l\'impression du journal. Veuillez réessayer.');
          }
        }, 500);
      };

      // Fallback si onload ne se déclenche pas
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          try {
            printWindow.print();
          } catch (error) {
            console.error('Erreur lors de l\'impression du journal (fallback):', error);
          }
        }
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la fenêtre d\'impression:', error);
      alert('Erreur lors de l\'ouverture de la fenêtre d\'impression. Vérifiez que les popups sont autorisés.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
         <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-green-500"></div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
               <Wallet size={24} />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Solde Caisse (MAD)</p>
               <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{globalStats.cashMAD.toFixed(2)} <span className="text-sm font-normal text-slate-400">DH</span></h3>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
               <Banknote size={24} />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Espèces (MAD)</p>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{globalStats.cashTotal.toFixed(2)} <span className="text-sm font-normal text-slate-400">DH</span></h3>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
               <CreditCard size={24} />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Banque (Info)</p>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{globalStats.totalBank.toFixed(2)}</h3>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
               <Euro size={24} />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fonds Euro (Info)</p>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{globalStats.totalEUR.toFixed(2)} €</h3>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
               <TrendingDown size={24} />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dépenses (MAD)</p>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{globalStats.totalExpenses.toFixed(2)} <span className="text-sm font-normal text-slate-400">DH</span></h3>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white">Flux Mensuels (Espèces MAD)</h3>
           </div>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={12}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                 <RechartsTooltip 
                   cursor={{fill: 'transparent'}}
                   contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                 />
                 <Bar dataKey="entrees" name="Entrées" fill="#22c55e" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="depenses" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Actions & Tools */}
        <div className="space-y-4">
            <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-900/20 flex flex-col justify-between h-40">
               <div>
                  <h3 className="font-bold text-lg">Nouvelle Dépense</h3>
                  <p className="text-blue-100 text-sm mt-1">Ajouter une sortie d'argent de la caisse espèces.</p>
               </div>
               <button 
                 onClick={() => setIsExpenseModalOpen(true)}
                 className="w-full py-2 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
               >
                 <Plus size={18} /> Ajouter Dépense
               </button>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-40 flex flex-col justify-center gap-3">
               <button 
                 onClick={handleExport}
                 className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700"
               >
                  <span className="flex items-center gap-2"><FileSpreadsheet size={18} className="text-green-600" /> Export Excel</span>
                  <Download size={16} />
               </button>
               <button 
                 onClick={handlePrint}
                 className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700"
               >
                  <span className="flex items-center gap-2"><Printer size={18} className="text-slate-600" /> Imprimer Journal</span>
                  <ArrowUpRight size={16} />
               </button>
            </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher (Code, Client, Motif)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
         </div>
         <div className="w-full md:w-64">
           <DateRangePicker startDate={filterDateFrom} endDate={filterDateTo} onChange={(s, e) => { setFilterDateFrom(s); setFilterDateTo(e); }} />
         </div>
         <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none"
            >
               <option value="all">Tout voir</option>
               <option value={TransactionType.INCOME}>Entrées (Encaissements)</option>
               <option value={TransactionType.EXPENSE}>Dépenses</option>
            </select>
         </div>
         {selectedIds.length > 0 && (
           <button 
             onClick={handleDelete}
             className="px-4 py-2.5 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
           >
             <Trash2 size={18} /> Supprimer ({selectedIds.length})
           </button>
         )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
         <div className="overflow-x-auto custom-scrollbar">
           <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
             <thead className="bg-slate-50 dark:bg-slate-950">
               <tr>
                 <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-slate-300" onChange={(e) => {
                    if (e.target.checked) setSelectedIds(filteredData.map(d => d.id));
                    else setSelectedIds([]);
                 }} checked={selectedIds.length === filteredData.length && filteredData.length > 0} /></th>
                 <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                 <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                 <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Client / Motif</th>
                 <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Espèces (MAD)</th>
                 <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider text-slate-400">EUR (Info)</th>
                 <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider text-slate-400">Banque (Info)</th>
                 <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Mode</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
               {filteredData.map(row => {
                 const isExpense = row.type === TransactionType.EXPENSE;
                 const isSelected = selectedIds.includes(row.id);
                 return (
                   <tr key={row.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                     <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => {
                        if (isSelected) setSelectedIds(selectedIds.filter(id => id !== row.id));
                        else setSelectedIds([...selectedIds, row.id]);
                     }} className="rounded border-slate-300" /></td>
                     <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-xs">{row.date}</td>
                     <td className="px-4 py-3 whitespace-nowrap relative">
                        {row.code !== '-' ? (
                          <button 
                            onClick={() => setDetailPopupId(detailPopupId === row.id ? null : row.id)}
                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {row.code}
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                        
                        {/* Detail Popup */}
                        {detailPopupId === row.id && row.details && (
                           <div className="absolute left-0 top-8 z-20 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 animate-in fade-in zoom-in-95 duration-200">
                              <h5 className="font-bold text-slate-900 dark:text-white mb-2 text-xs uppercase">Détails Colis</h5>
                              <ul className="space-y-2">
                                {(row.details as any[]).map((p, i) => (
                                   <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                                      <Package size={14} className="mt-0.5 text-blue-500" />
                                      <span>{p.count}x {p.type === 'Autre' ? p.customType : p.type} ({p.weight}kg)</span>
                                   </li>
                                ))}
                              </ul>
                              <button onClick={() => setDetailPopupId(null)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"><X size={14}/></button>
                           </div>
                        )}
                     </td>
                     <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">{row.label}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[150px]">{row.description}</div>
                     </td>
                     
                     <td className={`px-4 py-3 text-right font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                        {row.amountMAD !== 0 ? (
                           <span>{isExpense ? '-' : '+'}{row.amountMAD.toFixed(2)}</span>
                        ) : <span className="text-slate-300">-</span>}
                     </td>
                     
                     <td className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">
                        {row.amountEUR !== 0 ? row.amountEUR.toFixed(2) : <span className="text-slate-200 dark:text-slate-800">-</span>}
                     </td>
                     
                     <td className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">
                        {row.amountBank !== 0 ? row.amountBank.toFixed(2) : <span className="text-slate-200 dark:text-slate-800">-</span>}
                     </td>

                     <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                           {row.paymentMethod}
                        </span>
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
           {filteredData.length === 0 && (
              <div className="p-8 text-center text-slate-400">Aucune donnée trouvée.</div>
           )}
         </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nouvelle Dépense</h3>
                 <button onClick={() => setIsExpenseModalOpen(false)}><X size={20} className="text-slate-400" /></button>
              </div>
              <form onSubmit={handleAddExpense} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Montant (MAD)</label>
                    <input 
                      type="number" 
                      required
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500 text-right font-bold"
                      placeholder="0.00"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motif</label>
                    <select 
                       value={expenseForm.reason}
                       onChange={e => setExpenseForm({...expenseForm, reason: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none"
                       required
                    >
                       <option value="">Sélectionner...</option>
                       <option value="Carburant">Carburant</option>
                       <option value="Loyer">Loyer Agence</option>
                       <option value="Fournitures">Fournitures / Bureau</option>
                       <option value="Salaire">Avance Salaire</option>
                       <option value="Maintenance">Maintenance</option>
                       <option value="Autre">Autre</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                    <textarea 
                       value={expenseForm.description}
                       onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none resize-none"
                       rows={2}
                       placeholder="Détails supplémentaires..."
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                    <input 
                      type="date" 
                      value={expenseForm.date}
                      onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none"
                    />
                 </div>
                 <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-900/20">
                    Valider la dépense
                 </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};
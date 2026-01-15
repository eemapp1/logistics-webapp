import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Printer, Edit2, Trash2, Copy, MoreHorizontal, 
  Download, Eye, ChevronDown, Check, FileSpreadsheet, Package, X, AlertTriangle, FileText
} from 'lucide-react';
import { Shipment, PaymentMethod, PaymentStatus } from '../types';
import { printReceipt, printLabel } from '../services/printService';
import { useShipments } from '../contexts/ShipmentContext';
import { DateRangePicker } from '../components/DateRangePicker';

export const ShipmentList: React.FC = () => {
  const { shipments, deleteShipment, deleteMultipleShipments } = useShipments();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals state
  const [detailModalShipment, setDetailModalShipment] = useState<Shipment | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [printModalShipment, setPrintModalShipment] = useState<Shipment | null>(null);

  // --- Filtering Logic ---
  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.senderPhone.includes(searchTerm) ||
      shipment.receiverPhone.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || shipment.paymentStatus === filterStatus;
    
    const matchesDate = 
      (!filterDateFrom || shipment.date >= filterDateFrom) &&
      (!filterDateTo || shipment.date <= filterDateTo);

    return matchesSearch && matchesStatus && matchesDate;
  });

  // --- Bulk Actions ---
  const handleSelectAll = () => {
    if (selectedIds.length === filteredShipments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredShipments.map(s => s.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Supprimer ${selectedIds.length} colis sélectionnés ?`)) {
      deleteMultipleShipments(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Code Bon', 'Date', 'Expéditeur', 'Tel Exp', 
      'Destinataire', 'Tel Dest', 'Adresse', 'Code Postal', 'Ville', 
      'Contenu Colis', 'Poids Total', 'Prix Total', 'Devise', 'Statut'
    ];
    
    const rows = filteredShipments.map(s => {
      // Create a readable string for parcels
      const parcelDetails = s.parcels.map(p => 
        `${p.count}x ${p.type === 'Autre' ? p.customType : p.type} (${p.weight}kg)`
      ).join(' | ');

      return [
        s.code, s.date, s.senderName, s.senderPhone, 
        s.receiverName, s.receiverPhone, `"${s.receiverAddress}"`, s.zipCode, s.city,
        `"${parcelDetails}"`, s.totalWeight, s.price, s.currency, s.paymentStatus
      ];
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `eem_export_complet_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintList = () => {
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

      // Calculate totals for footer
      const totalRevenue = filteredShipments.reduce((sum, s) => sum + s.price, 0);
      const totalWeight = filteredShipments.reduce((sum, s) => sum + s.totalWeight, 0);
      const totalParcels = filteredShipments.reduce((sum, s) => sum + s.totalItems, 0);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Listing Colis - EEM Transport</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #111; -webkit-print-color-adjust: exact; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .logo { font-size: 28px; font-weight: 900; color: #1e3a8a; letter-spacing: -1px; }
            .agency-info { font-size: 10px; color: #555; text-align: right; }

            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f1f5f9; color: #334155; text-align: left; padding: 8px 5px; border: 1px solid #cbd5e1; font-size: 9px; text-transform: uppercase; font-weight: 700; }
            td { border: 1px solid #e2e8f0; padding: 6px 5px; vertical-align: top; }
            tr:nth-child(even) { background-color: #f8fafc; }

            .col-code { white-space: nowrap; font-weight: bold; width: 80px; }
            .col-date { white-space: nowrap; width: 70px; }
            .col-person { width: 140px; }
            .col-address { }
            .col-parcels { font-size: 9px; }
            .col-price { text-align: right; font-weight: bold; width: 80px; }
            .col-status { text-align: center; width: 70px; font-weight: bold; }

            .sub-text { display: block; font-size: 9px; color: #64748b; margin-top: 2px; }
            .parcel-item { display: block; margin-bottom: 2px; }
            .status-paid { color: #166534; background: #dcfce7; padding: 2px 4px; border-radius: 4px; display:inline-block; }
            .status-unpaid { color: #991b1b; background: #fee2e2; padding: 2px 4px; border-radius: 4px; display:inline-block; }
            .status-partial { color: #9a3412; background: #ffedd5; padding: 2px 4px; border-radius: 4px; display:inline-block; }

            .footer-stats { margin-top: 20px; display: flex; justify-content: flex-end; gap: 20px; border-top: 2px solid #333; padding-top: 10px; }
            .stat-box { text-align: right; }
            .stat-label { font-size: 9px; text-transform: uppercase; color: #666; }
            .stat-value { font-size: 14px; font-weight: bold; }

            .print-meta { font-size: 9px; color: #999; margin-top: 30px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">EEM TRANSPORT</div>
              <div style="font-size: 12px; font-weight: bold; margin-top: 5px;">LISTING DES COLIS</div>
            </div>
            <div class="agency-info">
              <strong>Agence Centrale</strong><br>
              Date d'export: ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}<br>
              Période: ${filterDateFrom ? filterDateFrom : 'Début'} au ${filterDateTo ? filterDateTo : 'Ce jour'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="col-code">Code Bon</th>
                <th class="col-date">Date</th>
                <th class="col-person">Expéditeur</th>
                <th class="col-person">Destinataire</th>
                <th class="col-address">Adresse Livraison</th>
                <th class="col-parcels">Détails Colis</th>
                <th class="col-price">Montant</th>
                <th class="col-status">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${filteredShipments.map(s => `
                <tr>
                  <td class="col-code">${s.code}</td>
                  <td class="col-date">${s.date}</td>
                  <td class="col-person">
                    <strong>${s.senderName}</strong>
                    <span class="sub-text">${s.senderPhone}</span>
                  </td>
                  <td class="col-person">
                    <strong>${s.receiverName}</strong>
                    <span class="sub-text">${s.receiverPhone}</span>
                  </td>
                  <td class="col-address">
                    <strong>${s.city}</strong>
                    <span class="sub-text">${s.receiverAddress}<br>${s.zipCode}</span>
                  </td>
                  <td class="col-parcels">
                    ${s.parcels.map(p => `
                      <span class="parcel-item">• ${p.count}x ${p.type === 'Autre' ? p.customType : p.type} (${p.weight}kg)</span>
                    `).join('')}
                    ${s.note ? `<div style="margin-top:4px; font-style:italic; color:#666;">Note: ${s.note}</div>` : ''}
                  </td>
                  <td class="col-price">
                    ${s.price.toFixed(2)} ${s.currency}
                    ${s.paymentStatus !== 'Payé' ? `<div class="sub-text">Reste: ${s.remainingAmount.toFixed(2)}</div>` : ''}
                  </td>
                  <td class="col-status">
                    <span class="${s.paymentStatus === 'Payé' ? 'status-paid' : s.paymentStatus === 'Non Payé' ? 'status-unpaid' : 'status-partial'}">
                      ${s.paymentStatus}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer-stats">
            <div class="stat-box">
              <div class="stat-label">Total Colis</div>
              <div class="stat-value">${totalParcels} unités</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Poids Total</div>
              <div class="stat-value">${totalWeight.toFixed(2)} Kg</div>
            </div>
            <div class="stat-box">
               <div class="stat-label">Volume Financier</div>
               <div class="stat-value">${totalRevenue.toFixed(2)} (Mixte)</div>
            </div>
          </div>

          <div class="print-meta">
            Document généré automatiquement via EEM Manager V2.0 • Page 1/1
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
            console.error('Erreur lors de l\'impression de la liste:', error);
            alert('Erreur lors de l\'impression de la liste. Veuillez réessayer.');
          }
        }, 500);
      };

      // Fallback si onload ne se déclenche pas
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          try {
            printWindow.print();
          } catch (error) {
            console.error('Erreur lors de l\'impression de la liste (fallback):', error);
          }
        }
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la fenêtre d\'impression:', error);
      alert('Erreur lors de l\'ouverture de la fenêtre d\'impression. Vérifiez que les popups sont autorisés.');
    }
  };

  const confirmDelete = () => {
    if (deleteModalId) {
      deleteShipment(deleteModalId);
      setDeleteModalId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Liste des Colis</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {filteredShipments.length} colis trouvés • Gestion centralisée type Excel.
          </p>
        </div>
        <div className="flex gap-3">
            {selectedIds.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium animate-in slide-in-from-right-5 fade-in"
              >
                <Trash2 size={16} /> Supprimer ({selectedIds.length})
              </button>
            )}
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <FileSpreadsheet size={16} className="text-green-600" /> Export Excel
            </button>
            <button 
              onClick={handlePrintList}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FileText size={16} /> Télécharger PDF / Aperçu
            </button>
        </div>
      </header>

      {/* Toolbar - Unified Professional Design */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par Code, Nom, Tel..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all hover:border-blue-300 dark:hover:border-blue-600"
            />
          </div>

          {/* Date Picker */}
          <div className="md:col-span-4">
             <DateRangePicker 
                startDate={filterDateFrom} 
                endDate={filterDateTo} 
                onChange={(start, end) => {
                  setFilterDateFrom(start);
                  setFilterDateTo(end);
                }} 
             />
          </div>

          {/* Status Select */}
          <div className="md:col-span-3 relative">
             <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-11 pl-4 pr-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none text-sm text-slate-900 dark:text-white appearance-none cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-all"
             >
                <option value="all">Tous les status</option>
                {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <Filter size={16} className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredShipments.length && filteredShipments.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Code Bon</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Expéditeur</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Destinataire</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Ville / Adresse</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Détails Colis</th>
                <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Prix Total</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Statut</th>
                <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-slate-50 dark:bg-slate-950 shadow-[-5px_0px_10px_rgba(0,0,0,0.02)]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {filteredShipments.map((shipment) => {
                const parcelSummary = `${shipment.totalItems} colis (${shipment.parcels.map(p => p.type).slice(0, 1).join(', ')}${shipment.parcels.length > 1 ? '...' : ''})`;
                const isSelected = selectedIds.includes(shipment.id);

                return (
                  <tr key={shipment.id} className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors group ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleSelectOne(shipment.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{shipment.code}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-500 text-xs">{shipment.date}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white">{shipment.senderName}</div>
                      <div className="text-[10px] text-slate-500">{shipment.senderPhone}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white">{shipment.receiverName}</div>
                      <div className="text-[10px] text-slate-500">{shipment.receiverPhone}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{shipment.city}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                         {shipment.receiverAddress}, {shipment.zipCode}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                       <button 
                         onClick={() => setDetailModalShipment(shipment)}
                         className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 transition-colors"
                       >
                         <Package size={12} /> {parcelSummary} <Eye size={10} />
                       </button>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right font-bold text-slate-900 dark:text-white">
                      {shipment.price.toFixed(2)} {shipment.currency}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                       <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                         ${shipment.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-700' : 
                           shipment.paymentStatus === PaymentStatus.PARTIAL ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                         {shipment.paymentStatus}
                       </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-blue-50/50 dark:group-hover:bg-slate-800/50 shadow-[-5px_0px_10px_rgba(0,0,0,0.02)]">
                       <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => setPrintModalShipment(shipment)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors" 
                            title="Imprimer"
                          >
                            <Printer size={16} />
                          </button>
                          
                          <button 
                            onClick={() => navigate(`/edit-shipment/${shipment.id}`)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors" 
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          <button 
                            onClick={() => setDeleteModalId(shipment.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors" 
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredShipments.length === 0 && (
             <div className="p-12 text-center text-slate-400">
               Aucun colis trouvé pour les filtres sélectionnés.
             </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Detail Modal */}
      {detailModalShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800">
             <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
               <h3 className="font-bold text-lg text-slate-900 dark:text-white">Détails Expédition {detailModalShipment.code}</h3>
               <button onClick={() => setDetailModalShipment(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500"><X size={18}/></button>
             </div>
             <div className="p-6 overflow-y-auto max-h-[60vh]">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Liste des colis</h4>
                <div className="space-y-3">
                   {detailModalShipment.parcels.map((p, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                         <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                           <Package size={20} />
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between">
                               <span className="font-bold text-slate-900 dark:text-white">{p.type === 'Autre' ? p.customType : p.type}</span>
                               <span className="font-mono text-xs font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">x{p.count}</span>
                            </div>
                            <div className="text-sm text-slate-500 mt-1">Poids: {p.weight} kg</div>
                            {p.description && <div className="text-xs text-slate-400 italic mt-1">"{p.description}"</div>}
                         </div>
                      </div>
                   ))}
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                   <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase">Poids Total</div>
                      <div className="font-bold text-lg">{detailModalShipment.totalWeight} kg</div>
                   </div>
                   <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase">Articles</div>
                      <div className="font-bold text-lg">{detailModalShipment.totalItems}</div>
                   </div>
                </div>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button onClick={() => setDetailModalShipment(null)} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg text-sm">Fermer</button>
             </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
             <div className="flex flex-col items-center text-center">
               <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                 <AlertTriangle size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Êtes-vous sûr ?</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                 ⚠️ Voulez-vous vraiment supprimer ce bon ? <br/>
                 Cette action est <strong>irréversible</strong> et supprimera toutes les données associées (colis, historique).
               </p>
               <div className="flex gap-3 w-full">
                 <button 
                    onClick={() => setDeleteModalId(null)}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                 >
                   Annuler
                 </button>
                 <button 
                    onClick={confirmDelete}
                    className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                 >
                   Supprimer
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Print Selection Modal */}
      {printModalShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Imprimer</h3>
                <button onClick={() => setPrintModalShipment(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
             </div>
             <p className="text-sm text-slate-500 mb-6">Sélectionnez le document à imprimer pour le bon <strong>{printModalShipment.code}</strong>.</p>
             
             <div className="space-y-3">
               <button 
                 onClick={() => printReceipt(printModalShipment, 'CLIENT')}
                 className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-blue-700 dark:text-blue-300 transition-colors font-medium border border-blue-100 dark:border-blue-800"
               >
                 <Printer size={18} /> Ticket Client
               </button>
               <button 
                 onClick={() => printReceipt(printModalShipment, 'MERCHANT')}
                 className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors font-medium border border-slate-100 dark:border-slate-700"
               >
                 <Printer size={18} /> Ticket Commerçant
               </button>
               <button 
                 onClick={() => printLabel(printModalShipment)}
                 className="w-full flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg text-purple-700 dark:text-purple-300 transition-colors font-medium border border-purple-100 dark:border-purple-800"
               >
                 <Package size={18} /> Label Colis (Sticker)
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
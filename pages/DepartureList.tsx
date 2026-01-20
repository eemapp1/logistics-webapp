import React, { useState, useMemo, useRef } from 'react';
import {
  Truck, Search, Plus, Trash2, Printer, CheckCircle2,
  MapPin, User, Calculator, Archive, AlertCircle, Eye, Edit2, FileText, X, AlertTriangle, CheckSquare, Square, Calendar
} from 'lucide-react';
import { useShipments } from '../contexts/ShipmentContext';
import { Shipment, DepartureList, Currency, PaymentMethod } from '../types';
import { printDepartureList } from '../services/printService';

export const DepartureListManager: React.FC = () => {
  const { shipments, departureLists, addDepartureList, updateDepartureList, deleteDepartureList } = useShipments();
  const [activeTab, setActiveTab] = useState<'NEW' | 'ARCHIVE'>('NEW');

  // --- NEW DEPARTURE STATE ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // The "Pool" of shipments added to the view
  const [selectedShipments, setSelectedShipments] = useState<Shipment[]>([]);
  // The actual SELECTION of shipments (checkboxes) within the pool
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [discountPercent, setDiscountPercent] = useState<string>('0');

  const [showSuccess, setShowSuccess] = useState(false);
  const [createdListCode, setCreatedListCode] = useState('');

  // Validation State
  const [errors, setErrors] = useState<{ driverName?: boolean, selection?: boolean }>({});
  const driverInputRef = useRef<HTMLInputElement>(null);

  // --- MODAL STATES ---
  const [viewList, setViewList] = useState<DepartureList | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // --- SEARCH LOGIC ---
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return shipments.filter(s => {
      // Filter out already added to pool
      if (selectedShipments.find(sel => sel.id === s.id)) return false;

      const term = searchTerm.toLowerCase();
      return (
        s.code.toLowerCase().includes(term) ||
        s.senderName.toLowerCase().includes(term) ||
        s.senderPhone.includes(term) ||
        s.receiverName.toLowerCase().includes(term)
      );
    }).slice(0, 10);
  }, [searchTerm, shipments, selectedShipments]);

  // --- CALCULATIONS (CORE BUSINESS LOGIC) ---
  const stats = useMemo(() => {
    let totalMAD = 0; // Total Client MAD (checked only)
    let totalEUR = 0; // Total Client EUR (checked only)
    let bankTotal = 0; // Total Bank (checked only, no discount applied)

    let discountMAD = 0;
    let discountEUR = 0;

    let driverMAD = 0;
    let driverEUR = 0;

    let checkedCount = 0;

    const discount = parseFloat(discountPercent) || 0;

    selectedShipments.forEach(s => {
       if (checkedIds.has(s.id)) {
          checkedCount++;
          const isCash = s.paymentMethod === PaymentMethod.CASH;
          const isMAD = s.currency === Currency.MAD;
          const isEUR = s.currency === Currency.EUR;

          if (isCash) {
             if (isMAD) {
                totalMAD += s.price;
                const d = s.price * (discount / 100);
                discountMAD += d;
                driverMAD += (s.price - d);
             } else if (isEUR) {
                totalEUR += s.price;
                const d = s.price * (discount / 100);
                discountEUR += d;
                driverEUR += (s.price - d);
             }
          } else {
             // Bank payments - Internal info only, usually driver collects 0
             bankTotal += s.price;
          }
       }
    });

    return {
       totalMAD,
       totalEUR,
       bankTotal,
       discountMAD,
       discountEUR,
       driverMAD,
       driverEUR,
       checkedCount
    };
  }, [selectedShipments, checkedIds, discountPercent]);

  // Helper to calculate row specific driver price
  const getRowDriverPrice = (s: Shipment) => {
     if (!checkedIds.has(s.id)) return { net: 0, currency: s.currency };

     const isCash = s.paymentMethod === PaymentMethod.CASH;
     if (!isCash) return { net: 0, currency: s.currency };

     const discount = parseFloat(discountPercent) || 0;
     const net = s.price * (1 - discount / 100);

     return { net, currency: s.currency };
  };

  // --- HANDLERS ---

  const handleAddShipment = (shipment: Shipment) => {
    setSelectedShipments(prev => [...prev, shipment]);
    // Auto-check new additions for better UX
    setCheckedIds(prev => new Set(prev).add(shipment.id));
    setSearchTerm('');
    // Clear selection error if present
    if (errors.selection) setErrors(prev => ({...prev, selection: false}));
  };

  const handleRemoveShipment = (id: string) => {
    setSelectedShipments(prev => prev.filter(s => s.id !== id));
    setCheckedIds(prev => {
       const newSet = new Set(prev);
       newSet.delete(id);
       return newSet;
    });
  };

  const toggleCheck = (id: string) => {
     setCheckedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);

        // Clear selection error if now we have at least one
        if (newSet.size > 0 && errors.selection) {
            setErrors(e => ({...e, selection: false}));
        }
        return newSet;
     });
  };

  const toggleAll = () => {
     if (checkedIds.size === selectedShipments.length) {
        setCheckedIds(new Set());
     } else {
        setCheckedIds(new Set(selectedShipments.map(s => s.id)));
        setErrors(e => ({...e, selection: false}));
     }
  };

  const handleValidateList = async () => {
    const newErrors = { driverName: false, selection: false };
    let hasError = false;

    // 1. Check Driver Name
    if (!driverName.trim()) {
       newErrors.driverName = true;
       hasError = true;
       if (driverInputRef.current) driverInputRef.current.focus();
    }

    // 2. Check Selection
    if (stats.checkedCount === 0) {
       newErrors.selection = true;
       hasError = true;
    }

    setErrors(newErrors);

    if (hasError) return; // BLOCK VALIDATION

    const discountVal = parseFloat(discountPercent) || 0;

    // Filter actual shipments to save (only checked ones per prompt requirements)
    const finalShipments = selectedShipments.filter(s => checkedIds.has(s.id));

    // Generate unique code
    const dateStr = departureDate.replace(/-/g, ''); // YYYYMMDD from picker
    const timestamp = Date.now();
    const newCode = `DEP-${dateStr}-${timestamp.toString().slice(-3)}`;

    const listData: Omit<DepartureList, 'id'> = {
      code: editingId ? (departureLists.find(l => l.id === editingId)?.code || newCode) : newCode,
      date: departureDate,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      destination: destination.trim(),
      shipments: finalShipments,
      discountPercentage: discountVal,
      totalDriverMAD: stats.driverMAD,
      totalDriverEUR: stats.driverEUR,
      totalClientPrice: stats.totalMAD + stats.totalEUR,
      itemCount: finalShipments.length,
      status: 'VALIDATED'
    };

    try {
      let savedList: DepartureList;

      if (editingId) {
        savedList = await updateDepartureList(editingId, { id: editingId, ...listData });
      } else {
        savedList = await addDepartureList(listData);
      }

      setCreatedListCode(savedList.code);
      setShowSuccess(true);

      // Reset form after successful creation (not for edits)
      if (!editingId) {
        resetForm();
      }

    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert(`Erreur lors de la validation de la liste: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const resetForm = () => {
     setEditingId(null);
     setSelectedShipments([]);
     setCheckedIds(new Set());
     setDriverName('');
     setDriverPhone('');
     setDestination('');
     setDepartureDate(new Date().toISOString().split('T')[0]);
     setDiscountPercent('0');
     setErrors({});
  };

  const handleEditList = (list: DepartureList) => {
     console.log('handleEditList - Liste à éditer:', list);
     console.log('handleEditList - Shipments:', list.shipments);
     console.log('handleEditList - Nombre de shipments:', list.shipments?.length || 0);

     if (!list.shipments || list.shipments.length === 0) {
        alert('Erreur: Cette liste ne contient aucun colis et ne peut pas être éditée.');
        return;
     }

     setEditingId(list.id);
     setSelectedShipments(list.shipments);
     // Auto check all when loading from archive as they were all selected
     setCheckedIds(new Set(list.shipments.map(s => s.id)));
     setDriverName(list.driverName);
     setDriverPhone(list.driverPhone || '');
     setDestination(list.destination || '');
     setDepartureDate(list.date);
     setDiscountPercent(list.discountPercentage.toString());
     setActiveTab('NEW');
     setErrors({});
  };

  const handleDeleteList = async () => {
     if (deleteConfirmId) {
        try {
          await deleteDepartureList(deleteConfirmId);
          setDeleteConfirmId(null);
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression de la liste');
        }
     }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Départ Chauffeur</h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">Générez les listes de départ, appliquez les commissions et archivez.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
           <button
             onClick={() => { setActiveTab('NEW'); resetForm(); }}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'NEW' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             {editingId ? 'Mode Édition' : 'Nouveau Départ'}
           </button>
           <button
             onClick={() => setActiveTab('ARCHIVE')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ARCHIVE' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Archives
           </button>
        </div>
      </div>

      {activeTab === 'NEW' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

           {/* LEFT: Search & List */}
           <div className="lg:col-span-8 space-y-6">

              {/* Search Box */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-20">
                 <div className="flex items-center gap-3 mb-2">
                    <Search className="text-blue-500" size={20} />
                    <h3 className="font-bold text-slate-700 dark:text-white">Ajouter des colis</h3>
                 </div>
                 <input
                   type="text"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Rechercher par Code Bon, Nom Expéditeur ou Téléphone..."
                   className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                 />

                 {/* Search Results Dropdown */}
                 {searchTerm && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto z-30">
                       {searchResults.map(s => (
                          <div
                            key={s.id}
                            onClick={() => handleAddShipment(s)}
                            className="p-3 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 flex justify-between items-center"
                          >
                             <div>
                                <div className="font-bold text-slate-800 dark:text-white text-sm">{s.code} <span className="text-slate-400 font-normal">| {s.date}</span></div>
                                <div className="text-xs text-slate-500">{s.senderName} ({s.senderPhone}) → {s.receiverName}</div>
                             </div>
                             <button className="p-1 bg-blue-100 text-blue-600 rounded-full"><Plus size={16} /></button>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              {/* Selected List Table */}
              <div className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden flex flex-col h-[700px] transition-colors ${errors.selection ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-800'}`}>
                 <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       <Truck size={18} /> Liste de Départ ({selectedShipments.length})
                    </h3>
                    <div className="flex gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">
                        {stats.checkedCount} sélectionné(s)
                      </span>
                      {selectedShipments.length > 0 && (
                         <button onClick={() => { setSelectedShipments([]); setCheckedIds(new Set()); }} className="text-xs text-red-500 hover:underline">Tout effacer</button>
                      )}
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {selectedShipments.length > 0 ? (
                       <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 shadow-sm">
                             <tr>
                                <th className="px-3 py-3 w-10 text-center">
                                   <div onClick={toggleAll} className="cursor-pointer text-slate-400 hover:text-blue-500 inline-block align-middle">
                                      {checkedIds.size > 0 && checkedIds.size === selectedShipments.length ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                                   </div>
                                </th>
                                <th className="px-3 py-3 text-left font-bold text-slate-500 uppercase text-xs w-24">Code</th>
                                <th className="px-3 py-3 text-left font-bold text-slate-500 uppercase text-xs">Client</th>
                                <th className="px-3 py-3 text-left font-bold text-slate-500 uppercase text-xs">Ville / Adresse</th>
                                <th className="px-3 py-3 text-right font-bold text-slate-500 uppercase text-xs">Montant Client</th>
                                <th className="px-3 py-3 text-right font-bold text-blue-600 uppercase text-xs bg-blue-50/50 dark:bg-blue-900/10">Net Chauffeur</th>
                                <th className="px-3 py-3 w-8"></th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                             {selectedShipments.map((s, idx) => {
                                const isChecked = checkedIds.has(s.id);
                                const isMAD = s.currency === Currency.MAD;
                                const isEUR = s.currency === Currency.EUR;
                                const isCash = s.paymentMethod === PaymentMethod.CASH;
                                const driverCalc = getRowDriverPrice(s);

                                return (
                                <tr key={s.id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/50'} hover:bg-blue-50/30 dark:hover:bg-slate-800/50 ${isChecked ? 'bg-blue-50/20 dark:bg-blue-900/5' : 'opacity-70'} transition-colors`}>
                                   <td className="px-3 py-3 text-center">
                                      <div onClick={() => toggleCheck(s.id)} className="cursor-pointer text-slate-400 hover:text-blue-500 inline-block align-middle">
                                         {isChecked ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                                      </div>
                                   </td>
                                   <td className="px-3 py-3 font-mono text-slate-700 dark:text-slate-300 font-bold text-xs">{s.code}</td>
                                   <td className="px-3 py-3">
                                      <div className="font-medium text-slate-900 dark:text-white text-xs">{s.senderName}</div>
                                      <div className="text-[10px] text-slate-500">{s.senderPhone}</div>
                                   </td>
                                   <td className="px-3 py-3">
                                      <div className="text-slate-900 dark:text-white text-xs">{s.city}</div>
                                      <div className="text-[10px] text-slate-500 truncate max-w-[100px]">{s.receiverAddress}</div>
                                   </td>

                                   {/* Consolidated Client Price */}
                                   <td className="px-3 py-3 text-right">
                                      {isCash ? (
                                        <div className="inline-flex items-center gap-2">
                                           <span className="font-bold text-sm text-slate-700 dark:text-white">{s.price.toFixed(2)}</span>
                                           {isMAD ? (
                                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">MAD</span>
                                           ) : (
                                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold border border-blue-200 dark:border-blue-800">EUR</span>
                                           )}
                                        </div>
                                      ) : (
                                         <div className="flex flex-col items-end">
                                            <span className="text-slate-400 text-xs line-through decoration-slate-300">{s.price.toFixed(2)} {s.currency}</span>
                                            <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">Banque</span>
                                         </div>
                                      )}
                                   </td>

                                   {/* Consolidated Driver Net Price */}
                                   <td className="px-3 py-3 text-right bg-blue-50/20 dark:bg-blue-900/5">
                                      {isChecked && driverCalc.net > 0 ? (
                                         <div className="inline-flex items-center gap-2">
                                           <span className="font-bold text-sm text-blue-600 dark:text-blue-400">{driverCalc.net.toFixed(2)}</span>
                                           {driverCalc.currency === Currency.MAD ? (
                                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">MAD</span>
                                           ) : (
                                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">EUR</span>
                                           )}
                                         </div>
                                      ) : (
                                         <span className="text-slate-300 dark:text-slate-700">-</span>
                                      )}
                                   </td>

                                   <td className="px-3 py-3 text-right">
                                      <button onClick={() => handleRemoveShipment(s.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                         <Trash2 size={14} />
                                      </button>
                                   </td>
                                </tr>
                             )})}
                          </tbody>
                       </table>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center text-slate-400">
                          <Truck size={48} className="mb-4 opacity-20" />
                          <p>Aucun colis ajouté à la liste.</p>
                          <p className="text-sm">Utilisez la recherche ci-dessus.</p>
                       </div>
                    )}
                 </div>

                 {/* Footer Totals inside Table Container */}
                 {selectedShipments.length > 0 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">

                       <div className="flex items-center justify-between gap-4">
                           {/* Driver Totals - The important ones */}
                           <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-900/30 p-3 shadow-sm flex items-center justify-between px-6">
                              <span className="text-xs uppercase font-bold text-slate-500">Total Net Chauffeur</span>
                              <div className="flex gap-6">
                                 <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">MAD</span>
                                    <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.driverMAD.toFixed(2)}</span>
                                 </div>
                                 <div className="w-px bg-slate-200 h-8"></div>
                                 <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">EUR</span>
                                    <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.driverEUR.toFixed(2)}</span>
                                 </div>
                              </div>
                           </div>

                           {/* Secondary Stats */}
                           <div className="flex gap-4">
                              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2 text-center">
                                 <div className="text-[9px] text-slate-500 uppercase font-bold">Banque</div>
                                 <div className="text-sm font-bold text-slate-600 dark:text-slate-400">{stats.bankTotal.toFixed(2)}</div>
                              </div>
                           </div>
                       </div>

                       {errors.selection && (
                          <div className="mt-2 text-center">
                             <span className="text-xs font-bold text-red-500 flex items-center justify-center gap-1 animate-pulse">
                                <AlertCircle size={12}/> Erreur : Sélectionnez au moins un colis.
                             </span>
                          </div>
                       )}

                    </div>
                 )}
              </div>

           </div>

           {/* RIGHT: Settings & Validate */}
           <div className="lg:col-span-4 space-y-6">

              {/* Driver & Route Info */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                    <User size={18} className="text-blue-500" /> Infos Chauffeur
                 </h3>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom Chauffeur / Société <span className="text-red-500">*</span></label>
                    <input
                       ref={driverInputRef}
                       type="text"
                       value={driverName}
                       onChange={e => {
                          setDriverName(e.target.value);
                          if(e.target.value.trim() && errors.driverName) setErrors(err => ({...err, driverName: false}));
                       }}
                       className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg px-3 py-2 outline-none focus:ring-2 transition-all text-sm ${
                          errors.driverName
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500'
                       }`}
                       placeholder="Ex: Transport Express"
                    />
                    {errors.driverName && (
                       <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                          <AlertCircle size={10} /> Ce champ est obligatoire.
                       </p>
                    )}
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date Départ <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                           type="date"
                           value={departureDate}
                           onChange={e => setDepartureDate(e.target.value)}
                           className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-all text-sm"
                        />
                     </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Téléphone (Optionnel)</label>
                    <input
                       type="text"
                       value={driverPhone}
                       onChange={e => setDriverPhone(e.target.value)}
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-all text-sm"
                       placeholder="+33..."
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destination / Itinéraire</label>
                    <div className="relative">
                       <input
                          type="text"
                          value={destination}
                          onChange={e => setDestination(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 pl-9 outline-none focus:border-blue-500 transition-all text-sm"
                          placeholder="Ex: Paris -> Bruxelles"
                       />
                       <MapPin size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    </div>
                 </div>
              </div>

              {/* Commission Calculation */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                    <Calculator size={18} className="text-blue-500" /> Remise Chauffeur
                 </h3>

                 <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-2">Pourcentage Remise / Com</label>
                    <div className="relative w-full">
                       <input
                          type="number"
                          value={discountPercent}
                          onChange={e => {
                             const val = parseFloat(e.target.value);
                             if (!isNaN(val) && val >= 0 && val <= 100) setDiscountPercent(e.target.value);
                             else if (e.target.value === '') setDiscountPercent('');
                          }}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-lg rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                       />
                       <div className="absolute right-0 top-0 bottom-0 px-4 bg-slate-100 dark:bg-slate-800 rounded-r-lg border-l border-slate-200 dark:border-slate-700 flex items-center justify-center">
                          <span className="text-slate-500 font-bold">%</span>
                       </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                       S'applique uniquement aux montants <strong>Espèces</strong>.
                       <br/>Prix Net = Prix Client - {discountPercent || 0}%
                    </p>
                 </div>
              </div>

              {/* Validate Action */}
              <button
                type="button"
                onClick={handleValidateList}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                 <CheckCircle2 size={20} /> {editingId ? 'Mettre à jour la Liste' : 'Valider la Liste'}
              </button>

              {(stats.checkedCount === 0 || errors.driverName) && (
                 <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs flex items-center gap-2 border border-red-100">
                    <AlertTriangle size={14} /> Vérifiez les informations obligatoires.
                 </div>
              )}

           </div>
        </div>
      ) : (
        // --- ARCHIVE VIEW ---
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
           <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950">
                 <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Code Liste</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Chauffeur</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Destination</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Net MAD</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Net EUR</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                 {departureLists.map(list => (
                    <tr key={list.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                       <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">{list.date}</td>
                       <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-blue-600">{list.code}</td>
                       <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{list.driverName}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">{list.destination || '-'}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900 dark:text-white">
                          {list.totalDriverMAD?.toFixed(2) || '0.00'}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900 dark:text-white">
                          {list.totalDriverEUR?.toFixed(2) || '0.00'}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                             <button
                               onClick={() => setViewList(list)}
                               className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                               title="Voir détails"
                             >
                                <Eye size={18} />
                             </button>
                             <button
                               onClick={() => printDepartureList(list)}
                               className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                               title="Télécharger PDF"
                             >
                                <FileText size={18} />
                             </button>
                             <button
                               onClick={() => handleEditList(list)}
                               className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                               title="Éditer la liste"
                             >
                                <Edit2 size={18} />
                             </button>
                             <button
                               onClick={() => setDeleteConfirmId(list.id)}
                               className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                               title="Supprimer"
                             >
                                <Trash2 size={18} />
                             </button>
                             <button
                               onClick={() => printDepartureList(list)}
                               className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                               title="Imprimer"
                             >
                                <Printer size={18} />
                             </button>
                          </div>
                       </td>
                    </tr>
                 ))}
                 {departureLists.length === 0 && (
                    <tr>
                       <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          <Archive size={48} className="mx-auto mb-3 opacity-20" />
                          Aucune liste archivée.
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      )}

      {/* VIEW MODAL (Internal View) */}
      {viewList && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
               <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                  <div>
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white">Détails Liste {viewList.code}</h3>
                     <p className="text-xs text-slate-500">Chauffeur: {viewList.driverName} • Date: {viewList.date}</p>
                  </div>
                  <button onClick={() => setViewList(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
               </div>

               <div className="flex-1 overflow-y-auto p-0">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                     <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0">
                        <tr>
                           <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-xs">Code</th>
                           <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-xs">Client</th>
                           <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-xs">Détails</th>
                           <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase text-xs">Poids</th>
                           <th className="px-4 py-3 text-right font-bold text-blue-600 uppercase text-xs">Net MAD</th>
                           <th className="px-4 py-3 text-right font-bold text-blue-600 uppercase text-xs">Net EUR</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {viewList.shipments.map(s => {
                           const isCash = s.paymentMethod === PaymentMethod.CASH;
                           const net = isCash ? s.price * (1 - viewList.discountPercentage / 100) : 0;
                           const mad = s.currency === Currency.MAD && isCash ? net : 0;
                           const eur = s.currency === Currency.EUR && isCash ? net : 0;

                           return (
                              <tr key={s.id}>
                                 <td className="px-4 py-3 font-mono font-bold text-blue-600">{s.code}</td>
                                 <td className="px-4 py-3">{s.senderName} → {s.receiverName}</td>
                                 <td className="px-4 py-3 text-slate-500 text-xs">
                                    {s.parcels.map(p => `${p.count}x ${p.type}`).join(', ')}
                                 </td>
                                 <td className="px-4 py-3 text-right">{s.totalWeight} kg</td>
                                 <td className="px-4 py-3 text-right font-bold">{mad > 0 ? mad.toFixed(2) : '-'}</td>
                                 <td className="px-4 py-3 text-right font-bold">{eur > 0 ? eur.toFixed(2) : '-'}</td>
                              </tr>
                           )
                        })}
                     </tbody>
                  </table>
               </div>

               <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div className="text-sm">
                     <strong>Destination:</strong> {viewList.destination || 'N/A'}
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => printDepartureList(viewList)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                        <Printer size={16} /> Imprimer
                     </button>
                     <button onClick={() => setViewList(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold">
                        Fermer
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 text-center">
               <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} />
               </div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Supprimer cette liste ?</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Cette action est irréversible. La liste sera retirée des archives mais les colis resteront dans le système.
               </p>
               <div className="flex gap-3">
                  <button
                     onClick={() => setDeleteConfirmId(null)}
                     className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg"
                  >
                     Annuler
                  </button>
                  <button
                     onClick={handleDeleteList}
                     className="flex-1 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
                  >
                     Confirmer
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccess && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 max-w-sm w-full text-center border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
               <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">Liste {editingId ? 'Mise à jour' : 'Validée'} !</h3>
               <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">
                  La liste de départ <strong>{createdListCode}</strong> a été {editingId ? 'modifiée' : 'créée'} avec succès.
               </p>
               <div className="space-y-3">
                  <button
                    onClick={() => {
                       const list = departureLists.find(l => l.code === createdListCode);
                       if(list) printDepartureList(list);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                  >
                     <Printer size={18} /> Imprimer pour Chauffeur
                  </button>
                  <button
                    onClick={() => {
                       setShowSuccess(false);
                       // We don't clear form immediately to allow multiple prints if needed, or user can click "Nouveau Départ"
                       if (!editingId) {
                           setSelectedShipments([]);
                           setCheckedIds(new Set());
                       }
                    }}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg"
                  >
                     Fermer
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};
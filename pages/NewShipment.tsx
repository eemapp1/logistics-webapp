import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, CheckCircle2, X, Euro, DollarSign, Wallet, Package, 
  User, MapPin, ChevronDown, Plus, Trash2, StickyNote, Box, Save, ArrowLeft
} from 'lucide-react';
import { PaymentMethod, Shipment, Currency, PaymentStatus, Parcel } from '../types';
import { printReceipt, printLabel } from '../services/printService';
import { generateBLCode, generateClientCode } from '../services/codeGenerator';
import { useShipments } from '../contexts/ShipmentContext';

// --- Constants & Data ---
const COUNTRY_CODES = [
  { code: '+212', flag: '🇲🇦', country: 'Maroc' },
  { code: '+33', flag: '🇫🇷', country: 'France' },
  { code: '+32', flag: '🇧🇪', country: 'Belgique' },
  { code: '+34', flag: '🇪🇸', country: 'Espagne' },
  { code: '+39', flag: '🇮🇹', country: 'Italie' },
  { code: '+49', flag: '🇩🇪', country: 'Allemagne' },
  { code: '+31', flag: '🇳🇱', country: 'Pays-Bas' },
  { code: '+41', flag: '🇨🇭', country: 'Suisse' },
  { code: '+1', flag: '🇺🇸', country: 'USA' },
  { code: '+966', flag: '🇸🇦', country: 'Arabie Saoudite' },
  { code: '+971', flag: '🇦🇪', country: 'UAE' },
  { code: '+974', flag: '🇶🇦', country: 'Qatar' },
  { code: '+965', flag: '🇰🇼', country: 'Koweït' },
  { code: '+973', flag: '🇧🇭', country: 'Bahreïn' },
  { code: '+968', flag: '🇴🇲', country: 'Oman' },
];

const PARCEL_TYPES = [
  'Carton Standard',
  'Sac',
  'Valise',
  'Artisanat',
  'Déménagement',
  'Lot d\'articles',
  'Enveloppe Doc',
  'Autre'
];

// --- Reusable Styled Components ---

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; rightElement?: React.ReactNode }> = ({ title, icon, rightElement }) => (
  <div className="flex items-center justify-between mb-4 text-slate-800 dark:text-white">
    <div className="flex items-center gap-2">
      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
        {icon}
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
    {rightElement}
  </div>
);

const InputLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
    {label} {required && <span className="text-red-500">*</span>}
  </label>
);

const BaseInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props}
    className={`w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-sm disabled:bg-slate-50 disabled:text-slate-500 ${props.className}`}
  />
);

const NumberInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <BaseInput 
    {...props} 
    type="number" 
    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono" 
  />
);

const PhoneInput: React.FC<{
  codeValue: string;
  numberValue: string;
  onCodeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ codeValue, numberValue, onCodeChange, onNumberChange }) => (
  <div className="flex rounded-lg shadow-sm">
    <div className="relative">
      <select 
        value={codeValue}
        onChange={onCodeChange}
        className="h-full rounded-l-lg border-r-0 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white py-2.5 pl-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:z-10 text-sm outline-none appearance-none cursor-pointer"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
    <input
      type="tel"
      value={numberValue}
      onChange={onNumberChange}
      placeholder="6 12 34 56 78"
      className="flex-1 min-w-0 block w-full rounded-none rounded-r-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none"
    />
  </div>
);

// --- Main Component ---

export const NewShipment: React.FC = () => {
  const { addShipment, shipments, updateShipment } = useShipments();
  const { id } = useParams(); // Check if we are in Edit Mode
  const navigate = useNavigate();
  const currentYearShort = new Date().getFullYear().toString().slice(-2);
  
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState<Partial<Shipment>>({
    code: '',
    clientCode: '',
    date: new Date().toISOString().split('T')[0],
    price: 0,
    currency: Currency.MAD,
    advanceAmount: 0,
    remainingAmount: 0,
    note: '',
    paymentMethod: PaymentMethod.CASH
  });

  const [parcels, setParcels] = useState<Parcel[]>([
    { id: '1', type: 'Carton Standard', weight: 0, count: 1, description: '' }
  ]);

  // Phone States
  const [senderPhoneCode, setSenderPhoneCode] = useState('+212');
  const [senderPhoneNumber, setSenderPhoneNumber] = useState('');
  const [receiverPhoneCode, setReceiverPhoneCode] = useState('+33');
  const [receiverPhoneNumber, setReceiverPhoneNumber] = useState('');

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // --- INITIALIZATION ---

  useEffect(() => {
    if (id) {
      // EDIT MODE
      const shipmentToEdit = shipments.find(s => s.id === id);
      if (shipmentToEdit) {
        setIsEditMode(true);
        setFormData(shipmentToEdit);
        setParcels(shipmentToEdit.parcels || []);
        
        // Parse Phones
        const [sCode, ...sNum] = shipmentToEdit.senderPhone.split(' ');
        setSenderPhoneCode(sCode || '+212');
        setSenderPhoneNumber(sNum.join(' '));

        const [rCode, ...rNum] = shipmentToEdit.receiverPhone.split(' ');
        setReceiverPhoneCode(rCode || '+33');
        setReceiverPhoneNumber(rNum.join(' '));
      } else {
        alert("Bon introuvable !");
        navigate('/shipments');
      }
    } else {
      // CREATE MODE
      generateCodes();
    }
  }, [id, shipments, navigate]);

  // Sync totals
  useEffect(() => {
    const totalW = parcels.reduce((sum, p) => sum + (p.weight || 0), 0);
    const totalI = parcels.reduce((sum, p) => sum + (p.count || 1), 0);
    setFormData(prev => ({
      ...prev,
      totalWeight: totalW,
      totalItems: totalI
    }));
  }, [parcels]);

  // Sync Financials
  useEffect(() => {
    const price = formData.price || 0;
    const encaissement = formData.advanceAmount || 0;
    
    let status = PaymentStatus.UNPAID;
    if (encaissement >= price && price > 0) status = PaymentStatus.PAID;
    else if (encaissement > 0) status = PaymentStatus.PARTIAL;

    setFormData(prev => ({
      ...prev,
      remainingAmount: price - encaissement,
      paymentStatus: status
    }));
  }, [formData.price, formData.advanceAmount]);

  // --- LOGIC ---

  const generateCodes = () => {
    if (isEditMode) return; // Don't regenerate on edit
    const newBLCode = generateBLCode(shipments);
    const newClientCode = generateClientCode();
    
    setFormData(prev => ({
      ...prev,
      code: newBLCode,
      clientCode: newClientCode
    }));
  };

  // Parcel Management
  const addParcel = () => {
    const newId = (parcels.length + 1).toString();
    setParcels([...parcels, { id: newId, type: 'Carton Standard', weight: 0, count: 1, description: '' }]);
  };

  const removeParcel = (index: number) => {
    const newParcels = [...parcels];
    newParcels.splice(index, 1);
    setParcels(newParcels);
  };

  const updateParcel = (index: number, field: keyof Parcel, value: any) => {
    const newParcels = [...parcels];
    newParcels[index] = { ...newParcels[index], [field]: value };
    setParcels(newParcels);
  };

  // Main Form Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'advanceAmount'].includes(name) ? Number(value) : value
    }));
  };

  const handleValidation = (e: React.FormEvent) => {
    e.preventDefault();
    const fullSenderPhone = `${senderPhoneCode} ${senderPhoneNumber}`;
    const fullReceiverPhone = `${receiverPhoneCode} ${receiverPhoneNumber}`;
    
    const finalData: Shipment = {
      ...(formData as Shipment),
      id: isEditMode ? (formData.id as string) : Date.now().toString(),
      senderPhone: fullSenderPhone,
      receiverPhone: fullReceiverPhone,
      parcels: parcels,
      packageType: parcels[0]?.type || 'Divers',
      weight: formData.totalWeight || 0,
      itemCount: formData.totalItems || 0,
    };

    if (isEditMode) {
      updateShipment(finalData.id, finalData);
      setShowSuccessModal(true); // Show modal but slightly different context
    } else {
      addShipment(finalData);
      setShowSuccessModal(true);
    }
  };

  const resetForm = () => {
    if (isEditMode) {
        navigate('/shipments');
        return;
    }
    setShowSuccessModal(false);
    generateCodes();
    setParcels([{ id: '1', type: 'Carton Standard', weight: 0, count: 1, description: '' }]);
    setFormData(prev => ({
      ...prev,
      price: 0,
      advanceAmount: 0,
      remainingAmount: 0,
      note: '',
      senderName: '',
      senderId: '',
      receiverName: '',
      receiverAddress: '',
      zipCode: '',
      city: ''
    }));
    setSenderPhoneNumber('');
    setReceiverPhoneNumber('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            {isEditMode && (
              <button onClick={() => navigate('/shipments')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <ArrowLeft size={24} />
              </button>
            )}
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isEditMode ? 'Modifier le Bon' : 'Ajouter un Colis'}
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm ml-1">
            {isEditMode ? `Édition du bon ${formData.code}` : 'Bon de livraison multi-colis pour agence.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
              <span className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Code Bon</span>
              <span className="font-mono text-xl font-bold text-slate-800 dark:text-white tracking-wide">{formData.code}</span>
           </div>
           <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Date</span>
              <span className="font-medium text-slate-800 dark:text-white">{formData.date}</span>
           </div>
        </div>
      </div>

      <form onSubmit={handleValidation} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN - DATA ENTRY */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. EXPÉDITEUR & DESTINATAIRE */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-300 dark:border-slate-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* SENDER */}
              <div className="space-y-4">
                <SectionHeader title="Expéditeur" icon={<User size={18} />} />
                
                <div>
                  <InputLabel label="Nom Complet" required />
                  <BaseInput 
                    name="senderName" 
                    value={formData.senderName || ''} 
                    onChange={handleChange} 
                    placeholder="ex: Ahmed Alami" 
                    required 
                  />
                </div>

                <div>
                   <InputLabel label="Téléphone" required />
                   <PhoneInput 
                      codeValue={senderPhoneCode}
                      onCodeChange={(e) => setSenderPhoneCode(e.target.value)}
                      numberValue={senderPhoneNumber}
                      onNumberChange={(e) => setSenderPhoneNumber(e.target.value)}
                   />
                </div>

                <div>
                  <InputLabel label="N° Identité (CIN/Passeport)" />
                  <BaseInput 
                    name="senderId" 
                    value={formData.senderId || ''} 
                    onChange={handleChange} 
                    placeholder="AB123456" 
                  />
                </div>
              </div>

              {/* RECEIVER */}
              <div className="space-y-4">
                <SectionHeader title="Destinataire" icon={<MapPin size={18} />} />
                
                <div>
                  <InputLabel label="Nom Complet" required />
                  <BaseInput 
                    name="receiverName" 
                    value={formData.receiverName || ''} 
                    onChange={handleChange} 
                    placeholder="ex: Jean Dupont" 
                    required 
                  />
                </div>

                <div>
                   <InputLabel label="Téléphone" required />
                   <PhoneInput 
                      codeValue={receiverPhoneCode}
                      onCodeChange={(e) => setReceiverPhoneCode(e.target.value)}
                      numberValue={receiverPhoneNumber}
                      onNumberChange={(e) => setReceiverPhoneNumber(e.target.value)}
                   />
                </div>

                <div>
                   <InputLabel label="Adresse Complète" required />
                   <textarea
                     name="receiverAddress"
                     value={formData.receiverAddress || ''}
                     onChange={handleChange}
                     rows={3}
                     className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-sm resize-none"
                     placeholder="N° rue, quartier, bâtiment..."
                     required
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <InputLabel label="Code Postal" />
                     <BaseInput 
                       name="zipCode" 
                       value={formData.zipCode || ''} 
                       onChange={handleChange} 
                       placeholder="75000" 
                     />
                   </div>
                   <div>
                     <InputLabel label="Ville" required />
                     <BaseInput 
                       name="city" 
                       value={formData.city || ''} 
                       onChange={handleChange} 
                       placeholder="Paris" 
                       required 
                     />
                   </div>
                </div>
              </div>

            </div>
          </div>

          {/* 2. DÉTAILS COLIS (MULTI-PARCEL) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Box size={20} className="text-blue-600" />
                Détails Colis
              </h3>
              <button 
                type="button"
                onClick={addParcel}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-bold"
              >
                <Plus size={16} /> Ajouter un colis
              </button>
            </div>

            {parcels.map((parcel, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-300 dark:border-slate-700 p-5 relative animate-in slide-in-from-top-4 duration-300">
                {/* Remove Button */}
                {parcels.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeParcel(index)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Colis #{index + 1}</h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <InputLabel label="Type" />
                    <div className="relative">
                      <select
                        value={parcel.type}
                        onChange={(e) => updateParcel(index, 'type', e.target.value)}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 pr-8 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                      >
                        {PARCEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {parcel.type === 'Autre' && (
                     <div className="md:col-span-1">
                        <InputLabel label="Précisez" required />
                        <BaseInput 
                          value={parcel.customType || ''}
                          onChange={(e) => updateParcel(index, 'customType', e.target.value)}
                          placeholder="Type personnalisé"
                        />
                     </div>
                  )}

                  <div className={parcel.type === 'Autre' ? "md:col-span-1" : "md:col-span-1"}>
                    <InputLabel label="Poids (KG)" />
                    <NumberInput 
                      value={parcel.weight}
                      onChange={(e) => updateParcel(index, 'weight', Number(e.target.value))}
                      placeholder="0"
                      step="0.1"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <InputLabel label="Nombre d'articles" />
                    <NumberInput 
                      value={parcel.count}
                      onChange={(e) => updateParcel(index, 'count', Number(e.target.value))}
                      placeholder="1"
                    />
                  </div>
                  
                  <div className={parcel.type === 'Autre' ? "md:col-span-4" : "md:col-span-1"}>
                    <InputLabel label="Description (Optionnel)" />
                    <BaseInput 
                      value={parcel.description || ''}
                      onChange={(e) => updateParcel(index, 'description', e.target.value)}
                      placeholder="Contenu, fragile..."
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total Summary */}
            <div className="flex justify-end gap-6 px-4">
               <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Colis</span>
                  <div className="font-bold text-xl text-slate-900 dark:text-white">{formData.totalItems}</div>
               </div>
               <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Poids Total</span>
                  <div className="font-bold text-xl text-slate-900 dark:text-white">{formData.totalWeight} <span className="text-sm text-slate-400">kg</span></div>
               </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN - PAYMENT & ACTIONS */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-300 dark:border-slate-700 p-6 sticky top-24">
             <SectionHeader title="Paiement" icon={<Wallet size={18} />} />

             <div className="space-y-5">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InputLabel label="Devise" />
                    <div className="relative">
                      <select 
                        name="currency" 
                        value={formData.currency} 
                        onChange={handleChange}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                      >
                        {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                         {formData.currency === Currency.EUR ? <Euro size={14}/> : formData.currency === Currency.USD ? <DollarSign size={14}/> : 'DH'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <InputLabel label="Mode" />
                    <div className="relative">
                      <select 
                        name="paymentMethod" 
                        value={formData.paymentMethod} 
                        onChange={handleChange}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
               </div>

               <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Prix Total</span>
                    <div className="w-28 relative">
                       <NumberInput 
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          className="text-right font-bold pr-8 bg-white dark:bg-slate-900"
                       />
                       <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">{formData.currency}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Encaissement</span>
                    <div className="w-28 relative">
                       <NumberInput 
                          name="advanceAmount"
                          value={formData.advanceAmount}
                          onChange={handleChange}
                          className="text-right font-medium pr-8 bg-white dark:bg-slate-900"
                       />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">{formData.currency}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-white text-sm">Reste à payer</span>
                    <span className={`font-mono font-bold text-xl ${formData.remainingAmount! > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formData.remainingAmount?.toFixed(2)} {formData.currency}
                    </span>
                  </div>
               </div>

               <div>
                 <InputLabel label="Remarque / Note Interne" />
                 <div className="relative">
                    <textarea 
                      name="note"
                      value={formData.note || ''}
                      onChange={handleChange}
                      rows={2}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 pl-9 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm resize-none"
                      placeholder="Info fragile, instructions..."
                    />
                    <StickyNote size={14} className="absolute left-3 top-3 text-slate-400" />
                 </div>
               </div>

               <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
               >
                  {isEditMode ? <Save size={20} /> : <CheckCircle2 size={20} />}
                  {isEditMode ? 'Enregistrer les modifications' : 'Valider le Bon'}
               </button>

             </div>
          </div>
        </div>

      </form>

      {/* SUCCESS & PRINT MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
              
              <div className="p-8 text-center">
                 <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
                    <CheckCircle2 size={32} />
                 </div>
                 <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {isEditMode ? 'Modifications Enregistrées' : 'Bon Validé !'}
                 </h3>
                 <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Le colis <strong>{formData.code}</strong> a été {isEditMode ? 'mis à jour' : 'enregistré'} avec succès. Que souhaitez-vous imprimer ?
                 </p>

                 <div className="space-y-3">
                    <button 
                      onClick={() => printReceipt(formData as Shipment, 'CLIENT')}
                      className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between group transition-all"
                    >
                       <div className="flex items-center gap-3">
                          <Printer size={18} className="text-slate-500 group-hover:text-blue-500" />
                          <span className="font-medium text-slate-700 dark:text-slate-200">Ticket Client</span>
                       </div>
                       <span className="text-xs font-bold bg-slate-200 dark:bg-slate-900 px-2 py-1 rounded text-slate-600 dark:text-slate-400">80mm</span>
                    </button>

                    <button 
                      onClick={() => printReceipt(formData as Shipment, 'MERCHANT')}
                      className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between group transition-all"
                    >
                       <div className="flex items-center gap-3">
                          <Printer size={18} className="text-slate-500 group-hover:text-blue-500" />
                          <span className="font-medium text-slate-700 dark:text-slate-200">Ticket Agence</span>
                       </div>
                       <span className="text-xs font-bold bg-slate-200 dark:bg-slate-900 px-2 py-1 rounded text-slate-600 dark:text-slate-400">80mm</span>
                    </button>

                    <button 
                      onClick={() => printLabel(formData as Shipment)}
                      className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between group transition-all"
                    >
                       <div className="flex items-center gap-3">
                          <Package size={18} className="text-slate-500 group-hover:text-purple-500" />
                          <span className="font-medium text-slate-700 dark:text-slate-200">Étiquette Colis</span>
                       </div>
                       <span className="text-xs font-bold bg-slate-200 dark:bg-slate-900 px-2 py-1 rounded text-slate-600 dark:text-slate-400">Sticker</span>
                    </button>
                 </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                 <button 
                    onClick={resetForm}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all"
                 >
                    {isEditMode ? 'Retour à la liste' : 'Nouveau Colis'}
                 </button>
              </div>

           </div>
        </div>
      )}
    </div>
  );
};
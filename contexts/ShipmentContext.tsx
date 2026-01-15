import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { Transaction, DepartureList } from '../types';

// Types TypeScript pour Shipment et Client
export interface Shipment {
  id?: string;
  code: string;
  clientCode: string;
  senderName: string;
  senderPhone: string;
  senderId?: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  zipCode?: string;
  city: string;
  parcels: any[];
  totalWeight: number;
  totalItems: number;
  price: number;
  currency: string;
  advanceAmount?: number;
  remainingAmount?: number;
  paymentMethod: string;
  paymentStatus: string;
  note?: string;
  date?: string;
}

export interface Client {
  id?: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  created_at?: string;
}

// Context
interface ShipmentContextType {
  shipments: Shipment[];
  clients: Client[];
  expenses: Transaction[];
  departureLists: DepartureList[];
  fetchShipments: () => void;
  fetchClients: () => void;
  fetchExpenses: () => void;
  fetchDepartureLists: () => void;
  addShipment: (shipment: Shipment) => void;
  addClient: (client: Client) => void;
  addExpense: (expense: Transaction) => void;
  addDepartureList: (list: DepartureList) => Promise<DepartureList>;
  updateDepartureList: (id: string, list: DepartureList) => Promise<DepartureList>;
  deleteDepartureList: (id: string) => Promise<void>;
  deleteExpense: (id: string) => void;
  deleteShipment: (id: string) => void;
}

const ShipmentContext = createContext<ShipmentContextType | undefined>(undefined);

export const ShipmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [departureLists, setDepartureLists] = useState<DepartureList[]>([]);

  // ---------- FETCH SHIPMENTS ----------
  const fetchShipments = async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement colis:', error);
    } else {
      const formattedData: Shipment[] = data.map((item: any) => ({
        id: item.id,
        code: item.code,
        clientCode: item.client_code,
        senderName: item.sender_name,
        senderPhone: item.sender_phone,
        senderId: item.sender_id,
        receiverName: item.receiver_name,
        receiverPhone: item.receiver_phone,
        receiverAddress: item.receiver_address,
        zipCode: item.zip_code,
        city: item.city,
        parcels: item.parcels,
        totalWeight: item.total_weight,
        totalItems: item.total_items,
        price: item.price,
        currency: item.currency,
        advanceAmount: item.advance_amount,
        remainingAmount: item.remaining_amount,
        paymentMethod: item.payment_method,
        paymentStatus: item.payment_status,
        note: item.note,
        date: item.date
      }));
      setShipments(formattedData);
    }
  };

  // ---------- FETCH CLIENTS ----------
  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement clients:', error);
    } else {
      setClients(data);
    }
  };

  // ---------- FETCH EXPENSES ----------
  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'Dépense')
      .order('date', { ascending: false });

    if (error) {
      console.error('Erreur chargement dépenses:', error);
    } else {
      setExpenses(data);
    }
  };

  // ---------- FETCH DEPARTURE LISTS ----------
  const fetchDepartureLists = async () => {
    const { data, error } = await supabase
      .from('departure_lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement listes départ:', error);
    } else {
      setDepartureLists(data);
    }
  };

  // ---------- ADD SHIPMENT ----------
  const addShipment = async (shipment: Shipment) => {
    const dbShipment: any = {
      code: shipment.code,
      client_code: shipment.clientCode,
      sender_name: shipment.senderName,
      sender_phone: shipment.senderPhone,
      sender_id: shipment.senderId,
      receiver_name: shipment.receiverName,
      receiver_phone: shipment.receiverPhone,
      receiver_address: shipment.receiverAddress,
      zip_code: shipment.zipCode,
      city: shipment.city,
      parcels: shipment.parcels,
      total_weight: shipment.totalWeight,
      total_items: shipment.totalItems,
      price: shipment.price,
      currency: shipment.currency,
      advance_amount: shipment.advanceAmount,
      remaining_amount: shipment.remainingAmount,
      payment_method: shipment.paymentMethod,
      payment_status: shipment.paymentStatus,
      note: shipment.note
    };

    if (shipment.date) {
      dbShipment.date = shipment.date;
    }

    console.log('Inserting shipment:', dbShipment);

    const { data, error } = await supabase.from('shipments').insert([dbShipment]).select();
    if (error) {
      console.error("Erreur d'ajout colis:", error);
      alert("Erreur lors de la sauvegarde du colis !");
    } else {
      const newShipment = { ...shipment, id: data[0].id };
      setShipments(prev => [newShipment, ...prev]);
    }
  };

  // ---------- ADD CLIENT ----------
  const addClient = async (client: Client) => {
    const { id, created_at, ...clientData } = client;
    const dbClient = {
      code: clientData.code,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
    };
    const { data, error } = await supabase.from('clients').insert([dbClient]).select();
    if (error) {
      console.error("Erreur ajout client:", error);
      alert("Erreur lors de la sauvegarde du client !");
    } else {
      setClients(prev => [data[0], ...prev]);
    }
  };

  // ---------- ADD DEPARTURE LIST ----------
  const addDepartureList = async (list: DepartureList) => {
    const { id, ...listData } = list;
    const dbList = {
      code: listData.code,
      date: listData.date,
      driver_name: listData.driverName,
      driver_phone: listData.driverPhone,
      destination: listData.destination,
      shipments: listData.shipments,
      discount_percentage: listData.discountPercentage,
      total_driver_mad: listData.totalDriverMAD,
      total_driver_eur: listData.totalDriverEUR,
      total_client_price: listData.totalClientPrice,
      item_count: listData.itemCount,
      status: listData.status
    };
    const { data, error } = await supabase.from('departure_lists').insert([dbList]).select();
    if (error) {
      console.error("Erreur ajout liste départ:", error);
      throw error; // Throw to let caller handle
    } else {
      setDepartureLists(prev => [data[0], ...prev]);
      return data[0];
    }
  };

  // ---------- ADD EXPENSE ----------
  const addExpense = async (expense: Transaction) => {
    const { id, ...expenseData } = expense;
    const { data, error } = await supabase.from('transactions').insert([expenseData]).select();
    if (error) {
      console.error("Erreur ajout dépense:", error);
      alert("Erreur lors de l'ajout de la dépense !");
    } else {
      setExpenses(prev => [data[0], ...prev]);
    }
  };

  // ---------- DELETE EXPENSE ----------
  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.error("Erreur suppression dépense:", error);
      alert("Erreur lors de la suppression de la dépense !");
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  // ---------- DELETE SHIPMENT ----------
  const deleteShipment = async (id: string) => {
    const { error } = await supabase.from('shipments').delete().eq('id', id);
    if (error) {
      console.error("Erreur suppression colis:", error);
      alert("Erreur lors de la suppression du colis !");
    } else {
      setShipments(prev => prev.filter(s => s.id !== id));
    }
  };

  // ---------- UPDATE DEPARTURE LIST ----------
  const updateDepartureList = async (id: string, list: DepartureList) => {
    const { id: _, ...listData } = list;
    const dbList = {
      code: listData.code,
      date: listData.date,
      driver_name: listData.driverName,
      driver_phone: listData.driverPhone,
      destination: listData.destination,
      shipments: listData.shipments,
      discount_percentage: listData.discountPercentage,
      total_driver_mad: listData.totalDriverMAD,
      total_driver_eur: listData.totalDriverEUR,
      total_client_price: listData.totalClientPrice,
      item_count: listData.itemCount,
      status: listData.status
    };
    const { data, error } = await supabase.from('departure_lists').update(dbList).eq('id', id).select();
    if (error) {
      console.error("Erreur mise à jour liste départ:", error);
      throw error;
    } else {
      setDepartureLists(prev => prev.map(l => l.id === id ? data[0] : l));
      return data[0];
    }
  };

  // ---------- DELETE DEPARTURE LIST ----------
  const deleteDepartureList = async (id: string) => {
    const { error } = await supabase.from('departure_lists').delete().eq('id', id);
    if (error) {
      console.error("Erreur suppression liste départ:", error);
      throw error;
    } else {
      setDepartureLists(prev => prev.filter(l => l.id !== id));
    }
  };

  // ---------- USE EFFECT pour fetch initial ----------
  useEffect(() => {
    fetchShipments();
    fetchClients();
    fetchExpenses();
    fetchDepartureLists();
  }, []);

  return (
    <ShipmentContext.Provider value={{ shipments, clients, expenses, departureLists, fetchShipments, fetchClients, fetchExpenses, fetchDepartureLists, addShipment, addClient, addExpense, addDepartureList, updateDepartureList, deleteDepartureList, deleteExpense, deleteShipment }}>
      {children}
    </ShipmentContext.Provider>
  );
};

// Hook pour utiliser le context
export const useShipments = () => {
  const context = useContext(ShipmentContext);
  if (!context) throw new Error('useShipments doit être utilisé dans ShipmentProvider');
  return context;
};

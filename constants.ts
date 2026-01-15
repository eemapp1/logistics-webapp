import { Shipment, PaymentMethod, Transaction, TransactionType, Currency, PaymentStatus } from './types';

// Mock Shipments
export const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: '1',
    code: 'BL-24-1001',
    clientCode: 'EEM001',
    senderName: 'Jean Dupont',
    senderPhone: '+212 612345678',
    senderId: 'AB123456',
    
    receiverName: 'Marie Curie',
    receiverPhone: '+33 787654321',
    receiverAddress: '12 Rue de la Paix',
    zipCode: '75001',
    city: 'Paris',
    
    parcels: [
      { id: 'p1', type: 'Carton Standard', weight: 15.5, count: 2, description: 'Vêtements' }
    ],
    totalWeight: 15.5,
    totalItems: 2,
    packageType: 'Carton Standard', // Legacy display
    weight: 15.5, // Legacy display
    itemCount: 2, // Legacy display

    price: 45.00,
    currency: Currency.MAD,
    advanceAmount: 45.00,
    remainingAmount: 0,
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.CASH,
    date: '2023-10-25',
  },
  {
    id: '2',
    code: 'BL-24-1002',
    clientCode: 'EEM002',
    senderName: 'Ahmed Benali',
    senderPhone: '+212 699887766',
    senderId: 'XY987654',
    
    receiverName: 'Sophie Martin',
    receiverPhone: '+33 611223344',
    receiverAddress: '45 Avenue Jean Jaurès',
    zipCode: '69007',
    city: 'Lyon',
    
    parcels: [
       { id: 'p2', type: 'Valise', weight: 23.0, count: 1, description: 'Effets personnels' }
    ],
    totalWeight: 23.0,
    totalItems: 1,
    packageType: 'Valise',
    weight: 23.0,
    itemCount: 1,

    price: 60.00,
    currency: Currency.EUR,
    advanceAmount: 60.00,
    remainingAmount: 0,
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.CASH,
    date: '2023-10-26',
  },
  {
    id: '3',
    code: 'BL-24-1003',
    clientCode: 'EEM003',
    senderName: 'Lucie Bernard',
    senderPhone: '+212 655443322',
    senderId: 'CD456789',
    
    receiverName: 'Entrepôt Central',
    receiverPhone: '+33 499887766',
    receiverAddress: 'Zone Industrielle Nord',
    zipCode: '13015',
    city: 'Marseille',
    
    parcels: [
       { id: 'p3', type: 'Palette', weight: 120.0, count: 1, description: 'Marchandise' }
    ],
    totalWeight: 120.0,
    totalItems: 1,
    packageType: 'Palette',
    weight: 120.0,
    itemCount: 1,

    price: 150.00,
    currency: Currency.MAD,
    advanceAmount: 50.00,
    remainingAmount: 100.00,
    paymentStatus: PaymentStatus.PARTIAL,
    paymentMethod: PaymentMethod.BANK,
    date: '2023-10-26',
  }
];

// Mock Transactions
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    date: '2023-10-25',
    code: 'BL-24-1001',
    clientName: 'Jean Dupont',
    description: 'Expédition Colis Standard',
    amount: 45.00,
    type: TransactionType.INCOME,
  },
  {
    id: 't2',
    date: '2023-10-26',
    code: 'BL-24-1002',
    clientName: 'Ahmed Benali',
    description: 'Expédition Valise',
    amount: 60.00,
    type: TransactionType.INCOME,
  },
  {
    id: 't3',
    date: '2023-10-26',
    description: 'Achat fournitures bureau',
    amount: 25.50,
    type: TransactionType.EXPENSE,
    reason: 'Fournitures',
  },
  {
    id: 't4',
    date: '2023-10-27',
    description: 'Carburant Camion 1',
    amount: 80.00,
    type: TransactionType.EXPENSE,
    reason: 'Carburant',
  }
];

export const CHART_DATA = [
  { name: 'Jan', entrees: 4000, depenses: 2400 },
  { name: 'Fév', entrees: 3000, depenses: 1398 },
  { name: 'Mar', entrees: 2000, depenses: 9800 },
  { name: 'Avr', entrees: 2780, depenses: 3908 },
  { name: 'Mai', entrees: 1890, depenses: 4800 },
  { name: 'Juin', entrees: 2390, depenses: 3800 },
  { name: 'Juil', entrees: 3490, depenses: 4300 },
];
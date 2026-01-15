
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  VIEWER = 'viewer'
}

export enum PaymentMethod {
  CASH = 'Espèces',
  BANK = 'Banque',
  CHECK = 'Chèque',
  ON_DELIVERY = 'À la livraison'
}

export enum Currency {
  MAD = 'MAD',
  EUR = 'EUR',
  USD = 'USD'
}

export enum PaymentStatus {
  PAID = 'Payé',
  PARTIAL = 'Avance',
  UNPAID = 'Non Payé'
}

export enum TransactionType {
  INCOME = 'Entrée',
  EXPENSE = 'Dépense'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  agency: string;
  name: string;
}

export interface Parcel {
  id: string;
  type: string;
  customType?: string; // If 'Autre' is selected
  weight: number;
  count: number;
  description?: string;
}

export interface Shipment {
  id: string;
  code: string; // Format: BL-YY-XXXX
  clientCode: string;
  senderName: string;
  senderPhone: string;
  senderId: string;
  
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  zipCode: string;
  city: string;
  
  // Parcel Details
  parcels: Parcel[];
  totalWeight: number; // Calculated sum
  totalItems: number; // Calculated sum
  
  // Legacy fields for backward compatibility if needed (can be derived)
  packageType?: string; 
  weight?: number;
  itemCount?: number;

  // Financials
  price: number; // Total Price
  currency: Currency;
  advanceAmount: number; // Amount paid upfront (Encaissement)
  remainingAmount: number; // Calculated
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  
  note?: string;
  date: string;
}

export interface Transaction {
  id: string;
  date: string;
  code?: string; // Linked shipment code
  clientName?: string;
  description: string;
  amount: number;
  currency?: Currency;
  type: TransactionType;
  reason?: string; // For expenses
}

export interface FinancialStats {
  cashBalance: number;
  bankBalance: number;
  euroBalance: number;
  totalExpenses: number;
}

export interface DepartureList {
  id: string;
  code: string; // Format: DEP-YYYYMMDD-XXX
  date: string;
  driverName: string;
  driverPhone?: string;
  destination: string;
  
  shipments: Shipment[]; // Only the selected shipments
  
  discountPercentage: number; // The commission/discount applied
  
  // Totals
  totalDriverMAD: number; // Net to collect in MAD
  totalDriverEUR: number; // Net to collect in EUR
  totalClientPrice?: number; // Approximate mixed sum for sorting/internal
  
  itemCount: number; // Total parcels
  status: 'VALIDATED' | 'DRAFT';
}
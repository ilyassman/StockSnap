export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'seller';
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  barcode?: string;
  sku: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  category: string;
  imageUrl: string | null; // Soit une string, soit null, mais plus undefined
  createdAt: number; // timestamp en millisecondes
  updatedAt: number; // timestamp en millisecondes
  createdBy: string;
}


export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
export interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export interface Sale {
  id: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  customerId?: string;
  customerName?: string;
  sellerId: string;
  createdAt: number;
  receiptUrl?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  type: 'in' | 'out' | 'adjustment';
  reason: string;
  performedBy: string;
  createdAt: number;
}

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  '/(tabs)/sales': undefined;
  '/(tabs)/sales/[id]': { id: string };
  '/(tabs)/products/[id]': { id: string };
  '/(tabs)/customers/[id]': { id: string };
  '/(tabs)/modal': undefined;
};
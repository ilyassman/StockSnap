import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, updateDoc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User, Product, Customer, Sale, StockMovement } from '../types';
import { cld } from './cloudinary';
import * as FileSystem from 'expo-file-system';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Auth functions
export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
  
  if (!userDoc.exists()) {
    throw new Error('User document not found');
  }
  
  return {
    user: userCredential.user,
    role: userDoc.data().role
  };
};

export const registerUser = async (email: string, password: string, displayName: string, role: 'admin' | 'seller') => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Create user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    email,
    displayName,
    role,
    createdAt: Timestamp.now().toMillis(),
  });
  
  return userCredential;
};

export const logoutUser = () => {
  return signOut(auth);
};

export const getCurrentUser = async (): Promise<User | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) return null;
  
  return {
    id: user.uid,
    email: userDoc.data().email,
    displayName: userDoc.data().displayName,
    role: userDoc.data().role,
    createdAt: userDoc.data().createdAt,
  };
};

export const getUserRole = async (uid: string): Promise<string | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return userDoc.data().role;
};

// Product functions

export const uploadProductImage = async (uri: string): Promise<string> => {
  try {
    // Conversion en base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload vers Cloudinary
    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${base64}`);
    formData.append('upload_preset', 'products'); // Votre preset

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/ddp1u2upz/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    return data.secure_url; // Retourne l'URL Cloudinary
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw new Error("Échec de l'upload vers Cloudinary");
  }
};

export const getProducts = async (): Promise<Product[]> => {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, orderBy('name'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Product));
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const docRef = doc(db, 'products', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Product;
};

export const getProductByBarcode = async (
  barcode: string
): Promise<Product | null> => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('barcode', '==', barcode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Product;
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return null;
  }
};



export const addProduct = async (
  productData: Omit<Product, 'id'>,
  imageUri?: string
): Promise<Product> => {
  // 1. Upload vers Cloudinary si image existe
  const imageUrl = imageUri ? await uploadProductImage(imageUri) : null;

  // 2. Préparation des données pour Firebase
  const productToAdd = {
    ...productData,
    imageUrl, // URL Cloudinary ou null
    createdAt: Timestamp.now().toMillis(),
    updatedAt: Timestamp.now().toMillis(),
  };

  // 3. Vérification finale
  const finalData = {
    ...productToAdd,
    imageUrl: productToAdd.imageUrl || null, // Garantit null si undefined
  };

  const docRef = await addDoc(collection(db, 'products'), finalData);

  return { id: docRef.id, ...finalData };
};


export const updateProduct = async (id: string, product: Partial<Product>, imageUri?: string): Promise<void> => {
  const productRef = doc(db, 'products', id);
  
  // Upload new image if provided
  let imageUrl;
  if (imageUri) {
    imageUrl = await uploadProductImage(imageUri);
    product.imageUrl = imageUrl;
  }
  
  await updateDoc(productRef, {
    ...product,
    updatedAt: Timestamp.now().toMillis(),
  });
};

export const deleteProduct = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'products', id));
};

// const uploadProductImage = async (uri: string): Promise<string> => {
//   const response = await fetch(uri);
//   const blob = await response.blob();
  
//   const filename = `products/${Date.now()}`;
//   const storageRef = ref(storage, filename);
  
//   await uploadBytes(storageRef, blob);
//   return getDownloadURL(storageRef);
// };


// Vérifie si un code-barres existe déjà
export const checkBarcodeExists = async (barcode: string): Promise<boolean> => {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('barcode', '==', barcode));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

// Lie un produit à son code-barres avec vérification
export const linkProductToBarcode = async (productId: string, barcode: string): Promise<void> => {
  try {
    const exists = await checkBarcodeExists(barcode);
    if (exists) {
      throw new Error('Ce code-barres est déjà utilisé');
    }

    await updateDoc(doc(db, 'products', productId), {
      barcode,
      updatedAt: Timestamp.now().toMillis()
    });

    // Optionnel : enregistrement dans une collection dédiée
    await setDoc(doc(db, 'barcodeIndex', barcode), {
      productId,
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error("Erreur liaison:", error);
    throw error;
  }
};

// Customer functions
export const getCustomers = async (): Promise<Customer[]> => {
  const customersRef = collection(db, 'customers');
  const q = query(customersRef, orderBy('name'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Customer));
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const docRef = doc(db, 'customers', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Customer;
};

export const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
  const customerData = {
    ...customer,
    createdAt: Timestamp.now().toMillis(),
    updatedAt: Timestamp.now().toMillis(),
  };
  
  const docRef = await addDoc(collection(db, 'customers'), customerData);
  
  return {
    id: docRef.id,
    ...customerData,
  } as Customer;
};

// Sales functions
export const addSale = async (sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> => {
  const saleData = {
    ...sale,
    createdAt: Timestamp.now().toMillis(),
  };
  
  const docRef = await addDoc(collection(db, 'sales'), saleData);
  
  // Update stock for each product
  for (const item of sale.items) {
    const productRef = doc(db, 'products', item.productId);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.exists()) {
      const currentStock = productDoc.data().stockQuantity;
      await updateDoc(productRef, {
        stockQuantity: currentStock - item.quantity,
        updatedAt: Timestamp.now().toMillis(),
      });
      
      // Add stock movement record
      await addStockMovement({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        type: 'out',
        reason: `Sale (${docRef.id})`,
        performedBy: sale.sellerId,
      });
    }
  }
  
  return {
    id: docRef.id,
    ...saleData,
  } as Sale;
};

export const getSales = async (): Promise<Sale[]> => {
  const salesRef = collection(db, 'sales');
  const q = query(salesRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Sale));
};

export const getSaleById = async (id: string): Promise<Sale | null> => {
  const docRef = doc(db, 'sales', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Sale;
};

// Stock movement functions
export const addStockMovement = async (movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> => {
  const movementData = {
    ...movement,
    createdAt: Timestamp.now().toMillis(),
  };
  
  const docRef = await addDoc(collection(db, 'stockMovements'), movementData);
  
  // Update product stock
  if (movement.type !== 'out') {
    const productRef = doc(db, 'products', movement.productId);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.exists()) {
      const currentStock = productDoc.data().stockQuantity;
      const newStock = movement.type === 'in' 
        ? currentStock + movement.quantity
        : movement.quantity; // For adjustment type
      
      await updateDoc(productRef, {
        stockQuantity: newStock,
        updatedAt: Timestamp.now().toMillis(),
      });
    }
  }
  
  return {
    id: docRef.id,
    ...movementData,
  } as StockMovement;
};

export const getStockMovements = async (productId?: string): Promise<StockMovement[]> => {
  const movementsRef = collection(db, 'stockMovements');
  let q;
  
  if (productId) {
    q = query(movementsRef, where('productId', '==', productId), orderBy('createdAt', 'desc'));
  } else {
    q = query(movementsRef, orderBy('createdAt', 'desc'));
  }
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as StockMovement));
};

// Dashboard data
export const getLowStockProducts = async (limit_count: number = 10): Promise<Product[]> => {
  const productsRef = collection(db, 'products');
  const q = query(
    productsRef,
    where('stockQuantity', '<', 10), // You can customize this threshold
    orderBy('stockQuantity'),
    limit(limit_count)
  );
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Product));
};

export const getTopSellingProducts = async (limit_count: number = 5): Promise<{ productId: string; productName: string; count: number }[]> => {
  const salesRef = collection(db, 'sales');
  const salesQuery = query(salesRef, orderBy('createdAt', 'desc'), limit(100)); // Get recent sales
  const salesSnapshot = await getDocs(salesQuery);
  
  const productCounts: Record<string, { productId: string; productName: string; count: number }> = {};
  
  salesSnapshot.docs.forEach(doc => {
    const sale = doc.data() as Sale;
    sale.items.forEach(item => {
      if (!productCounts[item.productId]) {
        productCounts[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          count: 0,
        };
      }
      productCounts[item.productId].count += item.quantity;
    });
  });
  
  return Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit_count);
};

export const getSalesStats = async (days: number = 7): Promise<{ date: string; total: number }[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startTimestamp = startDate.getTime();
  
  const salesRef = collection(db, 'sales');
  const q = query(
    salesRef,
    where('createdAt', '>=', startTimestamp),
    orderBy('createdAt', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  
  const salesByDate: Record<string, number> = {};
  
  // Initialize all dates
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    salesByDate[dateStr] = 0;
  }
  
  // Populate with actual data
  querySnapshot.docs.forEach(doc => {
    const sale = doc.data() as Sale;
    const date = new Date(sale.createdAt);
    const dateStr = date.toISOString().split('T')[0];
    salesByDate[dateStr] = (salesByDate[dateStr] || 0) + sale.total;
  });
  
  return Object.entries(salesByDate).map(([date, total]) => ({ date, total }));
};
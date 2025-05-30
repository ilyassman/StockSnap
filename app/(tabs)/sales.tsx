import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { getSales, getProductByBarcode, addSale } from '../../lib/firebase';
import { Sale, Product } from '../../types';
import { SaleCard } from '../../components/SaleCard';
import { Button } from '../../components/Button';
import { Scanner } from '../../components/Scanner';
import { CheckCircle, Plus, Filter } from 'lucide-react-native';

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export default function SalesScreen() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [currentItems, setCurrentItems] = useState<CartItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  // Calcul des totaux
  const { subtotal, tax, total } = useMemo(() => {
    const subtotal = currentItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [currentItems]);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const salesData = await getSales();
      setSales(salesData);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (barcode: string) => {
    try {
      const product = await getProductByBarcode(barcode);
      
      if (!product) {
        Alert.alert('Produit non trouvé', 'Ce code-barres n\'est pas enregistré');
        return;
      }
      
      if (product.stockQuantity < 1) {
        Alert.alert('Stock épuisé', 'Ce produit n\'est plus disponible');
        return;
      }

      setCurrentItems(prev => {
        const existing = prev.find(item => item.product.id === product.id);
        if (existing) {
          return prev.map(item => 
            item.product.id === product.id 
              ? { 
                ...item, 
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.product.price
              } 
              : item
          );
        }
        return [...prev, { 
          product, 
          quantity: 1, 
          total: product.price 
        }];
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer le produit');
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setCurrentItems(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.product.price
          };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const handleValidateSale = async () => {
    try {
      const saleData = {
        items: currentItems.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          total: item.total
        })),
        subtotal,
        discount: 0,
        tax,
        total,
        paymentMethod: 'cash' as const,
        sellerId: 'current-user-id',
        createdAt: Date.now(),
      };

      await addSale(saleData);
      setCurrentItems([]);
      await loadSales();
      Alert.alert('Succès', 'Vente enregistrée avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Échec de l\'enregistrement de la vente');
    }
  };
const handleSalePress = (saleId: string) => {
  (router as any).push(`/(tabs)/sales/${saleId}`);
};
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ventes</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowScanner(true)}
          >
            <Plus size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ${sales.reduce((total, sale) => total + sale.total, 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Ventes totales</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{sales.length}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </View>

      {currentItems.length > 0 ? (
        <FlatList
          data={currentItems}
          keyExtractor={(item) => item.product.id}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  onPress={() => handleQuantityChange(item.product.id, -1)}
                  style={styles.quantityButton}
                >
                  <Text style={styles.quantityText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity 
                  onPress={() => handleQuantityChange(item.product.id, 1)}
                  style={styles.quantityButton}
                >
                  <Text style={styles.quantityText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemPrice}>${item.total.toFixed(2)}</Text>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.totalSection}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Sous-total:</Text>
                <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Taxe (10%):</Text>
                <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={[styles.totalValue, styles.grandTotal]}>
                  ${total.toFixed(2)}
                </Text>
              </View>
              <Button
                title="Valider la commande"
                icon={<CheckCircle size={20} color={Colors.white} />}
                onPress={handleValidateSale}
                style={styles.validateButton}
              />
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SaleCard 
              sale={item} 
              onPress={() => handleSalePress(item.id)} 
            />
          )}
          contentContainerStyle={styles.salesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading 
                  ? 'Chargement des ventes...' 
                  : 'Aucune vente enregistrée. Scannez votre premier produit!'}
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={showScanner} animationType="slide">
        <Scanner 
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      </Modal>

      {currentItems.length === 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setShowScanner(true)}
        >
          <Plus size={24} color={Colors.white} />
        </TouchableOpacity>
      )}

      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrer les ventes</Text>
            
            <View style={styles.filterOptions}>
              <Text style={styles.filterLabel}>Période</Text>
              <View style={styles.dateRangeButtons}>
                <TouchableOpacity style={[styles.dateButton, styles.dateButtonSelected]}>
                  <Text style={styles.dateButtonTextSelected}>Aujourd'hui</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>Cette semaine</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>Ce mois</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>Personnalisée</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.filterLabel}>Méthode de paiement</Text>
              <View style={styles.paymentMethodButtons}>
                <TouchableOpacity style={styles.paymentMethodButton}>
                  <Text style={styles.paymentMethodText}>Espèces</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.paymentMethodButton}>
                  <Text style={styles.paymentMethodText}>Carte</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.paymentMethodButton}>
                  <Text style={styles.paymentMethodText}>Virement</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <Button 
                title="Réinitialiser" 
                variant="outline" 
                onPress={() => {}}
                style={{ flex: 1, marginRight: 10 }}
              />
              <Button 
                title="Appliquer" 
                onPress={() => setFilterModalVisible(false)}
                style={{ flex: 1 }}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    backgroundColor: Colors.primary[500],
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.white,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    width: '48%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: Colors.neutral[900],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[500],
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  quantityButton: {
    backgroundColor: Colors.primary[100],
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    color: Colors.primary[600],
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  itemName: {
    flex: 2,
    marginRight: Layout.spacing.md,
    fontSize: 16,
    color: Colors.neutral[800],
  },
  itemPrice: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  totalSection: {
    backgroundColor: Colors.white,
    padding: Layout.spacing.lg,
    marginTop: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    color: Colors.neutral[600],
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  grandTotal: {
    fontSize: 18,
    color: Colors.primary[600],
    fontWeight: '700',
  },
  validateButton: {
    marginTop: Layout.spacing.md,
  },
  salesList: {
    padding: 20,
    paddingBottom: 80,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.neutral[900],
    marginBottom: 20,
    textAlign: 'center',
  },
  filterOptions: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.neutral[800],
    marginBottom: 10,
  },
  dateRangeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: Layout.borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  dateButtonSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  dateButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[700],
  },
  dateButtonTextSelected: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
  paymentMethodButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  paymentMethodButton: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: Layout.borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[700],
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  closeButton: {
    alignItems: 'center',
    padding: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[600],
  },
});
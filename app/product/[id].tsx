import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal, 
  TextInput,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { getProductById, updateProduct, deleteProduct, addStockMovement, getCurrentUser } from '../../lib/firebase';
import { Product, User } from '../../types';
import { Button } from '../../components/Button';
import { ArrowLeft, Edit, Trash, Camera, Package, Tag, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react-native';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockAction, setStockAction] = useState<'in' | 'out'>('in');
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockReason, setStockReason] = useState('');
  
  useEffect(() => {
    loadData();
  }, [id]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      if (id) {
        const productData = await getProductById(id as string);
        setProduct(productData);
      }
      
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = () => {
    if (!product?.id) {
      Alert.alert('Erreur', 'Produit non chargé');
      return;
    }
    router.push(`/product/edit/${product.id}`);
  };
  
  
  const handleDelete = async () => {
    try {
      if (!product) return;
      
      await deleteProduct(product.id);
      Alert.alert('Success', 'Product deleted successfully');
      router.back();
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', 'Failed to delete product');
    }
  };
  
  const confirmDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: handleDelete, style: 'destructive' }
      ]
    );
  };
  
  const showAddStockModal = (action: 'in' | 'out') => {
    setStockAction(action);
    setStockQuantity('');
    setStockReason('');
    setStockModalVisible(true);
  };
  
  const handleUpdateStock = async () => {
    try {
      if (!product || !user) return;
      
      const quantity = parseInt(stockQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        Alert.alert('Error', 'Please enter a valid quantity');
        return;
      }
      
      if (!stockReason.trim()) {
        Alert.alert('Error', 'Please enter a reason');
        return;
      }
      
      if (stockAction === 'out' && quantity > product.stockQuantity) {
        Alert.alert('Error', 'Cannot remove more than current stock');
        return;
      }
      
      await addStockMovement({
        productId: product.id,
        productName: product.name,
        quantity,
        type: stockAction,
        reason: stockReason,
        performedBy: user.id,
      });
      
      setStockModalVisible(false);
      Alert.alert('Success', 'Stock updated successfully');
      loadData(); // Reload product data
    } catch (error) {
      console.error('Error updating stock:', error);
      Alert.alert('Error', 'Failed to update stock');
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }
  
  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }
  
  const isLowStock = product.stockQuantity <= product.lowStockThreshold;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={handleEdit}
          >
            <Edit size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={confirmDelete}
          >
            <Trash size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.imageSection}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Package size={60} color={Colors.neutral[400]} />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SKU:</Text>
            <Text style={styles.infoValue}>{product.sku}</Text>
          </View>
          
          {product.barcode && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Barcode:</Text>
              <Text style={styles.infoValue}>{product.barcode}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category:</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {product.category || 'Uncategorized'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          
          <View style={styles.pricingRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Selling Price</Text>
              <Text style={styles.priceValue}>${product.price.toFixed(2)}</Text>
            </View>
            
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Cost Price</Text>
              <Text style={styles.costValue}>${product.costPrice.toFixed(2)}</Text>
            </View>
            
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Profit</Text>
              <Text style={styles.profitValue}>
                ${(product.price - product.costPrice).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventory</Text>
            
            <View style={styles.stockActions}>
              <TouchableOpacity
                style={styles.stockAction}
                onPress={() => showAddStockModal('in')}
              >
                <ArrowUp size={16} color={Colors.success[500]} />
                <Text style={[styles.stockActionText, { color: Colors.success[500] }]}>
                  Add
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.stockAction}
                onPress={() => showAddStockModal('out')}
              >
                <ArrowDown size={16} color={Colors.error[500]} />
                <Text style={[styles.stockActionText, { color: Colors.error[500] }]}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>Current Stock</Text>
            <View style={styles.stockContent}>
              <Text style={[
                styles.stockValue,
                { color: isLowStock ? Colors.error[500] : Colors.neutral[900] }
              ]}>
                {product.stockQuantity} units
              </Text>
              
              {isLowStock && (
                <View style={styles.lowStockWarning}>
                  <AlertTriangle size={14} color={Colors.warning[500]} />
                  <Text style={styles.lowStockText}>Low Stock</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>Low Stock Threshold</Text>
            <Text style={styles.thresholdValue}>
              {product.lowStockThreshold} units
            </Text>
          </View>
        </View>
        
        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>
              {new Date(product.createdAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>
              {new Date(product.updatedAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      <Modal
        visible={stockModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {stockAction === 'in' ? 'Add Stock' : 'Remove Stock'}
            </Text>
            
            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={stockQuantity}
              onChangeText={setStockQuantity}
              placeholder="Enter quantity"
              keyboardType="numeric"
            />
            
            <Text style={styles.inputLabel}>Reason</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={stockReason}
              onChangeText={setStockReason}
              placeholder="Enter reason for adjustment"
              multiline
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setStockModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: 10 }}
              />
              <Button
                title="Confirm"
                onPress={handleUpdateStock}
                style={{ flex: 1 }}
              />
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error[500],
    marginBottom: 20,
  },
  header: {
    backgroundColor: Colors.primary[500],
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  imageSection: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.white,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.neutral[600],
    fontFamily: 'Inter-Medium',
  },
  productInfo: {
    backgroundColor: Colors.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  productName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.neutral[900],
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[600],
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[900],
  },
  categoryBadge: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.primary[700],
  },
  section: {
    backgroundColor: Colors.white,
    padding: 20,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.neutral[900],
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[600],
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary[600],
  },
  costValue: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.neutral[900],
  },
  profitValue: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.success[600],
  },
  stockActions: {
    flexDirection: 'row',
  },
  stockAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    padding: 6,
  },
  stockActionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[700],
  },
  stockContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  lowStockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning[100],
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  lowStockText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.warning[700],
    marginLeft: 4,
  },
  thresholdValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.neutral[900],
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[800],
    lineHeight: 22,
  },
  bottomPadding: {
    height: 40,
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
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.neutral[100],
    borderRadius: Layout.borderRadius.md,
    padding: 12,
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
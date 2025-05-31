import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import {
  getProducts,
  getProductByBarcode,
  deleteProduct,
} from '../../lib/firebase';
import { Product } from '../../types';
import { ProductCard } from '../../components/ProductCard';
import { Scanner } from '../../components/Scanner';
import { Button } from '../../components/Button';
import { Search, Plus, ScanLine, X, Trash2, Edit } from 'lucide-react-native';

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await getProducts();
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(text.toLowerCase()) ||
          product.sku.toLowerCase().includes(text.toLowerCase()) ||
          (product.barcode && product.barcode.includes(text))
      );
      setFilteredProducts(filtered);
    }
  };

  const handleScan = async (data: string) => {
    try {
      setScannerVisible(false);
      const product = await getProductByBarcode(data);

      if (product) {
        router.push(`/product/${product.id}`);
      } else {
        router.push({
          pathname: '/product/new',
          params: { barcode: data },
        });
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      Alert.alert('Error', 'Failed to process barcode scan');
    }
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      Alert.alert(
        'Delete Product',
        'Are you sure you want to delete this product?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteProduct(productId);
              loadProducts();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', 'Failed to delete product');
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItemContainer}>
      <TouchableOpacity
        style={styles.productContent}
        onPress={() => handleProductPress(item)}
      >
        <ProductCard product={item} onPress={() => handleProductPress(item)} />
      </TouchableOpacity>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditProduct(item.id)}
        >
          <Edit size={20} color={Colors.primary[500]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Trash2 size={20} color={Colors.danger[500]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/product/new')}
        >
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.neutral[400]} />
          <TextInputa
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.neutral[400]}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <X size={20} color={Colors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setScannerVisible(true)}
        >
          <ScanLine size={20} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.productsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading
                  ? 'Loading products...'
                  : searchQuery
                  ? 'No products found matching your search'
                  : 'No products available. Add your first product!'}
              </Text>
              {!loading && !searchQuery && (
                <Button
                  title="Add Product"
                  onPress={() => router.push('/product/new')}
                  style={styles.emptyButton}
                />
              )}
            </View>
          }
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <Scanner onScan={handleScan} onClose={() => setScannerVisible(false)} />
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    marginRight: Layout.spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.neutral[900],
    marginLeft: Layout.spacing.sm,
    fontFamily: 'Inter-Regular',
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsList: {
    padding: 20,
  },
  productItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    elevation: 1,
  },
  productContent: {
    flex: 1,
  },
  productActions: {
    flexDirection: 'row',
    paddingRight: 10,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
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
  emptyButton: {
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

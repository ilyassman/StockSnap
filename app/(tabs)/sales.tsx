import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { getSales } from '../../lib/firebase';
import { Sale } from '../../types';
import { SaleCard } from '../../components/SaleCard';
import { Button } from '../../components/Button';
import { Plus, Filter } from 'lucide-react-native';

export default function SalesScreen() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
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
  
  const handleSalePress = (sale: Sale) => {
    router.push(`/sale/${sale.id}`);
  };
  
  const handleNewSale = () => {
    router.push('/sale/new');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleNewSale}
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
          <Text style={styles.statLabel}>Total Sales</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{sales.length}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </View>
      
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SaleCard sale={item} onPress={handleSalePress} />
        )}
        contentContainerStyle={styles.salesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading 
                ? 'Loading sales...' 
                : 'No sales recorded yet. Create your first sale!'}
            </Text>
            {!loading && (
              <Button 
                title="New Sale" 
                onPress={handleNewSale} 
                style={styles.emptyButton}
              />
            )}
          </View>
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleNewSale}
      >
        <Plus size={24} color={Colors.white} />
      </TouchableOpacity>
      
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Sales</Text>
            
            <View style={styles.filterOptions}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={styles.dateRangeButtons}>
                <TouchableOpacity style={[styles.dateButton, styles.dateButtonSelected]}>
                  <Text style={styles.dateButtonTextSelected}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>This Week</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>This Month</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButton}>
                  <Text style={styles.dateButtonText}>Custom</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.filterLabel}>Payment Method</Text>
              <View style={styles.paymentMethodButtons}>
                <TouchableOpacity style={styles.paymentMethodButton}>
                  <Text style={styles.paymentMethodText}>Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.paymentMethodButton}>
                  <Text style={styles.paymentMethodText}>Card</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.paymentMethodButton}>
                  <Text style={styles.paymentMethodText}>Transfer</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <Button 
                title="Reset" 
                variant="outline" 
                onPress={() => {}}
                style={{ flex: 1, marginRight: 10 }}
              />
              <Button 
                title="Apply" 
                onPress={() => setFilterModalVisible(false)}
                style={{ flex: 1 }}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
  salesList: {
    padding: 20,
    paddingBottom: 80, // Extra padding for FAB
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
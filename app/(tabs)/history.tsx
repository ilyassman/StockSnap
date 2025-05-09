import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList 
} from 'react-native';
import { getStockMovements } from '../../lib/firebase';
import { StockMovement } from '../../types';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { ArrowDownCircle, ArrowUpCircle, RefreshCcw } from 'lucide-react-native';

export default function HistoryScreen() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');
  
  useEffect(() => {
    loadMovements();
  }, []);
  
  const loadMovements = async () => {
    try {
      setLoading(true);
      const movementsData = await getStockMovements();
      setMovements(movementsData);
    } catch (error) {
      console.error('Error loading stock movements:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredMovements = activeTab === 'all'
    ? movements
    : movements.filter(movement => movement.type === activeTab);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  const renderMovementItem = ({ item }: { item: StockMovement }) => {
    const getMovementIcon = () => {
      switch (item.type) {
        case 'in':
          return <ArrowUpCircle size={20} color={Colors.success[500]} />;
        case 'out':
          return <ArrowDownCircle size={20} color={Colors.error[500]} />;
        case 'adjustment':
          return <RefreshCcw size={20} color={Colors.warning[500]} />;
      }
    };
    
    const getMovementColor = () => {
      switch (item.type) {
        case 'in':
          return Colors.success[500];
        case 'out':
          return Colors.error[500];
        case 'adjustment':
          return Colors.warning[500];
      }
    };
    
    const getMovementText = () => {
      switch (item.type) {
        case 'in':
          return `+${item.quantity} added to stock`;
        case 'out':
          return `-${item.quantity} removed from stock`;
        case 'adjustment':
          return `Adjusted to ${item.quantity}`;
      }
    };
    
    return (
      <View style={styles.movementItem}>
        <View style={styles.iconContainer}>
          {getMovementIcon()}
        </View>
        <View style={styles.movementDetails}>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.movementReason}>{item.reason}</Text>
          <Text style={styles.movementDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={[styles.quantityText, { color: getMovementColor() }]}>
          {getMovementText()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'in' && styles.activeTab]}
          onPress={() => setActiveTab('in')}
        >
          <Text style={[styles.tabText, activeTab === 'in' && styles.activeTabText]}>
            Stock In
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'out' && styles.activeTab]}
          onPress={() => setActiveTab('out')}
        >
          <Text style={[styles.tabText, activeTab === 'out' && styles.activeTabText]}>
            Stock Out
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'adjustment' && styles.activeTab]}
          onPress={() => setActiveTab('adjustment')}
        >
          <Text style={[styles.tabText, activeTab === 'adjustment' && styles.activeTabText]}>
            Adjustments
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredMovements}
        keyExtractor={(item) => item.id}
        renderItem={renderMovementItem}
        contentContainerStyle={styles.movementsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading 
                ? 'Loading history...' 
                : 'No stock movements found'}
            </Text>
          </View>
        }
      />
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
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.white,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  tab: {
    paddingVertical: 14,
    flex: 1,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary[500],
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[600],
  },
  activeTabText: {
    color: Colors.primary[500],
  },
  movementsList: {
    padding: 20,
  },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  movementDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  movementReason: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[600],
    marginBottom: 2,
  },
  movementDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[500],
  },
  quantityText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'right',
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
    fontFamily: 'Inter-Regular',
  },
});
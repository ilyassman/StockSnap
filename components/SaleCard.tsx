import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sale } from '../types';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { Receipt, ChevronRight } from 'lucide-react-native';

interface SaleCardProps {
  sale: Sale;
  onPress: (sale: Sale) => void ;
}

export function SaleCard({ sale, onPress }: SaleCardProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(sale)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Receipt size={24} color={Colors.primary[500]} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.id}>Sale #{sale.id.slice(0, 8)}</Text>
          <Text style={styles.date}>{formatDate(sale.createdAt)}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.items}>
            {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.customer}>
            {sale.customerName || 'Walk-in Customer'}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.total}>${sale.total.toFixed(2)}</Text>
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentMethod}>
              {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color={Colors.neutral[400]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
    width: 50,
    height: 50,
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  id: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  date: {
    fontSize: 12,
    color: Colors.neutral[500],
  },
  details: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  items: {
    fontSize: 14,
    color: Colors.neutral[700],
    marginRight: Layout.spacing.md,
  },
  customer: {
    fontSize: 14,
    color: Colors.neutral[700],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  paymentBadge: {
    backgroundColor: Colors.secondary[100],
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  paymentMethod: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary[700],
  },
});
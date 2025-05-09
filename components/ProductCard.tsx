import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Product } from '../types';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { ChevronRight, Tag } from 'lucide-react-native';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const isLowStock = product.stockQuantity <= product.lowStockThreshold;

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image 
            source={{ uri: product.imageUrl }} 
            style={styles.image} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Tag size={24} color={Colors.neutral[400]} />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.sku}>SKU: {product.sku}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.price}>
            ${product.price.toFixed(2)}
          </Text>
          <View style={[
            styles.stockBadge,
            { backgroundColor: isLowStock ? Colors.warning[100] : Colors.success[100] }
          ]}>
            <Text style={[
              styles.stockText,
              { color: isLowStock ? Colors.warning[700] : Colors.success[700] }
            ]}>
              {product.stockQuantity} in stock
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
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    marginRight: Layout.spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  sku: {
    fontSize: 12,
    color: Colors.neutral[500],
    marginBottom: Layout.spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  stockBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
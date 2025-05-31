import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { 
  getCurrentUser, 
  logoutUser, 
  getProducts, 
  getSales, 
  getCustomers,
  getLowStockProducts,
  getTopSellingProducts,
  getSalesStats
} from '../../lib/firebase';
import { User, Product, Sale, Customer } from '../../types';
import { 
  LogOut, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  BarChart3
} from 'lucide-react-native';

interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalCustomers: number;
  totalRevenue: number;
  lowStockCount: number;
  todaySales: number;
  weeklyRevenue: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statCardContent}>
      <View style={styles.statCardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSales: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    lowStockCount: 0,
    todaySales: 0,
    weeklyRevenue: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<{ productId: string; productName: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserData(),
        loadStats(),
        loadLowStockProducts(),
        loadTopProducts(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [products, sales, customers, salesStats] = await Promise.all([
        getProducts(),
        getSales(),
        getCustomers(),
        getSalesStats(7), // 7 derniers jours
      ]);

      // Calculer les statistiques
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      
      // Ventes d'aujourd'hui
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todaySales = sales.filter(sale => 
        new Date(sale.createdAt) >= startOfDay
      ).length;

      // Revenus de la semaine
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyRevenue = sales
        .filter(sale => new Date(sale.createdAt) >= weekAgo)
        .reduce((sum, sale) => sum + sale.total, 0);

      // Produits en stock faible
      const lowStockCount = products.filter(product => 
        product.stockQuantity <= product.lowStockThreshold
      ).length;

      setStats({
        totalProducts: products.length,
        totalSales: sales.length,
        totalCustomers: customers.length,
        totalRevenue,
        lowStockCount,
        todaySales,
        weeklyRevenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadLowStockProducts = async () => {
    try {
      const products = await getLowStockProducts(5);
      setLowStockProducts(products);
    } catch (error) {
      console.error('Error loading low stock products:', error);
    }
  };

  const loadTopProducts = async () => {
    try {
      const products = await getTopSellingProducts(5);
      setTopProducts(products);
    } catch (error) {
      console.error('Error loading top products:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} DH`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tableau de Bord</Text>
          <Text style={styles.greeting}>Bonjour, {user?.displayName || 'Admin'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard
            title="Produits"
            value={stats.totalProducts}
            icon={<Package size={24} color={Colors.primary[500]} />}
            color={Colors.primary[500]}
          />
          <StatCard
            title="Ventes"
            value={stats.totalSales}
            icon={<ShoppingCart size={24} color={Colors.success[500]} />}
            color={Colors.success[500]}
            subtitle={`${stats.todaySales} aujourd'hui`}
          />
        </View>
        
        <View style={styles.statsRow}>
          <StatCard
            title="Clients"
            value={stats.totalCustomers}
            icon={<Users size={24} color={Colors.primary[500]} />}
            color={Colors.primary[500]}
          />
          <StatCard
            title="Chiffre d'affaires"
            value={formatCurrency(stats.totalRevenue)}
            icon={<DollarSign size={24} color={Colors.warning[500]} />}
            color={Colors.warning[500]}
            subtitle={`${formatCurrency(stats.weeklyRevenue)} cette semaine`}
          />
        </View>

        {stats.lowStockCount > 0 && (
          <StatCard
            title="Stock Faible"
            value={stats.lowStockCount}
            icon={<AlertTriangle size={24} color={Colors.error[500]} />}
            color={Colors.error[500]}
            subtitle="Produits à réapprovisionner"
          />
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/products')}
          >
            <Package size={24} color={Colors.primary[500]} />
            <Text style={styles.actionText}>Gérer Produits</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/sales')}
          >
            <BarChart3 size={24} color={Colors.success[500]} />
            <Text style={styles.actionText}>Voir Ventes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/customers')}
          >
            <Users size={24} color={Colors.primary[500]} />
            <Text style={styles.actionText}>Clients</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Stock Faible</Text>
          <View style={styles.alertContainer}>
            {lowStockProducts.map((product) => (
              <View key={product.id} style={styles.alertItem}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertProductName}>{product.name}</Text>
                  <Text style={styles.alertStock}>Stock: {product.stockQuantity}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.alertAction}
                  onPress={() => router.push(`/product/${product.id}`)}
                >
                  <Text style={styles.alertActionText}>Voir</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Top Selling Products */}
      {topProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Meilleures Ventes</Text>
          <View style={styles.topProductsContainer}>
            {topProducts.map((item, index) => (
              <View key={item.productId} style={styles.topProductItem}>
                <View style={styles.topProductRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.topProductInfo}>
                  <Text style={styles.topProductName}>{item.productName}</Text>
                  <Text style={styles.topProductCount}>{item.count} vendus</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.neutral[600],
    fontFamily: 'Inter-Regular',
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
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: 16,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardContent: {
    alignItems: 'center',
  },
  statCardHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.neutral[900],
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.neutral[900],
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[700],
    marginTop: 8,
    textAlign: 'center',
  },
  alertContainer: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error[500],
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  alertInfo: {
    flex: 1,
  },
  alertProductName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[900],
  },
  alertStock: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.error[500],
  },
  alertAction: {
    backgroundColor: Colors.error[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Layout.borderRadius.md,
  },
  alertActionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.error[600],
  },
  topProductsContainer: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: 16,
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  topProductRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: Colors.primary[600],
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[900],
  },
  topProductCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[600],
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import {
  getTopSellingProducts,
  getLowStockProducts,
  getSalesStats,
  getCurrentUser,
  getSales,
} from '../../lib/firebase';
import { User, Product, Sale } from '../../types';
import { LineChart, BarChart } from 'react-native-chart-kit';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  TrendingUp,
  Package,
  CircleDollarSign,
  ShoppingCart,
  RefreshCw,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topProducts, setTopProducts] = useState<
    { productId: string; productName: string; count: number }[]
  >([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [salesData, setSalesData] = useState<{ date: string; total: number }[]>(
    []
  );
  const [todaySales, setTodaySales] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const loadData = async () => {
    try {
      setLoading(true);

      // Load user info
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Load dashboard data
      const topSellingProducts = await getTopSellingProducts(5);
      setTopProducts(topSellingProducts);

      const lowStock = await getLowStockProducts(5);
      setLowStockProducts(lowStock);

      const salesStats = await getSalesStats(7);
      setSalesData(salesStats);

      // Calculate today's sales and total orders
      const today = new Date().toISOString().split('T')[0];
      const todayStats = salesStats.find(stat => stat.date === today);
      setTodaySales(todayStats?.total || 0);

      // Get all sales to calculate total orders and revenue
      const allSales = await getSales();
      setTotalOrders(allSales.length);
      
      const revenue = allSales.reduce((sum, sale) => sum + sale.total, 0);
      setTotalRevenue(revenue);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const chartConfig = {
    backgroundGradientFrom: Colors.white,
    backgroundGradientTo: Colors.white,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: Colors.primary[500],
    },
    decimalPlaces: 0,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.displayName || 'User'}
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/settings')}
        >
          <Image
            source={{
              uri: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary[500]]}
            tintColor={Colors.primary[500]}
          />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.primary[100] },
              ]}
            >
              <TrendingUp size={20} color={Colors.primary[500]} />
            </View>
            <Text style={styles.statValue}>{formatCurrency(todaySales)}</Text>
            <Text style={styles.statLabel}>Today's Sales</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.secondary[100] },
              ]}
            >
              <ShoppingCart size={20} color={Colors.secondary[500]} />
            </View>
            <Text style={styles.statValue}>{totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.success[100] },
              ]}
            >
              <CircleDollarSign size={20} color={Colors.success[500]} />
            </View>
            <Text style={styles.statValue}>{formatCurrency(totalRevenue)}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.warning[100] },
              ]}
            >
              <AlertTriangle size={20} color={Colors.warning[500]} />
            </View>
            <Text style={styles.statValue}>{lowStockProducts.length}</Text>
            <Text style={styles.statLabel}>Low Stock Items</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sales Overview</Text>
          <View style={styles.chartToggleContainer}>
            <TouchableOpacity 
              style={[styles.chartToggle, chartType === 'line' && styles.chartToggleActive]}
              onPress={() => setChartType('line')}
            >
              <Text style={[styles.chartToggleText, chartType === 'line' && styles.chartToggleTextActive]}>Line</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.chartToggle, chartType === 'bar' && styles.chartToggleActive]}
              onPress={() => setChartType('bar')}
            >
              <Text style={[styles.chartToggleText, chartType === 'bar' && styles.chartToggleTextActive]}>Bar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chartContainer}>
          {salesData.length > 0 ? (
            chartType === 'line' ? (
              <LineChart
                data={{
                  labels: salesData.map((item) => formatShortDate(item.date)),
                  datasets: [
                    {
                      data: salesData.map((item) => item.total),
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={Layout.window.width - 40}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{
                  borderRadius: 16,
                }}
                formatYLabel={(value) => formatCurrency(parseFloat(value))}
                yAxisLabel="$"
                yAxisSuffix=""
                yAxisInterval={1}
              />
            ) : (
              <BarChart
                data={{
                  labels: salesData.map((item) => formatShortDate(item.date)),
                  datasets: [
                    {
                      data: salesData.map((item) => item.total),
                    },
                  ],
                }}
                width={Layout.window.width - 40}
                height={220}
                chartConfig={chartConfig}
                style={{
                  borderRadius: 16,
                }}
                yAxisLabel="$"
                yAxisSuffix=""
                showValuesOnTopOfBars
                fromZero
              />
            )
          ) : (
            <View style={styles.noDataContainer}>
              <RefreshCw size={24} color={Colors.neutral[400]} />
              <Text style={styles.noDataText}>No sales data available</Text>
              <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                <Text style={styles.refreshButtonText}>Refresh Data</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Selling Products</Text>
          <TouchableOpacity onPress={() => router.push('/products')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topProductsContainer}>
          {topProducts.length > 0 ? (
            topProducts.map((product, index) => (
              <TouchableOpacity 
                key={product.productId} 
                style={styles.topProductItem}
                onPress={() => router.push(`/product/${product.productId}`)}
              >
                <View style={styles.topProductRank}>
                  <Text style={styles.topProductRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topProductDetails}>
                  <Text style={styles.topProductName} numberOfLines={1}>
                    {product.productName}
                  </Text>
                  <Text style={styles.topProductSold}>
                    {product.count} sold
                  </Text>
                </View>
                <ArrowUpRight size={18} color={Colors.primary[500]} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Package size={24} color={Colors.neutral[400]} />
              <Text style={styles.noDataText}>
                No product sales data available
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
          <TouchableOpacity onPress={() => router.push('/products')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.lowStockContainer}>
          {lowStockProducts.length > 0 ? (
            lowStockProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.lowStockItem}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <View style={styles.lowStockIconContainer}>
                  <AlertTriangle size={18} color={Colors.warning[500]} />
                </View>
                <View style={styles.lowStockDetails}>
                  <Text style={styles.lowStockName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.lowStockQuantity}>
                    Only{' '}
                    <Text style={styles.lowStockCount}>
                      {product.stockQuantity}
                    </Text>{' '}
                    left in stock (Threshold: {product.lowStockThreshold})
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noAlertsContainer}>
              <Package size={40} color={Colors.success[500]} />
              <Text style={styles.noAlertsText}>
                All products are well stocked
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  header: {
    backgroundColor: Colors.primary[500],
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.white,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.white,
    opacity: 0.8,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -30,
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    width: '48%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: Colors.neutral[900],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[500],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    marginTop: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.neutral[900],
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary[500],
  },
  chartContainer: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    minHeight: 280,
    justifyContent: 'center',
  },
  chartToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: Layout.borderRadius.md,
    padding: 2,
  },
  chartToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Layout.borderRadius.sm,
  },
  chartToggleActive: {
    backgroundColor: Colors.primary[500],
  },
  chartToggleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.neutral[600],
  },
  chartToggleTextActive: {
    color: Colors.white,
  },
  topProductsContainer: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  topProductRank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  topProductRankText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary[700],
  },
  topProductDetails: {
    flex: 1,
  },
  topProductName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  topProductSold: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[500],
  },
  lowStockContainer: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lowStockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  lowStockIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.warning[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  lowStockDetails: {
    flex: 1,
  },
  lowStockName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  lowStockQuantity: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[500],
  },
  lowStockCount: {
    color: Colors.warning[700],
    fontFamily: 'Inter-SemiBold',
  },
  noDataContainer: {
    paddingVertical: Layout.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: 8,
  },
  noAlertsContainer: {
    paddingVertical: Layout.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAlertsText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.success[700],
    marginTop: Layout.spacing.md,
  },
  bottomPadding: {
    height: 40,
  },
  refreshButton: {
    marginTop: 16,
    padding: 8,
    backgroundColor: Colors.primary[100],
    borderRadius: Layout.borderRadius.md,
  },
  refreshButtonText: {
    color: Colors.primary[600],
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});
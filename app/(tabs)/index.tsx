import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import {
  getTopSellingProducts,
  getLowStockProducts,
  getSalesStats,
  getCurrentUser,
} from '../../lib/firebase';
import { User, Product } from '../../types';
import { LineChart } from 'react-native-chart-kit';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  TrendingUp,
  Package,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<
    { productId: string; productName: string; count: number }[]
  >([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [salesData, setSalesData] = useState<{ date: string; total: number }[]>(
    []
  );

  useEffect(() => {
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
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.statValue}>$2,458.20</Text>
            <Text style={styles.statLabel}>Today's Sales</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.secondary[100] },
              ]}
            >
              <BarChart3 size={20} color={Colors.secondary[500]} />
            </View>
            <Text style={styles.statValue}>28</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sales Overview</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Last 7 Days</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          {salesData.length > 0 ? (
            <LineChart
              data={{
                labels: salesData.map((item) => item.date.split('-')[2]), // Just day number for clarity
                datasets: [
                  {
                    data: salesData.map((item) => item.total),
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
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No sales data available</Text>
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
              <View key={product.productId} style={styles.topProductItem}>
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
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
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
                    left in stock
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
    marginBottom: 20,
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
});

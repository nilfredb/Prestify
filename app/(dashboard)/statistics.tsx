// app/(client)/statistics.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert
} from 'react-native';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import * as Icons from 'phosphor-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { StatusBar } from 'expo-status-bar';
import { scale, verticalScale } from '@/utils/styling';
import { useAuth } from '@/context/authContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  orderBy,
  getDoc,
  doc,
  limit,
} from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { 
  LineChart, 
  BarChart, 
  PieChart,
} from 'react-native-chart-kit';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, subDays, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { LoanType, StatsData } from '@/types';
import { initialStatsData } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';

// Screen width
const screenWidth = Dimensions.get('window').width;

// Define a complete interface for Firestore loan data
interface FirestoreLoan {
  id: string;
  status?: 'active' | 'late' | 'completed';
  amount?: number;
  paymentsMade?: number;
  paymentAmount?: number;
  clientId?: string;
  createdAt?: Timestamp;
  lastPaymentDate?: Timestamp;
  totalAmount?: number;
  totalPaid?: number; // Added this field to track total amount paid directly
  [key: string]: any; // Allow additional properties
}

// Define interface for payment activity data
interface PaymentActivity {
  date: string;
  count: number;
}

/**
 * Format currency helper
 */
const formatCurrency = (amount: number): string => {
  return `RD$${amount.toLocaleString('es-DO')}`;
};

/**
 * Get percentage helper
 */
const getPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

const StatisticsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData>(initialStatsData);
  const [timeRange, setTimeRange] = useState<'1week' | '1month' | '3months' | '6months' | '1year'>('3months');
  const [chartType, setChartType] = useState<'loans' | 'payments'>('loans');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [recentLoans, setRecentLoans] = useState<FirestoreLoan[]>([]);
  
  // Fetch statistics data
  const fetchStatistics = useCallback(async (isRefreshing = false) => {
    if (!user?.uid) return;
    
    if (!isRefreshing) {
      setStats(prev => ({ ...prev, isLoading: true }));
    }

    try {
      // Get clients data
      const clientsQuery = query(
        collection(firestore, 'clients'),
        where('uid', '==', user.uid)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsCount = clientsSnapshot.size;
      
      // Get loans data
      const loansQuery = query(
        collection(firestore, 'loans'),
        where('uid', '==', user.uid)
      );
      const loansSnapshot = await getDocs(loansQuery);
      const loans: FirestoreLoan[] = loansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get recent loans for the activity feed
      const recentLoansQuery = query(
        collection(firestore, 'loans'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentLoansSnapshot = await getDocs(recentLoansQuery);
      const recentLoansData: FirestoreLoan[] = recentLoansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentLoans(recentLoansData);

      // Calculate loan statistics
      const activeLoans = loans.filter(loan => loan.status === 'active').length;
      const completedLoans = loans.filter(loan => loan.status === 'completed').length;
      const lateLoans = loans.filter(loan => loan.status === 'late').length;
      
      const totalLoaned = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
      
      // UPDATED calculation for totalRecovered
      const totalRecovered = loans.reduce((sum, loan) => {
        // First check if we have a direct totalPaid field
        if (loan.totalPaid && typeof loan.totalPaid === 'number') {
          return sum + loan.totalPaid;
        }
        
        // For completed loans, count the full loan amount
        if (loan.status === 'completed') {
          return sum + (loan.totalAmount || loan.amount || 0);
        }
        
        // For active or late loans, calculate from payments made
        if ((loan.status === 'active' || loan.status === 'late') && 
            loan.paymentsMade && loan.paymentAmount) {
          return sum + (loan.paymentsMade * loan.paymentAmount);
        }
        
        return sum;
      }, 0);
      
      const pendingCollection = Math.max(0, totalLoaned - totalRecovered);
      
      // Count unique clients with loans
      const clientIdsWithLoans = new Set(loans.map(loan => loan.clientId).filter(Boolean));
      const clientsWithLoans = clientIdsWithLoans.size;

      // Status distribution for pie chart
      const statusDistribution = [
        {
          name: 'Activos',
          count: activeLoans,
          color: '#4338CA', // Indigo-700
        },
        {
          name: 'Completados',
          count: completedLoans,
          color: '#10B981', // Green-500
        },
        {
          name: 'Atrasados',
          count: lateLoans,
          color: '#EF4444', // Red-500
        }
      ];

      // Get date range based on selected time range
      const today = new Date();
      let startDate;
      let numPoints;
      let labelFormat;

      switch (timeRange) {
        case '1week':
          startDate = subDays(today, 7);
          numPoints = 7;
          labelFormat = 'EEE'; // Mon, Tue, etc.
          break;
        case '1month':
          startDate = subMonths(today, 1);
          numPoints = 4; // 4 weeks
          labelFormat = "'W'w"; // W1, W2, etc.
          break;
        case '3months':
          startDate = subMonths(today, 3);
          numPoints = 3;
          labelFormat = 'MMM'; // Jan, Feb, etc.
          break;
        case '6months':
          startDate = subMonths(today, 6);
          numPoints = 6;
          labelFormat = 'MMM'; // Jan, Feb, etc.
          break;
        case '1year':
          startDate = subYears(today, 1);
          numPoints = 12;
          labelFormat = 'MMM'; // Jan, Feb, etc.
          break;
        default:
          startDate = subMonths(today, 3);
          numPoints = 3;
          labelFormat = 'MMM';
      }

      // Generate labels and initialize data arrays
      const labels = [];
      const loansData = Array(numPoints).fill(0);
      const paymentsData = Array(numPoints).fill(0);

      // For monthly data
      if (['3months', '6months', '1year'].includes(timeRange)) {
        for (let i = numPoints - 1; i >= 0; i--) {
          const monthDate = subMonths(today, i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const monthLabel = format(monthDate, labelFormat, { locale: es });
          labels.push(monthLabel);

          // Count loans created in this month
          const loansInMonth = loans.filter(loan => {
            if (!loan.createdAt) return false;
            const createdAt = loan.createdAt.toDate();
            return createdAt >= monthStart && createdAt <= monthEnd;
          });
          loansData[numPoints - 1 - i] = loansInMonth.length;

          // Count payments made in this month
          const paymentsInMonth = loans.filter(loan => {
            if (!loan.lastPaymentDate) return false;
            const paymentDate = loan.lastPaymentDate.toDate();
            return paymentDate >= monthStart && paymentDate <= monthEnd;
          });
          paymentsData[numPoints - 1 - i] = paymentsInMonth.length;
        }
      } 
      // For weekly data
      else if (timeRange === '1week') {
        for (let i = 6; i >= 0; i--) {
          const date = subDays(today, i);
          const dateLabel = format(date, labelFormat, { locale: es });
          labels.push(dateLabel);

          // Count loans created on this day
          const loansOnDay = loans.filter(loan => {
            if (!loan.createdAt) return false;
            const createdAt = loan.createdAt.toDate();
            return format(createdAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
          });
          loansData[6 - i] = loansOnDay.length;

          // Count payments made on this day
          const paymentsOnDay = loans.filter(loan => {
            if (!loan.lastPaymentDate) return false;
            const paymentDate = loan.lastPaymentDate.toDate();
            return format(paymentDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
          });
          paymentsData[6 - i] = paymentsOnDay.length;
        }
      }
      // For weekly data over a month
      else if (timeRange === '1month') {
        const weeks = [
          { start: subDays(today, 28), end: subDays(today, 22) },
          { start: subDays(today, 21), end: subDays(today, 15) },
          { start: subDays(today, 14), end: subDays(today, 8) },
          { start: subDays(today, 7), end: today },
        ];

        weeks.forEach((week, idx) => {
          const weekLabel = format(week.start, labelFormat, { locale: es });
          labels.push(weekLabel);

          // Count loans created in this week
          const loansInWeek = loans.filter(loan => {
            if (!loan.createdAt) return false;
            const createdAt = loan.createdAt.toDate();
            return createdAt >= week.start && createdAt <= week.end;
          });
          loansData[idx] = loansInWeek.length;

          // Count payments made in this week
          const paymentsInWeek = loans.filter(loan => {
            if (!loan.lastPaymentDate) return false;
            const paymentDate = loan.lastPaymentDate.toDate();
            return paymentDate >= week.start && paymentDate <= week.end;
          });
          paymentsData[idx] = paymentsInWeek.length;
        });
      }

      // Create payment activity map
      const paymentActivity: PaymentActivity[] = [];
      const paymentMap = new Map<string, number>();
      loans.forEach(loan => {
        if (loan.lastPaymentDate) {
          const paymentDate = format(loan.lastPaymentDate.toDate(), 'yyyy-MM-dd');
          paymentMap.set(paymentDate, (paymentMap.get(paymentDate) || 0) + 1);
        }
      });

      // Debug logs - to be removed in production
      console.log('Total loaned:', totalLoaned);
      console.log('Total recovered:', totalRecovered);
      console.log('Active loans:', activeLoans);
      console.log('Completed loans:', completedLoans);

      setStats({
        totalLoaned,
        totalRecovered,
        pendingCollection,
        activeLoans,
        completedLoans,
        lateLoans,
        clientCount: clientsCount,
        clientsWithLoans,
        monthlyLoansData: loansData,
        monthlyPaymentsData: paymentsData,
        statusDistribution,
        paymentActivity,
        isLoading: false
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStats(prev => ({ ...prev, isLoading: false }));
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  }, [user, timeRange]);

  // Initial data loading
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchStatistics(true);
  };

  // Handle time range change
  const handleTimeRangeChange = (range: '1week' | '1month' | '3months' | '6months' | '1year') => {
    setTimeRange(range);
  };

  // Handle chart type change
  const handleChartTypeChange = (type: 'loans' | 'payments') => {
    setChartType(type);
  };

  // Handle card expansion
  const toggleCardExpansion = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: colors.neutral900,
    backgroundGradientTo: colors.neutral900,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    useShadowColorFromDataset: false,
    style: {
      borderRadius: radius._15
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#2563EB"
    },
    propsForLabels: {
      fontSize: 12
    }
  };

  // Stats summary cards
  const renderStatCards = () => (
    <View style={styles.statCardsContainer}>
      <Pressable 
        onPress={() => toggleCardExpansion('totalLoaned')}
        style={({ pressed }) => [
          styles.statCard,
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
        ]}
      >
        <MotiView 
          from={{ opacity: 0, translateY: 5 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 100 }}
          style={styles.statCardContent}
        >
          <LinearGradient
            colors={['rgba(37, 99, 235, 0.2)', 'rgba(37, 99, 235, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCardIcon}
          >
            <Icons.CurrencyDollar size={scale(24)} color="#2563EB" weight="bold" />
          </LinearGradient>
          <Typo size={scale(14)} color={colors.neutral400}>Total Prestado</Typo>
          <Typo size={scale(20)} fontWeight="700" color={colors.white}>
            {formatCurrency(stats.totalLoaned)}
          </Typo>

          <AnimatePresence>
            {expandedCard === 'totalLoaned' && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={styles.expandedCardContent}
              >
                <View style={styles.divider} />
                <View style={styles.expandedCardRow}>
                  <Typo color={colors.neutral400} size={scale(12)}>Préstamos activos:</Typo>
                  <Typo color={colors.white}>{stats.activeLoans}</Typo>
                </View>
                <View style={styles.expandedCardRow}>
                  <Typo color={colors.neutral400} size={scale(12)}>Cantidad promedio:</Typo>
                  <Typo color={colors.white}>
                    {formatCurrency(stats.activeLoans > 0 ? stats.totalLoaned / stats.activeLoans : 0)}
                  </Typo>
                </View>
              </MotiView>
            )}
          </AnimatePresence>
        </MotiView>
      </Pressable>

      <Pressable 
        onPress={() => toggleCardExpansion('recovered')}
        style={({ pressed }) => [
          styles.statCard,
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
        ]}
      >
        <MotiView 
          from={{ opacity: 0, translateY: 5 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 200 }}
          style={styles.statCardContent}
        >
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCardIcon}
          >
            <Icons.ArrowDown size={scale(24)} color="#10B981" weight="bold" />
          </LinearGradient>
          <Typo size={scale(14)} color={colors.neutral400}>Recuperado</Typo>
          <Typo size={scale(20)} fontWeight="700" color={colors.white}>
            {formatCurrency(stats.totalRecovered)}
          </Typo>

          <AnimatePresence>
            {expandedCard === 'recovered' && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={styles.expandedCardContent}
              >
                <View style={styles.divider} />
                <View style={styles.expandedCardRow}>
                  <Typo color={colors.neutral400} size={scale(12)}>Tasa de recuperación:</Typo>
                  <Typo color={colors.success}>
                    {stats.totalLoaned > 0 ? `${(stats.totalRecovered / stats.totalLoaned * 100).toFixed(1)}%` : '0%'}
                  </Typo>
                </View>
                <View style={styles.expandedCardRow}>
                  <Typo color={colors.neutral400} size={scale(12)}>Préstamos completados:</Typo>
                  <Typo color={colors.white}>{stats.completedLoans}</Typo>
                </View>
              </MotiView>
            )}
          </AnimatePresence>
        </MotiView>
      </Pressable>

      <Pressable 
        onPress={() => toggleCardExpansion('pending')}
        style={({ pressed }) => [
          styles.statCard,
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
        ]}
      >
        <MotiView 
          from={{ opacity: 0, translateY: 5 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 300 }}
          style={styles.statCardContent}
        >
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCardIcon}
          >
            <Icons.HourglassMedium size={scale(24)} color="#F59E0B" weight="bold" />
          </LinearGradient>
          <Typo size={scale(14)} color={colors.neutral400}>Pendiente</Typo>
          <Typo size={scale(20)} fontWeight="700" color={colors.white}>
            {formatCurrency(stats.pendingCollection)}
          </Typo>

          <AnimatePresence>
            {expandedCard === 'pending' && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={styles.expandedCardContent}
              >
                <View style={styles.divider} />
                <View style={styles.expandedCardRow}>
                  <Typo color={colors.neutral400} size={scale(12)}>Préstamos en mora:</Typo>
                  <Typo color={colors.danger}>{stats.lateLoans}</Typo>
                </View>
                <View style={styles.expandedCardRow}>
                  <Typo color={colors.neutral400} size={scale(12)}>% de total:</Typo>
                  <Typo color={colors.white}>
                    {stats.totalLoaned > 0 ? `${(stats.pendingCollection / stats.totalLoaned * 100).toFixed(1)}%` : '0%'}
                  </Typo>
                </View>
              </MotiView>
            )}
          </AnimatePresence>
        </MotiView>
      </Pressable>
      
      <Pressable 
        onPress={() => toggleCardExpansion('clients')}
        style={({ pressed }) => [
          styles.statCard,
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
        ]}
      >
        <MotiView 
          from={{ opacity: 0, translateY: 5 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 400 }}
          style={styles.statCardContent}
        >
          <LinearGradient
            colors={['rgba(107, 114, 128, 0.2)', 'rgba(107, 114, 128, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCardIcon}
          >
            <Icons.UsersThree size={scale(24)} color={colors.neutral400} weight="bold" />
          </LinearGradient>
          <Typo size={scale(14)} color={colors.neutral400}>Clientes</Typo>
          <Typo size={scale(20)} fontWeight="700" color={colors.white}>
            {stats.clientCount}
          </Typo>

          <AnimatePresence>
            {expandedCard === 'clients' && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={styles.expandedCardContent}
              >
                <View style={styles.divider} />
                <View style={styles.expandedCardRow}>
                  <Typo color={colors.neutral400} size={scale(12)}>Clientes con préstamos:</Typo>
                  <Typo color={colors.white}>{stats.clientsWithLoans}</Typo>
                </View>
                <View style={styles.expandedCardRow}>
                  <Typo color={colors.neutral400} size={scale(12)}>Promedio por cliente:</Typo>
                  <Typo color={colors.white}>
                    {formatCurrency(stats.clientsWithLoans > 0 ? stats.totalLoaned / stats.clientsWithLoans : 0)}
                  </Typo>
                </View>
              </MotiView>
            )}
          </AnimatePresence>
        </MotiView>
      </Pressable>
    </View>
  );

  // Render time range selector
  const renderTimeRangeSelector = () => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay: 450 }}
      style={styles.timeRangeContainer}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeRangeScrollContent}
      >
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === '1week' && styles.activeTimeRange]}
          onPress={() => handleTimeRangeChange('1week')}
        >
          <Typo
            size={scale(12)}
            color={timeRange === '1week' ? colors.white : colors.neutral400}
            fontWeight={timeRange === '1week' ? '600' : '400'}
          >
            7 Días
          </Typo>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === '1month' && styles.activeTimeRange]}
          onPress={() => handleTimeRangeChange('1month')}
        >
          <Typo
            size={scale(12)}
            color={timeRange === '1month' ? colors.white : colors.neutral400}
            fontWeight={timeRange === '1month' ? '600' : '400'}
          >
            1 Mes
          </Typo>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === '3months' && styles.activeTimeRange]}
          onPress={() => handleTimeRangeChange('3months')}
        >
          <Typo
            size={scale(12)}
            color={timeRange === '3months' ? colors.white : colors.neutral400}
            fontWeight={timeRange === '3months' ? '600' : '400'}
          >
            3 Meses
          </Typo>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === '6months' && styles.activeTimeRange]}
          onPress={() => handleTimeRangeChange('6months')}
        >
          <Typo
            size={scale(12)}
            color={timeRange === '6months' ? colors.white : colors.neutral400}
            fontWeight={timeRange === '6months' ? '600' : '400'}
          >
            6 Meses
          </Typo>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === '1year' && styles.activeTimeRange]}
          onPress={() => handleTimeRangeChange('1year')}
        >
          <Typo
            size={scale(12)}
            color={timeRange === '1year' ? colors.white : colors.neutral400}
            fontWeight={timeRange === '1year' ? '600' : '400'}
          >
            1 Año
          </Typo>
        </TouchableOpacity>
      </ScrollView>
    </MotiView>
  );

  // Render line chart
  const renderActivityChart = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 600, delay: 500 }}
      style={styles.chartContainer}
    >
      <View style={styles.chartHeader}>
        <Typo size={scale(16)} fontWeight="600" color={colors.white}>
          Actividad {timeRange === '1week' ? 'Semanal' : 'Mensual'}
        </Typo>
        <View style={styles.chartOptions}>
          <TouchableOpacity 
            style={[styles.chartOption, chartType === 'loans' && styles.chartOptionActive]}
            onPress={() => handleChartTypeChange('loans')}
          >
            <Typo 
              size={scale(12)} 
              color={chartType === 'loans' ? colors.primary : colors.neutral400}
              fontWeight={chartType === 'loans' ? '600' : '400'}
            >
              Préstamos
            </Typo>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.chartOption, chartType === 'payments' && styles.chartOptionActive]}
            onPress={() => handleChartTypeChange('payments')}
          >
            <Typo 
              size={scale(12)} 
              color={chartType === 'payments' ? colors.primary : colors.neutral400}
              fontWeight={chartType === 'payments' ? '600' : '400'}
            >
              Pagos
            </Typo>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chartDescription}>
        <Typo size={scale(12)} color={colors.neutral400}>
          {chartType === 'loans' 
            ? 'Número de nuevos préstamos por período'
            : 'Número de pagos recibidos por período'}
        </Typo>
      </View>

      <LineChart
        data={{
          labels: timeRange === '1week' 
                  ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] 
                  : timeRange === '1month'
                    ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
                    : timeRange === '3months'
                      ? ['Ene', 'Feb', 'Mar']
                      : timeRange === '6months'
                        ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
                        : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          datasets: [
            {
              data: chartType === 'loans' ? stats.monthlyLoansData : stats.monthlyPaymentsData,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              strokeWidth: 2
            }
          ],
          legend: [chartType === 'loans' ? 'Préstamos Nuevos' : 'Pagos Recibidos']
        }}
        width={screenWidth - spacingX._40}
        height={220}
        chartConfig={{
          ...chartConfig,
          fillShadowGradientFrom: '#2563EB',
          fillShadowGradientTo: 'rgba(37, 99, 235, 0.1)',
          fillShadowGradientOpacity: 0.5,
        }}
        bezier
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={true}
        withShadow={false}
        withDots={true}
        withHorizontalLines={true}
        withVerticalLines={false}
        fromZero
      />
    </MotiView>
  );

  // Render loan status distribution
  const renderStatusDistribution = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 600, delay: 600 }}
      style={styles.chartContainer}
    >
      <Typo size={scale(16)} fontWeight="600" color={colors.white} style={styles.chartTitle}>
        Estado de Préstamos
      </Typo>
      
      <View style={styles.pieContainer}>
        <PieChart
          data={stats.statusDistribution.map(item => ({
            name: item.name,
            population: item.count,
            color: item.color,
            legendFontColor: colors.white,
            legendFontSize: 12
          }))}
          width={screenWidth / 2}
          height={180}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="0"
          absolute
          hasLegend={false}
        />
        
        <View style={styles.pieStats}>
          {stats.statusDistribution.map((item, index) => (
            <View key={index} style={styles.pieStatItem}>
              <View style={styles.pieStatHeader}>
                <View style={[styles.pieStatDot, { backgroundColor: item.color }]} />
                <Typo size={scale(14)} color={colors.white}>{item.name}</Typo>
              </View>
              <View style={styles.pieStatValue}>
                <Typo size={scale(16)} fontWeight="700" color={colors.white}>{item.count}</Typo>
                <Typo size={scale(12)} color={colors.neutral400}>
                  {getPercentage(item.count, stats.activeLoans + stats.completedLoans + stats.lateLoans)}
                </Typo>
              </View>
            </View>
          ))}
        </View>
      </View>
    </MotiView>
  );

  // Render recent loans
  const renderRecentLoans = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 600, delay: 700 }}
      style={styles.chartContainer}
    >
      <Typo size={scale(16)} fontWeight="600" color={colors.white} style={styles.chartTitle}>
        Actividad Reciente
      </Typo>
      
      {recentLoans.length > 0 ? (
        <View style={styles.recentLoansContainer}>
          {recentLoans.map((loan, index) => (
            <View key={loan.id} style={styles.recentLoanItem}>
              <View style={styles.recentLoanLeft}>
                <LinearGradient
                  colors={[
                    loan.status === 'active' ? 'rgba(37, 99, 235, 0.3)' : 
                    loan.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : 
                    'rgba(239, 68, 68, 0.3)',
                    loan.status === 'active' ? 'rgba(37, 99, 235, 0.1)' : 
                    loan.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 
                    'rgba(239, 68, 68, 0.1)'
                  ]}
                  style={styles.recentLoanIcon}
                >
                  {loan.status === 'active' ? (
                    <Icons.CheckCircle size={scale(20)} color="#2563EB" />
                  ) : loan.status === 'completed' ? (
                    <Icons.CheckSquare size={scale(20)} color="#10B981" />
                  ) : (
                    <Icons.Warning size={scale(20)} color="#EF4444" />
                  )}
                </LinearGradient>
                <View style={styles.recentLoanInfo}>
                  <Typo fontWeight="500">
                    {formatCurrency(loan.amount || 0)}
                  </Typo>
                  <Typo size={scale(12)} color={colors.neutral400}>
                    {loan.createdAt ? format(loan.createdAt.toDate(), 'dd MMM yyyy') : 'Fecha desconocida'}
                  </Typo>
                </View>
              </View>
              <View style={styles.recentLoanRight}>
                <View style={[
                  styles.recentLoanStatus,
                  {
                    backgroundColor: loan.status === 'active' ? 'rgba(37, 99, 235, 0.2)' :
                                     loan.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' :
                                     'rgba(239, 68, 68, 0.2)'
                  }
                ]}>
                  <Typo size={scale(12)} color={
                    loan.status === 'active' ? '#2563EB' :
                    loan.status === 'completed' ? '#10B981' :
                    '#EF4444'
                  }>
                    {loan.status === 'active' ? 'Activo' :
                     loan.status === 'completed' ? 'Completado' :
                     'En mora'}
                  </Typo>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyRecentLoans}>
          <Icons.ClipboardText size={scale(30)} color={colors.neutral600} />
          <Typo color={colors.neutral400} style={styles.emptyText}>
            No hay préstamos recientes
          </Typo>
        </View>
      )}
    </MotiView>
  );

  // Render recovery metrics
  const renderRecoveryMetrics = () => {
    const recoveryRate = stats.totalLoaned > 0 
      ? (stats.totalRecovered / stats.totalLoaned) * 100 
      : 0;
    
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 600, delay: 800 }}
        style={styles.metricsContainer}
      >
        <Typo size={scale(16)} fontWeight="600" color={colors.white} style={styles.chartTitle}>
          Métricas de Recuperación
        </Typo>
        
        <View style={styles.metricsContent}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressHeader}>
              <Typo size={scale(14)} color={colors.neutral400}>Tasa de Recuperación</Typo>
              <Typo size={scale(16)} fontWeight="700" color={colors.white}>
                {recoveryRate.toFixed(1)}%
              </Typo>
            </View>
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${recoveryRate}%`,
                      backgroundColor: recoveryRate >= 70 
                        ? colors.success 
                        : recoveryRate >= 50 
                          ? colors.warning 
                          : colors.danger
                    }
                  ]} 
                />
              </View>
              <View style={styles.progressMarkers}>
                <Typo size={scale(10)} color={colors.neutral500}>0%</Typo>
                <Typo size={scale(10)} color={colors.neutral500}>50%</Typo>
                <Typo size={scale(10)} color={colors.neutral500}>100%</Typo>
              </View>
            </View>
          </View>
          
          <View style={styles.metricsCards}>
            <View style={styles.metricCard}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.metricCardIcon}
              >
                <Icons.CheckCircle size={scale(20)} color="#10B981" />
              </LinearGradient>
              <Typo color={colors.neutral400} size={scale(12)}>Préstamos Completados</Typo>
              <Typo size={scale(18)} fontWeight="700" color={colors.white}>
                {stats.completedLoans}
              </Typo>
            </View>
            
            <View style={styles.metricCard}>
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.metricCardIcon}
              >
                <Icons.Warning size={scale(20)} color="#EF4444" />
              </LinearGradient>
              <Typo color={colors.neutral400} size={scale(12)}>Préstamos en Mora</Typo>
              <Typo size={scale(18)} fontWeight="700" color={colors.white}>
                {stats.lateLoans}
              </Typo>
            </View>
          </View>
        </View>
      </MotiView>
    );
  };

  // Main render method
  if (stats.isLoading) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Typo size={scale(16)} color={colors.neutral400} style={styles.loadingText}>
          Cargando estadísticas...
        </Typo>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <StatusBar style="light" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.header}
        >
          <Typo size={scale(28)} fontWeight="800" color={colors.white}>
            Estadísticas
          </Typo>
          <Typo size={scale(14)} color={colors.neutral400}>
            Análisis y métricas de tu negocio
          </Typo>
        </MotiView>
        
        {renderStatCards()}
        {renderTimeRangeSelector()}
        {renderActivityChart()}
        {renderStatusDistribution()}
        {renderRecentLoans()}
        {renderRecoveryMetrics()}
        
        <TouchableOpacity 
          style={styles.exportButton}
          onPress={() => {
            Alert.alert('Exportar datos', 'Próximamente podrás exportar reportes en PDF o Excel');
          }}
        >
          <Icons.Export size={scale(18)} color={colors.primary} />
          <Typo color={colors.primary} fontWeight="600">Exportar Reporte</Typo>
        </TouchableOpacity>
        
        <View style={styles.bottomSpace} />
      </ScrollView>
    </ScreenWrapper>
  );
};

export default StatisticsPage;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral950,
  },
  loadingText: {
    marginTop: spacingY._10,
  },
  header: {
    paddingVertical: spacingY._20,
  },
  statCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacingY._20,
  },
  statCard: {
    width: (screenWidth - spacingX._40 - spacingX._10) / 2,
    marginBottom: spacingY._10,
    borderRadius: radius._15,
    overflow: 'hidden',
    backgroundColor: colors.neutral950,
  },
  statCardContent: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    borderWidth: 1,
    borderColor: colors.neutral800,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    // Removed fixed height to make cards more compact
  },
  statCardIcon: {
    width: scale(40),
    height: scale(40), // Reduced size slightly
    borderRadius: scale(20), 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacingY._5, // Reduced margin
  },
  expandedCardContent: {
    marginTop: spacingY._10,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral800,
    marginVertical: spacingY._10,
  },
  expandedCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacingY._5,
  },
  timeRangeContainer: {
    marginBottom: spacingY._20,
  },
  timeRangeScrollContent: {
    paddingRight: spacingX._10,
  },
  timeRangeButton: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._7,
    backgroundColor: colors.neutral900,
    borderRadius: radius._20,
    marginRight: spacingX._7,
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  activeTimeRange: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chartContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._20,
    marginBottom: spacingY._20,
    borderWidth: 1,
    borderColor: colors.neutral800,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  chartDescription: {
    marginBottom: spacingY._15,
  },
  chartOptions: {
    flexDirection: 'row',
    backgroundColor: colors.neutral800,
    borderRadius: radius._20,
    padding: 3,
  },
  chartOption: {
    paddingVertical: spacingY._5,
    paddingHorizontal: spacingX._12,
    borderRadius: radius._20,
  },
  chartOptionActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
  chartTitle: {
    marginBottom: spacingY._15,
  },
  chart: {
    marginVertical: spacingY._10,
    borderRadius: radius._15,
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieStats: {
    flex: 1,
  },
  pieStatItem: {
    marginBottom: spacingY._15,
  },
  pieStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieStatDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    marginRight: spacingX._7,
  },
  pieStatValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacingX._20,
    gap: spacingX._10,
  },
  recentLoansContainer: {
    gap: spacingY._10,
  },
  recentLoanItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    borderRadius: radius._10,
    padding: spacingY._10,
    paddingHorizontal: spacingX._15,
  },
  recentLoanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._12,
  },
  recentLoanIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentLoanInfo: {
    gap: 2,
  },
  recentLoanRight: {},
  recentLoanStatus: {
    paddingHorizontal: spacingX._10,
    paddingVertical: 4,
    borderRadius: radius._10,
  },
  emptyRecentLoans: {
    alignItems: 'center',
    padding: spacingY._30,
  },
  emptyText: {
    marginTop: spacingY._10,
  },
  metricsContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._20,
    marginBottom: spacingY._20,
    borderWidth: 1,
    borderColor: colors.neutral800,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  metricsContent: {
    gap: spacingY._20,
  },
  progressBarContainer: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._15,
    padding: spacingY._15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  progressBarWrapper: {},
  progressBar: {
    height: verticalScale(10),
    backgroundColor: colors.neutral700,
    borderRadius: radius._10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius._10,
  },
  progressMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacingY._5,
  },
  metricsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacingX._10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.neutral800,
    borderRadius: radius._15,
    padding: spacingY._15,
    alignItems: 'center',
  },
  metricCardIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacingY._10,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingX._10,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    borderRadius: radius._12,
    padding: spacingY._12,
    marginVertical: spacingY._10,
  },
  bottomSpace: {
    height: verticalScale(80),
  },
});
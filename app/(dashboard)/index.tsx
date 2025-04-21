import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import SectionHeader from '@/components/SectionHeader';
import * as Icons from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale } from '@/utils/styling';
import { useAuth } from '@/context/authContext';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */
interface Client {
  id: string;
  name: string;
  status: string;
  phone?: string;
}

interface Loan {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  dueDate: Timestamp;
  status: 'active' | 'completed' | 'late';
  paymentAmount: number;
}

interface DashboardData {
  clientCount: number;
  activeLoansCount: number;
  totalLoaned: number;
  dueTodayCount: number;
  todaysPayments: Loan[];
  upcomingPayments: Loan[];
  recentActivity: {
    type: 'loan' | 'payment';
    date: Timestamp;
    amount: number;
    clientName: string;
    id: string;
  }[];
  isLoading: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */
const screenWidth = Dimensions.get('window').width;

const formatCurrency = (amount: number): string => {
  return `RD$${amount.toLocaleString('es-DO')}`;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isThisWeek = (date: Date): boolean => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return date >= startOfWeek && date <= endOfWeek;
};

/* -------------------------------------------------------------------------- */
/*                              Header component                              */
/* -------------------------------------------------------------------------- */
const DashboardHeader = ({ data }: { data: DashboardData }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const date = new Date();
  const formattedDate = new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

  const capitalizeFirstLetter = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      style={[styles.header, { paddingTop: insets.top + spacingY._10 }]}
    >
      {/* top row */}
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            defaultSource={require('@/assets/images/icon.png')}
          />
          <View>
            <Typo size={scale(18)} fontWeight="700" color={colors.text}>
              Cash Flow
            </Typo>
            <Typo size={scale(14)} color={colors.textLighter}>
              {capitalizeFirstLetter(formattedDate)}
            </Typo>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.iconContainer}
            onPress={() => router.push('/notifications')}
          >
            <Icons.Bell size={scale(20)} color={colors.text} />
            {data.dueTodayCount > 0 && (
              <View style={styles.badge}>
                <Typo size={scale(10)} color={colors.white} style={styles.badgeText}>
                  {data.dueTodayCount > 9 ? '9+' : data.dueTodayCount}
                </Typo>
              </View>
            )}
          </Pressable>

          <Pressable
            style={styles.iconContainer}
            onPress={() => router.push('/profile')}
          >
            <Icons.UserCircle size={scale(20)} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* welcome card */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 500, delay: 100 }}
        style={styles.welcomeCard}
      >
        <View style={styles.welcomeCardContent}>
          <View>
            <Typo size={scale(22)} fontWeight="800" color={colors.white}>
              ¡Bienvenido!
            </Typo>
            <Typo size={scale(16)} color="rgba(255,255,255,0.8)">
              Tu resumen de hoy
            </Typo>
          </View>

          <View style={styles.welcomeStats}>
            <View style={styles.welcomeStatItem}>
              <Typo size={scale(14)} color="rgba(255,255,255,0.8)">
                Préstamos activos
              </Typo>
              <Typo size={scale(20)} fontWeight="700" color={colors.white}>
                {data.activeLoansCount}
              </Typo>
            </View>
            <View style={styles.welcomeStatDivider} />
            <View style={styles.welcomeStatItem}>
              <Typo size={scale(14)} color="rgba(255,255,255,0.8)">
                Pagos hoy
              </Typo>
              <Typo size={scale(20)} fontWeight="700" color={colors.white}>
                {data.dueTodayCount}
              </Typo>
            </View>
          </View>
        </View>
      </MotiView>
    </MotiView>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Main screen                                 */
/* -------------------------------------------------------------------------- */
const Dashboard = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    clientCount: 0,
    activeLoansCount: 0,
    totalLoaned: 0,
    dueTodayCount: 0,
    todaysPayments: [],
    upcomingPayments: [],
    recentActivity: [],
    isLoading: true
  });

  // Fetch real data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.uid) return;

      try {
        // Get clients count
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
        const loans = loansSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Loan[];

        // Active loans count
        const activeLoans = loans.filter(loan => loan.status === 'active');
        const activeLoansCount = activeLoans.length;

        // Total amount loaned
        const totalLoaned = loans.reduce((sum, loan) => sum + loan.amount, 0);

        // Payments due today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Today's payments
        const todaysPayments = activeLoans.filter(loan => {
          const dueDate = loan.dueDate?.toDate();
          return dueDate && isToday(dueDate);
        }).sort((a, b) => b.amount - a.amount);

        // Upcoming payments this week
        const upcomingPayments = activeLoans
          .filter(loan => {
            const dueDate = loan.dueDate?.toDate();
            return dueDate && !isToday(dueDate) && isThisWeek(dueDate);
          })
          .sort((a, b) => {
            const dateA = a.dueDate?.toDate() || new Date();
            const dateB = b.dueDate?.toDate() || new Date();
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 5);

        // Get recent payment history (simulated)
        // In a real app, you would fetch this from a payments collection
        const recentActivity = [
          ...loans.slice(0, 5).map(loan => ({
            type: 'loan' as const,
            date: loan.createdAt || Timestamp.now(),
            amount: loan.amount,
            clientName: loan.clientName,
            id: loan.id
          })),
          // Add some sample payments
          // This should be replaced with real payment data
        ].sort((a, b) => b.date.seconds - a.date.seconds).slice(0, 5);

        setDashboardData({
          clientCount: clientsCount,
          activeLoansCount,
          totalLoaned,
          dueTodayCount: todaysPayments.length,
          todaysPayments,
          upcomingPayments,
          recentActivity,
          isLoading: false
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchDashboardData();
  }, [user]);

  /* haptics */
  const triggerHaptic = () => Haptics.selectionAsync();

  const handleClientPress = (clientId: string) => {
    triggerHaptic();
    router.push(`/(client)/${clientId}`);
  };

  const handleLoanPress = (loanId: string) => {
    triggerHaptic();
    router.push(`/loans/${loanId}`);
  };

  /* loader */
  const renderLoader = () => (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ loop: true, duration: 1000, type: 'timing' }}
        style={styles.headerSkeleton}
      />
      <MotiView
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ loop: true, duration: 1000, type: 'timing' }}
        style={styles.welcomeCardSkeleton}
      />
      <View style={styles.skeletonSection}>
        {[...Array(2)].map((_, i) => (
          <MotiView
            key={i}
            from={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ loop: true, duration: 1000, type: 'timing' }}
            style={styles.skeletonButton}
          />
        ))}
      </View>
      <View style={styles.skeletonSection}>
        {[...Array(3)].map((_, i) => (
          <MotiView
            key={i}
            from={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ loop: true, duration: 1000, type: 'timing' }}
            style={styles.skeletonList}
          />
        ))}
      </View>
    </View>
  );

  /* content */
  const renderContent = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <DashboardHeader data={dashboardData} />

      <View style={styles.contentContainer}>
        {/* Financial Overview */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 600, delay: 300 }}
        >
          <View style={styles.financialHeaderRow}>
            <SectionHeader title="Resumen Financiero" />
            
            <Pressable 
              style={styles.addLoanButton}
              onPress={() => router.push('/(modals)/loanModal')}
            >
              <Icons.Plus size={scale(16)} color={colors.white} />
              <Typo size={scale(12)} color={colors.white}>Préstamo</Typo>
            </Pressable>
          </View>
          
          <View style={styles.cards}>
            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 350 }}
              style={styles.card}
            >
              <Icons.UsersThree size={scale(24)} color={colors.primary} />
              <Typo size={scale(16)} color={colors.textLighter}>
                Clientes Activos
              </Typo>
              <Typo size={scale(28)} fontWeight="700" color={colors.text}>
                {dashboardData.clientCount}
              </Typo>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 400 }}
              style={styles.card}
            >
              <Icons.CurrencyDollar size={scale(24)} color={colors.success} />
              <Typo size={scale(16)} color={colors.textLighter}>
                Total Prestado
              </Typo>
              <Typo size={scale(23)} fontWeight="700" color={colors.text} numberOfLines={1}>
                {formatCurrency(dashboardData.totalLoaned)}
              </Typo>
            </MotiView>
          </View>
        </MotiView>

        {/* Today's Payments Section */}
        {dashboardData.todaysPayments.length > 0 ? (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 500 }}
            style={styles.sectionContainer}
          >
            <SectionHeader
              title="Pagos de Hoy"
              actionText="Registrar Pago"
              onAction={() => router.push('/payments/register')}
            />

            {dashboardData.todaysPayments.map((loan, index) => (
              <MotiView
                key={loan.id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 300, delay: 500 + index * 100 }}
              >
                <Pressable
                  style={styles.paymentItem}
                  onPress={() => handleLoanPress(loan.id)}
                >
                  <View style={styles.paymentContent}>
                    <View style={[styles.paymentIcon, {backgroundColor: `${colors.warning}20`}]}>
                      <Icons.Clock size={scale(22)} color={colors.warning} weight="fill" />
                    </View>
                    <View style={styles.paymentDetails}>
                      <Typo size={scale(16)} fontWeight="600" color={colors.text}>
                        {loan.clientName}
                      </Typo>
                      <Typo size={scale(14)} color={colors.textLighter}>
                        {formatCurrency(loan.paymentAmount)}
                        {' - '}
                        <Typo size={scale(14)} color={colors.warning}>Vence hoy</Typo>
                      </Typo>
                    </View>
                  </View>

                  <View style={styles.paymentActions}>
                    <Pressable 
                      style={[styles.iconButton, { backgroundColor: colors.success + '30' }]} 
                      onPress={() => router.push(`/payments/register?loanId=${loan.id}`)}
                    >
                      <Icons.CheckCircle size={scale(20)} color={colors.success} />
                    </Pressable>
                  </View>
                </Pressable>
              </MotiView>
            ))}
          </MotiView>
        ) : (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 500 }}
            style={styles.noPaymentsContainer}
          >
            <Icons.CheckCircle size={scale(30)} color={colors.success} weight="fill" />
            <Typo color={colors.textLighter} style={styles.noPaymentsText}>
              No hay pagos programados para hoy
            </Typo>
          </MotiView>
        )}

        {/* Upcoming Payments Section */}
        {dashboardData.upcomingPayments.length > 0 && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 600 }}
            style={styles.sectionContainer}
          >
            <SectionHeader
              title="Pagos Esta Semana"
              actionText="Ver todos"
              onAction={() => router.push('/payments/due')}
            />

            {dashboardData.upcomingPayments.map((loan, index) => {
              const dueDate = loan.dueDate?.toDate();
              
              return (
                <MotiView
                  key={loan.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: 600 + index * 100 }}
                >
                  <Pressable
                    style={styles.paymentItem}
                    onPress={() => handleLoanPress(loan.id)}
                  >
                    <View style={styles.paymentContent}>
                      <View style={[styles.paymentIcon, {backgroundColor: `${colors.primary}20`}]}>
                        <Icons.CalendarBlank size={scale(22)} color={colors.primary} weight="fill" />
                      </View>
                      <View style={styles.paymentDetails}>
                        <Typo size={scale(16)} fontWeight="600" color={colors.text}>
                          {loan.clientName}
                        </Typo>
                        <View style={styles.paymentInfoRow}>
                          <Typo size={scale(14)} color={colors.textLighter}>
                            {formatCurrency(loan.paymentAmount)}
                          </Typo>
                          {dueDate && (
                            <Typo size={scale(12)} color={colors.primary} style={styles.dateChip}>
                              {format(dueDate, 'EEE d MMM', { locale: es })}
                            </Typo>
                          )}
                        </View>
                      </View>
                    </View>

                    <Icons.CaretRight size={scale(20)} color={colors.neutral400} />
                  </Pressable>
                </MotiView>
              );
            })}
          </MotiView>
        )}

        {/* Recent Activity Section */}
        {dashboardData.recentActivity.length > 0 && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 700 }}
            style={styles.sectionContainer}
          >
            <SectionHeader title="Actividad Reciente" />

            {dashboardData.recentActivity.map((activity, index) => (
              <MotiView
                key={index}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 300, delay: 700 + index * 100 }}
              >
                <Pressable
                  style={styles.activityItem}
                  onPress={() => {
                    if (activity.type === 'loan') {
                      handleLoanPress(activity.id);
                    } else {
                      // Handle payment activity
                    }
                  }}
                >
                  <View style={styles.activityContent}>
                    <View style={[
                      styles.activityIcon, 
                      {backgroundColor: activity.type === 'loan' 
                        ? `${colors.primary}20` 
                        : `${colors.success}20`
                      }
                    ]}>
                      {activity.type === 'loan' ? (
                        <Icons.CurrencyDollarSimple size={scale(22)} color={colors.primary} weight="fill" />
                      ) : (
                        <Icons.ArrowDown size={scale(22)} color={colors.success} weight="fill" />
                      )}
                    </View>
                    <View style={styles.activityDetails}>
                      <Typo size={scale(16)} fontWeight="600" color={colors.text}>
                        {activity.type === 'loan' ? 'Préstamo a ' : 'Pago de '}
                        {activity.clientName}
                      </Typo>
                      <View style={styles.activityInfoRow}>
                        <Typo size={scale(14)} 
                          color={activity.type === 'loan' ? colors.primary : colors.success}
                          fontWeight="600"
                        >
                          {formatCurrency(activity.amount)}
                        </Typo>
                        <Typo size={scale(12)} color={colors.neutral400} style={styles.activityDate}>
                          {format(activity.date.toDate(), 'dd/MM/yyyy')}
                        </Typo>
                      </View>
                    </View>
                  </View>

                  <Icons.CaretRight size={scale(20)} color={colors.neutral400} />
                </Pressable>
              </MotiView>
            ))}
          </MotiView>
        )}

        <View style={styles.bottomSpace} />
      </View>
    </ScrollView>
  );

  return (
    <ScreenWrapper>
      <StatusBar style="light" />
      {dashboardData.isLoading ? renderLoader() : renderContent()}
    </ScreenWrapper>
  );
};

export default Dashboard;

/* -------------------------------------------------------------------------- */
/*                                  Styles                                    */
/* -------------------------------------------------------------------------- */
interface Styles {
  /* View styles */
  [key: string]: ViewStyle | TextStyle | ImageStyle;
  container: ViewStyle;
  contentContainer: ViewStyle;

  header: ViewStyle;
  headerTop: ViewStyle;
  headerLeft: ViewStyle;
  headerRight: ViewStyle;
  iconContainer: ViewStyle;
  badge: ViewStyle;
  welcomeCard: ViewStyle;
  welcomeCardContent: ViewStyle;
  welcomeCardRight: ViewStyle;
  welcomeStats: ViewStyle;
  welcomeStatItem: ViewStyle;
  welcomeStatDivider: ViewStyle;
  
  financialHeaderRow: ViewStyle;
  addLoanButton: ViewStyle;
  cards: ViewStyle;
  card: ViewStyle;
  
  sectionContainer: ViewStyle;
  noPaymentsContainer: ViewStyle;
  noPaymentsText: TextStyle;

  paymentItem: ViewStyle;
  paymentContent: ViewStyle;
  paymentIcon: ViewStyle;
  paymentDetails: ViewStyle;
  paymentInfoRow: ViewStyle;
  paymentActions: ViewStyle;
  iconButton: ViewStyle;
  dateChip: TextStyle;
  
  activityItem: ViewStyle;
  activityContent: ViewStyle;
  activityIcon: ViewStyle;
  activityDetails: ViewStyle;
  activityInfoRow: ViewStyle;
  activityDate: TextStyle;

  bottomSpace: ViewStyle;

  headerSkeleton: ViewStyle;
  welcomeCardSkeleton: ViewStyle;
  skeletonSection: ViewStyle;
  skeletonButton: ViewStyle;
  skeletonList: ViewStyle;

  /* Image & text styles */
  logo: ImageStyle;
  badgeText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30,
  },
  contentContainer: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30,
  },

  /* header */
  header: {},
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
    paddingHorizontal: spacingX._20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(10),
    marginRight: spacingX._10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: colors.neutral900,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacingX._10,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: scale(10),
    width: scale(18),
    height: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.neutral950,
  },
  badgeText: { textAlign: 'center', lineHeight: scale(18) },

  welcomeCard: {
    backgroundColor: colors.primary,
    borderRadius: scale(16),
    padding: spacingY._15,
    flexDirection: 'row',
    marginBottom: spacingY._20,
    marginHorizontal: spacingX._20,
  },
  welcomeCardContent: { 
    flex: 1, 
    justifyContent: 'space-between' 
  },
  welcomeCardRight: { 
    alignItems: 'flex-end', 
    justifyContent: 'center' 
  },
  welcomeStats: { 
    flexDirection: 'row', 
    marginTop: spacingY._10 
  },
  welcomeStatItem: { flex: 1 },
  welcomeStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: spacingX._10,
  },
  
  financialHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addLoanButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacingY._7,
    paddingHorizontal: spacingX._12,
    borderRadius: radius._10,
    alignItems: 'center',
    gap: spacingX._5,
  },
  cards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacingX._10,
    marginTop: spacingY._10,
  },
  card: {
    flex: 1,
    padding: spacingY._20,
    borderRadius: scale(16),
    backgroundColor: colors.neutral900,
    gap: 5,
    alignItems: 'flex-start',
  },
  
  sectionContainer: {
    marginTop: spacingY._25,
  },
  noPaymentsContainer: {
    backgroundColor: colors.neutral900,
    padding: spacingY._20,
    borderRadius: radius._15,
    marginTop: spacingY._25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPaymentsText: {
    marginTop: spacingY._10,
    textAlign: 'center',
  },

  paymentItem: {
    backgroundColor: colors.neutral900,
    padding: spacingY._15,
    borderRadius: scale(12),
    marginTop: spacingY._10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  paymentIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacingX._10,
  },
  paymentDetails: { flex: 1 },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacingY._5,
  },
  paymentActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacingX._5 
  },
  iconButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChip: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: spacingX._7,
    paddingVertical: spacingY._5,
    borderRadius: radius._10,
    overflow: 'hidden',
  },
  
  activityItem: {
    backgroundColor: colors.neutral900,
    padding: spacingY._15,
    borderRadius: scale(12),
    marginTop: spacingY._10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  activityIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacingX._10,
  },
  activityDetails: { flex: 1 },
  activityInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacingY._5,
  },
  activityDate: {
    opacity: 0.7,
  },
  
  bottomSpace: { height: scale(80) },

  /* skeleton */
  headerSkeleton: {
    height: verticalScale(60),
    backgroundColor: colors.neutral900,
    borderRadius: scale(12),
    marginBottom: spacingY._15,
  },
  welcomeCardSkeleton: {
    height: verticalScale(140),
    backgroundColor: colors.neutral900,
    borderRadius: scale(16),
    marginBottom: spacingY._20,
  },
  skeletonSection: { 
    marginVertical: spacingY._15, 
    gap: spacingY._10 
  },
  skeletonButton: { 
    height: verticalScale(60), 
    backgroundColor: colors.neutral900, 
    borderRadius: scale(12) 
  },
  skeletonList: {
    height: verticalScale(70),
    backgroundColor: colors.neutral900,
    borderRadius: scale(12),
    marginTop: spacingY._10,
  },
});
/* -------------------------------------------------------------------------- */
/*                                  Imports                                   */
/* -------------------------------------------------------------------------- */
import {
    View,
    ScrollView,
    StyleSheet,
    Pressable,
    Dimensions,
    ViewStyle,
    TextStyle,
    ImageStyle,
    StatusBar as RNStatusBar,
  } from 'react-native';
  import React, { useState, useEffect } from 'react';
  import ScreenWrapper from '@/components/ScreenWrapper';
  import Typo from '@/components/Typo';
  import { colors, spacingX, spacingY } from '@/constants/theme';
  import SectionHeader from '@/components/SectionHeader';
  import * as Icons from 'phosphor-react-native';
  import { useRouter } from 'expo-router';
  import { MotiView } from 'moti';
  import { PieChart, LineChart } from 'react-native-chart-kit';
  import { StatusBar } from 'expo-status-bar';
  import * as Haptics from 'expo-haptics';
  import { Image } from 'react-native';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  
  /* -------------------------------------------------------------------------- */
  /*                                   Types                                    */
  /* -------------------------------------------------------------------------- */
  type QuickAction = 'newClient' | 'newLoan' | 'clients' | 'payments';
  
  /* -------------------------------------------------------------------------- */
  /*                                  Helpers                                   */
  /* -------------------------------------------------------------------------- */
  const screenWidth = Dimensions.get('window').width;
  
  const summaryDot = (color: string): ViewStyle => ({
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color,
    marginRight: 5,
  });
  
  const formatCurrency = (amount: number): string =>
    `RD$${amount.toLocaleString('es-DO')}`;
  
  /* -------------------------------------------------------------------------- */
  /*                               Dummy Data                                   */
  /* -------------------------------------------------------------------------- */
  const financialData = {
    totalLoaned: 120000,
    totalRecovered: 75000,
    pendingIncome: 45000,
    recentCollections: [12000, 15000, 9000, 18000, 14000, 20000],
  };
  
  const loansDueToday = [
    { id: '1', name: 'Juan Pérez', amount: 2000, status: 'due' as const },
    { id: '2', name: 'María López', amount: 1500, status: 'due' as const },
    { id: '3', name: 'Carlos Rodríguez', amount: 3000, status: 'overdue' as const },
    { id: '4', name: 'Ana Martínez', amount: 1000, status: 'due' as const },
    { id: '5', name: 'José Sánchez', amount: 2500, status: 'overdue' as const },
  ];
  
  /* -------------------------------------------------------------------------- */
  /*                              Header component                              */
  /* -------------------------------------------------------------------------- */
  const DashboardHeader = () => {
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
              <Typo size={18} fontWeight="700" color={colors.text}>
                Cash Flow
              </Typo>
              <Typo size={14} color={colors.textLighter}>
                {capitalizeFirstLetter(formattedDate)}
              </Typo>
            </View>
          </View>
  
          <View style={styles.headerRight}>
            <Pressable
              style={styles.iconContainer}
              onPress={() => router.push('/notifications' as never)}
            >
              <Icons.Bell size={20} color={colors.text} />
              <View style={styles.badge}>
                <Typo size={10} color={colors.white} style={styles.badgeText}>
                  3
                </Typo>
              </View>
            </Pressable>
  
            <Pressable
              style={styles.iconContainer}
              onPress={() => router.push('/profile' as never)}
            >
              <Icons.UserCircle size={20} color={colors.text} />
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
              <Typo size={22} fontWeight="800" color={colors.white}>
                ¡Bienvenido!
              </Typo>
              <Typo size={16} color="rgba(255,255,255,0.8)">
                Tu resumen de hoy
              </Typo>
            </View>
  
            <View style={styles.welcomeStats}>
              <View style={styles.welcomeStatItem}>
                <Typo size={14} color="rgba(255,255,255,0.8)">
                  Préstamos activos
                </Typo>
                <Typo size={20} fontWeight="700" color={colors.white}>
                  {loansDueToday.length}
                </Typo>
              </View>
              <View style={styles.welcomeStatDivider} />
              <View style={styles.welcomeStatItem}>
                <Typo size={14} color="rgba(255,255,255,0.8)">
                  Pagos hoy
                </Typo>
                <Typo size={20} fontWeight="700" color={colors.white}>
                  {loansDueToday.filter(l => l.status === 'due').length}
                </Typo>
              </View>
            </View>
          </View>
  
          <View style={styles.welcomeCardGraph}>
            <View style={styles.progressRing}>
              <Typo size={18} fontWeight="700" color={colors.white}>
                {Math.round((financialData.totalRecovered / financialData.totalLoaned) * 100)}%
              </Typo>
              <Typo size={12} color="rgba(255,255,255,0.8)">
                recuperado
              </Typo>
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
    const [isLoading, setIsLoading] = useState(true);
  
    /* fake loader */
    useEffect(() => {
      const t = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(t);
    }, []);
  
    /* haptics */
    const triggerHaptic = () => Haptics.selectionAsync();
  
    /* quick actions */
    const handleQuickAction = (action: QuickAction) => {
      triggerHaptic();
      switch (action) {
        case 'newClient':
          router.push('/clients/new' as never);
          break;
        case 'newLoan':
          router.push('/loans/new' as never);
          break;
        case 'clients':
          router.push('/clients' as never);
          break;
        case 'payments':
          router.push('/payments' as never);
          break;
      }
    };
  
    const handleLoanPress = (loanId: string) => {
      triggerHaptic();
      router.push(`/loans/${loanId}` as never);
    };
  
    /* pie data */
    const progressData = [
      {
        name: 'Recovered',
        amount: financialData.totalRecovered,
        color: colors.success,
        legendFontColor: colors.text,
        legendFontSize: 12,
      },
      {
        name: 'Pending',
        amount: financialData.pendingIncome,
        color: colors.warning,
        legendFontColor: colors.text,
        legendFontSize: 12,
      },
    ];
  
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
          {[...Array(4)].map((_, i) => (
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
          <MotiView
            from={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ loop: true, duration: 1000, type: 'timing' }}
            style={styles.skeletonChart}
          />
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
        <DashboardHeader />
  
        <View style={styles.contentContainer}>
          {/* Resumen financiero */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 100 }}
          >
            <SectionHeader title="Resumen Financiero" />
            <View style={styles.financialSummary}>
              <View style={styles.chartContainer}>
                <PieChart
                  data={progressData}
                  width={150}
                  height={150}
                  chartConfig={{
                    color: (o = 1) => `rgba(255,255,255,${o})`,
                    labelColor: (o = 1) => `rgba(255,255,255,${o})`,
                  }}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  absolute
                  hasLegend={false}
                />
              </View>
  
              <View style={styles.summaryDetails}>
                <View style={styles.summaryItem}>
                  <View style={summaryDot(colors.primary)} />
                  <Typo size={14} color={colors.textLighter}>
                    Total prestado:
                  </Typo>
                  <Typo size={16} fontWeight="700" color={colors.text}>
                    {formatCurrency(financialData.totalLoaned)}
                  </Typo>
                </View>
  
                <View style={styles.summaryItem}>
                  <View style={summaryDot(colors.success)} />
                  <Typo size={14} color={colors.textLighter}>
                    Total recuperado:
                  </Typo>
                  <Typo size={16} fontWeight="700" color={colors.text}>
                    {formatCurrency(financialData.totalRecovered)}
                  </Typo>
                </View>
  
                <View style={styles.summaryItem}>
                  <View style={summaryDot(colors.warning)} />
                  <Typo size={14} color={colors.textLighter}>
                    Pendiente por cobrar:
                  </Typo>
                  <Typo size={16} fontWeight="700" color={colors.text}>
                    {formatCurrency(financialData.pendingIncome)}
                  </Typo>
                </View>
              </View>
            </View>
          </MotiView>
  
          {/* Acciones rápidas */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
          >
            <SectionHeader title="Acciones Rápidas" />
            <View style={styles.quickActions}>
              {/* botones */}
              <Pressable style={styles.actionButton} onPress={() => handleQuickAction('newClient')}>
                <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                  <Icons.UserPlus size={22} color={colors.primary} weight="fill" />
                </View>
                <Typo size={14} fontWeight="600" color={colors.text}>
                  Nuevo Cliente
                </Typo>
              </Pressable>
  
              <Pressable style={styles.actionButton} onPress={() => handleQuickAction('newLoan')}>
                <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                  <Icons.CurrencyDollar size={22} color={colors.success} weight="fill" />
                </View>
                <Typo size={14} fontWeight="600" color={colors.text}>
                  Nuevo Préstamo
                </Typo>
              </Pressable>
  
              <Pressable style={styles.actionButton} onPress={() => handleQuickAction('clients')}>
                <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                  <Icons.UsersThree size={22} color={colors.warning} weight="fill" />
                </View>
                <Typo size={14} fontWeight="600" color={colors.text}>
                  Ver Clientes
                </Typo>
              </Pressable>
  
              <Pressable style={styles.actionButton} onPress={() => handleQuickAction('payments')}>
                <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                  <Icons.Receipt size={22} color="#ef4444" weight="fill" />
                </View>
                <Typo size={14} fontWeight="600" color={colors.text}>
                  Registrar Pago
                </Typo>
              </Pressable>
            </View>
          </MotiView>
  
          {/* Tarjetas vista general */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 300 }}
          >
            <SectionHeader title="Vista General" />
            <View style={styles.cards}>
              <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 600, delay: 350 }}
                style={styles.card}
              >
                <Icons.UsersThree size={24} color={colors.primary} />
                <Typo size={16} color={colors.textLighter}>
                  Clientes Activos
                </Typo>
                <Typo size={28} fontWeight="700" color={colors.text}>
                  28
                </Typo>
              </MotiView>
  
              <MotiView
                from={{ opacity: 0, translateX: 20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 600, delay: 400 }}
                style={styles.card}
              >
                <Icons.Clock size={24} color={colors.warning} />
                <Typo size={16} color={colors.textLighter}>
                  Préstamos Hoy
                </Typo>
                <Typo size={28} fontWeight="700" color={colors.text}>
                  5
                </Typo>
              </MotiView>
            </View>
          </MotiView>
  
          {/* Tendencia de cobros */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 400 }}
          >
            <SectionHeader title="Tendencia de Cobros" />
            <View style={styles.trendContainer}>
              <LineChart
                data={{
                  labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Hoy'],
                  datasets: [{ data: financialData.recentCollections }],
                }}
                width={screenWidth - spacingX._20 * 2}
                height={180}
                chartConfig={{
                  backgroundColor: colors.neutral900,
                  backgroundGradientFrom: colors.neutral900,
                  backgroundGradientTo: colors.neutral900,
                  decimalPlaces: 0,
                  color: (o = 1) => `rgba(59,130,246,${o})`,
                  labelColor: (o = 1) => `rgba(255,255,255,${o})`,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: colors.primary,
                  },
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            </View>
          </MotiView>
  
          {/* Pagos pendientes */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 500 }}
          >
            <SectionHeader
              title="Pagos Pendientes de Hoy"
              actionText="Ver todos"
              onAction={() => router.push('/payments/due' as never)}
            />
  
            {loansDueToday.map((loan, index) => (
              <MotiView
                key={loan.id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 300, delay: 500 + index * 100 }}
              >
                <Pressable
                  style={[styles.listItem, loan.status === 'overdue' && styles.overdueItem]}
                  onPress={() => handleLoanPress(loan.id)}
                >
                  <View style={styles.listItemContent}>
                    <View style={styles.listItemIcon}>
                      <Icons.User size={22} color={colors.primary} weight="fill" />
                    </View>
                    <View style={styles.listItemDetails}>
                      <Typo size={16} fontWeight="600" color={colors.text}>
                        {loan.name}
                      </Typo>
                      <Typo size={14} color={colors.textLighter}>
                        {formatCurrency(loan.amount)}{' '}
                        {loan.status === 'overdue' ? '- Atrasado' : 'vence hoy'}
                      </Typo>
                    </View>
                  </View>
  
                  <View style={styles.listItemActions}>
                    <Pressable style={styles.iconButton} onPress={triggerHaptic}>
                      <Icons.PhoneCall size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable style={styles.iconButton} onPress={triggerHaptic}>
                      <Icons.WhatsappLogo size={20} color={colors.success} />
                    </Pressable>
                  </View>
                </Pressable>
              </MotiView>
            ))}
  
            <View style={styles.bottomSpace} />
          </MotiView>
        </View>
      </ScrollView>
    );
  
    return (
      <ScreenWrapper>
        <StatusBar style="light" />
        {isLoading ? renderLoader() : renderContent()}
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
    welcomeCardGraph: ViewStyle;
    welcomeStats: ViewStyle;
    welcomeStatItem: ViewStyle;
    welcomeStatDivider: ViewStyle;
    progressRing: ViewStyle;
  
    financialSummary: ViewStyle;
    chartContainer: ViewStyle;
    summaryDetails: ViewStyle;
    summaryItem: ViewStyle;
  
    quickActions: ViewStyle;
    actionButton: ViewStyle;
    actionIconContainer: ViewStyle;
  
    cards: ViewStyle;
    card: ViewStyle;
  
    trendContainer: ViewStyle;
  
    listItem: ViewStyle;
    overdueItem: ViewStyle;
    listItemContent: ViewStyle;
    listItemIcon: ViewStyle;
    listItemDetails: ViewStyle;
    listItemActions: ViewStyle;
    iconButton: ViewStyle;
    bottomSpace: ViewStyle;
  
    headerSkeleton: ViewStyle;
    welcomeCardSkeleton: ViewStyle;
    skeletonSection: ViewStyle;
    skeletonButton: ViewStyle;
    skeletonChart: ViewStyle;
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
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    logo: {
      width: 40,
      height: 40,
      borderRadius: 10,
      marginRight: spacingX._10,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
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
      borderRadius: 10,
      width: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.neutral950,
    },
    badgeText: { textAlign: 'center', lineHeight: 18 },
  
    welcomeCard: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: spacingY._15,
      flexDirection: 'row',
      marginBottom: spacingY._20,
    },
    welcomeCardContent: { flex: 2, justifyContent: 'space-between' },
    welcomeCardGraph: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    welcomeStats: { flexDirection: 'row', marginTop: spacingY._10 },
    welcomeStatItem: { flex: 1 },
    welcomeStatDivider: {
      width: 1,
      backgroundColor: 'rgba(255,255,255,0.3)',
      marginHorizontal: spacingX._10,
    },
    progressRing: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 8,
      borderColor: 'rgba(255,255,255,0.3)',
      borderTopColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
  
    /* resumen financiero */
    financialSummary: {
      flexDirection: 'row',
      backgroundColor: colors.neutral900,
      borderRadius: 16,
      padding: spacingY._15,
      marginVertical: spacingY._10,
      alignItems: 'center',
    },
    chartContainer: { alignItems: 'center', justifyContent: 'center', width: 150 },
    summaryDetails: { flex: 1, marginLeft: spacingX._10, gap: spacingY._10 },
    summaryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingX._5,
      flexWrap: 'wrap',
    },
  
    /* quick actions */
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: spacingY._10,
      marginVertical: spacingY._10,
    },
    actionButton: {
      width: (screenWidth - spacingX._20 * 2 - spacingX._10) / 2,
      backgroundColor: colors.neutral900,
      borderRadius: 12,
      padding: spacingY._12,
      alignItems: 'center',
      gap: spacingY._7,
    },
    actionIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
  
    /* cards */
    cards: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacingX._10,
      marginTop: spacingY._10,
    },
    card: {
      flex: 1,
      padding: spacingY._20,
      borderRadius: 16,
      backgroundColor: colors.neutral900,
      gap: 5,
      alignItems: 'flex-start',
    },
  
    /* trend chart */
    trendContainer: {
      backgroundColor: colors.neutral900,
      borderRadius: 16,
      padding: spacingY._10,
      marginVertical: spacingY._10,
      alignItems: 'center',
    },
  
    /* list items */
    listItem: {
      backgroundColor: colors.neutral900,
      padding: spacingY._15,
      borderRadius: 12,
      marginTop: spacingY._10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    overdueItem: { borderLeftWidth: 4, borderLeftColor: '#ef4444' },
    listItemContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    listItemIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(59,130,246,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacingX._10,
    },
    listItemDetails: { flex: 1 },
    listItemActions: { flexDirection: 'row', alignItems: 'center', gap: spacingX._5 },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomSpace: { height: 80 },
  
    /* skeleton */
    headerSkeleton: {
      height: 60,
      backgroundColor: colors.neutral900,
      borderRadius: 12,
      marginBottom: spacingY._15,
    },
    welcomeCardSkeleton: {
      height: 140,
      backgroundColor: colors.neutral900,
      borderRadius: 16,
      marginBottom: spacingY._20,
    },
    skeletonSection: { marginVertical: spacingY._15, gap: spacingY._10 },
    skeletonButton: { height: 60, backgroundColor: colors.neutral900, borderRadius: 12 },
    skeletonChart: { height: 200, backgroundColor: colors.neutral900, borderRadius: 16 },
    skeletonList: {
      height: 70,
      backgroundColor: colors.neutral900,
      borderRadius: 12,
      marginTop: spacingY._10,
    },
  });
  
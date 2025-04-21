// app/(client)/loans.tsx
import { StyleSheet, FlatList, View, TouchableOpacity, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { getLoansByClientId } from '@/services/loanService';
import { useAuth } from '@/context/authContext';
import Loading from '@/components/Loading';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { LoanType } from '@/types';
import * as Icons from 'phosphor-react-native';
import { formatDate, formatCurrency } from '@/utils/helpers';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ClientLoans = () => {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const { user } = useAuth();
  const [loans, setLoans] = useState<LoanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchLoans = async () => {
      if (!user?.uid || !clientId) return;
      
      try {
        const result = await getLoansByClientId(clientId, user.uid);
        if (result.success) {
          setLoans(result.data as LoanType[]);
        }
      } catch (error) {
        console.log("Error fetching loans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [clientId]);

  const getStatusBadge = (status: string) => {
    let bgColor, textColor, label;
    
    switch (status) {
      case 'active':
        bgColor = 'rgba(16, 185, 129, 0.2)';
        textColor = colors.success;
        label = 'Activo';
        break;
      case 'late':
        bgColor = 'rgba(239, 68, 68, 0.2)';
        textColor = colors.danger;
        label = 'Atrasado';
        break;
      case 'completed':
        bgColor = 'rgba(107, 114, 128, 0.2)';
        textColor = colors.neutral400;
        label = 'Completado';
        break;
      default:
        bgColor = 'rgba(59, 130, 246, 0.2)';
        textColor = colors.primary;
        label = 'Desconocido';
    }
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <Typo size={12} color={textColor} fontWeight="600">
          {label}
        </Typo>
      </View>
    );
  };

  const getPaymentFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'semana';
      case 'biweekly': return 'quincena';
      case 'monthly': return 'mes';
      default: return 'periodo';
    }
  };

  const filteredLoans = filter === 'all' 
    ? loans 
    : loans.filter(loan => loan.status === filter);

  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalInterest = loans.reduce((sum, loan) => sum + loan.totalInterest, 0);
  const totalOutstanding = loans.reduce((sum, loan) => 
    loan.status !== 'completed' ? sum + loan.totalAmount : sum, 0);

  const renderItem = ({ item, index }: { item: LoanType, index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify().damping(12)}
    >
      <TouchableOpacity 
        style={styles.loanCard}
        onPress={() => router.push(`/(client)/loans/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.leftHeader}>
            <Icons.Calendar size={18} color={colors.primary} style={styles.dateIcon} />
            <Typo size={14} color={colors.neutral300}>
              {formatDate(item.createdAt)}
            </Typo>
          </View>
          {getStatusBadge(item.status)}
        </View>

        <View style={styles.amountRow}>
          <Typo size={24} fontWeight="700" color={colors.text}>
            {formatCurrency(item.amount)}
          </Typo>
          <View style={styles.interestContainer}>
            <Typo size={12} color={colors.neutral400}>Interés: {item.interestRate}%</Typo>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailColumn}>
            <Typo size={12} color={colors.neutral400}>Pago por {getPaymentFrequencyText(item.paymentFrequency)}</Typo>
            <Typo size={16} fontWeight="600" color={colors.text}>
              {formatCurrency(item.paymentAmount)}
            </Typo>
          </View>
          
          <View style={styles.detailSeparator} />
          
          <View style={styles.detailColumn}>
            <Typo size={12} color={colors.neutral400}>Plazo</Typo>
            <Typo size={16} fontWeight="600" color={colors.text}>
              {item.term} {item.term === 1 ? 'mes' : 'meses'}
            </Typo>
          </View>
          
          <View style={styles.detailSeparator} />
          
          <View style={styles.detailColumn}>
            <Typo size={12} color={colors.neutral400}>Total a pagar</Typo>
            <Typo size={16} fontWeight="700" color={colors.primary}>
              {formatCurrency(item.totalAmount)}
            </Typo>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <View style={styles.footerDetail}>
            <Icons.ClockCounterClockwise size={16} color={colors.neutral500} />
            <Typo size={12} color={colors.neutral500} style={styles.footerText}>
              {item.totalPayments} pagos
            </Typo>
          </View>
          
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Icons.Receipt size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Icons.DotsThreeVertical size={18} color={colors.neutral400} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  // Filter buttons component
  const FilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity 
        style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
        onPress={() => setFilter('all')}
      >
        <Typo 
          size={13} 
          color={filter === 'all' ? colors.white : colors.neutral400}
          fontWeight={filter === 'all' ? "600" : "400"}
        >
          Todos
        </Typo>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.filterButton, filter === 'active' && styles.activeFilter]}
        onPress={() => setFilter('active')}
      >
        <Typo 
          size={13} 
          color={filter === 'active' ? colors.white : colors.neutral400}
          fontWeight={filter === 'active' ? "600" : "400"}
        >
          Activos
        </Typo>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.filterButton, filter === 'late' && styles.activeFilter]}
        onPress={() => setFilter('late')}
      >
        <Typo 
          size={13} 
          color={filter === 'late' ? colors.white : colors.neutral400}
          fontWeight={filter === 'late' ? "600" : "400"}
        >
          Atrasados
        </Typo>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.filterButton, filter === 'completed' && styles.activeFilter]}
        onPress={() => setFilter('completed')}
      >
        <Typo 
          size={13} 
          color={filter === 'completed' ? colors.white : colors.neutral400}
          fontWeight={filter === 'completed' ? "600" : "400"}
        >
          Completados
        </Typo>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <Header 
          title="Historial de Préstamos" 
          leftIcon={<BackButton />}
        />
        <Loading />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Header 
        title="Historial de Préstamos" 
        leftIcon={<BackButton />}
        rightIcon={
          <TouchableOpacity style={styles.headerButton}>
            <Icons.Plus size={20} color={colors.primary} weight="bold" />
          </TouchableOpacity>
        }
      />
      
      <FlatList
        data={filteredLoans}
        contentContainerStyle={styles.listContainer}
        keyExtractor={(item) => item.id!}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <Animated.View 
                entering={FadeInDown.delay(100).springify()}
                style={styles.summaryRow}
              >
                <View style={styles.summaryCard}>
                  <View style={styles.summaryIconContainer}>
                    <Icons.Money size={18} color={colors.primary} />
                  </View>
                  <Typo size={12} color={colors.neutral400}>Total prestado</Typo>
                  <Typo size={18} fontWeight="700" color={colors.text}>
                    {formatCurrency(totalAmount)}
                  </Typo>
                </View>
                
                <View style={styles.summaryCard}>
                  <View style={[styles.summaryIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Icons.Swap size={18} color={colors.danger} />
                  </View>
                  <Typo size={12} color={colors.neutral400}>Total pendiente</Typo>
                  <Typo size={18} fontWeight="700" color={colors.danger}>
                    {formatCurrency(totalOutstanding)}
                  </Typo>
                </View>
              </Animated.View>
              
              <Animated.View 
                entering={FadeInDown.delay(200).springify()}
                style={[styles.summaryCard, styles.fullWidthCard]}
              >
                <View style={styles.fullWidthCardContent}>
                  <View>
                    <View style={styles.summaryIconContainer}>
                      <Icons.ChartLineUp size={18} color={colors.success} />
                    </View>
                    <Typo size={12} color={colors.neutral400}>Interés generado</Typo>
                    <Typo size={18} fontWeight="700" color={colors.success}>
                      {formatCurrency(totalInterest)}
                    </Typo>
                  </View>
                  
                  <View style={styles.loanCountContainer}>
                    <Typo size={30} fontWeight="800" color={colors.primary}>
                      {loans.length}
                    </Typo>
                    <Typo size={12} color={colors.neutral400}>
                      {loans.length === 1 ? 'Préstamo' : 'Préstamos'}
                    </Typo>
                  </View>
                </View>
              </Animated.View>
            </View>
            
            {/* Filter Buttons */}
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <FilterButtons />
            </Animated.View>
            
            {/* Section Title */}
            {filteredLoans.length > 0 && (
              <Animated.View 
                entering={FadeInDown.delay(400).springify()}
                style={styles.sectionTitleContainer}
              >
                <Typo size={16} fontWeight="600" color={colors.neutral100}>
                  {filter === 'all' 
                    ? 'Todos los préstamos' 
                    : filter === 'active' 
                      ? 'Préstamos activos' 
                      : filter === 'late' 
                        ? 'Préstamos atrasados' 
                        : 'Préstamos completados'}
                </Typo>
                <Typo size={14} color={colors.neutral400}>
                  {filteredLoans.length} {filteredLoans.length === 1 ? 'préstamo' : 'préstamos'}
                </Typo>
              </Animated.View>
            )}
          </>
        }
        ListEmptyComponent={
          <Animated.View 
            entering={FadeInDown.delay(300).springify()} 
            style={styles.emptyContainer}
          >
            <Icons.Money size={64} color={colors.neutral600} weight="thin" />
            <Typo size={18} fontWeight="600" color={colors.neutral300} style={styles.emptyTitle}>
              No hay préstamos{filter !== 'all' ? ' ' + filter : ''}
            </Typo>
            <Typo size={14} color={colors.neutral500} style={styles.emptyText}>
              No se encontraron préstamos {filter !== 'all' ? 'con este estado' : 'registrados'}.
            </Typo>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push({
                pathname: '/(modals)/loanModal',
                params: { clientId }
              })}
            >
              <Icons.Plus size={16} color={colors.white} />
              <Typo size={14} color={colors.white} fontWeight="600">
                Crear Nuevo Préstamo
              </Typo>
            </TouchableOpacity>
          </Animated.View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30,
  },
  loanCard: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    marginBottom: spacingY._15,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._12,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: spacingX._5,
  },
  statusBadge: {
    paddingHorizontal: spacingX._10,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  interestContainer: {
    backgroundColor: colors.neutral800,
    paddingHorizontal: spacingX._10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    borderRadius: radius._10,
    padding: spacingY._10,
    marginBottom: spacingY._15,
  },
  detailColumn: {
    flex: 1,
    alignItems: 'center',
  },
  detailSeparator: {
    width: 1,
    height: '70%',
    backgroundColor: colors.neutral700,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    marginLeft: spacingX._5,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 5,
    marginLeft: spacingX._5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  emptyTitle: {
    marginTop: spacingY._15,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacingY._5,
    marginBottom: spacingY._20,
    maxWidth: 250,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    borderRadius: radius._10,
    gap: spacingX._7,
  },
  summaryContainer: {
    marginBottom: spacingY._20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacingX._10,
    marginBottom: spacingY._10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    paddingHorizontal: spacingX._15,
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  fullWidthCard: {
    flex: undefined,
    width: '100%',
  },
  fullWidthCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanCountContainer: {
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacingY._5,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: spacingY._20,
    backgroundColor: colors.neutral900,
    padding: 4,
    borderRadius: radius._10,
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacingY._7,
    borderRadius: radius._6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 50,
  },
});

export default ClientLoans;
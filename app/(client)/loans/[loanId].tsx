// app/(client)/loans/[loanId].tsx - Updates to integrate the payment summary
// This is a partial update focusing on integrating the PaymentSummary component

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, View } from 'react-native';
import { LoanType } from '@/types';
import { getLoanById, updateLoan } from '@/services/loanService';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import Loading from '@/components/Loading';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { formatDate, formatCurrency } from '@/utils/helpers';
import * as Icons from 'phosphor-react-native';
import { AnimatePresence } from 'moti';
import { scale, verticalScale } from '@/utils/styling';
// Import the PaymentSummary component
import PaymentSummary from '@/components/PaymentSummary';

const LoanDetail = () => {
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const router = useRouter();
  const [loan, setLoan] = useState<LoanType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch loan data
  const fetchLoan = useCallback(async () => {
    try {
      if (!loanId) return;
      
      const result = await getLoanById(loanId as string);
      if (result.success) {
        setLoan(result.data as LoanType);
      } else {
        Alert.alert('Error', 'No se pudo cargar el préstamo');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al cargar los datos del préstamo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loanId]);

  // Initial load
  useEffect(() => {
    fetchLoan();
  }, [fetchLoan]);

  // Refresh loan data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchLoan();
  };

  // Current loan status display
  const getLoanStatusDisplay = useMemo(() => {
    if (!loan) return { label: 'ACTIVO', color: colors.success };
    
    switch(loan.status) {
      case 'active':
        return { label: 'ACTIVO', color: colors.success };
      case 'late':
        return { label: 'EN MORA', color: colors.danger };
      case 'completed':
        return { label: 'COMPLETADO', color: colors.primary };
      default:
        return { label: 'INACTIVO', color: colors.neutral400 };
    }
  }, [loan]);

  // Loan progress calculation
  const loanProgress = useMemo(() => {
    if (!loan || !loan.totalAmount || !loan.paidAmount) return 0;
    return Math.min(100, Math.max(0, (loan.paidAmount / loan.totalAmount) * 100));
  }, [loan]);

  if (loading) return (
    <ScreenWrapper style={styles.loadingContainer}>
      <Loading />
    </ScreenWrapper>
  );

  return (
    <ScreenWrapper style={styles.wrapper}>
      <Header
        title="Detalle del Préstamo"
        titleSize={20}
        leftIcon={<BackButton />}
        rightIcon={(
          <TouchableOpacity 
          onPress={() => router.push(`/loans/payments?loanId=${loanId}`)}
            style={styles.headerButton}
          >
            <Icons.Receipt size={scale(20)} color={colors.white} />
          </TouchableOpacity>
        )}
      />

      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Loan Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.statusContainer}>
              {loan?.status === 'active' ? (
                <Icons.CheckCircle size={scale(18)} color={colors.success} />
              ) : loan?.status === 'late' ? (
                <Icons.Warning size={scale(18)} color={colors.danger} />
              ) : loan?.status === 'completed' ? (
                <Icons.Trophy size={scale(18)} color={colors.primary} />
              ) : (
                <Icons.Clock size={scale(18)} color={colors.neutral400} />
              )}
              <Typo 
                style={styles.statusText} 
                color={getLoanStatusDisplay.color}
                size={scale(14)}
                fontWeight="600"
              >
                {getLoanStatusDisplay.label}
              </Typo>
            </View>
            <Typo color={colors.neutral400} size={scale(12)}>
              ID: {loanId?.substring(0, 8)}...
            </Typo>
          </View>
          
          <View style={styles.amountContainer}>
            <Typo color={colors.neutral400} size={scale(14)}>Monto Total</Typo>
            <Typo size={scale(32)} fontWeight="700" color={colors.white} style={styles.amountText}>
              {formatCurrency(loan!.amount)}
            </Typo>
            <View style={styles.dateContainer}>
              <Icons.CalendarBlank size={scale(14)} color={colors.neutral400} />
              <Typo color={colors.neutral400} size={scale(12)} style={{marginLeft: 5}}>
                Fecha de inicio: {formatDate(loan!.startDate)}
              </Typo>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${loanProgress}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <Typo size={scale(12)} color={colors.neutral400}>Progreso</Typo>
              <Typo size={scale(12)} fontWeight="600">{loanProgress.toFixed(0)}%</Typo>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStatItem}>
            <Typo color={colors.neutral400} size={scale(12)}>Pago Mensual</Typo>
            <Typo size={scale(18)} fontWeight="700" color={colors.white}>
              {formatCurrency(loan!.paymentAmount)}
            </Typo>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.quickStatItem}>
            <Typo color={colors.neutral400} size={scale(12)}>Saldo Pendiente</Typo>
            <Typo size={scale(18)} fontWeight="700" color={colors.white}>
              {formatCurrency(loan!.remainingBalance || loan!.totalAmount || loan!.amount)}
            </Typo>
          </View>
        </View>

        {/* Payment Summary Component */}
        <PaymentSummary loan={loan!} onRefresh={handleRefresh} />

        {/* Loan Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typo style={styles.sectionTitle}>Detalles del Préstamo</Typo>
            <TouchableOpacity 
              onPress={() => router.push(`/loans/${loanId}/edit`)}
              style={styles.sectionEditButton}
            >
              <Icons.PencilLine size={scale(16)} color={colors.primary} />
              <Typo color={colors.primary} size={scale(12)} style={{marginLeft: 5}}>Editar</Typo>
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Icons.Percent size={scale(18)} color={colors.primary} />
              <Typo color={colors.neutral400} size={scale(12)}>Tasa de Interés</Typo>
              <Typo fontWeight="600" size={scale(16)}>{loan!.interestRate}%</Typo>
            </View>
            
            <View style={styles.detailItem}>
              <Icons.Calendar size={scale(18)} color={colors.primary} />
              <Typo color={colors.neutral400} size={scale(12)}>Plazo</Typo>
              <Typo fontWeight="600" size={scale(16)}>{loan!.term || "12"} meses</Typo>
            </View>
            
            <View style={styles.detailItem}>
              <Icons.ClockCounterClockwise size={scale(18)} color={colors.primary} />
              <Typo color={colors.neutral400} size={scale(12)}>Frecuencia</Typo>
              <Typo fontWeight="600" size={scale(16)}>
                {loan!.paymentFrequency === 'weekly' ? 'Semanal' : 
                 loan!.paymentFrequency === 'biweekly' ? 'Quincenal' : 'Mensual'}
              </Typo>
            </View>
            
            <View style={styles.detailItem}>
              <Icons.Wallet size={scale(18)} color={colors.primary} />
              <Typo color={colors.neutral400} size={scale(12)}>Pagos Totales</Typo>
              <Typo fontWeight="600" size={scale(16)}>{loan!.totalPayments}</Typo>
            </View>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Typo style={styles.sectionTitle}>Resumen Financiero</Typo>
          
          <View style={styles.financialSummary}>
            <View style={styles.financialItem}>
              <Typo color={colors.neutral400} size={scale(12)}>Monto Préstamo</Typo>
              <Typo fontWeight="600" size={scale(16)}>{formatCurrency(loan!.amount)}</Typo>
            </View>
            
            <View style={styles.financialDivider} />
            
            <View style={styles.financialItem}>
              <Typo color={colors.neutral400} size={scale(12)}>Interés Total</Typo>
              <Typo fontWeight="600" size={scale(16)}>{formatCurrency(loan!.totalInterest || 0)}</Typo>
            </View>
            
            <View style={styles.financialDivider} />
            
            <View style={styles.financialItem}>
              <Typo color={colors.neutral400} size={scale(12)}>Total a Pagar</Typo>
              <Typo fontWeight="600" size={scale(16)}>{formatCurrency(loan!.totalAmount || 0)}</Typo>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Floating action button for making payments */}
      <TouchableOpacity 
        style={styles.fabButton}
        onPress={() => router.push(`/loans/makepayment?loanId=${loanId}`)}
      >
        <Icons.Plus size={scale(24)} color={colors.white} />
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

export default LoanDetail;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.neutral950,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral950,
  },
  container: {
    padding: spacingX._15,
    paddingBottom: spacingY._40,
  },
  headerButton: {
    backgroundColor: colors.primary,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  summaryCard: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._20,
    padding: spacingY._20,
    marginBottom: spacingY._15,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: spacingX._10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    marginLeft: spacingX._7,
  },
  amountContainer: {
    marginBottom: spacingY._20,
  },
  amountText: {
    marginVertical: spacingY._5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: spacingY._7,
  },
  progressBar: {
    height: verticalScale(8),
    backgroundColor: colors.neutral800,
    borderRadius: verticalScale(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: verticalScale(4),
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacingY._7,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    marginBottom: spacingY._15,
    padding: spacingY._15,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.neutral800,
  },
  section: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._20,
    marginBottom: spacingY._17,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._17,
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: colors.white,
  },
  sectionEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingX._10,
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: spacingY._10,
    backgroundColor: colors.neutral800,
    borderRadius: radius._15,
    padding: spacingY._15,
    alignItems: 'flex-start',
    gap: 5,
  },
  financialSummary: {
    flexDirection: 'row',
    backgroundColor: colors.neutral800,
    borderRadius: radius._15,
    padding: spacingY._15,
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  financialDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.neutral700,
  },
  fabButton: {
    position: 'absolute',
    bottom: spacingY._20,
    right: spacingX._20,
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
});
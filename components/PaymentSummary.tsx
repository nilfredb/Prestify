// components/PaymentSummary.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/utils/helpers';
import * as Icons from 'phosphor-react-native';
import { scale, verticalScale } from '@/utils/styling';
import { getPaymentsByLoanId } from '@/services/paymentService';
import { PaymentType, LoanType } from '@/types';

interface PaymentSummaryProps {
  loan: LoanType;
  onRefresh?: () => void;
}

const PaymentSummary = ({ loan, onRefresh }: PaymentSummaryProps) => {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPayments();
  }, [loan]);
  
  const fetchPayments = async () => {
    try {
      setLoading(true);
      if (!loan?.id) return;
      
      const result = await getPaymentsByLoanId(loan.id);
      if (result.success && result.data) {
        setPayments(result.data as PaymentType[]);
      }
    } catch (error) {
      console.log('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate summary data
  const confirmedPayments = payments.filter(p => p.status === 'confirmed');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  
  const totalConfirmed = confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // Get latest 3 payments
  const recentPayments = [...payments].sort((a, b) => {
    return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
  }).slice(0, 3);
  
  // Payment methods icons mapping
  const PAYMENT_METHOD_ICONS = {
    cash: <Icons.Money size={scale(16)} color={colors.primary} />,
    bank_transfer: <Icons.Bank size={scale(16)} color={colors.primary} />,
    card: <Icons.CreditCard size={scale(16)} color={colors.primary} />,
    other: <Icons.Wallet size={scale(16)} color={colors.primary} />,
  };
  
  // Payment status colors
  const PAYMENT_STATUS_COLORS = {
    pending: colors.warning,
    confirmed: colors.success,
    rejected: colors.danger,
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typo style={styles.title}>Pagos del Préstamo</Typo>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => {
            if (loan?.id) {
                router.push(`/loans/payments?loanId=${loan.id}`);
            }
          }}
        >
          <Typo color={colors.primary} size={scale(12)}>Ver todos</Typo>
          <Icons.ArrowRight size={scale(14)} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Payment summary stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Typo color={colors.neutral400} size={scale(12)}>Total Pagado</Typo>
          <Typo fontWeight="600" size={scale(18)} color={colors.success}>
            {formatCurrency(totalConfirmed)}
          </Typo>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Typo color={colors.neutral400} size={scale(12)}>Pagos Pendientes</Typo>
          <Typo fontWeight="600" size={scale(18)} color={colors.warning}>
            {formatCurrency(totalPending)}
          </Typo>
        </View>
      </View>
      
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabel}>
          <Typo color={colors.neutral400} size={scale(12)}>Progreso del Préstamo</Typo>
          <Typo size={scale(12)}>
            {loan.totalAmount 
              ? `${Math.min(100, Math.round((totalConfirmed / loan.totalAmount) * 100))}%` 
              : '0%'}
          </Typo>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: loan.totalAmount 
                  ? `${Math.min(100, (totalConfirmed / loan.totalAmount) * 100)}%` 
                  : '0%',
              }
            ]} 
          />
        </View>
      </View>
      
      {/* Recent payments list */}
      <View style={styles.recentPaymentsContainer}>
        <Typo color={colors.neutral400} size={scale(12)} style={styles.recentPaymentsTitle}>
          Pagos Recientes
        </Typo>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : recentPayments.length > 0 ? (
          <>
            {recentPayments.map((payment, index) => (
              <View key={payment.id || index} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <View style={styles.paymentMethod}>
                    {PAYMENT_METHOD_ICONS[payment.paymentMethod as keyof typeof PAYMENT_METHOD_ICONS] || PAYMENT_METHOD_ICONS.other}
                    <Typo size={scale(14)}>{formatDate(payment.paymentDate)}</Typo>
                  </View>
                  <Typo fontWeight="600">{formatCurrency(payment.amount)}</Typo>
                </View>
                <View style={[
                  styles.paymentStatus, 
                  { backgroundColor: PAYMENT_STATUS_COLORS[payment.status as keyof typeof PAYMENT_STATUS_COLORS] }
                ]}>
                  <Typo size={scale(10)} color={colors.white}>
                    {payment.status === 'confirmed' ? 'Confirmado' : 
                     payment.status === 'pending' ? 'Pendiente' : 
                     'Rechazado'}
                  </Typo>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Icons.Receipt size={scale(24)} color={colors.neutral600} />
            <Typo color={colors.neutral400} size={scale(14)} style={styles.emptyText}>
              No hay pagos registrados
            </Typo>
          </View>
        )}
      </View>
      
      {/* Make payment button */}
      <TouchableOpacity 
        style={styles.makePaymentButton}
        onPress={() => {
          if (loan?.id) {
            router.push(`/loans/makepayment?loanId=${loan.id}`);
          }
        }}
      >
        <Icons.Plus size={scale(16)} color={colors.white} />
        <Typo color={colors.white} fontWeight="600">Registrar Nuevo Pago</Typo>
      </TouchableOpacity>
    </View>
  );
};

export default PaymentSummary;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    marginBottom: spacingY._15,
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
    paddingBottom: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  title: {
    fontSize: scale(16),
    fontWeight: '600',
    color: colors.white,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    padding: spacingY._12,
    marginBottom: spacingY._15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.neutral700,
  },
  progressContainer: {
    marginBottom: spacingY._15,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacingY._5,
  },
  progressBar: {
    height: verticalScale(8),
    backgroundColor: colors.neutral800,
    borderRadius: radius._6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: radius._6,
  },
  recentPaymentsContainer: {
    marginBottom: spacingY._15,
  },
  recentPaymentsTitle: {
    marginBottom: spacingY._10,
  },
  loadingContainer: {
    padding: spacingY._15,
    alignItems: 'center',
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  paymentStatus: {
    paddingHorizontal: spacingX._10,
    paddingVertical: 4,
    borderRadius: radius._10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacingY._20,
  },
  emptyText: {
    marginTop: spacingY._10,
  },
  makePaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacingY._12,
    borderRadius: radius._12,
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
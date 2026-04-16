// app/(client)/loans/[loanId]/payments.tsx - Updated with Payment Action Modal
import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenWrapper from '@/components/ScreenWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/utils/helpers';
import * as Icons from 'phosphor-react-native';
import { scale, verticalScale } from '@/utils/styling';
import { LoanType, PaymentType } from '@/types';
import { getLoanById } from '@/services/loanService';
import { getPaymentsByLoanId, deletePayment } from '@/services/paymentService';
import { Image } from 'expo-image';
import PaymentActionModal from '@/components/PaymentActionModal';

// Payment methods icons mapping
const PAYMENT_METHOD_ICONS = {
  cash: <Icons.Money size={scale(16)} color={colors.primary} />,
  bank_transfer: <Icons.Bank size={scale(16)} color={colors.primary} />,
  card: <Icons.CreditCard size={scale(16)} color={colors.primary} />,
  other: <Icons.Wallet size={scale(16)} color={colors.primary} />,
};

// Payment methods labels
const PAYMENT_METHOD_LABELS = {
  cash: 'Efectivo',
  bank_transfer: 'Transferencia',
  card: 'Tarjeta',
  other: 'Otro',
};

// Payment status colors
const PAYMENT_STATUS_COLORS = {
  pending: colors.warning,
  confirmed: colors.success,
  rejected: colors.danger,
};

const PaymentItem = ({ 
  payment, 
  onPress 
}: { 
  payment: PaymentType, 
  onPress: () => void
}) => {
  return (
    <TouchableOpacity 
      style={styles.paymentItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.paymentDate}>
          {PAYMENT_METHOD_ICONS[payment.paymentMethod as keyof typeof PAYMENT_METHOD_ICONS] || PAYMENT_METHOD_ICONS.other}
          <Typo size={scale(14)}>{formatDate(payment.paymentDate)}</Typo>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: PAYMENT_STATUS_COLORS[payment.status as keyof typeof PAYMENT_STATUS_COLORS] }]}>
          <Typo size={scale(12)} color={colors.white} style={{textTransform: 'capitalize'}}>
            {payment.status === 'pending' ? 'Pendiente' :
             payment.status === 'confirmed' ? 'Confirmado' : 'Rechazado'}
          </Typo>
        </View>
      </View>
      
      <View style={styles.paymentContent}>
        <View>
          <Typo color={colors.neutral400} size={scale(12)}>Monto</Typo>
          <Typo fontWeight="600" size={scale(16)}>{formatCurrency(payment.amount)}</Typo>
        </View>
        
        <View>
          <Typo color={colors.neutral400} size={scale(12)}>Método</Typo>
          <Typo size={scale(14)}>{PAYMENT_METHOD_LABELS[payment.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS]}</Typo>
        </View>
      </View>
      
      <View style={styles.paymentActions}>
        {payment.receiptImage && (
          <View style={styles.receiptIndicator}>
            <Icons.Image size={scale(14)} color={colors.primary} />
            <Typo size={scale(12)} color={colors.primary}>Comprobante</Typo>
          </View>
        )}
        
        {payment.status === 'pending' && (
          <View style={styles.pendingIndicator}>
            <Icons.ClockClockwise size={scale(14)} color={colors.warning} />
            <Typo size={scale(12)} color={colors.warning}>Pendiente de confirmar</Typo>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const PaymentHistory = () => {
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const router = useRouter();
  const [loan, setLoan] = useState<LoanType | null>(null);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentType | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch loan data
      const loanResult = await getLoanById(loanId as string);
      if (loanResult.success && loanResult.data) {
        setLoan(loanResult.data as LoanType);
      }
      
      // Fetch payments
      const paymentsResult = await getPaymentsByLoanId(loanId as string);
      if (paymentsResult.success && paymentsResult.data) {
        setPayments(paymentsResult.data as PaymentType[]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos del préstamo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loanId]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };
  
  // Filter payments based on status
  const filteredPayments = filterStatus
    ? payments.filter(payment => payment.status === filterStatus)
    : payments;
  
  // Stats for summary
  const totalPaid = payments
    .filter(payment => payment.status === 'confirmed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  
  const pendingPayments = payments
    .filter(payment => payment.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);
  
  // Handle payment selection
  const handlePaymentPress = (payment: PaymentType) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };
  
  if (loading && !refreshing) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <Header
          title="Historial de Pagos"
          leftIcon={<BackButton />}
        />
        <Loading />
      </ScreenWrapper>
    );
  }
  
  return (
    <ScreenWrapper style={styles.wrapper}>
      <Header
        title="Historial de Pagos"
        leftIcon={<BackButton />}
        rightIcon={
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push(`/loans/makepayment?loanId=${loanId}`)}
          >
            <Icons.Plus size={scale(20)} color={colors.white} />
          </TouchableOpacity>
        }
      />
      
      {/* Payment Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Typo color={colors.neutral400} size={scale(12)}>Total Pagado</Typo>
          <Typo size={scale(24)} fontWeight="700" color={colors.success}>
            {formatCurrency(totalPaid)}
          </Typo>
          {loan && (
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${loan?.totalAmount ? Math.min(100, (totalPaid / loan.totalAmount) * 100) : 0}%`,
                    backgroundColor: colors.success
                  }
                ]} 
              />
            </View>
          )}
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icons.ClockCounterClockwise size={scale(16)} color={colors.warning} />
            <Typo color={colors.neutral400} size={scale(12)}>Pendiente</Typo>
            <Typo fontWeight="600">{formatCurrency(pendingPayments)}</Typo>
          </View>
          
          <View style={styles.statItem}>
            <Icons.Wallet size={scale(16)} color={colors.primary} />
            <Typo color={colors.neutral400} size={scale(12)}>Restante</Typo>
            <Typo fontWeight="600">{loan ? formatCurrency(loan.totalAmount - totalPaid) : 'N/A'}</Typo>
          </View>
          
          <View style={styles.statItem}>
            <Icons.CheckCircle size={scale(16)} color={colors.success} />
            <Typo color={colors.neutral400} size={scale(12)}>Completado</Typo>
            <Typo fontWeight="600">{loan?.totalAmount ? `${Math.min(100, Math.round((totalPaid / loan.totalAmount) * 100))}%` : 'N/A'}</Typo>
          </View>
        </View>
      </View>
      
      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === null && styles.activeFilter]}
          onPress={() => setFilterStatus(null)}
        >
          <Typo 
            size={scale(13)} 
            color={filterStatus === null ? colors.primary : colors.neutral400}
          >
            Todos
          </Typo>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'confirmed' && styles.activeFilter]}
          onPress={() => setFilterStatus('confirmed')}
        >
          <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
          <Typo 
            size={scale(13)} 
            color={filterStatus === 'confirmed' ? colors.primary : colors.neutral400}
          >
            Confirmados
          </Typo>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'pending' && styles.activeFilter]}
          onPress={() => setFilterStatus('pending')}
        >
          <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
          <Typo 
            size={scale(13)} 
            color={filterStatus === 'pending' ? colors.primary : colors.neutral400}
          >
            Pendientes
          </Typo>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'rejected' && styles.activeFilter]}
          onPress={() => setFilterStatus('rejected')}
        >
          <View style={[styles.statusDot, { backgroundColor: colors.danger }]} />
          <Typo 
            size={scale(13)} 
            color={filterStatus === 'rejected' ? colors.primary : colors.neutral400}
          >
            Rechazados
          </Typo>
        </TouchableOpacity>
      </View>
      
      {/* Payments List */}
      {filteredPayments.length > 0 ? (
        <FlatList
          data={filteredPayments}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={({ item }) => (
            <PaymentItem
              payment={item}
              onPress={() => handlePaymentPress(item)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icons.ClipboardText size={scale(48)} color={colors.neutral600} />
          <Typo color={colors.neutral400} style={{ marginTop: spacingY._15, textAlign: 'center' }}>
            {filterStatus
              ? `No hay pagos ${filterStatus === 'confirmed' ? 'confirmados' : 
                 filterStatus === 'pending' ? 'pendientes' : 
                 'rechazados'}`
              : 'No hay pagos registrados para este préstamo'}
          </Typo>
          <Button 
            style={styles.emptyButton}
            onPress={() => router.push(`/makepayment?loanId=${loanId}`)}
          >
            <Icons.Plus size={scale(18)} color={colors.white} />
            <Typo color={colors.white}>Registrar Pago</Typo>
          </Button>
        </View>
      )}
      
      {/* Payment Action Modal */}
      <PaymentActionModal
        visible={showPaymentModal}
        payment={selectedPayment}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayment(null);
        }}
        onPaymentUpdated={fetchData}
      />
    </ScreenWrapper>
  );
};

export default PaymentHistory;

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
  addButton: {
    backgroundColor: colors.primary,
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    padding: spacingX._15,
  },
  summaryCard: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    marginBottom: spacingY._15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  progressBar: {
    height: verticalScale(6),
    backgroundColor: colors.neutral800,
    borderRadius: radius._10,
    width: '100%',
    marginTop: spacingY._10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius._10,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    marginBottom: spacingY._15,
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacingY._10,
    gap: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacingX._15,
    marginBottom: spacingY._15,
    gap: spacingX._10,
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral900,
    borderRadius: radius._20,
    paddingVertical: spacingY._7,
    paddingHorizontal: spacingX._12,
    borderWidth: 1,
    borderColor: colors.neutral800,
    gap: 6,
  },
  activeFilter: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listContainer: {
    paddingHorizontal: spacingX._15,
    paddingBottom: spacingY._20,
  },
  paymentItem: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._12,
    marginBottom: spacingY._10,
    borderWidth: 1,
    borderColor: colors.neutral800,
    padding: spacingY._15,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._10,
    paddingBottom: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  paymentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: spacingX._10,
    paddingVertical: 4,
    borderRadius: radius._10,
  },
  paymentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacingY._10,
  },
  paymentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacingX._10,
    marginTop: spacingY._5,
  },
  receiptIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingX._20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacingY._20,
    gap: 8,
  },
});
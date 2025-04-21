// components/PaymentActionModal.tsx
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/utils/helpers';
import * as Icons from 'phosphor-react-native';
import { scale, verticalScale } from '@/utils/styling';
import { PaymentType } from '@/types';
import { confirmPayment, rejectPayment } from '@/services/paymentService';

interface PaymentActionModalProps {
  visible: boolean;
  payment: PaymentType | null;
  onClose: () => void;
  onPaymentUpdated: () => void;
}

const PaymentActionModal = ({ 
  visible, 
  payment, 
  onClose, 
  onPaymentUpdated 
}: PaymentActionModalProps) => {
  const [loading, setLoading] = useState(false);
  
  if (!payment) return null;
  
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'bank_transfer': return 'Transferencia';
      case 'card': return 'Tarjeta';
      default: return 'Otro';
    }
  };
  
  const handleConfirmPayment = async () => {
    if (!payment.id) return;
    
    try {
      setLoading(true);
      const result = await confirmPayment(payment.id);
      
      if (result.success) {
        Alert.alert('Éxito', 'Pago confirmado correctamente');
        onPaymentUpdated();
        onClose();
      } else {
        Alert.alert('Error', result.msg || 'No se pudo confirmar el pago');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al confirmar el pago');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRejectPayment = async () => {
    if (!payment.id) return;
    
    Alert.alert(
      'Rechazar Pago',
      '¿Estás seguro que deseas rechazar este pago?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Rechazar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await rejectPayment(payment.id!);
              
              if (result.success) {
                Alert.alert('Éxito', 'Pago rechazado correctamente');
                onPaymentUpdated();
                onClose();
              } else {
                Alert.alert('Error', result.msg || 'No se pudo rechazar el pago');
              }
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un error al rechazar el pago');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={50} tint="dark" style={styles.container}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Typo size={scale(18)} fontWeight="600">Detalles del Pago</Typo>
            <TouchableOpacity onPress={onClose}>
              <Icons.X size={scale(24)} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.paymentDetails}>
            <View style={styles.amountContainer}>
              <Typo color={colors.neutral400} size={scale(14)}>Monto del Pago</Typo>
              <Typo size={scale(30)} fontWeight="700" color={colors.primary}>
                {formatCurrency(payment.amount)}
              </Typo>
            </View>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Icons.Calendar size={scale(18)} color={colors.primary} />
                <Typo color={colors.neutral400} size={scale(12)}>Fecha</Typo>
                <Typo size={scale(14)} fontWeight="600">{formatDate(payment.paymentDate)}</Typo>
              </View>
              
              <View style={styles.detailItem}>
                <Icons.CreditCard size={scale(18)} color={colors.primary} />
                <Typo color={colors.neutral400} size={scale(12)}>Método</Typo>
                <Typo size={scale(14)} fontWeight="600">
                  {getPaymentMethodText(payment.paymentMethod || 'other')}
                </Typo>
              </View>
              
              <View style={styles.detailItem}>
                <Icons.ClockCounterClockwise size={scale(18)} color={colors.primary} />
                <Typo color={colors.neutral400} size={scale(12)}>Estado</Typo>
                <View style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: 
                      payment.status === 'confirmed' ? 'rgba(16, 185, 129, 0.2)' : 
                      payment.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 
                      'rgba(245, 158, 11, 0.2)'
                  }
                ]}>
                  <Typo 
                    size={scale(12)} 
                    color={
                      payment.status === 'confirmed' ? colors.success : 
                      payment.status === 'rejected' ? colors.danger : 
                      colors.warning
                    }
                  >
                    {payment.status === 'confirmed' ? 'Confirmado' : 
                     payment.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                  </Typo>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <Icons.ClockClockwise size={scale(18)} color={colors.primary} />
                <Typo color={colors.neutral400} size={scale(12)}>Creado</Typo>
                <Typo size={scale(14)} fontWeight="600">{formatDate(payment.createdAt)}</Typo>
              </View>
            </View>
            
            {payment.notes && (
              <View style={styles.notesContainer}>
                <Typo color={colors.neutral400} size={scale(12)}>Notas</Typo>
                <View style={styles.notes}>
                  <Typo size={scale(14)}>{payment.notes}</Typo>
                </View>
              </View>
            )}
            
            {payment.receiptImage && (
              <View style={styles.receiptContainer}>
                <Typo color={colors.neutral400} size={scale(12)} style={styles.receiptLabel}>
                  Comprobante
                </Typo>
                <Image
                  source={{ uri: payment.receiptImage }}
                  style={styles.receiptImage}
                  contentFit="cover"
                />
              </View>
            )}
          </View>
          
          {payment.status === 'pending' && (
            <View style={styles.actionButtons}>
              <Button
                style={styles.rejectButton}
                onPress={handleRejectPayment}
                disabled={loading}
              >
                <Typo color={colors.white}>Rechazar</Typo>
              </Button>
              
              <Button
                style={styles.confirmButton}
                onPress={handleConfirmPayment}
                loading={loading}
              >
                <Typo color={colors.white}>Confirmar Pago</Typo>
              </Button>
            </View>
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

export default PaymentActionModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingX._20,
  },
  modalContent: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._20,
    width: '100%',
    maxHeight: '80%',
    padding: spacingY._20,
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
  paymentDetails: {
    marginBottom: spacingY._20,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: spacingY._20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingX._10,
    marginBottom: spacingY._15,
  },
  detailItem: {
    width: '48%',
    marginBottom: spacingY._10,
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    padding: spacingY._10,
    alignItems: 'flex-start',
    gap: 3,
  },
  statusBadge: {
    paddingHorizontal: spacingX._7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  notesContainer: {
    marginBottom: spacingY._15,
  },
  notes: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    padding: spacingY._10,
    marginTop: spacingY._5,
  },
  receiptContainer: {
    marginBottom: spacingY._15,
  },
  receiptLabel: {
    marginBottom: spacingY._5,
  },
  receiptImage: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: radius._12,
    backgroundColor: colors.neutral800,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacingX._10,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.danger,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.success,
  },
});
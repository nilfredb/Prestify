// app/(client)/loans/[loanId]/make-payment.tsx
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import Typo from '@/components/Typo';
import Input from '@/components/Input';
import Button from '@/components/Button';
import * as Icons from 'phosphor-react-native';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { createPayment } from '@/services/paymentService';
import { getLoanById } from '@/services/loanService';
import { LoanType, PaymentType } from '@/types';
import { scale, verticalScale } from '@/utils/styling';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import CustomAlert from '@/components/CustomAlert';
import { useAuth } from '@/context/authContext';

// Define props interface for CustomDatePicker
interface CustomDatePickerProps {
  date: Date;
  onChange: (newDate: Date) => void;
  visible: boolean;
  onClose: () => void;
}

// Custom date picker to avoid native module issues
const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ date, onChange, visible, onClose }) => {
  if (!visible) return null;
  
  // Simple date picker - current month calendar
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  // Get day names
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  return (
    <View style={styles.datePickerOverlay}>
      <View style={styles.datePickerContainer}>
        <View style={styles.datePickerHeader}>
          <Typo size={16} fontWeight="600">Seleccionar Fecha</Typo>
          <TouchableOpacity onPress={onClose}>
            <Icons.X size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
        
        {/* Month and year */}
        <View style={styles.monthYearContainer}>
          <Typo size={16} fontWeight="500">
            {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </Typo>
        </View>
        
        {/* Days of week */}
        <View style={styles.daysOfWeekContainer}>
          {dayNames.map((day, index) => (
            <View key={index} style={styles.dayNameCell}>
              <Typo size={12} color={colors.neutral400}>{day}</Typo>
            </View>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {/* Empty cells for days before the 1st */}
          {Array(firstDayOfMonth).fill(null).map((_, index) => (
            <View key={`empty-${index}`} style={styles.dateCell} />
          ))}
          
          {/* Day cells */}
          {days.map((day) => {
            const thisDate = new Date(currentYear, currentMonth, day);
            const isSelected = date && 
                              thisDate.getDate() === date.getDate() && 
                              thisDate.getMonth() === date.getMonth() && 
                              thisDate.getFullYear() === date.getFullYear();
            const isToday = thisDate.getDate() === currentDate.getDate() && 
                           thisDate.getMonth() === currentDate.getMonth() && 
                           thisDate.getFullYear() === currentDate.getFullYear();
            
            return (
              <TouchableOpacity 
                key={day} 
                style={[
                  styles.dateCell, 
                  isSelected && styles.selectedDateCell,
                  isToday && styles.todayCell
                ]}
                onPress={() => {
                  const newDate = new Date(currentYear, currentMonth, day);
                  onChange(newDate);
                }}
              >
                <Typo 
                  color={isSelected ? colors.white : isToday ? colors.primary : colors.text}
                  fontWeight={isSelected || isToday ? '600' : '400'}
                >
                  {day}
                </Typo>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={styles.datePickerActions}>
          <Button 
            style={styles.cancelDateButton}
            onPress={onClose}
          >
            <Typo color={colors.neutral300}>Cancelar</Typo>
          </Button>
          <Button
            style={styles.confirmDateButton}
            onPress={onClose}
          >
            <Typo color={colors.white}>Confirmar</Typo>
          </Button>
        </View>
      </View>
    </View>
  );
};

interface PaymentFormData {
  amount: string;
  paymentDate: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'other';
  notes: string;
  receiptImage: any;
}

const MakePayment = () => {
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loan, setLoan] = useState<LoanType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning'
  });
  
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    paymentDate: new Date(),
    paymentMethod: 'cash',
    notes: '',
    receiptImage: null,
  });

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        if (!loanId) return;
        
        const result = await getLoanById(loanId as string);
        if (result.success && result.data) {
          const loanData = result.data as LoanType;
          setLoan(loanData);
          
          // Pre-fill the payment amount with the loan's payment amount
          setFormData(prev => ({
            ...prev,
            amount: loanData.paymentAmount ? loanData.paymentAmount.toString() : ''
          }));
        } else {
          showAlert('Error', 'No se pudo cargar la información del préstamo', 'error');
        }
      } catch (error) {
        console.log('Error fetching loan:', error);
        showAlert('Error', 'Error al cargar los datos del préstamo', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLoan();
  }, [loanId]);

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setAlertState({
      visible: true,
      title,
      message,
      type
    });
  };

  const closeAlert = () => {
    setAlertState({ ...alertState, visible: false });
  };

  const handlePaymentMethodChange = (method: PaymentFormData['paymentMethod']) => {
    setFormData({ ...formData, paymentMethod: method });
  };

  const handleDateChange = (newDate: Date) => {
    setFormData({ ...formData, paymentDate: newDate });
    setShowDatePicker(false);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setFormData({ ...formData, receiptImage: result.assets[0] });
      }
    } catch (error) {
      console.log('Error picking image:', error);
      showAlert('Error', 'No se pudo seleccionar la imagen', 'warning');
    }
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showAlert('Validación', 'Ingresa un monto válido mayor a 0', 'warning');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !loan) return;
    
    setSubmitting(true);
    
    try {
      // Create payment object - Remove clientId field as it doesn't exist in PaymentType
      const paymentData: Partial<PaymentType> = {
        loanId: loanId as string,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        receiptImage: formData.receiptImage,
        status: 'pending', // Initial status is pending
        uid: user?.uid, // Associate with current user
      };
      
      // Submit payment
      const result = await createPayment(paymentData);
      
      if (result.success) {
        showAlert('Éxito', 'Pago registrado correctamente', 'success');
        
        // Navigate back after short delay
        setTimeout(() => {
            router.replace(`/loans/payments?loanId=${loanId}`);
        }, 1500);
      } else {
        showAlert('Error', result.msg || 'Hubo un problema al registrar el pago', 'error');
      }
    } catch (error: any) {
      console.log('Error creating payment:', error);
      showAlert('Error', 'Error al registrar el pago', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <Header 
          title="Realizar Pago" 
          leftIcon={<BackButton />}
        />
        <View style={styles.loadingContainer}>
          <Typo>Cargando información del préstamo...</Typo>
        </View>
      </ScreenWrapper>
    );
  }

  if (!loan) {
    return (
      <ScreenWrapper>
        <Header 
          title="Realizar Pago" 
          leftIcon={<BackButton />}
        />
        <View style={styles.errorContainer}>
          <Icons.Warning size={48} color={colors.danger} />
          <Typo style={{ marginTop: spacingY._10 }}>
            No se pudo cargar la información del préstamo
          </Typo>
          <Button 
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Typo color={colors.white}>Volver</Typo>
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Header 
          title="Realizar Pago" 
          leftIcon={<BackButton />}
        />
        
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Loan Info Card */}
          <Animated.View 
            entering={FadeInDown.delay(100).springify()}
            style={styles.loanInfoCard}
          >
            <View style={styles.loanInfoHeader}>
              <Typo size={16} fontWeight="600" color={colors.white}>
                Información del Préstamo
              </Typo>
              <View style={[
                styles.statusBadge, 
                { 
                  backgroundColor: loan.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 
                                   loan.status === 'late' ? 'rgba(239, 68, 68, 0.2)' : 
                                   'rgba(107, 114, 128, 0.2)' 
                }
              ]}>
                <Typo size={12} color={
                  loan.status === 'active' ? colors.success : 
                  loan.status === 'late' ? colors.danger : 
                  colors.neutral400
                }>
                  {loan.status === 'active' ? 'Activo' : 
                   loan.status === 'late' ? 'En mora' : 
                   loan.status === 'completed' ? 'Completado' : 'Inactivo'}
                </Typo>
              </View>
            </View>
            
            <View style={styles.loanInfoBody}>
              <View style={styles.loanInfoItem}>
                <Typo color={colors.neutral400} size={12}>Monto del Préstamo</Typo>
                <Typo fontWeight="600" size={16}>
                  {formatCurrency(loan.amount)}
                </Typo>
              </View>
              
              <View style={styles.loanInfoItem}>
                <Typo color={colors.neutral400} size={12}>Pago Mensual</Typo>
                <Typo fontWeight="600" size={16}>
                  {formatCurrency(loan.paymentAmount)}
                </Typo>
              </View>
              
              <View style={styles.loanInfoItem}>
                <Typo color={colors.neutral400} size={12}>Próximo Pago</Typo>
                <Typo fontWeight="600" size={16}>
                  {formatDate(loan.nextPaymentDate || new Date())}
                </Typo>
              </View>
              
              <View style={styles.loanInfoItem}>
                <Typo color={colors.neutral400} size={12}>Saldo Pendiente</Typo>
                <Typo fontWeight="600" size={16}>
                  {formatCurrency(loan.remainingBalance || loan.totalAmount || loan.amount)}
                </Typo>
              </View>
            </View>
          </Animated.View>
          
          {/* Payment Form */}
          <Animated.View 
            entering={FadeInDown.delay(200).springify()}
            style={styles.formCard}
          >
            <View style={styles.cardHeader}>
              <Icons.CurrencyDollar size={22} color={colors.primary} weight="fill" />
              <Typo size={16} fontWeight="600" color={colors.white}>
                Detalles del Pago
              </Typo>
            </View>
            
            <View style={styles.formContainer}>
              {/* Amount */}
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Icons.Money size={16} color={colors.primary} />
                  <Typo color={colors.neutral300}>Monto del Pago *</Typo>
                </View>
                <Input
                  placeholder="Cantidad"
                  value={formData.amount}
                  onChangeText={(value) => setFormData({ ...formData, amount: value.replace(/[^0-9.]/g, '') })}
                  keyboardType="numeric"
                  containerStyle={styles.inputContainer}
                />
              </View>
              
              {/* Payment Date */}
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Icons.Calendar size={16} color={colors.primary} />
                  <Typo color={colors.neutral300}>Fecha de Pago</Typo>
                </View>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Typo>{formatDate(formData.paymentDate)}</Typo>
                  <Icons.CalendarBlank size={16} color={colors.neutral400} />
                </TouchableOpacity>
                
                {/* Custom date picker instead of DateTimePicker */}
                <CustomDatePicker
                  date={formData.paymentDate}
                  onChange={handleDateChange}
                  visible={showDatePicker}
                  onClose={() => setShowDatePicker(false)}
                />
              </View>
              
              {/* Payment Method */}
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Icons.CreditCard size={16} color={colors.primary} />
                  <Typo color={colors.neutral300}>Método de Pago</Typo>
                </View>
                <View style={styles.paymentMethodContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodOption,
                      formData.paymentMethod === 'cash' && styles.activePaymentMethod
                    ]}
                    onPress={() => handlePaymentMethodChange('cash')}
                  >
                    <Icons.Money size={18} color={formData.paymentMethod === 'cash' ? colors.white : colors.neutral400} />
                    <Typo 
                      size={12} 
                      color={formData.paymentMethod === 'cash' ? colors.white : colors.neutral400}
                      style={{fontWeight: formData.paymentMethod === 'cash' ? '600' : '400'}}
                    >
                      Efectivo
                    </Typo>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodOption,
                      formData.paymentMethod === 'bank_transfer' && styles.activePaymentMethod
                    ]}
                    onPress={() => handlePaymentMethodChange('bank_transfer')}
                  >
                    <Icons.Bank size={18} color={formData.paymentMethod === 'bank_transfer' ? colors.white : colors.neutral400} />
                    <Typo 
                      size={12} 
                      color={formData.paymentMethod === 'bank_transfer' ? colors.white : colors.neutral400}
                      style={{fontWeight: formData.paymentMethod === 'bank_transfer' ? '600' : '400'}}
                    >
                      Transferencia
                    </Typo>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodOption,
                      formData.paymentMethod === 'card' && styles.activePaymentMethod
                    ]}
                    onPress={() => handlePaymentMethodChange('card')}
                  >
                    <Icons.CreditCard size={18} color={formData.paymentMethod === 'card' ? colors.white : colors.neutral400} />
                    <Typo 
                      size={12} 
                      color={formData.paymentMethod === 'card' ? colors.white : colors.neutral400}
                      style={{fontWeight: formData.paymentMethod === 'card' ? '600' : '400'}}
                    >
                      Tarjeta
                    </Typo>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodOption,
                      formData.paymentMethod === 'other' && styles.activePaymentMethod
                    ]}
                    onPress={() => handlePaymentMethodChange('other')}
                  >
                    <Icons.Wallet size={18} color={formData.paymentMethod === 'other' ? colors.white : colors.neutral400} />
                    <Typo 
                      size={12} 
                      color={formData.paymentMethod === 'other' ? colors.white : colors.neutral400}
                      style={{fontWeight: formData.paymentMethod === 'other' ? '600' : '400'}}
                    >
                      Otro
                    </Typo>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Notes */}
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Icons.TextT size={16} color={colors.primary} />
                  <Typo color={colors.neutral300}>Notas</Typo>
                </View>
                <Input
                  placeholder="Notas o comentarios sobre el pago"
                  value={formData.notes}
                  onChangeText={(value) => setFormData({ ...formData, notes: value })}
                  multiline
                  numberOfLines={3}
                  style={styles.notesInput}
                  containerStyle={styles.inputContainer}
                />
              </View>
              
              {/* Receipt Image */}
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Icons.Image size={16} color={colors.primary} />
                  <Typo color={colors.neutral300}>Comprobante de Pago</Typo>
                </View>
                
                {formData.receiptImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: formData.receiptImage.uri }}
                      style={styles.imagePreview}
                      contentFit="cover"
                    />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => setFormData({ ...formData, receiptImage: null })}
                    >
                      <Icons.X size={16} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.imagePickerButton}
                    onPress={pickImage}
                  >
                    <Icons.Image size={24} color={colors.primary} />
                    <Typo color={colors.neutral300} style={{ marginTop: spacingY._10 }}>
                      Agregar imagen del comprobante
                    </Typo>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>
          
          {/* Payment Confirmation */}
          {formData.amount && parseFloat(formData.amount) > 0 && (
            <Animated.View 
              entering={FadeInDown.delay(300).springify()}
              style={styles.confirmationCard}
            >
              <View style={styles.cardHeader}>
                <Icons.CheckCircle size={22} color={colors.success} weight="fill" />
                <Typo size={16} fontWeight="600" color={colors.white}>
                  Confirmación
                </Typo>
              </View>
              
              <View style={styles.confirmationContainer}>
                <Typo size={14} color={colors.neutral400}>
                  Está registrando un pago de:
                </Typo>
                <Typo size={24} fontWeight="700" color={colors.success} style={{ marginVertical: spacingY._10 }}>
                  {formatCurrency(parseFloat(formData.amount))}
                </Typo>
                <Typo size={14} color={colors.neutral300}>
                  Este pago se registrará con fecha {formatDate(formData.paymentDate)} y quedará en estado "Pendiente" hasta que sea confirmado por un administrador.
                </Typo>
              </View>
            </Animated.View>
          )}
        </ScrollView>
        
        <Animated.View 
          entering={FadeInDown.delay(400).springify()}
          style={styles.footer}
        >
          <Button
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Typo color={colors.neutral300}>Cancelar</Typo>
          </Button>
          
          <Button
            style={styles.saveButton}
            onPress={handleSubmit}
            loading={submitting}
            disabled={!formData.amount || parseFloat(formData.amount) <= 0}
          >
            <Typo color={colors.white} fontWeight="600">
              Registrar Pago
            </Typo>
          </Button>
        </Animated.View>
        
        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          onClose={closeAlert}
          type={alertState.type}
        />
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default MakePayment;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingX._20,
  },
  errorButton: {
    marginTop: spacingY._20,
    paddingHorizontal: spacingX._30,
  },
  loanInfoCard: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    marginVertical: spacingY._15,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  loanInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
    paddingBottom: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  statusBadge: {
    paddingHorizontal: spacingX._10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  loanInfoBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  loanInfoItem: {
    width: '48%',
    marginBottom: spacingY._15,
  },
  formCard: {
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
    alignItems: 'center',
    marginBottom: spacingY._15,
    paddingBottom: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
    gap: spacingX._10,
  },
  formContainer: {
    gap: spacingY._15,
  },
  inputGroup: {
    gap: spacingY._7,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._7,
  },
  inputContainer: {
    backgroundColor: colors.neutral800,
    borderColor: colors.neutral700,
    borderRadius: radius._12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    borderColor: colors.neutral700,
    borderWidth: 1,
    borderRadius: radius._12,
    padding: spacingY._12,
    paddingHorizontal: spacingX._15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacingY._10,
  },
  paymentMethodOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    padding: spacingY._12,
    gap: spacingX._7,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  activePaymentMethod: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: verticalScale(10),
  },
  imagePickerButton: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    borderWidth: 1,
    borderColor: colors.neutral700,
    borderStyle: 'dashed',
    padding: spacingY._20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: radius._12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: radius._12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationCard: {
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
  confirmationContainer: {
    alignItems: 'center',
    padding: spacingY._10,
  },
  footer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    backgroundColor: colors.neutral950,
    borderTopWidth: 1,
    borderTopColor: colors.neutral900,
    gap: spacingX._10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.neutral900,
    borderWidth: 1,
    borderColor: colors.neutral700,
    borderRadius: radius._12,
  },
  saveButton: {
    flex: 2,
    borderRadius: radius._12,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  // Custom date picker styles
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    width: '90%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
    paddingBottom: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  monthYearContainer: {
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    marginBottom: spacingY._5,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacingY._5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacingY._10,
  },
  dateCell: {
    width: '14.28%',
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  selectedDateCell: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacingY._10,
    gap: spacingX._10,
  },
  cancelDateButton: {
    flex: 1,
    backgroundColor: colors.neutral800,
  },
  confirmDateButton: {
    flex: 1,
  },
});
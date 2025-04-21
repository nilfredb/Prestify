// app/(modals)/loanModal.tsx
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Animated as RNAnimated, StatusBar } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import ModalWrapper from '@/components/ModalWrapper';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Typo from '@/components/Typo';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/context/authContext';
import * as Icon from 'phosphor-react-native';
import { getClientById, getClients } from '@/services/clientService';
import Loading from '@/components/Loading';
import CustomAlert from '@/components/CustomAlert';
import { ClientType } from '@/types';
import { createLoan } from '@/services/loanService';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { getProfileImage } from '@/services/imageServices';
import { BlurView } from 'expo-blur';
import { scale, verticalScale } from '@/utils/styling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface LoanFormData {
  amount: string;
  interestRate: string;
  term: string;
  paymentFrequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: Date;
  description: string;
}

interface ClientOption {
  id: string;
  name: string;
  image: any;
  status: string;
}

const LoanModal = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const clientId = params.clientId as string;
  const insets = useSafeAreaInsets();
  
  const [client, setClient] = useState<ClientType | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingClient, setFetchingClient] = useState(!!clientId);
  const [fetchingClients, setFetchingClients] = useState(!clientId);
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning'
  });
  
  const [formData, setFormData] = useState<LoanFormData>({
    amount: '',
    interestRate: '10', // Default interest rate
    term: '1',
    paymentFrequency: 'monthly',
    startDate: new Date(),
    description: '',
  });

  // Client selection states
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<ClientOption[]>([]);
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const translateYAnim = useRef(new RNAnimated.Value(500)).current;

  // Fetch client data and available clients
  useEffect(() => {
    // Always fetch available clients for selection
    fetchAvailableClients();
    
    // If clientId is provided, fetch that specific client
    if (clientId) {
      fetchClientById(clientId);
    }
  }, [clientId]);

  // Filter clients based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clientOptions);
    } else {
      const filtered = clientOptions.filter(client => 
        client.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clientOptions]);

  const fetchClientById = async (id: string) => {
    try {
      setFetchingClient(true);
      const result = await getClientById(id);
      if (result.success && result.data) {
        setClient(result.data as ClientType);
      } else {
        showAlert('Error', result.msg || 'No se pudo cargar la información del cliente', 'error');
      }
    } catch (error: any) {
      console.log('Error fetching client:', error);
      showAlert('Error', 'Error al cargar los datos del cliente', 'error');
    } finally {
      setFetchingClient(false);
    }
  };

  const fetchAvailableClients = async () => {
    if (!user?.uid) return;
    
    try {
      setFetchingClients(true);
      const result = await getClients(user.uid);
      
      if (result.success && result.data) {
        const clients = result.data.map((client: any) => ({
          id: client.id,
          name: client.name || 'Sin nombre',
          image: client.image || null,
          status: client.status || 'Activo'
        }));
        
        setClientOptions(clients);
        setFilteredClients(clients);
      } else {
        showAlert('Error', 'No se pudieron cargar los clientes', 'error');
      }
    } catch (error) {
      console.log('Error fetching clients:', error);
      showAlert('Error', 'Error al cargar los clientes', 'error');
    } finally {
      setFetchingClients(false);
    }
  };

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

  const toggleClientSelector = () => {
    if (showClientSelector) {
      // Hide the selector with animation
      RNAnimated.parallel([
        RNAnimated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateYAnim, {
          toValue: 500,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setShowClientSelector(false);
      });
    } else {
      // Show the selector with animation
      setShowClientSelector(true);
      RNAnimated.parallel([
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateYAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const selectClient = (selectedClient: ClientOption) => {
    fetchClientById(selectedClient.id);
    toggleClientSelector();
  };

  const handleFrequencyChange = (frequency: 'weekly' | 'biweekly' | 'monthly') => {
    setFormData({ ...formData, paymentFrequency: frequency });
  };

  const validateForm = () => {
    if (!client) {
      showAlert('Validación', 'Debes seleccionar un cliente', 'warning');
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showAlert('Validación', 'Ingresa un monto válido mayor a 0', 'warning');
      return false;
    }
    
    if (!formData.interestRate) {
      showAlert('Validación', 'Ingresa una tasa de interés válida', 'warning');
      return false;
    }
    
    if (!formData.term || parseInt(formData.term) <= 0) {
      showAlert('Validación', 'Ingresa un plazo válido mayor a 0', 'warning');
      return false;
    }
    
    return true;
  };

  const calculatePaymentDetails = () => {
    const amount = parseFloat(formData.amount) || 0;
    const interestRate = parseFloat(formData.interestRate) / 100; // Convert percentage to decimal
    const term = parseInt(formData.term) || 1;
    
    // Calculate number of payments based on payment frequency
    let paymentsPerYear;
    switch (formData.paymentFrequency) {
      case 'weekly':
        paymentsPerYear = 52;
        break;
      case 'biweekly':
        paymentsPerYear = 26;
        break;
      case 'monthly':
      default:
        paymentsPerYear = 12;
        break;
    }
    
    const totalPayments = term * (formData.paymentFrequency === 'monthly' ? 1 : (paymentsPerYear / 12));
    const totalInterest = amount * interestRate * term;
    const totalAmount = amount + totalInterest;
    const paymentAmount = totalAmount / totalPayments;
    
    return {
      paymentAmount: paymentAmount.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      totalPayments: Math.round(totalPayments),
    };
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user?.uid || !client?.id) return;
    
    setLoading(true);
    
    try {
      const paymentDetails = calculatePaymentDetails();
      
      const loanData = {
        clientId: client.id,
        amount: parseFloat(formData.amount),
        interestRate: parseFloat(formData.interestRate),
        term: parseInt(formData.term),
        paymentFrequency: formData.paymentFrequency,
        startDate: formData.startDate,
        description: formData.description,
        paymentAmount: parseFloat(paymentDetails.paymentAmount),
        totalInterest: parseFloat(paymentDetails.totalInterest),
        totalAmount: parseFloat(paymentDetails.totalAmount),
        totalPayments: paymentDetails.totalPayments,
        status: 'active' as const,
        uid: user.uid,
        createdAt: new Date(),
      };
      
      const result = await createLoan(loanData);
      
      if (result.success) {
        showAlert('Éxito', 'Préstamo creado correctamente', 'success');
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        showAlert('Error', result.msg || 'Hubo un problema al crear el préstamo', 'error');
      }
    } catch (error: any) {
      console.log('Error creating loan:', error);
      showAlert('Error', 'Hubo un problema al crear el préstamo', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Only show full loading screen when we're fetching initial client data
  if ((clientId && fetchingClient) || (!clientId && fetchingClients && clientOptions.length === 0)) {
    return (
      <ModalWrapper>
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      </ModalWrapper>
    );
  }

  // Calculate payment details for the summary
  const paymentDetails = calculatePaymentDetails();

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'semanal';
      case 'biweekly': return 'quincenal';
      case 'monthly': return 'mensual';
      default: return '';
    }
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'activo': return 'rgba(22, 163, 74, 0.3)';
      case 'en mora': return 'rgba(202, 138, 4, 0.3)';
      case 'inactivo': return 'rgba(220, 38, 38, 0.3)';
      default: return colors.neutral700;
    }
  };

  return (
    <ModalWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Header
            title="Nuevo Préstamo"
            leftIcon={<BackButton />}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Client Selection Button */}
            <Animated.View
              entering={FadeInDown.delay(50).springify()}
              style={styles.clientSelectorContainer}
            >
              {client ? (
                // Selected Client Display
                <TouchableOpacity 
                  style={styles.selectedClientCard}
                  onPress={toggleClientSelector}
                >
                  <View style={styles.selectedClientInfo}>
                    <Image
                      source={getProfileImage(client.image)}
                      style={styles.clientAvatar}
                      contentFit="cover"
                    />
                    <View style={styles.clientTextInfo}>
                      <Typo size={16} color={colors.white} style={{fontWeight: '600'}}>
                        {client.name}
                      </Typo>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(client.status || '') }]}>
                        <Typo size={12} color={colors.white}>
                          {client.status || 'Activo'}
                        </Typo>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.changeClientButton}
                    onPress={toggleClientSelector}
                  >
                    <Typo size={12} color={colors.primary}>Cambiar</Typo>
                    <Icon.CaretDown size={14} color={colors.primary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                // No Client Selected - Selector Button
                <TouchableOpacity 
                  style={styles.selectClientButton}
                  onPress={toggleClientSelector}
                >
                  <Icon.User size={24} color={colors.primary} />
                  <Typo color={colors.white} style={{marginLeft: 10}}>
                    Seleccionar Cliente
                  </Typo>
                  <Icon.CaretDown size={14} color={colors.primary} style={{marginLeft: 'auto'}} />
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Loan Form - Only show if client is selected */}
            {client && (
              <>
                <Animated.View 
                  entering={FadeInDown.delay(200).springify()}
                  style={styles.formCard}
                >
                  <View style={styles.cardHeader}>
                    <Icon.Money size={22} color={colors.primary} weight="fill" />
                    <Typo size={18} style={{fontWeight: '600'}} color={colors.neutral100}>Información del préstamo</Typo>
                  </View>
                  
                  <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                      <View style={styles.labelContainer}>
                        <Icon.CurrencyDollar size={16} color={colors.primary} />
                        <Typo color={colors.neutral200}>Monto del Préstamo *</Typo>
                      </View>
                      <Input
                        placeholder="Cantidad"
                        value={formData.amount}
                        onChangeText={(value) => setFormData({ ...formData, amount: value.replace(/[^0-9.]/g, '') })}
                        keyboardType="numeric"
                        containerStyle={styles.inputContainer}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <View style={styles.labelContainer}>
                        <Icon.Percent size={16} color={colors.primary} />
                        <Typo color={colors.neutral200}>Tasa de Interés (%) *</Typo>
                      </View>
                      <Input
                        placeholder="Porcentaje"
                        value={formData.interestRate}
                        onChangeText={(value) => setFormData({ ...formData, interestRate: value.replace(/[^0-9.]/g, '') })}
                        keyboardType="numeric"
                        containerStyle={styles.inputContainer}
                      />
                    </View>

                    <View style={styles.row}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <View style={styles.labelContainer}>
                          <Icon.Calendar size={16} color={colors.primary} />
                          <Typo color={colors.neutral200}>Plazo (meses) *</Typo>
                        </View>
                        <Input
                          placeholder="Duración"
                          value={formData.term}
                          onChangeText={(value) => setFormData({ ...formData, term: value.replace(/[^0-9]/g, '') })}
                          keyboardType="numeric"
                          containerStyle={styles.inputContainer}
                        />
                      </View>

                      <View style={[styles.inputGroup, { flex: 1, marginLeft: spacingX._15 }]}>
                        <View style={styles.labelContainer}>
                          <Icon.ClockCounterClockwise size={16} color={colors.primary} />
                          <Typo color={colors.neutral200}>Frecuencia</Typo>
                        </View>
                        <View style={styles.frequencyContainer}>
                          <TouchableOpacity
                            style={[
                              styles.frequencyOption,
                              formData.paymentFrequency === 'monthly' && styles.activeFrequency
                            ]}
                            onPress={() => handleFrequencyChange('monthly')}
                          >
                            <Typo
                              size={12}
                              color={formData.paymentFrequency === 'monthly' ? colors.white : colors.neutral400}
                              style={{fontWeight: formData.paymentFrequency === 'monthly' ? '600' : '400'}}
                            >
                              Mensual
                            </Typo>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.frequencyOption,
                              formData.paymentFrequency === 'biweekly' && styles.activeFrequency
                            ]}
                            onPress={() => handleFrequencyChange('biweekly')}
                          >
                            <Typo
                              size={12}
                              color={formData.paymentFrequency === 'biweekly' ? colors.white : colors.neutral400}
                              style={{fontWeight: formData.paymentFrequency === 'biweekly' ? '600' : '400'}}
                            >
                              Quincenal
                            </Typo>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.frequencyOption,
                              formData.paymentFrequency === 'weekly' && styles.activeFrequency
                            ]}
                            onPress={() => handleFrequencyChange('weekly')}
                          >
                            <Typo
                              size={12}
                              color={formData.paymentFrequency === 'weekly' ? colors.white : colors.neutral400}
                              style={{fontWeight: formData.paymentFrequency === 'weekly' ? '600' : '400'}}
                            >
                              Semanal
                            </Typo>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <View style={styles.labelContainer}>
                        <Icon.TextT size={16} color={colors.primary} />
                        <Typo color={colors.neutral200}>Descripción</Typo>
                      </View>
                      <Input
                        placeholder="Descripción o propósito del préstamo"
                        value={formData.description}
                        onChangeText={(value) => setFormData({ ...formData, description: value })}
                        multiline
                        numberOfLines={3}
                        style={styles.descriptionInput}
                        containerStyle={styles.inputContainer}
                      />
                    </View>
                  </View>
                </Animated.View>

                {/* Loan Summary */}
                {formData.amount && formData.interestRate && formData.term ? (
                  <Animated.View 
                    entering={FadeInDown.delay(300).springify()}
                    style={styles.summaryCard}
                  >
                    <View style={styles.cardHeader}>
                      <Icon.Calculator size={22} color={colors.primary} weight="fill" />
                      <Typo size={18} style={{fontWeight: '600'}} color={colors.neutral100}>
                        Resumen del Préstamo
                      </Typo>
                    </View>
                    
                    <View style={styles.summaryContent}>
                      {/* Loan amount and total */}
                      <View style={styles.summaryAmountContainer}>
                        <View style={styles.summaryAmountItem}>
                          <Typo size={13} color={colors.neutral400}>Préstamo</Typo>
                          <Typo size={22} style={{fontWeight: '700'}} color={colors.text}>
                            ${parseFloat(formData.amount || "0").toFixed(2)}
                          </Typo>
                        </View>
                        
                        <View style={styles.summaryArrow}>
                          <Icon.ArrowRight size={20} color={colors.neutral600} />
                        </View>
                        
                        <View style={styles.summaryAmountItem}>
                          <Typo size={13} color={colors.neutral400}>Total a pagar</Typo>
                          <Typo size={22} style={{fontWeight: '700'}} color={colors.primary}>
                            ${paymentDetails.totalAmount}
                          </Typo>
                        </View>
                      </View>
                      
                      {/* Divider */}
                      <View style={styles.summaryDivider} />
                      
                      {/* Payment details */}
                      <View style={styles.paymentGrid}>
                        <View style={styles.paymentGridItem}>
                          <View style={styles.paymentIconContainer}>
                            <Icon.ClockCounterClockwise size={16} color={colors.primary} />
                          </View>
                          <Typo size={12} color={colors.neutral400}>Pago {getFrequencyLabel(formData.paymentFrequency)}</Typo>
                          <Typo size={16} style={{fontWeight: '600'}} color={colors.text}>
                            ${paymentDetails.paymentAmount}
                          </Typo>
                        </View>
                        
                        <View style={styles.paymentGridItem}>
                          <View style={styles.paymentIconContainer}>
                            <Icon.ListNumbers size={16} color={colors.primary} />
                          </View>
                          <Typo size={12} color={colors.neutral400}>Número de pagos</Typo>
                          <Typo size={16} style={{fontWeight: '600'}} color={colors.text}>
                            {paymentDetails.totalPayments}
                          </Typo>
                        </View>
                        
                        <View style={styles.paymentGridItem}>
                          <View style={styles.paymentIconContainer}>
                            <Icon.Percent size={16} color={colors.primary} />
                          </View>
                          <Typo size={12} color={colors.neutral400}>Interés total</Typo>
                          <Typo size={16} style={{fontWeight: '600'}} color={colors.text}>
                            ${paymentDetails.totalInterest}
                          </Typo>
                        </View>
                        
                        <View style={styles.paymentGridItem}>
                          <View style={styles.paymentIconContainer}>
                            <Icon.Money size={16} color={colors.primary} />
                          </View>
                          <Typo size={12} color={colors.neutral400}>Interés (%)</Typo>
                          <Typo size={16} style={{fontWeight: '600'}} color={colors.text}>
                            {formData.interestRate}%
                          </Typo>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ) : null}
              </>
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
              <Typo color={colors.neutral200}>Cancelar</Typo>
            </Button>
            
            <Button
              style={styles.saveButton}
              onPress={handleSubmit}
              loading={loading}
              disabled={!client}
            >
              <Typo color={colors.white} style={{fontWeight: '600'}}>
                Crear Préstamo
              </Typo>
            </Button>
          </Animated.View>
        </View>

        {/* Client Selector Modal */}
                  {/* Client Selector Modal - Always render but hide when not active */}
          <RNAnimated.View 
            style={[
              styles.clientSelectorModal,
              { opacity: fadeAnim, zIndex: showClientSelector ? 1000 : -1 }
            ]}
          >
            <BlurView intensity={90} style={styles.blurView} tint="dark">
              <View style={styles.clientSelectorContent}>
                <View style={styles.clientSelectorHeader}>
                  <Typo size={scale(18)} color={colors.white} style={{fontWeight: 'bold'}}>
                    Seleccionar Cliente
                  </Typo>
                  <TouchableOpacity onPress={toggleClientSelector}>
                    <Icon.X size={scale(24)} color={colors.white} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.searchInputContainer}>
                  <Icon.MagnifyingGlass size={scale(18)} color={colors.neutral400} style={styles.searchIcon} />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerStyle={styles.searchInput}
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                      <Icon.X size={scale(16)} color={colors.neutral400} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                
                <ScrollView style={styles.clientList} showsVerticalScrollIndicator={false}>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <TouchableOpacity
                        key={client.id}
                        style={styles.clientOption}
                        onPress={() => selectClient(client)}
                      >
                        <Image
                          source={getProfileImage(client.image)}
                          style={styles.clientOptionImage}
                          contentFit="cover"
                        />
                        <View style={styles.clientOptionInfo}>
                          <Typo color={colors.white}>{client.name}</Typo>
                          <View 
                            style={[
                              styles.clientStatusBadge, 
                              { backgroundColor: getStatusColor(client.status) }
                            ]}
                          >
                            <Typo size={10} color={colors.white}>
                              {client.status}
                            </Typo>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noClientsContainer}>
                      <Icon.Users size={scale(36)} color={colors.neutral600} />
                      <Typo color={colors.neutral400} style={{marginTop: verticalScale(10)}}>
                        {clientOptions.length === 0 
                          ? 'No tienes clientes registrados' 
                          : 'No se encontraron resultados'}
                      </Typo>
                    </View>
                  )}
                </ScrollView>
              </View>
            </BlurView>
          </RNAnimated.View>


        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          onClose={closeAlert}
          type={alertState.type}
        />
      </KeyboardAvoidingView>
    </ModalWrapper>
  );
};

export default LoanModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral950,
  },
  header: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacingX._20,
    paddingBottom: verticalScale(30),
  },
  clientSelectorContainer: {
    marginBottom: spacingY._15,
    marginTop: spacingY._10,
  },
  selectClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    borderWidth: 1,
    borderColor: colors.neutral800,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectClientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedClientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    borderWidth: 1,
    borderColor: colors.neutral700,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedClientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacingX._15,
    backgroundColor: colors.neutral800,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  clientTextInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacingX._10,
    paddingVertical: 3,
    borderRadius: radius._6,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  changeClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacingX._10,
    gap: 5,
    backgroundColor: `${colors.primary}15`,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  formCard: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    marginBottom: spacingY._20,
    borderWidth: 1,
    borderColor: colors.neutral800,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 5,
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
    height: Platform.OS === 'ios' ? verticalScale(48) : undefined,
    paddingVertical: Platform.OS === 'ios' ? 0 : verticalScale(2),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.neutral700,
    height: Platform.OS === 'ios' ? verticalScale(48) : undefined,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  frequencyOption: {
    paddingVertical: spacingY._7,
    paddingHorizontal: spacingX._5,
    borderRadius: radius._10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  activeFrequency: {
    backgroundColor: colors.primary,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: verticalScale(10),
  },
  summaryCard: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    marginBottom: spacingY._20,
    borderWidth: 1,
    borderColor: colors.neutral800,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 5,
  },
  summaryContent: {
    gap: spacingY._15,
  },
  summaryAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryAmountItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryArrow: {
    width: 40,
    alignItems: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.neutral800,
    marginVertical: spacingY._10,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacingY._10,
  },
  paymentGridItem: {
    width: '48%',
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    padding: spacingY._10,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacingY._5,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    gap: spacingX._10,
    borderTopWidth: 1,
    borderTopColor: colors.neutral900,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.neutral900,
    borderWidth: 1,
    borderColor: colors.neutral700,
    borderRadius: radius._12,
    height: verticalScale(50),
  },
  saveButton: {
    flex: 2,
    borderRadius: radius._12,
    height: verticalScale(50),
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  clientSelectorModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  clientSelectorContent: {
    backgroundColor: colors.neutral900,
    borderTopLeftRadius: radius._30,
    borderTopRightRadius: radius._30,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: colors.neutral600,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: verticalScale(15),
  },
  clientSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    marginBottom: verticalScale(15),
    height: verticalScale(48),
    paddingHorizontal: scale(15),
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  searchIcon: {
    marginRight: scale(10),
  },
  searchInput: {
    flex: 1,
    height: verticalScale(48),
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  clearButton: {
    padding: scale(5),
  },
  clientList: {
    maxHeight: verticalScale(400),
  },
  clientListLoading: {
    padding: verticalScale(30),
    alignItems: 'center',
  },
  clientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
    marginBottom: 2,
  },
  clientOptionImage: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    marginRight: scale(15),
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  clientOptionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center'
  },
  noClientsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
});
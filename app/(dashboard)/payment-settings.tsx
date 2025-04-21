// app/(settings)/payment-settings.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  TextInput,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '@/components/ScreenWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import * as Icons from 'phosphor-react-native';
import { scale, verticalScale } from '@/utils/styling';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { useAuth } from '@/context/authContext';
import { MotiView } from 'moti';
import { Image } from 'expo-image';
import CustomAlert from '@/components/CustomAlert';

// Define the types for our data structures
interface PaymentMethod {
  id: string;
  type: 'cash' | 'bank_transfer' | 'card' | 'other';
  name: string;
  details?: string;
  isDefault?: boolean;
  iconColor?: string;
}

interface PaymentReminder {
  enabled: boolean;
  daysBefore: number;
  notificationType: 'app' | 'email' | 'both';
  message?: string;
}

interface PaymentSettings {
  paymentMethods: PaymentMethod[];
  reminderSettings: PaymentReminder;
  autoConfirmPayments: boolean;
  sendReceipts: boolean;
}

// Default settings
const defaultSettings: PaymentSettings = {
  paymentMethods: [
    {
      id: 'cash',
      type: 'cash',
      name: 'Efectivo',
      isDefault: true,
      iconColor: '#10B981', // Green
    }
  ],
  reminderSettings: {
    enabled: true,
    daysBefore: 3,
    notificationType: 'app',
    message: 'Recuerda que tienes un pago próximo a vencer'
  },
  autoConfirmPayments: false,
  sendReceipts: true
};

const PaymentSettingsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [newMethod, setNewMethod] = useState<Partial<PaymentMethod>>({
    type: 'cash',
    name: '',
    details: '',
    isDefault: false
  });
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning'
  });

  // Fetch payment settings from Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.uid) return;

      try {
        const settingsDoc = await getDoc(doc(firestore, 'users', user.uid, 'settings', 'payments'));
        
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as PaymentSettings;
          setSettings(data);
        } else {
          // Initialize with default settings if not found
          await saveSettings(defaultSettings);
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error("Error fetching payment settings:", error);
        showAlert('Error', 'No se pudieron cargar las configuraciones de pago', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  // Save settings to Firestore
  const saveSettings = async (settingsData: PaymentSettings) => {
    if (!user?.uid) return;

    try {
      setSaving(true);
      await setDoc(doc(firestore, 'users', user.uid, 'settings', 'payments'), settingsData);
      return true;
    } catch (error) {
      console.error("Error saving payment settings:", error);
      showAlert('Error', 'No se pudieron guardar las configuraciones de pago', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Add or update payment method
  const savePaymentMethod = () => {
    if (!newMethod.name) {
      showAlert('Error', 'Por favor ingrese un nombre para el método de pago', 'warning');
      return;
    }

    let updatedMethods: PaymentMethod[] = [];

    // If editing an existing method
    if (editingMethod) {
      updatedMethods = settings.paymentMethods.map(method => 
        method.id === editingMethod.id 
          ? { ...method, ...newMethod, id: editingMethod.id } 
          : method
      );
    } else {
      // Adding a new method
      const newId = `method_${Date.now()}`;
      updatedMethods = [
        ...settings.paymentMethods,
        { ...newMethod as PaymentMethod, id: newId }
      ];
    }

    // If new method is default, update others
    if (newMethod.isDefault) {
      updatedMethods = updatedMethods.map(method => ({
        ...method,
        isDefault: method.id === (editingMethod?.id || `method_${Date.now()}`)
      }));
    } else if (!updatedMethods.some(m => m.isDefault)) {
      // Ensure there's always a default method
      updatedMethods[0].isDefault = true;
    }

    const updatedSettings = {
      ...settings,
      paymentMethods: updatedMethods
    };

    saveSettings(updatedSettings).then(success => {
      if (success) {
        setSettings(updatedSettings);
        setShowMethodModal(false);
        setEditingMethod(null);
        setNewMethod({
          type: 'cash',
          name: '',
          details: '',
          isDefault: false
        });
        showAlert('Éxito', 'Método de pago guardado correctamente', 'success');
      }
    });
  };

  // Delete payment method
  const deletePaymentMethod = (methodId: string) => {
    const isDefault = settings.paymentMethods.find(m => m.id === methodId)?.isDefault;
    
    if (settings.paymentMethods.length === 1) {
      showAlert('Error', 'Debe mantener al menos un método de pago', 'warning');
      return;
    }

    Alert.alert(
      "Eliminar Método de Pago",
      "¿Estás seguro de que deseas eliminar este método de pago?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => {
            let updatedMethods = settings.paymentMethods.filter(m => m.id !== methodId);
            
            // If deleted method was default, set a new default
            if (isDefault && updatedMethods.length > 0) {
              updatedMethods[0].isDefault = true;
            }
            
            const updatedSettings = {
              ...settings,
              paymentMethods: updatedMethods
            };
            
            saveSettings(updatedSettings).then(success => {
              if (success) {
                setSettings(updatedSettings);
                showAlert('Éxito', 'Método de pago eliminado correctamente', 'success');
              }
            });
          }
        }
      ]
    );
  };

  // Update reminder settings
  const updateReminderSettings = (key: keyof PaymentReminder, value: any) => {
    const updatedSettings = {
      ...settings,
      reminderSettings: {
        ...settings.reminderSettings,
        [key]: value
      }
    };
    setSettings(updatedSettings);
  };

  // Save reminder settings
  const saveReminderSettings = () => {
    saveSettings(settings).then(success => {
      if (success) {
        showAlert('Éxito', 'Configuración de recordatorios guardada correctamente', 'success');
      }
    });
  };

  // Update general settings
  const updateGeneralSetting = (key: 'autoConfirmPayments' | 'sendReceipts', value: boolean) => {
    const updatedSettings = {
      ...settings,
      [key]: value
    };
    
    saveSettings(updatedSettings).then(success => {
      if (success) {
        setSettings(updatedSettings);
      }
    });
  };

  // Show alerts
  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setAlertState({
      visible: true,
      title,
      message,
      type
    });
  };

  // Close alerts
  const closeAlert = () => {
    setAlertState({
      ...alertState,
      visible: false
    });
  };

  // Get icon for payment method type
  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Icons.Money size={scale(22)} color="#10B981" />;
      case 'bank_transfer':
        return <Icons.Bank size={scale(22)} color="#3B82F6" />;
      case 'card':
        return <Icons.CreditCard size={scale(22)} color="#8B5CF6" />;
      default:
        return <Icons.Wallet size={scale(22)} color="#F59E0B" />;
    }
  };

  // Get color for payment method type
  const getPaymentMethodColor = (type: string) => {
    switch (type) {
      case 'cash':
        return '#10B981'; // Green
      case 'bank_transfer':
        return '#3B82F6'; // Blue
      case 'card':
        return '#8B5CF6'; // Purple
      default:
        return '#F59E0B'; // Amber
    }
  };

  // Helper function to render payment methods
  const renderPaymentMethods = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Icons.CreditCard size={scale(20)} color={colors.primary} />
          <Typo size={scale(16)} fontWeight="600" color={colors.white}>
            Métodos de Pago
          </Typo>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setEditingMethod(null);
            setNewMethod({
              type: 'cash',
              name: '',
              details: '',
              isDefault: false
            });
            setShowMethodModal(true);
          }}
        >
          <Icons.Plus size={scale(18)} color={colors.white} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.paymentMethodsContainer}>
        {settings.paymentMethods.map((method, index) => (
          <MotiView 
            key={method.id}
            from={{ opacity: 0, translateY: 5 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 100 }}
            style={styles.paymentMethodCard}
          >
            <View style={styles.paymentMethodInfo}>
              <View style={[styles.paymentMethodIcon, { backgroundColor: `${method.iconColor || getPaymentMethodColor(method.type)}20` }]}>
                {getPaymentMethodIcon(method.type)}
              </View>
              <View style={styles.paymentMethodDetails}>
                <View style={styles.paymentMethodNameRow}>
                  <Typo fontWeight="600">{method.name}</Typo>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Typo size={scale(10)} color={colors.primary}>Predeterminado</Typo>
                    </View>
                  )}
                </View>
                {method.details && (
                  <Typo size={scale(12)} color={colors.neutral400}>
                    {method.details}
                  </Typo>
                )}
              </View>
            </View>
            <View style={styles.paymentMethodActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  setEditingMethod(method);
                  setNewMethod({
                    type: method.type,
                    name: method.name,
                    details: method.details,
                    isDefault: method.isDefault,
                    iconColor: method.iconColor
                  });
                  setShowMethodModal(true);
                }}
              >
                <Icons.PencilSimple size={scale(18)} color={colors.neutral300} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deletePaymentMethod(method.id)}
              >
                <Icons.Trash size={scale(18)} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </MotiView>
        ))}
      </View>
    </View>
  );

  // Helper function to render payment reminder settings
  const renderReminderSettings = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Icons.Bell size={scale(20)} color={colors.primary} />
          <Typo size={scale(16)} fontWeight="600" color={colors.white}>
            Recordatorios de Pago
          </Typo>
        </View>
      </View>
      
      <View style={styles.reminderContainer}>
        <View style={styles.settingRow}>
          <Typo>Habilitar recordatorios</Typo>
          <Switch
            value={settings.reminderSettings.enabled}
            onValueChange={(value) => updateReminderSettings('enabled', value)}
            trackColor={{ false: colors.neutral700, true: `${colors.primary}50` }}
            thumbColor={settings.reminderSettings.enabled ? colors.primary : colors.neutral500}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Typo>Días de anticipación</Typo>
          <View style={styles.daysContainer}>
            <TouchableOpacity
              style={styles.dayButton}
              onPress={() => updateReminderSettings('daysBefore', Math.max(1, settings.reminderSettings.daysBefore - 1))}
              disabled={!settings.reminderSettings.enabled}
            >
              <Icons.Minus size={scale(16)} color={settings.reminderSettings.enabled ? colors.primary : colors.neutral600} />
            </TouchableOpacity>
            <View style={styles.dayValueContainer}>
              <Typo 
                size={scale(16)} 
                fontWeight="600" 
                color={settings.reminderSettings.enabled ? colors.white : colors.neutral600}
              >
                {settings.reminderSettings.daysBefore}
              </Typo>
            </View>
            <TouchableOpacity
              style={styles.dayButton}
              onPress={() => updateReminderSettings('daysBefore', settings.reminderSettings.daysBefore + 1)}
              disabled={!settings.reminderSettings.enabled}
            >
              <Icons.Plus size={scale(16)} color={settings.reminderSettings.enabled ? colors.primary : colors.neutral600} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <Typo>Tipo de notificación</Typo>
          <View style={styles.notificationTypeContainer}>
            <TouchableOpacity
              style={[
                styles.notificationTypeOption,
                settings.reminderSettings.notificationType === 'app' && styles.activeNotificationType
              ]}
              onPress={() => updateReminderSettings('notificationType', 'app')}
              disabled={!settings.reminderSettings.enabled}
            >
              <Icons.Bell size={scale(16)} color={
                !settings.reminderSettings.enabled 
                  ? colors.neutral600 
                  : settings.reminderSettings.notificationType === 'app' 
                    ? colors.white 
                    : colors.neutral400
              } />
              <Typo 
                size={scale(12)} 
                color={
                  !settings.reminderSettings.enabled 
                    ? colors.neutral600 
                    : settings.reminderSettings.notificationType === 'app' 
                      ? colors.white 
                      : colors.neutral400
                }
              >
                App
              </Typo>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.notificationTypeOption,
                settings.reminderSettings.notificationType === 'email' && styles.activeNotificationType
              ]}
              onPress={() => updateReminderSettings('notificationType', 'email')}
              disabled={!settings.reminderSettings.enabled}
            >
              <Icons.Envelope size={scale(16)} color={
                !settings.reminderSettings.enabled 
                  ? colors.neutral600 
                  : settings.reminderSettings.notificationType === 'email' 
                    ? colors.white 
                    : colors.neutral400
              } />
              <Typo 
                size={scale(12)} 
                color={
                  !settings.reminderSettings.enabled 
                    ? colors.neutral600 
                    : settings.reminderSettings.notificationType === 'email' 
                      ? colors.white 
                      : colors.neutral400
                }
              >
                Email
              </Typo>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.notificationTypeOption,
                settings.reminderSettings.notificationType === 'both' && styles.activeNotificationType
              ]}
              onPress={() => updateReminderSettings('notificationType', 'both')}
              disabled={!settings.reminderSettings.enabled}
            >
              <Icons.BellRinging size={scale(16)} color={
                !settings.reminderSettings.enabled 
                  ? colors.neutral600 
                  : settings.reminderSettings.notificationType === 'both' 
                    ? colors.white 
                    : colors.neutral400
              } />
              <Typo 
                size={scale(12)} 
                color={
                  !settings.reminderSettings.enabled 
                    ? colors.neutral600 
                    : settings.reminderSettings.notificationType === 'both' 
                      ? colors.white 
                      : colors.neutral400
                }
              >
                Ambos
              </Typo>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.messageContainer}>
          <Typo style={styles.messageLabel}>Mensaje de recordatorio</Typo>
          <TextInput
            style={[
              styles.messageInput,
              !settings.reminderSettings.enabled && styles.disabledInput
            ]}
            value={settings.reminderSettings.message}
            onChangeText={(text) => updateReminderSettings('message', text)}
            placeholder="Mensaje de recordatorio"
            placeholderTextColor={colors.neutral600}
            multiline
            editable={settings.reminderSettings.enabled}
          />
        </View>
        
        <Button
          style={styles.saveReminderButton}
          loading={saving}
          disabled={!settings.reminderSettings.enabled}
          onPress={saveReminderSettings}
        >
          <Typo color={colors.white}>Guardar configuración</Typo>
        </Button>
      </View>
    </View>
  );

  // Helper function to render general settings
  const renderGeneralSettings = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Icons.Gear size={scale(20)} color={colors.primary} />
          <Typo size={scale(16)} fontWeight="600" color={colors.white}>
            Configuración General
          </Typo>
        </View>
      </View>
      
      <View style={styles.generalSettingsContainer}>
        <View style={styles.settingRow}>
          <View>
            <Typo>Confirmar pagos automáticamente</Typo>
            <Typo size={scale(12)} color={colors.neutral400}>
              Los pagos se marcarán como confirmados automáticamente
            </Typo>
          </View>
          <Switch
            value={settings.autoConfirmPayments}
            onValueChange={(value) => updateGeneralSetting('autoConfirmPayments', value)}
            trackColor={{ false: colors.neutral700, true: `${colors.primary}50` }}
            thumbColor={settings.autoConfirmPayments ? colors.primary : colors.neutral500}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View>
            <Typo>Enviar recibos por email</Typo>
            <Typo size={scale(12)} color={colors.neutral400}>
              Enviar comprobantes de pago por correo electrónico
            </Typo>
          </View>
          <Switch
            value={settings.sendReceipts}
            onValueChange={(value) => updateGeneralSetting('sendReceipts', value)}
            trackColor={{ false: colors.neutral700, true: `${colors.primary}50` }}
            thumbColor={settings.sendReceipts ? colors.primary : colors.neutral500}
          />
        </View>
      </View>
    </View>
  );

  // Payment method modal
  const renderPaymentMethodModal = () => (
    showMethodModal && (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Typo size={scale(18)} fontWeight="600">
              {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
            </Typo>
            <TouchableOpacity 
              onPress={() => setShowMethodModal(false)}
              style={styles.closeButton}
            >
              <Icons.X size={scale(24)} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Typo style={styles.formLabel}>Tipo de método</Typo>
              <View style={styles.paymentTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentTypeOption,
                    newMethod.type === 'cash' && styles.activePaymentType
                  ]}
                  onPress={() => setNewMethod({ ...newMethod, type: 'cash' })}
                >
                  <Icons.Money size={scale(24)} color={newMethod.type === 'cash' ? '#10B981' : colors.neutral500} />
                  <Typo 
                    size={scale(12)} 
                    color={newMethod.type === 'cash' ? colors.white : colors.neutral400}
                  >
                    Efectivo
                  </Typo>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.paymentTypeOption,
                    newMethod.type === 'bank_transfer' && styles.activePaymentType
                  ]}
                  onPress={() => setNewMethod({ ...newMethod, type: 'bank_transfer' })}
                >
                  <Icons.Bank size={scale(24)} color={newMethod.type === 'bank_transfer' ? '#3B82F6' : colors.neutral500} />
                  <Typo 
                    size={scale(12)} 
                    color={newMethod.type === 'bank_transfer' ? colors.white : colors.neutral400}
                  >
                    Transferencia
                  </Typo>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.paymentTypeOption,
                    newMethod.type === 'card' && styles.activePaymentType
                  ]}
                  onPress={() => setNewMethod({ ...newMethod, type: 'card' })}
                >
                  <Icons.CreditCard size={scale(24)} color={newMethod.type === 'card' ? '#8B5CF6' : colors.neutral500} />
                  <Typo 
                    size={scale(12)} 
                    color={newMethod.type === 'card' ? colors.white : colors.neutral400}
                  >
                    Tarjeta
                  </Typo>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.paymentTypeOption,
                    newMethod.type === 'other' && styles.activePaymentType
                  ]}
                  onPress={() => setNewMethod({ ...newMethod, type: 'other' })}
                >
                  <Icons.Wallet size={scale(24)} color={newMethod.type === 'other' ? '#F59E0B' : colors.neutral500} />
                  <Typo 
                    size={scale(12)} 
                    color={newMethod.type === 'other' ? colors.white : colors.neutral400}
                  >
                    Otro
                  </Typo>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Typo style={styles.formLabel}>Nombre</Typo>
              <TextInput
                style={styles.textInput}
                value={newMethod.name}
                onChangeText={(text) => setNewMethod({ ...newMethod, name: text })}
                placeholder="Nombre del método de pago"
                placeholderTextColor={colors.neutral600}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Typo style={styles.formLabel}>Detalles (opcional)</Typo>
              <TextInput
                style={[styles.textInput, styles.detailsInput]}
                value={newMethod.details}
                onChangeText={(text) => setNewMethod({ ...newMethod, details: text })}
                placeholder="Información adicional del método de pago"
                placeholderTextColor={colors.neutral600}
                multiline
              />
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setNewMethod({ ...newMethod, isDefault: !newMethod.isDefault })}
                >
                  {newMethod.isDefault && (
                    <Icons.Check size={scale(16)} color={colors.primary} />
                  )}
                </TouchableOpacity>
                <Typo>Establecer como método predeterminado</Typo>
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setShowMethodModal(false)}
              >
                <Typo color={colors.neutral300}>Cancelar</Typo>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveModalButton}
                onPress={savePaymentMethod}
              >
                <Typo color={colors.white}>Guardar</Typo>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    )
  );

  if (loading) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <Header 
          title="Configuración de Pagos" 
          leftIcon={<BackButton />}
        />
        <View style={styles.loadingContent}>
          <Icons.CircleNotch size={scale(30)} color={colors.primary}>
            {/* Animation would go here in a real app */}
          </Icons.CircleNotch>
          <Typo style={styles.loadingText}>Cargando configuración...</Typo>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Header 
        title="Configuración de Pagos" 
        leftIcon={<BackButton />}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderPaymentMethods()}
        {renderReminderSettings()}
        {renderGeneralSettings()}
      </ScrollView>
      
      {renderPaymentMethodModal()}
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        onClose={closeAlert}
        type={alertState.type}
      />
    </ScreenWrapper>
  );
};

export default PaymentSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacingX._20,
    paddingBottom: spacingY._40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.neutral950,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacingY._15,
    color: colors.neutral400,
  },
  sectionContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    marginBottom: spacingY._20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacingX._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodsContainer: {
    padding: spacingX._15,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    padding: spacingY._12,
    paddingHorizontal: spacingX._15,
    marginBottom: spacingY._10,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacingX._12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: spacingX._7,
    paddingVertical: 2,
    borderRadius: radius._10,
  },
  paymentMethodActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 5,
  },
  deleteButton: {
    padding: 5,
  },
  reminderContainer: {
    padding: spacingX._15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacingY._12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayButton: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: colors.neutral800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayValueContainer: {
    width: scale(40),
    alignItems: 'center',
  },
  notificationTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  notificationTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacingY._5,
    paddingHorizontal: spacingX._10,
    borderRadius: radius._20,
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  activeNotificationType: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  messageContainer: {
    marginTop: spacingY._12,
    marginBottom: spacingY._15,
  },
  messageLabel: {
    marginBottom: spacingY._7,
    color: colors.neutral300,
  },
  messageInput: {
    backgroundColor: colors.neutral800,
    color: colors.white,
    borderRadius: radius._10,
    padding: spacingY._12,
    paddingHorizontal: spacingX._15,
    minHeight: verticalScale(80),
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  disabledInput: {
    opacity: 0.5,
    color: colors.neutral500,
  },
  saveReminderButton: {
    marginTop: spacingY._10,
  },
  generalSettingsContainer: {
    padding: spacingX._15,
  },
  modalOverlay: {
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
  modalContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._20,
    width: '90%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacingY._15,
    paddingHorizontal: spacingX._20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: spacingX._20,
  },
  formGroup: {
    marginBottom: spacingY._15,
  },
  formLabel: {
    marginBottom: spacingY._7,
    color: colors.neutral300,
  },
  paymentTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacingY._10,
  },
  paymentTypeOption: {
    width: '48%',
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    paddingVertical: spacingY._12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  activePaymentType: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}20`,
  },
  textInput: {
    backgroundColor: colors.neutral800,
    color: colors.white,
    borderRadius: radius._10,
    padding: spacingY._12,
    paddingHorizontal: spacingX._15,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  detailsInput: {
    minHeight: verticalScale(80),
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(4),
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacingY._20,
    gap: spacingX._10,
  },
  cancelModalButton: {
    backgroundColor: colors.neutral800,
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._20,
    borderRadius: radius._10,
  },
  saveModalButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._20,
    borderRadius: radius._10,
  },
});
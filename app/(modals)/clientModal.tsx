// app/(modals)/clientModal.tsx
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import ModalWrapper from '@/components/ModalWrapper';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'moti';
import Typo from '@/components/Typo';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/context/authContext';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { getProfileImage } from '@/services/imageServices';
import * as Icon from 'phosphor-react-native';
import { createOrUpdateClient } from '@/services/clientService';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import CustomAlert from '@/components/CustomAlert';
import Loading from '@/components/Loading';
import { scale, verticalScale } from '@/utils/styling';

interface ClientFormData {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: 'Activo' | 'En mora' | 'Inactivo';
  notes: string;
  image: any;
}

const ClientModal = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const clientId = params.id as string;
  const isEditing = !!clientId;
  
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    status: 'Activo',
    notes: '',
    image: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchingClient, setFetchingClient] = useState(isEditing);
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
  });
  const [activeSection, setActiveSection] = useState('info'); // 'info' or 'notes'

  // Fetch client data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchClient = async () => {
        try {
          const clientDoc = await getDoc(doc(firestore, 'clients', clientId));
          if (clientDoc.exists()) {
            const clientData = clientDoc.data();
            setFormData({
              id: clientId,
              name: clientData.name || '',
              phone: clientData.phone || '',
              email: clientData.email || '',
              address: clientData.address || '',
              status: clientData.status || 'Activo',
              notes: clientData.notes || '',
              image: clientData.image || null,
            });
          }
        } catch (error) {
          console.log('Error fetching client:', error);
          showAlert('Error', 'No se pudo cargar la información del cliente');
        } finally {
          setFetchingClient(false);
        }
      };
      
      fetchClient();
    }
  }, [clientId, isEditing]);

  const showAlert = (title: string, message: string) => {
    setAlertState({
      visible: true,
      title,
      message,
    });
  };

  const closeAlert = () => {
    setAlertState({ ...alertState, visible: false });
  };

  const onPickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, image: result.assets[0] });
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showAlert('Validación', 'Por favor ingresa el nombre del cliente');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user?.uid) {
      showAlert('Error', 'Debes iniciar sesión para guardar un cliente');
      return;
    }

    setLoading(true);

    try {
      const clientData = {
        ...formData,
        uid: user.uid,
      };

      const result = await createOrUpdateClient(clientData);

      if (result.success) {
        showAlert(
          'Éxito', 
          isEditing 
            ? 'Cliente actualizado correctamente' 
            : 'Cliente creado correctamente',
        );
        setTimeout(() => {
          router.back();
        }, 1000);
      } else {
        showAlert('Error', result.msg || 'Hubo un error al guardar el cliente');
      }
    } catch (error) {
      console.log('Error saving client:', error);
      showAlert('Error', 'Hubo un error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingClient) {
    return (
      <ModalWrapper>
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      </ModalWrapper>
    );
  }

  const renderField = (
    icon: JSX.Element, 
    label: string, 
    placeholder: string, 
    value: string, 
    onChange: (text: string) => void, 
    required: boolean = false,
    keyboardType: string = 'default',
    autoCapitalize: 'none' | 'sentences' | 'words' | 'characters' = 'sentences'
  ) => {
    return (
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          {icon}
          <Typo style={styles.labelText} color={colors.white}>
            {label} {required && <Typo color={colors.primary}>*</Typo>}
          </Typo>
        </View>
        <Input
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType as any}
          autoCapitalize={autoCapitalize}
          containerStyle={styles.inputField}
        />
      </View>
    );
  };

  return (
    <ModalWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <Header
            title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            leftIcon={<BackButton />}
          />

          {/* Profile image */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={onPickImage}>
              <View style={styles.avatarContainer}>
                <Image
                  source={getProfileImage(formData.image)}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <View style={styles.cameraBtn}>
                  <Icon.Camera size={scale(18)} color={colors.white} />
                </View>
              </View>
            </TouchableOpacity>
            <Typo size={scale(12)} color={colors.neutral400} style={styles.avatarText}>
              Toca para cambiar foto
            </Typo>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity 
              style={[styles.tab, activeSection === 'info' && styles.activeTab]}
              onPress={() => setActiveSection('info')}
            >
              <Icon.User 
                size={scale(18)} 
                color={activeSection === 'info' ? colors.primary : colors.neutral400} 
              />
              <Typo 
                size={scale(14)} 
                color={activeSection === 'info' ? colors.primary : colors.neutral400}
                style={styles.tabText}
              >
                Información
              </Typo>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeSection === 'notes' && styles.activeTab]}
              onPress={() => setActiveSection('notes')}
            >
              <Icon.Note 
                size={scale(18)} 
                color={activeSection === 'notes' ? colors.primary : colors.neutral400}
              />
              <Typo 
                size={scale(14)} 
                color={activeSection === 'notes' ? colors.primary : colors.neutral400}
                style={styles.tabText}
              >
                Notas
              </Typo>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView 
            contentContainerStyle={styles.formContainer} 
            showsVerticalScrollIndicator={false}
          >
            {activeSection === 'info' ? (
              <>
                {renderField(
                  <Icon.User size={scale(18)} color={colors.primary} />,
                  'Nombre',
                  'Nombre del cliente',
                  formData.name,
                  (value) => setFormData({...formData, name: value}),
                  true
                )}
                
                {renderField(
                  <Icon.Phone size={scale(18)} color={colors.primary} />,
                  'Teléfono',
                  'Número de teléfono',
                  formData.phone,
                  (value) => setFormData({...formData, phone: value}),
                  false,
                  'phone-pad'
                )}
                
                {renderField(
                  <Icon.Envelope size={scale(18)} color={colors.primary} />,
                  'Email',
                  'Correo electrónico',
                  formData.email,
                  (value) => setFormData({...formData, email: value}),
                  false,
                  'email-address',
                  'none'
                )}
                
                {renderField(
                  <Icon.MapPin size={scale(18)} color={colors.primary} />,
                  'Dirección',
                  'Dirección',
                  formData.address,
                  (value) => setFormData({...formData, address: value})
                )}
              </>
            ) : (
              <View style={styles.notesContainer}>
                <Input
                  placeholder="Agrega notas sobre este cliente"
                  value={formData.notes}
                  onChangeText={(value) => setFormData({ ...formData, notes: value })}
                  multiline
                  numberOfLines={10}
                  containerStyle={styles.notesInput}
                  style={styles.notesInputText}
                />
              </View>
            )}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Typo color={colors.white}>Cancelar</Typo>
            </Button>
            
            <Button
              style={styles.saveButton}
              onPress={handleSubmit}
              loading={loading}
            >
              <Typo color={colors.white}>Guardar</Typo>
            </Button>
          </View>
        </View>

        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          onClose={closeAlert}
        />
      </KeyboardAvoidingView>
    </ModalWrapper>
  );
};

export default ClientModal;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.neutral950,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: verticalScale(10),
  },
  avatarContainer: {
    width: scale(80),
    height: scale(80),
    position: 'relative',
  },
  avatar: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: colors.neutral800,
  },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    marginTop: verticalScale(5),
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacingX._20,
    borderBottomWidth: verticalScale(3),
    borderBottomColor: 'transparent',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    marginRight: scale(25),
    borderBottomWidth: verticalScale(3),
    borderBottomColor: 'transparent',
    marginBottom: verticalScale(-3),
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    marginLeft: scale(7),
  },
  formContainer: {
    paddingHorizontal: spacingX._20,
    paddingTop: verticalScale(15), 
    gap: verticalScale(20), // Creates even spacing between all fields
  },
  fieldContainer: {
    marginBottom: verticalScale(10),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(7),
  },
  labelText: {
    marginLeft: scale(10),
  },
  inputField: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._10,
    height: verticalScale(50),
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  notesContainer: {
    flex: 1,
  },
  notesInput: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._10,
    borderWidth: 1,
    borderColor: colors.neutral800,
    minHeight: verticalScale(200),
  },
  notesInputText: {
    textAlignVertical: 'top',
    paddingTop: verticalScale(10),
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacingX._20,
    paddingVertical: verticalScale(15),
    gap: scale(10),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.primary,
    opacity: 0.75,
    height: verticalScale(48),
  },
  saveButton: {
    flex: 1.5,
    backgroundColor: colors.primary,
    height: verticalScale(48),
  },
});
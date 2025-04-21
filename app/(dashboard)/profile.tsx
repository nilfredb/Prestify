/* -------------------------------------------------------------------------- */
/*                                  Imports                                   */
/* -------------------------------------------------------------------------- */
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Switch,
  ViewStyle,
  ImageStyle,
  TextStyle,
  Alert,
  Text,
  StatusBar,
} from 'react-native';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Componentes locales
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import Header from '@/components/Header';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import { useAuth } from '@/context/authContext';
import { getProfileImage } from '@/services/imageServices';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import onPickImage from '../(modals)/profileModal'; // Asegúrate de tener esta función para seleccionar imágenes

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */
interface Styles {
  [key: string]: ViewStyle | TextStyle | ImageStyle;
  container: ViewStyle;
  profileContainer: ViewStyle;
  userInfo: ViewStyle;
  avatarContainer: ViewStyle;
  avatar: ImageStyle;
  editAvatarButton: ViewStyle;
  profileInfo: ViewStyle;
  statsContainer: ViewStyle;
  statItem: ViewStyle;
  statValue: TextStyle;
  statLabel: TextStyle;
  divider: ViewStyle;
  
  // Secciones de configuración
  sectionContainer: ViewStyle;
  sectionHeader: ViewStyle;
  sectionIcon: ViewStyle;
  sectionTitle: TextStyle;
  menuItem: ViewStyle;
  menuItemDanger: ViewStyle;
  menuItemLeft: ViewStyle;
  menuItemIcon: ViewStyle;
  menuItemContent: ViewStyle;
  menuItemTitle: TextStyle;
  menuItemSubtitle: TextStyle;
  menuItemRight: ViewStyle;
  version: TextStyle;
  
  // Estilos de tu código actual
  nameContainer: ViewStyle;
  flexRow: ViewStyle;
  listItem: ViewStyle;
  listIcon: ViewStyle;
  accountOptions: ViewStyle;
}

// Tipo para secciones de configuración
interface SettingSection {
  title: string;
  icon: React.ReactNode;
  items: SettingItem[];
}

// Tipo para elementos de configuración
interface SettingItem {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  rightElement?: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
  bgColor?: string;
  routeName?: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Componente                                 */
/* -------------------------------------------------------------------------- */
const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { user } = useAuth();

  // Toggle para modo oscuro
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Aquí implementarías la lógica para cambiar el tema
  };

  // Toggle para notificaciones
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  // Función para cerrar sesión - Fixed implementation
  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar sesión', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              // Use a timeout to ensure the alert is dismissed before navigation
              setTimeout(() => {
                router.replace('/(auth)/welcome' as never);
              }, 500);
            } catch (error) {
              console.error("Error signing out: ", error);
              Alert.alert("Error", "No se pudo cerrar sesión");
            }
          }
        }
      ]
    );
  };

  // Datos simulados de stats del usuario (puedes reemplazar con datos reales)
  const userStats = {
    clientesActivos: 28,
    prestamosTotales: 42,
    diasActividad: 65,
  };

  // Secciones de configuración
  const settingSections: SettingSection[] = [
    {
      title: 'Cuenta',
      icon: <Icons.User size={20} color={colors.primary} />,
      items: [
        {
          title: 'Editar Perfil',
          subtitle: 'Cambia tu foto, nombre o correo',
          icon: <Icons.User size={20} color={colors.white} weight="fill" />,
          rightElement: <Icons.CaretRight size={20} color={colors.white} weight="bold" />,
          onPress: () => router.push('/(modals)/profileModal'),
          bgColor: '#6366f1'
        },
        {
          title: 'Ajustes',
          subtitle: 'Configuración de la aplicación',
          icon: <Icons.GearSix size={20} color={colors.white} weight="fill" />,
          rightElement: <Icons.CaretRight size={20} color={colors.white} weight="bold" />,
          onPress: () => Alert.alert('Próximamente', 'Esta sección estará disponible en futuras actualizaciones.'),
          bgColor: '#059669'
        },
        {
          title: 'Privacidad',
          subtitle: 'Política de privacidad y términos',
          icon: <Icons.Lock size={20} color={colors.white} weight="fill" />,
          rightElement: <Icons.CaretRight size={20} color={colors.white} weight="bold" />,
          onPress: () => router.push('/privacy-policy' as never),
          bgColor: colors.neutral600
        },
      ],
    },
    {
      title: 'Negocio',
      icon: <Icons.Briefcase size={20} color={colors.primary} />,
      items: [
        {
          title: 'Datos de negocio',
          subtitle: 'Información de tu empresa',
          icon: <Icons.Buildings size={20} color={colors.white} weight="fill" />,
          rightElement: <Icons.CaretRight size={20} color={colors.white} weight="bold" />,
          onPress: () => router.push('/business-details' as never),
          bgColor: '#3b82f6'
        },
        {
          title: 'Configuración de préstamos',
          subtitle: 'Intereses y plazos predeterminados',
          icon: <Icons.Percent size={20} color={colors.white} weight="fill" />,
          rightElement: <Icons.CaretRight size={20} color={colors.white} weight="bold" />,
          onPress: () => router.push('/loan-settings' as never),
          bgColor: '#8b5cf6'
        },
        {
          title: 'Configuración de pagos',
          subtitle: 'Métodos de pago y recordatorios',
          icon: <Icons.CreditCard size={20} color={colors.white} weight="fill" />,
          rightElement: <Icons.CaretRight size={20} color={colors.white} weight="bold" />,
          onPress: () => router.push('/payment-settings' as never),
          bgColor: '#0ea5e9'
        },
      ],
    },
    {
      title: 'Datos y privacidad',
      icon: <Icons.ShieldCheck size={20} color={colors.primary} />,
      items: [
        {
          title: 'Exportar datos',
          subtitle: 'Generar copia de seguridad',
          icon: <Icons.CloudArrowUp size={20} color={colors.white} weight="fill" />,
          rightElement: <Icons.CaretRight size={20} color={colors.white} weight="bold" />,
          onPress: () => Alert.alert('Próximamente', 'Esta funcionalidad estará disponible en futuras actualizaciones.'),
          bgColor: '#f59e0b'
        },
        {
          title: 'Importar datos',
          subtitle: 'Restaurar copia de seguridad',
          icon: <Icons.CloudArrowDown size={20} color={colors.white} weight="fill" />,
          rightElement: <Icons.CaretRight size={20} color={colors.white} weight="bold" />,
          onPress: () => Alert.alert('Próximamente', 'Esta funcionalidad estará disponible en futuras actualizaciones.'),
          bgColor: '#14b8a6'
        },
      ],
    },
  ];

  // Componente para renderizar secciones de configuración con animaciones de Reanimated
  const renderSettingSection = (section: SettingSection, index: number) => {
    return (
      <View key={`section-${section.title}`} style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            {section.icon}
          </View>
          <Typo style={styles.sectionTitle}>{section.title}</Typo>
        </View>

        {section.items.map((item, itemIndex) => {
          return (
            <Animated.View 
              key={`item-${section.title}-${itemIndex}`} 
              entering={FadeInDown.delay((index * 200) + (itemIndex * 50)).springify().damping(14)}
              style={styles.listItem}
            >
              <TouchableOpacity 
                style={styles.flexRow} 
                onPress={item.onPress}
                accessibilityLabel={item.title}
              >
                <View style={[styles.listIcon, { backgroundColor: item.bgColor || colors.neutral500 }]}>
                  {item.icon}
                </View>
                
                <View style={styles.menuItemContent}>
                  <Typo size={16} fontWeight="500" style={{ color: item.danger ? '#e11d48' : colors.text }}>
                    {item.title}
                  </Typo>
                  {item.subtitle ? (
                    <Typo size={14} color={colors.textLighter}>
                      {item.subtitle}
                    </Typo>
                  ) : null}
                </View>
                
                {item.rightElement ? (
                  <View>
                    {item.rightElement}
                  </View>
                ) : null}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      {/* Using the imported StatusBar component instead */}
      <View style={styles.container}>
        {/* Header */}
        <Header title="Perfil" style={{marginVertical: spacingY._10}} />

        <ScrollView showsVerticalScrollIndicator={false} testID="profile-scroll-view">
          {/* Perfil */}
          <View style={styles.profileContainer}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <Image
                  source={getProfileImage(user?.image)}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={100}
                  accessibilityLabel="Foto de perfil"
                />
                <TouchableOpacity 
                  style={styles.editAvatarButton}
                  onPress={() => router.push('/(modals)/profileModal' as never)}
                  accessibilityLabel="Editar foto de perfil"
                >
                  <Icons.PencilSimple size={16} color={colors.white} weight="fill" />
                </TouchableOpacity>
              </View>

              <View style={styles.nameContainer}>
                <Typo size={24} fontWeight="600" color={colors.neutral100}>
                  {user?.name || 'cargando...'}
                </Typo>
                <Typo size={15} color={colors.neutral400}>
                  {user?.email || 'cargando...'}
                </Typo>
              </View>
            </View>
          </View>

          {/* Estadísticas de usuario */}
          <Animated.View 
            entering={FadeInDown.delay(150).springify()}
            style={styles.statsContainer}
          >
            <View style={styles.statItem}>
              <Typo style={styles.statValue} fontWeight="700" size={22}>
                {userStats.clientesActivos}
              </Typo>
              <Typo style={styles.statLabel}>
                Clientes
              </Typo>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.statItem}>
              <Typo style={styles.statValue} fontWeight="700" size={22}>
                {userStats.prestamosTotales}
              </Typo>
              <Typo style={styles.statLabel}>
                Préstamos
              </Typo>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.statItem}>
              <Typo style={styles.statValue} fontWeight="700" size={22}>
                {userStats.diasActividad}
              </Typo>
              <Typo style={styles.statLabel}>
                Días activo
              </Typo>
            </View>
          </Animated.View>

          {/* Secciones de configuración */}
          <View style={styles.accountOptions}>
            {settingSections.map(renderSettingSection)}

            {/* Botón de cerrar sesión */}
            <Animated.View 
              entering={FadeInDown.delay(800).springify().damping(14)}
              style={styles.listItem}
            >
              <TouchableOpacity 
                style={styles.flexRow}
                onPress={handleLogout}
                accessibilityLabel="Cerrar sesión"
              >
                <View style={[styles.listIcon, { backgroundColor: '#e11d48' }]}>
                  <Icons.Power size={20} color={colors.white} weight="fill" />
                </View>
                
                <View style={{ flex: 1 }}>
                  <Typo size={16} fontWeight="500">
                    Cerrar sesión
                  </Typo>
                </View>
                
                <View>
                  <Icons.CaretRight size={20} color={colors.white} weight="bold" />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Versión de la app */}
            <Animated.View
              entering={FadeInDown.delay(900).springify()}
            >
              <Typo style={styles.version}>Versión 1.0.0</Typo>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Styles                                    */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  profileContainer: {
    paddingVertical: spacingY._10,
    borderRadius: radius._15,
  },
  userInfo: {
    marginTop: verticalScale(20),
    alignItems: 'center',
    gap: spacingY._15,
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  avatar: {
    alignSelf: 'center',
    backgroundColor: colors.neutral300,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.neutral900, // Changed from colors.background to colors.neutral900
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  nameContainer: {
    gap: verticalScale(4),
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral900,
    borderRadius: 16,
    padding: spacingY._15,
    marginHorizontal: spacingX._20,
    justifyContent: 'space-between',
    marginTop: spacingY._10,
    marginBottom: spacingY._25,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textLighter,
    fontSize: 14,
  },
  divider: {
    width: 1,
    backgroundColor: colors.neutral800,
    height: '80%',
    alignSelf: 'center',
  },
  
  // Secciones de configuración
  sectionContainer: {
    marginBottom: spacingY._15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._10,
    paddingHorizontal: spacingX._5,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacingX._10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacingY._12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral900,
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    marginRight: spacingX._15,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    color: colors.text,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: colors.textLighter,
    marginTop: 2,
  },
  menuItemRight: {
    marginLeft: spacingX._10,
  },
  version: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textLighter,
    marginBottom: spacingY._30,
    marginTop: spacingY._10,
  },

  // Adaptado de tu código
  accountOptions: {
    marginTop: spacingY._5,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
  listItem: {
    marginBottom: verticalScale(17),
  },
  listIcon: {
    height: verticalScale(44),
    width: verticalScale(44),
    backgroundColor: colors.neutral500,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius._15,
    borderCurve: "continuous",
  },
});

export default ProfileScreen;
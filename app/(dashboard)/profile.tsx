/* -------------------------------------------------------------------------- */
/*                                  Imports                                   */
/* -------------------------------------------------------------------------- */
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
    ViewStyle,
    ImageStyle,
    TextStyle,
    Alert,
  } from 'react-native';
  import React, { useState } from 'react';
  import { StatusBar } from 'expo-status-bar';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import { useRouter } from 'expo-router';
  import * as Icons from 'phosphor-react-native';
  import { Image } from 'react-native';
  import { MotiView } from 'moti';
  
  // Componentes locales
  import ScreenWrapper from '@/components/ScreenWrapper';
  import Typo from '@/components/Typo';
  import { colors, spacingX, spacingY } from '@/constants/theme';
  
  /* -------------------------------------------------------------------------- */
  /*                                  Helpers                                   */
  /* -------------------------------------------------------------------------- */
  
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
  }
  
  /* -------------------------------------------------------------------------- */
  /*                                   Types                                    */
  /* -------------------------------------------------------------------------- */
  interface Styles {
    [key: string]: ViewStyle | TextStyle | ImageStyle;
    container: ViewStyle;
    header: ViewStyle;
    headerContent: ViewStyle;
    backButton: ViewStyle;
    profileContainer: ViewStyle;
    avatarContainer: ViewStyle;
    avatar: ImageStyle;
    editAvatarButton: ViewStyle;
    profileInfo: ViewStyle;
    profileName: TextStyle;
    profileEmail: TextStyle;
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
  }
  
  /* -------------------------------------------------------------------------- */
  /*                                 Componente                                 */
  /* -------------------------------------------------------------------------- */
  const ProfileScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
    // Datos simulados del usuario
    const user = {
      name: 'Carlos Martínez',
      email: 'carlos.martinez@example.com',
      avatar: require('@/assets/images/avatar.png'),
      stats: {
        clientesActivos: 28,
        prestamosTotales: 42,
        diasActividad: 65,
      }
    };
  
    // Toggle para modo oscuro
    const toggleDarkMode = () => {
      setIsDarkMode(!isDarkMode);
      // Aquí implementarías la lógica para cambiar el tema
    };
  
    // Toggle para notificaciones
    const toggleNotifications = () => {
      setNotificationsEnabled(!notificationsEnabled);
    };
  
    // Función para cerrar sesión
    const handleLogout = () => {
      Alert.alert(
        'Cerrar sesión',
        '¿Estás seguro que deseas cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Cerrar sesión', 
            style: 'destructive',
            onPress: () => {
              // Aquí implementarías la lógica para cerrar sesión
              router.replace('/(auth)/login' as never);
            }
          }
        ]
      );
    };
  
    // Secciones de configuración
    const settingSections: SettingSection[] = [
      {
        title: 'Configuración general',
        icon: <Icons.Gear size={20} color={colors.primary} />,
        items: [
          {
            title: 'Modo oscuro',
            subtitle: 'Cambiar apariencia de la app',
            icon: <Icons.Moon size={20} color={colors.primary} />,
            rightElement: (
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.neutral800, true: colors.primary }}
                thumbColor={colors.white}
              />
            ),
            onPress: toggleDarkMode,
          },
          {
            title: 'Notificaciones',
            subtitle: 'Alertas de pagos y vencimientos',
            icon: <Icons.Bell size={20} color={colors.primary} />,
            rightElement: (
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.neutral800, true: colors.primary }}
                thumbColor={colors.white}
              />
            ),
            onPress: toggleNotifications,
          },
          {
            title: 'Moneda',
            subtitle: 'Peso Dominicano (RD$)',
            icon: <Icons.CurrencyCircleDollar size={20} color={colors.primary} />,
            rightElement: <Icons.CaretRight size={20} color={colors.textLighter} />,
            onPress: () => Alert.alert('Próximamente', 'Esta funcionalidad estará disponible en futuras actualizaciones.'),
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
            icon: <Icons.Buildings size={20} color={colors.primary} />,
            rightElement: <Icons.CaretRight size={20} color={colors.textLighter} />,
            onPress: () => router.push('/business-details' as never),
          },
          {
            title: 'Configuración de préstamos',
            subtitle: 'Intereses y plazos predeterminados',
            icon: <Icons.Percent size={20} color={colors.primary} />,
            rightElement: <Icons.CaretRight size={20} color={colors.textLighter} />,
            onPress: () => router.push('/loan-settings' as never),
          },
          {
            title: 'Configuración de pagos',
            subtitle: 'Métodos de pago y recordatorios',
            icon: <Icons.CreditCard size={20} color={colors.primary} />,
            rightElement: <Icons.CaretRight size={20} color={colors.textLighter} />,
            onPress: () => router.push('/payment-settings' as never),
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
            icon: <Icons.CloudArrowUp size={20} color={colors.primary} />,
            rightElement: <Icons.CaretRight size={20} color={colors.textLighter} />,
            onPress: () => Alert.alert('Próximamente', 'Esta funcionalidad estará disponible en futuras actualizaciones.'),
          },
          {
            title: 'Importar datos',
            subtitle: 'Restaurar copia de seguridad',
            icon: <Icons.CloudArrowDown size={20} color={colors.primary} />,
            rightElement: <Icons.CaretRight size={20} color={colors.textLighter} />,
            onPress: () => Alert.alert('Próximamente', 'Esta funcionalidad estará disponible en futuras actualizaciones.'),
          },
          {
            title: 'Eliminar cuenta',
            icon: <Icons.Trash size={20} color={colors.danger || '#ef4444'} />,
            rightElement: <Icons.CaretRight size={20} color={colors.textLighter} />,
            onPress: () => Alert.alert(
              'Eliminar cuenta',
              'Esta acción no se puede deshacer. Todos tus datos serán eliminados permanentemente.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => console.log('Cuenta eliminada') }
              ]
            ),
            danger: true,
          },
        ],
      },
      {
        title: 'Ayuda y soporte',
        icon: <Icons.Question size={20} color={colors.primary} />,
        items: [
          {
            title: 'Centro de ayuda',
            subtitle: 'Preguntas frecuentes',
            icon: <Icons.Info size={20} color={colors.primary} />,
            rightElement: <Icons.CaretRight size={20} color={colors.textLighter} />,
            onPress: () => router.push('/help-center' as never),
          },
          {
            title: 'Contacto',
            subtitle: 'Soporte técnico',
            icon: <Icons.Lifebuoy size={20} color={colors.primary} />,
            rightElement: <Icons.CaretRight size={20} color={colors.textLighter} />,
            onPress: () => router.push('/contact-support' as never),
          },
          {
            title: 'Términos y condiciones',
            icon: <Icons.FileText size={20} color={colors.primary} />,
            rightElement: <Icons.CaretRight size={20} color={colors.textLighter} />,
            onPress: () => router.push('/terms' as never),
          },
        ],
      },
    ];
  
    // Componente para renderizar secciones de configuración
    const renderSettingSection = (section: SettingSection, index: number) => (
      <MotiView 
        key={section.title}
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 300 + (index * 100), type: 'timing', duration: 500 }}
        style={styles.sectionContainer}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            {section.icon}
          </View>
          <Typo style={styles.sectionTitle}>{section.title}</Typo>
        </View>
  
        {section.items.map((item, itemIndex) => (
          <Pressable
            key={item.title}
            style={[styles.menuItem, item.danger && styles.menuItemDanger]}
            onPress={item.onPress}
            android_ripple={{ color: colors.neutral800 }}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIcon}>
                {item.icon}
              </View>
            </View>
            
            <View style={styles.menuItemContent}>
              <Typo 
                style={[styles.menuItemTitle, item.danger && { color: colors.danger || '#ef4444' }]} 
                fontWeight="600"
              >
                {item.title}
              </Typo>
              {item.subtitle && (
                <Typo style={styles.menuItemSubtitle}>{item.subtitle}</Typo>
              )}
            </View>
            
            <View style={styles.menuItemRight}>
              {item.rightElement}
            </View>
          </Pressable>
        ))}
      </MotiView>
    );
  
    return (
      <ScreenWrapper>
        <StatusBar style="light" />
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacingY._10 }]}>
          <View style={styles.headerContent}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Icons.ArrowLeft size={24} color={colors.text} />
            </Pressable>
            <Typo size={20} fontWeight="700" color={colors.text}>
              Mi Perfil
            </Typo>
            <View style={{ width: 40 }} />
          </View>
        </View>
  
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Perfil */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600 }}
            style={styles.profileContainer}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={user.avatar}
                style={styles.avatar}
                defaultSource={user.avatar}
              />
              <Pressable style={styles.editAvatarButton}>
                <Icons.PencilSimple size={16} color={colors.white} />
              </Pressable>
            </View>
  
            <View style={styles.profileInfo}>
              <Typo style={styles.profileName} fontWeight="700" size={22}>
                {user.name}
              </Typo>
              <Typo style={styles.profileEmail} size={16}>
                {user.email}
              </Typo>
            </View>
  
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Typo style={styles.statValue} fontWeight="700" size={22}>
                  {user.stats.clientesActivos}
                </Typo>
                <Typo style={styles.statLabel}>
                  Clientes
                </Typo>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.statItem}>
                <Typo style={styles.statValue} fontWeight="700" size={22}>
                  {user.stats.prestamosTotales}
                </Typo>
                <Typo style={styles.statLabel}>
                  Préstamos
                </Typo>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.statItem}>
                <Typo style={styles.statValue} fontWeight="700" size={22}>
                  {user.stats.diasActividad}
                </Typo>
                <Typo style={styles.statLabel}>
                  Días activo
                </Typo>
              </View>
            </View>
          </MotiView>
  
          {/* Secciones de configuración */}
          {settingSections.map(renderSettingSection)}
  
          {/* Botón de cerrar sesión */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 800, type: 'timing', duration: 500 }}
            style={styles.sectionContainer}
          >
            <Pressable
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={handleLogout}
              android_ripple={{ color: colors.neutral800 }}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuItemIcon}>
                  <Icons.SignOut size={20} color={colors.primary} />
                </View>
              </View>
              
              <View style={styles.menuItemContent}>
                <Typo 
                  style={styles.menuItemTitle} 
                  fontWeight="600"
                >
                  Cerrar sesión
                </Typo>
              </View>
              
              <View style={styles.menuItemRight} />
            </Pressable>
          </MotiView>
  
          {/* Versión de la app */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 900, type: 'timing', duration: 500 }}
          >
            <Typo style={styles.version}>Versión 1.0.0</Typo>
          </MotiView>
        </ScrollView>
      </ScreenWrapper>
    );
  };
  
  /* -------------------------------------------------------------------------- */
  /*                                  Styles                                    */
  /* -------------------------------------------------------------------------- */
  const styles = StyleSheet.create<Styles>({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacingX._20,
      paddingBottom: spacingY._10,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.neutral900,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileContainer: {
      paddingHorizontal: spacingX._20,
      paddingBottom: spacingY._20,
      alignItems: 'center',
    },
    avatarContainer: {
      marginTop: spacingY._10,
      position: 'relative',
      marginBottom: spacingY._15,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: colors.primary,
    },
    editAvatarButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.neutral950,
    },
    profileInfo: {
      alignItems: 'center',
      marginBottom: spacingY._15,
    },
    profileName: {
      color: colors.text,
      marginBottom: 4,
    },
    profileEmail: {
      color: colors.textLighter,
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.neutral900,
      borderRadius: 16,
      padding: spacingY._15,
      width: '100%',
      justifyContent: 'space-between',
      marginBottom: spacingY._20,
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
      paddingHorizontal: spacingX._20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacingY._10,
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
  });
  
  export default ProfileScreen;
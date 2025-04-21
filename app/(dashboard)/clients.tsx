// app/(client)/clients.tsx
import { FlatList, StyleSheet, View, TouchableOpacity, TextInput, Animated, Text, Platform, StatusBar, Modal } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { verticalScale, scale } from '@/utils/styling';
import Button from '@/components/Button';
import * as Icon from 'phosphor-react-native';
import { router, useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import useFetchClients from '@/hooks/useFetchClients';
import Loading from '@/components/Loading';
import { where } from 'firebase/firestore';
import { Image } from 'expo-image';
import { getProfileImage } from '@/services/imageServices';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ClientData {
id?: string;
name: string;
status: string;
loans?: number;
email?: string;
image?: any;
}

const StatusBadge = ({ status }: { status: string }) => {
let bgColor, textColor;

switch(status) {
  case 'Activo':
    bgColor = 'rgba(22, 163, 74, 0.3)';
    textColor = colors.success;
    break;
  case 'En mora':
    bgColor = 'rgba(202, 138, 4, 0.3)';
    textColor = colors.danger;
    break;
  case 'Inactivo':
    bgColor = 'rgba(220, 38, 38, 0.3)';
    textColor = colors.neutral400;
    break;
  default:
    bgColor = `${colors.primary}20`;
    textColor = colors.primary;
}

return (
  <View style={[styles.badge, { backgroundColor: bgColor }]}>
    <Typo size={scale(12)} color={textColor} style={{fontWeight: '500'}}>
      {status}
    </Typo>
  </View>
);
};

const ClientCard = ({ client, onPress, onLongPress, closeAllMenus, activeMenuId, setActiveMenuId }: { 
client: ClientData; 
onPress: () => void; 
onLongPress?: () => void;
closeAllMenus: () => void;
activeMenuId: string | null;
setActiveMenuId: (id: string | null) => void;
}) => {
// Get first letter of client name for avatar
const initial = client.name ? client.name.charAt(0).toUpperCase() : '?';

const scaleAnim = useRef(new Animated.Value(1)).current;
const showOptionsMenu = activeMenuId === client.id;

const handlePressIn = () => {
  Animated.spring(scaleAnim, {
    toValue: 0.97,
    useNativeDriver: true,
    speed: 20,
    bounciness: 4
  }).start();
};

const handlePressOut = () => {
  Animated.spring(scaleAnim, {
    toValue: 1,
    useNativeDriver: true,
    speed: 20,
  }).start();
};

const toggleOptionsMenu = () => {
  if (showOptionsMenu) {
    setActiveMenuId(null);
  } else {
    closeAllMenus();
    setActiveMenuId(client.id || null);
  }
};

return (
  <>
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={300}
    >
      <Animated.View style={[
        styles.card, 
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={styles.cardLeft}>
          {client.image ? (
            <Image
              source={getProfileImage(client.image)}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatar}>
              <Typo size={scale(18)} style={{fontWeight: '700'}} color={colors.white}>
                {initial}
              </Typo>
            </View>
          )}
          <View style={styles.clientInfo}>
            <Text 
              style={styles.clientName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {client.name}
            </Text>
            <View style={styles.cardDetails}>
              <View style={styles.loanCountContainer}>
                <Icon.Money size={scale(14)} color={colors.neutral400} />
                <Typo size={scale(13)} color={colors.neutral400}>
                  {client.loans || 0} préstamos
                </Typo>
              </View>
              <StatusBadge status={client.status} />
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.menuButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          onPress={toggleOptionsMenu}
        >
          <Icon.DotsThreeVertical size={scale(24)} color={colors.neutral500} weight="bold" />
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>

    {/* Options Menu */}
    {showOptionsMenu && (
      <View style={styles.optionsMenuContainer}>
        <TouchableOpacity 
          style={styles.optionsBackdrop}
          onPress={closeAllMenus}
          activeOpacity={1}
        />
        <View style={styles.optionsMenu}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => {
              closeAllMenus();
              onPress();
            }}
          >
            <Icon.User size={scale(18)} color={colors.primary} />
            <Typo color={colors.white} style={{marginLeft: 10}}>Ver perfil</Typo>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => {
              closeAllMenus();
              if (client.id) {
                router.push({
                  pathname: '/(modals)/loanModal',
                  params: { clientId: client.id }
                });
              }
            }}
          >
            <Icon.Money size={scale(18)} color={colors.primary} />
            <Typo color={colors.white} style={{marginLeft: 10}}>Crear préstamo</Typo>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => {
              closeAllMenus();
              if (client.id) {
                router.push({
                  pathname: '/(modals)/clientModal',
                  params: { id: client.id }
                });
              }
            }}
          >
            <Icon.PencilSimple size={scale(18)} color={colors.primary} />
            <Typo color={colors.white} style={{marginLeft: 10}}>Editar</Typo>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.optionItem, styles.deleteOption]}
            onPress={() => {
              closeAllMenus();
              // You would implement delete functionality here
              alert('Función para eliminar cliente');
            }}
          >
            <Icon.Trash size={scale(18)} color={colors.danger} />
            <Typo color={colors.danger} style={{marginLeft: 10}}>Eliminar</Typo>
          </TouchableOpacity>
        </View>
      </View>
    )}
  </>
);
};

const ActionButton = ({ icon, label, onPress, backgroundColor }: { 
icon: JSX.Element, 
label: string, 
onPress: () => void, 
backgroundColor: string 
}) => {
return (
  <TouchableOpacity 
    style={[styles.actionButton, { backgroundColor }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {icon}
    <Typo size={scale(14)} color={colors.white} style={{marginTop: 8}}>
      {label}
    </Typo>
  </TouchableOpacity>
);
};

const Clients = () => {
const router = useRouter();
const { user } = useAuth();
const insets = useSafeAreaInsets();
const [searchTerm, setSearchTerm] = useState('');
const [isSearchFocused, setIsSearchFocused] = useState(false);
const [showActions, setShowActions] = useState(false);
const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
const [showFilterOptions, setShowFilterOptions] = useState(false);
const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);

const fadeAnim = useRef(new Animated.Value(0)).current;
const translateYAnim = useRef(new Animated.Value(500)).current;

// Apply status filter if selected
const statusConstraint = activeStatusFilter 
  ? [where('status', '==', activeStatusFilter)]
  : [];

// Apply search filter if search term exists
const searchConstraint = searchTerm 
  ? [
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff')
    ]
  : [];
  
// Combine constraints
const constraints = [...statusConstraint, ...searchConstraint];
  
const { clients, loading, error } = useFetchClients(user?.uid, constraints);

// Close menu when tapping elsewhere
useEffect(() => {
  const closeOnScreenPress = () => {
    if (activeMenuId) {
      setActiveMenuId(null);
    }
    
    if (showFilterOptions) {
      setShowFilterOptions(false);
    }
  };
  
  // Add listener for background presses (simplified for this example)
  // In a real app, you would need proper event listeners
  
  return () => {
    // Clean up
  };
}, [activeMenuId, showFilterOptions]);

const closeAllMenus = () => {
  setActiveMenuId(null);
  setShowFilterOptions(false);
};

const toggleActionSheet = () => {
  if (showActions) {
    // Hide action sheet with animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowActions(false);
      setSelectedClient(null);
    });
  } else {
    // Show action sheet with animation
    setShowActions(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }
};

const handleAddClient = () => {
  router.push('/(modals)/clientModal');
};

const handleClientPress = (client: ClientData) => {
  router.push({
    pathname: '/(client)/[id]',
    params: { id: client.id || '' }
  });
};

const handleClientLongPress = (client: ClientData) => {
  setSelectedClient(client);
  toggleActionSheet();
};

const handleCreateLoan = () => {
  if (selectedClient?.id) {
    toggleActionSheet();
    router.push({
      pathname: '/(modals)/loanModal',
      params: { clientId: selectedClient.id }
    });
  }
};

const handleEditClient = () => {
  if (selectedClient?.id) {
    toggleActionSheet();
    router.push({
      pathname: '/(modals)/clientModal',
      params: { id: selectedClient.id }
    });
  }
};

const handleFilterPress = () => {
  closeAllMenus();
  setShowFilterOptions(!showFilterOptions);
};

const handleFilterSelect = (status: string | null) => {
  setActiveStatusFilter(status);
  setShowFilterOptions(false);
};

const getStatusFilterLabel = () => {
  if (!activeStatusFilter) return "Todos";
  return activeStatusFilter;
};

return (
  <ScreenWrapper style={styles.wrapper}>
    <StatusBar barStyle="light-content" />
    
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
      <Typo size={scale(28)} style={{fontWeight: '800'}} color={colors.text}>Clientes</Typo>
      <Button 
        style={styles.addButton} 
        onPress={handleAddClient}
      >
        <Icon.UserPlus size={scale(32)} color={colors.white} weight="bold" />
      </Button>
    </View>

    {/* Search and Filter */}
    <View style={styles.searchContainer}>
      <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
        <Icon.MagnifyingGlass 
          size={scale(18)} 
          color={isSearchFocused ? colors.primary : colors.neutral400} 
        />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          placeholderTextColor={colors.neutral500}
          value={searchTerm}
          onChangeText={setSearchTerm}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <View style={styles.clearButton}>
              <Typo color={colors.neutral500} size={scale(18)}>×</Typo>
            </View>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={{position: 'relative'}}>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            activeStatusFilter && styles.activeFilterButton
          ]} 
          onPress={handleFilterPress}
        >
          <Icon.SlidersHorizontal size={scale(18)} color={activeStatusFilter ? colors.primary : colors.neutral300} />
        </TouchableOpacity>
        
        {/* Filter Options Dropdown */}
        {showFilterOptions && (
          <View style={styles.filterOptionsContainer}>
            <TouchableOpacity 
              style={[
                styles.filterOption, 
                !activeStatusFilter && styles.activeFilterOption
              ]}
              onPress={() => handleFilterSelect(null)}
            >
              <Typo color={!activeStatusFilter ? colors.primary : colors.white}>Todos</Typo>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.filterOption, 
                activeStatusFilter === 'Activo' && styles.activeFilterOption
              ]}
              onPress={() => handleFilterSelect('Activo')}
            >
              <View style={[styles.filterStatusIndicator, {backgroundColor: 'rgba(22, 163, 74, 0.3)'}]} />
              <Typo color={activeStatusFilter === 'Activo' ? colors.primary : colors.white}>Activo</Typo>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.filterOption, 
                activeStatusFilter === 'En mora' && styles.activeFilterOption
              ]}
              onPress={() => handleFilterSelect('En mora')}
            >
              <View style={[styles.filterStatusIndicator, {backgroundColor: 'rgba(202, 138, 4, 0.3)'}]} />
              <Typo color={activeStatusFilter === 'En mora' ? colors.primary : colors.white}>En mora</Typo>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.filterOption, 
                activeStatusFilter === 'Inactivo' && styles.activeFilterOption
              ]}
              onPress={() => handleFilterSelect('Inactivo')}
            >
              <View style={[styles.filterStatusIndicator, {backgroundColor: 'rgba(220, 38, 38, 0.3)'}]} />
              <Typo color={activeStatusFilter === 'Inactivo' ? colors.primary : colors.white}>Inactivo</Typo>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>

    {/* Active filter indicator */}
    {activeStatusFilter && (
      <View style={styles.activeFilterContainer}>
        <Typo size={scale(12)} color={colors.neutral400}>Filtro: </Typo>
        <View style={styles.activeFilterPill}>
          <Typo size={scale(12)} color={colors.primary}>{getStatusFilterLabel()}</Typo>
          <TouchableOpacity onPress={() => setActiveStatusFilter(null)}>
            <Icon.X size={scale(14)} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    )}

    {/* Stats summary */}
    {!loading && clients.length > 0 && (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Typo color={colors.neutral400} size={scale(12)}>Total</Typo>
          <Typo color={colors.white} size={scale(16)} style={{fontWeight: '700'}}>{clients.length}</Typo>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Typo color={colors.neutral400} size={scale(12)}>Activos</Typo>
          <Typo color={colors.success} size={scale(16)} style={{fontWeight: '700'}}>
            {clients.filter(c => c.status === 'Activo').length}
          </Typo>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Typo color={colors.neutral400} size={scale(12)}>En mora</Typo>
          <Typo color={colors.danger} size={scale(16)} style={{fontWeight: '700'}}>
            {clients.filter(c => c.status === 'En mora').length}
          </Typo>
        </View>
      </View>
    )}

    {/* Error state */}
    {error && (
      <View style={styles.messageContainer}>
        <Typo color={colors.danger}>Error: {error}</Typo>
      </View>
    )}

    {/* Loading state */}
    {loading ? (
      <View style={styles.loadingContainer}>
        <Loading />
      </View>
    ) : (
      <>
        {/* Empty state */}
        {clients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Icon.UserPlus size={scale(40)} color={colors.neutral500} weight="light" />
            </View>
            <Typo color={colors.neutral400} style={styles.emptyText}>
              {activeStatusFilter 
                ? `No hay clientes con estado "${activeStatusFilter}".` 
                : 'No hay clientes. Toca el botón + para agregar uno.'}
            </Typo>
            <Button 
              style={styles.emptyButton} 
              onPress={handleAddClient}
            >
              <Icon.Plus size={scale(16)} color={colors.white} />
              <Typo color={colors.white} size={scale(14)}>Agregar Cliente</Typo>
            </Button>
          </View>
        ) : (
          /* Client list */
          <FlatList
            data={clients}
            keyExtractor={(item) => item.id || ''}
            renderItem={({ item }) => (
              <ClientCard 
                client={item} 
                onPress={() => handleClientPress(item)}
                onLongPress={() => handleClientLongPress(item)}
                closeAllMenus={closeAllMenus}
                activeMenuId={activeMenuId}
                setActiveMenuId={setActiveMenuId}
              />
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            bounces={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </>
    )}
    
    {/* Actions Sheet */}
    {showActions && (
      <Animated.View 
        style={[
          styles.actionsModal,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }] 
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={toggleActionSheet}
        />
        <BlurView intensity={Platform.OS === 'ios' ? 25 : 90} style={styles.blurView} tint="dark">
          <View style={[styles.actionsContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            
            <View style={styles.selectedClientHeader}>
              {selectedClient?.image ? (
                <Image
                  source={getProfileImage(selectedClient.image)}
                  style={styles.selectedClientAvatar}
                  contentFit="cover"
                  transition={300}
                />
              ) : (
                <View style={styles.selectedClientAvatar}>
                  <Typo size={scale(24)} style={{fontWeight: '700'}} color={colors.white}>
                    {selectedClient?.name?.charAt(0).toUpperCase() || '?'}
                  </Typo>
                </View>
              )}
              
              <Typo size={scale(20)} color={colors.white} style={{fontWeight: 'bold', marginTop: 10, marginBottom: 5}}>
                {selectedClient?.name}
              </Typo>
              
              <StatusBadge status={selectedClient?.status || 'Activo'} />
            </View>
            
            <View style={styles.actionsGrid}>
              <ActionButton 
                icon={<Icon.Money size={scale(24)} color={colors.white} weight="fill" />}
                label="Nuevo Préstamo"
                onPress={handleCreateLoan}
                backgroundColor={colors.primary}
              />
              
              <ActionButton 
                icon={<Icon.PencilSimple size={scale(24)} color={colors.white} weight="fill" />}
                label="Editar"
                onPress={handleEditClient}
                backgroundColor={colors.success}
              />
              
              <ActionButton 
                icon={<Icon.Eye size={scale(24)} color={colors.white} weight="fill" />}
                label="Ver Detalles"
                onPress={() => {
                  toggleActionSheet();
                  if (selectedClient?.id) {
                    router.push({
                      pathname: '/(client)/[id]',
                      params: { id: selectedClient.id }
                    });
                  }
                }}
                backgroundColor="#6366f1"
              />
              
              <ActionButton 
                icon={<Icon.Phone size={scale(24)} color={colors.white} weight="fill" />}
                label="Llamar"
                onPress={() => {
                  toggleActionSheet();
                  // You would implement call functionality here
                }}
                backgroundColor="#10b981"
              />
            </View>
            
            <Button 
              style={styles.cancelButton}
              onPress={toggleActionSheet}
            >
              <Typo color={colors.white}>Cancelar</Typo>
            </Button>
          </View>
        </BlurView>
      </Animated.View>
    )}
  </ScreenWrapper>
);
};

export default Clients;

const styles = StyleSheet.create({
wrapper: {
  paddingHorizontal: 0,
  flex: 1,
  backgroundColor: colors.neutral950,
},
header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacingY._15,
  paddingHorizontal: spacingX._20,
},
addButton: {
  backgroundColor: colors.primary,
  width: verticalScale(56),
  height: verticalScale(56),
  borderRadius: verticalScale(28),
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 8,
},
searchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacingY._15,
  gap: spacingX._10,
  paddingHorizontal: spacingX._20,
},
searchBar: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  backgroundColor: colors.neutral900,
  paddingHorizontal: spacingX._15,
  paddingVertical: Platform.OS === 'ios' ? spacingY._12 : spacingY._7,
  borderRadius: radius._12,
  borderWidth: 1,
  borderColor: colors.neutral800,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
},
searchBarFocused: {
  borderColor: colors.primary,
  shadowColor: colors.primary,
  shadowOpacity: 0.2,
},
searchInput: {
  flex: 1,
  color: colors.text,
  fontSize: scale(15),
  padding: 0,
  height: Platform.OS === 'ios' ? 22 : 40,
},
clearButton: {
  width: scale(22),
  height: scale(22),
  borderRadius: scale(11),
  backgroundColor: colors.neutral800,
  alignItems: 'center',
  justifyContent: 'center',
},
filterButton: {
  backgroundColor: colors.neutral900,
  width: verticalScale(46),
  height: verticalScale(46),
  borderRadius: radius._12,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: colors.neutral800,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
},
statsContainer: {
  flexDirection: 'row',
  backgroundColor: colors.neutral900,
  borderRadius: radius._12,
  padding: spacingY._15,
  marginBottom: spacingY._15,
  borderWidth: 1,
  borderColor: colors.neutral800,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 3,
  marginHorizontal: spacingX._20,
},
statItem: {
  flex: 1,
  alignItems: 'center',
},
statDivider: {
  width: 1,
  backgroundColor: colors.neutral800,
  marginHorizontal: spacingX._5,
},
card: {
  backgroundColor: colors.neutral900,
  padding: spacingY._15,
  paddingHorizontal: spacingX._15,
  borderRadius: radius._12,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: colors.neutral800,
  marginBottom: spacingY._10,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 3,
},
cardLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
avatar: {
  width: scale(46),
  height: scale(46),
  borderRadius: scale(23),
  backgroundColor: colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: spacingX._12,
},
clientInfo: {
  flex: 1,
},
clientName: {
  fontSize: scale(16),
  fontWeight: '600',
  color: colors.text,
  marginBottom: 4,
},
cardDetails: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacingX._10,
},
loanCountContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 5,
},
menuButton: {
  padding: scale(8),
},
badge: {
  paddingVertical: 4,
  paddingHorizontal: scale(8),
  borderRadius: scale(12),
},
listContainer: {
  paddingBottom: verticalScale(100), // Extra padding for bottom tabs
  paddingHorizontal: spacingX._20,
},
emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingBottom: verticalScale(100),
},
emptyIconContainer: {
  width: scale(90),
  height: scale(90),
  borderRadius: scale(45),
  backgroundColor: colors.neutral900,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: spacingY._15,
  borderWidth: 1,
  borderColor: colors.neutral800,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 5,
},
emptyText: {
  marginBottom: spacingY._20,
  textAlign: 'center',
  maxWidth: '80%',
},
emptyButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacingX._10,
  paddingHorizontal: spacingX._20,
  paddingVertical: spacingY._12,
  backgroundColor: colors.primary,
  borderRadius: radius._12,
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 8,
},
messageContainer: {
  padding: spacingY._15,
  backgroundColor: 'rgba(255, 59, 48, 0.1)',
  borderRadius: radius._12,
  alignItems: 'center',
  marginHorizontal: spacingX._20,
},
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
actionsModal: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1000,
},
optionsBackdrop: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'transparent',
},
optionsMenu: {
  position: 'absolute',
  right: spacingX._20,
  top: 0,
  backgroundColor: colors.neutral800,
  borderRadius: radius._12,
  padding: 8,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.27,
  shadowRadius: 4.65,
  elevation: 6,
  borderWidth: 1,
  borderColor: colors.neutral700,
  zIndex: 200,
},
optionItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: radius._6,
},
deleteOption: {
  borderTopWidth: 1,
  borderTopColor: colors.neutral700,
  marginTop: 5,
  paddingTop: 12,
},
filterOptionsContainer: {
  position: 'absolute',
  top: verticalScale(52),
  right: 0,
  backgroundColor: colors.neutral800,
  borderRadius: radius._12,
  padding: 8,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.27,
  shadowRadius: 4.65,
  elevation: 6,
  borderWidth: 1,
  borderColor: colors.neutral700,
  zIndex: 200,
  width: scale(150),
},
filterOption: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: radius._6,
  marginBottom: 2,
},
activeFilterOption: {
  backgroundColor: 'rgba(37, 99, 235, 0.15)',
},
filterStatusIndicator: {
  width: 12,
  height: 12,
  borderRadius: 6,
  marginRight: 8,
},
activeFilterButton: {
  borderColor: colors.primary,
},
activeFilterContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: spacingX._20,
  marginBottom: spacingY._10,
},
activeFilterPill: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(37, 99, 235, 0.15)',
  borderRadius: 20,
  paddingHorizontal: 10,
  paddingVertical: 4,
  marginLeft: 5,
  gap: 5,
},
backdrop: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
},
blurView: {
  flex: 1,
  justifyContent: 'flex-end',
},
actionsContent: {
  backgroundColor: colors.neutral900,
  borderTopLeftRadius: radius._30,
  borderTopRightRadius: radius._30,
  paddingHorizontal: spacingX._20,
  paddingTop: spacingY._15,
},
modalHandle: {
  width: 40,
  height: 5,
  backgroundColor: colors.neutral600,
  borderRadius: 3,
  alignSelf: 'center',
  marginBottom: verticalScale(15),
},
selectedClientHeader: {
  alignItems: 'center',
  marginBottom: spacingY._20,
},
selectedClientAvatar: {
  width: scale(80),
  height: scale(80),
  borderRadius: scale(40),
  backgroundColor: colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: colors.neutral700,
},
actionsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginBottom: spacingY._20,
},
actionButton: {
  width: '48%',
  aspectRatio: 1.5,
  borderRadius: radius._15,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: spacingY._10,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 5,
  elevation: 5,
},
cancelButton: {
  backgroundColor: colors.neutral800,
  borderRadius: radius._12,
  paddingVertical: spacingY._15,
  marginBottom: spacingY._10,
},
optionsMenuContainer: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 100,
},
});
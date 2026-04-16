// components/CustomTabs.tsx
import { View, Platform, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, spacingY, radius } from '@/constants/theme';
import { verticalScale, scale } from '@/utils/styling';
import * as Icons from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Typo from '@/components/Typo';

// Define tab names for display
const tabNames: Record<string, string> = {
  index: 'Home',
  statistics: 'Estadísticas',
  clients: 'Clientes',
  profile: 'Perfil',
};

export default function CustomTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  const tabbarIcons: Record<string, (isFocused: boolean) => JSX.Element> = {
    index: (isFocused) => (
      <Icons.House
        size={verticalScale(22)}
        weight={isFocused ? 'fill' : 'regular'}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),
    statistics: (isFocused) => (
      <Icons.ChartBar
        size={verticalScale(22)}
        weight={isFocused ? 'fill' : 'regular'}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),
    clients: (isFocused) => (
      <Icons.UsersThree
        size={verticalScale(22)}
        weight={isFocused ? 'fill' : 'regular'}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),
    profile: (isFocused) => (
      <Icons.User
        size={verticalScale(22)}
        weight={isFocused ? 'fill' : 'regular'}
        color={isFocused ? colors.primary : colors.neutral400}
      />
    ),
  };

  // Map route names to their correct indices
  // This ensures we're showing the correct tab as active
  const getRouteIndex = (routeName: string): number => {
    const routeOrder = ['index', 'clients', 'statistics', 'profile'];
    return routeOrder.indexOf(routeName);
  };

  return (
    <View style={[
      styles.tabbar, 
      { paddingBottom: Math.max(insets.bottom, verticalScale(8)) }
    ]}>
      <View style={styles.tabbarInner}>
        {/* Hard-coded tabs in the specific order we want */}
        {['index', 'clients', 'statistics', 'profile'].map((routeName) => {
          // Find the actual route based on name
          const route = state.routes.find(r => r.name === routeName);
          if (!route || !tabbarIcons[routeName]) return null;
          
          const { options } = descriptors[route.key];
          const isFocused = state.routes[state.index].name === routeName;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(routeName, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabbarItem}
              activeOpacity={0.7}
            >
              <View 
                style={[
                  styles.tabIconContainer,
                  isFocused && styles.tabIconContainerActive
                ]}
              >
                {tabbarIcons[routeName](isFocused)}
              </View>
              
              <Typo 
                size={10} 
                fontWeight={isFocused ? "600" : "400"}
                color={isFocused ? colors.primary : colors.neutral400}
                style={styles.tabLabel}
              >
                {tabNames[routeName] || routeName}
              </Typo>

              {isFocused && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    width: '100%',
    backgroundColor: colors.neutral950,
    borderTopColor: colors.neutral900,
    borderTopWidth: 1,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  tabbarInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacingY._10,
    width: '100%',
  },
  tabbarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._5,
    flex: 1,
    position: 'relative',
    height: verticalScale(60),
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: verticalScale(45),
    height: verticalScale(45),
    borderRadius: verticalScale(22.5),
    marginBottom: verticalScale(3),
  },
  tabIconContainerActive: {
    backgroundColor: `${colors.primary}10`,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: verticalScale(2),
    width: verticalScale(5),
    height: verticalScale(5),
    borderRadius: verticalScale(2.5),
    backgroundColor: colors.primary,
  },
  tabLabel: {
    marginTop: verticalScale(2),
  },
});
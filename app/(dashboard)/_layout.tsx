// app/(dashboard)/_layout.tsx
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import CustomTabs from '@/components/CustomTabs';

export default function DashboardLayout() {
  return (
    <Tabs 
      tabBar={props => <CustomTabs {...props} />} 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: { display: 'none' }  // Hide the default tab bar
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="statistics" options={{ title: "Stats" }} />
      <Tabs.Screen name="wallet" options={{ title: "Wallet" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
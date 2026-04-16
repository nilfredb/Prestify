// app/_layout.tsx
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/authContext';

import * as Notifications from 'expo-notifications';
import { NotificationProvider } from '@/context/NotificationContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  return (
    <NotificationProvider>
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="(modals)/profileModal"
          options={{ 
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom'
          }} 
        />
        <Stack.Screen 
          name="(modals)/walletModal"
          options={{ 
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom'
          }} 
        />
        {/* Add the client modal */}
        <Stack.Screen 
          name="(modals)/clientModal"
          options={{ 
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom'
          }} 
        />
        {/* Add client detail page */}
        <Stack.Screen 
          name="client/[id]"
          options={{ 
            headerShown: false
          }} 
        />
      </Stack>
    </AuthProvider>
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({});
import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, RefreshControl, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '@/components/ScreenWrapper';
import Header from '@/components/Header';
import Typo from '@/components/Typo';
import Loading from '@/components/Loading';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { formatDate } from '@/utils/helpers';
import * as Icons from 'phosphor-react-native';
import { scale, verticalScale } from '@/utils/styling';
import { getUserNotifications, markNotificationAsRead, checkAllLoansForNotifications } from '@/services/notificationService';
import { registerForPushNotificationsAsync, savePushToken } from '@/services/notificationService';
import { useAuth } from '@/context/authContext';  // Import useAuth hook from your auth context

// Notification type icons mapping
const NOTIFICATION_TYPE_ICONS = {
  loan_overdue: <Icons.CalendarX size={scale(20)} color={colors.danger} />,
  loan_due_tomorrow: <Icons.CalendarCheck size={scale(20)} color={colors.warning} />,
  loan_due_soon: <Icons.Clock size={scale(20)} color={colors.warning} />,
  loan_reminder: <Icons.Bell size={scale(20)} color={colors.primary} />,
  payment_received: <Icons.CurrencyCircleDollar size={scale(20)} color={colors.success} />,
  payment_confirmed: <Icons.CheckCircle size={scale(20)} color={colors.success} />,
  default: <Icons.Bell size={scale(20)} color={colors.primary} />,
};

// Define a type for notifications
interface NotificationType {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  sentAt: Date;
  loanId?: string;
}

const NotificationItem = ({ 
  notification, 
  onPress 
}: { 
  notification: NotificationType, 
  onPress: () => void
}) => {
  return (
    <TouchableOpacity 
      style={[styles.notificationItem, notification.read && styles.notificationRead]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        {NOTIFICATION_TYPE_ICONS[notification.type as keyof typeof NOTIFICATION_TYPE_ICONS] || 
          NOTIFICATION_TYPE_ICONS.default}
      </View>
      
      <View style={styles.notificationContent}>
        <Typo 
          size={scale(15)} 
          fontWeight={notification.read ? "400" : "600"}
          style={styles.notificationTitle}
        >
          {notification.title}
        </Typo>
        
        <View style={{marginBottom: spacingY._5}}>
          <Text 
            style={{
              fontSize: scale(13),
              color: colors.neutral400,
              lineHeight: scale(18)
            }}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
        </View>
        
        <Typo size={scale(12)} color={colors.neutral500} style={styles.notificationTime}>
          {formatDate(notification.sentAt)}
        </Typo>
      </View>
      
      {!notification.read && (
        <View style={styles.unreadIndicator} />
      )}
    </TouchableOpacity>
  );
};

const NotificationsScreen = () => {
  const router = useRouter();
  const { user } = useAuth(); // Use the useAuth hook to get the current user
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch notifications from Firestore
  const fetchNotifications = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const result = await getUserNotifications(user.uid);
      
      if (result.success && result.data) {
        // Sort by sent time (newest first)
        const sortedNotifications = result.data.sort((a: NotificationType, b: NotificationType) => 
          b.sentAt.getTime() - a.sentAt.getTime()
        );
        setNotifications(sortedNotifications);
      }
    } catch (error) {
      console.log('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);
  
  // Register for push notifications and save token
  const setupPushNotifications = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        await savePushToken(user.uid, token);
      }
    } catch (error) {
      console.log('Error setting up push notifications:', error);
    }
  }, [user?.uid]);
  
  // Check for loans needing notifications
  const checkLoansForNotifications = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const result = await checkAllLoansForNotifications(user.uid);
      
      if (result.success) {
        // Refresh notifications list if new notifications were created
        if (result.data?.scheduled > 0) {
          fetchNotifications();
        }
      }
    } catch (error) {
      console.log('Error checking loans for notifications:', error);
    }
  }, [user?.uid, fetchNotifications]);
  
  // Initial setup
  useEffect(() => {
    if (user?.uid) {
      fetchNotifications();
      setupPushNotifications();
      checkLoansForNotifications();
      
      // Set up regular checks for loan expirations (e.g., once per day)
      const dailyCheck = setInterval(() => {
        checkLoansForNotifications();
      }, 24 * 60 * 60 * 1000); // Every 24 hours
      
      return () => clearInterval(dailyCheck);
    }
  }, [user, fetchNotifications, setupPushNotifications, checkLoansForNotifications]);
  
  // Handle notification press
  const handleNotificationPress = async (notification: NotificationType) => {
    try {
      // Mark as read
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
        // Update local state
        setNotifications(prev => 
          prev.map(item => 
            item.id === notification.id ? { ...item, read: true } : item
          )
        );
      }
      
      // Navigate based on notification type
      if (notification.loanId) {
        router.push(`/loans/${notification.loanId}`);
      }
    } catch (error) {
      console.log('Error handling notification press:', error);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
    checkLoansForNotifications();
  };
  
  // Calculate unread count
  const unreadCount = notifications.filter(item => !item.read).length;
  
  if (loading && !refreshing) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <Header title="Notificaciones" />
        <Loading />
      </ScreenWrapper>
    );
  }
  
  return (
    <ScreenWrapper style={styles.wrapper}>
      <Header 
        title="Notificaciones" 
        rightIcon={
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={checkLoansForNotifications}
          >
            <Icons.ArrowClockwise size={scale(20)} color={colors.white} />
          </TouchableOpacity>
        }
      />
      
      {/* Notifications Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Typo size={scale(14)} color={colors.neutral400}>
            {unreadCount > 0 
              ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
              : 'No tienes notificaciones sin leer'}
          </Typo>
        </View>
      </View>
      
      {/* Notifications List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handleNotificationPress(item)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icons.Bell size={scale(48)} color={colors.neutral600} />
          <Typo color={colors.neutral400} style={{ marginTop: spacingY._15, textAlign: 'center' }}>
            No tienes notificaciones
          </Typo>
          <TouchableOpacity 
            style={styles.checkButton}
            onPress={checkLoansForNotifications}
          >
            <Typo color={colors.primary}>Verificar préstamos</Typo>
          </TouchableOpacity>
        </View>
      )}
    </ScreenWrapper>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.neutral950,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral950,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    padding: spacingX._15,
  },
  summaryCard: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    marginBottom: spacingY._15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  listContainer: {
    paddingHorizontal: spacingX._15,
    paddingBottom: spacingY._20,
  },
  notificationItem: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._12,
    marginBottom: spacingY._10,
    borderWidth: 1,
    borderColor: colors.neutral800,
    padding: spacingY._15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationRead: {
    backgroundColor: colors.neutral900,
    opacity: 0.8,
  },
  notificationIcon: {
    marginRight: spacingX._12,
    marginTop: spacingY._5,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    marginBottom: spacingY._5,
  },
  notificationTime: {
    marginTop: spacingY._5,
  },
  unreadIndicator: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: colors.primary,
    marginLeft: spacingX._7,
    marginTop: spacingY._5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingX._20,
  },
  checkButton: {
    marginTop: spacingY._15,
    padding: spacingY._10,
  },
});
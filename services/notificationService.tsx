import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { ResponseType, LoanType } from '@/types';
import { getClientNameById } from './clientService';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return null;
    }
    
    // Get the Expo push token
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Save user's push token to Firestore
export async function savePushToken(userId: string, token: string): Promise<ResponseType> {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, msg: 'User not found' };
    }
    
    await updateDoc(userRef, { 
      pushToken: token,
      updatedAt: new Date()
    });
    
    return { success: true, msg: 'Push token saved successfully' };
  } catch (error: any) {
    console.log('Error saving push token:', error);
    return { success: false, msg: error?.message || 'Error saving push token' };
  }
}

// Schedule a local notification for loan expiration
export async function scheduleLoanExpirationNotification(loan: LoanType): Promise<ResponseType> {
  try {
    if (!loan || !loan.nextPaymentDate) {
      return { success: false, msg: 'Invalid loan data' };
    }
    
    // Fetch client name if we have clientId
    let clientName = "Cliente";
    if (loan.clientId) {
      const clientResult = await getClientNameById(loan.clientId);
      if (clientResult.success && clientResult.data) {
        clientName = clientResult.data;
      }
    }
    
    const nextPaymentDate = new Date(loan.nextPaymentDate);
    const now = new Date();
    
    // Calculate days until payment is due
    const timeDiff = nextPaymentDate.getTime() - now.getTime();
    const daysUntilPayment = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Generate notification content based on days remaining
    let notificationContent: any = null;
    
    if (daysUntilPayment <= 0) {
      // Payment is overdue
      notificationContent = {
        title: '¡Pago vencido!',
        body: `El pago del préstamo de ${clientName} por ${loan.paymentAmount?.toFixed(2) || '0'} está vencido.`,
        data: { loanId: loan.id, type: 'loan_overdue' },
      };
    } else if (daysUntilPayment === 1) {
      // Payment due tomorrow
      notificationContent = {
        title: 'Pago vence mañana',
        body: `El pago del préstamo de ${clientName} por ${loan.paymentAmount?.toFixed(2) || '0'} vence mañana.`,
        data: { loanId: loan.id, type: 'loan_due_tomorrow' },
      };
    } else if (daysUntilPayment <= 3) {
      // Payment due in 2-3 days
      notificationContent = {
        title: 'Pago próximo a vencer',
        body: `El pago del préstamo de ${clientName} por ${loan.paymentAmount?.toFixed(2) || '0'} vence en ${daysUntilPayment} días.`,
        data: { loanId: loan.id, type: 'loan_due_soon' },
      };
    } else if (daysUntilPayment === 7) {
      // Payment due in a week
      notificationContent = {
        title: 'Recordatorio de pago',
        body: `El pago del préstamo de ${clientName} por ${loan.paymentAmount?.toFixed(2) || '0'} vence en 7 días.`,
        data: { loanId: loan.id, type: 'loan_reminder' },
      };
    }
    
    // Schedule notification if content was generated
    if (notificationContent) {
      // Cancel any existing notifications for this loan
      if (loan.id) {
        await cancelLoanNotifications(loan.id);
      }
      
      // Schedule new notification - using proper trigger format for Expo
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Send immediately
      });
      
      // Record notification in Firestore
      await recordNotification({
        userId: loan.uid,
        loanId: loan.id,
        clientId: loan.clientId,
        notificationId,
        title: notificationContent.title,
        body: notificationContent.body,
        type: notificationContent.data.type,
        sentAt: new Date(),
        read: false,
      });
      
      return { 
        success: true, 
        data: { notificationId },
        msg: 'Loan expiration notification scheduled' 
      };
    }
    
    return { 
      success: true, 
      msg: 'No notification needed at this time' 
    };
    
  } catch (error: any) {
    console.log('Error scheduling loan notification:', error);
    return { 
      success: false, 
      msg: error?.message || 'Error scheduling notification' 
    };
  }
}

// Cancel notifications for a specific loan
export async function cancelLoanNotifications(loanId: string): Promise<void> {
  try {
    // Query notifications for this loan
    const notificationsRef = collection(firestore, 'notifications');
    const q = query(notificationsRef, where('loanId', '==', loanId));
    const querySnapshot = await getDocs(q);
    
    // Cancel each notification
    querySnapshot.forEach(async (document) => {
      const notification = document.data();
      if (notification.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notification.notificationId);
      }
    });
  } catch (error) {
    console.log('Error canceling notifications:', error);
  }
}

// Record a notification in Firestore
export async function recordNotification(notificationData: any): Promise<ResponseType> {
  try {
    const notificationRef = doc(collection(firestore, 'notifications'));
    
    await setDoc(notificationRef, {
      ...notificationData,
      createdAt: new Date(),
    });
    
    return { 
      success: true, 
      data: { id: notificationRef.id },
      msg: 'Notification recorded successfully' 
    };
  } catch (error: any) {
    console.log('Error recording notification:', error);
    return { 
      success: false, 
      msg: error?.message || 'Error recording notification' 
    };
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<ResponseType> {
  try {
    const notificationRef = doc(firestore, 'notifications', notificationId);
    
    await updateDoc(notificationRef, {
      read: true,
      updatedAt: new Date()
    });
    
    return { 
      success: true, 
      msg: 'Notification marked as read' 
    };
  } catch (error: any) {
    console.log('Error marking notification as read:', error);
    return { 
      success: false, 
      msg: error?.message || 'Error updating notification' 
    };
  }
}

// Get all notifications for a user
export async function getUserNotifications(userId: string): Promise<ResponseType> {
  try {
    const notificationsRef = collection(firestore, 'notifications');
    const q = query(
      notificationsRef, 
      where('userId', '==', userId),
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: any[] = [];
    
    querySnapshot.forEach((doc) => {
      // Convert Firestore timestamps to Date objects
      const data = doc.data();
      const sentAt = data.sentAt?.toDate ? data.sentAt.toDate() : new Date(data.sentAt);
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      
      notifications.push({
        id: doc.id,
        ...data,
        sentAt,
        createdAt
      });
    });
    
    return {
      success: true,
      data: notifications
    };
  } catch (error: any) {
    console.log('Error fetching notifications:', error);
    return {
      success: false,
      msg: error?.message || 'Error fetching notifications'
    };
  }
}

// Check all user's active loans and schedule notifications as needed
export async function checkAllLoansForNotifications(userId: string): Promise<ResponseType> {
  try {
    // Query for all active and late loans
    const loansRef = collection(firestore, 'loans');
    const q = query(
      loansRef,
      where('uid', '==', userId),
      where('status', 'in', ['active', 'late'])
    );
    
    const querySnapshot = await getDocs(q);
    const results: any = { scheduled: 0, errors: 0 };
    
    // Schedule notifications for each loan
    for (const doc of querySnapshot.docs) {
      const loanData = doc.data();
      
      // Convert Firestore timestamps to Date objects
      const nextPaymentDate = loanData.nextPaymentDate?.toDate ? 
        loanData.nextPaymentDate.toDate() : 
        loanData.nextPaymentDate ? new Date(loanData.nextPaymentDate) : null;
      
      if (nextPaymentDate) {
        const loan = {
          id: doc.id,
          ...loanData,
          nextPaymentDate
        } as LoanType;
        
        const result = await scheduleLoanExpirationNotification(loan);
        
        if (result.success && result.data) {
          results.scheduled++;
        } else if (!result.success) {
          results.errors++;
        }
      }
    }
    
    return {
      success: true,
      data: results,
      msg: `Scheduled ${results.scheduled} notifications with ${results.errors} errors`
    };
  } catch (error: any) {
    console.log('Error checking loans for notifications:', error);
    return {
      success: false,
      msg: error?.message || 'Error checking loans for notifications'
    };
  }
}

// Send a push notification through Expo's push service
export async function sendPushNotification(pushToken: string, title: string, body: string, data: any = {}): Promise<ResponseType> {
  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const responseData = await response.json();
    
    if (responseData.data && responseData.data.status === 'ok') {
      return {
        success: true,
        data: responseData,
        msg: 'Push notification sent successfully'
      };
    } else {
      return {
        success: false,
        data: responseData,
        msg: 'Error sending push notification'
      };
    }
  } catch (error: any) {
    console.log('Error sending push notification:', error);
    return {
      success: false,
      msg: error?.message || 'Error sending push notification'
    };
  }
}
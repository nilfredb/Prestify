import * as Notifications from 'expo-notifications';
import { scheduleLoanExpirationNotification } from '@/services/notificationService';
import { Alert } from 'react-native';
import { LoanType } from '@/types';

// Create a test notification directly (no Firestore interaction)
export async function testDirectNotification() {
  try {
    // Request permissions if needed
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('Error', 'We need notification permissions to test this feature');
        return false;
      }
    }
    
    // Send a test notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Test Notification',
        body: 'This is a test notification from the loan app',
        data: { screen: 'test' },
      },
      trigger: null, // Show immediately
    });
    
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    Alert.alert('Error', 'Failed to send test notification');
    return false;
  }
}

// Create test notifications for different loan scenarios
export async function testLoanNotificationScenarios(userId: string) {
  try {
    const today = new Date();
    
    // Create mock loans with different scenarios
    const mockLoans: LoanType[] = [
      // Scenario 1: Payment overdue (yesterday)
      {
        id: 'test-overdue',
        uid: userId,
        clientId: 'test-client',
        amount: 5000,
        interestRate: 10,
        term: 12,
        paymentFrequency: 'monthly',
        startDate: new Date(),
        paymentAmount: 458.33,
        totalInterest: 500,
        totalAmount: 5500,
        totalPayments: 12,
        status: 'late',
        createdAt: new Date(),
        nextPaymentDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), // Yesterday
      },
      
      // Scenario 2: Payment due tomorrow
      {
        id: 'test-tomorrow',
        uid: userId,
        clientId: 'test-client',
        amount: 10000,
        interestRate: 12,
        term: 24,
        paymentFrequency: 'monthly',
        startDate: new Date(),
        paymentAmount: 500,
        totalInterest: 2000,
        totalAmount: 12000,
        totalPayments: 24,
        status: 'active',
        createdAt: new Date(),
        nextPaymentDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), // Tomorrow
      },
      
      // Scenario 3: Payment due in 3 days
      {
        id: 'test-soon',
        uid: userId,
        clientId: 'test-client',
        amount: 7500,
        interestRate: 8,
        term: 6,
        paymentFrequency: 'monthly',
        startDate: new Date(),
        paymentAmount: 1300,
        totalInterest: 300,
        totalAmount: 7800,
        totalPayments: 6,
        status: 'active',
        createdAt: new Date(),
        nextPaymentDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3), // In 3 days
      },
      
      // Scenario 4: Payment due in 7 days
      {
        id: 'test-week',
        uid: userId,
        clientId: 'test-client',
        amount: 15000,
        interestRate: 15,
        term: 36,
        paymentFrequency: 'monthly',
        startDate: new Date(),
        paymentAmount: 520,
        totalInterest: 3720,
        totalAmount: 18720,
        totalPayments: 36,
        status: 'active',
        createdAt: new Date(),
        nextPaymentDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7), // In 7 days
      },
    ];
    
    // Process each mock loan
    const results = [];
    for (const loan of mockLoans) {
      const result = await scheduleLoanExpirationNotification(loan);
      results.push({
        scenario: loan.id,
        success: result.success,
        message: result.msg,
        data: result.data
      });
    }
    
    // Show summary alert
    Alert.alert(
      'Test Completed',
      `Generated ${results.filter(r => r.success).length} test notifications`
    );
    
    return results;
  } catch (error) {
    console.error('Error testing loan notifications:', error);
    Alert.alert('Error', 'Failed to generate test notifications');
    return [];
  }
}
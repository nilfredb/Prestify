import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Alert } from 'react-native';
import { performDailyLoanCheck } from './loanCheckService';
import * as Notifications from 'expo-notifications';
import { getUserIdFromStorage, saveUserIdToStorage } from './userStorage';

// Task name for loan checks
const LOAN_CHECK_TASK = 'LOAN_CHECK_TASK';

// Define the task
TaskManager.defineTask(LOAN_CHECK_TASK, async () => {
  try {
    // Get the user ID from storage
    const userId = await getUserIdFromStorage();
    
    if (!userId) {
      console.log('No user ID found for background task');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    // Perform the loan checks
    const result = await performDailyLoanCheck(userId);
    
    if (result.success) {
      console.log('Background loan check completed:', result.data);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      console.log('Background loan check failed:', result.msg);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  } catch (error) {
    console.log('Error in background task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the background task
export async function registerLoanCheckBackgroundTask(userId: string): Promise<boolean> {
  try {
    // Save user ID to storage for background task access
    await saveUserIdToStorage(userId);
    
    // Register the background fetch task
    await BackgroundFetch.registerTaskAsync(LOAN_CHECK_TASK, {
      minimumInterval: 60 * 60, // Check once per hour (minimum allowed is 15 minutes)
      stopOnTerminate: false,   // Continue task when app is terminated
      startOnBoot: true,        // Run task when device restarts
    });
    
    console.log('Loan check background task registered');
    return true;
  } catch (error) {
    console.log('Error registering background task:', error);
    return false;
  }
}

// Unregister the background task
export async function unregisterLoanCheckBackgroundTask(): Promise<boolean> {
  try {
    await BackgroundFetch.unregisterTaskAsync(LOAN_CHECK_TASK);
    console.log('Loan check background task unregistered');
    return true;
  } catch (error) {
    console.log('Error unregistering background task:', error);
    return false;
  }
}

// Check if the background task is registered
export async function isLoanCheckTaskRegistered(): Promise<boolean> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOAN_CHECK_TASK);
    return isRegistered;
  } catch (error) {
    console.log('Error checking if task is registered:', error);
    return false;
  }
}

// Manually trigger a loan check (for testing or immediate checking)
export async function triggerManualLoanCheck(userId: string): Promise<any> {
  try {
    const result = await performDailyLoanCheck(userId);
    return result;
  } catch (error) {
    console.log('Error in manual loan check:', error);
    throw error;
  }
}

// Helper to check and request notification permissions
export async function checkNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Se necesitan permisos de notificación para alertarte sobre préstamos próximos a vencer.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('Error checking notification permissions:', error);
    return false;
  }
}
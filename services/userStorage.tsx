import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for user ID
const USER_ID_STORAGE_KEY = 'loan_app_user_id';

// Save user ID to AsyncStorage for background tasks
export async function saveUserIdToStorage(userId: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(USER_ID_STORAGE_KEY, userId);
    return true;
  } catch (error) {
    console.log('Error saving user ID to storage:', error);
    return false;
  }
}

// Get user ID from AsyncStorage for background tasks
export async function getUserIdFromStorage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
  } catch (error) {
    console.log('Error getting user ID from storage:', error);
    return null;
  }
}

// Clear user ID from storage (for logout)
export async function clearUserIdFromStorage(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(USER_ID_STORAGE_KEY);
    return true;
  } catch (error) {
    console.log('Error clearing user ID from storage:', error);
    return false;
  }
}
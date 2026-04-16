import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import Header from '@/components/Header';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { scale } from '@/utils/styling';
import * as Icons from 'phosphor-react-native';
import { testDirectNotification, testLoanNotificationScenarios } from '@/utils/notificationTester';
import { checkAllLoansForNotifications } from '@/services/notificationService';
import BackButton from '@/components/BackButton';

const NotificationTestScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  // Test a basic notification
  const handleTestBasicNotification = async () => {
    const success = await testDirectNotification();
    if (success) {
      Alert.alert('Success', 'Basic test notification sent. Check if you received it.');
    }
  };
  
  // Test loan notification scenarios
  const handleTestLoanScenarios = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to test loan notifications');
      return;
    }
    
    const results = await testLoanNotificationScenarios(user.uid);
    console.log('Test results:', results);
  };
  
  // Check real loans
  const handleCheckRealLoans = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to check loans');
      return;
    }
    
    try {
      const result = await checkAllLoansForNotifications(user.uid);
      
      if (result.success) {
        Alert.alert(
          'Check Complete', 
          `Checked your loans and scheduled ${result.data?.scheduled || 0} notifications`
        );
      } else {
        Alert.alert('Error', result.msg || 'Failed to check loans');
      }
    } catch (error) {
      console.error('Error checking loans:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };
  
  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="Notification Test"
        leftIcon={<BackButton />}
      />
      
      <View style={styles.content}>
        <View style={styles.section}>
          <Typo size={scale(18)} fontWeight="600" style={styles.sectionTitle}>
            Basic Tests
          </Typo>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestBasicNotification}
          >
            <Icons.Bell size={scale(20)} color={colors.white} />
            <Typo color={colors.white}>Test Basic Notification</Typo>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Typo size={scale(18)} fontWeight="600" style={styles.sectionTitle}>
            Loan Notification Tests
          </Typo>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestLoanScenarios}
          >
            <Icons.Clock size={scale(20)} color={colors.white} />
            <Typo color={colors.white}>Test Loan Scenarios</Typo>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.testButton, { backgroundColor: colors.success }]}
            onPress={handleCheckRealLoans}
          >
            <Icons.Database size={scale(20)} color={colors.white} />
            <Typo color={colors.white}>Check Your Real Loans</Typo>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoContainer}>
          <Icons.Info size={scale(20)} color={colors.neutral400} />
          <Typo size={scale(14)} color={colors.neutral400} style={styles.infoText}>
            Use these tools to test if notifications are working correctly on your device. 
            The "Test Loan Scenarios" option will create sample notifications for different 
            loan payment situations without affecting your actual data.
          </Typo>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral950,
  },
  content: {
    padding: spacingX._20,
  },
  section: {
    marginBottom: spacingY._30,
  },
  sectionTitle: {
    marginBottom: spacingY._15,
  },
  testButton: {
    backgroundColor: colors.primary,
    padding: spacingY._15,
    borderRadius: radius._10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacingY._10,
    gap: spacingX._10,
  },
  infoContainer: {
    backgroundColor: colors.neutral900,
    padding: spacingY._15,
    borderRadius: radius._10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.neutral800,
    marginTop: spacingY._20,
  },
  infoText: {
    flex: 1,
    marginLeft: spacingX._10,
  },
});

export default NotificationTestScreen;
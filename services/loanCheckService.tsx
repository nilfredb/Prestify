import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { LoanType, ResponseType } from '@/types';
import { scheduleLoanExpirationNotification } from './notificationService';
import { updateLoanStatus } from './loanService';

// Function to check all active loans for the current user and flag any that are late
export async function checkForLateLoanPayments(userId: string): Promise<ResponseType> {
  try {
    // Query for active loans
    const loansRef = collection(firestore, "loans");
    const q = query(
      loansRef,
      where("uid", "==", userId),
      where("status", "==", "active")
    );
    
    const querySnapshot = await getDocs(q);
    const results = { lateLoans: 0, checkedLoans: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
    
    // Check each loan for late payments
    for (const doc of querySnapshot.docs) {
      results.checkedLoans++;
      
      const loanData = doc.data();
      
      // Convert Firestore timestamp to Date
      const nextPaymentDate = loanData.nextPaymentDate?.toDate ? 
        loanData.nextPaymentDate.toDate() : 
        loanData.nextPaymentDate ? new Date(loanData.nextPaymentDate) : null;
      
      if (nextPaymentDate) {
        // Remove time part for date comparison
        const paymentDueDate = new Date(nextPaymentDate);
        paymentDueDate.setHours(0, 0, 0, 0);
        
        // Check if payment is late (due date is in the past)
        if (paymentDueDate < today) {
          // Mark loan as late
          await updateLoanStatus(doc.id, 'late');
          
          // Prepare loan object for notification
          const loan: LoanType = {
            id: doc.id,
            ...loanData,
            nextPaymentDate
          } as LoanType;
          
          // Schedule an overdue notification
          await scheduleLoanExpirationNotification(loan);
          
          results.lateLoans++;
        }
      }
    }
    
    return {
      success: true,
      data: results,
      msg: `Found ${results.lateLoans} late loans out of ${results.checkedLoans} checked`
    };
  } catch (error: any) {
    console.log("Error checking for late loans:", error);
    return {
      success: false,
      msg: error?.message || "Error checking for late loans"
    };
  }
}

// Function to check for upcoming payment due dates to send reminders
export async function checkForUpcomingPayments(userId: string): Promise<ResponseType> {
  try {
    // Query for active loans
    const loansRef = collection(firestore, "loans");
    const q = query(
      loansRef,
      where("uid", "==", userId),
      where("status", "in", ["active", "late"])
    );
    
    const querySnapshot = await getDocs(q);
    const results = { 
      reminders: {
        oneDay: 0,
        threeDays: 0,
        oneWeek: 0
      },
      checkedLoans: 0 
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
    
    // Get dates for 1, 3, and 7 days from now
    const oneDayFromNow = new Date(today);
    oneDayFromNow.setDate(today.getDate() + 1);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);
    
    // Check each loan for upcoming payments
    for (const doc of querySnapshot.docs) {
      results.checkedLoans++;
      
      const loanData = doc.data();
      
      // Convert Firestore timestamp to Date
      const nextPaymentDate = loanData.nextPaymentDate?.toDate ? 
        loanData.nextPaymentDate.toDate() : 
        loanData.nextPaymentDate ? new Date(loanData.nextPaymentDate) : null;
      
      if (nextPaymentDate) {
        // Remove time part for date comparison
        const paymentDueDate = new Date(nextPaymentDate);
        paymentDueDate.setHours(0, 0, 0, 0);
        
        // Prepare loan object for notification
        const loan: LoanType = {
          id: doc.id,
          ...loanData,
          nextPaymentDate
        } as LoanType;
        
        // Check if payment is due in exactly 1 day
        if (paymentDueDate.getTime() === oneDayFromNow.getTime()) {
          await scheduleLoanExpirationNotification(loan);
          results.reminders.oneDay++;
        }
        
        // Check if payment is due in exactly 3 days
        else if (paymentDueDate.getTime() === threeDaysFromNow.getTime()) {
          await scheduleLoanExpirationNotification(loan);
          results.reminders.threeDays++;
        }
        
        // Check if payment is due in exactly 7 days
        else if (paymentDueDate.getTime() === oneWeekFromNow.getTime()) {
          await scheduleLoanExpirationNotification(loan);
          results.reminders.oneWeek++;
        }
      }
    }
    
    return {
      success: true,
      data: results,
      msg: `Scheduled reminders for ${results.reminders.oneDay + results.reminders.threeDays + results.reminders.oneWeek} upcoming payments`
    };
  } catch (error: any) {
    console.log("Error checking for upcoming payments:", error);
    return {
      success: false,
      msg: error?.message || "Error checking for upcoming payments"
    };
  }
}

// Main function to perform a complete loan check (daily task)
export async function performDailyLoanCheck(userId: string): Promise<ResponseType> {
  try {
    // First check for late payments
    const lateCheckResult = await checkForLateLoanPayments(userId);
    
    // Then check for upcoming payments for reminders
    const upcomingCheckResult = await checkForUpcomingPayments(userId);
    
    // Combine results
    const results = {
      lateLoans: lateCheckResult.success ? lateCheckResult.data.lateLoans : 0,
      upcomingReminders: upcomingCheckResult.success ? 
        upcomingCheckResult.data.reminders.oneDay + 
        upcomingCheckResult.data.reminders.threeDays + 
        upcomingCheckResult.data.reminders.oneWeek : 0,
      checkedLoans: lateCheckResult.success ? lateCheckResult.data.checkedLoans : 0
    };
    
    return {
      success: true,
      data: results,
      msg: `Checked ${results.checkedLoans} loans: ${results.lateLoans} late, ${results.upcomingReminders} upcoming`
    };
  } catch (error: any) {
    console.log("Error in daily loan check:", error);
    return {
      success: false,
      msg: error?.message || "Error performing daily loan check"
    };
  }
}
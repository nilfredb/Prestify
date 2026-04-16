// services/loanService.tsx
import { ResponseType } from "@/types";
import { doc, setDoc, collection, updateDoc, deleteDoc, getDoc, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { updateClientLoanCount, updateClientDebt } from "./clientService";
import { LoanType } from "@/types"; 

// Create a new loan
export const createLoan = async (
  loanData: Partial<LoanType>
): Promise<ResponseType> => {
  try {
    // Create a new loan document reference
    const loanRef = loanData?.id
      ? doc(firestore, "loans", loanData.id)
      : doc(collection(firestore, "loans"));

    // Set default values for new loans
    const loanToSave = {
      ...loanData,
      paidAmount: 0, // Initialize paid amount to 0
      remainingBalance: loanData.totalAmount || loanData.amount, // Initialize remaining balance
      completedPayments: 0, // Initialize completed payments to 0
      nextPaymentDate: loanData.startDate, // Set initial next payment date
      createdAt: new Date(),
      updatedAt: new Date(),
      status: loanData.status || 'active',
    };

    // Save to Firestore
    await setDoc(loanRef, loanToSave, { merge: true });

    // Update client's loan count and debt
    if (loanData.clientId) {
      // Increment loan count
      await updateClientLoanCount(loanData.clientId, 1);
      
      // Update client's total debt
      if (loanData.totalAmount) {
        await updateClientDebt(loanData.clientId, loanData.totalAmount);
      }
    }

    return {
      success: true,
      data: { ...loanToSave, id: loanRef.id },
      msg: "Préstamo creado exitosamente"
    };
  } catch (error: any) {
    console.log("Error creating loan:", error);
    return {
      success: false,
      msg: error?.message || "Error al crear el préstamo"
    };
  }
};

// Update loan balance after payment
export const updateLoanBalanceAfterPayment = async (loanId: string, paymentAmount: number): Promise<ResponseType> => {
  try {
    // Get current loan data
    const loanDoc = await getDoc(doc(firestore, "loans", loanId));
    
    if (!loanDoc.exists()) {
      return {
        success: false,
        msg: "Loan not found"
      };
    }
    
    const loanData = loanDoc.data() as LoanType;
    
    // Calculate new values
    const currentPaidAmount = loanData.paidAmount || 0;
    const newPaidAmount = currentPaidAmount + paymentAmount;
    const totalAmount = loanData.totalAmount || loanData.amount || 0;
    const remainingBalance = Math.max(0, totalAmount - newPaidAmount);
    
    // Determine progress and payment status
    const standardPaymentAmount = loanData.paymentAmount || 0;
    
    // Determine how many full payments have been made
    // This works even with irregular payment amounts
    let completedPayments = 0;
    if (standardPaymentAmount > 0) {
      // Calculate how many full payments have been completed
      // For partial payments, this will not increment until enough partials add up to a full payment
      completedPayments = Math.floor(newPaidAmount / standardPaymentAmount);
    }
    
    // Calculate the payment progress as a percentage
    const paymentProgress = totalAmount > 0 ? (newPaidAmount / totalAmount) * 100 : 0;
    
    // Calculate the due amount for the current payment period
    // This is useful for tracking if partial payments have been made
    const amountDueForCurrentPeriod = Math.max(0, standardPaymentAmount * (completedPayments + 1) - newPaidAmount);
    
    // Update loan status based on payment
    let status = loanData.status;
    
    // If fully paid
    if (remainingBalance <= 0) {
      status = 'completed';
    } 
    // If previously late but now payment has been made, return to active
    else if (status === 'late' && paymentAmount > 0) {
      status = 'active';
    }
    // Could add more status logic here for other cases
    
    // Calculate next payment date based on payment frequency
    let nextPaymentDate = new Date(loanData.nextPaymentDate || loanData.startDate);
    if (completedPayments > (loanData.completedPayments || 0)) {
      // A new full payment has been completed, update the next payment date
      switch (loanData.paymentFrequency) {
        case 'weekly':
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
          break;
        case 'biweekly':
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 14);
          break;
        case 'monthly':
        default:
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
          break;
      }
    }
    
    // Update loan document with new values
    await updateDoc(doc(firestore, "loans", loanId), {
      paidAmount: newPaidAmount,
      remainingBalance: remainingBalance,
      completedPayments: completedPayments,
      paymentProgress: paymentProgress,
      amountDueForCurrentPeriod: amountDueForCurrentPeriod,
      nextPaymentDate: nextPaymentDate,
      status: status,
      updatedAt: new Date()
    });
    
    return {
      success: true,
      data: {
        paidAmount: newPaidAmount,
        remainingBalance: remainingBalance,
        completedPayments: completedPayments,
        status: status
      },
      msg: "Loan updated successfully after payment"
    };
  } catch (error: any) {
    console.log("Error updating loan after payment", error);
    return {
      success: false,
      msg: error?.message || "Failed to update loan after payment"
    };
  }
};

// Get a loan by ID
export const getLoanById = async (loanId: string): Promise<ResponseType> => {
  try {
    const loanRef = doc(firestore, "loans", loanId);
    const loanDoc = await getDoc(loanRef);
    
    if (!loanDoc.exists()) {
      return {
        success: false,
        msg: "Préstamo no encontrado"
      };
    }
    
    const loanData = loanDoc.data();
    
    // Convert timestamps to dates
    const startDate = loanData.startDate?.toDate ? loanData.startDate.toDate() : new Date(loanData.startDate);
    const createdAt = loanData.createdAt?.toDate ? loanData.createdAt.toDate() : new Date(loanData.createdAt);
    const updatedAt = loanData.updatedAt?.toDate ? loanData.updatedAt.toDate() : loanData.updatedAt ? new Date(loanData.updatedAt) : null;
    const nextPaymentDate = loanData.nextPaymentDate?.toDate ? loanData.nextPaymentDate.toDate() : loanData.nextPaymentDate ? new Date(loanData.nextPaymentDate) : null;
    
    return {
      success: true,
      data: { 
        id: loanDoc.id, 
        ...loanData,
        startDate,
        createdAt,
        updatedAt,
        nextPaymentDate
      }
    };
  } catch (error: any) {
    console.log("Error fetching loan:", error);
    return {
      success: false,
      msg: error?.message || "Error al obtener el préstamo"
    };
  }
};

export const updateLoan = async (
    loanId: string,
    loanData: Partial<LoanType>
  ): Promise<ResponseType> => {
    try {
      // Get current loan data to properly calculate updated fields
      const currentLoanResult = await getLoanById(loanId);
      if (!currentLoanResult.success) {
        return currentLoanResult;
      }
      
      const currentLoan = currentLoanResult.data as LoanType;
      const updatedLoan = { ...loanData };
      
      // If amount, interestRate, term, or paymentFrequency changes, recalculate payment amount and totals
      if (
        loanData.amount !== undefined ||
        loanData.interestRate !== undefined ||
        loanData.term !== undefined ||
        loanData.paymentFrequency !== undefined
      ) {
        const amount = loanData.amount || currentLoan.amount || 0;
        const interestRate = (loanData.interestRate || currentLoan.interestRate || 0) / 100;
        const term = loanData.term || currentLoan.term || 1;
        const frequency = loanData.paymentFrequency || currentLoan.paymentFrequency || 'monthly';
        
        // Calculate totals
        const totalInterest = amount * interestRate * term;
        const totalAmount = amount + totalInterest;
        
        // Calculate payments based on frequency
        let paymentsPerYear = 12; // Default for monthly
        switch (frequency) {
          case 'weekly':
            paymentsPerYear = 52;
            break;
          case 'biweekly':
            paymentsPerYear = 26;
            break;
          default:
            paymentsPerYear = 12;
        }
        
        const totalPayments = Math.round(term * (paymentsPerYear / 12));
        const paymentAmount = totalAmount / totalPayments;
        
        // Update calculated fields
        updatedLoan.totalInterest = totalInterest;
        updatedLoan.totalAmount = totalAmount;
        updatedLoan.totalPayments = totalPayments;
        updatedLoan.paymentAmount = paymentAmount;
        
        // Recalculate remaining balance based on new total and current paid amount
        const paidAmount = currentLoan.paidAmount || 0;
        updatedLoan.remainingBalance = Math.max(0, totalAmount - paidAmount);
        
        // Update payment progress as percentage
        updatedLoan.paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
        
        // Recalculate completed payments with the new payment amount
        if (paymentAmount > 0) {
          updatedLoan.completedPayments = Math.floor(paidAmount / paymentAmount);
        }
      }
      
      // Update the loan
      const loanRef = doc(firestore, "loans", loanId);
      await updateDoc(loanRef, {
        ...updatedLoan,
        updatedAt: new Date(),
      });
      
      return {
        success: true,
        msg: "Préstamo actualizado correctamente",
        data: { id: loanId, ...updatedLoan }
      };
    } catch (error: any) {
      console.log("Error updating loan:", error);
      return {
        success: false,
        msg: error?.message || "Error al actualizar el préstamo"
      };
    }
  };

// Update loan status
export const updateLoanStatus = async (
  loanId: string, 
  status: LoanType['status']
): Promise<ResponseType> => {
  try {
    const loanRef = doc(firestore, "loans", loanId);
    
    await updateDoc(loanRef, { 
      status, 
      updatedAt: new Date() 
    });
    
    return {
      success: true,
      msg: "Estado del préstamo actualizado correctamente"
    };
  } catch (error: any) {
    console.log("Error updating loan status:", error);
    return {
      success: false,
      msg: error?.message || "Error al actualizar el estado del préstamo"
    };
  }
};

// Get loans by client ID
export const getLoansByClientId = async (
  clientId: string,
  userId: string
): Promise<ResponseType> => {
  try {
    const loansRef = collection(firestore, "loans");
    
    // Create a query against the collection
    const q = query(
      loansRef,
      where("clientId", "==", clientId),
      where("uid", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Process results
    const loansList: LoanType[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore timestamp to Date
      const startDate = data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate);
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt ? new Date(data.updatedAt) : null;
      const nextPaymentDate = data.nextPaymentDate?.toDate ? data.nextPaymentDate.toDate() : data.nextPaymentDate ? new Date(data.nextPaymentDate) : null;
      
      loansList.push({ 
        id: doc.id, 
        ...data,
        startDate,
        createdAt,
        updatedAt,
        nextPaymentDate
      } as LoanType);
    });
    
    return {
      success: true,
      data: loansList
    };
  } catch (error: any) {
    console.log("Error fetching client loans:", error);
    return {
      success: false,
      msg: error?.message || "Error al obtener los préstamos del cliente"
    };
  }
};

// Mark a loan as late
export const markLoanAsLate = async (loanId: string): Promise<ResponseType> => {
  try {
    const loanRef = doc(firestore, "loans", loanId);
    
    await updateDoc(loanRef, { 
      status: 'late', 
      updatedAt: new Date() 
    });
    
    return {
      success: true,
      msg: "Préstamo marcado como en mora"
    };
  } catch (error: any) {
    console.log("Error marking loan as late:", error);
    return {
      success: false,
      msg: error?.message || "Error al marcar el préstamo como en mora"
    };
  }
};

// Record a payment for a loan
export const recordLoanPayment = async (
  loanId: string,
  paymentAmount: number,
  paymentDate: Date = new Date()
): Promise<ResponseType> => {
  try {
    // Get the current loan data
    const loanResult = await getLoanById(loanId);
    
    if (!loanResult.success || !loanResult.data) {
      return {
        success: false,
        msg: "Préstamo no encontrado"
      };
    }
    
    const loanData = loanResult.data as LoanType;
    const loanRef = doc(firestore, "loans", loanId);
    
    // Create a payment record in the payments subcollection
    const paymentRef = doc(collection(loanRef, "payments"));
    await setDoc(paymentRef, {
      amount: paymentAmount,
      date: paymentDate,
      loanId: loanId,
      clientId: loanData.clientId,
      createdAt: new Date()
    });
    
    // Update loan balance
    const balanceUpdateResult = await updateLoanBalanceAfterPayment(loanId, paymentAmount);
    
    if (!balanceUpdateResult.success) {
      return balanceUpdateResult;
    }
    
    return {
      success: true,
      data: balanceUpdateResult.data,
      msg: "Pago registrado exitosamente"
    };
  } catch (error: any) {
    console.log("Error recording payment:", error);
    return {
      success: false,
      msg: error?.message || "Error al registrar el pago"
    };
  }
};

// Delete a loan
export const deleteLoan = async (loanId: string): Promise<ResponseType> => {
  try {
    // Get loan data first to update client's loan count
    const loanResult = await getLoanById(loanId);
    
    if (!loanResult.success || !loanResult.data) {
      return {
        success: false,
        msg: "Préstamo no encontrado"
      };
    }
    
    const loanData = loanResult.data as LoanType;
    
    // Delete the loan
    await deleteDoc(doc(firestore, "loans", loanId));
    
    // Update client's loan count and debt
    if (loanData.clientId) {
      // Decrement loan count
      await updateClientLoanCount(loanData.clientId, -1);
      
      // Update client's total debt (subtract the loan amount)
      if (loanData.totalAmount) {
        await updateClientDebt(loanData.clientId, -loanData.totalAmount);
      }
    }
    
    return {
      success: true,
      msg: "Préstamo eliminado exitosamente"
    };
  } catch (error: any) {
    console.log("Error deleting loan:", error);
    return {
      success: false,
      msg: error?.message || "Error al eliminar el préstamo"
    };
  }
};
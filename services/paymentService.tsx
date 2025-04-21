// services/paymentService.tsx

import { firestore } from '@/config/firebase';
import { collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { uploadFileToCloudinary } from './imageServices';
import { updateLoanBalanceAfterPayment } from './loanService';
import { PaymentType, ResponseType } from '@/types';

// Create a new payment
export const createPayment = async (paymentData: Partial<PaymentType>): Promise<ResponseType> => {
  try {
    // Create a clean copy without undefined values
    let cleanedData: Record<string, any> = {};
    
    // Only copy defined values
    const paymentDataRecord = paymentData as Record<string, any>;
    for (const key in paymentDataRecord) {
      if (paymentDataRecord[key] !== undefined) {
        cleanedData[key] = paymentDataRecord[key];
      }
    }
    
    // Handle receipt image if provided
    if (cleanedData.receiptImage) {
      const imageUploadRes = await uploadFileToCloudinary(
        cleanedData.receiptImage,
        "receipts"
      );

      if (!imageUploadRes.success) {
        return {
          success: false,
          msg: "Failed to upload receipt image",
        };
      }

      cleanedData.receiptImage = imageUploadRes.data;
    }

    // Set default values
    const newPayment = {
      ...cleanedData,
      status: cleanedData.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to Firestore
    const paymentRef = await addDoc(collection(firestore, "payments"), newPayment);
    
    // Update loan balance if payment is confirmed
    let loanUpdateResult = null;
    if (cleanedData.loanId && cleanedData.status === 'confirmed' && cleanedData.amount) {
      loanUpdateResult = await updateLoanBalanceAfterPayment(cleanedData.loanId, cleanedData.amount);
      // If loan update failed, we should still return success for the payment creation
      // but include the error message
      if (!loanUpdateResult.success) {
        return {
          success: true,
          data: { id: paymentRef.id, ...newPayment },
          msg: "Payment created but loan update failed: " + loanUpdateResult.msg
        };
      }
    }

    return {
      success: true,
      data: { 
        id: paymentRef.id, 
        ...newPayment,
        loanUpdate: loanUpdateResult?.data || null
      },
    };
  } catch (error: any) {
    console.log("Error creating payment", error);
    return {
      success: false,
      msg: error?.message || "Unknown error",
    };
  }
};

// Get all payments for a loan
export const getPaymentsByLoanId = async (loanId: string): Promise<ResponseType> => {
  try {
    const paymentsQuery = query(
      collection(firestore, "payments"),
      where("loanId", "==", loanId),
      orderBy("paymentDate", "desc")
    );
    
    const querySnapshot = await getDocs(paymentsQuery);
    const payments: PaymentType[] = [];
    
    querySnapshot.forEach((doc) => {
      // Extract and convert firestore timestamps
      const data = doc.data();
      const paymentDate = data.paymentDate?.toDate ? data.paymentDate.toDate() : new Date(data.paymentDate);
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt ? new Date(data.updatedAt) : null;
      
      payments.push({ 
        id: doc.id, 
        ...data,
        paymentDate,
        createdAt,
        updatedAt
      } as PaymentType);
    });
    
    return {
      success: true,
      data: payments
    };
  } catch (error: any) {
    console.log("Error fetching payments", error);
    return {
      success: false,
      msg: error?.message || "Failed to fetch payments"
    };
  }
};

// Get a single payment by ID
export const getPaymentById = async (paymentId: string): Promise<ResponseType> => {
  try {
    const paymentDoc = await getDoc(doc(firestore, "payments", paymentId));
    
    if (!paymentDoc.exists()) {
      return {
        success: false,
        msg: "Payment not found"
      };
    }
    
    const data = paymentDoc.data();
    // Convert timestamps
    const paymentDate = data.paymentDate?.toDate ? data.paymentDate.toDate() : new Date(data.paymentDate);
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
    const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt ? new Date(data.updatedAt) : null;
    
    return {
      success: true,
      data: { 
        id: paymentDoc.id, 
        ...data,
        paymentDate,
        createdAt,
        updatedAt
      }
    };
  } catch (error: any) {
    console.log("Error fetching payment", error);
    return {
      success: false,
      msg: error?.message || "Failed to fetch payment"
    };
  }
};

// Update a payment
export const updatePayment = async (paymentId: string, paymentData: Partial<PaymentType>): Promise<ResponseType> => {
  try {
    // Create a clean copy without undefined values
    let cleanedData: Record<string, any> = {};
    
    // Only copy defined values
    const paymentDataRecord = paymentData as Record<string, any>;
    for (const key in paymentDataRecord) {
      if (paymentDataRecord[key] !== undefined) {
        cleanedData[key] = paymentDataRecord[key];
      }
    }
    
    // Handle receipt image upload if new image provided
    if (cleanedData.receiptImage && typeof cleanedData.receiptImage !== 'string') {
      const imageUploadRes = await uploadFileToCloudinary(
        cleanedData.receiptImage,
        "receipts"
      );

      if (!imageUploadRes.success) {
        return {
          success: false,
          msg: "Failed to upload receipt image",
        };
      }

      cleanedData.receiptImage = imageUploadRes.data;
    }

    // Get existing payment data
    const paymentRef = doc(firestore, "payments", paymentId);
    const paymentSnapshot = await getDoc(paymentRef);
    
    if (!paymentSnapshot.exists()) {
      return {
        success: false,
        msg: "Payment not found"
      };
    }
    
    const existingPayment = paymentSnapshot.data() as PaymentType;
    const oldStatus = existingPayment.status;
    const oldAmount = existingPayment.amount || 0;
    
    // Update the payment with clean data
    const updateData = {
      ...cleanedData,
      updatedAt: new Date()
    };
    
    await updateDoc(paymentRef, updateData);
    
    let loanUpdateResult = null;
    
    // If status changed to confirmed, update loan balance
    if (cleanedData.status === 'confirmed' && oldStatus !== 'confirmed') {
      loanUpdateResult = await updateLoanBalanceAfterPayment(
        existingPayment.loanId, 
        cleanedData.amount || oldAmount
      );
    }
    // If payment was already confirmed but amount changed, adjust the loan balance
    else if (cleanedData.status === 'confirmed' && oldStatus === 'confirmed' && 
            cleanedData.amount !== undefined && cleanedData.amount !== oldAmount) {
      // Need to adjust the loan by the difference
      const amountDifference = cleanedData.amount - oldAmount;
      loanUpdateResult = await updateLoanBalanceAfterPayment(
        existingPayment.loanId, 
        amountDifference
      );
    }
    
    return {
      success: true,
      data: loanUpdateResult?.data || null,
      msg: "Payment updated successfully"
    };
  } catch (error: any) {
    console.log("Error updating payment", error);
    return {
      success: false,
      msg: error?.message || "Failed to update payment"
    };
  }
};

// Delete a payment
export const deletePayment = async (paymentId: string): Promise<ResponseType> => {
  try {
    // Check if payment is in pending status (only pending payments can be deleted)
    const paymentRef = doc(firestore, "payments", paymentId);
    const paymentSnapshot = await getDoc(paymentRef);
    
    if (!paymentSnapshot.exists()) {
      return {
        success: false,
        msg: "Payment not found"
      };
    }
    
    const payment = paymentSnapshot.data() as PaymentType;
    
    if (payment.status !== 'pending') {
      return {
        success: false,
        msg: "Only pending payments can be deleted"
      };
    }
    
    await deleteDoc(paymentRef);
    
    return {
      success: true,
      msg: "Payment deleted successfully"
    };
  } catch (error: any) {
    console.log("Error deleting payment", error);
    return {
      success: false,
      msg: error?.message || "Failed to delete payment"
    };
  }
};

// Confirm a payment (change status to confirmed)
export const confirmPayment = async (paymentId: string): Promise<ResponseType> => {
  try {
    const paymentRef = doc(firestore, "payments", paymentId);
    const paymentSnapshot = await getDoc(paymentRef);
    
    if (!paymentSnapshot.exists()) {
      return {
        success: false,
        msg: "Payment not found"
      };
    }
    
    const payment = paymentSnapshot.data() as PaymentType;
    
    if (payment.status === 'confirmed') {
      return {
        success: true,
        msg: "Payment already confirmed"
      };
    }
    
    await updateDoc(paymentRef, { 
      status: 'confirmed',
      updatedAt: new Date()
    });
    
    // Update loan balance
    const loanUpdateResult = await updateLoanBalanceAfterPayment(payment.loanId, payment.amount);
    
    if (!loanUpdateResult.success) {
      return {
        success: true,
        msg: "Payment confirmed but loan update failed: " + loanUpdateResult.msg,
        data: { paymentStatus: 'confirmed', loanUpdateError: loanUpdateResult.msg }
      };
    }
    
    return {
      success: true,
      data: loanUpdateResult.data,
      msg: "Payment confirmed successfully"
    };
  } catch (error: any) {
    console.log("Error confirming payment", error);
    return {
      success: false,
      msg: error?.message || "Failed to confirm payment"
    };
  }
};

// Reject a payment (change status to rejected)
export const rejectPayment = async (paymentId: string): Promise<ResponseType> => {
  try {
    const paymentRef = doc(firestore, "payments", paymentId);
    await updateDoc(paymentRef, { 
      status: 'rejected',
      updatedAt: new Date()
    });
    
    return {
      success: true,
      msg: "Payment rejected successfully"
    };
  } catch (error: any) {
    console.log("Error rejecting payment", error);
    return {
      success: false,
      msg: error?.message || "Failed to reject payment"
    };
  }
};
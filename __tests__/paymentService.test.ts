import {
  createPayment,
  updatePayment,
} from '../services/paymentService';

const mockAddDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();

const mockUploadFileToCloudinary = jest.fn();
const mockUpdateLoanBalanceAfterPayment = jest.fn();

jest.mock('@/config/firebase', () => ({
  firestore: {},
}));

jest.mock('../services/imageServices', () => ({
  uploadFileToCloudinary: (...args: any[]) =>
    mockUploadFileToCloudinary(...args),
}));

jest.mock('../services/loanService', () => ({
  updateLoanBalanceAfterPayment: (...args: any[]) =>
    mockUpdateLoanBalanceAfterPayment(...args),
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: jest.fn(),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: jest.fn(),
  doc: (...args: any[]) => mockDoc(...args),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));

describe('paymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCollection.mockReturnValue({ kind: 'payments-collection' });
    mockDoc.mockImplementation((...args: any[]) => ({
      id: args[2] || 'payment-id',
      path: args,
    }));
    mockAddDoc.mockResolvedValue({ id: 'payment-1' });

    mockUpdateLoanBalanceAfterPayment.mockResolvedValue({
      success: true,
      data: {
        paidAmount: 300,
        remainingBalance: 900,
      },
    });
  });

  it('crea un pago pendiente por defecto', async () => {
    const result = await createPayment({
      loanId: 'loan-1',
      uid: 'user-1',
      amount: 100,
      paymentDate: new Date('2026-04-17'),
      paymentMethod: 'cash',
    });

    expect(mockAddDoc).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('payment-1');
    expect(result.data.status).toBe('pending');
  });

  it('crea un pago confirmado con recibo y actualiza el préstamo', async () => {
    mockUploadFileToCloudinary.mockResolvedValue({
      success: true,
      data: 'https://cloudinary.com/receipt.png',
    });

    const result = await createPayment({
      loanId: 'loan-1',
      uid: 'user-1',
      amount: 100,
      paymentDate: new Date('2026-04-17'),
      paymentMethod: 'cash',
      status: 'confirmed',
      receiptImage: 'file://receipt.png' as any,
    });

    expect(mockUploadFileToCloudinary).toHaveBeenCalled();
    expect(mockUpdateLoanBalanceAfterPayment).toHaveBeenCalledWith('loan-1', 100);
    expect(result.success).toBe(true);
    expect(result.data.receiptImage).toBe('https://cloudinary.com/receipt.png');
  });

  it('actualiza un pago pendiente a confirmado y sincroniza el préstamo', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        loanId: 'loan-1',
        amount: 100,
        status: 'pending',
      }),
    });

    const result = await updatePayment('payment-1', {
      status: 'confirmed',
      amount: 100,
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'confirmed',
        amount: 100,
        updatedAt: expect.any(Date),
      })
    );
    expect(mockUpdateLoanBalanceAfterPayment).toHaveBeenCalledWith('loan-1', 100);
    expect(result.success).toBe(true);
  });

  it('ajusta el préstamo si un pago confirmado cambia de monto', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        loanId: 'loan-1',
        amount: 100,
        status: 'confirmed',
      }),
    });

    const result = await updatePayment('payment-1', {
      status: 'confirmed',
      amount: 150,
    });

    expect(mockUpdateLoanBalanceAfterPayment).toHaveBeenCalledWith('loan-1', 50);
    expect(result.success).toBe(true);
  });

  it('retorna error si el pago no existe', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const result = await updatePayment('payment-x', {
      status: 'confirmed',
    });

    expect(result).toEqual({
      success: false,
      msg: 'Payment not found',
    });
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});
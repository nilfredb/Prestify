import {
  createOrUpdateClient,
  getClientById,
  updateClientStatus,
  updateClientLoanCount,
  updateClientDebt,
  deleteClient,
} from '../services/clientService';

const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockDeleteDoc = jest.fn();

jest.mock('@/config/firebase', () => ({
  firestore: {},
}));

jest.mock('../services/imageServices', () => ({
  uploadFileToCloudinary: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  collection: (...args: any[]) => mockCollection(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

const { uploadFileToCloudinary } = require('../services/imageServices');

describe('clientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCollection.mockReturnValue({ kind: 'collection-ref' });
    mockDoc.mockImplementation((...args: any[]) => {
      const maybeId = args[2];
      return { id: maybeId || 'generated-client-id', path: args };
    });
  });

  it('crea un cliente nuevo con valores por defecto', async () => {
    const result = await createOrUpdateClient({
      name: 'Ana',
      phone: '8090000000',
      uid: 'user-1',
    });

    expect(mockSetDoc).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Ana');
    expect(result.data.loans).toBe(0);
    expect(result.data.totalDebt).toBe(0);
    expect(result.data.status).toBe('Activo');
    expect(result.data.id).toBe('generated-client-id');
  });

  it('sube imagen si el cliente trae image', async () => {
    uploadFileToCloudinary.mockResolvedValue({
      success: true,
      data: 'https://cloudinary.com/client.png',
    });

    const result = await createOrUpdateClient({
      name: 'Ana',
      uid: 'user-1',
      image: { uri: 'file://client.png' },
    });

    expect(uploadFileToCloudinary).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data.image).toBe('https://cloudinary.com/client.png');
  });

  it('retorna error si falla la subida de imagen', async () => {
    uploadFileToCloudinary.mockResolvedValue({
      success: false,
      msg: 'Upload failed',
    });

    const result = await createOrUpdateClient({
      name: 'Ana',
      uid: 'user-1',
      image: { uri: 'file://client.png' },
    });

    expect(result).toEqual({
      success: false,
      msg: 'Upload failed',
    });
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('obtiene un cliente por id', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'client-1',
      data: () => ({
        name: 'Ana',
        uid: 'user-1',
        status: 'Activo',
      }),
    });

    const result = await getClientById('client-1');

    expect(result.success).toBe(true);
    expect(result.data.id).toBe('client-1');
    expect(result.data.name).toBe('Ana');
  });

  it('actualiza el estado de un cliente', async () => {
    const result = await updateClientStatus('client-1', 'Inactivo');

    expect(mockUpdateDoc).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      msg: 'Client status updated successfully',
    });
  });

  it('incrementa la cantidad de préstamos del cliente', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ loans: 2 }),
    });

    const result = await updateClientLoanCount('client-1', 1);

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        loans: 3,
        updatedAt: expect.any(Date),
      })
    );
    expect(result.success).toBe(true);
  });

  it('actualiza la deuda acumulada del cliente', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ totalDebt: 1000 }),
    });

    const result = await updateClientDebt('client-1', 500);

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        totalDebt: 1500,
        updatedAt: expect.any(Date),
      })
    );
    expect(result.success).toBe(true);
  });

  it('elimina un cliente', async () => {
    const result = await deleteClient('client-1');

    expect(mockDeleteDoc).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      msg: 'Client deleted successfully',
    });
  });
});
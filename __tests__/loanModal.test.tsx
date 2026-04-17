import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoanModal from '../app/(modals)/loanModal';

const mockBack = jest.fn();
const mockGetClientById = jest.fn();
const mockGetClients = jest.fn();
const mockCreateLoan = jest.fn();

jest.mock('@/components/ModalWrapper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children }: any) => React.createElement(View, null, children);
});

jest.mock('@/components/Header', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ title }: any) => React.createElement(Text, null, title);
});

jest.mock('@/components/BackButton', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => React.createElement(View);
});

jest.mock('@/components/Typo', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ children }: any) => React.createElement(Text, null, children);
});
jest.mock('@/components/Input', () => (props: any) => <TextInput {...props} />);
jest.mock('@/components/Button', () => ({ children, onPress }: any) => (
  <TouchableOpacity onPress={onPress}>
    <Text>{children}</Text>
  </TouchableOpacity>
));
jest.mock('@/components/Loading', () => () => <Text>Loading...</Text>);
jest.mock('@/components/CustomAlert', () => ({ visible, title, message }: any) => (
  visible ? <Text>{`${title}: ${message}`}</Text> : null
));

jest.mock('@/services/imageServices', () => ({ getProfileImage: jest.fn(() => null) }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ clientId: 'client-1' }),
}));
jest.mock('@/context/authContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));
jest.mock('@/services/clientService', () => ({
  getClientById: (...args: any[]) => mockGetClientById(...args),
  getClients: (...args: any[]) => mockGetClients(...args),
}));
jest.mock('@/services/loanService', () => ({
  createLoan: (...args: any[]) => mockCreateLoan(...args),
}));

describe('LoanModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClients.mockResolvedValue({
      success: true,
      data: [{ id: 'client-1', name: 'Juan Pérez', status: 'Activo' }],
    });
    mockGetClientById.mockResolvedValue({
      success: true,
      data: { id: 'client-1', name: 'Juan Pérez', status: 'Activo', image: null },
    });
  });

  it('valida que el monto sea obligatorio y mayor a 0', async () => {
    const { getByText, findByText } = render(<LoanModal />);

    await findByText('Nuevo Préstamo');
    await waitFor(() => expect(mockGetClientById).toHaveBeenCalledWith('client-1'));

    fireEvent.press(getByText('Crear Préstamo'));

    expect(await findByText('Validación: Ingresa un monto válido mayor a 0')).toBeTruthy();
    expect(mockCreateLoan).not.toHaveBeenCalled();
  });

  it('crea el préstamo cuando el formulario es válido', async () => {
    mockCreateLoan.mockResolvedValue({ success: true });

    const { getByPlaceholderText, getByText, findByText } = render(<LoanModal />);

    await findByText('Nuevo Préstamo');
    await waitFor(() => expect(mockGetClientById).toHaveBeenCalledWith('client-1'));

    fireEvent.changeText(getByPlaceholderText('Cantidad'), '10000');
    fireEvent.changeText(getByPlaceholderText('Porcentaje'), '12');
    fireEvent.changeText(getByPlaceholderText('Duración'), '6');
    fireEvent.changeText(getByPlaceholderText('Descripción o propósito del préstamo'), 'Capital inicial');
    fireEvent.press(getByText('Crear Préstamo'));

    await waitFor(() => {
      expect(mockCreateLoan).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'client-1',
          amount: 10000,
          interestRate: 12,
          term: 6,
          paymentFrequency: 'monthly',
          description: 'Capital inicial',
          uid: 'user-1',
          status: 'active',
        })
      );
    });

    expect(await findByText('Éxito: Préstamo creado correctamente')).toBeTruthy();
  });
});

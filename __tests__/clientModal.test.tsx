import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ClientModal from '../app/(modals)/clientModal';

const mockBack = jest.fn();
const mockCreateOrUpdateClient = jest.fn();

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

jest.mock('moti', () => ({ ScrollView: ({ children }: any) => <View>{children}</View> }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/context/authContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));
jest.mock('@/services/imageServices', () => ({ getProfileImage: jest.fn(() => null) }));
jest.mock('@/services/clientService', () => ({ createOrUpdateClient: (...args: any[]) => mockCreateOrUpdateClient(...args) }));
jest.mock('@/config/firebase', () => ({ firestore: {} }));

describe('ClientModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('valida que el nombre sea obligatorio', async () => {
    const { getByText, findByText } = render(<ClientModal />);

    fireEvent.press(getByText('Guardar'));

    expect(await findByText('Validación: Por favor ingresa el nombre del cliente')).toBeTruthy();
    expect(mockCreateOrUpdateClient).not.toHaveBeenCalled();
  });

  it('guarda el cliente cuando los datos son válidos', async () => {
    mockCreateOrUpdateClient.mockResolvedValue({ success: true });

    const { getByPlaceholderText, getByText, findByText } = render(<ClientModal />);

    fireEvent.changeText(getByPlaceholderText('Nombre del cliente'), 'Juan Pérez');
    fireEvent.changeText(getByPlaceholderText('Número de teléfono'), '8095550000');
    fireEvent.press(getByText('Guardar'));

    await waitFor(() => {
      expect(mockCreateOrUpdateClient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Juan Pérez',
          phone: '8095550000',
          uid: 'user-1',
          status: 'Activo',
        })
      );
    });

    expect(await findByText('Éxito: Cliente creado correctamente')).toBeTruthy();
  });
});

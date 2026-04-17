import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ClientModal from '../app/(modals)/clientModal';

const mockBack = jest.fn();
const mockCreateOrUpdateClient = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();

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

jest.mock('@/components/Input', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return (props: any) => React.createElement(TextInput, props);
});

jest.mock('@/components/Button', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return ({ children, onPress }: any) =>
    React.createElement(
      TouchableOpacity,
      { onPress },
      React.createElement(Text, null, children)
    );
});

jest.mock('@/components/Loading', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'Loading...');
});

jest.mock('@/components/CustomAlert', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ visible, title, message }: any) =>
    visible ? React.createElement(Text, null, `${title}: ${message}`) : null;
});

jest.mock('moti', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ScrollView: ({ children }: any) => React.createElement(View, null, children),
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/context/authContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));

jest.mock('@/services/imageServices', () => ({
  getProfileImage: jest.fn(() => null),
}));

jest.mock('@/services/clientService', () => ({
  createOrUpdateClient: (...args: any[]) => mockCreateOrUpdateClient(...args),
}));

jest.mock('@/config/firebase', () => ({
  firestore: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
}));

describe('ClientModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockDoc.mockImplementation((...args: any[]) => ({
      id: args[2] || 'client-id',
      path: args,
    }));

    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });
  });

  it('valida que el nombre sea obligatorio', async () => {
    const { getByText, findByText } = render(<ClientModal />);

    fireEvent.press(getByText('Guardar'));

    expect(
      await findByText('Validación: Por favor ingresa el nombre del cliente')
    ).toBeTruthy();
    expect(mockCreateOrUpdateClient).not.toHaveBeenCalled();
  });

  it('guarda el cliente cuando los datos son válidos', async () => {
    mockCreateOrUpdateClient.mockResolvedValue({ success: true });

    const { getByPlaceholderText, getByText, findByText } = render(
      <ClientModal />
    );

    fireEvent.changeText(
      getByPlaceholderText('Nombre del cliente'),
      'Juan Pérez'
    );
    fireEvent.changeText(
      getByPlaceholderText('Número de teléfono'),
      '8095550000'
    );
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

    expect(
      await findByText('Éxito: Cliente creado correctamente')
    ).toBeTruthy();
  });
});
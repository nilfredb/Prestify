import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import Clients from '../app/(dashboard)/clients';

const mockPush = jest.fn();
const mockUseFetchClients = jest.fn();

jest.mock('@/components/ScreenWrapper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children }: any) => React.createElement(View, null, children);
});

jest.mock('@/components/Typo', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ children }: any) => React.createElement(Text, null, children);
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
jest.mock('@/components/Loading', () => () => <Text>Loading...</Text>);
jest.mock('expo-image', () => ({ Image: (props: any) => <View {...props} /> }));
jest.mock('expo-blur', () => ({ BlurView: ({ children }: any) => <View>{children}</View> }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  router: { push: mockPush },
}));
jest.mock('@/context/authContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));
jest.mock('@/hooks/useFetchClients', () => (...args: any[]) => mockUseFetchClients(...args));
jest.mock('@/services/imageServices', () => ({ getProfileImage: jest.fn(() => null) }));

describe('Clients screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra el estado vacío cuando no hay clientes', () => {
    mockUseFetchClients.mockReturnValue({ clients: [], loading: false, error: null });

    const { getByText } = render(<Clients />);

    expect(getByText('No hay clientes. Toca el botón + para agregar uno.')).toBeTruthy();
  });

  it('redirige al modal para agregar cliente', () => {
    mockUseFetchClients.mockReturnValue({ clients: [], loading: false, error: null });

    const { getByText } = render(<Clients />);

    fireEvent.press(getByText('Agregar Cliente'));

    expect(mockPush).toHaveBeenCalledWith('/(modals)/clientModal');
  });
});

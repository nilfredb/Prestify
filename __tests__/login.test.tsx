import React from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Login from '../app/(auth)/login';

const mockReplace = jest.fn();
const mockLogin = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('@/context/authContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

jest.mock('@/components/BackButton', () => () => null);

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

jest.mock('@/components/Input', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return ({ placeholder, onChangeText, secureTextEntry }: any) =>
    React.createElement(TextInput, {
      placeholder,
      onChangeText,
      secureTextEntry,
    });
});

jest.mock('@/components/Button', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return ({ children, onPress }: any) =>
    React.createElement(
      TouchableOpacity,
      { onPress },
      React.createElement(
        Text,
        null,
        typeof children === 'string' ? children : 'Login'
      ),
      children
    );
});

describe('Login Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renderiza email, password y botón login', () => {
    const { getByPlaceholderText, getAllByText } = render(<Login />);

    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getAllByText('Login').length).toBeGreaterThan(0);
  });

  it('muestra alerta si los campos están vacíos', () => {
    const { getAllByText } = render(<Login />);

    fireEvent.press(getAllByText('Login')[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Login',
      'Please fill all the fields'
    );
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('llama a login con datos válidos', async () => {
    mockLogin.mockResolvedValue({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<Login />);

    fireEvent.changeText(
      getByPlaceholderText('Enter your email'),
      'test@test.com'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter your password'),
      '12345678'
    );
    fireEvent.press(getAllByText('Login')[0]);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', '12345678');
    });
  });

  it('redirige al dashboard cuando el login es exitoso', async () => {
    mockLogin.mockResolvedValue({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<Login />);

    fireEvent.changeText(
      getByPlaceholderText('Enter your email'),
      'test@test.com'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter your password'),
      '12345678'
    );
    fireEvent.press(getAllByText('Login')[0]);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(dashboard)');
    });
  });

  it('muestra alerta cuando el login falla', async () => {
    mockLogin.mockResolvedValue({
      success: false,
      msg: 'Invalid credentials',
    });

    const { getByPlaceholderText, getAllByText } = render(<Login />);

    fireEvent.changeText(
      getByPlaceholderText('Enter your email'),
      'wrong@test.com'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter your password'),
      'wrongpass'
    );
    fireEvent.press(getAllByText('Login')[0]);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login',
        'Invalid credentials'
      );
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
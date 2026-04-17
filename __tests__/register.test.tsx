import React from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Register from '../app/(auth)/register';

const mockReplace = jest.fn();
const mockRegister = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('@/context/authContext', () => ({
  useAuth: () => ({
    register: mockRegister,
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
        typeof children === 'string' ? children : 'Sign Up'
      ),
      children
    );
});

describe('Register Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renderiza campos de nombre, email, password y botón', () => {
    const { getByPlaceholderText, getAllByText } = render(<Register />);

    expect(getByPlaceholderText('Enter your name')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getAllByText('Sign Up').length).toBeGreaterThan(0);
  });

  it('muestra alerta si faltan campos', () => {
    const { getAllByText } = render(<Register />);

    fireEvent.press(getAllByText('Sign Up')[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign up',
      'Please fill all the fields'
    );
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('llama a register con datos válidos', async () => {
    mockRegister.mockResolvedValue({ success: true });

    const { getByPlaceholderText, getAllByText } = render(<Register />);

    fireEvent.changeText(getByPlaceholderText('Enter your name'), 'Nilfred');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), '12345678');

    fireEvent.press(getAllByText('Sign Up')[0]);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'test@test.com',
        '12345678',
        'Nilfred'
      );
    });
  });

  it('muestra alerta cuando el registro falla', async () => {
    mockRegister.mockResolvedValue({
      success: false,
      msg: 'Email already in use',
    });

    const { getByPlaceholderText, getAllByText } = render(<Register />);

    fireEvent.changeText(getByPlaceholderText('Enter your name'), 'Nilfred');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), '12345678');

    fireEvent.press(getAllByText('Sign Up')[0]);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sign up',
        'Email already in use'
      );
    });
  });
});
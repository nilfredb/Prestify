import React from 'react';
import { Text, View } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import Dashboard from '../app/(dashboard)/index';

const mockPush = jest.fn();
const mockGetDocs = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/context/authContext', () => ({
  useAuth: () => ({
    user: { uid: 'user-1', name: 'Nilfred' },
  }),
}));

jest.mock('@/services/loanCheckService', () => ({
  checkForLateLoanPayments: jest.fn().mockResolvedValue(undefined),
  checkForUpcomingPayments: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/loanService', () => ({
  updateLoanBalanceAfterPayment: jest.fn().mockResolvedValue({ success: true }),
  updateLoanStatus: jest.fn(),
}));

jest.mock('@/config/firebase', () => ({
  firestore: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    now: () => ({
      toDate: () => new Date('2026-04-17T10:00:00'),
    }),
  },
  getDocs: (...args: any[]) => mockGetDocs(...args),
}));

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

jest.mock('@/components/SectionHeader', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ title }: any) => React.createElement(Text, null, title);
});

jest.mock('moti', () => ({
  MotiView: ({ children }: any) => <View>{children}</View>,
}));

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carga y muestra resumen financiero básico', async () => {
    const today = new Date();

    mockGetDocs
      .mockResolvedValueOnce({
        size: 2,
        docs: [
          { id: 'c1', data: () => ({ name: 'Ana' }) },
          { id: 'c2', data: () => ({ name: 'Luis' }) },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'l1',
            data: () => ({
              clientId: 'c1',
              clientName: 'Ana',
              amount: 1000,
              status: 'active',
              paymentAmount: 100,
              nextPaymentDate: today,
              createdAt: today,
            }),
          },
          {
            id: 'l2',
            data: () => ({
              clientId: 'c2',
              clientName: 'Luis',
              amount: 500,
              status: 'late',
              paymentAmount: 50,
              nextPaymentDate: new Date(today.getTime() + 86400000),
              createdAt: today,
            }),
          },
        ],
      })
      .mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

    const { getByText } = render(<Dashboard />);

    await waitFor(() => {
      expect(getByText('Resumen Financiero')).toBeTruthy();
      expect(getByText('Clientes Activos')).toBeTruthy();
      expect(getByText('Total Prestado')).toBeTruthy();
      expect(getByText('RD$1,500')).toBeTruthy();
    });
  });
});
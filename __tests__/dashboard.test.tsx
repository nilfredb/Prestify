import React from 'react';
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

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => React.createElement(View, props),
  };
});

jest.mock('moti', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MotiView: ({ children }: any) => React.createElement(View, null, children),
  };
});

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetDocs.mockResolvedValue({
      empty: true,
      size: 0,
      docs: [],
    });
  });

  it('carga y muestra el resumen financiero base', async () => {
    const { findByText } = render(<Dashboard />);

    expect(await findByText('Resumen Financiero')).toBeTruthy();
    expect(await findByText('Clientes Activos')).toBeTruthy();
    expect(await findByText('Total Prestado')).toBeTruthy();
  });
});
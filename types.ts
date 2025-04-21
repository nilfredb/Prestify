import { Href } from "expo-router";
import { Firestore, Timestamp } from "firebase/firestore";
import { Icon } from "phosphor-react-native";
import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  ActivityIndicatorProps,
  ImageStyle,
  PressableProps,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

export type ScreenWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
};
export type ModalWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
  bg?: string;
};
export type accountOptionType = {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  routeName?: any;
};

export type TypoProps = {
  size?: number;
  color?: string;
  fontWeight?: TextStyle["fontWeight"];
  children: any | null;
  style?: TextStyle;
  textProps?: TextProps;
};
export interface StatsData {
  totalLoaned: number;
  totalRecovered: number;
  pendingCollection: number;
  activeLoans: number;
  completedLoans: number;
  lateLoans: number;
  clientCount: number;
  clientsWithLoans: number;
  monthlyLoansData: number[];
  monthlyPaymentsData: number[];
  statusDistribution: {
    name: string;
    count: number;
    color: string;
  }[];
  paymentActivity: {
    date: string;
    count: number;
  }[];
  isLoading: boolean;
};
export const initialStatsData: StatsData = {
  totalLoaned: 0,
  totalRecovered: 0,
  pendingCollection: 0,
  activeLoans: 0,
  completedLoans: 0,
  lateLoans: 0,
  clientCount: 0,
  clientsWithLoans: 0,
  monthlyLoansData: [0, 0, 0, 0, 0, 0],
  monthlyPaymentsData: [0, 0, 0, 0, 0, 0],
  statusDistribution: [],
  paymentActivity: [],
  isLoading: true
};

export type IconComponent = React.ComponentType<{
  height?: number;
  width?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string;
}>;

export type IconProps = {
  name: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  fill?: string;
};

export type HeaderProps = {
  title?: string;
  style?: ViewStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export interface BackButtonProps {
  style?: ViewStyle;
  iconSize?: number;
  iconColor?: string;
  backgroundColor?: string;
  onPress?: () => void;
}

export type TransactionType = {
  id?: string;
  type: string;
  amount: number;
  category?: string;
  date: Date | Timestamp | string;
  description?: string;
  image?: any;
  uid?: string;
  walletId: string;
};

export type CategoryType = {
  label: string;
  value: string;
  icon: Icon;
  bgColor: string;
};
export type ExpenseCategoriesType = {
  [key: string]: CategoryType;
};

export type TransactionListType = {
  data: TransactionType[];
  title?: string;
  loading?: boolean;
  emptyListMessage?: string;
};

export type TransactionItemProps = {
  item: TransactionType;
  index: number;
  handleClick: Function;
};

export interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  inputRef?: React.RefObject<TextInput>;
  label?: string;
  //   error?: string;
}

// Add this to your types.ts file
export type ClientType = {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  status: 'Activo' | 'En mora' | 'Inactivo';
  loans?: number;
  totalDebt?: number;
  createdAt?: Date;
  updatedAt?: Date;
  notes?: string;
  image?: any;
  uid: string; // User ID of the owner
};

export interface LoanType {
  id?: string;
  clientId: string;
  amount: number;
  interestRate: number;
  term: number;
  paymentFrequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: Date;
  description?: string;
  paymentAmount: number;
  totalInterest: number;
  totalAmount: number;
  totalPayments: number;
  status: 'active' | 'completed' | 'late';
  uid: string;
  createdAt: Date;
  updatedAt?: Date;
  
  // Propiedades faltantes
  lastPaymentDate?: Date;        // Para tracking de últimos pagos
  completedPayments?: number;      // Para cálculo de pagos restantes
  paymentsMade?: number;         // Para cálculo de recuperación
  nextPaymentDate?: Date;        // Para recordatorios
  paidAmount?: number;         // Para cálculo de cuotas
  paymentProgress?: number;      // Para seguimiento de pagos
  paymentHistory?: Array<{       // Para historial detallado
    date: Date;
    amount: number;
    method?: string;
  }>;
  lateDays?: number;             // Para cálculo de mora
  remainingBalance?: number;     // Para seguimiento de deuda
  notes?: string;                // Observaciones adicionales
};

export interface CustomButtonProps extends TouchableOpacityProps {
  style?: ViewStyle;
  onPress?: () => void;
  loading?: boolean;
  children: React.ReactNode;
};

export type ImageUploadProps = {
  file?: any;
  onSelect: (file: any) => void;
  onClear: () => void;
  containerStyle?: ViewStyle;
  imageStyle?: ViewStyle;
  placeholder?: string;
};
export interface PaymentType {
  id?: string;
  uid?: string; // User ID of the owner
  loanId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'other';
  notes?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  receiptImage?: string; // URL to uploaded receipt image
  createdAt: Date;
  updatedAt: Date;
};

export interface PaymentActionModalProps {
  visible: boolean;
  payment: PaymentType | null;
  onClose: () => void;
  onPaymentUpdated: () => void;
};

export type UserType = {
  uid?: string;
  email?: string | null;
  name: string | null;
  image?: any;
} | null;

export type UserDataType = {
  name: string;
  image?: any;
};

export type AuthContextType = {
  user: UserType;
  setUser: Function;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; msg?: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; msg?: string }>;
  updateUserData: (userId: string) => Promise<void>;

  // ✅ Añade esto:
  updateEmailWithVerification: (
    newEmail: string,
    currentPassword: string
  ) => Promise<{ success: boolean; msg?: string }>;
};

export type ResponseType = {
  success: boolean;
  data?: any;
  msg?: string;
};

export type WalletType = {
  id?: string;
  name: string;
  amount?: number;
  totalIncome?: number;
  totalExpenses?: number;
  image: any;
  uid?: string;
  createdAt?: Date;
};

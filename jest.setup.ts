import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-gesture-handler', () => {
  return {
    GestureHandlerRootView: ({ children }: any) => children,
    PanGestureHandler: ({ children }: any) => children,
    TapGestureHandler: ({ children }: any) => children,
    State: {},
  };
});

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => React.createElement(View, props, props.children),
  };
});

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
}));

jest.mock('moti', () => ({
  MotiView: ({ children }: any) => children,
}));

jest.mock('phosphor-react-native', () => {
  const React = require('react');
  return new Proxy(
    {},
    {
      get: () => (props: any) => React.createElement('Icon', props),
    }
  );
});
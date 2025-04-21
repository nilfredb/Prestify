import React from 'react';
import Modal from 'react-native-modal';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { colors, radius, spacingY, spacingX } from '@/constants/theme';
import * as Icon from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

// Alert types with different icons and colors
export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface CustomAlertProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
  onCancel?: () => void;
  type?: AlertType;
  showBackdrop?: boolean;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title = 'Notice',
  message,
  onClose,
  confirmText = 'OK',
  cancelText,
  onCancel,
  type = 'info',
  showBackdrop = true,
}) => {
  // Get icon based on alert type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Icon.CheckCircle size={40} weight="fill" color={colors.success} />;
      case 'error':
        return <Icon.WarningCircle size={40} weight="fill" color={colors.danger} />;
      case 'warning':
        return <Icon.Warning size={40} weight="fill" color={colors.warning} />;
      case 'info':
      default:
        return <Icon.Info size={40} weight="fill" color={colors.primary} />;
    }
  };

  // Get title color based on alert type
  const getTitleColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.danger;
      case 'warning':
        return colors.warning;
      case 'info':
      default:
        return colors.primary;
    }
  };

  // Get button color based on alert type
  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.danger;
      case 'warning':
        return colors.warning;
      case 'info':
      default:
        return colors.primary;
    }
  };

  return (
    <Modal
      isVisible={visible}
      animationIn="fadeInUp"
      animationOut="fadeOutDown"
      animationInTiming={400}
      animationOutTiming={300}
      backdropTransitionInTiming={400}
      backdropTransitionOutTiming={300}
      backdropOpacity={showBackdrop ? 0.5 : 0}
      useNativeDriverForBackdrop
      statusBarTranslucent
      customBackdrop={
        showBackdrop ? (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={30}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : undefined
        ) : null
      }
    >
      <View style={styles.modalContainer}>
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
        
        <Text style={[styles.title, { color: getTitleColor() }]}>
          {title}
        </Text>
        
        <Text style={styles.message}>
          {message}
        </Text>
        
        <View style={styles.buttonContainer}>
          {cancelText && (
            <TouchableOpacity 
              onPress={onCancel || onClose} 
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>
                {cancelText}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            onPress={onClose} 
            style={[
              styles.confirmButton, 
              { backgroundColor: getButtonColor() },
              cancelText ? { flex: 1 } : { minWidth: 120 }
            ]}
          >
            <Text style={styles.confirmButtonText}>
              {confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.neutral900,
    padding: spacingY._20,
    borderRadius: radius._15,
    alignItems: 'center',
    maxWidth: width * 0.85,
    alignSelf: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.neutral800,
  },
  iconContainer: {
    marginBottom: spacingY._10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 50,
    padding: spacingY._10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacingY._10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.neutral200,
    textAlign: 'center',
    marginBottom: spacingY._20,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacingX._10,
  },
  confirmButton: {
    padding: spacingY._12,
    borderRadius: radius._10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    padding: spacingY._12,
    borderRadius: radius._10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral800,
    flex: 1,
  },
  cancelButtonText: {
    color: colors.neutral200,
    fontWeight: '600',
    fontSize: 16,
  },
});
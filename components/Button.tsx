import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  icon,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    getVariantStyle(variant),
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    getTextStyle(variant),
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'outline' || variant === 'ghost'
              ? Colors.primary[500]
              : Colors.white
          }
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const getVariantStyle = (variant: ButtonVariant): ViewStyle => {
  switch (variant) {
    case 'primary':
      return styles.primaryButton;
    case 'secondary':
      return styles.secondaryButton;
    case 'outline':
      return styles.outlineButton;
    case 'ghost':
      return styles.ghostButton;
    case 'danger':
      return styles.dangerButton;
    default:
      return styles.primaryButton;
  }
};

const getTextStyle = (variant: ButtonVariant): TextStyle => {
  switch (variant) {
    case 'primary':
      return styles.primaryText;
    case 'secondary':
      return styles.secondaryText;
    case 'outline':
      return styles.outlineText;
    case 'ghost':
      return styles.ghostText;
    case 'danger':
      return styles.dangerText;
    default:
      return styles.primaryText;
  }
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.7,
  },
  primaryButton: {
    backgroundColor: Colors.primary[500],
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: Colors.secondary[500],
  },
  secondaryText: {
    color: Colors.white,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary[500],
  },
  outlineText: {
    color: Colors.primary[500],
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: Colors.primary[500],
  },
  dangerButton: {
    backgroundColor: Colors.error[500],
  },
  dangerText: {
    color: Colors.white,
  },
});

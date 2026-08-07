/**
 * Reusable Card Component
 */

import React from 'react';
import { View, TouchableOpacity, ViewProps } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: ViewProps['style'];
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'md',
  className = '',
  style,
}) => {
  const variantStyles = {
    default: 'bg-white',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border border-gray-200',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const baseStyles = `rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={baseStyles}
        style={style}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseStyles} style={style}>
      {children}
    </View>
  );
};

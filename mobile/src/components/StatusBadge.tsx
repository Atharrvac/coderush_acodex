/**
 * Status Badge Component
 * Displays complaint status with color coding
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  submitted: {
    color: '#F59E0B',
    bg: '#FEF3C7',
    label: 'Submitted',
    icon: 'time-outline'
  },
  assigned: {
    color: '#3B82F6',
    bg: '#DBEAFE',
    label: 'Assigned',
    icon: 'person-outline'
  },
  in_progress: {
    color: '#8B5CF6',
    bg: '#EDE9FE',
    label: 'In Progress',
    icon: 'construct-outline'
  },
  resolved: {
    color: '#10B981',
    bg: '#D1FAE5',
    label: 'Resolved',
    icon: 'checkmark-circle-outline'
  },
  rejected: {
    color: '#EF4444',
    bg: '#FEE2E2',
    label: 'Rejected',
    icon: 'close-circle-outline'
  },
  posted: {
    color: '#F59E0B',
    bg: '#FEF3C7',
    label: 'Posted',
    icon: 'paper-plane-outline'
  },
  being_helped: {
    color: '#3B82F6',
    bg: '#DBEAFE',
    label: 'Being Helped',
    icon: 'people-outline'
  },
  solved: {
    color: '#10B981',
    bg: '#D1FAE5',
    label: 'Solved',
    icon: 'checkmark-done-outline'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'medium',
  showIcon = true 
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  
  const sizeStyles = {
    small: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 11 },
    medium: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 13 },
    large: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 15 }
  };

  const iconSizes = {
    small: 14,
    medium: 16,
    large: 18
  };

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.bg },
      sizeStyles[size]
    ]}>
      {showIcon && (
        <Ionicons 
          name={config.icon as any} 
          size={iconSizes[size]} 
          color={config.color}
          style={styles.icon}
        />
      )}
      <Text style={[
        styles.text,
        { color: config.color, fontSize: sizeStyles[size].fontSize }
      ]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '700',
  },
});

export default StatusBadge;

/**
 * Complaint Status Badge - GovTech CRM
 * Shows complaint status with government workflow
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ComplaintStatus = 
  | 'submitted' 
  | 'assigned' 
  | 'in_progress' 
  | 'resolved' 
  | 'closed' 
  | 'rejected';

interface ComplaintStatusBadgeProps {
  status: ComplaintStatus;
  size?: 'small' | 'medium' | 'large';
}

const statusConfig = {
  submitted: {
    label: 'Submitted',
    icon: 'document-text',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  assigned: {
    label: 'Assigned',
    icon: 'person-add',
    color: '#3B82F6',
    bg: '#DBEAFE',
  },
  in_progress: {
    label: 'In Progress',
    icon: 'construct',
    color: '#8B5CF6',
    bg: '#EDE9FE',
  },
  resolved: {
    label: 'Resolved',
    icon: 'checkmark-circle',
    color: '#10B981',
    bg: '#D1FAE5',
  },
  closed: {
    label: 'Closed',
    icon: 'checkmark-done-circle',
    color: '#059669',
    bg: '#ECFDF5',
  },
  rejected: {
    label: 'Rejected',
    icon: 'close-circle',
    color: '#EF4444',
    bg: '#FEE2E2',
  },
};

export const ComplaintStatusBadge: React.FC<ComplaintStatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const config = statusConfig[status];
  const sizeStyle = styles[`${size}Size`];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, sizeStyle]}>
      <Ionicons 
        name={config.icon as any} 
        size={size === 'small' ? 12 : size === 'large' ? 18 : 14} 
        color={config.color} 
      />
      <Text style={[styles.text, { color: config.color }, sizeStyle]}>
        {config.label}
      </Text>
    </View>
  );
};
const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    marginLeft: 4,
    fontWeight: '600',
  },
  smallSize: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediumSize: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  largeSize: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
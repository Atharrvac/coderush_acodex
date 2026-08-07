/**
 * Complaint Timeline Component
 * Shows the status history of a complaint
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimelineItem {
  status: string;
  created_at: string;
  notes?: string;
  changed_by_type?: string;
}

interface ComplaintTimelineProps {
  history: TimelineItem[];
  currentStatus: string;
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string; labelHi: string; labelMr: string }> = {
  submitted: { 
    icon: 'paper-plane', 
    color: '#F59E0B', 
    label: 'Submitted',
    labelHi: 'प्रस्तुत',
    labelMr: 'सबमिट केले'
  },
  assigned: { 
    icon: 'person-add', 
    color: '#3B82F6', 
    label: 'Assigned to Officer',
    labelHi: 'अधिकारी को सौंपा गया',
    labelMr: 'अधिकाऱ्याला नियुक्त केले'
  },
  in_progress: { 
    icon: 'construct', 
    color: '#8B5CF6', 
    label: 'Work in Progress',
    labelHi: 'कार्य प्रगति पर है',
    labelMr: 'काम सुरू आहे'
  },
  resolved: { 
    icon: 'checkmark-circle', 
    color: '#10B981', 
    label: 'Resolved',
    labelHi: 'हल हो गया',
    labelMr: 'निराकरण झाले'
  },
  rejected: { 
    icon: 'close-circle', 
    color: '#EF4444', 
    label: 'Rejected',
    labelHi: 'अस्वीकृत',
    labelMr: 'नाकारले'
  },
};

export const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({ 
  history, 
  currentStatus 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Complaint Timeline</Text>
      
      {history.map((item, index) => {
        const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
        const isLast = index === history.length - 1;
        const isCurrent = item.status === currentStatus;

        return (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.iconContainer}>
              <View style={[
                styles.iconCircle, 
                { backgroundColor: config.color },
                isCurrent && styles.currentIcon
              ]}>
                <Ionicons name={config.icon as any} size={20} color="#FFFFFF" />
              </View>
              {!isLast && <View style={styles.connector} />}
            </View>
            
            <View style={[styles.content, isLast && styles.lastContent]}>
              <View style={styles.statusRow}>
                <Text style={[styles.label, isCurrent && styles.currentLabel]}>
                  {config.label}
                </Text>
                {isCurrent && (
                  <View style={[styles.currentBadge, { backgroundColor: config.color }]}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.timestamp}>
                {new Date(item.created_at).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              
              {item.changed_by_type && (
                <Text style={styles.changedBy}>
                  by {item.changed_by_type === 'officer' ? 'Government Officer' : 'Citizen'}
                </Text>
              )}
              
              {item.notes && (
                <View style={styles.notesContainer}>
                  <Ionicons name="document-text-outline" size={14} color="#6B7280" />
                  <Text style={styles.notes}>{item.notes}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  iconContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 40,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentIcon: {
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 24,
  },
  lastContent: {
    paddingBottom: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  currentLabel: {
    color: '#111827',
    fontWeight: '700',
  },
  currentBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  changedBy: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  notes: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
});

export default ComplaintTimeline;

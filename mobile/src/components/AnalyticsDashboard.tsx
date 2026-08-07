/**
 * Analytics Dashboard - GovTech CRM
 * Shows complaint trends and statistics
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface AnalyticsData {
  totalComplaints: number;
  resolvedComplaints: number;
  avgResolutionTime: number;
  categoryBreakdown: { category: string; count: number; emoji: string }[];
  departmentPerformance: { name: string; resolved: number; total: number }[];
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
  const resolutionRate = data.totalComplaints > 0 
    ? Math.round((data.resolvedComplaints / data.totalComplaints) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Overview Cards */}
      <View style={styles.overviewGrid}>
        <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={styles.overviewCard}>
          <View style={styles.cardIcon}>
            <Ionicons name="document-text" size={24} color="#1E40AF" />
          </View>
          <Text style={styles.cardNumber}>{data.totalComplaints}</Text>
          <Text style={styles.cardLabel}>Total Complaints</Text>
        </LinearGradient>

        <LinearGradient colors={['#D1FAE5', '#A7F3D0']} style={styles.overviewCard}>
          <View style={styles.cardIcon}>
            <Ionicons name="checkmark-circle" size={24} color="#059669" />
          </View>
          <Text style={styles.cardNumber}>{data.resolvedComplaints}</Text>
          <Text style={styles.cardLabel}>Resolved</Text>
        </LinearGradient>

        <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.overviewCard}>
          <View style={styles.cardIcon}>
            <Ionicons name="time" size={24} color="#D97706" />
          </View>
          <Text style={styles.cardNumber}>{data.avgResolutionTime}h</Text>
          <Text style={styles.cardLabel}>Avg Resolution</Text>
        </LinearGradient>

        <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={styles.overviewCard}>
          <View style={styles.cardIcon}>
            <Ionicons name="trending-up" size={24} color="#7C3AED" />
          </View>
          <Text style={styles.cardNumber}>{resolutionRate}%</Text>
          <Text style={styles.cardLabel}>Success Rate</Text>
        </LinearGradient>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Complaints by Category</Text>
        <View style={styles.categoryList}>
          {data.categoryBreakdown.map((item, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                <Text style={styles.categoryName}>{item.category}</Text>
              </View>
              <View style={styles.categoryRight}>
                <Text style={styles.categoryCount}>{item.count}</Text>
                <View style={styles.categoryBar}>
                  <View 
                    style={[
                      styles.categoryBarFill, 
                      { width: `${(item.count / data.totalComplaints) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Department Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Department Performance</Text>
        <View style={styles.departmentList}>
          {data.departmentPerformance.map((dept, index) => {
            const performance = dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0;
            return (
              <View key={index} style={styles.departmentItem}>
                <View style={styles.departmentHeader}>
                  <Text style={styles.departmentName}>{dept.name}</Text>
                  <Text style={styles.departmentPercentage}>{performance}%</Text>
                </View>
                <View style={styles.departmentStats}>
                  <Text style={styles.departmentStatsText}>
                    {dept.resolved} of {dept.total} resolved
                  </Text>
                </View>
                <View style={styles.performanceBar}>
                  <View 
                    style={[
                      styles.performanceBarFill, 
                      { 
                        width: `${performance}%`,
                        backgroundColor: performance >= 80 ? '#10B981' : 
                                       performance >= 60 ? '#F59E0B' : '#EF4444'
                      }
                    ]} 
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  categoryRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categoryBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  categoryBarFill: {
    height: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 2,
  },
  departmentList: {
    gap: 16,
  },
  departmentItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  departmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  departmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  departmentPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  departmentStats: {
    marginBottom: 8,
  },
  departmentStatsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  performanceBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
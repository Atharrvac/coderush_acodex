/**
 * GovTech Demo Screen
 * Showcases all multilingual complaint & governance CRM features
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LanguageSelector } from '../src/components/LanguageSelector';
import { ComplaintStatusBadge } from '../src/components/ComplaintStatusBadge';
import { AnalyticsDashboard } from '../src/components/AnalyticsDashboard';

export default function GovTechDemoScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState<any>('en');
  const [activeDemo, setActiveDemo] = useState<'overview' | 'multilingual' | 'tracking' | 'analytics'>('overview');

  // Mock analytics data
  const analyticsData = {
    totalComplaints: 1247,
    resolvedComplaints: 1089,
    avgResolutionTime: 72,
    categoryBreakdown: [
      { category: 'Road', count: 423, emoji: '🛣️' },
      { category: 'Water', count: 312, emoji: '💧' },
      { category: 'Electricity', count: 198, emoji: '⚡' },
      { category: 'Garbage', count: 156, emoji: '🗑️' },
      { category: 'Parks', count: 89, emoji: '🌳' },
      { category: 'Traffic', count: 69, emoji: '🚦' },
    ],
    departmentPerformance: [
      { name: 'Public Works Department', resolved: 387, total: 423 },
      { name: 'Water Supply Department', resolved: 298, total: 312 },
      { name: 'Electricity Board', resolved: 189, total: 198 },
      { name: 'Municipal Corporation', resolved: 134, total: 156 },
    ],
  };

  const demoSections = [
    {
      id: 'overview',
      title: 'System Overview',
      icon: 'shield-checkmark',
      color: '#1E40AF',
      bg: '#EFF6FF',
    },
    {
      id: 'multilingual',
      title: 'Multilingual Support',
      icon: 'language',
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      id: 'tracking',
      title: 'Complaint Tracking',
      icon: 'analytics',
      color: '#8B5CF6',
      bg: '#F3E8FF',
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      icon: 'bar-chart',
      color: '#DC2626',
      bg: '#FEF2F2',
    },
  ];

  const renderOverview = () => (
    <View style={styles.demoContent}>
      <Text style={styles.demoTitle}>🏛️ GovTech CRM System</Text>
      <Text style={styles.demoSubtitle}>
        Multilingual Citizen Complaint & Governance Platform
      </Text>

      <View style={styles.featureGrid}>
        <View style={styles.featureCard}>
          <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={styles.featureGradient}>
            <Ionicons name="language" size={32} color="#1E40AF" />
            <Text style={styles.featureTitle}>Multilingual</Text>
            <Text style={styles.featureDesc}>Submit complaints in English, Hindi, or Marathi</Text>
          </LinearGradient>
        </View>

        <View style={styles.featureCard}>
          <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.featureGradient}>
            <Ionicons name="sync" size={32} color="#059669" />
            <Text style={styles.featureTitle}>AI Translation</Text>
            <Text style={styles.featureDesc}>Automatic translation between languages</Text>
          </LinearGradient>
        </View>

        <View style={styles.featureCard}>
          <LinearGradient colors={['#F3E8FF', '#EDE9FE']} style={styles.featureGradient}>
            <Ionicons name="people" size={32} color="#8B5CF6" />
            <Text style={styles.featureTitle}>Auto Assignment</Text>
            <Text style={styles.featureDesc}>Smart routing to relevant departments</Text>
          </LinearGradient>
        </View>

        <View style={styles.featureCard}>
          <LinearGradient colors={['#FEF2F2', '#FEE2E2']} style={styles.featureGradient}>
            <Ionicons name="analytics" size={32} color="#DC2626" />
            <Text style={styles.featureTitle}>Real-time Tracking</Text>
            <Text style={styles.featureDesc}>Monitor complaint status and progress</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>System Performance</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1,247</Text>
            <Text style={styles.statLabel}>Total Complaints</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>87%</Text>
            <Text style={styles.statLabel}>Resolution Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>72h</Text>
            <Text style={styles.statLabel}>Avg Resolution</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMultilingual = () => (
    <View style={styles.demoContent}>
      <Text style={styles.demoTitle}>🌐 Multilingual Support</Text>
      <Text style={styles.demoSubtitle}>
        Citizens can submit complaints in their preferred language
      </Text>

      <LanguageSelector
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        style={{ marginVertical: 20 }}
      />

      <View style={styles.translationDemo}>
        <Text style={styles.translationTitle}>Sample Translations:</Text>
        
        <View style={styles.translationCard}>
          <View style={styles.translationHeader}>
            <Text style={styles.translationLang}>🇺🇸 English</Text>
          </View>
          <Text style={styles.translationText}>Road is damaged and needs repair</Text>
        </View>

        <Ionicons name="arrow-down" size={24} color="#6B7280" style={{ alignSelf: 'center', marginVertical: 8 }} />

        <View style={styles.translationCard}>
          <View style={styles.translationHeader}>
            <Text style={styles.translationLang}>🇮🇳 Hindi</Text>
          </View>
          <Text style={styles.translationText}>सड़क क्षतिग्रस्त है और मरम्मत की जरूरत है</Text>
        </View>

        <Ionicons name="arrow-down" size={24} color="#6B7280" style={{ alignSelf: 'center', marginVertical: 8 }} />

        <View style={styles.translationCard}>
          <View style={styles.translationHeader}>
            <Text style={styles.translationLang}>🇮🇳 Marathi</Text>
          </View>
          <Text style={styles.translationText}>रस्ता खराब आहे आणि दुरुस्तीची गरज आहे</Text>
        </View>
      </View>
    </View>
  );

  const renderTracking = () => (
    <View style={styles.demoContent}>
      <Text style={styles.demoTitle}>📊 Complaint Tracking</Text>
      <Text style={styles.demoSubtitle}>
        Real-time status updates and department assignments
      </Text>

      <View style={styles.trackingDemo}>
        <Text style={styles.trackingTitle}>Status Flow:</Text>
        
        <View style={styles.statusFlow}>
          <ComplaintStatusBadge status="submitted" size="large" />
          <Ionicons name="arrow-forward" size={20} color="#6B7280" />
          <ComplaintStatusBadge status="assigned" size="large" />
          <Ionicons name="arrow-forward" size={20} color="#6B7280" />
          <ComplaintStatusBadge status="in_progress" size="large" />
          <Ionicons name="arrow-forward" size={20} color="#6B7280" />
          <ComplaintStatusBadge status="resolved" size="large" />
        </View>

        <View style={styles.trackingCard}>
          <Text style={styles.trackingCardTitle}>Sample Complaint #12345</Text>
          <View style={styles.trackingDetails}>
            <View style={styles.trackingRow}>
              <Ionicons name="document-text" size={16} color="#6B7280" />
              <Text style={styles.trackingLabel}>Category:</Text>
              <Text style={styles.trackingValue}>Road Maintenance</Text>
            </View>
            <View style={styles.trackingRow}>
              <Ionicons name="business" size={16} color="#6B7280" />
              <Text style={styles.trackingLabel}>Department:</Text>
              <Text style={styles.trackingValue}>Public Works Dept</Text>
            </View>
            <View style={styles.trackingRow}>
              <Ionicons name="person" size={16} color="#6B7280" />
              <Text style={styles.trackingLabel}>Officer:</Text>
              <Text style={styles.trackingValue}>Rajesh Kumar</Text>
            </View>
            <View style={styles.trackingRow}>
              <Ionicons name="time" size={16} color="#6B7280" />
              <Text style={styles.trackingLabel}>ETA:</Text>
              <Text style={styles.trackingValue}>2-3 days</Text>
            </View>
          </View>
          <ComplaintStatusBadge status="in_progress" size="medium" />
        </View>
      </View>
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.demoContent}>
      <Text style={styles.demoTitle}>📈 Analytics Dashboard</Text>
      <Text style={styles.demoSubtitle}>
        Insights into complaint trends and department performance
      </Text>
      <AnalyticsDashboard data={analyticsData} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />

      {/* Header */}
      <LinearGradient colors={['#1E40AF', '#1D4ED8']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GovTech Demo</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {demoSections.map((section) => (
            <TouchableOpacity
              key={section.id}
              onPress={() => setActiveDemo(section.id as any)}
              style={[
                styles.tab,
                activeDemo === section.id && { backgroundColor: section.bg }
              ]}
            >
              <Ionicons 
                name={section.icon as any} 
                size={20} 
                color={activeDemo === section.id ? section.color : '#6B7280'} 
              />
              <Text style={[
                styles.tabText,
                activeDemo === section.id && { color: section.color, fontWeight: '600' }
              ]}>
                {section.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeDemo === 'overview' && renderOverview()}
        {activeDemo === 'multilingual' && renderMultilingual()}
        {activeDemo === 'tracking' && renderTracking()}
        {activeDemo === 'analytics' && renderAnalytics()}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  demoContent: {
    padding: 20,
  },
  demoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  demoSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
  },
  featureGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  translationDemo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  translationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  translationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
  },
  translationHeader: {
    marginBottom: 8,
  },
  translationLang: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  translationText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
  },
  trackingDemo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statusFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 8,
  },
  trackingCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  trackingCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  trackingDetails: {
    gap: 8,
    marginBottom: 16,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackingLabel: {
    fontSize: 14,
    color: '#6B7280',
    minWidth: 80,
  },
  trackingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
});
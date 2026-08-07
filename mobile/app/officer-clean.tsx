/**
 * Clean Officer Dashboard - ONLY Real Data
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OfficerCleanDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'users'>('overview');
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [realProblems, setRealProblems] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      const baseUrl = 'http://localhost:3000/api/v1';
      console.log('🔄 Loading ONLY real data from:', baseUrl);
      
      // Fetch govtech complaints
      try {
        const govtechResponse = await fetch(`${baseUrl}/govtech/complaints`);
        if (govtechResponse.ok) {
          const govtechData = await govtechResponse.json();
          const complaints = govtechData.complaints || [];
          setRealProblems(complaints);
          console.log('✅ Loaded complaints:', complaints.length);
        }
      } catch (error) {
        console.log('❌ Complaints failed:', error);
      }

      // Fetch users
      try {
        const usersResponse = await fetch(`${baseUrl}/users`);
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const users = usersData.users || [];
          setRealUsers(users);
          console.log('✅ Loaded users:', users.length);
        }
      } catch (error) {
        console.log('❌ Users failed:', error);
      }

    } catch (error) {
      console.error('💥 Failed to load data:', error);
    } finally {
      setDataLoaded(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': case 'posted': return '#F59E0B';
      case 'in_progress': case 'being_helped': return '#3B82F6';
      case 'resolved': case 'solved': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1E40AF', '#1D4ED8']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🏛️ Officer Dashboard</Text>
          <Text style={styles.headerSubtitle}>Real Data Only</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: 'overview', label: 'Overview', icon: 'grid' },
              { id: 'complaints', label: 'Complaints', icon: 'document-text' },
              { id: 'users', label: 'Users', icon: 'people' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={18} 
                  color={activeTab === tab.id ? '#1E40AF' : '#FFFFFF'} 
                />
                <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Data Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            {!dataLoaded ? 
              '🔄 Loading real data...' :
              realProblems.length > 0 || realUsers.length > 0 ? 
                `✅ Real Data: ${realProblems.length} complaints, ${realUsers.length} users` : 
                '❌ No data found - API connection failed'
            }
          </Text>
        </View>

        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Overview</Text>
            
            {/* Statistics */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{realProblems.length}</Text>
                <Text style={styles.statLabel}>Total Complaints</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{realUsers.length}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
            </View>

            {/* Recent Complaints */}
            <Text style={styles.sectionTitle}>Recent Complaints</Text>
            {realProblems.length > 0 ? realProblems.slice(0, 3).map((complaint) => (
              <View key={complaint.id} style={styles.complaintCard}>
                <Text style={styles.complaintTitle}>{complaint.title || complaint.description}</Text>
                <Text style={styles.complaintMeta}>
                  Category: {complaint.category} | Priority: {complaint.priority_level || 'medium'}
                </Text>
                <Text style={styles.complaintDate}>
                  {formatDate(complaint.created_at)}
                </Text>
              </View>
            )) : (
              <View style={styles.noDataCard}>
                <Text style={styles.noDataText}>No complaints available</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'complaints' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>All Complaints ({realProblems.length})</Text>
            
            {realProblems.length > 0 ? realProblems.map((complaint) => (
              <View key={complaint.id} style={styles.complaintCard}>
                <Text style={styles.complaintTitle}>{complaint.title || complaint.description}</Text>
                <Text style={styles.complaintMeta}>
                  Category: {complaint.category} | Status: {complaint.status || complaint.complaint_status}
                </Text>
                <Text style={styles.complaintMeta}>
                  Priority: {complaint.priority_level || 'medium'} | Address: {complaint.address}
                </Text>
                <Text style={styles.complaintDate}>
                  Created: {formatDate(complaint.created_at)}
                </Text>
              </View>
            )) : (
              <View style={styles.noDataCard}>
                <Text style={styles.noDataText}>No complaints found</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>All Users ({realUsers.length})</Text>
            
            {realUsers.length > 0 ? realUsers.map((user) => (
              <View key={user.id} style={styles.complaintCard}>
                <Text style={styles.complaintTitle}>{user.name}</Text>
                <Text style={styles.complaintMeta}>Email: {user.email}</Text>
                <Text style={styles.complaintMeta}>
                  Role: {user.role} | Problems Posted: {user.problems_posted || 0}
                </Text>
                <Text style={styles.complaintDate}>
                  Joined: {formatDate(user.created_at)}
                </Text>
              </View>
            )) : (
              <View style={styles.noDataCard}>
                <Text style={styles.noDataText}>No users found</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 0,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 2,
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeTabText: {
    color: '#1E40AF',
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    margin: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  statusText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  tabContent: {
    padding: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#DBEAFE',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  complaintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  complaintTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  complaintMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  complaintDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  noDataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
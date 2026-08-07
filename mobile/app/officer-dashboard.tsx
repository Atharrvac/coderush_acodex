/**
 * Officer Dashboard - GovTech CRM System
 * Comprehensive dashboard for officers to manage complaints and view analytics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

const { width } = Dimensions.get('window');

interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

interface Officer {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: {
    name: string;
    code: string;
  };
}

interface Complaint {
  id: string;
  title: string;
  category: string;
  complaint_status: string;
  priority_level: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'users' | 'analytics'>('overview');

  useEffect(() => {
    if (user?.role && ['officer', 'department_head', 'admin'].includes(user.role)) {
      loadDashboardData();
    } else {
      Alert.alert('Access Denied', 'You need officer privileges to access this dashboard.');
      router.back();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/officer/dashboard`, {
        headers: {
          'Authorization': `Bearer ${(user as any)?.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOfficer(data.officer);
        setStats(data.statistics);
        setRecentComplaints(data.recentComplaints);
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      
      // Load demo data for testing
      setOfficer({
        id: 'demo-officer-123',
        name: 'Demo Officer',
        email: 'officer.demo@gov.in',
        designation: 'Senior Officer',
        department: {
          name: 'Public Works Department',
          code: 'PWD'
        }
      });
      
      setStats({
        total: 45,
        pending: 12,
        inProgress: 8,
        resolved: 25
      });
      
      setRecentComplaints([
        {
          id: '1',
          title: 'Road repair needed on Main Street',
          category: 'road',
          complaint_status: 'submitted',
          priority_level: 'high',
          created_at: new Date().toISOString(),
          user: { name: 'John Doe', email: 'john@example.com' }
        },
        {
          id: '2',
          title: 'Water supply issue in Block A',
          category: 'water',
          complaint_status: 'in_progress',
          priority_level: 'medium',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user: { name: 'Jane Smith', email: 'jane@example.com' }
        },
        {
          id: '3',
          title: 'Street light not working',
          category: 'electricity',
          complaint_status: 'resolved',
          priority_level: 'low',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          user: { name: 'Mike Johnson', email: 'mike@example.com' }
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'resolved': return '#10B981';
      case 'rejected': return '#EF4444';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1E40AF', '#1D4ED8']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Officer Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {officer?.department.name} • {officer?.designation}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: 'overview', label: 'Overview', icon: 'grid' },
              { id: 'complaints', label: 'Complaints', icon: 'document-text' },
              { id: 'users', label: 'Users', icon: 'people' },
              { id: 'analytics', label: 'Analytics', icon: 'bar-chart' },
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
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && (
          <View style={styles.overviewContent}>
            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="document-text" size={24} color="#1E40AF" />
                  <Text style={styles.statNumber}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total Complaints</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="time" size={24} color="#F59E0B" />
                  <Text style={styles.statNumber}>{stats.pending}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="refresh" size={24} color="#3B82F6" />
                  <Text style={styles.statNumber}>{stats.inProgress}</Text>
                  <Text style={styles.statLabel}>In Progress</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.statNumber}>{stats.resolved}</Text>
                  <Text style={styles.statLabel}>Resolved</Text>
                </View>
              </View>
            </View>

            {/* Recent Complaints */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Complaints</Text>
                <TouchableOpacity onPress={() => setActiveTab('complaints')}>
                  <Text style={styles.sectionLink}>View All</Text>
                </TouchableOpacity>
              </View>
              
              {recentComplaints.map((complaint) => (
                <TouchableOpacity key={complaint.id} style={styles.complaintCard}>
                  <View style={styles.complaintHeader}>
                    <Text style={styles.complaintTitle} numberOfLines={1}>
                      {complaint.title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.complaint_status) }]}>
                      <Text style={styles.statusText}>
                        {complaint.complaint_status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.complaintMeta}>
                    <Text style={styles.complaintUser}>By: {complaint.user.name}</Text>
                    <Text style={styles.complaintDate}>{formatDate(complaint.created_at)}</Text>
                  </View>
                  <View style={styles.complaintFooter}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(complaint.priority_level) }]}>
                      <Text style={styles.priorityText}>{complaint.priority_level.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.complaintCategory}>{complaint.category}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('complaints')}>
                  <Ionicons name="document-text" size={32} color="#1E40AF" />
                  <Text style={styles.actionText}>Manage Complaints</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('users')}>
                  <Ionicons name="people" size={32} color="#059669" />
                  <Text style={styles.actionText}>View Users</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('analytics')}>
                  <Ionicons name="bar-chart" size={32} color="#DC2626" />
                  <Text style={styles.actionText}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard}>
                  <Ionicons name="settings" size={32} color="#7C3AED" />
                  <Text style={styles.actionText}>Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'complaints' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Complaint Management</Text>
            <Text style={styles.tabDescription}>
              View and manage all complaints assigned to your department
            </Text>
            
            {/* Demo Complaints List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Complaints</Text>
              {[
                { id: '1', title: 'Road repair needed on Main Street', user: 'John Doe', status: 'submitted', priority: 'high', date: '2 hours ago' },
                { id: '2', title: 'Water supply issue in Block A', user: 'Jane Smith', status: 'in_progress', priority: 'medium', date: '1 day ago' },
                { id: '3', title: 'Street light not working', user: 'Mike Johnson', status: 'resolved', priority: 'low', date: '2 days ago' },
                { id: '4', title: 'Garbage collection missed', user: 'Sarah Wilson', status: 'submitted', priority: 'medium', date: '3 hours ago' },
                { id: '5', title: 'Pothole on Highway 101', user: 'David Brown', status: 'in_progress', priority: 'high', date: '5 hours ago' },
              ].map((complaint) => (
                <View key={complaint.id} style={styles.complaintCard}>
                  <View style={styles.complaintHeader}>
                    <Text style={styles.complaintTitle} numberOfLines={1}>
                      {complaint.title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) }]}>
                      <Text style={styles.statusText}>
                        {complaint.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.complaintMeta}>
                    <Text style={styles.complaintUser}>By: {complaint.user}</Text>
                    <Text style={styles.complaintDate}>{complaint.date}</Text>
                  </View>
                  <View style={styles.complaintFooter}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(complaint.priority) }]}>
                      <Text style={styles.priorityText}>{complaint.priority.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>User Management</Text>
            <Text style={styles.tabDescription}>
              View and manage citizen accounts and their complaint history
            </Text>
            
            {/* Demo Users List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Registered Citizens</Text>
              {[
                { id: '1', name: 'John Doe', email: 'john@example.com', complaints: 3, joined: '2 months ago' },
                { id: '2', name: 'Jane Smith', email: 'jane@example.com', complaints: 1, joined: '1 month ago' },
                { id: '3', name: 'Mike Johnson', email: 'mike@example.com', complaints: 5, joined: '3 months ago' },
                { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', complaints: 2, joined: '2 weeks ago' },
                { id: '5', name: 'David Brown', email: 'david@example.com', complaints: 4, joined: '1 month ago' },
              ].map((user) => (
                <View key={user.id} style={styles.complaintCard}>
                  <View style={styles.complaintHeader}>
                    <Text style={styles.complaintTitle}>{user.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.statusText}>ACTIVE</Text>
                    </View>
                  </View>
                  <View style={styles.complaintMeta}>
                    <Text style={styles.complaintUser}>{user.email}</Text>
                    <Text style={styles.complaintDate}>Joined {user.joined}</Text>
                  </View>
                  <View style={styles.complaintFooter}>
                    <View style={[styles.priorityBadge, { backgroundColor: '#3B82F6' }]}>
                      <Text style={styles.priorityText}>{user.complaints} COMPLAINTS</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Analytics & Reports</Text>
            <Text style={styles.tabDescription}>
              View detailed analytics and generate reports
            </Text>
            <TouchableOpacity style={styles.comingSoonCard}>
              <Ionicons name="bar-chart" size={48} color="#6B7280" />
              <Text style={styles.comingSoonText}>Analytics Dashboard</Text>
              <Text style={styles.comingSoonSubtext}>Coming Soon</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
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
  profileButton: {
    marginLeft: 16,
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
  overviewContent: {
    padding: 20,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionLink: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
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
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  complaintTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  complaintMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  complaintUser: {
    fontSize: 14,
    color: '#6B7280',
  },
  complaintDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  complaintCategory: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  tabContent: {
    padding: 20,
    alignItems: 'center',
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  tabDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
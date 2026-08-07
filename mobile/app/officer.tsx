/**
 * Simple Officer Dashboard Access
 * Direct route without complex navigation
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OfficerDashboard() {
  const [loading, setLoading] = useState(false); // Start with false to show UI immediately
  const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'users' | 'analytics'>('overview');
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [realProblems, setRealProblems] = useState<any[]>([]);
  const [realStats, setRealStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Load real data in background
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      const baseUrl = 'http://localhost:3000/api/v1';
      console.log('🔄 Loading ONLY real data from:', baseUrl);
      
      let realUsers = [];
      let realProblems = [];

      // Try to fetch govtech complaints (this is where your real data is)
      try {
        console.log('📞 Fetching govtech complaints...');
        const govtechResponse = await fetch(`${baseUrl}/govtech/complaints`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });
        
        console.log('📡 Govtech response status:', govtechResponse.status);
        
        if (govtechResponse.ok) {
          const govtechData = await govtechResponse.json();
          console.log('📦 Govtech raw data:', govtechData);
          
          const govtechComplaints = govtechData.complaints || [];
          realProblems = govtechComplaints;
          console.log('✅ Loaded govtech complaints:', govtechComplaints.length);
          
          // Log first complaint for debugging
          if (govtechComplaints.length > 0) {
            console.log('🔍 First complaint:', govtechComplaints[0]);
          }
        } else {
          const errorText = await govtechResponse.text();
          console.log('❌ Govtech API failed:', govtechResponse.status, errorText);
        }
      } catch (error) {
        console.log('❌ Govtech fetch failed:', error);
      }

      // Try to fetch users
      try {
        console.log('📞 Fetching users...');
        const usersResponse = await fetch(`${baseUrl}/users`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });

        console.log('📡 Users response status:', usersResponse.status);

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log('📦 Users raw data:', usersData);
          
          realUsers = usersData.users || usersData || [];
          console.log('✅ Loaded real users:', realUsers.length);
        } else {
          const errorText = await usersResponse.text();
          console.log('❌ Users API failed:', usersResponse.status, errorText);
        }
      } catch (error) {
        console.log('❌ Users fetch failed:', error);
      }

      // ONLY update state if we have real data
      if (realProblems.length > 0 || realUsers.length > 0) {
        setRealUsers(realUsers);
        setRealProblems(realProblems);
        
        // Calculate real statistics
        const stats = {
          total: realProblems.length,
          pending: realProblems.filter((p: any) => 
            p.status === 'posted' || 
            p.complaint_status === 'submitted' || 
            p.status === 'pending'
          ).length,
          inProgress: realProblems.filter((p: any) => 
            p.status === 'being_helped' || 
            p.complaint_status === 'in_progress' || 
            p.status === 'in_progress'
          ).length,
          resolved: realProblems.filter((p: any) => 
            p.status === 'solved' || 
            p.complaint_status === 'resolved' || 
            p.status === 'resolved'
          ).length
        };
        
        setRealStats(stats);
        
        console.log('🎉 REAL DATA LOADED:', {
          users: realUsers.length,
          problems: realProblems.length,
          stats
        });
      } else {
        console.log('❌ NO REAL DATA FOUND - API connection failed');
      }

    } catch (error) {
      console.error('💥 Failed to load real data:', error);
    } finally {
      setDataLoaded(true);
      setLoading(false);
    }
  };

  // Use ONLY real data - NO demo data
  const stats = realStats.total > 0 ? realStats : {
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  };

  // Use ONLY real data for recent complaints
  const recentComplaints = realProblems.length > 0 ? realProblems.slice(0, 3).map(problem => ({
    id: problem.id,
    title: problem.title || `${problem.category} issue`,
    category: problem.category,
    complaint_status: problem.status || problem.complaint_status || 'submitted',
    priority_level: problem.priority_level || 'medium',
    created_at: problem.created_at,
    user: { 
      name: problem.user?.name || problem.user_name || 'Anonymous User', 
      email: problem.user?.email || problem.user_email || 'user@example.com' 
    }
  })) : [];

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

  // Remove the loading screen - show dashboard immediately
  // if (loading) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator size="large" color="#1E40AF" />
  //       <Text style={styles.loadingText}>Loading Officer Dashboard...</Text>
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1E40AF', '#1D4ED8']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>🏛️ Officer Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Public Works Department • Senior Officer
            </Text>
          </View>
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <View style={styles.overviewContent}>
            {/* Real Data Status */}
            <View style={styles.realDataStatus}>
              <Text style={styles.realDataText}>
                {!dataLoaded ? 
                  '🔄 Loading real data...' :
                  realProblems.length > 0 ? 
                    `✅ Real Data: ${realProblems.length} complaints, ${realUsers.length} users` : 
                    '⚠️ Using demo data - API connection failed'
                }
              </Text>
            </View>

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
              
              {recentComplaints.length > 0 ? recentComplaints.map((complaint) => (
                <View key={complaint.id} style={styles.complaintCard}>
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
                </View>
              )) : (
                <View style={styles.noDataCard}>
                  <Text style={styles.noDataText}>
                    {!dataLoaded ? '🔄 Loading recent complaints...' : '❌ No complaints found. Check API connection.'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'complaints' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>All Complaints</Text>
            <Text style={styles.tabDescription}>
              {realProblems.length > 0 ? `✅ Showing ${realProblems.length} real complaints from your database` : 'Manage all complaints assigned to your department'}
            </Text>
            
            {realProblems.length > 0 ? realProblems.map((complaint) => (
              <View key={complaint.id} style={styles.complaintCard}>
                <View style={styles.complaintHeader}>
                  <Text style={styles.complaintTitle} numberOfLines={1}>
                    {complaint.title || complaint.description}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status || complaint.complaint_status || 'submitted') }]}>
                    <Text style={styles.statusText}>
                      {(complaint.status || complaint.complaint_status || 'submitted').replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.complaintMeta}>
                  <Text style={styles.complaintUser}>By: {complaint.user?.name || complaint.user_name || 'Anonymous'}</Text>
                  <Text style={styles.complaintDate}>
                    {complaint.created_at ? formatDate(complaint.created_at) : complaint.created_at}
                  </Text>
                </View>
                <View style={styles.complaintFooter}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(complaint.priority_level || 'medium') }]}>
                    <Text style={styles.priorityText}>{(complaint.priority_level || 'medium').toUpperCase()}</Text>
                  </View>
                  {complaint.category && (
                    <Text style={styles.complaintCategory}>{complaint.category}</Text>
                  )}
                </View>
              </View>
            )) : (
              <View style={styles.noDataCard}>
                <Text style={styles.noDataText}>
                  {!dataLoaded ? '🔄 Loading complaints...' : '❌ No complaints found. Check API connection.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>User Management</Text>
            <Text style={styles.tabDescription}>
              {realUsers.length > 0 ? `✅ Showing ${realUsers.length} real users from your database` : 'View and manage citizen accounts and their complaint history'}
            </Text>
            
            {realUsers.length > 0 ? realUsers.map((user) => (
              <View key={user.id} style={styles.complaintCard}>
                <View style={styles.complaintHeader}>
                  <Text style={styles.complaintTitle}>{user.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: user.is_active !== false ? '#10B981' : '#EF4444' }]}>
                    <Text style={styles.statusText}>{user.is_active !== false ? 'ACTIVE' : 'INACTIVE'}</Text>
                  </View>
                </View>
                <View style={styles.complaintMeta}>
                  <Text style={styles.complaintUser}>{user.email}</Text>
                  <Text style={styles.complaintDate}>
                    Joined {user.created_at ? formatDate(user.created_at) : user.created_at}
                  </Text>
                </View>
                <View style={styles.complaintFooter}>
                  <View style={[styles.priorityBadge, { backgroundColor: '#3B82F6' }]}>
                    <Text style={styles.priorityText}>
                      {user.problems_posted || 0} COMPLAINTS
                    </Text>
                  </View>
                  {user.role && (
                    <Text style={styles.complaintCategory}>{user.role.toUpperCase()}</Text>
                  )}
                </View>
              </View>
            )) : (
              <View style={styles.noDataCard}>
                <Text style={styles.noDataText}>
                  {!dataLoaded ? '🔄 Loading users...' : '❌ No users found. Check API connection.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Analytics & Reports</Text>
            <Text style={styles.tabDescription}>
              View detailed analytics and generate reports
            </Text>
            <View style={styles.comingSoonCard}>
              <Ionicons name="bar-chart" size={48} color="#6B7280" />
              <Text style={styles.comingSoonText}>Analytics Dashboard</Text>
              <Text style={styles.comingSoonSubtext}>Coming Soon</Text>
            </View>
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
  realDataStatus: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  realDataText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
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
  tabContent: {
    padding: 20,
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
    marginBottom: 24,
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
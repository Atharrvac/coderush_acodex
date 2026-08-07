/**
 * Community Redressal Planner - My Complaints Activity Screen
 * Track your filed complaints, their status, and notifications
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { problemService } from '../../src/services/problem.service';
import { alertService } from '../../src/services/alert.service';
import { Problem, Alert as AlertType } from '../../src/types';
import { STATUS_CONFIG, PROBLEM_CATEGORIES } from '../../src/constants/categories';
import { ComplaintStatusBadge } from '../../src/components/ComplaintStatusBadge';
import { ActivitySkeleton } from '../../src/components/ui/SkeletonLoaders';

const { width } = Dimensions.get('window');

type TabType = 'posted' | 'helping' | 'notifications';

export default function ComplaintTrackingScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('posted');
  const [myProblems, setMyProblems] = useState<Problem[]>([]);
  const [notifications, setNotifications] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      const [posted, alerts] = await Promise.all([
        problemService.getMyProblems(user.id),
        alertService.getAll(user.id),
      ]);
      setMyProblems(posted);
      setNotifications(alerts);
    } catch (error) {
      console.error('Fetch activity error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user?.id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryInfo = (categoryId: string) => {
    return PROBLEM_CATEGORIES.find((c) => c.id === categoryId) || PROBLEM_CATEGORIES[7];
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'posted': return { bg: '#FEF3C7', text: '#B45309', gradient: ['#FEF3C7', '#FDE68A'] };
      case 'being_helped': return { bg: '#DBEAFE', text: '#1D4ED8', gradient: ['#DBEAFE', '#BFDBFE'] };
      case 'solved': return { bg: '#D1FAE5', text: '#047857', gradient: ['#D1FAE5', '#A7F3D0'] };
      default: return { bg: '#F3F4F6', text: '#6B7280', gradient: ['#F3F4F6', '#E5E7EB'] };
    }
  };

  const tabs = [
    {
      id: 'posted' as TabType,
      label: 'My Complaints',
      icon: 'document-text',
      activeIcon: 'document-text',
      count: myProblems.length,
      color: '#0F172A',
      bg: '#F8FAFC'
    },
    {
      id: 'notifications' as TabType,
      label: 'Updates',
      icon: 'notifications-outline',
      activeIcon: 'notifications',
      count: notifications.filter((n) => !n.read).length,
      color: '#EF4444',
      bg: '#FEE2E2'
    },
  ];

  const renderProblemCard = (problem: Problem) => {
    const category = getCategoryInfo(problem.category);
    const statusStyle = getStatusStyle(problem.status);

    return (
      <TouchableOpacity
        key={problem.id}
        onPress={() => router.push({ pathname: '/problem-details', params: { id: problem.id } })}
        style={styles.problemCard}
        activeOpacity={0.95}
      >
        {/* Card Image or Gradient */}
        <View style={styles.cardImageSection}>
          {problem.images?.[0] ? (
            <Image source={{ uri: problem.images[0] }} style={styles.cardImage} />
          ) : (
            <LinearGradient
              colors={['#F1F5F9', '#E2E8F0']}
              style={styles.cardImagePlaceholder}
            >
              <Text style={styles.cardEmoji}>{category.emoji}</Text>
            </LinearGradient>
          )}

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {STATUS_CONFIG[problem.status]?.label || 'Posted'}
            </Text>
          </View>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Category & Time Row */}
          <View style={styles.cardMeta}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryText}>{category.name}</Text>
            </View>
            <Text style={styles.timeText}>{getTimeAgo(problem.created_at)}</Text>
          </View>

          {/* Title */}
          <Text style={styles.cardTitle} numberOfLines={2}>{problem.title}</Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#16A34A" />
            <Text style={styles.locationText} numberOfLines={1}>{problem.address}</Text>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            {(problem.status === 'being_helped' || problem.complaint_status === 'in_progress') ? (
              <View style={styles.helperInfo}>
                <View style={[styles.helperAvatar, { backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' }]}>
                   <Ionicons name="construct" size={16} color="#3B82F6" />
                </View>
                <Text style={styles.helperName}>Assigned to Dept</Text>
              </View>
            ) : (
              <View style={styles.waitingBadge}>
                <Ionicons name="time-outline" size={14} color="#F59E0B" />
                <Text style={styles.waitingText}>Waiting for assignment</Text>
              </View>
            )}

            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNotification = (notification: AlertType, index: number) => {
    const getNotificationStyle = () => {
      switch (notification.type as any) {
        case 'status_update': return { icon: 'refresh', bg: '#DBEAFE', color: '#2563EB', gradient: ['#EFF6FF', '#DBEAFE'] };
        case 'escalation': return { icon: 'arrow-up', bg: '#FEE2E2', color: '#DC2626', gradient: ['#FEF2F2', '#FEE2E2'] };
        case 'solved': return { icon: 'checkmark-circle', bg: '#D1FAE5', color: '#059669', gradient: ['#ECFDF5', '#D1FAE5'] };
        case 'comment': return { icon: 'chatbubble', bg: '#FEF3C7', color: '#D97706', gradient: ['#FFFBEB', '#FEF3C7'] };
        default: return { icon: 'notifications', bg: '#F1F5F9', color: '#64748B', gradient: ['#F8FAFC', '#F1F5F9'] };
      }
    };

    const style = getNotificationStyle();

    return (
      <TouchableOpacity
        key={notification.id}
        onPress={() => {
          if (notification.problem_id) {
            router.push({ pathname: '/problem-details', params: { id: notification.problem_id } });
          }
        }}
        style={[
          styles.notificationCard,
          !notification.read && styles.notificationUnread
        ]}
        activeOpacity={0.95}
      >
        <LinearGradient
          colors={style.gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.notificationGradient}
        >
          {/* Icon */}
          <View style={[styles.notificationIcon, { backgroundColor: style.bg }]}>
            <Ionicons name={style.icon as any} size={22} color={style.color} />
          </View>

          {/* Content */}
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={[
                styles.notificationTitle,
                !notification.read && styles.notificationTitleUnread
              ]} numberOfLines={1}>
                {notification.title}
              </Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={styles.notificationTime}>{getTimeAgo(notification.created_at)}</Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type: TabType) => {
    const emptyStates = {
      posted: {
        icon: 'document-text-outline',
        title: 'No Problems Posted',
        subtitle: 'Report an issue in your area and get help from the community',
        buttonText: 'Post a Problem',
        buttonIcon: 'add-circle',
        onPress: () => router.push('/(tabs)/post'),
        gradient: ['#F0FDF4', '#DCFCE7'],
        color: '#16A34A',
      },
      notifications: {
        icon: 'notifications',
        title: 'No updates yet',
        subtitle: 'You\'ll be notified when your complaints are updated',
        buttonText: null,
        buttonIcon: null,
        onPress: null,
        gradient: ['#FFFBEB', '#FEF3C7'],
        color: '#D97706',
      },
    };

    const state = emptyStates[type as keyof typeof emptyStates];

    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={state.gradient as [string, string]}
          style={styles.emptyIconContainer}
        >
          <Ionicons name={state.icon as any} size={56} color={state.color} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>{state.title}</Text>
        <Text style={styles.emptySubtitle}>{state.subtitle}</Text>
        {state.buttonText && (
          <TouchableOpacity
            onPress={state.onPress!}
            style={[styles.emptyButton, { backgroundColor: state.color }]}
          >
            <Ionicons name={state.buttonIcon as any} size={20} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>{state.buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconBg}>
              <Ionicons name="shield-checkmark" size={24} color="#0F172A" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Complaint Tracking</Text>
              <Text style={styles.headerSubtitle}>Monitor your submissions</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/chat-list')}
            style={styles.headerButton}
          >
            <Ionicons name="chatbubbles" size={22} color="#16A34A" />
          </TouchableOpacity>
        </View>

        {/* Stats Row - GovTech */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#F8FAFC' }]}>
            <Text style={[styles.statNumber, { color: '#0F172A' }]}>{myProblems.length}</Text>
            <Text style={[styles.statLabel, { color: '#334155' }]}>Submitted</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive
              ]}
            >
              <View style={[
                styles.tabIconBg,
                activeTab === tab.id && { backgroundColor: tab.bg }
              ]}>
                <Ionicons
                  name={(activeTab === tab.id ? tab.activeIcon : tab.icon) as any}
                  size={18}
                  color={activeTab === tab.id ? tab.color : '#94A3B8'}
                />
              </View>
              <Text style={[
                styles.tabLabel,
                activeTab === tab.id && { color: '#1F2937', fontWeight: '700' }
              ]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[
                  styles.tabBadge,
                  { backgroundColor: activeTab === tab.id ? tab.color : '#CBD5E1' }
                ]}>
                  <Text style={styles.tabBadgeText}>{tab.count > 99 ? '99+' : tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <ActivitySkeleton />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#16A34A']}
              tintColor="#16A34A"
            />
          }
        >
          {activeTab === 'posted' && (
            myProblems.length === 0
              ? renderEmptyState('posted')
              : myProblems.map((p) => renderProblemCard(p))
          )}

          {activeTab === 'notifications' && (
            notifications.length === 0
              ? renderEmptyState('notifications')
              : notifications.map((n, i) => renderNotification(n, i))
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 4,
    marginBottom: -20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tabIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 32,
  },
  problemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImageSection: {
    height: 140,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 48,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardContent: {
    padding: 16,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  categoryEmoji: {
    fontSize: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  posterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  posterAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  posterName: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  helperInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helperAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  helperName: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waitingText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationUnread: {
    shadowOpacity: 0.08,
    elevation: 4,
  },
  notificationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  notificationTitleUnread: {
    color: '#1F2937',
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

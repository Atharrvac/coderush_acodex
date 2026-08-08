/**
 * NagrikSeva - Feed Screen
 * Attractive design with sorting & filtering
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
  StyleSheet,
  StatusBar,
  Modal,
  Pressable,
  Alert,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage, Language } from '../../src/contexts/LanguageContext';
import { problemService } from '../../src/services/problem.service';
import { alertService } from '../../src/services/alert.service';
import { voteService } from '../../src/services/vote.service';
import { Problem, ProblemStatus, Alert as AlertType } from '../../src/types';
import { PROBLEM_CATEGORIES } from '../../src/constants/categories';
import { FeedSkeleton } from '../../src/components/ui';
import { VoteButton } from '../../src/components/VoteButton';


export default function FeedScreen() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'nearest' | 'newest'>('newest');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AlertType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState(t('yourLocation', 'Your Location'));
  const [trendingProblems, setTrendingProblems] = useState<Problem[]>([]);
  const [showTrending, setShowTrending] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const PAGE_SIZE = 20; // Load 20 items at a time for better performance

  const statusOptions = [
    { id: 'all', label: t('allStatus', 'All Status'), icon: 'apps', color: '#6B7280' },
    { id: 'posted', label: t('submitted', 'Submitted'), icon: 'time', color: '#F59E0B' },
    { id: 'being_helped', label: t('inReview', 'In Review'), icon: 'eye', color: '#3B82F6' },
    { id: 'in_progress', label: t('inProgress', 'In Progress'), icon: 'construct', color: '#8B5CF6' },
    { id: 'solved', label: t('resolved', 'Resolved'), icon: 'checkmark-circle', color: '#10B981' },
    { id: 'escalated', label: t('escalated', 'Escalated'), icon: 'arrow-up-circle', color: '#DC2626' },
  ];

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Location unavailable');
        return null;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (address) {
          setLocationName(address.city || address.district || address.region || 'Your Location');
        }
      } catch {
        setLocationName('Your Location');
      }
      return { lat: location.coords.latitude, lng: location.coords.longitude };
    } catch {
      setLocationName('Location unavailable');
      return null;
    }
  };

  const fetchProblems = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setError(null);
        setPage(0);
        setHasMore(true);
        
        // Fetch trending problems
        fetchTrendingProblems();
      }
      
      const currentPage = loadMore ? page + 1 : 0;
      const loc = userLocation || (await getUserLocation());
      
      const data = await problemService.getAll({
        sortBy,
        status: statusFilter !== 'all' ? (statusFilter as ProblemStatus) : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        userLat: loc?.lat,
        userLng: loc?.lng,
        excludeUserId: user?.id, // Exclude current user's problems from feed
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
      });
      
      console.log('Fetched problems:', data.length, 'Page:', currentPage, 'User ID:', user?.id);
      
      if (loadMore) {
        setProblems(prev => [...prev, ...data]);
        setPage(currentPage);
      } else {
        setProblems(data);
      }
      
      // Check if there are more items
      setHasMore(data.length === PAGE_SIZE);
      
    } catch (err: any) {
      console.error('Fetch problems error:', err);
      setError(err?.message || 'Failed to load problems');
      if (!loadMore) {
        setProblems([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const fetchTrendingProblems = async () => {
    try {
      const data = await voteService.getTrending(5);
      setTrendingProblems(data);
    } catch (error) {
      console.error('Fetch trending error:', error);
    }
  };

  const loadMoreProblems = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchProblems(true);
    }
  };

  useEffect(() => { fetchProblems(); }, [sortBy, statusFilter, categoryFilter]);
  
  // Real-time subscription - optimized for production
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const unsubscribe = problemService.subscribeToProblems((newProblem) => {
      console.log('Real-time update:', newProblem.id);
      
      // Debounce refresh to avoid too many updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchProblems(); // Refresh the list
      }, 1000); // Wait 1 second before refreshing
    });
    
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [sortBy, statusFilter, categoryFilter]);
  
  useFocusEffect(useCallback(() => { fetchProblems(); fetchUnreadCount(); }, [sortBy, statusFilter, categoryFilter]));
  const onRefresh = () => { setRefreshing(true); fetchProblems(); };

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    const count = await alertService.getUnreadCount(user.id);
    setUnreadCount(count);
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoadingNotifications(true);
    try {
      const data = await alertService.getAll(user.id);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const openNotifications = () => {
    setShowNotifications(true);
    fetchNotifications();
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    await alertService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'help_offer': return { icon: 'hand-left', color: '#3B82F6', bg: '#DBEAFE' };
      case 'being_helped': return { icon: 'people', color: '#8B5CF6', bg: '#EDE9FE' };
      case 'solved': return { icon: 'checkmark-circle', color: '#10B981', bg: '#D1FAE5' };
      case 'comment': return { icon: 'chatbubble', color: '#F59E0B', bg: '#FEF3C7' };
      default: return { icon: 'notifications', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return t('justNow', 'Just now');
    if (diffMins < 60) return `${diffMins} ${t('mAgo', 'm ago')}`;
    if (diffHours < 24) return `${diffHours} ${t('hAgo', 'h ago')}`;
    if (diffDays < 7) return `${diffDays} ${t('dAgo', 'd ago')}`;
    return date.toLocaleDateString();
  };

  const formatDistance = (km?: number) => {
    if (!km) return '';
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const getCategoryInfo = (categoryId: string) => {
    const found = PROBLEM_CATEGORIES.find((c) => c.id === categoryId) || PROBLEM_CATEGORIES[7];
    const categoryKeyMap: Record<string, string> = {
      infrastructure: 'catInfrastructure',
      sanitation: 'catSanitation',
      utilities: 'catUtilities',
      safety: 'catSafety',
      access: 'catAccess',
      environment: 'catEnvironment',
      public_health: 'catPublicHealth',
      other: 'catOther',
    };
    const translatedName = t(categoryKeyMap[found.id] || 'catOther', found.name);
    return { ...found, name: translatedName };
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'posted': return { bg: '#FEF3C7', text: '#B45309', label: t('submitted', 'Submitted'), icon: 'time' };
      case 'being_helped': return { bg: '#DBEAFE', text: '#1D4ED8', label: t('inReview', 'In Review'), icon: 'eye' };
      case 'in_progress': return { bg: '#EDE9FE', text: '#7C3AED', label: t('inProgress', 'In Progress'), icon: 'construct' };
      case 'solved': return { bg: '#D1FAE5', text: '#047857', label: t('resolved', 'Resolved'), icon: 'checkmark-circle' };
      case 'escalated': return { bg: '#FEE2E2', text: '#DC2626', label: t('escalated', 'Escalated'), icon: 'arrow-up-circle' };
      default: return { bg: '#F3F4F6', text: '#6B7280', label: 'Unknown', icon: 'help' };
    }
  };

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16A34A" />

      {/* GovTech Header */}
      <ImageBackground 
        source={{ uri: 'https://i.ibb.co/whB6pRCJ/Gemini-Generated-Image-bw3acubw3acubw3a.png' }}
        style={styles.header}
        imageStyle={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <LinearGradient 
          colors={['rgba(15, 23, 42, 0.7)', 'rgba(15, 23, 42, 0.9)']} 
          style={StyleSheet.absoluteFillObject} 
          pointerEvents="none"
        />
        <View style={styles.headerTop}>
          <View style={styles.locationSection}>
            <View style={[styles.govIcon, { backgroundColor: 'transparent' }]}>
              <Image 
                source={{ uri: 'https://i.ibb.co/gZCY7kfh/Whats-App-Image-2026-08-07-at-20-45-40-1.jpg' }} 
                style={{ width: 36, height: 36, borderRadius: 12 }} 
                resizeMode="cover" 
              />
            </View>
            <View>
              <Text style={styles.locationLabel}>🏛️ {t('appName', 'JanMitra')}</Text>
              <Text style={styles.locationText} numberOfLines={1}>{t('portalSub', 'Civic Redressal Portal')}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifButton} onPress={openNotifications}>
            <Ionicons name="notifications" size={22} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.demoButton} 
            onPress={() => setShowLanguageModal(true)}
          >
            <Ionicons name="language-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Sort & Filter Row - GovTech Style */}
        <View style={styles.filterRow}>
          <View style={styles.sortToggle}>
            <TouchableOpacity
              style={[styles.sortBtn, sortBy === 'newest' && styles.sortBtnActive]}
              onPress={() => setSortBy('newest')}
            >
              <Ionicons name="time-outline" size={16} color={sortBy === 'newest' ? '#0F172A' : '#FFFFFF'} />
              <Text style={[styles.sortText, sortBy === 'newest' && styles.sortTextActive]}>{t('latestIssues', 'Latest Issues')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortBtn, sortBy === 'nearest' && styles.sortBtnActive]}
              onPress={() => setSortBy('nearest')}
            >
              <Ionicons name="navigate-outline" size={16} color={sortBy === 'nearest' ? '#0F172A' : '#FFFFFF'} />
              <Text style={[styles.sortText, sortBy === 'nearest' && styles.sortTextActive]}>{t('nearby', 'Nearby')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
            <Ionicons name="options" size={20} color="#FFFFFF" />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {statusFilter !== 'all' && (
              <TouchableOpacity style={styles.filterChip} onPress={() => setStatusFilter('all')}>
                <Text style={styles.filterChipText}>
                  {statusOptions.find(s => s.id === statusFilter)?.label}
                </Text>
                <Ionicons name="close" size={14} color="#16A34A" />
              </TouchableOpacity>
            )}
            {categoryFilter !== 'all' && (
              <TouchableOpacity style={styles.filterChip} onPress={() => setCategoryFilter('all')}>
                <Text style={styles.filterChipText}>
                  {getCategoryInfo(categoryFilter).emoji} {getCategoryInfo(categoryFilter).name}
                </Text>
                <Ionicons name="close" size={14} color="#16A34A" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {problems.length} {t('issuesReported', 'issues reported')}
        </Text>
      </View>

      {/* Trending Section */}
      {!loading && trendingProblems.length > 0 && showTrending && (
        <View style={styles.trendingSection}>
          <View style={styles.trendingSectionHeader}>
            <View style={styles.trendingTitle}>
              <Ionicons name="flame" size={20} color="#EF4444" />
              <Text style={styles.trendingTitleText}>{t('trendingNow', 'Trending Now')}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowTrending(false)}>
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
            {trendingProblems.map((problem) => {
              const category = getCategoryInfo(problem.category);
              return (
                <TouchableOpacity
                  key={problem.id}
                  style={styles.trendingCard}
                  onPress={() => router.push({ pathname: '/problem-details', params: { id: problem.id } })}
                  activeOpacity={0.9}
                >
                  <View style={styles.trendingBadge}>
                    <Ionicons name="flame" size={12} color="#FFFFFF" />
                  </View>
                  {problem.images?.[0] ? (
                    <Image source={{ uri: problem.images[0] }} style={styles.trendingImage} />
                  ) : (
                    <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.trendingImagePlaceholder}>
                      <Text style={styles.trendingEmoji}>{category.emoji}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.trendingContent}>
                    <Text style={styles.trendingCardTitle} numberOfLines={2}>{problem.title}</Text>
                    <View style={styles.trendingStats}>
                      <View style={styles.trendingStat}>
                        <Ionicons name="arrow-up" size={12} color="#16A34A" />
                        <Text style={styles.trendingStatText}>{problem.upvotes || 0}</Text>
                      </View>
                      <View style={styles.trendingStat}>
                        <Ionicons name="eye" size={12} color="#6B7280" />
                        <Text style={styles.trendingStatText}>{problem.views || 0}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <FeedSkeleton />
      ) : error ? (
        <View style={styles.errorState}>
          <View style={styles.errorIcon}>
            <Ionicons name="cloud-offline" size={64} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchProblems(); }}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} tintColor="#16A34A" />}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 400;
            if (isCloseToBottom) {
              loadMoreProblems();
            }
          }}
          scrollEventThrottle={400}
        >
          {problems.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
              </View>
              <Text style={styles.emptyTitle}>{t('allClear', 'All Clear! 🎉')}</Text>
              <Text style={styles.emptyText}>
                {activeFiltersCount > 0 ? t('noIssuesFilter', 'No issues match your filters') : t('noIssuesArea', 'No civic issues reported in your area')}
              </Text>
              {activeFiltersCount > 0 ? (
                <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
                  <Text style={styles.emptyButtonText}>{t('clearAll', 'Clear Filters')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(tabs)/post')}>
                  <Text style={styles.emptyButtonText}>{t('postTitle', 'Report a Civic Issue')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            problems
              .filter(problem => problem && problem.id) // Filter out invalid problems
              .map((problem) => {
              const category = getCategoryInfo(problem.category);
              const statusStyle = getStatusStyle(problem.status);
              return (
                <TouchableOpacity
                  key={problem.id}
                  style={styles.card}
                  onPress={() => router.push({ pathname: '/problem-details', params: { id: problem.id } })}
                  activeOpacity={0.9}
                >
                  {/* Card Image */}
                  <View style={styles.cardImageContainer}>
                    {problem.images?.[0] ? (
                      <Image source={{ uri: problem.images[0] }} style={styles.cardImage} />
                    ) : (
                      <LinearGradient colors={['#F1F5F9', '#E2E8F0']} style={styles.cardImagePlaceholder}>
                        <Text style={styles.cardEmoji}>{category.emoji}</Text>
                      </LinearGradient>
                    )}
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Ionicons name={statusStyle.icon as any} size={12} color={statusStyle.text} />
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                    </View>
                    {/* Distance Badge */}
                    {problem.distance !== undefined && (
                      <View style={styles.distanceBadge}>
                        <Ionicons name="navigate" size={12} color="#FFFFFF" />
                        <Text style={styles.distanceText}>{formatDistance(problem.distance)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Card Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                          <Text style={styles.categoryText}>{category.name}</Text>
                        </View>
                        <View style={{ backgroundColor: category.isGovOnly ? '#FEE2E2' : '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: category.isGovOnly ? '#FECACA' : '#A7F3D0' }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: category.isGovOnly ? '#DC2626' : '#047857' }}>
                            {category.isGovOnly ? t('govOnly', '🏛️ GOV ONLY') : t('community', '🤝 COMMUNITY')}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.timeText}>{getTimeAgo(problem.created_at)}</Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>{problem.title}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={14} color="#16A34A" />
                      <Text style={styles.locationRowText} numberOfLines={1}>{problem.address}</Text>
                    </View>
                    
                    {/* Cost Analysis Row - Now shows SLA/Department Info for Redressal */}
                    <View style={styles.costAnalysisRow}>
                      <View style={styles.costIcon}>
                        <Ionicons name="business" size={14} color="#059669" />
                      </View>
                      <View style={styles.costTextContainer}>
                        <Text style={styles.costLabel}>{t('routingDept', 'Routing Dept:')}</Text>
                        <Text style={styles.costAmount}>
                          {(() => {
                            const deptMap: Record<string, string> = {
                              infrastructure: t('deptPublicWorks', 'Public Works'),
                              sanitation: t('deptSanitation', 'Sanitation Dept'),
                              utilities: t('deptUtilities', 'Utility Services'),
                              safety: t('deptSafety', 'Safety Authority'),
                              access: t('deptAccess', 'Disability Affairs'),
                              environment: t('deptEnvironment', 'Environment Dept'),
                              public_health: t('deptHealth', 'Health Dept'),
                              other: t('deptCivicCenter', 'Civic Center')
                            };
                            return problem.department?.name || deptMap[problem.category] || t('deptCivicCenter', 'Civic Center');
                          })()}
                        </Text>
                      </View>
                      <View style={styles.costBadge}>
                        <Text style={styles.costBadgeText}>🏛️</Text>
                      </View>
                    </View>
                    
                    {/* Vote Button */}
                    <View style={styles.voteSection}>
                      <VoteButton 
                        problemId={problem.id} 
                        initialUpvotes={problem.upvotes || 0}
                        initialDownvotes={problem.downvotes || 0}
                        size="small"
                      />
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>SLA 48h</Text>
                        </View>
                        <View style={styles.viewCount}>
                          <Ionicons name="document-text-outline" size={14} color="#6B7280" />
                          <Text style={styles.viewCountText}>Ref: {problem.id?.substring(0, 5).toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Card Footer */}
                    <View style={styles.cardFooter}>
                      <View style={styles.userRow}>
                        <Image
                          source={{ uri: problem.user?.avatar_url && problem.user.avatar_url.length > 0 ? problem.user.avatar_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(problem.user?.name || 'U')}&background=16A34A&color=fff&size=64` }}
                          style={styles.userAvatar}
                        />
                        <Text style={styles.userName} numberOfLines={1}>{problem.user?.name || 'Anonymous'}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          
          {/* Loading More Indicator */}
          {loadingMore && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#16A34A" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          )}
          
          {/* No More Items */}
          {!hasMore && problems.length > 0 && (
            <View style={styles.noMoreItems}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.noMoreText}>You've seen all issues</Text>
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Notification Panel */}
      <Modal visible={showNotifications} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowNotifications(false)}>
          <Pressable style={styles.notifPanel} onPress={(e) => e.stopPropagation()}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notifications</Text>
              <View style={styles.notifActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotifications(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications List */}
            {loadingNotifications ? (
              <View style={styles.notifLoading}>
                <ActivityIndicator size="large" color="#16A34A" />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.notifEmpty}>
                <View style={styles.notifEmptyIcon}>
                  <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
                </View>
                <Text style={styles.notifEmptyTitle}>No Notifications</Text>
                <Text style={styles.notifEmptyText}>You'll be notified about your complaint status updates</Text>
              </View>
            ) : (
              <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
                {notifications.map((notif) => {
                  const iconStyle = getNotificationIcon(notif.type);
                  return (
                    <TouchableOpacity
                      key={notif.id}
                      style={[styles.notifItem, !notif.read && styles.notifItemUnread]}
                      onPress={() => {
                        if (notif.problem_id) {
                          setShowNotifications(false);
                          router.push({ pathname: '/problem-details', params: { id: notif.problem_id } });
                        }
                        alertService.markAsRead(notif.id);
                      }}
                    >
                      <View style={[styles.notifIcon, { backgroundColor: iconStyle.bg }]}>
                        <Ionicons name={iconStyle.icon as any} size={20} color={iconStyle.color} />
                      </View>
                      <View style={styles.notifContent}>
                        <View style={styles.notifTitleRow}>
                          <Text style={[styles.notifItemTitle, !notif.read && styles.notifItemTitleUnread]} numberOfLines={1}>
                            {notif.title}
                          </Text>
                          {!notif.read && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                        <Text style={styles.notifTime}>{getTimeAgo(notif.created_at)}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height: 20 }} />
              </ScrollView>
            )}

            {/* View All Button */}
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => { setShowNotifications(false); router.push('/(tabs)/activity'); }}
            >
              <Text style={styles.viewAllText}>View All Activity</Text>
              <Ionicons name="arrow-forward" size={18} color="#16A34A" />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Problems</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Status Filter */}
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterOptions}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.filterOption, statusFilter === option.id && styles.filterOptionActive]}
                  onPress={() => setStatusFilter(option.id)}
                >
                  <Ionicons name={option.icon as any} size={18} color={statusFilter === option.id ? '#FFFFFF' : option.color} />
                  <Text style={[styles.filterOptionText, statusFilter === option.id && styles.filterOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Filter */}
            <Text style={styles.filterLabel}>Category</Text>
            <ScrollView style={styles.categoryScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.categoryGrid}>
                <TouchableOpacity
                  style={[styles.categoryOption, categoryFilter === 'all' && styles.categoryOptionActive]}
                  onPress={() => setCategoryFilter('all')}
                >
                  <Text style={styles.categoryOptionEmoji}>🏠</Text>
                  <Text style={[styles.categoryOptionText, categoryFilter === 'all' && styles.categoryOptionTextActive]}>All</Text>
                </TouchableOpacity>
                {PROBLEM_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryOption, categoryFilter === cat.id && styles.categoryOptionActive]}
                    onPress={() => setCategoryFilter(cat.id)}
                  >
                    <Text style={styles.categoryOptionEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.categoryOptionText, categoryFilter === cat.id && styles.categoryOptionTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Apply Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearFilterBtn} onPress={clearFilters}>
                <Text style={styles.clearFilterText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilterModal(false)}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLanguageModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectLanguage', 'Select Language')}</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              <View style={styles.filterOptions}>
                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'Hindi (हिन्दी)' },
                  { code: 'mr', label: 'Marathi (मराठी)' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.code}
                    style={[
                      styles.filterOption,
                      language === item.code && styles.filterOptionActive,
                      { width: '100%', justifyContent: 'space-between' }
                    ]}
                    onPress={() => {
                      setLanguage(item.code as Language);
                      setShowLanguageModal(false);
                    }}
                  >
                    <Text style={[styles.filterOptionText, language === item.code && styles.filterOptionTextActive]}>
                      {item.label}
                    </Text>
                    {language === item.code && (
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  locationSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  govIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  locationIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  locationLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  locationText: { fontSize: 16, color: '#FFFFFF', fontWeight: '700', maxWidth: 200 },
  notifButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  demoButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  notifBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sortToggle: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 4 },
  sortBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  sortBtnActive: { backgroundColor: '#FFFFFF' },
  sortText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  sortTextActive: { color: '#16A34A' },
  filterBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  activeFilters: { backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#16A34A' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#16A34A' },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },
  resultsBar: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF' },
  resultsText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#64748B' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#64748B', marginBottom: 24, textAlign: 'center' },
  emptyButton: { backgroundColor: '#16A34A', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  emptyButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  errorIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  errorText: { fontSize: 15, color: '#64748B', marginBottom: 24, textAlign: 'center', paddingHorizontal: 32 },
  retryButton: { backgroundColor: '#16A34A', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  retryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  cardImageContainer: { position: 'relative', height: 180 },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 56 },
  statusBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  distanceBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  distanceText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  categoryEmoji: { fontSize: 12 },
  categoryText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  timeText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', lineHeight: 24, marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 4 },
  locationRowText: { fontSize: 13, color: '#64748B', flex: 1 },
  costAnalysisRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 14, 
    gap: 8, 
    backgroundColor: '#F0FDF4', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 16, 
    borderWidth: 1.5, 
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  costIcon: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: '#D1FAE5', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  costTextContainer: { 
    flex: 1, 
    marginLeft: 4 
  },
  costLabel: { 
    fontSize: 11, 
    color: '#047857', 
    fontWeight: '500',
    marginBottom: 2
  },
  costAmount: { 
    fontSize: 14, 
    color: '#059669', 
    fontWeight: '700' 
  },
  costBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  costBadgeText: {
    fontSize: 16
  },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  userRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  userName: { fontSize: 14, fontWeight: '600', color: '#475569', maxWidth: 140 },
  helpBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
  helpText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 34, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  modalClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  filterLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12, marginTop: 8 },
  filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', gap: 6 },
  filterOptionActive: { backgroundColor: '#16A34A' },
  filterOptionText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  filterOptionTextActive: { color: '#FFFFFF' },
  categoryScroll: { maxHeight: 200 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryOption: { width: '30%', alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#F1F5F9' },
  categoryOptionActive: { backgroundColor: '#16A34A' },
  categoryOptionEmoji: { fontSize: 24, marginBottom: 4 },
  categoryOptionText: { fontSize: 11, fontWeight: '600', color: '#475569', textAlign: 'center' },
  categoryOptionTextActive: { color: '#FFFFFF' },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  clearFilterBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  clearFilterText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  applyBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#16A34A', alignItems: 'center' },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  // Notification Panel Styles
  notifPanel: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, maxHeight: '75%' },
  handleBar: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  notifTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  notifActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  markAllBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  markAllText: { fontSize: 13, fontWeight: '600', color: '#16A34A' },
  notifLoading: { paddingVertical: 60, alignItems: 'center' },
  notifEmpty: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 32 },
  notifEmptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  notifEmptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  notifEmptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  notifList: { maxHeight: 400 },
  notifItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  notifItemUnread: { backgroundColor: '#F0FDF4' },
  notifIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  notifItemTitle: { fontSize: 15, fontWeight: '500', color: '#475569', flex: 1 },
  notifItemTitleUnread: { fontWeight: '700', color: '#1F2937' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  notifMessage: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 12, color: '#9CA3AF' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 8, marginBottom: 20 },
  viewAllText: { fontSize: 15, fontWeight: '600', color: '#16A34A' },
  // Loading More Styles
  loadingMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 10 },
  loadingMoreText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  noMoreItems: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 10 },
  noMoreText: { fontSize: 14, color: '#10B981', fontWeight: '600' },
  // Trending Section
  trendingSection: { paddingVertical: 10 },
  trendingSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  trendingTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendingTitleText: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  trendingScroll: { paddingLeft: 16 },
  trendingCard: { width: 130, marginRight: 10, backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  trendingBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#EF4444', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  trendingImage: { width: '100%', height: 75 },
  trendingImagePlaceholder: { width: '100%', height: 75, alignItems: 'center', justifyContent: 'center' },
  trendingEmoji: { fontSize: 24 },
  trendingContent: { padding: 8 },
  trendingCardTitle: { fontSize: 12, fontWeight: '600', color: '#1F2937', lineHeight: 16, marginBottom: 4 },
  trendingStats: { flexDirection: 'row', gap: 8 },
  trendingStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendingStatText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  // Vote Section
  voteSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  viewCount: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F9FAFB', borderRadius: 12 },
  viewCountText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
});

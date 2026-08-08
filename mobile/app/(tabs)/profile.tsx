/**
 * Profile Screen
 * User profile with stats and settings
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    complaints_filed: 0,
    in_review: 0,
    resolved: 0,
  });

  useEffect(() => {
    if (user) {
      setStats({
        complaints_filed: user.problems_posted || 0,
        in_review: 0,
        resolved: user.problems_solved || 0,
      });
    }
  }, [user]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'officer',
      icon: 'shield-checkmark',
      label: t('officerPortal', 'Officer Portal'),
      color: '#0F172A',
      onPress: () => router.push('/officer-login'),
      show: true, // Always show for demo
    },
    {
      id: 'edit',
      icon: 'person-outline',
      label: t('editProfile', 'Edit Profile'),
      color: '#3B82F6',
      onPress: () => router.push('/edit-profile'),
      show: true,
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      label: t('notifications', 'Notifications'),
      color: '#8B5CF6',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon'),
      show: true,
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline',
      label: t('privacySecurity', 'Privacy & Security'),
      color: '#10B981',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon'),
      show: true,
    },
    {
      id: 'help',
      icon: 'help-circle-outline',
      label: t('helpSupport', 'Help & Support'),
      color: '#64748B',
      onPress: () => Alert.alert('Help', 'Contact us at support@janmitra.app'),
      show: true,
    },
    {
      id: 'about',
      icon: 'information-circle-outline',
      label: t('aboutJanMitra', 'About JanMitra'),
      color: '#64748B',
      onPress: () => Alert.alert('JanMitra', 'Version 1.0.0\nCommunity Redressal Planner'),
      show: true,
    },
  ];

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16A34A" />

      {/* Header with Gradient */}
      <LinearGradient colors={['#16A34A', '#15803D']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('profileTitle', 'Profile')}</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri: user?.avatar_url && user.avatar_url.length > 0
                ? user.avatar_url
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=16A34A&color=fff&size=200`,
            }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <Text style={styles.userPhone}>{user?.phone || ''}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.complaints_filed}</Text>
              <Text style={styles.statLabel}>{t('postedStats', 'Posted')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>{t('resolvedStats', 'Resolved')}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Items */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.menuSection}>
          {menuItems.filter(item => item.show).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.signOutText}>{t('signOut', 'Sign Out')}</Text>
        </TouchableOpacity>

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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 80,
  },
  headerContent: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#F0FDF4',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  scrollView: {
    flex: 1,
    marginTop: -60,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
});

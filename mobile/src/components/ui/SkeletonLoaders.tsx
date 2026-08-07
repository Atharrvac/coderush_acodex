/**
 * Skeleton Loaders for Different Screens
 * Pre-built skeleton layouts for consistent loading states
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton, SkeletonCircle, SkeletonRect } from './Skeleton';

// Problem Card Skeleton (for Feed Screen)
export const ProblemCardSkeleton: React.FC = () => {
    return (
        <View style={styles.card}>
            {/* Image skeleton */}
            <SkeletonRect width="100%" height={180} borderRadius={0} />

            {/* Content */}
            <View style={styles.cardContent}>
                {/* Category and time */}
                <View style={styles.cardHeader}>
                    <Skeleton width={100} height={24} borderRadius={12} />
                    <Skeleton width={60} height={14} borderRadius={8} />
                </View>

                {/* Title */}
                <Skeleton width="90%" height={20} borderRadius={8} style={{ marginBottom: 8 }} />
                <Skeleton width="70%" height={20} borderRadius={8} style={{ marginBottom: 12 }} />

                {/* Location */}
                <Skeleton width="60%" height={16} borderRadius={8} style={{ marginBottom: 14 }} />

                {/* Footer */}
                <View style={styles.cardFooter}>
                    <View style={styles.userRow}>
                        <SkeletonCircle size={32} />
                        <Skeleton width={100} height={16} borderRadius={8} style={{ marginLeft: 10 }} />
                    </View>
                    <Skeleton width={70} height={32} borderRadius={10} />
                </View>
            </View>
        </View>
    );
};

// Feed Screen Skeleton (multiple cards)
export const FeedSkeleton: React.FC = () => {
    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <ProblemCardSkeleton />
            <ProblemCardSkeleton />
            <ProblemCardSkeleton />
            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

// Activity Item Skeleton
export const ActivityItemSkeleton: React.FC = () => {
    return (
        <View style={styles.activityItem}>
            <SkeletonCircle size={56} />
            <View style={styles.activityContent}>
                <Skeleton width="80%" height={18} borderRadius={8} style={{ marginBottom: 6 }} />
                <Skeleton width="60%" height={14} borderRadius={8} style={{ marginBottom: 8 }} />
                <Skeleton width={80} height={12} borderRadius={6} />
            </View>
        </View>
    );
};

// Activity Screen Skeleton
export const ActivitySkeleton: React.FC = () => {
    return (
        <ScrollView style={styles.scrollView}>
            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Skeleton width={40} height={40} borderRadius={12} style={{ marginBottom: 8 }} />
                    <Skeleton width={50} height={28} borderRadius={8} style={{ marginBottom: 4 }} />
                    <Skeleton width={70} height={14} borderRadius={6} />
                </View>
                <View style={styles.statCard}>
                    <Skeleton width={40} height={40} borderRadius={12} style={{ marginBottom: 8 }} />
                    <Skeleton width={50} height={28} borderRadius={8} style={{ marginBottom: 4 }} />
                    <Skeleton width={70} height={14} borderRadius={6} />
                </View>
                <View style={styles.statCard}>
                    <Skeleton width={40} height={40} borderRadius={12} style={{ marginBottom: 8 }} />
                    <Skeleton width={50} height={28} borderRadius={8} style={{ marginBottom: 4 }} />
                    <Skeleton width={70} height={14} borderRadius={6} />
                </View>
            </View>

            {/* Activity Items */}
            <View style={styles.activityList}>
                <ActivityItemSkeleton />
                <ActivityItemSkeleton />
                <ActivityItemSkeleton />
                <ActivityItemSkeleton />
                <ActivityItemSkeleton />
            </View>
        </ScrollView>
    );
};

// Profile Screen Skeleton
export const ProfileSkeleton: React.FC = () => {
    return (
        <ScrollView style={styles.scrollView}>
            {/* Header */}
            <View style={styles.profileHeader}>
                <SkeletonCircle size={100} />
                <Skeleton width={150} height={24} borderRadius={8} style={{ marginTop: 16, marginBottom: 8 }} />
                <Skeleton width={200} height={16} borderRadius={8} style={{ marginBottom: 8 }} />
                <Skeleton width={120} height={16} borderRadius={8} />
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Skeleton width={50} height={28} borderRadius={8} style={{ marginBottom: 4 }} />
                    <Skeleton width={70} height={14} borderRadius={6} />
                </View>
                <View style={styles.statCard}>
                    <Skeleton width={50} height={28} borderRadius={8} style={{ marginBottom: 4 }} />
                    <Skeleton width={70} height={14} borderRadius={6} />
                </View>
                <View style={styles.statCard}>
                    <Skeleton width={50} height={28} borderRadius={8} style={{ marginBottom: 4 }} />
                    <Skeleton width={70} height={14} borderRadius={6} />
                </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuList}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <Skeleton width={40} height={40} borderRadius={12} />
                            <View style={{ marginLeft: 12 }}>
                                <Skeleton width={120} height={16} borderRadius={8} style={{ marginBottom: 6 }} />
                                <Skeleton width={180} height={14} borderRadius={6} />
                            </View>
                        </View>
                        <Skeleton width={24} height={24} borderRadius={12} />
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

// Problem Details Skeleton
export const ProblemDetailsSkeleton: React.FC = () => {
    return (
        <ScrollView style={styles.scrollView}>
            {/* Image */}
            <SkeletonRect width="100%" height={300} borderRadius={0} />

            {/* Content */}
            <View style={styles.detailsContent}>
                {/* Category and Status */}
                <View style={styles.detailsHeader}>
                    <Skeleton width={100} height={28} borderRadius={14} />
                    <Skeleton width={100} height={28} borderRadius={14} />
                </View>

                {/* Title */}
                <Skeleton width="95%" height={24} borderRadius={8} style={{ marginTop: 16, marginBottom: 8 }} />
                <Skeleton width="80%" height={24} borderRadius={8} style={{ marginBottom: 16 }} />

                {/* User Info */}
                <View style={styles.userInfo}>
                    <SkeletonCircle size={48} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Skeleton width={120} height={16} borderRadius={8} style={{ marginBottom: 6 }} />
                        <Skeleton width={80} height={14} borderRadius={6} />
                    </View>
                </View>

                {/* Description */}
                <View style={{ marginTop: 20 }}>
                    <Skeleton width={100} height={18} borderRadius={8} style={{ marginBottom: 12 }} />
                    <Skeleton width="100%" height={16} borderRadius={8} style={{ marginBottom: 8 }} />
                    <Skeleton width="95%" height={16} borderRadius={8} style={{ marginBottom: 8 }} />
                    <Skeleton width="85%" height={16} borderRadius={8} style={{ marginBottom: 8 }} />
                    <Skeleton width="70%" height={16} borderRadius={8} />
                </View>

                {/* Location */}
                <View style={{ marginTop: 20 }}>
                    <Skeleton width={80} height={18} borderRadius={8} style={{ marginBottom: 12 }} />
                    <Skeleton width="90%" height={16} borderRadius={8} />
                </View>

                {/* Action Button */}
                <Skeleton width="100%" height={56} borderRadius={16} style={{ marginTop: 24 }} />
            </View>
        </ScrollView>
    );
};

// Map Marker Skeleton
export const MapMarkerSkeleton: React.FC = () => {
    return (
        <View style={styles.mapMarker}>
            <Skeleton width={200} height={100} borderRadius={12} />
        </View>
    );
};

// Notification Item Skeleton
export const NotificationSkeleton: React.FC = () => {
    return (
        <View style={styles.notifItem}>
            <Skeleton width={44} height={44} borderRadius={12} />
            <View style={styles.notifContent}>
                <Skeleton width="80%" height={16} borderRadius={8} style={{ marginBottom: 6 }} />
                <Skeleton width="95%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
                <Skeleton width={60} height={12} borderRadius={6} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    activityItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
    },
    activityContent: {
        flex: 1,
        marginLeft: 12,
    },
    activityList: {
        padding: 16,
    },
    statsRow: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    profileHeader: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#FFFFFF',
    },
    menuList: {
        padding: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    detailsContent: {
        padding: 20,
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mapMarker: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    notifItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    notifContent: {
        flex: 1,
        marginLeft: 12,
    },
});

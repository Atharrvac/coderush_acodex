/**
 * Community Redressal Planner - Nearby Civic Issues
 * View issues near your location with department routing
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { problemService } from '../../src/services/problem.service';
import { Problem } from '../../src/types';
import { PROBLEM_CATEGORIES, STATUS_CONFIG } from '../../src/constants/categories';
import { useLanguage } from '../../src/contexts/LanguageContext';

export default function MapScreen() {
  const { t } = useLanguage();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    initializeMap();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userLocation) {
        fetchProblems();
      }
    }, [userLocation])
  );

  const initializeMap = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        await fetchProblems();
        return;
      }

      // Use lower accuracy for faster response and better compatibility
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      await fetchProblemsWithLocation(location.coords.latitude, location.coords.longitude);
    } catch (error: any) {
      console.error('Map init error:', error);
      // Still fetch problems without location
      await fetchProblems();
    } finally {
      setLoading(false);
    }
  };

  const fetchProblemsWithLocation = async (lat: number, lng: number) => {
    try {
      const data = await problemService.getNearby(lat, lng, 20);
      setProblems(data);
    } catch (error) {
      console.error('Fetch problems error:', error);
    }
  };

  const fetchProblems = async () => {
    try {
      const data = await problemService.getAll({ sortBy: 'newest' });
      setProblems(data);
    } catch (error) {
      console.error('Fetch problems error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userLocation) {
      await fetchProblemsWithLocation(userLocation.latitude, userLocation.longitude);
    } else {
      await fetchProblems();
    }
    setRefreshing(false);
  };

  const openInMaps = (lat: number, lng: number, title: string) => {
    const url = `https://maps.google.com/?q=${lat},${lng}&label=${encodeURIComponent(title)}`;
    Linking.openURL(url);
  };

  const formatDistance = (km?: number) => {
    if (!km) return '';
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const getCategoryInfo = (categoryId: string) => {
    return PROBLEM_CATEGORIES.find((c) => c.id === categoryId) || PROBLEM_CATEGORIES[7];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' };
      case 'being_helped': return { bg: '#DBEAFE', text: '#2563EB', dot: '#3B82F6' };
      case 'solved': return { bg: '#D1FAE5', text: '#059669', dot: '#10B981' };
      default: return { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: '#F0FDF4' }}
        >
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
        <Text className="text-gray-600 font-medium">{t('findingProblems', 'Finding problems near you...')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="px-5 pt-4 pb-4 bg-white"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
              style={{ backgroundColor: '#DBEAFE' }}
            >
              <Ionicons name="location" size={24} color="#2563EB" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-gray-900">{t('mapTitle', 'Nearby')}</Text>
              <Text className="text-gray-500 text-sm">
                {problems.length} {t('issuesReported', 'problems found')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: '#F0FDF4' }}
          >
            <Ionicons name="refresh" size={24} color="#16A34A" />
          </TouchableOpacity>
        </View>

        {/* Status Legend */}
        <View
          className="flex-row rounded-2xl p-3"
          style={{ backgroundColor: '#F9FAFB' }}
        >
          <View className="flex-1 flex-row items-center justify-center">
            <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#F59E0B' }} />
            <Text className="text-gray-600 text-xs font-medium">Posted</Text>
          </View>
          <View className="flex-1 flex-row items-center justify-center">
            <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#3B82F6' }} />
            <Text className="text-gray-600 text-xs font-medium">Helping</Text>
          </View>
          <View className="flex-1 flex-row items-center justify-center">
            <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#10B981' }} />
            <Text className="text-gray-600 text-xs font-medium">Solved</Text>
          </View>
        </View>
      </View>

      {/* Problems List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
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
        {problems.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: '#DBEAFE' }}
            >
              <Ionicons name="location-outline" size={48} color="#2563EB" />
            </View>
            <Text className="text-xl font-bold text-gray-800 mb-2">No Problems Nearby</Text>
            <Text className="text-gray-500 text-center mb-6 px-8">
              Great news! There are no reported problems in your area.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/post')}
              className="px-8 py-4 rounded-2xl flex-row items-center"
              style={{ backgroundColor: '#16A34A' }}
            >
              <Ionicons name="add-circle" size={22} color="#FFFFFF" />
              <Text className="text-white font-bold text-base ml-2">Report a Problem</Text>
            </TouchableOpacity>
          </View>
        ) : (
          problems.map((problem, index) => {
            const category = getCategoryInfo(problem.category);
            const statusColors = getStatusColor(problem.status);

            return (
              <TouchableOpacity
                key={problem.id}
                onPress={() =>
                  router.push({ pathname: '/problem-details', params: { id: problem.id } })
                }
                className="bg-white rounded-2xl mb-3 overflow-hidden"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View className="flex-row p-4">
                  {/* Rank Badge */}
                  <View
                    className="absolute top-3 left-3 w-7 h-7 rounded-full items-center justify-center z-10"
                    style={{ backgroundColor: index < 3 ? '#16A34A' : '#E5E7EB' }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: index < 3 ? '#FFFFFF' : '#6B7280' }}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  {/* Image or Emoji */}
                  {problem.images?.[0] ? (
                    <Image
                      source={{ uri: problem.images[0] }}
                      className="w-20 h-20 rounded-xl mr-3"
                    />
                  ) : (
                    <View
                      className="w-20 h-20 rounded-xl mr-3 items-center justify-center"
                      style={{ backgroundColor: '#F3F4F6' }}
                    >
                      <Text className="text-3xl">{category.emoji}</Text>
                    </View>
                  )}

                  <View className="flex-1">
                    {/* Status & Distance */}
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View
                        className="px-2.5 py-1 rounded-full flex-row items-center"
                        style={{ backgroundColor: statusColors.bg }}
                      >
                        <View
                          className="w-1.5 h-1.5 rounded-full mr-1.5"
                          style={{ backgroundColor: statusColors.dot }}
                        />
                        <Text
                          className="text-xs font-bold"
                          style={{ color: statusColors.text }}
                        >
                          {STATUS_CONFIG[problem.status]?.label || 'Posted'}
                        </Text>
                      </View>
                      {problem.distance !== undefined && (
                        <View
                          className="px-2.5 py-1 rounded-full flex-row items-center"
                          style={{ backgroundColor: '#F0FDF4' }}
                        >
                          <Ionicons name="navigate" size={10} color="#16A34A" />
                          <Text className="text-xs font-bold ml-1" style={{ color: '#16A34A' }}>
                            {formatDistance(problem.distance)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Title */}
                    <Text className="text-gray-900 font-bold text-base mb-1" numberOfLines={1}>
                      {problem.title}
                    </Text>

                    {/* Category */}
                    <View className="flex-row items-center mb-1">
                      <Text className="text-sm mr-1">{category.emoji}</Text>
                      <Text className="text-gray-500 text-xs">{category.name}</Text>
                    </View>

                    {/* Address */}
                    <View className="flex-row items-center">
                      <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs ml-1 flex-1" numberOfLines={1}>
                        {problem.address}
                      </Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={{ alignSelf: 'center' }} />
                </View>

                {/* Open in Maps Button */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    openInMaps(problem.latitude, problem.longitude, problem.title);
                  }}
                  className="flex-row items-center justify-center py-3"
                  style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6' }}
                >
                  <Ionicons name="navigate-circle" size={18} color="#16A34A" />
                  <Text className="font-semibold text-sm ml-1.5" style={{ color: '#16A34A' }}>
                    Open in Maps
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

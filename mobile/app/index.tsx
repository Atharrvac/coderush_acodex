/**
 * Entry Screen
 * Redirects based on auth state
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted after a short delay
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Check for direct officer access on web
    if (Platform.OS === 'web') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('officer') === 'direct') {
        // Use a longer delay to ensure proper mounting
        setTimeout(() => {
          router.replace('/officer');
        }, 500);
        return;
      }
    }

    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, isMounted]);

  return (
    <View className="flex-1 items-center justify-center bg-primary-600">
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}

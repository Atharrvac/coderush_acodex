/**
 * Root Layout
 * 
 * Sets up providers and global configuration
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/contexts/AuthContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { networkMonitor } from '../src/utils/networkMonitor';
import { offlineQueue } from '../src/utils/offlineQueue';
import WebCompatibility from '../src/components/WebCompatibility';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    // Initialize stability features
    console.log('🚀 Initializing stability features...');
    
    // Initialize network monitoring
    networkMonitor.initialize();
    console.log('✅ Network monitor initialized');
    
    // Initialize offline queue
    offlineQueue.initialize();
    console.log('✅ Offline queue initialized');
    
    // Cleanup on unmount
    return () => {
      networkMonitor.cleanup();
      console.log('🧹 Stability features cleaned up');
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <WebCompatibility />
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="problem-details" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="chat" />
            <Stack.Screen name="active-sessions" />
          </Stack>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

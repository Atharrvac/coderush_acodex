/**
 * Error Boundary Component
 * Catches and handles React errors gracefully
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <View className="flex-1 items-center justify-center p-8 bg-gray-50">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: '#FEE2E2' }}
          >
            <Ionicons name="alert-circle" size={40} color="#DC2626" />
          </View>
          
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            Something went wrong
          </Text>
          
          <Text className="text-gray-600 text-center mb-6 leading-5">
            We encountered an unexpected error. Please try again.
          </Text>
          
          {__DEV__ && this.state.error && (
            <View className="bg-red-50 p-4 rounded-xl mb-4 w-full">
              <Text className="text-red-800 text-sm font-mono">
                {this.state.error.message}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            onPress={this.retry}
            className="px-6 py-3 rounded-xl flex-row items-center"
            style={{ backgroundColor: '#16A34A' }}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text className="text-white font-bold ml-2">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Simple error fallback component
export const SimpleErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ 
  error, 
  retry 
}) => (
  <View className="p-4 bg-red-50 rounded-xl m-4">
    <View className="flex-row items-center mb-2">
      <Ionicons name="alert-circle" size={20} color="#DC2626" />
      <Text className="text-red-800 font-bold ml-2">Error</Text>
    </View>
    <Text className="text-red-700 text-sm mb-3">
      {error?.message || 'Something went wrong'}
    </Text>
    <TouchableOpacity
      onPress={retry}
      className="self-start px-3 py-1 rounded bg-red-600"
    >
      <Text className="text-white text-sm font-medium">Retry</Text>
    </TouchableOpacity>
  </View>
);

export default ErrorBoundary;
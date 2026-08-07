/**
 * NagrikSeva - Login Screen
 * Beautiful, user-friendly login
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const passwordRef = useRef<TextInput>(null);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.error || 'Invalid credentials'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-12">
            {/* Header */}
            <View className="items-center mb-10">
              <View 
                className="w-24 h-24 rounded-3xl items-center justify-center mb-5"
                style={{ 
                  backgroundColor: '#16A34A',
                  shadowColor: '#16A34A',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Ionicons name="map" size={48} color="#FFFFFF" />
              </View>
              <Text className="text-3xl font-bold text-gray-900">🏛️ Redressal Planner</Text>
              <Text className="text-gray-500 mt-2 text-base">Community Civic Issue Portal</Text>
            </View>

            {/* Welcome Text */}
            <View className="mb-8">
              <Text className="text-2xl font-bold text-gray-900 mb-1">Welcome to Redressal Portal!</Text>
              <Text className="text-gray-500">Sign in to report and track civic issues</Text>
            </View>

            {/* Form */}
            <View className="mb-6">
              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Email</Text>
                <View 
                  className="flex-row items-center rounded-2xl px-4 py-4"
                  style={{ 
                    backgroundColor: '#F9FAFB',
                    borderWidth: errors.email ? 2 : 1,
                    borderColor: errors.email ? '#EF4444' : '#E5E7EB',
                  }}
                >
                  <View 
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: '#F0FDF4' }}
                  >
                    <Ionicons name="mail" size={20} color="#16A34A" />
                  </View>
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    className="flex-1 ml-3 text-gray-900 text-base"
                  />
                </View>
                {errors.email && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text className="text-red-500 text-sm ml-1">{errors.email}</Text>
                  </View>
                )}
              </View>

              {/* Password Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Password</Text>
                <View 
                  className="flex-row items-center rounded-2xl px-4 py-4"
                  style={{ 
                    backgroundColor: '#F9FAFB',
                    borderWidth: errors.password ? 2 : 1,
                    borderColor: errors.password ? '#EF4444' : '#E5E7EB',
                  }}
                >
                  <View 
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: '#F0FDF4' }}
                  >
                    <Ionicons name="lock-closed" size={20} color="#16A34A" />
                  </View>
                  <TextInput
                    ref={passwordRef}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    className="flex-1 ml-3 text-gray-900 text-base"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    className="p-2"
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={22} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text className="text-red-500 text-sm ml-1">{errors.password}</Text>
                  </View>
                )}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity className="self-end mb-6">
                <Text className="font-semibold" style={{ color: '#16A34A' }}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="py-4 rounded-2xl items-center flex-row justify-center"
              style={{ 
                backgroundColor: loading ? '#D1D5DB' : '#16A34A',
                shadowColor: '#16A34A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: loading ? 0 : 0.3,
                shadowRadius: 8,
                elevation: loading ? 0 : 4,
              }}
            >
              {loading ? (
                <Text className="text-white font-bold text-lg">Signing In...</Text>
              ) : (
                <>
                  <Ionicons name="log-in" size={22} color="#FFFFFF" />
                  <Text className="text-white font-bold text-lg ml-2">Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View className="flex-row justify-center mt-8">
              <Text className="text-gray-500 text-base">Don&apos;t have an account? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text className="font-bold text-base" style={{ color: '#16A34A' }}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Info Box */}
            <View 
              className="mt-8 rounded-2xl p-4"
              style={{ backgroundColor: '#EFF6FF' }}
            >
              <View className="flex-row items-start">
                <View 
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#DBEAFE' }}
                >
                  <Ionicons name="shield-checkmark" size={20} color="#1E40AF" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-bold text-gray-800 mb-1">🏛️ Redressal Planner</Text>
                  <Text className="text-gray-600 text-sm leading-5">
                    Report civic issues → Get routed to dept → Track resolution with SLA accountability
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Community Redressal Planner - Registration Screen
 * Resident registration for civic issue reporting
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

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'officer'>('citizen');

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Min 6 characters';
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        role: selectedRole,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: string,
    placeholder: string,
    options: {
      ref?: React.RefObject<TextInput | null>;
      error?: string;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'words';
      secureTextEntry?: boolean;
      returnKeyType?: 'next' | 'done';
      onSubmitEditing?: () => void;
      optional?: boolean;
    } = {}
  ) => (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <Text className="text-gray-700 font-semibold">{label}</Text>
        {options.optional && <Text className="text-gray-400 text-sm ml-2">(Optional)</Text>}
      </View>
      <View 
        className="flex-row items-center rounded-2xl px-4 py-3"
        style={{ 
          backgroundColor: '#F9FAFB',
          borderWidth: options.error ? 2 : 1,
          borderColor: options.error ? '#EF4444' : '#E5E7EB',
        }}
      >
        <View 
          className="w-9 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: '#F0FDF4' }}
        >
          <Ionicons name={icon as any} size={18} color="#16A34A" />
        </View>
        <TextInput
          ref={options.ref}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={options.autoCapitalize || 'none'}
          autoCorrect={false}
          secureTextEntry={options.secureTextEntry && !showPassword}
          returnKeyType={options.returnKeyType || 'next'}
          onSubmitEditing={options.onSubmitEditing}
          className="flex-1 ml-3 text-gray-900 text-base"
        />
        {options.secureTextEntry && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            className="p-2"
          >
            <Ionicons 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>
        )}
      </View>
      {options.error && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text className="text-red-500 text-sm ml-1">{options.error}</Text>
        </View>
      )}
    </View>
  );

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
          <View className="flex-1 px-6 pt-8 pb-6">
            {/* Header */}
            <View className="items-center mb-8">
              <View 
                className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
                style={{ 
                  backgroundColor: '#16A34A',
                  shadowColor: '#16A34A',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 6,
                }}
              >
                <Ionicons name="person-add" size={40} color="#FFFFFF" />
              </View>
              <Text className="text-2xl font-bold text-gray-900">Create Account</Text>
              <Text className="text-gray-500 mt-1">Join Redressal Portal</Text>
            </View>

            {/* Form */}
            {/* Role Selection - GovTech Feature */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Text className="text-gray-700 font-semibold">I am a</Text>
                <Text className="text-red-500 ml-1">*</Text>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setSelectedRole('citizen')}
                  className="flex-1 px-4 py-4 rounded-2xl flex-row items-center justify-center"
                  style={{ 
                    backgroundColor: selectedRole === 'citizen' ? '#16A34A' : '#F3F4F6',
                    borderWidth: 2,
                    borderColor: selectedRole === 'citizen' ? '#16A34A' : 'transparent',
                  }}
                >
                  <Ionicons 
                    name={selectedRole === 'citizen' ? "checkmark-circle" : "person"} 
                    size={20} 
                    color={selectedRole === 'citizen' ? '#FFFFFF' : '#16A34A'} 
                  />
                  <Text 
                    className="font-bold text-base ml-2" 
                    style={{ color: selectedRole === 'citizen' ? '#FFFFFF' : '#374151' }}
                  >
                    Citizen
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setSelectedRole('officer')}
                  className="flex-1 px-4 py-4 rounded-2xl flex-row items-center justify-center"
                  style={{ 
                    backgroundColor: selectedRole === 'officer' ? '#1E40AF' : '#F3F4F6',
                    borderWidth: 2,
                    borderColor: selectedRole === 'officer' ? '#1E40AF' : 'transparent',
                  }}
                >
                  <Ionicons 
                    name={selectedRole === 'officer' ? "checkmark-circle" : "shield"} 
                    size={20} 
                    color={selectedRole === 'officer' ? '#FFFFFF' : '#1E40AF'} 
                  />
                  <Text 
                    className="font-bold text-base ml-2" 
                    style={{ color: selectedRole === 'officer' ? '#FFFFFF' : '#374151' }}
                  >
                    Officer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {renderInput('Full Name', name, setName, 'person', 'Enter your full name', {
              autoCapitalize: 'words',
              error: errors.name,
              onSubmitEditing: () => emailRef.current?.focus(),
            })}

            {renderInput('Email', email, setEmail, 'mail', 'Enter your email', {
              ref: emailRef,
              keyboardType: 'email-address',
              error: errors.email,
              onSubmitEditing: () => phoneRef.current?.focus(),
            })}

            {renderInput('Phone', phone, setPhone, 'call', 'Enter your phone number', {
              ref: phoneRef,
              keyboardType: 'phone-pad',
              optional: true,
              onSubmitEditing: () => passwordRef.current?.focus(),
            })}

            {renderInput('Password', password, setPassword, 'lock-closed', 'Create a password', {
              ref: passwordRef,
              secureTextEntry: true,
              error: errors.password,
              onSubmitEditing: () => confirmPasswordRef.current?.focus(),
            })}

            {renderInput('Confirm Password', confirmPassword, setConfirmPassword, 'lock-closed', 'Confirm your password', {
              ref: confirmPasswordRef,
              secureTextEntry: true,
              error: errors.confirmPassword,
              returnKeyType: 'done',
              onSubmitEditing: handleRegister,
            })}

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className="py-4 rounded-2xl items-center flex-row justify-center mt-4"
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
                <Text className="text-white font-bold text-lg">Creating Account...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  <Text className="text-white font-bold text-lg ml-2">Create Account</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500 text-base">Already have an account? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text className="font-bold text-base" style={{ color: '#16A34A' }}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Info Box - GovTech */}
            <View 
              className="mt-6 rounded-2xl p-4"
              style={{ backgroundColor: selectedRole === 'citizen' ? '#F0FDF4' : '#EFF6FF' }}
            >
              <View className="flex-row items-start">
                <View 
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: selectedRole === 'citizen' ? '#D1FAE5' : '#DBEAFE' }}
                >
                  <Ionicons 
                    name={selectedRole === 'citizen' ? "people" : "shield-checkmark"} 
                    size={20} 
                    color={selectedRole === 'citizen' ? '#16A34A' : '#1E40AF'} 
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-bold text-gray-800 mb-1">
                    {selectedRole === 'citizen' ? '🏛️ GovTech CRM - Citizen' : '🏛️ GovTech CRM - Officer'}
                  </Text>
                  <Text className="text-gray-600 text-sm leading-5">
                    {selectedRole === 'citizen' 
                      ? 'Submit complaints in your language. Track status in real-time. Government departments will resolve your issues.'
                      : 'Manage citizen complaints. Update status. Resolve issues efficiently. Serve your community better.'}
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

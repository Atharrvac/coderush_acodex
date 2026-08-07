/**
 * Connection Screen - OLX-style Contact Exchange
 * Shows after "I Can Help" is clicked - connects helper and poster
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Problem, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chat.service';

interface ConnectionScreenProps {
  visible: boolean;
  onClose: () => void;
  problem: Problem;
  otherUser: User; // The person you're connecting with (poster or helper)
  role: 'helper' | 'poster'; // Your role in this connection
  onMarkSolved?: () => void;
}

export const ConnectionScreen: React.FC<ConnectionScreenProps> = ({
  visible,
  onClose,
  problem,
  otherUser,
  role,
  onMarkSolved,
}) => {
  const { user } = useAuth();
  const [timeElapsed, setTimeElapsed] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  // Safety check - don't render if otherUser is not available
  if (!otherUser) {
    return null;
  }

  useEffect(() => {
    if (!visible) return;

    const updateTime = () => {
      const now = new Date();
      const start = new Date(problem.updated_at || problem.created_at);
      const diffMs = now.getTime() - start.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMins < 1) {
        setTimeElapsed('Just now');
      } else if (diffMins < 60) {
        setTimeElapsed(`${diffMins} min ago`);
      } else {
        setTimeElapsed(`${diffHours} hour${diffHours > 1 ? 's' : ''} ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, [visible, problem]);

  useEffect(() => {
    if (visible && problem.id) {
      loadOrCreateSession();
    }
  }, [visible, problem.id]);

  const loadOrCreateSession = async () => {
    try {
      setLoadingSession(true);
      // Try to get existing session
      const existingSession = await chatService.getSessionByProblem(problem.id);
      
      if (existingSession) {
        setSessionId(existingSession.id);
      } else if (user?.id && problem.helper_id && problem.user_id) {
        // Create new session
        const newSessionId = await chatService.createSession(
          problem.id,
          problem.helper_id,
          problem.user_id
        );
        setSessionId(newSessionId);
      }
    } catch (error) {
      console.error('Load/create session error:', error);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleCall = () => {
    if (!otherUser.phone) {
      Alert.alert('No Phone Number', 'This user has not provided a phone number');
      return;
    }

    Alert.alert(
      'Call User',
      `Call ${otherUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${otherUser.phone}`),
        },
      ]
    );
  };

  const handleChat = () => {
    if (!sessionId) {
      Alert.alert('Loading', 'Please wait while we set up the chat...');
      return;
    }

    // Open in-app chat
    onClose(); // Close connection screen
    router.push(`/chat?sessionId=${sessionId}`);
  };

  const handleGetDirections = () => {
    const url = `https://maps.google.com/?q=${problem.latitude},${problem.longitude}`;
    Linking.openURL(url);
  };

  const handleShareLocation = () => {
    Alert.alert(
      'Share Location',
      'Share your current location with the other person?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: () => {
            // TODO: Get current location and share via SMS/WhatsApp
            Alert.alert('Coming Soon', 'Location sharing will be available soon');
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View
          className="bg-white px-5 py-4 flex-row items-center justify-between"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <Ionicons name="close" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Connection</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Success Banner */}
          <View
            className="mx-4 mt-4 rounded-2xl p-5"
            style={{ backgroundColor: '#ECFDF5' }}
          >
            <View className="items-center mb-3">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: '#D1FAE5' }}
              >
                <Ionicons name="checkmark-circle" size={36} color="#059669" />
              </View>
              <Text className="text-xl font-bold text-center mb-1" style={{ color: '#059669' }}>
                {role === 'helper' ? 'You\'re Helping!' : 'Help is on the way!'}
              </Text>
              <Text className="text-center text-gray-600">
                {role === 'helper' 
                  ? 'Contact the person below to coordinate'
                  : 'Your helper will contact you soon'}
              </Text>
            </View>
            <View className="flex-row items-center justify-center">
              <Ionicons name="time-outline" size={16} color="#059669" />
              <Text className="ml-2 font-medium" style={{ color: '#059669' }}>
                Connected {timeElapsed}
              </Text>
            </View>
          </View>

          {/* Contact Card - OLX Style */}
          <View className="mx-4 mt-4">
            <Text className="text-gray-500 text-sm mb-3 font-medium">
              {role === 'helper' ? 'PROBLEM POSTED BY' : 'YOUR HELPER'}
            </Text>
            <View
              className="bg-white rounded-2xl p-5"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              {/* User Info */}
              <View className="flex-row items-center mb-4">
                <Image
                  source={{
                    uri: otherUser.avatar_url || 
                      `https://ui-avatars.com/api/?name=${otherUser.name}&background=16A34A&color=fff`,
                  }}
                  className="w-16 h-16 rounded-2xl"
                  style={{ borderWidth: 2, borderColor: '#F0FDF4' }}
                />
                <View className="flex-1 ml-4">
                  <Text className="text-xl font-bold text-gray-900 mb-1">
                    {otherUser.name}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text className="text-gray-600 text-sm ml-1">
                      {otherUser.problems_solved || 0} problems solved
                    </Text>
                  </View>
                </View>
              </View>

              {/* Contact Buttons */}
              <View className="flex-row mb-4">
                <TouchableOpacity
                  onPress={handleCall}
                  className="flex-1 py-4 rounded-xl flex-row items-center justify-center mr-2"
                  style={{ backgroundColor: '#16A34A' }}
                >
                  <Ionicons name="call" size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold ml-2">Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleChat}
                  disabled={loadingSession}
                  className="flex-1 py-4 rounded-xl flex-row items-center justify-center ml-2"
                  style={{ backgroundColor: loadingSession ? '#D1D5DB' : '#059669' }}
                >
                  {loadingSession ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
                      <Text className="text-white font-bold ml-2">Chat</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Phone Number */}
              {otherUser.phone && (
                <View
                  className="p-3 rounded-xl flex-row items-center"
                  style={{ backgroundColor: '#F9FAFB' }}
                >
                  <Ionicons name="call-outline" size={18} color="#6B7280" />
                  <Text className="text-gray-700 font-medium ml-2">
                    {otherUser.phone}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Problem Details */}
          <View className="mx-4 mt-4">
            <Text className="text-gray-500 text-sm mb-3 font-medium">PROBLEM DETAILS</Text>
            <View
              className="bg-white rounded-2xl p-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="text-lg font-bold text-gray-900 mb-2">
                {problem.title}
              </Text>
              <Text className="text-gray-600 mb-3 leading-5">
                {problem.description}
              </Text>
              
              {/* Location */}
              <TouchableOpacity
                onPress={handleGetDirections}
                className="flex-row items-center p-3 rounded-xl"
                style={{ backgroundColor: '#F0FDF4' }}
              >
                <Ionicons name="location" size={20} color="#16A34A" />
                <Text className="flex-1 text-gray-900 font-medium ml-2" numberOfLines={1}>
                  {problem.address}
                </Text>
                <Ionicons name="navigate" size={18} color="#16A34A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mx-4 mt-4 mb-6">
            <Text className="text-gray-500 text-sm mb-3 font-medium">QUICK ACTIONS</Text>
            <View className="flex-row">
              <TouchableOpacity
                onPress={handleGetDirections}
                className="flex-1 bg-white rounded-xl p-4 items-center mr-2"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: '#DBEAFE' }}
                >
                  <Ionicons name="navigate" size={24} color="#2563EB" />
                </View>
                <Text className="text-gray-900 font-semibold text-sm">Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShareLocation}
                className="flex-1 bg-white rounded-xl p-4 items-center ml-2"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <Ionicons name="share-outline" size={24} color="#D97706" />
                </View>
                <Text className="text-gray-900 font-semibold text-sm">Share Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View
          className="px-5 pb-6 pt-4 bg-white"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          {onMarkSolved && (
            <TouchableOpacity
              onPress={onMarkSolved}
              className="py-4 rounded-2xl flex-row items-center justify-center"
              style={{
                backgroundColor: '#059669',
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text className="text-white font-bold text-lg ml-2">Mark as Solved</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ConnectionScreen;

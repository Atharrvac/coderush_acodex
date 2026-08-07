/**
 * Help Request Modal - Uber/Swiggy Style Request
 * Shows when a helper receives a help request notification
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Problem } from '../types';
import { PROBLEM_CATEGORIES } from '../constants/categories';

interface HelpRequestModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  problem: Problem;
  distance: number;
  matchScore: number;
  points: number;
  loading?: boolean;
}

export const HelpRequestModal: React.FC<HelpRequestModalProps> = ({
  visible,
  onAccept,
  onDecline,
  problem,
  distance,
  matchScore,
  points,
  loading = false,
}) => {
  const [countdown, setCountdown] = useState(30);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!visible) {
      setCountdown(30);
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline(); // Auto-decline on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      clearInterval(timer);
      pulse.stop();
    };
  }, [visible]);

  const category = PROBLEM_CATEGORIES.find((c) => c.id === problem.category) || PROBLEM_CATEGORIES[7];

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return { bg: '#FEE2E2', text: '#DC2626', icon: '#EF4444' };
      case 'high': return { bg: '#FED7AA', text: '#C2410C', icon: '#F97316' };
      case 'medium': return { bg: '#FEF3C7', text: '#D97706', icon: '#F59E0B' };
      default: return { bg: '#DBEAFE', text: '#2563EB', icon: '#3B82F6' };
    }
  };

  const urgencyColors = getUrgencyColor(problem.urgency);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDecline}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View className="bg-white rounded-t-3xl">
          {/* Countdown Header */}
          <View
            className="items-center py-4"
            style={{ backgroundColor: countdown <= 10 ? '#FEE2E2' : '#DBEAFE' }}
          >
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: countdown <= 10 ? '#DC2626' : '#2563EB' }}
              >
                <Text className="text-white text-2xl font-bold">{countdown}</Text>
              </View>
            </Animated.View>
            <Text className="text-gray-600 font-medium mt-2">
              {countdown <= 10 ? 'Hurry! Time running out' : 'Respond quickly'}
            </Text>
          </View>

          <View className="p-5">
            {/* Title */}
            <View className="items-center mb-4">
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                🤝 Help Request
              </Text>
              <Text className="text-gray-500 text-center">
                Someone needs your help nearby
              </Text>
            </View>

            {/* Match Score */}
            <View
              className="rounded-2xl p-4 mb-4 flex-row items-center justify-between"
              style={{ backgroundColor: '#F0FDF4' }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#D1FAE5' }}
                >
                  <Ionicons name="star" size={24} color="#16A34A" />
                </View>
                <View className="ml-3">
                  <Text className="text-gray-500 text-sm">Match Score</Text>
                  <Text className="text-2xl font-bold" style={{ color: '#16A34A' }}>
                    {Math.round(matchScore)}%
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-gray-500 text-sm">You'll earn</Text>
                <View className="flex-row items-center">
                  <Ionicons name="trophy" size={18} color="#F59E0B" />
                  <Text className="text-xl font-bold text-gray-900 ml-1">
                    +{points}
                  </Text>
                </View>
              </View>
            </View>

            {/* Problem Info */}
            <View
              className="bg-white rounded-2xl p-4 mb-4"
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              {/* Category & Urgency */}
              <View className="flex-row items-center justify-between mb-3">
                <View
                  className="flex-row items-center px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#F3F4F6' }}
                >
                  <Text className="text-base mr-1.5">{category.emoji}</Text>
                  <Text className="text-sm font-semibold text-gray-600">{category.name}</Text>
                </View>
                {problem.urgency && (
                  <View
                    className="px-3 py-1.5 rounded-full flex-row items-center"
                    style={{ backgroundColor: urgencyColors.bg }}
                  >
                    <Ionicons name="alert-circle" size={14} color={urgencyColors.icon} />
                    <Text
                      className="text-xs font-bold ml-1 uppercase"
                      style={{ color: urgencyColors.text }}
                    >
                      {problem.urgency}
                    </Text>
                  </View>
                )}
              </View>

              {/* Title */}
              <Text className="text-lg font-bold text-gray-900 mb-2">
                {problem.title}
              </Text>

              {/* Description */}
              <Text className="text-gray-600 mb-3" numberOfLines={2}>
                {problem.description}
              </Text>

              {/* Stats */}
              <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="location" size={16} color="#16A34A" />
                  <Text className="text-gray-700 font-semibold ml-1">
                    {distance.toFixed(1)} km away
                  </Text>
                </View>
                {problem.affected_people && problem.affected_people > 0 && (
                  <View className="flex-row items-center">
                    <Ionicons name="people" size={16} color="#6B7280" />
                    <Text className="text-gray-600 ml-1">
                      {problem.affected_people}+ affected
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Posted By */}
            <View
              className="rounded-xl p-3 mb-4 flex-row items-center"
              style={{ backgroundColor: '#F9FAFB' }}
            >
              <Image
                source={{
                  uri: problem.user?.avatar_url || 
                    `https://ui-avatars.com/api/?name=${problem.user?.name || 'User'}&background=16A34A&color=fff`,
                }}
                className="w-10 h-10 rounded-xl"
              />
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-semibold">
                  {problem.user?.name || 'Anonymous'}
                </Text>
                <Text className="text-gray-500 text-xs">
                  {problem.user?.problems_posted || 0} problems posted
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row">
              <TouchableOpacity
                onPress={onDecline}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl items-center mr-2"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <Text className="text-gray-700 font-bold text-base">Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onAccept}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl flex-row items-center justify-center ml-2"
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
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                    <Text className="text-white font-bold text-base ml-2">Accept</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default HelpRequestModal;

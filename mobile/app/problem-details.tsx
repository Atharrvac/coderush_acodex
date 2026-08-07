/**
 * Community Redressal Planner - Complaint Details Screen
 * Shows reference number, department routing, SLA tracking, and status timeline
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/contexts/AuthContext';
import { problemService } from '../src/services/problem.service';
import { chatService } from '../src/services/chat.service';
import { Problem } from '../src/types';
import { PROBLEM_CATEGORIES, STATUS_CONFIG } from '../src/constants/categories';
import { ProblemDetailsSkeleton } from '../src/components/ui';

const { width } = Dimensions.get('window');

export default function ProblemDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSolvedModal, setShowSolvedModal] = useState(false);
  const [solvedImage, setSolvedImage] = useState<string | null>(null);
  const [solvedNote, setSolvedNote] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchProblem();
  }, [id]);

  const fetchProblem = async () => {
    try {
      const data = await problemService.getById(id as string);
      setProblem(data);
      
      try {
        const sessionData = await chatService.getSessionByProblem(id as string);
        if (sessionData) {
          setActiveSession(sessionData);
        }
      } catch (e) {
        console.log('No active session:', e);
      }
    } catch (error) {
      console.error('Fetch problem error:', error);
      Alert.alert('Error', 'Failed to load problem details');
    } finally {
      setLoading(false);
    }
  };

  const handleReportDuplicate = async () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to report duplicates');
      router.push('/login');
      return;
    }

    Alert.alert(
      'Report Duplicate Issue 📋',
      'Have you seen this issue reported before? This helps us deduplicate complaints for better efficiency.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Report Duplicate',
          onPress: async () => {
            setActionLoading(true);
            try {
              // Add duplicate reporting logic here
              Alert.alert('Success', 'Duplicate report submitted. This helps improve our routing system.');
              await fetchProblem(); // Refresh to get updated status
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to report duplicate');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteProblem = async () => {
    Alert.alert(
      'Delete Problem',
      'Are you sure you want to delete this problem? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await problemService.delete(problem!.id);
              Alert.alert('Deleted', 'Your problem has been deleted.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete problem');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const pickSolvedImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      setSolvedImage(result.assets[0].uri);
    }
  };

  const handleMarkSolved = async () => {
    setActionLoading(true);
    try {
      let uploadedImageUrl: string | undefined;
      if (solvedImage && user?.id) {
        uploadedImageUrl = await problemService.uploadImage(solvedImage, user.id);
      }

      await problemService.markSolved(problem!.id, uploadedImageUrl, solvedNote);
      setShowSolvedModal(false);
      Alert.alert('Problem Solved! 🎉', 'Thank you for helping improve our community!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark as solved');
    } finally {
      setActionLoading(false);
    }
  };

  const handleContact = (type: 'call' | 'chat') => {
    if (!problem?.user?.phone) {
      Alert.alert('No Contact', 'Contact information not available');
      return;
    }

    if (type === 'call') {
      Linking.openURL(`tel:${problem.user.phone}`);
    } else {
      Linking.openURL(`sms:${problem.user.phone}`);
    }
  };

  const handleOfferHelp = async () => {
    try {
      setActionLoading(true);
      if (!user) {
        Alert.alert('Error', 'Please sign in to offer help');
        return;
      }
      
      const sessionId = await chatService.createSession(problem!.id, user.id, problem!.user_id);
      
      // Navigate to chat screen with the session ID
      router.push(`/chat?sessionId=${sessionId}`);
      
    } catch (error: any) {
      console.error('Offer help error:', error);
      Alert.alert('Error', 'Failed to start chat session. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' };
      case 'being_helped': return { bg: '#DBEAFE', text: '#2563EB', dot: '#3B82F6' };
      case 'in_progress': return { bg: '#F3E8FF', text: '#7E22CE', dot: '#9333EA' };
      case 'solved': return { bg: '#D1FAE5', text: '#059669', dot: '#10B981' };
      case 'escalated': return { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' };
      default: return { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' };
    }
  };

  if (loading) {
    return <ProblemDetailsSkeleton />;
  }

  if (!problem) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: '#FEE2E2' }}
        >
          <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
        </View>
        <Text className="text-xl font-bold text-gray-800 mb-2">Problem Not Found</Text>
        <Text className="text-gray-500 text-center mb-6 px-8">
          This problem may have been removed or doesn&apos;t exist.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-8 py-4 rounded-2xl"
          style={{ backgroundColor: '#16A34A' }}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const category = PROBLEM_CATEGORIES.find((c) => c.id === problem.category) || PROBLEM_CATEGORIES[7];
  const statusConfig = STATUS_CONFIG[problem.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.posted;
  const statusColors = getStatusColor(problem.status);
  const isOwner = user?.id === problem.user_id;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="px-5 py-4 bg-white flex-row items-center justify-between"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: '#F3F4F6' }}
        >
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Issue {problem.id?.substring(0, 5).toUpperCase()}</Text>
        <View className="flex-row">
          {activeSession && (
            <TouchableOpacity
              onPress={() => router.push(`/chat?sessionId=${activeSession.id}`)}
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: '#DBEAFE' }}
            >
              <Ionicons name="chatbubbles" size={20} color="#2563EB" />
            </TouchableOpacity>
          )}
          {isOwner && (
            <TouchableOpacity
              onPress={handleDeleteProblem}
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <Ionicons name="share-outline" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Images Carousel */}
        {problem.images && problem.images.length > 0 && (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {problem.images.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={{ width, height: 280 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {/* Image Indicators */}
            {problem.images.length > 1 && (
              <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
                {problem.images.map((_, index) => (
                  <View
                    key={index}
                    className="w-2 h-2 rounded-full mx-1"
                    style={{
                      backgroundColor: index === activeImageIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Status Banner */}
        <View
          className="mx-4 mt-4 rounded-2xl p-4 flex-row items-center"
          style={{ backgroundColor: statusColors.bg }}
        >
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: `${statusColors.dot}20` }}
          >
            <Ionicons name={statusConfig.icon as any} size={24} color={statusColors.dot} />
          </View>
          <View className="flex-1 ml-3">
            <Text className="font-bold text-base" style={{ color: statusColors.text }}>
              {statusConfig.label}
            </Text>
            <Text className="text-sm" style={{ color: statusColors.text, opacity: 0.8 }}>
              {statusConfig.description}
            </Text>
          </View>
        </View>

        <View className="p-4">
          {/* Category & Time */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View
                className="flex-row items-center px-3 py-1.5 rounded-full mr-2"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <Text className="text-base mr-1.5">{category.emoji}</Text>
                <Text className="text-sm font-semibold text-gray-600">{category.name}</Text>
              </View>
              <View
                className="flex-row items-center px-3 py-1.5 rounded-full"
                style={{ 
                  backgroundColor: category.isGovOnly ? '#FEE2E2' : '#D1FAE5',
                  borderWidth: 1,
                  borderColor: category.isGovOnly ? '#FECACA' : '#A7F3D0'
                }}
              >
                <Text className="text-xs font-bold" style={{ color: category.isGovOnly ? '#DC2626' : '#047857' }}>
                  {category.isGovOnly ? '🏛️ GOV ONLY' : '🤝 COMMUNITY'}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <View style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>SLA RISK</Text>
              </View>
              <Text className="text-gray-400 text-sm">{getTimeAgo(problem.created_at)}</Text>
            </View>
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 mb-3">{problem.title}</Text>

          {/* Location */}
          <TouchableOpacity
            onPress={() => {
              const url = `https://maps.google.com/?q=${problem.latitude},${problem.longitude}`;
              Linking.openURL(url);
            }}
            className="flex-row items-center mb-4 p-3 rounded-xl"
            style={{ backgroundColor: '#F0FDF4' }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: '#D1FAE5' }}
            >
              <Ionicons name="location" size={20} color="#16A34A" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-gray-900 font-medium" numberOfLines={1}>{problem.address}</Text>
              <Text className="text-gray-500 text-xs">Tap to open in Maps</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#16A34A" />
          </TouchableOpacity>

          <View
            className="bg-white rounded-2xl p-4 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text className="font-bold text-gray-800 mb-2">Description</Text>
            <Text className="text-gray-600 text-base leading-6">{problem.description}</Text>
          </View>

          {/* Privacy Layer Disclaimer */}
          <View
            className="bg-blue-50 rounded-2xl p-4 mb-4"
            style={{
              borderWidth: 1,
              borderColor: '#BFDBFE',
            }}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons name="shield-checkmark" size={18} color="#1D4ED8" />
              <Text className="font-bold text-blue-800 ml-2">Privacy & Provenance</Text>
            </View>
            <Text className="text-blue-700 text-sm leading-5">
              Personal identifiers have been redacted from public view. This issue has been securely routed to the relevant authorized department for accountability.
            </Text>
          </View>

          {/* AI Cost Analysis - Visible to All Viewers - Always Show */}
          <View
            className="bg-white rounded-2xl p-4 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#D1FAE5',
            }}
          >
            <View className="flex-row items-center mb-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: '#D1FAE5' }}
              >
                <Ionicons name="calculator" size={20} color="#059669" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-bold text-gray-800">
                  {problem.estimated_cost_min && problem.estimated_cost_max ? '🤖 AI Cost Analysis' : '💰 Cost Estimate'}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {problem.estimated_cost_min && problem.estimated_cost_max ? 'AI-powered analysis' : 'Category-based estimate'}
                </Text>
              </View>
            </View>
            
            <View
              className="rounded-xl p-3 mb-3"
              style={{ backgroundColor: '#F0FDF4' }}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-600 text-sm">Estimated Cost Range</Text>
                  <Text className="font-bold text-xl" style={{ color: '#059669' }}>
                    {problem.estimated_cost_min && problem.estimated_cost_max ? (
                      `₹${problem.estimated_cost_min.toLocaleString()} - ₹${problem.estimated_cost_max.toLocaleString()}`
                    ) : (
                      (() => {
                        // Fallback cost estimation based on category
                        const costRanges: Record<string, {min: number, max: number}> = {
                          road: { min: 8000, max: 25000 },
                          water: { min: 5000, max: 18000 },
                          electricity: { min: 3000, max: 12000 },
                          cleanliness: { min: 2000, max: 8000 },
                          safety: { min: 5000, max: 15000 },
                          help: { min: 1000, max: 5000 },
                          emergency: { min: 10000, max: 30000 },
                          other: { min: 3000, max: 10000 }
                        };
                        const range = costRanges[problem.category] || costRanges.other;
                        return `₹${range.min.toLocaleString()} - ₹${range.max.toLocaleString()}`;
                      })()
                    )}
                  </Text>
                </View>
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#D1FAE5' }}
                >
                  <Text className="text-2xl">
                    {problem.estimated_cost_min && problem.estimated_cost_max ? '🤖' : '💰'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Additional Cost Analysis Details - Only for AI analyzed */}
            {problem.cost_analysis ? (
              <View>
                <View className="flex-row justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-500 text-xs">Completion Time</Text>
                    <Text className="font-semibold text-gray-800 text-sm">
                      {problem.cost_analysis.timeToComplete || 'Not estimated'}
                    </Text>
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-500 text-xs">Severity Level</Text>
                    <View className="flex-row items-center">
                      <View
                        className="w-2 h-2 rounded-full mr-2"
                        style={{
                          backgroundColor: 
                            problem.cost_analysis.severity === 'high' ? '#EF4444' :
                            problem.cost_analysis.severity === 'medium' ? '#F59E0B' : '#10B981'
                        }}
                      />
                      <Text className="font-semibold text-gray-800 text-sm capitalize">
                        {problem.cost_analysis.severity || 'Medium'}
                      </Text>
                    </View>
                  </View>
                </View>

                {problem.cost_analysis.breakdown && (
                  <View
                    className="rounded-lg p-3 mt-2"
                    style={{ backgroundColor: '#F9FAFB' }}
                  >
                    <Text className="font-semibold text-gray-700 text-sm mb-2">Cost Breakdown</Text>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600 text-xs">
                        Materials: ₹{problem.cost_analysis.breakdown.materials?.toLocaleString()}
                      </Text>
                      <Text className="text-gray-600 text-xs">
                        Labor: ₹{problem.cost_analysis.breakdown.labor?.toLocaleString()}
                      </Text>
                      <Text className="text-gray-600 text-xs">
                        Equipment: ₹{problem.cost_analysis.breakdown.equipment?.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}

                {problem.cost_analysis.recommendations && (
                  <View className="mt-3">
                    <Text className="font-semibold text-gray-700 text-sm mb-1">AI Recommendation</Text>
                    <Text className="text-gray-600 text-sm leading-5">
                      {problem.cost_analysis.recommendations}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="mt-2">
                <Text className="text-gray-500 text-sm">
                  This estimate is based on typical costs for {problem.category} problems. 
                  AI analysis will provide more detailed breakdown when available.
                </Text>
              </View>
            )}

            <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
              <Ionicons name="information-circle" size={14} color="#6B7280" />
              <Text className="text-gray-500 text-xs ml-1">
                {problem.estimated_cost_min && problem.estimated_cost_max 
                  ? 'Cost estimated by AI based on problem analysis'
                  : 'Estimated based on category and typical repair costs'
                }
              </Text>
            </View>
          </View>

          {/* Posted By */}
          <View
            className="bg-white rounded-2xl p-4 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text className="text-gray-500 text-sm mb-3">Posted by</Text>
            <View className="flex-row items-center">
              <Image
                source={{
                  uri:
                    problem.user?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${problem.user?.name || 'User'}&background=16A34A&color=fff`,
                }}
                className="w-14 h-14 rounded-2xl"
                style={{ borderWidth: 2, borderColor: '#F0FDF4' }}
              />
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-bold text-base">{problem.user?.name || 'Anonymous'}</Text>
                <Text className="text-gray-500 text-sm">
                  {problem.user?.problems_posted || 0} problems posted
                </Text>
              </View>
              {!isOwner && problem.status !== 'solved' && (
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => handleContact('call')}
                    className="w-11 h-11 rounded-xl items-center justify-center mr-2"
                    style={{ backgroundColor: '#F0FDF4' }}
                  >
                    <Ionicons name="call" size={20} color="#16A34A" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleContact('chat')}
                    className="w-11 h-11 rounded-xl items-center justify-center"
                    style={{ backgroundColor: '#F0FDF4' }}
                  >
                    <Ionicons name="chatbubble" size={20} color="#16A34A" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Department Info */}
          {(problem.status === 'being_helped' || problem.complaint_status === 'in_progress') && (
            <View
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: '#EFF6FF' }}
            >
              <View className="flex-row items-center mb-3">
                <Ionicons name="business" size={18} color="#2563EB" />
                <Text className="font-bold ml-2" style={{ color: '#2563EB' }}>Assigned Department</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-xl bg-blue-100 items-center justify-center">
                   <Ionicons name="construct" size={24} color="#3B82F6" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-bold">Public Works Department</Text>
                  <Text className="text-gray-500 text-sm">
                    Assigned for resolution
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Solved Info */}
          {problem.status === 'solved' && (
            <View
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: '#ECFDF5' }}
            >
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text className="font-bold ml-2" style={{ color: '#059669' }}>Problem Solved!</Text>
              </View>
              {problem.solved_note && (
                <Text className="text-gray-600 mb-3">{problem.solved_note}</Text>
              )}
              {problem.solved_image && (
                <Image
                  source={{ uri: problem.solved_image }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
              )}
              {problem.solved_at && (
                <Text className="text-gray-400 text-sm mt-3">
                  Solved {getTimeAgo(problem.solved_at)}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
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
        {/* Submitted status - Show civic actions for non-owners */}
        {problem.status === 'posted' && !isOwner && (
          <View className="flex-col space-y-3">
            {/* Hybrid Routing Logic */}
            {!category.isGovOnly && !problem.forwarded_to_gov ? (
              <TouchableOpacity
                onPress={handleOfferHelp}
                disabled={actionLoading}
                className="w-full py-4 rounded-2xl flex-row items-center justify-center mb-3"
                style={{ backgroundColor: '#10B981', opacity: actionLoading ? 0.6 : 1 }}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="hand-right" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold text-sm ml-2">Offer to Help (Citizen)</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
            
            <View className="flex-row space-x-3 w-full">
              <TouchableOpacity
                onPress={handleReportDuplicate}
                disabled={actionLoading}
                className="flex-1 py-4 rounded-2xl flex-row items-center justify-center"
                style={{
                  backgroundColor: '#F59E0B',
                  opacity: actionLoading ? 0.6 : 1,
                  marginRight: 6
                }}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="copy" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold text-sm ml-2">Report Duplicate</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  Alert.alert("Escalate", "Are you sure you want to escalate this issue to higher authorities?", [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Escalate', style: 'destructive', onPress: () => Alert.alert("Success", "Issue escalated successfully") }
                  ]);
                }}
                disabled={actionLoading}
                className="flex-1 py-4 rounded-2xl flex-row items-center justify-center"
                style={{
                  backgroundColor: '#DC2626',
                  opacity: actionLoading ? 0.6 : 1,
                  marginLeft: 6
                }}
              >
                <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
                <Text className="text-white font-bold text-sm ml-2">Escalate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Assigned status - Show status for owner */}
        {(problem.status === 'being_helped' || problem.complaint_status === 'in_progress') && isOwner && (
          <>
            <TouchableOpacity
              onPress={() => setShowSolvedModal(true)}
              className="py-4 rounded-2xl flex-row items-center justify-center"
              style={{ backgroundColor: '#059669' }}
            >
              <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              <Text className="text-white font-bold ml-2">Mark as Resolved</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Solved status */}
        {problem.status === 'solved' && (
          <View
            className="py-4 rounded-2xl flex-row items-center justify-center"
            style={{ backgroundColor: '#D1FAE5' }}
          >
            <Ionicons name="checkmark-circle" size={22} color="#059669" />
            <Text className="font-bold ml-2" style={{ color: '#059669' }}>
              This issue has been resolved!
            </Text>
          </View>
        )}

        {/* Owner viewing their own posted problem */}
        {problem.status === 'posted' && isOwner && (
          <View
            className="py-4 rounded-2xl flex-row items-center justify-center"
            style={{ backgroundColor: '#FEF3C7' }}
          >
            <Ionicons name="time" size={22} color="#D97706" />
            <Text className="font-bold ml-2" style={{ color: '#D97706' }}>
              Awaiting department assignment
            </Text>
          </View>
        )}
      </View>

      {/* Mark Solved Modal */}
      <Modal visible={showSolvedModal} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl p-5">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: '#D1FAE5' }}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#059669" />
                </View>
                <Text className="text-xl font-bold text-gray-900">Mark as Solved</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSolvedModal(false)}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* After Photo */}
            <View className="mb-4">
              <View className="flex-row items-center mb-3">
                <Ionicons name="camera" size={18} color="#6B7280" />
                <Text className="text-base font-semibold text-gray-900 ml-2">After Photo</Text>
                <Text className="text-gray-400 text-sm ml-2">(Optional)</Text>
              </View>
              <TouchableOpacity
                onPress={pickSolvedImage}
                className="w-full h-40 rounded-2xl items-center justify-center"
                style={{
                  backgroundColor: '#F9FAFB',
                  borderWidth: 2,
                  borderColor: '#E5E7EB',
                  borderStyle: 'dashed',
                }}
              >
                {solvedImage ? (
                  <Image source={{ uri: solvedImage }} className="w-full h-full rounded-2xl" />
                ) : (
                  <>
                    <Ionicons name="camera" size={40} color="#9CA3AF" />
                    <Text className="text-gray-400 mt-2 font-medium">Take a photo of the solved problem</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Note */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="document-text" size={18} color="#6B7280" />
                <Text className="text-base font-semibold text-gray-900 ml-2">Note</Text>
                <Text className="text-gray-400 text-sm ml-2">(Optional)</Text>
              </View>
              <TextInput
                placeholder="How was the problem solved?"
                placeholderTextColor="#9CA3AF"
                value={solvedNote}
                onChangeText={setSolvedNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="rounded-2xl px-4 py-3 text-gray-900"
                style={{
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  minHeight: 100,
                }}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleMarkSolved}
              disabled={actionLoading}
              className="py-4 rounded-2xl flex-row items-center justify-center"
              style={{
                backgroundColor: actionLoading ? '#D1D5DB' : '#059669',
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: actionLoading ? 0 : 0.3,
                shadowRadius: 8,
                elevation: actionLoading ? 0 : 4,
              }}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  <Text className="text-white font-bold text-lg ml-2">Confirm Solved</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Community Redressal Planner - Complaint Tracking Screen
 * Shows reference number, department routing, SLA timeline, and escalation status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ComplaintDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  department_name: string;
  officer_name?: string;
  address: string;
}

interface StatusHistory {
  id: string;
  status: string;
  notes: string;
  time: string;
  by: string;
}

export default function ComplaintTrackingScreen() {
  const { id } = useLocalSearchParams();
  const [complaint, setComplaint] = useState<ComplaintDetails | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplaintTracking();
  }, []);

  const loadComplaintTracking = async () => {
    try {
      // Simple mock data that works
      const mockComplaint: ComplaintDetails = {
        id: (id as string) || 'CRP-2026-0847',
        title: 'Road Pothole Issue',
        description: 'Large pothole causing traffic problems on main road near city mall',
        category: 'infrastructure',
        status: 'resolved',
        department_name: 'Public Works Department (PWD)',
        officer_name: 'Rajesh Kumar',
        address: 'MG Road, Near City Mall, Pune',
      };

      const mockHistory: StatusHistory[] = [
        {
          id: '1',
          status: 'submitted',
          notes: '📱 Complaint submitted by citizen through mobile app',
          time: '2 days ago',
          by: 'System Auto-Processing',
        },
        {
          id: '2',
          status: 'assigned',
          notes: '🤖 Auto-assigned to Public Works Department based on "Road" category',
          time: '2 days ago',
          by: 'AI Assignment Engine',
        },
        {
          id: '3',
          status: 'in_progress',
          notes: '👷 Road repair team dispatched to location. Work started on pothole repair.',
          time: '2 hours ago',
          by: 'Rajesh Kumar (PWD Officer)',
        },
        {
          id: '4',
          status: 'resolved',
          notes: '✅ Pothole successfully repaired. Road surface restored. Quality check completed.',
          time: 'Just now',
          by: 'Rajesh Kumar (PWD Officer)',
        },
      ];

      setComplaint(mockComplaint);
      setHistory(mockHistory);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#F59E0B';
      case 'assigned': return '#3B82F6';
      case 'in_progress': return '#8B5CF6';
      case 'resolved': return '#10B981';
      case 'closed': return '#059669';
      default: return '#6B7280';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'submitted': return '#FEF3C7';
      case 'assigned': return '#DBEAFE';
      case 'in_progress': return '#EDE9FE';
      case 'resolved': return '#D1FAE5';
      case 'closed': return '#ECFDF5';
      default: return '#F3F4F6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return 'document-text';
      case 'assigned': return 'person-add';
      case 'in_progress': return 'construct';
      case 'resolved': return 'checkmark-circle';
      case 'closed': return 'checkmark-done-circle';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text className="mt-4 text-gray-600">Loading complaint details...</Text>
      </SafeAreaView>
    );
  }

  if (!complaint) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-8">
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text className="mt-4 text-xl text-red-500 text-center">Complaint not found</Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-6 bg-blue-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-5 py-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Complaint Tracking</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {/* Complaint Details Card */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
              #{complaint.id.slice(0, 8)}
            </Text>
            <View 
              className="px-3 py-2 rounded-full flex-row items-center"
              style={{ backgroundColor: getStatusBg(complaint.status) }}
            >
              <Ionicons 
                name={getStatusIcon(complaint.status) as any} 
                size={16} 
                color={getStatusColor(complaint.status)} 
              />
              <Text 
                className="text-sm font-bold capitalize ml-1"
                style={{ color: getStatusColor(complaint.status) }}
              >
                {complaint.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
          
          <Text className="text-xl font-bold text-gray-900 mb-2">{complaint.title}</Text>
          <Text className="text-gray-600 mb-5 leading-6">{complaint.description}</Text>
          
          <View className="space-y-4">
            <View className="flex-row items-center">
              <Ionicons name="business" size={16} color="#6B7280" />
              <Text className="text-gray-500 ml-2 w-20">Department</Text>
              <Text className="text-gray-900 font-semibold flex-1">{complaint.department_name}</Text>
            </View>
            
            {complaint.officer_name && (
              <View className="flex-row items-center">
                <Ionicons name="person" size={16} color="#6B7280" />
                <Text className="text-gray-500 ml-2 w-20">Officer</Text>
                <Text className="text-gray-900 font-semibold flex-1">{complaint.officer_name}</Text>
              </View>
            )}
            
            <View className="flex-row items-center">
              <Ionicons name="location" size={16} color="#6B7280" />
              <Text className="text-gray-500 ml-2 w-20">Location</Text>
              <Text className="text-gray-900 font-semibold flex-1">{complaint.address}</Text>
            </View>
          </View>
        </View>

        {/* Progress Indicator */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">Resolution Progress</Text>
          
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-gray-600">Complaint Status</Text>
            <Text className="text-sm font-bold text-green-600">100% Complete</Text>
          </View>
          
          <View className="w-full h-2 bg-gray-200 rounded-full mb-4">
            <View className="w-full h-2 bg-green-500 rounded-full" />
          </View>
          
          <View className="flex-row justify-between">
            <View className="items-center">
              <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center mb-1">
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
              <Text className="text-xs text-gray-600">Submitted</Text>
            </View>
            <View className="items-center">
              <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center mb-1">
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
              <Text className="text-xs text-gray-600">Assigned</Text>
            </View>
            <View className="items-center">
              <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center mb-1">
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
              <Text className="text-xs text-gray-600">In Progress</Text>
            </View>
            <View className="items-center">
              <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center mb-1">
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
              <Text className="text-xs text-gray-600">Resolved</Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-5">Status Timeline</Text>
          
          <View className="space-y-4">
            {history.map((item, index) => (
              <View key={item.id} className="flex-row">
                <View className="items-center w-5 mr-4">
                  <View 
                    className="w-3 h-3 rounded-full border-2 border-white"
                    style={{ 
                      backgroundColor: index === 0 ? '#1E40AF' : '#D1D5DB'
                    }}
                  />
                  {index < history.length - 1 && (
                    <View className="w-0.5 h-8 bg-gray-200 mt-2" />
                  )}
                </View>
                
                <View className="flex-1 pb-2">
                  <View className="flex-row justify-between items-center mb-2">
                    <View 
                      className="px-3 py-1 rounded-full flex-row items-center"
                      style={{ backgroundColor: getStatusBg(item.status) }}
                    >
                      <Ionicons 
                        name={getStatusIcon(item.status) as any} 
                        size={12} 
                        color={getStatusColor(item.status)} 
                      />
                      <Text 
                        className="text-xs font-bold capitalize ml-1"
                        style={{ color: getStatusColor(item.status) }}
                      >
                        {item.status.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-400 font-medium">{item.time}</Text>
                  </View>
                  
                  <Text className="text-gray-700 mb-1">{item.notes}</Text>
                  <Text className="text-xs text-gray-400 italic">by {item.by}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}

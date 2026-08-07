/**
 * Chat Screen - WhatsApp/Instagram Style Real-Time Chat
 * Professional mobile-optimized chat experience
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../src/contexts/AuthContext';
import { chatService, ChatMessage, HelpSession } from '../src/services/chat.service';
import { problemService } from '../src/services/problem.service';

export default function ChatScreen() {
  const { sessionId } = useLocalSearchParams();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [session, setSession] = useState<HelpSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const otherUser = session
    ? user?.id === session.helper_id
      ? session.poster
      : session.helper
    : null;

  const receiverId = session
    ? user?.id === session.helper_id
      ? session.poster_id
      : session.helper_id
    : '';

  useEffect(() => {
    if (sessionId) {
      loadSession();
      loadMessages();
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to new messages with better error handling
    const unsubscribeMessages = chatService.subscribeToMessages(
      sessionId as string,
      (newMessage) => {
        console.log('📨 New message received:', newMessage.id);
        
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(m => m.id === newMessage.id);
          if (exists) {
            console.log('Message already exists, skipping');
            return prev;
          }
          
          // Add new message
          console.log('Adding new message to state');
          return [...prev, newMessage];
        });
        
        // Mark as read if from other user
        if (newMessage.sender_id !== user?.id) {
          chatService.markAsRead(sessionId as string, user?.id || '');
        }
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    // Subscribe to session updates
    const unsubscribeSession = chatService.subscribeToSession(
      sessionId as string,
      (updatedSession) => {
        console.log('📊 Session updated:', updatedSession.status);
        setSession(updatedSession);
      }
    );

    return () => {
      console.log('🔌 Unsubscribing from chat');
      unsubscribeMessages();
      unsubscribeSession();
    };
  }, [sessionId, user?.id]);

  const loadSession = async () => {
    try {
      const data = await chatService.getSession(sessionId as string);
      setSession(data);
    } catch (error: any) {
      console.error('Load session error:', error);
      Alert.alert('Error', 'Failed to load chat session');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await chatService.getMessages(sessionId as string);
      console.log(`📥 Loaded ${data.length} messages`);
      setMessages(data);
      // Mark as read
      if (user?.id) {
        await chatService.markAsRead(sessionId as string, user.id);
      }
    } catch (error: any) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user?.id || !sessionId) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Create optimistic message to show immediately
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId as string,
      sender_id: user.id,
      receiver_id: receiverId,
      message_type: 'text',
      content: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: user,
    };

    // Add message immediately to UI (optimistic update)
    setMessages((prev) => [...prev, optimisticMessage]);
    
    // Scroll to bottom immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      await chatService.sendMessage(
        sessionId as string,
        user.id,
        receiverId,
        messageText
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to send message');
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== optimisticMessage.id));
      setInputText(messageText); // Restore text
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });

      if (!result.canceled && user?.id) {
        setSending(true);
        // Upload image
        const imageUrl = await problemService.uploadImage(result.assets[0].uri, user.id);
        // Send image message
        await chatService.sendImageMessage(
          sessionId as string,
          user.id,
          receiverId,
          imageUrl,
          'Sent an image'
        );
        setSending(false);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to send image');
      setSending(false);
    }
  };

  const handleSendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      setSending(true);
      const location = await Location.getCurrentPositionAsync({});
      
      if (user?.id) {
        await chatService.sendMessage(
          sessionId as string,
          user.id,
          receiverId,
          `📍 Location: ${location.coords.latitude}, ${location.coords.longitude}`
        );
      }
      setSending(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to send location');
      setSending(false);
    }
  };

  const handleCall = () => {
    if (!otherUser?.phone) {
      Alert.alert('No Phone Number', 'This user has not provided a phone number');
      return;
    }

    Linking.openURL(`tel:${otherUser.phone}`);
  };

  const handleViewProblem = () => {
    if (session?.problem_id) {
      router.push(`/problem-details?id=${session.problem_id}`);
    }
  };

  const handleMarkSolved = () => {
    if (session?.problem_id) {
      router.push(`/problem-details?id=${session.problem_id}`);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.sender_id === user?.id;
    const isSystem = item.message_type === 'system';

    if (isSystem) {
      // Check if it's a status update message
      const isStatusUpdate = item.content.includes('SOLVED') || 
                            item.content.includes('helping') || 
                            item.content.includes('status updated');
      
      return (
        <View className="items-center my-3">
          <View 
            className={`px-4 py-3 rounded-2xl max-w-[85%] ${
              isStatusUpdate 
                ? 'bg-green-100 border border-green-200' 
                : 'bg-gray-100 border border-gray-200'
            }`}
          >
            <Text 
              className={`text-center text-sm font-medium ${
                isStatusUpdate ? 'text-green-800' : 'text-gray-600'
              }`}
            >
              {item.content}
            </Text>
            <Text className="text-center text-xs text-gray-400 mt-1">
              {new Date(item.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        className={`flex-row mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}
      >
        {!isMine && (
          <Image
            source={{
              uri: item.sender?.avatar_url ||
                `https://ui-avatars.com/api/?name=${item.sender?.name || 'User'}&background=16A34A&color=fff`,
            }}
            className="w-8 h-8 rounded-full mr-2"
          />
        )}
        <View
          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
            isMine ? 'bg-green-500' : 'bg-white'
          }`}
          style={
            !isMine && {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }
          }
        >
          {item.message_type === 'text' && (
            <Text className={isMine ? 'text-white' : 'text-gray-900'}>
              {item.content}
            </Text>
          )}

          {item.message_type === 'image' && (
            <View>
              <Image
                source={{ uri: item.image_url }}
                className="w-48 h-48 rounded-xl mb-2"
                resizeMode="cover"
              />
              {item.content && item.content !== 'Sent an image' && (
                <Text className={isMine ? 'text-white' : 'text-gray-900'}>
                  {item.content}
                </Text>
              )}
            </View>
          )}

          {item.message_type === 'location' && (
            <TouchableOpacity
              onPress={() => {
                const url = `https://maps.google.com/?q=${item.latitude},${item.longitude}`;
                Linking.openURL(url);
              }}
              className="flex-row items-center"
            >
              <Ionicons
                name="location"
                size={20}
                color={isMine ? '#FFFFFF' : '#16A34A'}
              />
              <Text
                className={`ml-2 ${isMine ? 'text-white' : 'text-green-600'} font-medium`}
              >
                {item.location_name || 'View Location'}
              </Text>
            </TouchableOpacity>
          )}

          <Text
            className={`text-xs mt-1 ${isMine ? 'text-green-100' : 'text-gray-400'}`}
          >
            {new Date(item.created_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#16A34A" />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="flex-1"
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View
            className="bg-white px-4 py-3 flex-row items-center justify-between"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center flex-1">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <Ionicons name="arrow-back" size={22} color="#374151" />
              </TouchableOpacity>

              <Image
                source={{
                  uri: otherUser?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${otherUser?.name || 'User'}&background=16A34A&color=fff`,
                }}
                className="w-10 h-10 rounded-full mr-3"
              />

              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">
                  {otherUser?.name || 'User'}
                </Text>
                <Text className="text-xs text-gray-500">
                  {session?.status === 'active' ? 'Active' : 'Completed'}
                </Text>
              </View>
            </View>

            <View className="flex-row">
              <TouchableOpacity
                onPress={handleCall}
                className="w-10 h-10 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: '#F0FDF4' }}
              >
                <Ionicons name="call" size={20} color="#16A34A" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleViewProblem}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: '#F0FDF4' }}
              >
                <Ionicons name="information-circle" size={20} color="#16A34A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* SLA Timer Banner */}
          {session?.problem?.escalation_time && (
            <View className="bg-red-50 px-4 py-3 flex-row items-center border-b border-red-100">
              <Ionicons name="timer-outline" size={20} color="#DC2626" />
              <View className="flex-1 ml-2">
                <Text className="text-red-900 font-bold">12-Hour SLA Active</Text>
                <Text className="text-red-700 text-xs">
                  Issue will escalate to Gov at {new Date(session.problem.escalation_time).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          )}

          {/* Problem Info Banner */}
          {session?.problem && (
            <TouchableOpacity
              onPress={handleViewProblem}
              className="bg-blue-50 px-4 py-3 flex-row items-center"
            >
              <Ionicons name="alert-circle" size={20} color="#2563EB" />
              <Text className="flex-1 ml-2 text-blue-900 font-medium" numberOfLines={1}>
                {session.problem.title}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#2563EB" />
            </TouchableOpacity>
          )}

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: '#F0FDF4' }}
                >
                  <Ionicons name="chatbubbles" size={40} color="#16A34A" />
                </View>
                <Text className="text-gray-500 text-center">
                  Start chatting to coordinate the help!
                </Text>
              </View>
            }
          />

          {/* Input Area */}
          <View
            className="bg-white px-4 py-3"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            {/* Quick Actions */}
            <View className="flex-row mb-3">
              <TouchableOpacity
                onPress={handleSendImage}
                disabled={sending}
                className="flex-1 py-2 rounded-xl flex-row items-center justify-center mr-2"
                style={{ backgroundColor: '#F0FDF4' }}
              >
                <Ionicons name="image" size={18} color="#16A34A" />
                <Text className="ml-2 text-green-700 font-medium text-sm">Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendLocation}
                disabled={sending}
                className="flex-1 py-2 rounded-xl flex-row items-center justify-center ml-2"
                style={{ backgroundColor: '#F0FDF4' }}
              >
                <Ionicons name="location" size={18} color="#16A34A" />
                <Text className="ml-2 text-green-700 font-medium text-sm">Location</Text>
              </TouchableOpacity>
            </View>

            {/* Message Input */}
            <View className="flex-row items-center">
              <View
                className="flex-1 flex-row items-center px-4 py-2 rounded-full mr-2"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Type a message..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 text-gray-900"
                  multiline
                  maxLength={500}
                  editable={!sending}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  blurOnSubmit={false}
                />
              </View>

              <TouchableOpacity
                onPress={handleSend}
                disabled={!inputText.trim() || sending}
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: inputText.trim() && !sending ? '#16A34A' : '#D1D5DB',
                }}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            {/* Mark Solved Button */}
            {session?.status === 'active' && (
              <TouchableOpacity
                onPress={handleMarkSolved}
                className="mt-3 py-3 rounded-xl flex-row items-center justify-center"
                style={{ backgroundColor: '#059669' }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">Mark as Solved</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

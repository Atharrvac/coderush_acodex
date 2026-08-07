/**
 * NagrikSeva - Edit Profile Screen
 * Update name, phone, and avatar
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/contexts/AuthContext';
import { userService } from '../src/services/user.service';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please enable photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please enable camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert('Change Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Please login again');
      return;
    }

    setLoading(true);
    try {
      let newAvatarUrl = user.avatar_url;

      // Upload new avatar if selected
      if (avatarUri) {
        setUploadingAvatar(true);
        newAvatarUrl = await userService.uploadAvatar(avatarUri, user.id);
        setUploadingAvatar(false);
      }

      // Update profile
      await userService.updateProfile(user.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        avatar_url: newAvatarUrl,
      });

      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Save profile error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
      setUploadingAvatar(false);
    }
  };

  const currentAvatar = avatarUri || (user?.avatar_url && user.avatar_url.length > 0 ? user.avatar_url : null) || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=16A34A&color=fff&size=200`;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
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
          <Text className="text-lg font-bold text-gray-900">Edit Profile</Text>
          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View className="items-center mb-8">
            <View className="relative">
              <Image
                source={{ uri: currentAvatar }}
                className="w-32 h-32 rounded-full"
                style={{ borderWidth: 4, borderColor: '#F0FDF4' }}
              />
              {uploadingAvatar && (
                <View
                  className="absolute inset-0 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                  <ActivityIndicator color="#FFFFFF" size="large" />
                </View>
              )}
              <TouchableOpacity
                onPress={handleChangePhoto}
                className="absolute bottom-0 right-0 w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: '#16A34A',
                  borderWidth: 3,
                  borderColor: '#FFFFFF',
                }}
              >
                <Ionicons name="camera" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleChangePhoto} className="mt-3">
              <Text className="font-semibold" style={{ color: '#16A34A' }}>
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View
            className="bg-white rounded-2xl p-5"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {/* Name */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <Ionicons name="person" size={18} color="#16A34A" />
                <Text className="text-gray-700 font-semibold ml-2">Full Name</Text>
                <Text className="text-red-500 ml-1">*</Text>
              </View>
              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                className="px-4 py-4 rounded-xl text-gray-900 text-base"
                style={{
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              />
            </View>

            {/* Email (Read-only) */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <Ionicons name="mail" size={18} color="#9CA3AF" />
                <Text className="text-gray-500 font-semibold ml-2">Email</Text>
              </View>
              <View
                className="px-4 py-4 rounded-xl"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <Text className="text-gray-500 text-base">{user?.email}</Text>
              </View>
              <Text className="text-gray-400 text-xs mt-1 ml-1">
                Email cannot be changed
              </Text>
            </View>

            {/* Phone */}
            <View className="mb-2">
              <View className="flex-row items-center mb-2">
                <Ionicons name="call" size={18} color="#16A34A" />
                <Text className="text-gray-700 font-semibold ml-2">Phone</Text>
                <Text className="text-gray-400 text-sm ml-2">(Optional)</Text>
              </View>
              <TextInput
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                className="px-4 py-4 rounded-xl text-gray-900 text-base"
                style={{
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              />
              <Text className="text-gray-400 text-xs mt-1 ml-1">
                Others can contact you when you help them
              </Text>
            </View>
          </View>

          {/* Info Box */}
          <View
            className="mt-6 rounded-2xl p-4"
            style={{ backgroundColor: '#F0FDF4' }}
          >
            <View className="flex-row items-start">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: '#D1FAE5' }}
              >
                <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-bold text-gray-800 mb-1">Your Privacy</Text>
                <Text className="text-gray-600 text-sm leading-5">
                  Your profile photo and name are visible to everyone. Phone number is only shared when you help someone.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
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
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className="py-4 rounded-2xl flex-row items-center justify-center"
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
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-white font-bold text-lg ml-2">
                  {uploadingAvatar ? 'Uploading Photo...' : 'Saving...'}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text className="text-white font-bold text-lg ml-2">Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

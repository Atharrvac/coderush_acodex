/**
 * Community Redressal Planner - Report a Civic Issue
 * With slide-up animation and OpenStreetMap location search
 */

import { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { problemService } from '../../src/services/problem.service';
import { LanguageSelector } from '../../src/components/LanguageSelector';
import { translationService, Language } from '../../src/services/translation.service';
import { PROBLEM_CATEGORIES } from '../../src/constants/categories';
import { useCallback } from 'react';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LocationSuggestion {
  place_id: string;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
  type: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export default function PostProblemScreen() {
  const { user } = useAuth();
  const { language: globalLanguage } = useLanguage();
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(globalLanguage as Language || 'en');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [locationText, setLocationText] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sync with global language
  useEffect(() => {
    if (globalLanguage) {
      setSelectedLanguage(globalLanguage as Language);
    }
  }, [globalLanguage]);

  // Animation
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get translations for current language
  const t = (key: any) => translationService.translate(key, selectedLanguage);

  // Reset form when screen is focused
  const resetForm = useCallback(() => {
    setImages([]);
    setTitle('');
    setDescription('');
    setSelectedCategory('');
    setLocationText('');
    setCoordinates(null);
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  // Slide up animation when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Reset form for fresh start
      resetForm();
      
      // Get current location
      getCurrentLocation();
      
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Reset on blur
      return () => {
        slideAnim.setValue(SCREEN_HEIGHT);
        fadeAnim.setValue(0);
      };
    }, [])
  );

  // Debounced location search using OpenStreetMap Nominatim (FREE!)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationText.length >= 3 && !coordinates) {
        searchLocation(locationText);
      } else if (locationText.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [locationText, coordinates]);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please enable location to tag your problem');
        setGettingLocation(false);
        return;
      }

      // Use balanced accuracy for better compatibility across devices
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoordinates({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      // Reverse geocode using Nominatim
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}&addressdetails=1`,
          { headers: { 'User-Agent': 'NagrikSeva-App' } }
        );
        const data = await response.json();
        
        if (data.display_name) {
          // Create a shorter, cleaner address
          const parts = [];
          if (data.address?.road) parts.push(data.address.road);
          if (data.address?.suburb) parts.push(data.address.suburb);
          if (data.address?.city || data.address?.town || data.address?.village) {
            parts.push(data.address.city || data.address.town || data.address.village);
          }
          if (data.address?.state) parts.push(data.address.state);
          
          setLocationText(parts.join(', ') || data.display_name.split(',').slice(0, 3).join(','));
        }
      } catch (e) {
        // Fallback to expo-location
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (address) {
          const addressText = [address.street, address.district, address.city, address.region]
            .filter(Boolean)
            .join(', ');
          setLocationText(addressText || 'Current Location');
        }
      }
      
      setShowSuggestions(false);
      setSuggestions([]);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Could not get current location');
    } finally {
      setGettingLocation(false);
    }
  };

  // Search using OpenStreetMap Nominatim API (FREE, no API key needed!)
  const searchLocation = async (query: string) => {
    setSearchingLocation(true);
    try {
      // Search with India bias for better local results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=8&addressdetails=1`,
        { headers: { 'User-Agent': 'NagrikSeva-App' } }
      );
      const data: LocationSuggestion[] = await response.json();

      if (data && data.length > 0) {
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        // Try without country restriction
        const globalResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
          { headers: { 'User-Agent': 'NagrikSeva-App' } }
        );
        const globalData: LocationSuggestion[] = await globalResponse.json();
        setSuggestions(globalData || []);
        setShowSuggestions(globalData.length > 0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setSearchingLocation(false);
    }
  };

  const selectLocation = (suggestion: LocationSuggestion) => {
    // Create a clean address
    const parts = [];
    const addr = suggestion.address;
    if (addr?.road) parts.push(addr.road);
    if (addr?.suburb) parts.push(addr.suburb);
    if (addr?.city || (addr as any)?.town || (addr as any)?.village) {
      parts.push(addr.city || (addr as any).town || (addr as any).village);
    }
    if (addr?.state) parts.push(addr.state);
    
    const cleanAddress = parts.length > 0 
      ? parts.join(', ')
      : suggestion.display_name.split(',').slice(0, 4).join(',');

    setLocationText(cleanAddress);
    setCoordinates({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const getPlaceIcon = (type: string) => {
    if (type?.includes('house') || type?.includes('building')) return 'home';
    if (type?.includes('road') || type?.includes('street')) return 'navigate';
    if (type?.includes('city') || type?.includes('town')) return 'business';
    if (type?.includes('village')) return 'home';
    if (type?.includes('state') || type?.includes('country')) return 'globe';
    return 'location';
  };

  const getMainText = (suggestion: LocationSuggestion) => {
    // Extract the main place name
    const name = suggestion.display_name.split(',')[0];
    return name || suggestion.name || 'Unknown Place';
  };

  const getSecondaryText = (suggestion: LocationSuggestion) => {
    // Get remaining address parts
    const parts = suggestion.display_name.split(',').slice(1, 4);
    return parts.join(',').trim() || '';
  };

  const clearLocation = () => {
    setLocationText('');
    setCoordinates(null);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please enable photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please enable camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Missing Info', t('missingCategory'));
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Info', t('missingDescription'));
      return;
    }
    if (!coordinates) {
      Alert.alert('Missing Info', t('missingLocation'));
      return;
    }
    if (!user?.id) {
      Alert.alert('Login Required', t('loginRequired'));
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      let uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        setUploadingImages(true);
        for (const imageUri of images) {
          try {
            const url = await problemService.uploadImage(imageUri, user.id);
            if (url) uploadedImageUrls.push(url);
          } catch (e) {
            console.error('Image upload failed:', e);
          }
        }
        setUploadingImages(false);
      }

      const category = PROBLEM_CATEGORIES.find((c) => c.id === selectedCategory);
      const problemTitle = title.trim() || `${translationService.translateCategory(selectedCategory, selectedLanguage)} Issue`;

      // Show AI cost analysis animation
      if (uploadedImageUrls.length > 0) {
        // Run cost analysis in background without showing to user
        try {
          const response = await fetch('http://localhost:3000/api/v1/cost-analysis/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrl: uploadedImageUrls[0],
              category: selectedCategory,
              description: description.trim(),
              location: locationText
            })
          });

          // Cost analysis runs silently in background
          // Results will be visible in problem details screen
        } catch (error) {
          console.error('Background cost analysis error:', error);
          // Silently fail - cost analysis is optional
        }
      }

      await problemService.create(
        {
          category: selectedCategory,
          title: problemTitle,
          description: description.trim(),
          address: locationText,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          images: uploadedImageUrls.filter(url => url),
          language_code: selectedLanguage,
          priority_level: priority,
        },
        user.id
      );

      const costMessage = '';

      Alert.alert(
        t('postedSuccessfully'), 
        `${t('successMessage')}${costMessage}`,
        [{ text: 'Great!', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View 
      style={{ 
        flex: 1, 
        backgroundColor: '#FFFFFF',
        transform: [{ translateY: slideAnim }],
        opacity: fadeAnim,
      }}
    >
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View 
            className="px-5 py-4 flex-row items-center justify-between"
            style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
          >
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">{t('submitComplaint')}</Text>
          <View className="w-10" />
        </View>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="p-5">
            {/* Language Selector - GovTech Feature */}
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              style={{ marginBottom: 24 }}
            />

            {/* Priority Selector - GovTech Feature */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#FEE2E2' }}>
                  <Ionicons name="flag" size={16} color="#DC2626" />
                </View>
                <Text className="text-base font-bold text-gray-900">{t('priorityLevel')}</Text>
              </View>
              
              <View className="flex-row gap-3">
                {[
                  { id: 'low', label: t('low'), color: '#10B981', bg: '#D1FAE5' },
                  { id: 'medium', label: t('medium'), color: '#F59E0B', bg: '#FEF3C7' },
                  { id: 'high', label: t('high'), color: '#EF4444', bg: '#FEE2E2' },
                ].map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPriority(p.id as any)}
                    className="flex-1 px-4 py-3 rounded-2xl flex-row items-center justify-center"
                    style={{ 
                      backgroundColor: priority === p.id ? p.color : p.bg,
                      borderWidth: 2,
                      borderColor: priority === p.id ? p.color : 'transparent',
                    }}
                  >
                    <Ionicons 
                      name={priority === p.id ? "checkmark-circle" : "radio-button-off"} 
                      size={16} 
                      color={priority === p.id ? '#FFFFFF' : p.color} 
                    />
                    <Text 
                      className="font-semibold ml-2" 
                      style={{ color: priority === p.id ? '#FFFFFF' : p.color }}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* Photo Upload */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#FEF3C7' }}>
                  <Ionicons name="camera" size={16} color="#D97706" />
                </View>
                <Text className="text-base font-bold text-gray-900">{t('addPhotos')}</Text>
                <Text className="text-gray-400 text-sm ml-2">(Optional)</Text>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row">
                  {images.length < 5 && (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(t('addPhoto'), 'Choose an option', [
                          { text: t('takePhoto'), onPress: takePhoto },
                          { text: t('chooseFromGallery'), onPress: pickImage },
                          { text: 'Cancel', style: 'cancel' },
                        ]);
                      }}
                      className="w-28 h-28 rounded-2xl items-center justify-center mr-3"
                      style={{ backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed' }}
                    >
                      <Ionicons name="add-circle" size={32} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs mt-1 font-medium">{t('addPhoto')}</Text>
                    </TouchableOpacity>
                  )}
                  {images.map((uri, index) => (
                    <View key={index} className="relative mr-3">
                      <Image source={{ uri }} className="w-28 h-28 rounded-2xl" />
                      <TouchableOpacity
                        onPress={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full items-center justify-center"
                        style={{ backgroundColor: '#EF4444' }}
                      >
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Category */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#DBEAFE' }}>
                  <Ionicons name="pricetag" size={16} color="#2563EB" />
                </View>
                <Text className="text-base font-bold text-gray-900">{t('category')}</Text>
                <Text className="text-red-500 ml-1">*</Text>
              </View>
              
              <View className="flex-row flex-wrap">
                {PROBLEM_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    className="mr-2 mb-2 px-4 py-3 rounded-2xl flex-row items-center"
                    style={{ backgroundColor: selectedCategory === category.id ? '#16A34A' : '#F3F4F6' }}
                  >
                    <Text className="text-lg mr-1.5">{category.emoji}</Text>
                    <Text className="font-semibold" style={{ color: selectedCategory === category.id ? '#FFFFFF' : '#374151' }}>
                      {translationService.translateCategory(category.id, selectedLanguage)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#F3E8FF' }}>
                  <Ionicons name="text" size={16} color="#7C3AED" />
                </View>
                <Text className="text-base font-bold text-gray-900">{t('title')}</Text>
                <Text className="text-gray-400 text-sm ml-2">(Optional)</Text>
              </View>
              
              <TextInput
                placeholder={t('titlePlaceholder')}
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                className="px-4 py-4 rounded-2xl text-gray-900 text-base"
                style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' }}
              />
            </View>

            {/* Description */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#FCE7F3' }}>
                  <Ionicons name="document-text" size={16} color="#DB2777" />
                </View>
                <Text className="text-base font-bold text-gray-900">{t('description')}</Text>
                <Text className="text-red-500 ml-1">*</Text>
              </View>
              
              <TextInput
                placeholder={t('descriptionPlaceholder')}
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="px-4 py-4 rounded-2xl text-gray-900 text-base"
                style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', minHeight: 120 }}
              />
            </View>

            {/* Location Search - Using FREE OpenStreetMap! */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#D1FAE5' }}>
                  <Ionicons name="location" size={16} color="#059669" />
                </View>
                <Text className="text-base font-bold text-gray-900">{t('location')}</Text>
                <Text className="text-red-500 ml-1">*</Text>
              </View>
              
              {/* Search Input */}
              <View 
                className="flex-row items-center px-4 py-3 rounded-2xl"
                style={{ 
                  backgroundColor: '#F9FAFB', 
                  borderWidth: 1, 
                  borderColor: showSuggestions ? '#16A34A' : '#E5E7EB' 
                }}
              >
                <Ionicons name="search" size={20} color="#16A34A" />
                <TextInput
                  placeholder={t('locationPlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  value={locationText}
                  onChangeText={(text) => {
                    setLocationText(text);
                    if (coordinates) setCoordinates(null);
                  }}
                  className="flex-1 ml-3 text-gray-900 text-base"
                />
                {searchingLocation && (
                  <ActivityIndicator size="small" color="#16A34A" style={{ marginRight: 8 }} />
                )}
                {locationText.length > 0 && !searchingLocation && (
                  <TouchableOpacity onPress={clearLocation} className="p-1 mr-2">
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  onPress={getCurrentLocation}
                  disabled={gettingLocation}
                  className="px-3 py-2 rounded-xl"
                  style={{ backgroundColor: '#F0FDF4' }}
                >
                  {gettingLocation ? (
                    <ActivityIndicator size="small" color="#16A34A" />
                  ) : (
                    <Ionicons name="locate" size={20} color="#16A34A" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Location Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <View 
                  className="mt-2 rounded-2xl overflow-hidden"
                  style={{ 
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={suggestion.place_id}
                      onPress={() => selectLocation(suggestion)}
                      className="flex-row items-center px-4 py-3"
                      style={{
                        borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                        borderBottomColor: '#F3F4F6',
                      }}
                      activeOpacity={0.7}
                    >
                      <View 
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: '#F0FDF4' }}
                      >
                        <Ionicons name={getPlaceIcon(suggestion.type) as any} size={18} color="#16A34A" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold text-base" numberOfLines={1}>
                          {getMainText(suggestion)}
                        </Text>
                        <Text className="text-gray-500 text-sm" numberOfLines={1}>
                          {getSecondaryText(suggestion)}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color="#D1D5DB" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {/* Location Confirmed */}
              {coordinates && (
                <View 
                  className="flex-row items-center mt-3 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: '#F0FDF4' }}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-800 font-semibold">Location confirmed ✓</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">
                      {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={clearLocation}>
                    <Text className="text-red-500 font-semibold">Change</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Help Text */}
              {!coordinates && locationText.length === 0 && (
                <View className="flex-row items-center mt-2 px-2">
                  <Ionicons name="information-circle" size={16} color="#9CA3AF" />
                  <Text className="text-gray-400 text-sm ml-1">
                    Search any place or tap GPS for current location
                  </Text>
                </View>
              )}
            </View>

          {/* GovTech CRM Info Box */}
          <View className="rounded-2xl p-4 mb-6" style={{ backgroundColor: '#EFF6FF' }}>
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#DBEAFE' }}>
                <Ionicons name="shield-checkmark" size={20} color="#1E40AF" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-bold text-gray-800 mb-1">{t('govtechCRM')}</Text>
                <Text className="text-gray-600 text-sm leading-5">
                  {t('govtechDescription')}
                </Text>
              </View>
            </View>
          </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View className="px-5 py-4 pb-24" style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FFFFFF' }}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="py-4 rounded-2xl flex-row items-center justify-center"
            style={{ 
              backgroundColor: loading ? '#D1D5DB' : '#1E40AF',
              shadowColor: '#1E40AF',
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
                  {uploadingImages ? t('uploadingPhotos') : t('posting')}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="paper-plane" size={22} color="#FFFFFF" />
                <Text className="text-white font-bold text-lg ml-2">{t('submitButton')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </Animated.View>
  );
}

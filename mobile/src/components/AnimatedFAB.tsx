/**
 * Animated FAB (Floating Action Button)
 * Expands with options when clicked
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface FABOption {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}

export default function AnimatedFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useSharedValue(0);
  const rotation = useSharedValue(0);

  const options: FABOption[] = [
    {
      id: 'post',
      label: 'Report Problem',
      icon: 'warning',
      color: '#DC2626',
      bgColor: '#FEE2E2',
      onPress: () => {
        closeMenu();
        router.push('/(tabs)/post');
      },
    },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: 'call',
      color: '#16A34A',
      bgColor: '#DCFCE7',
      onPress: () => {
        closeMenu();
        // Could open emergency contacts
      },
    },
  ];

  const openMenu = () => {
    setIsOpen(true);
    animation.value = withSpring(1, { damping: 12, stiffness: 100 });
    rotation.value = withSpring(45, { damping: 12, stiffness: 100 });
  };

  const closeMenu = () => {
    animation.value = withTiming(0, { duration: 200 });
    rotation.value = withTiming(0, { duration: 200 });
    setTimeout(() => setIsOpen(false), 200);
  };

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: animation.value * 0.5,
  }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: animation.value,
    transform: [
      { scale: interpolate(animation.value, [0, 1], [0.8, 1]) },
      { translateY: interpolate(animation.value, [0, 1], [50, 0]) },
    ],
  }));

  const getOptionStyle = (index: number) => {
    return useAnimatedStyle(() => ({
      opacity: animation.value,
      transform: [
        { scale: interpolate(animation.value, [0, 1], [0.5, 1]) },
        { translateY: interpolate(animation.value, [0, 1], [30, 0]) },
      ],
    }));
  };

  return (
    <>
      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={isOpen ? closeMenu : openMenu}
        activeOpacity={0.9}
      >
        <Animated.View style={fabStyle}>
          <LinearGradient
            colors={isOpen ? ['#EF4444', '#DC2626'] : ['#22C55E', '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Ionicons name={isOpen ? 'close' : 'add'} size={32} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Expanded Menu Modal */}
      <Modal visible={isOpen} transparent animationType="none">
        <View style={styles.modalContainer}>
          {/* Overlay */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu}>
            <Animated.View style={[styles.overlay, overlayStyle]} />
          </Pressable>

          {/* Menu Options */}
          <Animated.View style={[styles.menuContainer, menuStyle]}>
            {options.map((option, index) => (
              <Animated.View key={option.id} style={getOptionStyle(index)}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={option.onPress}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionIcon, { backgroundColor: option.bgColor }]}>
                    <Ionicons name={option.icon as any} size={24} color={option.color} />
                  </View>
                  <View style={styles.optionLabelContainer}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Close FAB at bottom */}
          <TouchableOpacity
            style={styles.closeFabContainer}
            onPress={closeMenu}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fab}
            >
              <Ionicons name="close" size={32} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}


const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 100,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 180,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  menuContainer: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionLabelContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeFabContainer: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
});

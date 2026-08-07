/**
 * Skeleton Shimmer Loading Component
 * Beautiful animated loading placeholders
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const shimmer = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        );
        shimmer.start();
        return () => shimmer.stop();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-300, 300],
    });

    return (
        <View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmer,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['#E2E8F0', '#F1F5F9', '#E2E8F0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                />
            </Animated.View>
        </View>
    );
};

// Circle skeleton for avatars
export const SkeletonCircle: React.FC<{ size?: number }> = ({ size = 40 }) => {
    return <Skeleton width={size} height={size} borderRadius={size / 2} />;
};

// Rectangle skeleton
export const SkeletonRect: React.FC<{
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
}> = ({ width, height, borderRadius }) => {
    return <Skeleton width={width} height={height} borderRadius={borderRadius} />;
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E2E8F0',
        overflow: 'hidden',
    },
    shimmer: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        flex: 1,
        width: 300,
    },
});

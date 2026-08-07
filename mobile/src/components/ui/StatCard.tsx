/**
 * Statistics Card for Dashboard
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = '#3B82F6',
  trend,
}) => {
  return (
    <Card variant="elevated" className="flex-1 min-w-[140px]">
      <View className="flex-row items-center justify-between mb-2">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {trend && (
          <View className="flex-row items-center">
            <Ionicons
              name={trend.isPositive ? 'trending-up' : 'trending-down'}
              size={16}
              color={trend.isPositive ? '#10B981' : '#EF4444'}
            />
            <Text
              className={`text-xs ml-1 ${
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold text-gray-800">{value}</Text>
      <Text className="text-gray-500 text-sm mt-1">{title}</Text>
    </Card>
  );
};

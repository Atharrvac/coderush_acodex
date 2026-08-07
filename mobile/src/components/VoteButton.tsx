/**
 * Vote Button Component - Upvote/Downvote
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { voteService } from '../services/vote.service';
import { useAuth } from '../contexts/AuthContext';

interface VoteButtonProps {
  problemId: string;
  initialUpvotes?: number;
  initialDownvotes?: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  problemId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  size = 'medium',
  showCount = true,
}) => {
  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState(Number(initialUpvotes) || 0);
  const [downvotes, setDownvotes] = useState(Number(initialDownvotes) || 0);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Safety check - don't render if problemId is invalid
  if (!problemId) {
    return null;
  }

  useEffect(() => {
    if (user?.id) {
      loadVotes();
    }
  }, [problemId, user?.id]);

  const loadVotes = async () => {
    if (!user?.id) return;
    try {
      const data = await voteService.getVotes(problemId, user.id);
      if (data) {
        setUpvotes(Number(data.upvotes) || 0);
        setDownvotes(Number(data.downvotes) || 0);
        setUserVote(data.userVote || null);
      }
    } catch (error) {
      console.error('Load votes error:', error);
      // Set defaults on error
      setUpvotes(0);
      setDownvotes(0);
      setUserVote(null);
    }
  };

  const handleVote = async (type: 'upvote' | 'downvote') => {
    if (!user?.id || loading) return;

    setLoading(true);
    
    // Optimistic update
    const wasVoted = userVote === type;
    const oldUpvotes = upvotes;
    const oldDownvotes = downvotes;
    const oldUserVote = userVote;

    try {
      if (userVote === type) {
        // Remove vote
        setUserVote(null);
        if (type === 'upvote') {
          setUpvotes(prev => Math.max(0, prev - 1));
        } else {
          setDownvotes(prev => Math.max(0, prev - 1));
        }
      } else {
        // Change or add vote
        if (userVote) {
          // Changing vote
          if (userVote === 'upvote') {
            setUpvotes(prev => Math.max(0, prev - 1));
            setDownvotes(prev => prev + 1);
          } else {
            setDownvotes(prev => Math.max(0, prev - 1));
            setUpvotes(prev => prev + 1);
          }
        } else {
          // New vote
          if (type === 'upvote') {
            setUpvotes(prev => prev + 1);
          } else {
            setDownvotes(prev => prev + 1);
          }
        }
        setUserVote(type);
      }

      // API call
      await voteService.vote(problemId, user.id, type);
    } catch (error) {
      console.error('Vote error:', error);
      // Revert on error
      setUpvotes(oldUpvotes);
      setDownvotes(oldDownvotes);
      setUserVote(oldUserVote);
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
  const fontSize = size === 'small' ? 11 : size === 'large' ? 15 : 13;

  return (
    <View style={[styles.container, size === 'small' && styles.containerSmall]}>
      <TouchableOpacity
        style={[
          styles.button,
          userVote === 'upvote' && styles.buttonActive,
          size === 'small' && styles.buttonSmall,
        ]}
        onPress={() => handleVote('upvote')}
        disabled={loading}
      >
        <Ionicons
          name={userVote === 'upvote' ? 'arrow-up' : 'arrow-up-outline'}
          size={iconSize}
          color={userVote === 'upvote' ? '#FFFFFF' : '#16A34A'}
        />
        {showCount && (
          <Text
            style={[
              styles.count,
              { fontSize: fontSize, marginLeft: 4 },
              userVote === 'upvote' && styles.countActive,
            ]}
          >
            {String(upvotes || 0)}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[
          styles.button,
          userVote === 'downvote' && styles.buttonActiveDown,
          size === 'small' && styles.buttonSmall,
        ]}
        onPress={() => handleVote('downvote')}
        disabled={loading}
      >
        <Ionicons
          name={userVote === 'downvote' ? 'arrow-down' : 'arrow-down-outline'}
          size={iconSize}
          color={userVote === 'downvote' ? '#FFFFFF' : '#EF4444'}
        />
        {showCount && (
          <Text
            style={[
              styles.count,
              { fontSize: fontSize },
              userVote === 'downvote' && styles.countActive,
            ]}
          >
            {String(downvotes || 0)}
          </Text>
        )}
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#16A34A" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  containerSmall: {
    borderRadius: 16,
    padding: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  buttonSmall: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  buttonActive: {
    backgroundColor: '#16A34A',
  },
  buttonActiveDown: {
    backgroundColor: '#EF4444',
  },
  count: {
    fontWeight: '700',
    color: '#374151',
  },
  countActive: {
    color: '#FFFFFF',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
});

export default VoteButton;

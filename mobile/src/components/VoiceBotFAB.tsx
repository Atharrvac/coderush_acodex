import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { voiceService } from '../services/voice.service';

type BotState = 'idle' | 'listening' | 'processing' | 'speaking';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

export const VoiceBotFAB = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'bot',
      text: 'Hello! I am the JanMitra Voice Assistant. Tap the microphone below and tell me how I can help you today.',
    }
  ]);
  const [botState, setBotState] = useState<BotState>('idle');
  const [statusText, setStatusText] = useState('Tap to speak');
  
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Pulse animation for recording state
  useEffect(() => {
    if (botState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
  }, [botState, pulseAnim]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (modalVisible) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, modalVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  async function startRecording() {
    try {
      if (recordingRef.current) {
        try { await recordingRef.current.stopAndUnloadAsync(); } catch (e) {}
        recordingRef.current = null;
      }

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      // HIGH_QUALITY automatically uses m4a AAC format on both platforms
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      recordingRef.current = recording;
      setBotState('listening');
      setStatusText('Listening... Tap to stop');
      
    } catch (err: any) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', err.message || 'Failed to start recording');
      setBotState('idle');
      setStatusText('Tap to speak');
      recordingRef.current = null;
    }
  }

  async function stopRecording() {
    if (!recordingRef.current || botState !== 'listening') return;
    
    setBotState('processing');
    setStatusText('Thinking...');

    try {
      const recording = recordingRef.current;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (uri) {
        await processVoice(uri);
      } else {
        throw new Error('Recording file not found');
      }
    } catch (err: any) {
      console.error('Stop error:', err);
      Alert.alert('Error', err.message || 'Failed to stop recording');
      setBotState('idle');
      setStatusText('Tap to speak');
      recordingRef.current = null;
    }
  }

  const processVoice = async (uri: string) => {
    try {
      // Step 1: Transcribe via Whisper
      setStatusText('Transcribing audio...');
      const userText = await voiceService.transcribeAudio(uri);
      
      if (!userText || userText.trim().length < 2) {
        setStatusText('Tap to speak');
        setBotState('idle');
        return;
      }
      
      // Add user message
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
      
      // Step 2: Get LLM Response
      setStatusText('Generating response...');
      const botReply = await voiceService.getBotResponse(userText);
      
      // Add bot message
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: botReply }]);

      // Step 3: Play Speech
      setBotState('speaking');
      setStatusText('Speaking... Tap to stop');
      voiceService.speak(botReply);

      // Estimate speaking time to reset UI
      const estimatedDuration = Math.max(botReply.length * 60, 3000); 
      setTimeout(() => {
        setBotState(prev => prev === 'speaking' ? 'idle' : prev);
        setStatusText(prev => prev === 'Speaking... Tap to stop' ? 'Tap to speak' : prev);
      }, estimatedDuration);
      
    } catch (error: any) {
      console.error('Voice processing error:', error);
      Alert.alert('Error', error.message || 'Something went wrong processing your voice.');
      setBotState('idle');
      setStatusText('Tap to speak');
    }
  };

  const handleMicPress = () => {
    if (botState === 'speaking') {
      voiceService.stopSpeaking();
      setBotState('idle');
      setStatusText('Tap to speak');
      return;
    }
    if (botState === 'idle') {
      startRecording();
    } else if (botState === 'listening') {
      stopRecording();
    }
  };

  const closeModal = () => {
    if (botState === 'listening') stopRecording();
    if (botState === 'speaking') voiceService.stopSpeaking();
    setBotState('idle');
    setStatusText('Tap to speak');
    setModalVisible(false);
  };

  const getMicIcon = () => {
    switch (botState) {
      case 'idle': return 'mic';
      case 'listening': return 'stop';
      case 'processing': return 'ellipsis-horizontal';
      case 'speaking': return 'volume-high';
      default: return 'mic';
    }
  };

  const getMicColor = () => {
    switch (botState) {
      case 'idle': return '#10B981'; // Green
      case 'listening': return '#EF4444'; // Red
      case 'processing': return '#F59E0B'; // Yellow
      case 'speaking': return '#3B82F6'; // Blue
      default: return '#10B981';
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isBot = item.role === 'bot';
    return (
      <View style={[styles.messageWrapper, isBot ? styles.messageWrapperBot : styles.messageWrapperUser]}>
        {isBot && (
          <View style={styles.botAvatar}>
            <Ionicons name="hardware-chip" size={16} color="white" />
          </View>
        )}
        <View style={[styles.messageBubble, isBot ? styles.messageBubbleBot : styles.messageBubbleUser]}>
          <Text style={[styles.messageText, isBot ? styles.messageTextBot : styles.messageTextUser]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* The Floating Action Button on the main layout */}
      {!modalVisible && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* The Chat Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerTitleContainer}>
                <View style={styles.botAvatarLarge}>
                  <Ionicons name="hardware-chip" size={20} color="white" />
                </View>
                <Text style={styles.headerTitle}>JanMitra Assistant</Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Chat History */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.chatContainer}
            />

            {/* Bottom Voice Controls */}
            <View style={styles.controlsContainer}>
              <Text style={styles.statusText}>{statusText}</Text>

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.recordButton, { backgroundColor: getMicColor() }]}
                  onPress={handleMicPress}
                  disabled={botState === 'processing'}
                  activeOpacity={0.8}
                >
                  {botState === 'processing' ? (
                    <ActivityIndicator color="white" size="large" />
                  ) : (
                    <Ionicons name={getMicIcon()} size={36} color="white" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: 100, // Shifted up to avoid tabs
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981', // Changed default color to Green
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '65%', // Short proper UI instead of full screen
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatarLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },

  // Chat Styles
  chatContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  messageWrapperBot: {
    alignSelf: 'flex-start',
  },
  messageWrapperUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleBot: {
    backgroundColor: 'white',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageBubbleUser: {
    backgroundColor: '#10B981',
    borderTopRightRadius: 4,
    marginLeft: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextBot: {
    color: '#334155',
  },
  messageTextUser: {
    color: 'white',
  },

  // Controls Styles
  controlsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    fontWeight: '500',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});

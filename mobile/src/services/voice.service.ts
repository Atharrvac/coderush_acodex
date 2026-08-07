import * as Speech from 'expo-speech';

// Check if Groq API key is available
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export const voiceService = {
  // =====================================================
  // SPEECH TO TEXT (Groq Whisper API)
  // =====================================================
  transcribeAudio: async (uri: string): Promise<string> => {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      throw new Error('Groq API Key is not configured.');
    }

    try {
      console.log('Uploading audio to Groq Whisper...', uri);
      
      const formData = new FormData();
      // Using .m4a format which is highly compatible with Groq Whisper
      formData.append('file', {
        uri: uri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      
      formData.append('model', 'whisper-large-v3');
      // Optional: you can set language to 'en' or 'hi' if you want a specific language
      
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          // Let fetch automatically set the Content-Type to multipart/form-data with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq Whisper API Error:', errorText);
        throw new Error(`Groq Whisper API error: ${response.status}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error: any) {
      console.error('Transcription error:', error);
      throw new Error(error.message || 'Failed to transcribe audio');
    }
  },

  // =====================================================
  // TEXT TO SPEECH (Expo Speech)
  // =====================================================
  speak: (text: string) => {
    Speech.speak(text, {
      language: 'en-IN', 
      pitch: 1.0,
      rate: 0.9,
    });
  },

  stopSpeaking: () => {
    Speech.stop();
  },

  // =====================================================
  // LLM CHAT (Groq LLaMA)
  // =====================================================
  getBotResponse: async (text: string): Promise<string> => {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      throw new Error('Groq API Key is not configured.');
    }

    try {
      console.log('Getting LLM response for:', text);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are the JanMitra Civic Voice Assistant. You help citizens report problems like potholes, garbage, or water issues. Keep your responses short, helpful, and conversational. Do not use markdown. Speak naturally.',
            },
            {
              role: 'user',
              content: text,
            }
          ],
          max_tokens: 150, // Keep responses short for voice
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq LLM API Error:', errorText);
        throw new Error(`Groq LLM API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      console.error('LLM error:', error);
      throw new Error(error.message || 'Failed to get bot response');
    }
  }
};

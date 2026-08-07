/**
 * AI Controller - Groq API Integration
 * Voice-to-voice AI assistant for GovTech CRM
 */

const axios = require('axios');

class AIController {
  // Chat with Groq AI
  async chatWithAI(req, res) {
    try {
      const { message, context = 'govtech' } = req.body;

      if (!message) {
        return res.status(400).json({
          error: 'Message is required'
        });
      }

      // Use real Groq API
      const response = await this.callGroqAPI(message);

      res.json({
        success: true,
        response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('AI chat error:', error);
      
      // Fallback to mock response if API fails
      const fallbackResponse = await this.getMockGroqResponse(message);
      
      res.json({
        success: true,
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
  }

  // Mock Groq API response (replace with real API)
  async getMockGroqResponse(message) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('complaint') || lowerMessage.includes('problem')) {
      return "I can help you with complaints! I see you have access to the complaint management system. You can view, assign, and update complaint statuses. Would you like me to explain how to process a specific complaint?";
    } else if (lowerMessage.includes('department')) {
      return "We have 7 government departments: PWD for roads, Water Department, Electricity Board, Municipal Corporation, Traffic Police, Parks Department, and Urban Development. Each handles specific types of complaints automatically.";
    } else if (lowerMessage.includes('status') || lowerMessage.includes('update')) {
      return "To update a complaint status, click 'View' on any complaint, then use 'Start Work' to mark it in progress, or 'Mark Resolved' when completed. Citizens will see updates in real-time!";
    } else if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return "I'm here to help! You can ask me about complaint management, department information, status updates, or any government service processes. What would you like to know?";
    } else if (lowerMessage.includes('statistics') || lowerMessage.includes('stats')) {
      return "I can show you complaint statistics! Currently, you can see pending, in-progress, and resolved complaint counts in your dashboard. Would you like me to explain how to generate detailed reports?";
    } else if (lowerMessage.includes('citizen') || lowerMessage.includes('user')) {
      return "Citizens can submit complaints through our mobile app in multiple languages. The system automatically assigns complaints to the right department and provides real-time tracking. How can I help you serve citizens better?";
    } else {
      return "Thank you for your question! As your GovTech AI Assistant, I can help with complaint management, department information, government processes, and citizen services. What would you like to know?";
    }
  }

  // Real Groq API integration
  async callGroqAPI(message) {
    try {
      const GROQ_API_KEY = process.env.GROQ_API_KEY || 'your-groq-api-key-here';
      
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant for a Government Technology (GovTech) complaint management system. 
                     You help government officers manage citizen complaints, understand department processes, 
                     and provide information about government services. Be professional, helpful, and concise.
                     
                     The system has these departments:
                     - PWD (Public Works Department) - handles road issues
                     - Water Supply Department - handles water problems  
                     - Electricity Board - handles power issues
                     - Municipal Corporation - handles garbage/cleanliness
                     - Traffic Police - handles traffic issues
                     - Parks Department - handles park maintenance
                     - Urban Development - handles infrastructure
                     
                     Officers can view complaints, update status (submitted → assigned → in_progress → resolved), 
                     and citizens get real-time updates. Keep responses under 100 words and focus on practical help.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API error:', error);
      throw new Error('AI service unavailable');
    }
  }
}

module.exports = new AIController();
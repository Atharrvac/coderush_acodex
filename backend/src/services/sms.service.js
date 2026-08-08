/**
 * SMS Service for Government Dashboard
 * Sends SMS notifications to field officers
 */

const axios = require('axios');

class SMSService {
  constructor() {
    // Using Fast2SMS - Popular Indian SMS service
    this.apiKey = process.env.FAST2SMS_API_KEY || 'your-fast2sms-api-key';
    this.baseURL = 'https://www.fast2sms.com/dev/bulkV2';
    
    // Backup service - TextLocal (also popular in India)
    this.textLocalApiKey = process.env.TEXTLOCAL_API_KEY || 'your-textlocal-api-key';
    this.textLocalURL = 'https://api.textlocal.in/send/';
    
    // For demo purposes, we'll use a mock service that logs the SMS
    this.isDemoMode = true; // Set to false in production
  }

  /**
   * Send SMS to field officer
   */
  async sendFieldOfficerAssignment(phoneNumber, ticketData) {
    try {
      const message = this.formatAssignmentMessage(ticketData);
      
      if (this.isDemoMode) {
        // Demo mode - just log the SMS
        console.log('\n🚨 === GOVERNMENT SMS ALERT ===');
        console.log(`📱 TO: +91-${phoneNumber}`);
        console.log(`📄 MESSAGE: ${message}`);
        console.log('🏛️ === END SMS ===\n');
        
        // Return success for demo
        return {
          success: true,
          messageId: 'DEMO-' + Date.now(),
          message: 'SMS sent successfully (Demo Mode)',
          phoneNumber: phoneNumber,
          content: message
        };
      }
      
      // Try Fast2SMS first
      const result = await this.sendViaFast2SMS(phoneNumber, message);
      if (result.success) {
        return result;
      }
      
      // Fallback to TextLocal
      return await this.sendViaTextLocal(phoneNumber, message);
      
    } catch (error) {
      console.error('SMS Service Error:', error);
      return {
        success: false,
        error: error.message,
        phoneNumber: phoneNumber
      };
    }
  }

  /**
   * Format assignment message for field officer
   */
  formatAssignmentMessage(ticketData) {
    const message = `🏛️ GOVT ALERT: New ticket assigned to you

TICKET: ${ticketData.ticketId}
CATEGORY: ${ticketData.category}
LOCATION: ${ticketData.address}
PRIORITY: ${ticketData.priority}

DETAILS: ${ticketData.description}

Report to location immediately. Contact control room for updates.

- Government of India
- Civic Redressal Portal`;

    return message;
  }

  /**
   * Send via Fast2SMS (Indian SMS service)
   */
  async sendViaFast2SMS(phoneNumber, message) {
    try {
      const response = await axios.post(this.baseURL, {
        sender_id: 'GOVIND',
        message: message,
        language: 'english',
        route: 'q',
        numbers: phoneNumber
      }, {
        headers: {
          'authorization': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.return === true) {
        return {
          success: true,
          messageId: response.data.request_id,
          message: 'SMS sent via Fast2SMS',
          phoneNumber: phoneNumber,
          service: 'Fast2SMS'
        };
      }
      
      throw new Error(response.data.message || 'Fast2SMS failed');
      
    } catch (error) {
      console.error('Fast2SMS Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        service: 'Fast2SMS'
      };
    }
  }

  /**
   * Send via TextLocal (Alternative Indian SMS service)
   */
  async sendViaTextLocal(phoneNumber, message) {
    try {
      const params = new URLSearchParams();
      params.append('apikey', this.textLocalApiKey);
      params.append('numbers', `91${phoneNumber}`);
      params.append('message', message);
      params.append('sender', 'GOVIND');

      const response = await axios.post(this.textLocalURL, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.status === 'success') {
        return {
          success: true,
          messageId: response.data.batch_id,
          message: 'SMS sent via TextLocal',
          phoneNumber: phoneNumber,
          service: 'TextLocal'
        };
      }
      
      throw new Error(response.data.errors?.[0]?.message || 'TextLocal failed');
      
    } catch (error) {
      console.error('TextLocal Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        service: 'TextLocal'
      };
    }
  }

  /**
   * Send escalation SMS
   */
  async sendEscalationAlert(phoneNumber, ticketData) {
    try {
      const message = `🚨 URGENT GOVT ALERT: Ticket escalated

TICKET: ${ticketData.ticketId}
ESCALATION LEVEL: ${ticketData.escalationLevel}
SLA BREACH: YES
LOCATION: ${ticketData.address}

Immediate action required. Contact senior officer immediately.

- Government of India Control Room`;

      return await this.sendFieldOfficerAssignment(phoneNumber, {
        ...ticketData,
        description: message
      });
      
    } catch (error) {
      console.error('Escalation SMS Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send bulk SMS to multiple officers
   */
  async sendBulkAssignment(phoneNumbers, ticketData) {
    const results = [];
    
    for (const phoneNumber of phoneNumbers) {
      const result = await this.sendFieldOfficerAssignment(phoneNumber, ticketData);
      results.push({
        phoneNumber,
        ...result
      });
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return {
      success: true,
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      results: results
    };
  }
}

module.exports = new SMSService();
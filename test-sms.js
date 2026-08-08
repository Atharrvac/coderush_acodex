/**
 * Test SMS functionality
 */

const axios = require('axios');

async function testSMSAssignment() {
  try {
    console.log('🏛️ Testing Government SMS Assignment...\n');
    
    // Test data - using a real ticket ID format
    const testData = {
      ticketId: '12345678-1234-1234-1234-123456789abc', // Mock UUID format
      category: 'road'
    };
    
    console.log('📤 Sending SMS assignment request...');
    console.log('📱 Target Phone: 8767040957');
    console.log('🎫 Ticket ID:', testData.ticketId.substring(0, 8).toUpperCase());
    console.log('📂 Category:', testData.category.toUpperCase());
    
    const response = await axios.post('http://localhost:3000/api/v1/sms/assign-officer', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('\n✅ SMS API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n🎉 SUCCESS! SMS would be sent to field officer.');
      console.log('📱 Phone:', response.data.phoneNumber);
      console.log('🆔 Message ID:', response.data.smsDetails?.messageId);
    } else {
      console.log('\n❌ FAILED:', response.data.error);
    }
    
  } catch (error) {
    console.error('\n💥 ERROR:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🚨 Backend server is not running!');
      console.log('   Start it with: cd backend && npm start');
    }
  }
}

// Run the test
testSMSAssignment();
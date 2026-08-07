/**
 * Setup Officer Account Script
 * Run this to create demo officer accounts
 */

const { supabase } = require('./src/config/supabase');
const bcrypt = require('bcryptjs');

async function setupOfficerAccounts() {
  try {
    console.log('🚀 Setting up officer accounts...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create officer account
    const { data: officer, error: officerError } = await supabase
      .from('users')
      .upsert({
        email: 'officer.demo@gov.in',
        name: 'Demo Officer',
        password: hashedPassword,
        role: 'officer',
        is_active: true
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (officerError) {
      console.error('Officer creation error:', officerError);
    } else {
      console.log('✅ Officer account created:', officer.email);
    }

    // Create department head account
    const { data: head, error: headError } = await supabase
      .from('users')
      .upsert({
        email: 'head.demo@gov.in',
        name: 'Demo Department Head',
        password: hashedPassword,
        role: 'department_head',
        is_active: true
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (headError) {
      console.error('Department head creation error:', headError);
    } else {
      console.log('✅ Department head account created:', head.email);
    }

    // Create admin account
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .upsert({
        email: 'admin.demo@gov.in',
        name: 'Demo Admin',
        password: hashedPassword,
        role: 'admin',
        is_active: true
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (adminError) {
      console.error('Admin creation error:', adminError);
    } else {
      console.log('✅ Admin account created:', admin.email);
    }

    console.log('\n🎉 Officer accounts setup complete!');
    console.log('\n📋 Login Credentials:');
    console.log('👮 Officer: officer.demo@gov.in / password123');
    console.log('👨‍💼 Department Head: head.demo@gov.in / password123');
    console.log('👨‍💻 Admin: admin.demo@gov.in / password123');
    console.log('\n🌐 You can now login at: http://localhost:8081');

  } catch (error) {
    console.error('Setup error:', error);
  }
}

// Run the setup
setupOfficerAccounts();
// Test file for notifications templates API
// Run with: node test_templates.js

const API_URL = 'http://localhost:3000/api/v1/notifications/templates';

// You need to replace this with a valid JWT token from localStorage
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';

async function testGetTemplates() {
  console.log('🔍 Testing GET /templates...');
  try {
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ GET Templates Success!');
      console.log(`   Found ${data.templates?.length || 0} templates`);
      return data.templates || [];
    } else {
      console.log('❌ GET Templates Failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testCreateTemplate() {
  console.log('\n📝 Testing POST /templates...');
  
  const newTemplate = {
    code: 'test_template_' + Date.now(),
    name: 'قالب اختبار',
    description: 'قالب لاختبار الوظائف',
    type: 'SYSTEM',
    priority: 'MEDIUM',
    titleAr: 'عنوان الاختبار {{userName}}',
    messageAr: 'رسالة اختبار يا {{userName}}',
    channels: ['IN_APP', 'EMAIL'],
    emailSubjectAr: 'موضوع البريد للاختبار',
    emailBodyAr: 'محتوى البريد يا {{userName}}',
    isActive: true,
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(newTemplate),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Create Template Success!');
      console.log('   Template ID:', data.id);
      return data;
    } else {
      const error = await response.json();
      console.log('❌ Create Failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testUpdateTemplate(id) {
  console.log('\n✏️ Testing PATCH /templates/:id...');
  
  const updates = {
    name: 'قالب اختبار محدّث',
    isActive: false,
  };

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(updates),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Update Template Success!');
      console.log('   Updated name:', data.name);
      console.log('   Active:', data.isActive);
    } else {
      const error = await response.json();
      console.log('❌ Update Failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testDeleteTemplate(id) {
  console.log('\n🗑️ Testing DELETE /templates/:id...');
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    });
    
    if (response.ok) {
      console.log('✅ Delete Template Success!');
    } else {
      const error = await response.json();
      console.log('❌ Delete Failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Templates API Tests\n');
  console.log('='.repeat(50));
  
  // Test 1: Get all templates
  const templates = await testGetTemplates();
  
  // Test 2: Create new template
  const newTemplate = await testCreateTemplate();
  
  if (newTemplate?.id) {
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Update template
    await testUpdateTemplate(newTemplate.id);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Delete template
    await testDeleteTemplate(newTemplate.id);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
  console.log('\n💡 Tips:');
  console.log('   - Make sure to replace AUTH_TOKEN with valid JWT');
  console.log('   - Run this after starting the API server');
  console.log('   - Check http://localhost:3001/notifications/templates');
}

// Run tests if AUTH_TOKEN is set
if (AUTH_TOKEN !== 'YOUR_JWT_TOKEN_HERE') {
  runAllTests();
} else {
  console.log('⚠️ Please set AUTH_TOKEN before running tests');
  console.log('   1. Login at http://localhost:3001/login');
  console.log('   2. Open DevTools > Application > Local Storage');
  console.log('   3. Copy the "token" value');
  console.log('   4. Replace AUTH_TOKEN in this file');
}

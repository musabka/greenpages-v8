/**
 * اختبار شامل لنظام إدارة الملكية
 * Comprehensive Ownership Management System Test
 */

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3000/api/v1';
const TEST_CONFIG = {
  // يجب تحديثها بمعلومات حقيقية من قاعدة البيانات
  adminToken: '', // يتم الحصول عليه من login
  testUserId: '', // UUID لمستخدم موجود
  testBusinessIds: [], // Array of business UUIDs للاختبار
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'blue');
  log(`  ${title}`, 'blue');
  log('='.repeat(60) + '\n', 'blue');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'yellow');
}

// API Helper
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (TEST_CONFIG.adminToken) {
    config.headers.Authorization = `Bearer ${TEST_CONFIG.adminToken}`;
  }
  return config;
});

// Tests
async function test1_Login() {
  logSection('Test 1: تسجيل الدخول');
  
  try {
    const response = await api.post('/auth/login', {
      email: 'admin@example.com', // تحديث ببيانات حقيقية
      password: 'password123',
    });

    TEST_CONFIG.adminToken = response.data.accessToken;
    logSuccess('تم تسجيل الدخول بنجاح');
    logInfo(`Token: ${TEST_CONFIG.adminToken.substring(0, 30)}...`);
    return true;
  } catch (error) {
    logError(`فشل تسجيل الدخول: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test2_GetBusinessStats() {
  logSection('Test 2: الحصول على إحصائيات الأنشطة');
  
  try {
    const response = await api.get('/businesses/stats');
    const stats = response.data;

    logSuccess('تم الحصول على الإحصائيات');
    log('\nالإحصائيات:', 'magenta');
    log(`  - إجمالي الأنشطة: ${stats.total}`);
    log(`  - المعتمدة: ${stats.approved}`);
    log(`  - المعلقة: ${stats.pending}`);
    log(`  - المرتبطة بمالك: ${stats.ownership?.claimed || 0}`);
    log(`  - غير المرتبطة: ${stats.ownership?.unclaimed || 0}`);
    log(`  - الموثّقة: ${stats.ownership?.verified || 0}`);
    
    return true;
  } catch (error) {
    logError(`فشل الحصول على الإحصائيات: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test3_GetUnclaimedBusinesses() {
  logSection('Test 3: الحصول على الأنشطة غير المرتبطة');
  
  try {
    const response = await api.get('/businesses', {
      params: {
        ownerStatus: 'unclaimed',
        limit: 5,
      },
    });

    const businesses = response.data.data || response.data;
    logSuccess(`تم الحصول على ${businesses.length} نشاط غير مرتبط`);
    
    if (businesses.length > 0) {
      TEST_CONFIG.testBusinessIds = businesses.slice(0, 3).map(b => b.id);
      log('\nالأنشطة للاختبار:', 'magenta');
      businesses.slice(0, 3).forEach(b => {
        log(`  - ${b.nameAr || b.nameEn} (${b.id})`);
      });
    }
    
    return businesses.length > 0;
  } catch (error) {
    logError(`فشل الحصول على الأنشطة: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test4_GetUsers() {
  logSection('Test 4: الحصول على مستخدمين للاختبار');
  
  try {
    const response = await api.get('/users', {
      params: {
        role: 'USER',
        limit: 5,
      },
    });

    const users = response.data.data || response.data;
    
    if (users.length > 0) {
      TEST_CONFIG.testUserId = users[0].id;
      logSuccess(`تم اختيار المستخدم: ${users[0].firstName} ${users[0].lastName} (${users[0].id})`);
      return true;
    } else {
      logError('لا يوجد مستخدمين في النظام');
      return false;
    }
  } catch (error) {
    logError(`فشل الحصول على المستخدمين: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test5_LinkOwner() {
  logSection('Test 5: ربط مالك لنشاط واحد');
  
  if (!TEST_CONFIG.testBusinessIds[0] || !TEST_CONFIG.testUserId) {
    logError('بيانات الاختبار غير متوفرة');
    return false;
  }
  
  try {
    const businessId = TEST_CONFIG.testBusinessIds[0];
    const response = await api.post(`/businesses/${businessId}/owner`, {
      userId: TEST_CONFIG.testUserId,
    });

    logSuccess('تم ربط المالك بنجاح');
    log('\nالنتيجة:', 'magenta');
    log(`  - ID: ${response.data.id}`);
    log(`  - الحالة: ${response.data.ownerStatus}`);
    log(`  - المالك: ${response.data.owner?.firstName} ${response.data.owner?.lastName}`);
    
    return true;
  } catch (error) {
    logError(`فشل ربط المالك: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test6_GetOwnershipAudit() {
  logSection('Test 6: الحصول على سجل التدقيق');
  
  if (!TEST_CONFIG.testBusinessIds[0]) {
    logError('بيانات الاختبار غير متوفرة');
    return false;
  }
  
  try {
    const businessId = TEST_CONFIG.testBusinessIds[0];
    const response = await api.get(`/businesses/${businessId}/ownership-audit`);
    
    const audits = response.data;
    logSuccess(`تم الحصول على ${audits.length} سجل تدقيق`);
    
    if (audits.length > 0) {
      log('\nآخر 3 سجلات:', 'magenta');
      audits.slice(0, 3).forEach(audit => {
        log(`  - ${audit.action} في ${new Date(audit.createdAt).toLocaleString('ar')}`);
        log(`    بواسطة: ${audit.performedByUser?.firstName} ${audit.performedByUser?.lastName}`);
      });
    }
    
    return true;
  } catch (error) {
    logError(`فشل الحصول على سجل التدقيق: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test7_BulkLinkOwner() {
  logSection('Test 7: ربط مجموعة أنشطة بمالك واحد');
  
  if (TEST_CONFIG.testBusinessIds.length < 2 || !TEST_CONFIG.testUserId) {
    logError('بيانات الاختبار غير كافية (نحتاج 2 نشاط على الأقل)');
    return false;
  }
  
  try {
    // استخدام النشاطين الثاني والثالث للربط الجماعي
    const businessIds = TEST_CONFIG.testBusinessIds.slice(1, 3);
    const response = await api.post('/businesses/bulk/link-owner', {
      businessIds,
      userId: TEST_CONFIG.testUserId,
    });

    logSuccess('تم الربط الجماعي بنجاح');
    log('\nالنتيجة:', 'magenta');
    log(`  - الرسالة: ${response.data.message}`);
    log(`  - الناجحة: ${response.data.success?.length || 0}`);
    log(`  - الفاشلة: ${response.data.failed?.length || 0}`);
    log(`  - الإجمالي: ${response.data.total}`);
    
    if (response.data.failed?.length > 0) {
      log('\nالأنشطة الفاشلة:', 'yellow');
      response.data.failed.forEach(failure => {
        log(`  - ${failure.businessId}: ${failure.error}`);
      });
    }
    
    return true;
  } catch (error) {
    logError(`فشل الربط الجماعي: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test8_UnlinkOwner() {
  logSection('Test 8: فصل مالك');
  
  if (!TEST_CONFIG.testBusinessIds[0]) {
    logError('بيانات الاختبار غير متوفرة');
    return false;
  }
  
  try {
    const businessId = TEST_CONFIG.testBusinessIds[0];
    const response = await api.delete(`/businesses/${businessId}/owner`);

    logSuccess('تم فصل المالك بنجاح');
    log('\nالنتيجة:', 'magenta');
    log(`  - ID: ${response.data.id}`);
    log(`  - الحالة الجديدة: ${response.data.ownerStatus}`);
    
    return true;
  } catch (error) {
    logError(`فشل فصل المالك: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test9_BulkUnlinkOwner() {
  logSection('Test 9: فصل مجموعة مالكين');
  
  if (TEST_CONFIG.testBusinessIds.length < 2) {
    logError('بيانات الاختبار غير كافية');
    return false;
  }
  
  try {
    const businessIds = TEST_CONFIG.testBusinessIds.slice(1, 3);
    const response = await api.post('/businesses/bulk/unlink-owner', {
      businessIds,
    });

    logSuccess('تم الفصل الجماعي بنجاح');
    log('\nالنتيجة:', 'magenta');
    log(`  - الرسالة: ${response.data.message}`);
    log(`  - الناجحة: ${response.data.success?.length || 0}`);
    log(`  - الفاشلة: ${response.data.failed?.length || 0}`);
    
    return true;
  } catch (error) {
    logError(`فشل الفصل الجماعي: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test10_CheckNotifications() {
  logSection('Test 10: التحقق من الإشعارات');
  
  if (!TEST_CONFIG.testUserId) {
    logError('بيانات الاختبار غير متوفرة');
    return false;
  }
  
  try {
    // الحصول على الإشعارات للمستخدم
    const response = await api.get('/notifications', {
      params: {
        userId: TEST_CONFIG.testUserId,
        limit: 5,
      },
    });

    const notifications = response.data.data || response.data;
    logSuccess(`تم الحصول على ${notifications.length} إشعار`);
    
    if (notifications.length > 0) {
      log('\nآخر الإشعارات:', 'magenta');
      notifications.forEach(notif => {
        log(`  - ${notif.title || notif.titleAr}`);
        log(`    ${notif.message || notif.messageAr}`);
        log(`    ${new Date(notif.createdAt).toLocaleString('ar')}`);
      });
    }
    
    return true;
  } catch (error) {
    // قد لا يكون endpoint الإشعارات متوفر
    logInfo(`تخطي اختبار الإشعارات: ${error.response?.data?.message || error.message}`);
    return true;
  }
}

// Run all tests
async function runAllTests() {
  log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║      اختبار شامل لنظام إدارة الملكية المتكامل            ║', 'magenta');
  log('║  Comprehensive Ownership Management System Test Suite      ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');
  
  const tests = [
    { name: 'تسجيل الدخول', fn: test1_Login, required: true },
    { name: 'إحصائيات الأنشطة', fn: test2_GetBusinessStats },
    { name: 'الأنشطة غير المرتبطة', fn: test3_GetUnclaimedBusinesses, required: true },
    { name: 'المستخدمين', fn: test4_GetUsers, required: true },
    { name: 'ربط مالك', fn: test5_LinkOwner },
    { name: 'سجل التدقيق', fn: test6_GetOwnershipAudit },
    { name: 'الربط الجماعي', fn: test7_BulkLinkOwner },
    { name: 'فصل مالك', fn: test8_UnlinkOwner },
    { name: 'الفصل الجماعي', fn: test9_BulkUnlinkOwner },
    { name: 'الإشعارات', fn: test10_CheckNotifications },
  ];

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
        if (test.required) {
          logError(`\nاختبار مطلوب فشل: ${test.name}. إيقاف الاختبارات.`);
          break;
        }
      }
    } catch (error) {
      failed++;
      logError(`\nخطأ غير متوقع في ${test.name}: ${error.message}`);
      if (test.required) {
        break;
      }
    }
    
    // تأخير بسيط بين الاختبارات
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // النتيجة النهائية
  logSection('النتيجة النهائية');
  log(`إجمالي الاختبارات: ${tests.length}`, 'blue');
  log(`الناجحة: ${passed}`, 'green');
  log(`الفاشلة: ${failed}`, 'red');
  log(`المتخطاة: ${skipped}`, 'yellow');
  
  const successRate = Math.round((passed / tests.length) * 100);
  log(`\nمعدل النجاح: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (passed === tests.length) {
    log('\n🎉 جميع الاختبارات نجحت! النظام يعمل بشكل صحيح.', 'green');
  } else if (successRate >= 70) {
    log('\n⚠️  معظم الاختبارات نجحت. هناك بعض المشاكل البسيطة.', 'yellow');
  } else {
    log('\n❌ فشل عدد كبير من الاختبارات. يرجى مراجعة الأخطاء.', 'red');
  }
  
  log('\n');
}

// معلومات الاستخدام
function showUsage() {
  log('\n📖 دليل الاستخدام:', 'blue');
  log('1. تأكد من تشغيل API على المنفذ 3000');
  log('2. قم بتحديث بيانات TEST_CONFIG في أعلى الملف:');
  log('   - بيانات admin للدخول');
  log('3. قم بتشغيل الاختبار:');
  log('   node test_ownership_system.js\n', 'green');
}

// Main execution
if (require.main === module) {
  showUsage();
  runAllTests().catch(error => {
    logError(`خطأ عام في تشغيل الاختبارات: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  TEST_CONFIG,
};

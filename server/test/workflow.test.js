import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('--- STARTING PHARMATRACK AUTOMATED WORKFLOW TESTS ---');

  // Test 1: Authentication & Demo Accounts
  console.log('[Test 1] Testing authentication for all 3 roles...');

  // Admin Login
  const adminRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@pharmatrack.com', password: 'Admin@123' })
  }).then(r => r.json());

  assert.strictEqual(adminRes.success, true, 'Admin login should succeed');
  assert.strictEqual(adminRes.user.role, 'ADMIN', 'Admin role should be ADMIN');
  const adminToken = adminRes.token;
  console.log('✓ Admin authentication verified.');

  // Inventory Manager Login
  const invRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'inventory@pharmatrack.com', password: 'Inventory@123' })
  }).then(r => r.json());

  assert.strictEqual(invRes.success, true);
  assert.strictEqual(invRes.user.role, 'INVENTORY_MANAGER');
  const invToken = invRes.token;
  console.log('✓ Inventory Manager authentication verified.');

  // Warehouse Manager Login
  const whRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'warehouse@pharmatrack.com', password: 'Warehouse@123' })
  }).then(r => r.json());

  assert.strictEqual(whRes.success, true);
  assert.strictEqual(whRes.user.role, 'WAREHOUSE_MANAGER');
  const whToken = whRes.token;
  console.log('✓ Warehouse Manager authentication verified.');

  // Invalid Login
  const failRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@pharmatrack.com', password: 'WrongPassword' })
  });
  assert.strictEqual(failRes.status, 401, 'Invalid password should return 401');
  console.log('✓ Invalid credentials properly rejected.');

  // Test 2: Role-Based Authorization Guard
  console.log('[Test 2] Testing RBAC guards...');
  const auditWhRes = await fetch(`${BASE_URL}/audit-logs`, {
    headers: { Authorization: `Bearer ${whToken}` }
  });
  assert.strictEqual(auditWhRes.status, 403, 'Warehouse Manager should not access audit logs');

  const auditAdminRes = await fetch(`${BASE_URL}/audit-logs`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(auditAdminRes.status, 200, 'Admin should access audit logs');
  console.log('✓ Role-based access control verified (403 Forbidden for unauthorized roles).');

  // Test 3: FEFO Batch Recommendation
  console.log('[Test 3] Testing FEFO batch prioritization...');
  const products = await fetch(`${BASE_URL}/products?limit=50`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  }).then(r => r.json());

  const pcm = products.data.find(p => p.productCode === 'PRD-TAB-101');
  assert.ok(pcm, 'Paracetamol product should exist');

  const fefoRes = await fetch(`${BASE_URL}/batches/fefo-recommendations/${pcm._id}?quantity=500`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  }).then(r => r.json());

  assert.strictEqual(fefoRes.success, true);
  assert.ok(fefoRes.recommendations.allocations.length > 0);
  assert.strictEqual(fefoRes.recommendations.allocations[0].isFefoRecommended, true);
  console.log(`✓ FEFO prioritization verified: First recommended batch is ${fefoRes.recommendations.allocations[0].batchNumber}.`);

  // Test 4: Prevent Shipping Expired Batches
  console.log('[Test 4] Testing expired batch shipping guard...');
  const batches = await fetch(`${BASE_URL}/batches?limit=50`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  }).then(r => r.json());

  const expiredBatch = batches.data.find(b => b.expiryStatus === 'EXPIRED');
  const warehouses = await fetch(`${BASE_URL}/warehouses`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  }).then(r => r.json());

  if (expiredBatch) {
    const blockedShipmentRes = await fetch(`${BASE_URL}/shipments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceWarehouseId: warehouses.data[0]._id,
        destination: { facilityName: 'City Clinic', city: 'Mumbai' },
        carrier: 'ColdChain Express',
        expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
        items: [{ product: expiredBatch.product._id, batch: expiredBatch._id, quantity: 10 }]
      })
    });

    assert.strictEqual(blockedShipmentRes.status, 400, 'Expired batch shipment must be blocked with 400 Bad Request');
    const errBody = await blockedShipmentRes.json();
    console.log(`✓ Expired batch protection confirmed: "${errBody.message}"`);
  }

  // Test 5: Prevent Negative Stock
  console.log('[Test 5] Testing negative inventory prevention...');
  const excessiveMovementRes = await fetch(`${BASE_URL}/inventory/movement`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      movementType: 'OUTBOUND',
      productId: pcm._id,
      batchId: fefoRes.recommendations.allocations[0].batchId,
      sourceWarehouseId: warehouses.data[0]._id,
      quantity: 9999999, // Unreasonable quantity
      referenceNumber: 'TEST-OVERDRAW'
    })
  });
  assert.ok(excessiveMovementRes.status >= 400, 'Overdrawn movement should fail');
  console.log('✓ Overdrawing stock properly rejected by inventory engine.');

  // Test 6: AI Assistant Grounded Queries
  console.log('[Test 6] Testing AI Assistant live database query...');
  const aiRes = await fetch(`${BASE_URL}/ai/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: 'Which products are low on stock?' })
  }).then(r => r.json());

  assert.strictEqual(aiRes.success, true);
  assert.strictEqual(aiRes.intent, 'LOW_STOCK_QUERY');
  assert.ok(aiRes.answer.includes('below minimum stock levels'));
  console.log('✓ Grounded AI Assistant returned validated real-time data.');

  console.log('\n======================================================');
  console.log('🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY! (6/6)');
  console.log('======================================================');
};

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
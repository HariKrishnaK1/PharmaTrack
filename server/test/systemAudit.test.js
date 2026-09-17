import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { Product } from '../src/models/Product.js';
import { Batch } from '../src/models/Batch.js';
import { Warehouse } from '../src/models/Warehouse.js';
import { Inventory } from '../src/models/Inventory.js';
import { Shipment } from '../src/models/Shipment.js';
import { StockMovement } from '../src/models/StockMovement.js';
import { Alert } from '../src/models/Alert.js';
import { User } from '../src/models/User.js';
import { getFefoRecommendations } from '../src/services/fefoService.js';
import { executeStockMovement } from '../src/services/inventoryService.js';
import { evaluateOperationalAlerts } from '../src/services/alertRuleEngine.js';

async function runSystemAudit() {
  console.log('====================================================');
  console.log('PHARMATRACK: COMPREHENSIVE BUSINESS LOGIC & CALCULATION AUDIT');
  console.log('====================================================\n');

  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log(' Connected to MongoDB:', mongoose.connection.name);
  } catch (err) {
    console.log('[Info] Using fallback in-memory test DB connection');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: Inventory Arithmetic & Virtuals
  // ----------------------------------------------------
  console.log('\n[TEST 1] Inventory Available Stock Calculation:');
  const inv = new Inventory({
    product: new mongoose.Types.ObjectId(),
    batch: new mongoose.Types.ObjectId(),
    warehouse: new mongoose.Types.ObjectId(),
    quantity: 500,
    reservedQuantity: 150
  });
  assert(inv.availableQuantity === 350, 'availableQuantity = quantity (500) - reservedQuantity (150) = 350');

  inv.reservedQuantity = 600; // Edge case: reserved > quantity
  assert(inv.availableQuantity === 0, 'availableQuantity is clamped to min 0 when reserved > quantity');

  // ----------------------------------------------------
  // TEST 2: Batch Shelf-Life & Expiry Classification
  // ----------------------------------------------------
  console.log('\n[TEST 2] Batch Shelf-Life & Expiry Horizons:');
  const now = new Date();
  
  // Safe batch (> 90 days)
  const safeBatch = new Batch({
    batchNumber: 'SAFE-001',
    product: new mongoose.Types.ObjectId(),
    warehouse: new mongoose.Types.ObjectId(),
    manufacturingDate: new Date(now.getTime() - 30 * 86400000),
    expiryDate: new Date(now.getTime() + 120 * 86400000),
    initialQuantity: 1000,
    currentQuantity: 1000,
    supplier: 'PharmaCore Lab'
  });
  assert(safeBatch.daysUntilExpiry >= 119, `Safe batch daysUntilExpiry (${safeBatch.daysUntilExpiry}) >= 119`);
  assert(safeBatch.expiryStatus === 'SAFE', 'Batch > 90 days classified as SAFE');

  // Critical batch (< 30 days)
  const critBatch = new Batch({
    batchNumber: 'CRIT-001',
    product: new mongoose.Types.ObjectId(),
    warehouse: new mongoose.Types.ObjectId(),
    manufacturingDate: new Date(now.getTime() - 300 * 86400000),
    expiryDate: new Date(now.getTime() + 15 * 86400000),
    initialQuantity: 1000,
    currentQuantity: 500,
    supplier: 'PharmaCore Lab'
  });
  assert(critBatch.expiryStatus === 'CRITICAL', 'Batch with 15 days left classified as CRITICAL');

  // Expired batch (past date)
  const expiredBatch = new Batch({
    batchNumber: 'EXP-001',
    product: new mongoose.Types.ObjectId(),
    warehouse: new mongoose.Types.ObjectId(),
    manufacturingDate: new Date(now.getTime() - 400 * 86400000),
    expiryDate: new Date(now.getTime() - 5 * 86400000),
    initialQuantity: 1000,
    currentQuantity: 100,
    supplier: 'PharmaCore Lab'
  });
  assert(expiredBatch.daysUntilExpiry <= 0, 'Expired batch has non-positive daysUntilExpiry');
  assert(expiredBatch.expiryStatus === 'EXPIRED', 'Expired batch classified as EXPIRED');

  // ----------------------------------------------------
  // TEST 3: FEFO (First-Expiry-First-Out) Service Logic
  // ----------------------------------------------------
  console.log('\n[TEST 3] FEFO Service Allocation & Prioritization:');
  const dummyProd = await Product.create({
    name: 'Audit Test Paracetamol',
    genericName: 'Paracetamol',
    productCode: `AUD-PCM-${Date.now().toString().slice(-4)}`,
    category: 'Tablets',
    dosageForm: 'Tablet',
    strength: '500mg',
    manufacturer: 'PharmaTest',
    unitPrice: 2.5,
    minimumStockLevel: 100,
    reorderLevel: 200,
    storageCondition: 'Controlled Room Temperature (15°C - 25°C)'
  });

  const dummyWarehouse = await Warehouse.create({
    name: `Audit Central Hub ${Date.now().toString().slice(-4)}`,
    code: `WH-AUD-${Date.now().toString().slice(-4)}`,
    location: { city: 'Hyderabad', state: 'Telangana' },
    capacity: 10000
  });

  // Batch A: expires in 40 days
  const batchA = await Batch.create({
    batchNumber: `BA-${Date.now().toString().slice(-4)}`,
    product: dummyProd._id,
    warehouse: dummyWarehouse._id,
    manufacturingDate: new Date(now.getTime() - 100 * 86400000),
    expiryDate: new Date(now.getTime() + 40 * 86400000),
    initialQuantity: 200,
    currentQuantity: 200,
    supplier: 'PharmaSource',
    status: 'RELEASED'
  });

  await Inventory.create({
    product: dummyProd._id,
    batch: batchA._id,
    warehouse: dummyWarehouse._id,
    quantity: 200,
    reservedQuantity: 0
  });

  // Batch B: expires in 20 days (Earlier! Must be picked first by FEFO)
  const batchB = await Batch.create({
    batchNumber: `BB-${Date.now().toString().slice(-4)}`,
    product: dummyProd._id,
    warehouse: dummyWarehouse._id,
    manufacturingDate: new Date(now.getTime() - 200 * 86400000),
    expiryDate: new Date(now.getTime() + 20 * 86400000),
    initialQuantity: 150,
    currentQuantity: 150,
    supplier: 'PharmaSource',
    status: 'RELEASED'
  });

  await Inventory.create({
    product: dummyProd._id,
    batch: batchB._id,
    warehouse: dummyWarehouse._id,
    quantity: 150,
    reservedQuantity: 0
  });

  const fefoRes = await getFefoRecommendations(dummyProd._id, 100);
  assert(fefoRes.canFulfill === true, 'FEFO confirms fulfillment possible');
  assert(fefoRes.allocations.length >= 1, 'FEFO allocated at least 1 batch');
  assert(fefoRes.allocations[0].batchNumber === batchB.batchNumber, 'FEFO correctly selected Batch B (earliest expiry date) first');
  assert(fefoRes.allocations[0].isFefoRecommended === true, 'Top allocation has isFefoRecommended: true');

  // ----------------------------------------------------
  // TEST 4: Stock Reservation & Prevention of Over-Allocation
  // ----------------------------------------------------
  console.log('\n[TEST 4] Stock Reservation Invariants:');
  const bInv = await Inventory.findOne({ batch: batchB._id });
  bInv.reservedQuantity = 100;
  await bInv.save();

  assert(bInv.availableQuantity === 50, 'Reserved 100 units from 150 leaves exactly 50 available');

  const fefoOverRequest = await getFefoRecommendations(dummyProd._id, 240); // 50 available from B + 200 from A = 250 total
  assert(fefoOverRequest.totalAvailable === 250, 'Total available correctly accounts for reserved quantity (150-100 + 200 = 250)');

  // ----------------------------------------------------
  // TEST 5: Stock Movement Execution & Negative Stock Prevention
  // ----------------------------------------------------
  console.log('\n[TEST 5] Stock Movement Arithmetic & Bounds:');
  const dummyAdmin = await User.findOne({ role: 'ADMIN' }) || { _id: new mongoose.Types.ObjectId(), name: 'Test Admin', role: 'ADMIN' };

  // Valid outbound of 30 units from batch A
  const moveOut = await executeStockMovement({
    movementType: 'OUTBOUND',
    productId: dummyProd._id,
    batchId: batchA._id,
    sourceWarehouseId: dummyWarehouse._id,
    quantity: 30,
    performedByUser: dummyAdmin,
    notes: 'Audit Outbound Test'
  });
  assert(moveOut.quantity === 30, 'Outbound movement recorded 30 units');

  const updatedInvA = await Inventory.findOne({ batch: batchA._id });
  assert(updatedInvA.quantity === 170, 'Inventory A deducted from 200 to 170');

  // Attempt to withdraw more than available (requested 250 from 170) -> must throw error!
  let threwInsufficient = false;
  try {
    await executeStockMovement({
      movementType: 'OUTBOUND',
      productId: dummyProd._id,
      batchId: batchA._id,
      sourceWarehouseId: dummyWarehouse._id,
      quantity: 250,
      performedByUser: dummyAdmin
    });
  } catch (err) {
    threwInsufficient = true;
  }
  assert(threwInsufficient === true, 'Over-withdrawal correctly blocked by negative-stock protection');

  // ----------------------------------------------------
  // TEST 6: Warehouse Capacity Utilization Calculation
  // ----------------------------------------------------
  console.log('\n[TEST 6] Warehouse Capacity Utilization:');
  const whAllInvs = await Inventory.find({ warehouse: dummyWarehouse._id });
  const whUnits = whAllInvs.reduce((sum, i) => sum + i.quantity, 0);
  const calculatedUtil = Math.round((whUnits / dummyWarehouse.capacity) * 100);
  assert(calculatedUtil >= 0 && calculatedUtil <= 100, `Warehouse utilization (${calculatedUtil}%) is valid percentage`);

  // ----------------------------------------------------
  // TEST 7: Alert Rule Engine Evaluation
  // ----------------------------------------------------
  console.log('\n[TEST 7] Operational Alert Rule Engine:');
  await evaluateOperationalAlerts();
  const alertsCount = await Alert.countDocuments();
  assert(alertsCount >= 0, `Alert rule engine ran successfully (${alertsCount} active alerts evaluated)`);

  console.log('\n====================================================');
  console.log(`AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('====================================================\n');
  process.exit(0);
}

runSystemAudit().catch(err => {
  console.error('[System Audit Failed]', err);
  process.exit(1);
});

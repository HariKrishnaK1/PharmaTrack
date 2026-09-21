// Simulated Pharmaceutical Demonstration Dataset (Isolated from live database)

export const DEMO_USERS = [
  {
    _id: 'demo_admin',
    name: 'demoAdmin',
    email: 'demoadmin@pharmatrack.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    _id: 'demo_inventory',
    name: 'demoInventory',
    email: 'demoinventory@pharmatrack.com',
    role: 'INVENTORY_MANAGER',
    status: 'ACTIVE',
    createdAt: '2026-01-15T09:30:00.000Z'
  },
  {
    _id: 'demo_warehouse',
    name: 'demoWarehouse',
    email: 'demowarehouse@pharmatrack.com',
    role: 'WAREHOUSE_MANAGER',
    assignedWarehouse: 'wh_demo_1',
    status: 'ACTIVE',
    createdAt: '2026-02-01T11:00:00.000Z'
  }
];

export const DEMO_WAREHOUSES = [
  {
    _id: 'wh_demo_1',
    name: 'Mumbai Central Distribution Hub',
    code: 'WH-MUM-01',
    location: {
      address: 'Plot 42, Logistics Park, Bhiwandi',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '421302'
    },
    capacity: 150000,
    currentStock: 114200,
    utilizationPercent: 76,
    contactPhone: '+91 22 2847 1100',
    contactEmail: 'mumbai.hub@pharmatrack.internal',
    status: 'ACTIVE'
  },
  {
    _id: 'wh_demo_2',
    name: 'Delhi NCR Cold-Chain Logistics Hub',
    code: 'WH-DEL-02',
    location: {
      address: 'Sector 8, IMT Manesar',
      city: 'Gurugram',
      state: 'Haryana',
      country: 'India',
      postalCode: '122051'
    },
    capacity: 120000,
    currentStock: 78500,
    utilizationPercent: 65,
    contactPhone: '+91 124 492 8800',
    contactEmail: 'delhi.hub@pharmatrack.internal',
    status: 'ACTIVE'
  },
  {
    _id: 'wh_demo_3',
    name: 'Hyderabad Bio-Logistics Center',
    code: 'WH-HYD-03',
    location: {
      address: 'Genome Valley, Shamirpet',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      postalCode: '500078'
    },
    capacity: 100000,
    currentStock: 82000,
    utilizationPercent: 82,
    contactPhone: '+91 40 2344 5500',
    contactEmail: 'hyd.hub@pharmatrack.internal',
    status: 'ACTIVE'
  },
  {
    _id: 'wh_demo_4',
    name: 'Bengaluru Tech & Pharma Depo',
    code: 'WH-BLR-04',
    location: {
      address: 'Peenya Industrial Area Phase 2',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560058'
    },
    capacity: 90000,
    currentStock: 46800,
    utilizationPercent: 52,
    contactPhone: '+91 80 4112 3344',
    contactEmail: 'blr.depo@pharmatrack.internal',
    status: 'ACTIVE'
  },
  {
    _id: 'wh_demo_5',
    name: 'Chennai Port Regional Center',
    code: 'WH-CHN-05',
    location: {
      address: 'Harbour Logistics Zone, Ennore Expressway',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      postalCode: '600057'
    },
    capacity: 80000,
    currentStock: 48900,
    utilizationPercent: 61,
    contactPhone: '+91 44 2655 7788',
    contactEmail: 'chennai.rc@pharmatrack.internal',
    status: 'ACTIVE'
  }
];

export const DEMO_PRODUCTS = [
  {
    _id: 'prod_demo_1',
    name: 'Amoxicillin & Potassium Clavulanate 625mg',
    genericName: 'Amoxicillin + Clavulanic Acid',
    productCode: 'PRD-TAB-001',
    category: 'Tablets',
    dosageForm: 'Film-coated Tablet',
    strength: '500mg / 125mg',
    manufacturer: 'Sun Pharma Ltd',
    unitOfMeasure: 'Strips',
    minimumStockLevel: 2500,
    reorderLevel: 5000,
    currentTotalStock: 8400,
    unitPrice: 185.00,
    description: 'Broad-spectrum antibiotic formulation for acute bacterial respiratory and urinary infections.',
    status: 'ACTIVE'
  },
  {
    _id: 'prod_demo_2',
    name: 'Paracetamol Controlled Release 650mg',
    genericName: 'Acetaminophen / Paracetamol',
    productCode: 'PRD-TAB-002',
    category: 'Tablets',
    dosageForm: 'Bilayer Tablet',
    strength: '650mg',
    manufacturer: 'Micro Labs Ltd',
    unitOfMeasure: 'Strips',
    minimumStockLevel: 10000,
    reorderLevel: 20000,
    currentTotalStock: 34500,
    unitPrice: 32.50,
    description: 'First-line antipyretic and analgesic with sustained release kinetic profile.',
    status: 'ACTIVE'
  },
  {
    _id: 'prod_demo_3',
    name: 'Insulin Glargine 100 IU/ml Solostar',
    genericName: 'Insulin Glargine Recombinant',
    productCode: 'PRD-BIO-003',
    category: 'Injectables',
    dosageForm: 'Prefilled Pen',
    strength: '100 IU/ml (3ml)',
    manufacturer: 'Sanofi India',
    unitOfMeasure: 'Pens',
    minimumStockLevel: 800,
    reorderLevel: 1500,
    currentTotalStock: 620, // Low stock demo alert trigger
    unitPrice: 640.00,
    description: 'Ultra-long-acting basal insulin analog requiring strict 2°C - 8°C cold chain maintenance.',
    status: 'ACTIVE'
  },
  {
    _id: 'prod_demo_4',
    name: 'Metformin Hydrochloride Prolonged Release 500mg',
    genericName: 'Metformin HCl',
    productCode: 'PRD-TAB-004',
    category: 'Tablets',
    dosageForm: 'Extended Release Tablet',
    strength: '500mg',
    manufacturer: 'Cipla Therapeutics',
    unitOfMeasure: 'Strips',
    minimumStockLevel: 5000,
    reorderLevel: 10000,
    currentTotalStock: 18200,
    unitPrice: 42.00,
    description: 'Standard biguanide anti-hyperglycemic agent for Type 2 Diabetes Mellitus glycemic regulation.',
    status: 'ACTIVE'
  },
  {
    _id: 'prod_demo_5',
    name: 'Atorvastatin Calcium Trihydrate 20mg',
    genericName: 'Atorvastatin',
    productCode: 'PRD-TAB-005',
    category: 'Tablets',
    dosageForm: 'Film-coated Tablet',
    strength: '20mg',
    manufacturer: 'Dr. Reddy Laboratories',
    unitOfMeasure: 'Strips',
    minimumStockLevel: 3000,
    reorderLevel: 6000,
    currentTotalStock: 11400,
    unitPrice: 98.00,
    description: 'HMG-CoA reductase inhibitor for lipid and cardiovascular risk reduction.',
    status: 'ACTIVE'
  },
  {
    _id: 'prod_demo_6',
    name: 'Ceftriaxone Sodium Sterile Injection 1g',
    genericName: 'Ceftriaxone Sodium',
    productCode: 'PRD-INJ-006',
    category: 'Injectables',
    dosageForm: 'Powder for Reconstitution Vial',
    strength: '1g Vial',
    manufacturer: 'Alkem Laboratories',
    unitOfMeasure: 'Vials',
    minimumStockLevel: 1200,
    reorderLevel: 2500,
    currentTotalStock: 4100,
    unitPrice: 74.00,
    description: 'Third-generation cephalosporin antibiotic for systemic hospital infections.',
    status: 'ACTIVE'
  },
  {
    _id: 'prod_demo_7',
    name: 'Budesonide & Formoterol Inhaler 200/6',
    genericName: 'Budesonide + Formoterol Fumarate',
    productCode: 'PRD-INH-007',
    category: 'Inhalers',
    dosageForm: 'Metered Dose Inhaler (120 MDI)',
    strength: '200mcg / 6mcg',
    manufacturer: 'Cipla Respiratory',
    unitOfMeasure: 'Canisters',
    minimumStockLevel: 750,
    reorderLevel: 1500,
    currentTotalStock: 2150,
    unitPrice: 380.00,
    description: 'Maintenance bronchodilator corticosteroid aerosol for asthma and COPD.',
    status: 'ACTIVE'
  },
  {
    _id: 'prod_demo_8',
    name: 'Omeprazole Gastro-Resistant Capsules 20mg',
    genericName: 'Omeprazole',
    productCode: 'PRD-CAP-008',
    category: 'Capsules',
    dosageForm: 'Enteric Coated Capsule',
    strength: '20mg',
    manufacturer: 'Zydus Lifesciences',
    unitOfMeasure: 'Strips',
    minimumStockLevel: 4000,
    reorderLevel: 8000,
    currentTotalStock: 14800,
    unitPrice: 55.00,
    description: 'Proton-pump inhibitor for gastroesophageal reflux and peptic ulcer prophylaxis.',
    status: 'ACTIVE'
  }
];

export const DEMO_BATCHES = [
  {
    _id: 'batch_demo_1',
    batchNumber: 'BAT-2026-AMX-001',
    product: DEMO_PRODUCTS[0],
    warehouse: DEMO_WAREHOUSES[0],
    quantity: 8400,
    initialQuantity: 10000,
    manufacturingDate: '2026-01-10T00:00:00.000Z',
    expiryDate: '2027-12-31T00:00:00.000Z',
    status: 'RELEASED',
    daysUntilExpiry: 649,
    storageConditions: 'Store below 25°C, protect from moisture',
    qcTestedBy: 'QC Lead Dr. V. Menon',
    qcReleaseDate: '2026-01-14T10:00:00.000Z'
  },
  {
    _id: 'batch_demo_2',
    batchNumber: 'BAT-2026-PCM-002',
    product: DEMO_PRODUCTS[1],
    warehouse: DEMO_WAREHOUSES[1],
    quantity: 34500,
    initialQuantity: 40000,
    manufacturingDate: '2026-02-01T00:00:00.000Z',
    expiryDate: '2028-01-31T00:00:00.000Z',
    status: 'RELEASED',
    daysUntilExpiry: 680,
    storageConditions: 'Controlled room temperature (15°C - 25°C)',
    qcTestedBy: 'QC Lead Dr. V. Menon',
    qcReleaseDate: '2026-02-05T14:00:00.000Z'
  },
  {
    _id: 'batch_demo_3',
    batchNumber: 'BAT-2026-INS-003',
    product: DEMO_PRODUCTS[2],
    warehouse: DEMO_WAREHOUSES[2],
    quantity: 620,
    initialQuantity: 2000,
    manufacturingDate: '2025-10-15T00:00:00.000Z',
    expiryDate: '2026-10-15T00:00:00.000Z', // 24 days left - near expiry demo trigger!
    status: 'RELEASED',
    daysUntilExpiry: 24,
    storageConditions: 'Cold Chain: 2°C - 8°C (Do Not Freeze)',
    qcTestedBy: 'Bio-Logistics Quality Officer',
    qcReleaseDate: '2025-10-20T09:00:00.000Z'
  },
  {
    _id: 'batch_demo_4',
    batchNumber: 'BAT-2026-MET-004',
    product: DEMO_PRODUCTS[3],
    warehouse: DEMO_WAREHOUSES[0],
    quantity: 18200,
    initialQuantity: 20000,
    manufacturingDate: '2026-03-01T00:00:00.000Z',
    expiryDate: '2028-02-28T00:00:00.000Z',
    status: 'RELEASED',
    daysUntilExpiry: 708,
    storageConditions: 'Store below 30°C',
    qcTestedBy: 'Senior QC Analyst',
    qcReleaseDate: '2026-03-06T12:00:00.000Z'
  },
  {
    _id: 'batch_demo_5',
    batchNumber: 'BAT-2026-ATV-005',
    product: DEMO_PRODUCTS[4],
    warehouse: DEMO_WAREHOUSES[3],
    quantity: 11400,
    initialQuantity: 15000,
    manufacturingDate: '2026-01-20T00:00:00.000Z',
    expiryDate: '2027-11-30T00:00:00.000Z',
    status: 'RELEASED',
    daysUntilExpiry: 618,
    storageConditions: 'Store below 25°C',
    qcTestedBy: 'QC Lead Dr. V. Menon',
    qcReleaseDate: '2026-01-25T11:00:00.000Z'
  },
  {
    _id: 'batch_demo_6',
    batchNumber: 'BAT-2026-CTX-006',
    product: DEMO_PRODUCTS[5],
    warehouse: DEMO_WAREHOUSES[4],
    quantity: 4100,
    initialQuantity: 5000,
    manufacturingDate: '2026-02-15T00:00:00.000Z',
    expiryDate: '2027-08-31T00:00:00.000Z',
    status: 'RELEASED',
    daysUntilExpiry: 527,
    storageConditions: 'Protect from light. Store below 25°C',
    qcTestedBy: 'Quality Assurance Department',
    qcReleaseDate: '2026-02-20T16:00:00.000Z'
  }
];

export const DEMO_INVENTORY = DEMO_BATCHES.map((b, idx) => ({
  _id: `inv_demo_${idx + 1}`,
  product: b.product,
  batch: b,
  warehouse: b.warehouse,
  quantityOnHand: b.quantity,
  reservedQuantity: Math.floor(b.quantity * 0.08),
  availableQuantity: Math.floor(b.quantity * 0.92),
  reorderTriggered: b.quantity < (b.product?.minimumStockLevel || 0),
  locationInWarehouse: `Aisle ${idx + 2} - Rack ${String.fromCharCode(65 + idx)} - Shelf 0${idx + 1}`,
  lastAuditedAt: '2026-09-15T04:00:00.000Z'
}));

export const DEMO_SHIPMENTS = [
  {
    _id: 'shp_demo_1',
    shipmentNumber: 'SHP-2026-0089',
    sourceWarehouse: DEMO_WAREHOUSES[0],
    destination: {
      facilityName: 'Apollo Speciality Hospitals',
      address: 'Plot 13, Off Central Road, Navi Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra'
    },
    carrier: 'ColdChain Express Logistics',
    trackingNumber: 'CCE-IND-884920',
    temperatureRequirement: '2°C - 8°C (Strict Cold Chain)',
    status: 'IN_TRANSIT',
    expectedDeliveryDate: '2026-09-24T18:00:00.000Z',
    createdAt: '2026-09-21T08:30:00.000Z',
    notes: 'Urgent critical consignment for regional intensive care formulary.',
    items: [
      { product: DEMO_PRODUCTS[2], batch: DEMO_BATCHES[2], quantity: 250 },
      { product: DEMO_PRODUCTS[5], batch: DEMO_BATCHES[5], quantity: 400 }
    ],
    timeline: [
      { status: 'CREATED', timestamp: '2026-09-21T08:30:00.000Z', note: 'Consignment booked & cold-box verified' },
      { status: 'DISPATCHED', timestamp: '2026-09-21T10:15:00.000Z', note: 'Handed over to reefer truck MH-04-AB-1290' },
      { status: 'IN_TRANSIT', timestamp: '2026-09-21T12:00:00.000Z', note: 'GPS checkpoint: Pune-Mumbai Expressway (4.2°C)' }
    ]
  },
  {
    _id: 'shp_demo_2',
    shipmentNumber: 'SHP-2026-0088',
    sourceWarehouse: DEMO_WAREHOUSES[1],
    destination: {
      facilityName: 'Max Super Speciality Hospital',
      address: 'Saket Institutional Area',
      city: 'New Delhi',
      state: 'Delhi'
    },
    carrier: 'FastMed Logistics Ltd',
    trackingNumber: 'FML-DEL-331049',
    temperatureRequirement: 'Controlled Room Temperature (15°C - 25°C)',
    status: 'DELIVERED',
    expectedDeliveryDate: '2026-09-20T17:00:00.000Z',
    createdAt: '2026-09-19T09:00:00.000Z',
    notes: 'Monthly standard bulk replenishment.',
    items: [
      { product: DEMO_PRODUCTS[1], batch: DEMO_BATCHES[1], quantity: 5000 },
      { product: DEMO_PRODUCTS[3], batch: DEMO_BATCHES[3], quantity: 1800 }
    ],
    timeline: [
      { status: 'CREATED', timestamp: '2026-09-19T09:00:00.000Z', note: 'Consignment created' },
      { status: 'DISPATCHED', timestamp: '2026-09-19T13:00:00.000Z', note: 'Dispatched from IMT Manesar Hub' },
      { status: 'DELIVERED', timestamp: '2026-09-20T16:20:00.000Z', note: 'Received by Hospital Pharmacist Mr. Kapoor' }
    ]
  },
  {
    _id: 'shp_demo_3',
    shipmentNumber: 'SHP-2026-0087',
    sourceWarehouse: DEMO_WAREHOUSES[2],
    destination: {
      facilityName: 'Fortis Hospital Bannerghatta',
      address: '154/9, Opposite IIM-B, Bannerghatta Road',
      city: 'Bengaluru',
      state: 'Karnataka'
    },
    carrier: 'ColdChain Express Logistics',
    trackingNumber: 'CCE-BLR-992104',
    temperatureRequirement: 'Controlled Room Temperature (15°C - 25°C)',
    status: 'IN_TRANSIT',
    expectedDeliveryDate: '2026-09-23T14:00:00.000Z',
    createdAt: '2026-09-20T14:45:00.000Z',
    notes: 'Interstate highway transit with continuous IoT datalogger.',
    items: [
      { product: DEMO_PRODUCTS[0], batch: DEMO_BATCHES[0], quantity: 1200 },
      { product: DEMO_PRODUCTS[4], batch: DEMO_BATCHES[4], quantity: 800 }
    ],
    timeline: [
      { status: 'CREATED', timestamp: '2026-09-20T14:45:00.000Z', note: 'Prepared and sealed in Bio-Logistics Center' },
      { status: 'DISPATCHED', timestamp: '2026-09-20T18:00:00.000Z', note: 'Left Hyderabad facility' },
      { status: 'IN_TRANSIT', timestamp: '2026-09-21T06:30:00.000Z', note: 'Kurnool check-post passed, telemetry normal' }
    ]
  },
  {
    _id: 'shp_demo_4',
    shipmentNumber: 'SHP-2026-0086',
    sourceWarehouse: DEMO_WAREHOUSES[3],
    destination: {
      facilityName: 'Manipal Hospital Whitefield',
      address: 'EPIP Zone, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka'
    },
    carrier: 'Direct Pharma Fleet',
    trackingNumber: 'DPF-KA-118274',
    temperatureRequirement: 'Controlled Room Temperature (15°C - 25°C)',
    status: 'DISPATCHED',
    expectedDeliveryDate: '2026-09-22T12:00:00.000Z',
    createdAt: '2026-09-21T07:15:00.000Z',
    notes: 'Local regional distribution van delivery.',
    items: [
      { product: DEMO_PRODUCTS[6], batch: DEMO_BATCHES[4], quantity: 350 }
    ],
    timeline: [
      { status: 'CREATED', timestamp: '2026-09-21T07:15:00.000Z', note: 'Created' },
      { status: 'DISPATCHED', timestamp: '2026-09-21T09:00:00.000Z', note: 'Dispatched for local route delivery' }
    ]
  }
];

export const DEMO_STOCK_MOVEMENTS = [
  {
    _id: 'mov_demo_1',
    movementType: 'INBOUND',
    product: DEMO_PRODUCTS[0],
    batch: DEMO_BATCHES[0],
    quantity: 10000,
    sourceWarehouse: null,
    destinationWarehouse: DEMO_WAREHOUSES[0],
    referenceNumber: 'PO-2026-00418',
    notes: 'Factory intake from primary manufacturing plant',
    performedBy: { name: 'demoAdmin', role: 'ADMIN' },
    createdAt: '2026-09-18T10:30:00.000Z'
  },
  {
    _id: 'mov_demo_2',
    movementType: 'OUTBOUND',
    product: DEMO_PRODUCTS[1],
    batch: DEMO_BATCHES[1],
    quantity: 5000,
    sourceWarehouse: DEMO_WAREHOUSES[1],
    destinationWarehouse: null,
    referenceNumber: 'SHP-2026-0088',
    notes: 'Hospital consignment dispatch',
    performedBy: { name: 'demoInventory', role: 'INVENTORY_MANAGER' },
    createdAt: '2026-09-19T13:00:00.000Z'
  },
  {
    _id: 'mov_demo_3',
    movementType: 'TRANSFER',
    product: DEMO_PRODUCTS[4],
    batch: DEMO_BATCHES[4],
    quantity: 2000,
    sourceWarehouse: DEMO_WAREHOUSES[0],
    destinationWarehouse: DEMO_WAREHOUSES[3],
    referenceNumber: 'TRF-2026-091',
    notes: 'Regional demand balancing transfer',
    performedBy: { name: 'demoWarehouse', role: 'WAREHOUSE_MANAGER' },
    createdAt: '2026-09-20T11:20:00.000Z'
  },
  {
    _id: 'mov_demo_4',
    movementType: 'OUTBOUND',
    product: DEMO_PRODUCTS[2],
    batch: DEMO_BATCHES[2],
    quantity: 250,
    sourceWarehouse: DEMO_WAREHOUSES[0],
    destinationWarehouse: null,
    referenceNumber: 'SHP-2026-0089',
    notes: 'Cold-chain vaccine/biologic dispatch',
    performedBy: { name: 'demoAdmin', role: 'ADMIN' },
    createdAt: '2026-09-21T10:15:00.000Z'
  }
];

export const DEMO_ALERTS = [
  {
    _id: 'alert_demo_1',
    type: 'NEAR_EXPIRY',
    severity: 'CRITICAL',
    title: 'Near-Expiry Warning: Insulin Glargine',
    message: 'Batch BAT-2026-INS-003 at Hyderabad Center has only 24 days remaining before expiry.',
    entityType: 'Batch',
    entityId: 'batch_demo_3',
    isRead: false,
    isResolved: false,
    createdAt: '2026-09-21T06:00:00.000Z'
  },
  {
    _id: 'alert_demo_2',
    type: 'LOW_STOCK',
    severity: 'HIGH',
    title: 'Safety Stock Breach: Insulin Glargine 100 IU/ml',
    message: 'Available inventory (620 pens) dropped below minimum safety threshold (800 pens).',
    entityType: 'Product',
    entityId: 'prod_demo_3',
    isRead: false,
    isResolved: false,
    createdAt: '2026-09-21T08:15:00.000Z'
  },
  {
    _id: 'alert_demo_3',
    type: 'TEMPERATURE_BREACH',
    severity: 'MEDIUM',
    title: 'Cold-Chain Ambient Fluctuations Detected',
    message: 'Telemetry sensor 04B logged brief excursion to 8.4°C (Safe limit: 2°C - 8°C). Automatically stabilized.',
    entityType: 'Warehouse',
    entityId: 'wh_demo_2',
    isRead: true,
    isResolved: false,
    createdAt: '2026-09-20T21:40:00.000Z'
  }
];

export const DEMO_AUDIT_LOGS = [
  {
    _id: 'audit_demo_1',
    action: 'CREATE_SHIPMENT',
    entityType: 'Shipment',
    entityId: 'shp_demo_1',
    user: { name: 'demoAdmin', email: 'demoadmin@pharmatrack.com', role: 'ADMIN' },
    details: 'Simulated consignment SHP-2026-0089 recorded for hospital delivery',
    ipAddress: '127.0.0.1 (Demo Sandbox)',
    createdAt: '2026-09-21T08:30:00.000Z'
  },
  {
    _id: 'audit_demo_2',
    action: 'STOCK_TRANSFER',
    entityType: 'Inventory',
    entityId: 'inv_demo_4',
    user: { name: 'demoWarehouse', email: 'demowarehouse@pharmatrack.com', role: 'WAREHOUSE_MANAGER' },
    details: 'Simulated inventory relocation between Mumbai and Bengaluru hubs',
    ipAddress: '127.0.0.1 (Demo Sandbox)',
    createdAt: '2026-09-20T11:20:00.000Z'
  },
  {
    _id: 'audit_demo_3',
    action: 'QUALITY_RELEASE',
    entityType: 'Batch',
    entityId: 'batch_demo_2',
    user: { name: 'demoInventory', email: 'demoinventory@pharmatrack.com', role: 'INVENTORY_MANAGER' },
    details: 'Verified certificate of analysis and released Batch BAT-2026-PCM-002',
    ipAddress: '127.0.0.1 (Demo Sandbox)',
    createdAt: '2026-09-19T14:10:00.000Z'
  }
];

export const DEMO_DASHBOARD_METRICS = {
  kpis: {
    totalProducts: 42,
    activeBatches: 118,
    lowStockAlerts: 3,
    criticalAlerts: 2,
    totalWarehouses: 5,
    activeShipments: 8,
    totalInventoryUnits: 284300,
    complianceScore: 99.4
  },
  charts: {
    warehouseCapacity: [
      { name: 'Mumbai Hub', capacity: 150000, current: 114200, percentage: 76 },
      { name: 'Delhi Cold-Chain', capacity: 120000, current: 78500, percentage: 65 },
      { name: 'Hyderabad Bio', capacity: 100000, current: 82000, percentage: 82 },
      { name: 'Bengaluru Depo', capacity: 90000, current: 46800, percentage: 52 },
      { name: 'Chennai Port', capacity: 80000, current: 48900, percentage: 61 }
    ],
    movementTrends: [
      { date: 'Sep 15', inbound: 14200, outbound: 8900 },
      { date: 'Sep 16', inbound: 9800, outbound: 11200 },
      { date: 'Sep 17', inbound: 18400, outbound: 13500 },
      { date: 'Sep 18', inbound: 22100, outbound: 16800 },
      { date: 'Sep 19', inbound: 12000, outbound: 19400 },
      { date: 'Sep 20', inbound: 15600, outbound: 14200 },
      { date: 'Sep 21', inbound: 19800, outbound: 17300 }
    ],
    categoryDistribution: [
      { name: 'Tablets', value: 42, color: '#0d9488' },
      { name: 'Injectables', value: 24, color: '#0284c7' },
      { name: 'Capsules', value: 16, color: '#8b5cf6' },
      { name: 'Inhalers', value: 10, color: '#f59e0b' },
      { name: 'Syrups & Suspensions', value: 8, color: '#ec4899' }
    ],
    shipmentStatus: [
      { name: 'Delivered', value: 28, color: '#10b981' },
      { name: 'In Transit', value: 8, color: '#3b82f6' },
      { name: 'Dispatched', value: 4, color: '#f59e0b' },
      { name: 'Draft / Pending', value: 2, color: '#6b7280' }
    ],
    expiryRisk: [
      { range: '< 30 Days (Critical)', count: 2, color: '#e11d48' },
      { range: '31 - 90 Days (Warning)', count: 5, color: '#f97316' },
      { range: '91 - 180 Days (Monitor)', count: 14, color: '#eab308' },
      { range: '> 180 Days (Safe)', count: 97, color: '#10b981' }
    ]
  },
  priorityAlerts: DEMO_ALERTS
};

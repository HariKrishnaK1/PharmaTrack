import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import {
  User,
  Product,
  Warehouse,
  Batch,
  Inventory,
  StockMovement,
  Shipment,
  Alert,
  AuditLog,
} from "../models/index.js";
import { evaluateOperationalAlerts } from "../services/alertRuleEngine.js";

export const seedDatabase = async () => {
  try {
    console.log(
      "[Seed] Starting database cleanup and pharmaceutical data population...",
    );

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Warehouse.deleteMany({}),
      Batch.deleteMany({}),
      Inventory.deleteMany({}),
      StockMovement.deleteMany({}),
      Shipment.deleteMany({}),
      Alert.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // 1. Seed Warehouses
    console.log("[Seed] Seeding regional distribution hubs...");
    const warehouses = await Warehouse.create([
      {
        name: "Mumbai Central Distribution Hub",
        code: "WH-MUM-01",
        location: {
          address: "Plot 42, Logistics Park, Bhiwandi",
          city: "Mumbai",
          state: "Maharashtra",
          country: "India",
          postalCode: "421302",
        },
        capacity: 150000,
        contactPhone: "+91 22 2847 1100",
        contactEmail: "mumbai.hub@pharmatrack.internal",
        status: "ACTIVE",
      },
      {
        name: "Delhi NCR Cold-Chain Logistics Hub",
        code: "WH-DEL-02",
        location: {
          address: "Sector 8, IMT Manesar",
          city: "Gurugram",
          state: "Haryana",
          country: "India",
          postalCode: "122051",
        },
        capacity: 120000,
        contactPhone: "+91 124 492 8800",
        contactEmail: "delhi.hub@pharmatrack.internal",
        status: "ACTIVE",
      },
      {
        name: "Hyderabad Bio-Logistics Center",
        code: "WH-HYD-03",
        location: {
          address: "Genome Valley, Shamirpet",
          city: "Hyderabad",
          state: "Telangana",
          country: "India",
          postalCode: "500078",
        },
        capacity: 100000,
        contactPhone: "+91 40 2344 5500",
        contactEmail: "hyd.hub@pharmatrack.internal",
        status: "ACTIVE",
      },
      {
        name: "Bengaluru Tech & Pharma Depo",
        code: "WH-BLR-04",
        location: {
          address: "Peenya Industrial Area Phase 2",
          city: "Bengaluru",
          state: "Karnataka",
          country: "India",
          postalCode: "560058",
        },
        capacity: 90000,
        contactPhone: "+91 80 4112 3344",
        contactEmail: "blr.depo@pharmatrack.internal",
        status: "ACTIVE",
      },
      {
        name: "Chennai Port Regional Center",
        code: "WH-MAA-05",
        location: {
          address: "Madhavaram Expressway Junction",
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          postalCode: "600060",
        },
        capacity: 80000,
        contactPhone: "+91 44 2655 7788",
        contactEmail: "chennai.rc@pharmatrack.internal",
        status: "ACTIVE",
      },
    ]);

    // 2. Seed Users (Demo Credentials)
    console.log("[Seed] Seeding authenticated role accounts...");
    const users = await User.create([
      {
        name: "Dr. Ram",
        email: "admin@pharmatrack.com",
        password: "Admin@123",
        role: "ADMIN",
        status: "ACTIVE",
        lastLogin: new Date(),
      },
      {
        name: "Marcus Vance",
        email: "inventory@pharmatrack.com",
        password: "Inventory@123",
        role: "INVENTORY_MANAGER",
        status: "ACTIVE",
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        name: "Suresh Raina",
        email: "warehouse@pharmatrack.com",
        password: "Warehouse@123",
        role: "WAREHOUSE_MANAGER",
        assignedWarehouse: warehouses[0]._id,
        status: "ACTIVE",
        lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        name: "Priya Sharma",
        email: "priya.logistics@pharmatrack.com",
        password: "Warehouse@123",
        role: "WAREHOUSE_MANAGER",
        assignedWarehouse: warehouses[1]._id,
        status: "ACTIVE",
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ]);

    const adminUser = users[0];
    const invUser = users[1];
    const whUser = users[2];

    // Assign manager to first warehouse
    warehouses[0].manager = whUser._id;
    await warehouses[0].save();
    warehouses[1].manager = users[3]._id;
    await warehouses[1].save();

    // 3. Seed Products (14 Realistic Generic Formulations)
    console.log("[Seed] Seeding generic pharmaceutical formulations...");
    const productsData = [
      {
        productCode: "PRD-TAB-101",
        name: "Paracetamol 650mg Tablets",
        genericName: "Acetaminophen / Paracetamol",
        category: "Tablets",
        dosageForm: "Uncoated Tablet",
        strength: "650mg",
        manufacturer: "PharmaLab Formulation Ltd",
        unitOfMeasure: "Strips of 15",
        minimumStockLevel: 500,
        reorderLevel: 1000,
        unitPrice: 32.5,
        description:
          "Antipyretic and analgesic for moderate fever and pain relief.",
      },
      {
        productCode: "PRD-CAP-102",
        name: "Amoxicillin 500mg Capsules",
        genericName: "Amoxicillin Trihydrate",
        category: "Capsules",
        dosageForm: "Hard Gelatin Capsule",
        strength: "500mg",
        manufacturer: "Apex Antimicrobials Inc",
        unitOfMeasure: "Strips of 10",
        minimumStockLevel: 600,
        reorderLevel: 1200,
        unitPrice: 85.0,
        description:
          "Broad-spectrum beta-lactam antibiotic for bacterial infections.",
      },
      {
        productCode: "PRD-TAB-103",
        name: "Azithromycin 500mg Tablets",
        genericName: "Azithromycin Dihydrate",
        category: "Tablets",
        dosageForm: "Film-coated Tablet",
        strength: "500mg",
        manufacturer: "Apex Antimicrobials Inc",
        unitOfMeasure: "Pack of 3 Tablets",
        minimumStockLevel: 400,
        reorderLevel: 800,
        unitPrice: 72.0,
        description:
          "Macrolide antibiotic for upper and lower respiratory tract infections.",
      },
      {
        productCode: "PRD-TAB-104",
        name: "Cetirizine 10mg Tablets",
        genericName: "Cetirizine Hydrochloride",
        category: "Tablets",
        dosageForm: "Film-coated Tablet",
        strength: "10mg",
        manufacturer: "BioAllergy Therapeutics",
        unitOfMeasure: "Strips of 10",
        minimumStockLevel: 300,
        reorderLevel: 600,
        unitPrice: 28.0,
        description:
          "Second-generation antihistamine for seasonal allergic rhinitis.",
      },
      {
        productCode: "PRD-CAP-105",
        name: "Omeprazole 20mg Capsules",
        genericName: "Omeprazole",
        category: "Capsules",
        dosageForm: "Delayed-Release Capsule",
        strength: "20mg",
        manufacturer: "GastroCare Formulations",
        unitOfMeasure: "Strips of 15",
        minimumStockLevel: 500,
        reorderLevel: 900,
        unitPrice: 65.0,
        description: "Proton pump inhibitor for GERD and peptic ulcer disease.",
      },
      {
        productCode: "PRD-TAB-106",
        name: "Metformin HCl 500mg Tablets",
        genericName: "Metformin Hydrochloride",
        category: "Tablets",
        dosageForm: "Extended-Release Tablet",
        strength: "500mg",
        manufacturer: "EndoHealth Global",
        unitOfMeasure: "Strips of 20",
        minimumStockLevel: 700,
        reorderLevel: 1400,
        unitPrice: 42.0,
        description:
          "First-line biguanide oral hypoglycemic for Type 2 Diabetes.",
      },
      {
        productCode: "PRD-INJ-107",
        name: "Ceftriaxone 1g Injectable",
        genericName: "Ceftriaxone Sodium",
        category: "Injectables",
        dosageForm: "Dry Powder for Injection with SWFI",
        strength: "1000mg",
        manufacturer: "Apex Antimicrobials Inc",
        unitOfMeasure: "Vial with Ampoule",
        minimumStockLevel: 250,
        reorderLevel: 500,
        unitPrice: 110.0,
        description:
          "Third-generation cephalosporin for severe nosocomial infections.",
      },
      {
        productCode: "PRD-TAB-108",
        name: "Ibuprofen 400mg Tablets",
        genericName: "Ibuprofen",
        category: "Tablets",
        dosageForm: "Film-coated Tablet",
        strength: "400mg",
        manufacturer: "PharmaLab Formulation Ltd",
        unitOfMeasure: "Strips of 10",
        minimumStockLevel: 350,
        reorderLevel: 700,
        unitPrice: 24.0,
        description: "Non-steroidal anti-inflammatory drug (NSAID).",
      },
      {
        productCode: "PRD-TAB-109",
        name: "Vitamin B-Complex with B12",
        genericName: "Multivitamins with Cyanocobalamin",
        category: "Supplements",
        dosageForm: "Coated Tablet",
        strength: "Fortified Therapeutic Formula",
        manufacturer: "Vitality PharmaCare",
        unitOfMeasure: "Strips of 30",
        minimumStockLevel: 400,
        reorderLevel: 800,
        unitPrice: 48.0,
        description:
          "Dietary supplement for neurological and metabolic wellness.",
      },
      {
        productCode: "PRD-SAC-110",
        name: "Oral Rehydration Salts (ORS) Sachets",
        genericName: "WHO Standard Oral Electrolytes",
        category: "Supplements",
        dosageForm: "Soluble Powder Sachet",
        strength: "21.8g Sachet",
        manufacturer: "HydraCare Health",
        unitOfMeasure: "Pack of 25 Sachets",
        minimumStockLevel: 800,
        reorderLevel: 1500,
        unitPrice: 19.5,
        description:
          "Electrolyte replacement therapy for clinical dehydration.",
      },
      {
        productCode: "PRD-TAB-111",
        name: "Pantoprazole 40mg Tablets",
        genericName: "Pantoprazole Sodium",
        category: "Tablets",
        dosageForm: "Gastro-Resistant Tablet",
        strength: "40mg",
        manufacturer: "GastroCare Formulations",
        unitOfMeasure: "Strips of 15",
        minimumStockLevel: 450,
        reorderLevel: 900,
        unitPrice: 78.0,
        description:
          "Proton pump inhibitor for acid reflux and erosive esophagitis.",
      },
      {
        productCode: "PRD-INH-112",
        name: "Salbutamol 100mcg Inhaler",
        genericName: "Salbutamol / Albuterol Sulfate",
        category: "Inhalers",
        dosageForm: "Metered Dose Inhaler (MDI)",
        strength: "100mcg / Actuation (200 Puffs)",
        manufacturer: "AeroResp Therapeutics",
        unitOfMeasure: "Canister Unit",
        minimumStockLevel: 200,
        reorderLevel: 400,
        unitPrice: 165.0,
        description:
          "Short-acting beta-2 agonist bronchodilator for asthma relief.",
      },
      {
        productCode: "PRD-SYR-113",
        name: "Amoxicillin & Clavulanate Syrup",
        genericName: "Amoxicillin + Potassium Clavulanate",
        category: "Syrups",
        dosageForm: "Dry Syrup Suspension",
        strength: "228.5mg / 5ml",
        manufacturer: "Apex Antimicrobials Inc",
        unitOfMeasure: "30ml Bottle",
        minimumStockLevel: 150,
        reorderLevel: 350,
        unitPrice: 94.0,
        description: "Pediatric antibacterial suspension.",
      },
      {
        productCode: "PRD-CRM-114",
        name: "Hydrocortisone 1% Topical Cream",
        genericName: "Hydrocortisone",
        category: "Creams",
        dosageForm: "Topical Cream",
        strength: "1% w/w",
        manufacturer: "DermaDerm Labs",
        unitOfMeasure: "30g Tube",
        minimumStockLevel: 180,
        reorderLevel: 360,
        unitPrice: 55.0,
        description:
          "Mild topical corticosteroid for dermatitis and allergic flare-ups.",
      },
    ];

    const products = await Product.create(productsData);

    // 4. Seed Batches (Fresh, Expiring Soon, Critical, Expired)
    console.log("[Seed] Seeding batches with realistic shelf-life profiles...");
    const now = new Date();
    const addDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

    const batchesData = [
      // Paracetamol Batches
      {
        batchNumber: "PCM-2025-081",
        product: products[0]._id,
        warehouse: warehouses[0]._id,
        manufacturingDate: addDays(-300),
        expiryDate: addDays(420), // SAFE (> 1 year)
        initialQuantity: 12000,
        currentQuantity: 8500,
        supplier: "Active Pharma Ingredients Ltd",
        status: "RELEASED",
      },
      {
        batchNumber: "PCM-2024-042",
        product: products[0]._id,
        warehouse: warehouses[1]._id,
        manufacturingDate: addDays(-550),
        expiryDate: addDays(22), // CRITICAL (< 30 days)
        initialQuantity: 5000,
        currentQuantity: 650,
        supplier: "Active Pharma Ingredients Ltd",
        status: "RELEASED",
      },
      {
        batchNumber: "PCM-2023-019",
        product: products[0]._id,
        warehouse: warehouses[0]._id,
        manufacturingDate: addDays(-750),
        expiryDate: addDays(-15), // EXPIRED (Quarantine demo)
        initialQuantity: 3000,
        currentQuantity: 120,
        supplier: "Active Pharma Ingredients Ltd",
        status: "RELEASED",
      },

      // Amoxicillin Batches
      {
        batchNumber: "AMX-2025-104",
        product: products[1]._id,
        warehouse: warehouses[0]._id,
        manufacturingDate: addDays(-180),
        expiryDate: addDays(550), // SAFE
        initialQuantity: 9000,
        currentQuantity: 7200,
        supplier: "BioSynthesis Chemicals",
        status: "RELEASED",
      },
      {
        batchNumber: "AMX-2025-062",
        product: products[1]._id,
        warehouse: warehouses[2]._id,
        manufacturingDate: addDays(-360),
        expiryDate: addDays(65), // EXPIRING SOON (30-90 days)
        initialQuantity: 4000,
        currentQuantity: 1800,
        supplier: "BioSynthesis Chemicals",
        status: "RELEASED",
      },

      // Azithromycin Batches
      {
        batchNumber: "AZT-2025-201",
        product: products[2]._id,
        warehouse: warehouses[0]._id,
        manufacturingDate: addDays(-120),
        expiryDate: addDays(600), // SAFE
        initialQuantity: 6000,
        currentQuantity: 4800,
        supplier: "PureChemicals Bioscience",
        status: "RELEASED",
      },
      {
        batchNumber: "AZT-2024-099",
        product: products[2]._id,
        warehouse: warehouses[1]._id,
        manufacturingDate: addDays(-480),
        expiryDate: addDays(18), // CRITICAL (< 30 days)
        initialQuantity: 3500,
        currentQuantity: 420,
        supplier: "PureChemicals Bioscience",
        status: "RELEASED",
      },

      // Cetirizine Batches
      {
        batchNumber: "CTZ-2025-301",
        product: products[3]._id,
        warehouse: warehouses[3]._id,
        manufacturingDate: addDays(-100),
        expiryDate: addDays(620), // SAFE
        initialQuantity: 8000,
        currentQuantity: 6900,
        supplier: "MedChem Intermediates",
        status: "RELEASED",
      },

      // Omeprazole Batches
      {
        batchNumber: "OMP-2025-401",
        product: products[4]._id,
        warehouse: warehouses[0]._id,
        manufacturingDate: addDays(-150),
        expiryDate: addDays(400), // SAFE
        initialQuantity: 5500,
        currentQuantity: 4100,
        supplier: "BioSynthesis Chemicals",
        status: "RELEASED",
      },
      {
        batchNumber: "OMP-2024-088",
        product: products[4]._id,
        warehouse: warehouses[2]._id,
        manufacturingDate: addDays(-500),
        expiryDate: addDays(75), // EXPIRING SOON (30-90 days)
        initialQuantity: 4000,
        currentQuantity: 950,
        supplier: "BioSynthesis Chemicals",
        status: "RELEASED",
      },

      // Metformin Batches
      {
        batchNumber: "MET-2025-501",
        product: products[5]._id,
        warehouse: warehouses[0]._id,
        manufacturingDate: addDays(-200),
        expiryDate: addDays(520), // SAFE
        initialQuantity: 14000,
        currentQuantity: 11200,
        supplier: "Active Pharma Ingredients Ltd",
        status: "RELEASED",
      },
      {
        batchNumber: "MET-2024-112",
        product: products[5]._id,
        warehouse: warehouses[4]._id,
        manufacturingDate: addDays(-400),
        expiryDate: addDays(45), // EXPIRING SOON
        initialQuantity: 5000,
        currentQuantity: 1500,
        supplier: "Active Pharma Ingredients Ltd",
        status: "RELEASED",
      },

      // Ceftriaxone Injectables Batches
      {
        batchNumber: "CFT-2025-601",
        product: products[6]._id,
        warehouse: warehouses[1]._id,
        manufacturingDate: addDays(-90),
        expiryDate: addDays(480), // SAFE
        initialQuantity: 3000,
        currentQuantity: 2450,
        supplier: "Sterile Solutions International",
        status: "RELEASED",
      },
      {
        batchNumber: "CFT-2024-033",
        product: products[6]._id,
        warehouse: warehouses[0]._id,
        manufacturingDate: addDays(-450),
        expiryDate: addDays(12), // CRITICAL (< 30 days)
        initialQuantity: 1500,
        currentQuantity: 220,
        supplier: "Sterile Solutions International",
        status: "RELEASED",
      },

      // Ibuprofen Batches
      {
        batchNumber: "IBU-2025-701",
        product: products[7]._id,
        warehouse: warehouses[0]._id,
        manufacturingDate: addDays(-130),
        expiryDate: addDays(490), // SAFE
        initialQuantity: 7000,
        currentQuantity: 5800,
        supplier: "PharmaLab Raw Materials",
        status: "RELEASED",
      },

      // Vitamin B-Complex Batches
      {
        batchNumber: "VTB-2025-801",
        product: products[8]._id,
        warehouse: warehouses[2]._id,
        manufacturingDate: addDays(-110),
        expiryDate: addDays(580), // SAFE
        initialQuantity: 10000,
        currentQuantity: 8400,
        supplier: "NutraBio Synthetics",
        status: "RELEASED",
      },

      // ORS Sachets Batches
      {
        batchNumber: "ORS-2025-901",
        product: products[9]._id,
        warehouse: warehouses[0]._id,
        manufacturingDate: addDays(-70),
        expiryDate: addDays(700), // SAFE
        initialQuantity: 20000,
        currentQuantity: 16500,
        supplier: "HydraCare Laboratories",
        status: "RELEASED",
      },

      // Pantoprazole Batches
      {
        batchNumber: "PAN-2025-101",
        product: products[10]._id,
        warehouse: warehouses[1]._id,
        manufacturingDate: addDays(-140),
        expiryDate: addDays(450), // SAFE
        initialQuantity: 6000,
        currentQuantity: 4900,
        supplier: "GastroCare Formulations",
        status: "RELEASED",
      },

      // Salbutamol Inhaler Batches
      {
        batchNumber: "SAL-2025-201",
        product: products[11]._id,
        warehouse: warehouses[1]._id,
        manufacturingDate: addDays(-80),
        expiryDate: addDays(510), // SAFE
        initialQuantity: 2500,
        currentQuantity: 1950,
        supplier: "AeroResp Inhalations",
        status: "RELEASED",
      },

      // Amoxicillin Syrup (Low stock item)
      {
        batchNumber: "AMS-2024-012",
        product: products[12]._id,
        warehouse: warehouses[0]._id,
        manufacturingDate: addDays(-320),
        expiryDate: addDays(85), // EXPIRING SOON
        initialQuantity: 500,
        currentQuantity: 85, // Below min stock of 150!
        supplier: "Apex Antimicrobials Inc",
        status: "RELEASED",
      },

      // Hydrocortisone Cream (Deliberately 0 units to demo Out of Stock)
      {
        batchNumber: "HYD-2024-001",
        product: products[13]._id,
        warehouse: warehouses[3]._id,
        manufacturingDate: addDays(-400),
        expiryDate: addDays(120),
        initialQuantity: 300,
        currentQuantity: 0, // OUT OF STOCK DEMO!
        supplier: "DermaDerm Labs",
        status: "RELEASED",
      },
    ];

    const batches = await Batch.create(batchesData);

    // 5. Seed Inventory Records
    console.log("[Seed] Linking inventory units across warehouse nodes...");
    const inventoryDocs = batches.map((b) => ({
      product: b.product,
      batch: b._id,
      warehouse: b.warehouse,
      quantity: b.currentQuantity,
      reservedQuantity: b.currentQuantity > 200 ? 50 : 0,
    }));

    await Inventory.create(inventoryDocs);

    // 6. Seed Realistic Shipments
    console.log("[Seed] Seeding shipments with timeline milestones...");
    const shipmentsData = [
      {
        shipmentId: "SHP-2026-1001",
        sourceWarehouse: warehouses[0]._id,
        destination: {
          facilityName: "Lilavati Hospital & Research Centre",
          address: "A-791, Bandra Reclamation",
          city: "Mumbai",
          state: "Maharashtra",
        },
        carrier: "ColdChain Express Logistics",
        temperatureRequirement: "Controlled Room Temperature (15°C - 25°C)",
        items: [
          {
            product: products[0]._id,
            batch: batches[0]._id,
            quantity: 500,
            unitPrice: products[0].unitPrice,
          },
          {
            product: products[1]._id,
            batch: batches[3]._id,
            quantity: 300,
            unitPrice: products[1].unitPrice,
          },
        ],
        dispatchDate: addDays(-2),
        expectedDeliveryDate: addDays(1),
        status: "IN_TRANSIT",
        trackingNumber: "TRK-CCX-992144",
        notes: "Priority hospital order for inpatient pharmacy supply",
        statusHistory: [
          {
            status: "PENDING",
            timestamp: addDays(-3),
            updatedBy: adminUser._id,
            note: "Order requisition verified",
          },
          {
            status: "DISPATCHED",
            timestamp: addDays(-2),
            updatedBy: whUser._id,
            note: "Dispatched via temp-monitored refrigerated van",
          },
          {
            status: "IN_TRANSIT",
            timestamp: addDays(-1),
            updatedBy: whUser._id,
            note: "Checkpoint cleared at Western Express Highway",
          },
        ],
      },
      {
        shipmentId: "SHP-2026-1002",
        sourceWarehouse: warehouses[1]._id,
        destination: {
          facilityName: "Fortis Memorial Research Institute",
          address: "Sector 44, Opposite HUDA City Centre",
          city: "Gurugram",
          state: "Haryana",
        },
        carrier: "PharmaLogix Dedicated Fleet",
        temperatureRequirement: "Controlled Room Temperature (15°C - 25°C)",
        items: [
          {
            product: products[6]._id,
            batch: batches[12]._id,
            quantity: 200,
            unitPrice: products[6].unitPrice,
          },
        ],
        dispatchDate: addDays(-5),
        expectedDeliveryDate: addDays(-2), // Past delivery date! DELAYED demo
        status: "DELAYED",
        trackingNumber: "TRK-PLX-881920",
        notes: "Highway roadblock reported near Manesar bottleneck",
        statusHistory: [
          {
            status: "PENDING",
            timestamp: addDays(-6),
            updatedBy: adminUser._id,
            note: "Consignment prepared",
          },
          {
            status: "DISPATCHED",
            timestamp: addDays(-5),
            updatedBy: users[3]._id,
            note: "Handed to carrier driver",
          },
          {
            status: "IN_TRANSIT",
            timestamp: addDays(-4),
            updatedBy: users[3]._id,
            note: "In transit to Gurugram",
          },
          {
            status: "DELAYED",
            timestamp: addDays(-1),
            updatedBy: users[3]._id,
            note: "Weather disruption causing 48hr route delay",
          },
        ],
      },
      {
        shipmentId: "SHP-2026-1003",
        sourceWarehouse: warehouses[0]._id,
        destination: {
          facilityName: "Kokilaben Dhirubhai Ambani Hospital",
          address: "Rao Saheb, Achutrao Patwardhan Marg, 4 Bunglows",
          city: "Mumbai",
          state: "Maharashtra",
        },
        carrier: "BlueDart Health Logistics",
        temperatureRequirement: "Controlled Room Temperature (15°C - 25°C)",
        items: [
          {
            product: products[4]._id,
            batch: batches[8]._id,
            quantity: 450,
            unitPrice: products[4].unitPrice,
          },
          {
            product: products[5]._id,
            batch: batches[10]._id,
            quantity: 600,
            unitPrice: products[5].unitPrice,
          },
        ],
        dispatchDate: addDays(-4),
        expectedDeliveryDate: addDays(-1),
        actualDeliveryDate: addDays(-1),
        status: "DELIVERED",
        trackingNumber: "TRK-BDH-771239",
        notes: "Signed and accepted by Chief Pharmacist",
        statusHistory: [
          {
            status: "PENDING",
            timestamp: addDays(-5),
            updatedBy: invUser._id,
            note: "Order created",
          },
          {
            status: "DISPATCHED",
            timestamp: addDays(-4),
            updatedBy: whUser._id,
            note: "Dock departure verified",
          },
          {
            status: "IN_TRANSIT",
            timestamp: addDays(-3),
            updatedBy: whUser._id,
            note: "Out for final delivery",
          },
          {
            status: "DELIVERED",
            timestamp: addDays(-1),
            updatedBy: whUser._id,
            note: "Consignment successfully delivered and receipt acknowledged",
          },
        ],
      },
      {
        shipmentId: "SHP-2026-1004",
        sourceWarehouse: warehouses[2]._id,
        destination: {
          facilityName: "Apollo Health City",
          address: "Road No 72, Film Nagar, Jubilee Hills",
          city: "Hyderabad",
          state: "Telangana",
        },
        carrier: "ColdChain Express Logistics",
        temperatureRequirement: "Controlled Room Temperature (15°C - 25°C)",
        items: [
          {
            product: products[1]._id,
            batch: batches[4]._id,
            quantity: 250,
            unitPrice: products[1].unitPrice,
          },
        ],
        expectedDeliveryDate: addDays(3),
        status: "PENDING",
        trackingNumber: "TRK-CCX-661102",
        notes: "Awaiting dock staging and transport validation",
        statusHistory: [
          {
            status: "PENDING",
            timestamp: addDays(-1),
            updatedBy: invUser._id,
            note: "Consignment booked, stock reserved",
          },
        ],
      },
    ];

    await Shipment.create(shipmentsData);

    // 7. Seed Stock Movements (Inbound, Outbound, Transfer, Adjustment)
    console.log("[Seed] Seeding audit-tracked stock movements...");
    const movementsData = [
      {
        movementType: "INBOUND",
        product: products[0]._id,
        batch: batches[0]._id,
        destinationWarehouse: warehouses[0]._id,
        quantity: 12000,
        referenceNumber: "MOV-IN-202601",
        performedBy: invUser._id,
        notes:
          "Intake from API manufacturer with Certificate of Analysis (CoA) verified",
        timestamp: addDays(-30),
      },
      {
        movementType: "OUTBOUND",
        product: products[0]._id,
        batch: batches[0]._id,
        sourceWarehouse: warehouses[0]._id,
        quantity: 3500,
        referenceNumber: "MOV-OUT-202602",
        performedBy: whUser._id,
        notes: "Dispatched for multi-clinic distribution tender",
        timestamp: addDays(-12),
      },
      {
        movementType: "TRANSFER",
        product: products[1]._id,
        batch: batches[3]._id,
        sourceWarehouse: warehouses[0]._id,
        destinationWarehouse: warehouses[2]._id,
        quantity: 1800,
        referenceNumber: "MOV-TRF-202603",
        performedBy: invUser._id,
        notes: "Inter-hub inventory balancing from Mumbai to Hyderabad",
        timestamp: addDays(-8),
      },
      {
        movementType: "ADJUSTMENT",
        product: products[2]._id,
        batch: batches[5]._id,
        sourceWarehouse: warehouses[0]._id,
        quantity: 4800,
        referenceNumber: "MOV-ADJ-202604",
        performedBy: adminUser._id,
        notes: "Quarterly inventory physical count reconciliation",
        timestamp: addDays(-4),
      },
    ];

    await StockMovement.create(movementsData);

    // 8. Seed Initial Audit Logs
    console.log("[Seed] Seeding operational audit trail...");
    const auditLogsData = [
      {
        timestamp: addDays(-15),
        user: adminUser._id,
        userName: adminUser.name,
        userRole: adminUser.role,
        action: "PRODUCT_CREATED",
        entity: "Product",
        entityId: products[0]._id.toString(),
        description: `Created pharmaceutical product: Paracetamol 650mg Tablets (${products[0].productCode}).`,
      },
      {
        timestamp: addDays(-12),
        user: invUser._id,
        userName: invUser.name,
        userRole: invUser.role,
        action: "BATCH_CREATED",
        entity: "Batch",
        entityId: batches[0]._id.toString(),
        description: `Registered batch PCM-2025-081 (12,000 units) manufactured with verified expiry.`,
      },
      {
        timestamp: addDays(-8),
        user: invUser._id,
        userName: invUser.name,
        userRole: invUser.role,
        action: "STOCK_MOVEMENT",
        entity: "Inventory",
        entityId: "MOV-TRF-202603",
        description:
          "Authorized TRANSFER movement of 1,800 units of Amoxicillin 500mg between warehouses.",
      },
      {
        timestamp: addDays(-3),
        user: whUser._id,
        userName: whUser.name,
        userRole: whUser.role,
        action: "SHIPMENT_STATUS_CHANGED",
        entity: "Shipment",
        entityId: "SHP-2026-1001",
        description:
          "Dispatched shipment SHP-2026-1001 bound for Lilavati Hospital via ColdChain Express.",
      },
      {
        timestamp: addDays(-1),
        user: adminUser._id,
        userName: adminUser.name,
        userRole: adminUser.role,
        action: "USER_LOGIN",
        entity: "User",
        entityId: adminUser._id.toString(),
        description: "Administrator Ram authenticated successfully.",
      },
    ];

    await AuditLog.create(auditLogsData);

    // 9. Run Alert Rule Engine to evaluate and seed alerts deterministically
    console.log(
      "[Seed] Evaluating business rules to generate realistic alerts...",
    );
    await evaluateOperationalAlerts();

    console.log(
      "[Seed] Database seeding completed successfully! All entities populated.",
    );
    return true;
  } catch (err) {
    console.error("[Seed Error]", err);
    throw err;
  }
};

// If run directly via `node src/utils/seedData.js`
if (process.argv[1]?.endsWith("seedData.js")) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error("Seeding process failed:", err);
      process.exit(1);
    }
  })();
}

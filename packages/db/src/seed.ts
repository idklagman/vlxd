import 'dotenv/config';
import { db } from './client.js';
import {
  users,
  systemSettings,
  units,
  unitConversions,
  productCategories,
  brands,
  products,
  productVariants,
  steelSpecifications,
  warehouses,
  customers,
  projects,
  suppliers,
  vehicles,
  drivers,
  expenseCategories,
  inventoryBalances,
  inventoryTransactions,
  inventoryAdjustments,
  inventoryAdjustmentItems,
  warehouseTransfers,
  warehouseTransferItems,
  purchases,
  purchaseItems,
  salesOrders,
  salesOrderItems,
  deliveries,
  deliveryItems,
  payments,
  cashFlowEntries,
  customerDebts,
  supplierDebts,
  productCosts,
  expenses,
} from './schema/index.js';
import bcrypt from 'bcrypt';
import { eq, inArray } from 'drizzle-orm';

const SALT_ROUNDS = 12;

async function seed() {
  console.log('🌱 Cleaning old inventory & transaction data and seeding fresh database...');

  // 0. Clean Old Transaction & Inventory Data
  try {
    await db.delete(deliveryItems);
    await db.delete(deliveries);
    await db.delete(salesOrderItems);
    await db.delete(salesOrders);
    await db.delete(purchaseItems);
    await db.delete(purchases);
    await db.delete(warehouseTransferItems);
    await db.delete(warehouseTransfers);
    await db.delete(inventoryAdjustmentItems);
    await db.delete(inventoryAdjustments);
    await db.delete(cashFlowEntries);
    await db.delete(expenses);
    await db.delete(payments);
    await db.delete(customerDebts);
    await db.delete(supplierDebts);
    await db.delete(inventoryTransactions);
    await db.delete(inventoryBalances);
    await db.delete(productCosts);
    console.log('🧹 Cleaned old transaction & inventory data');
  } catch (err) {
    console.warn('Note during clean:', err);
  }

  // 1. Admin User
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.username, 'admin'),
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
    await db.insert(users).values({
      username: 'admin',
      passwordHash,
      fullName: 'Chủ Cửa Hàng',
      role: 'OWNER',
    });
    console.log('✅ Admin user created (username: admin, password: admin123)');
  }

  // 2. System Settings
  const defaultSettings = [
    { key: 'store.name', value: 'Cửa hàng VLXD', group: 'store', description: 'Tên cửa hàng' },
    { key: 'store.phone', value: '0987654321', group: 'store', description: 'Số điện thoại cửa hàng' },
    { key: 'store.address', value: 'Hương Sơn, Mỹ Đức, Hà Nội', group: 'store', description: 'Địa chỉ cửa hàng' },
    { key: 'bank.name', value: 'VietinBank', group: 'bank', description: 'Tên ngân hàng' },
    { key: 'bank.account_number', value: '12283456', group: 'bank', description: 'Số tài khoản ngân hàng' },
    { key: 'bank.account_name', value: 'NGUYEN VAN CHU', group: 'bank', description: 'Tên chủ tài khoản' },
  ];

  for (const setting of defaultSettings) {
    const existing = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, setting.key),
    });
    if (!existing) {
      await db.insert(systemSettings).values(setting);
    }
  }
  console.log('✅ System settings seeded');

  // 3. Units (including HOP for Spacers and TUI for 5kg Nails)
  const defaultUnits = [
    { code: 'KG', name: 'Kilôgam' },
    { code: 'TON', name: 'Tấn' },
    { code: 'BAG', name: 'Bao (50kg)' },
    { code: 'M3', name: 'Mét khối (m³)' },
    { code: 'PIECE', name: 'Viên / Cục' },
    { code: 'PALLET', name: 'Pallet' },
    { code: 'BAR', name: 'Cây (11.7m)' },
    { code: 'HOP', name: 'Hộp' },
    { code: 'TUI', name: 'Túi' },
  ];

  const unitMap: Record<string, string> = {};
  for (const u of defaultUnits) {
    let existing = await db.query.units.findFirst({
      where: eq(units.code, u.code),
    });
    if (!existing) {
      const [created] = await db.insert(units).values(u).returning();
      existing = created;
    }
    unitMap[u.code] = existing.id;
  }
  console.log('✅ Units seeded:', Object.keys(unitMap));

  // 4. Global Unit Conversions
  const defaultConversions = [
    { from: 'TON', to: 'KG', rate: '1000' },
    { from: 'KG', to: 'TON', rate: '0.001' },
    { from: 'BAG', to: 'KG', rate: '50' },
    { from: 'KG', to: 'BAG', rate: '0.02' },
    { from: 'BAG', to: 'TON', rate: '0.05' },
    { from: 'TON', to: 'BAG', rate: '20' },
    { from: 'PALLET', to: 'PIECE', rate: '1000' },
    { from: 'PIECE', to: 'PALLET', rate: '0.001' },
  ];

  for (const conv of defaultConversions) {
    const fromId = unitMap[conv.from];
    const toId = unitMap[conv.to];
    if (fromId && toId) {
      const existing = await db.query.unitConversions.findFirst({
        where: (uc, { and, eq, isNull }) =>
          and(eq(uc.fromUnitId, fromId), eq(uc.toUnitId, toId), isNull(uc.productVariantId)),
      });
      if (!existing) {
        await db.insert(unitConversions).values({
          fromUnitId: fromId,
          toUnitId: toId,
          conversionRate: conv.rate,
        });
      }
    }
  }
  console.log('✅ Global unit conversions seeded');

  // 5. Single Warehouse Mode (Kho Tổng duy nhất)
  const singleWarehouse = {
    name: 'Kho Tổng VLXD',
    address: 'Hương Sơn, Mỹ Đức, Hà Nội',
    description: 'Kho bãi tập kết vật liệu xây dựng tổng hợp (Cát, đá, sỏi, xi măng, sắt thép, gạch, đinh, con kê)',
  };

  let primaryWarehouse = await db.query.warehouses.findFirst({
    where: eq(warehouses.name, singleWarehouse.name),
  });

  if (!primaryWarehouse) {
    // If other warehouses exist, update first one to 'Kho Tổng VLXD' or insert
    const allWh = await db.query.warehouses.findMany();
    if (allWh.length > 0) {
      await db.update(warehouses).set(singleWarehouse).where(eq(warehouses.id, allWh[0].id));
      primaryWarehouse = { ...allWh[0], ...singleWarehouse, isActive: true, createdAt: allWh[0].createdAt, updatedAt: new Date() };
      // delete other warehouses
      if (allWh.length > 1) {
        const extraIds = allWh.slice(1).map((w) => w.id);
        await db.delete(warehouses).where(inArray(warehouses.id, extraIds));
      }
    } else {
      const [created] = await db.insert(warehouses).values(singleWarehouse).returning();
      primaryWarehouse = created;
    }
  } else {
    // Delete any other duplicate warehouses
    const allWh = await db.query.warehouses.findMany();
    const otherIds = allWh.filter((w) => w.id !== primaryWarehouse!.id).map((w) => w.id);
    if (otherIds.length > 0) {
      await db.delete(warehouses).where(inArray(warehouses.id, otherIds));
    }
  }
  console.log('✅ Single Warehouse seeded:', primaryWarehouse.name);

  // 6. Product Categories
  const defaultCategories = [
    { name: 'Sắt thép', sortOrder: 1, description: 'Thép thanh vằn, thép cuộn xây dựng' },
    { name: 'Xi măng', sortOrder: 2, description: 'Xi măng các loại đóng bao 50kg' },
    { name: 'Cát', sortOrder: 3, description: 'Cát vàng xây trát, cát đen san lấp' },
    { name: 'Sỏi & Đá', sortOrder: 4, description: 'Sỏi cuội, đá 1x2, đá 2x4' },
    { name: 'Gạch xây', sortOrder: 5, description: 'Gạch tuynel, gạch đặc, gạch lỗ' },
    { name: 'Con kê bê tông', sortOrder: 6, description: 'Con kê bê tông đúc sẵn tính theo Hộp (đồng giá)' },
    { name: 'Đinh', sortOrder: 7, description: 'Đinh đóng cốp pha 5 phân và 7 phân (Túi 5kg)' },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of defaultCategories) {
    let existing = await db.query.productCategories.findFirst({
      where: eq(productCategories.name, cat.name),
    });
    if (!existing) {
      const [created] = await db.insert(productCategories).values(cat).returning();
      existing = created;
    }
    categoryMap[cat.name] = existing.id;
  }
  console.log('✅ Product categories seeded');

  // 7. Brands
  const defaultBrands = [
    { name: 'Hòa Phát', description: 'Tập đoàn Thép Hòa Phát' },
    { name: 'Nghi Sơn', description: 'Công ty Xi măng Nghi Sơn' },
    { name: 'Hoàng Thạch', description: 'Xi măng Vicem Hoàng Thạch' },
    { name: 'Bút Sơn', description: 'Xi măng Vicem Bút Sơn' },
    { name: 'Tuynel', description: 'Gạch Tuynel nhà máy' },
    { name: 'Viglacera', description: 'Tổng công ty Viglacera' },
  ];

  const brandMap: Record<string, string> = {};
  for (const b of defaultBrands) {
    let existing = await db.query.brands.findFirst({
      where: eq(brands.name, b.name),
    });
    if (!existing) {
      const [created] = await db.insert(brands).values(b).returning();
      existing = created;
    }
    brandMap[b.name] = existing.id;
  }
  console.log('✅ Brands seeded');

  // 8. Products, Variants & Steel Specs
  const variantInventoryToSeed: Array<{ id: string; stock: number; baseUnitId: string; avgCost: number }> = [];

  // 8.1 Sắt Thép Hòa Phát
  let steelProduct = await db.query.products.findFirst({
    where: eq(products.code, 'THEP-HOA-PHAT'),
  });
  if (!steelProduct) {
    const [created] = await db.insert(products).values({
      code: 'THEP-HOA-PHAT',
      name: 'Thép xây dựng Hòa Phát',
      categoryId: categoryMap['Sắt thép'],
      description: 'Thép thanh vằn và thép cuộn Hòa Phát chuẩn TCVN 1651-2:2018',
    }).returning();
    steelProduct = created;
  }

  // Steel Specs Barem TCVN 1651-2:2018 (Hòa Phát 11.7m)
  const steelItems = [
    { type: 'COIL', diameter: '6', length: null, kgPerM: '0.222', kgPerBar: null, sku: 'THEP-D6-CUON', spec: 'D6 Cuộn', defaultKgStock: 2500, costPerKg: 15500 },
    { type: 'COIL', diameter: '8', length: null, kgPerM: '0.395', kgPerBar: null, sku: 'THEP-D8-CUON', spec: 'D8 Cuộn', defaultKgStock: 3000, costPerKg: 15500 },
    { type: 'COIL', diameter: '6', length: null, kgPerM: '0.222', kgPerBar: null, sku: 'DAI-BE-D6', spec: 'Đai sắt D6 bẻ sẵn (Dầm, Móng, Cột)', defaultKgStock: 600, costPerKg: 17500 },
    { type: 'COIL', diameter: '8', length: null, kgPerM: '0.395', kgPerBar: null, sku: 'DAI-BE-D8', spec: 'Đai sắt D8 bẻ sẵn (Dầm, Móng, Cột)', defaultKgStock: 600, costPerKg: 17500 },
    { type: 'BAR', diameter: '10', length: '11.7', kgPerM: '0.617', kgPerBar: '7.2189', sku: 'THEP-D10-HP', spec: 'D10 (11.7m)', defaultKgStock: 100 * 7.2189, costPerKg: 16000 },
    { type: 'BAR', diameter: '12', length: '11.7', kgPerM: '0.888', kgPerBar: '10.3896', sku: 'THEP-D12-HP', spec: 'D12 (11.7m)', defaultKgStock: 100 * 10.3896, costPerKg: 16000 },
    { type: 'BAR', diameter: '14', length: '11.7', kgPerM: '1.210', kgPerBar: '14.1570', sku: 'THEP-D14-HP', spec: 'D14 (11.7m)', defaultKgStock: 80 * 14.157, costPerKg: 16000 },
    { type: 'BAR', diameter: '16', length: '11.7', kgPerM: '1.580', kgPerBar: '18.4860', sku: 'THEP-D16-HP', spec: 'D16 (11.7m)', defaultKgStock: 80 * 18.486, costPerKg: 16000 },
    { type: 'BAR', diameter: '18', length: '11.7', kgPerM: '2.000', kgPerBar: '23.4000', sku: 'THEP-D18-HP', spec: 'D18 (11.7m)', defaultKgStock: 50 * 23.4, costPerKg: 16000 },
    { type: 'BAR', diameter: '20', length: '11.7', kgPerM: '2.470', kgPerBar: '28.8990', sku: 'THEP-D20-HP', spec: 'D20 (11.7m)', defaultKgStock: 50 * 28.899, costPerKg: 16000 },
    { type: 'BAR', diameter: '22', length: '11.7', kgPerM: '2.980', kgPerBar: '34.8660', sku: 'THEP-D22-HP', spec: 'D22 (11.7m)', defaultKgStock: 30 * 34.866, costPerKg: 16000 },
  ];

  for (const s of steelItems) {
    let variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.sku, s.sku),
    });
    if (!variant) {
      const [v] = await db.insert(productVariants).values({
        productId: steelProduct.id,
        brandId: brandMap['Hòa Phát'],
        name: `Thép Hòa Phát ${s.spec}`,
        sku: s.sku,
        specification: s.spec,
        baseUnitId: unitMap['KG'], // BASE UNIT IS KG
        minimumStock: '500',
      }).returning();
      variant = v;

      // Steel spec
      await db.insert(steelSpecifications).values({
        productVariantId: variant.id,
        brandId: brandMap['Hòa Phát'],
        steelType: s.type,
        standard: 'TCVN 1651-2:2018',
        diameter: s.diameter,
        lengthPerBar: s.length,
        weightPerMeter: s.kgPerM,
        weightPerBar: s.kgPerBar,
        purchaseUnitId: unitMap['KG'],
        saleUnitId: s.type === 'BAR' ? unitMap['BAR'] : unitMap['KG'],
      });

      // Variant-scoped conversion for BAR <-> KG
      if (s.type === 'BAR' && s.kgPerBar) {
        await db.insert(unitConversions).values({
          fromUnitId: unitMap['BAR'],
          toUnitId: unitMap['KG'],
          conversionRate: s.kgPerBar,
          productVariantId: variant.id,
        });
        const invRate = (1 / parseFloat(s.kgPerBar)).toFixed(6);
        await db.insert(unitConversions).values({
          fromUnitId: unitMap['KG'],
          toUnitId: unitMap['BAR'],
          conversionRate: invRate,
          productVariantId: variant.id,
        });
      }
    }

    variantInventoryToSeed.push({
      id: variant.id,
      stock: s.defaultKgStock,
      baseUnitId: unitMap['KG'],
      avgCost: s.costPerKg,
    });
  }

  // 8.1b Công bẻ đai gia công (2.000đ/kg)
  let bendingProduct = await db.query.products.findFirst({
    where: eq(products.code, 'GIA-CONG-DAI'),
  });
  if (!bendingProduct) {
    const [created] = await db.insert(products).values({
      code: 'GIA-CONG-DAI',
      name: 'Gia công & Bẻ đai thép',
      categoryId: categoryMap['Sắt thép'],
      description: 'Dịch vụ gia công bẻ đai dầm, móng, cột từ sắt 6 và sắt 8 (Công bẻ 2.000 đ/kg)',
    }).returning();
    bendingProduct = created;

    await db.insert(productVariants).values({
      productId: bendingProduct.id,
      name: 'Công bẻ đai sắt (D6 / D8)',
      sku: 'CONG-BE-DAI',
      specification: 'Công gia công 2.000đ/kg',
      baseUnitId: unitMap['KG'],
      minimumStock: '0',
    });
  }
  console.log('✅ Steel products & stirrup specs seeded');

  // 8.2 Xi măng
  let cementProduct = await db.query.products.findFirst({
    where: eq(products.code, 'XI-MANG'),
  });
  if (!cementProduct) {
    const [created] = await db.insert(products).values({
      code: 'XI-MANG',
      name: 'Xi măng đóng bao',
      categoryId: categoryMap['Xi măng'],
      description: 'Xi măng các loại bao 50kg xây trát và đổ bê tông',
    }).returning();
    cementProduct = created;
  }

  // Nghi Sơn PCB40
  let cementNghiSon = await db.query.productVariants.findFirst({
    where: eq(productVariants.sku, 'XM-NGHI-SON-PCB40'),
  });
  if (!cementNghiSon) {
    const [v] = await db.insert(productVariants).values({
      productId: cementProduct.id,
      brandId: brandMap['Nghi Sơn'],
      name: 'Xi măng Nghi Sơn PCB40',
      sku: 'XM-NGHI-SON-PCB40',
      specification: 'Bao 50kg',
      baseUnitId: unitMap['BAG'],
      minimumStock: '50',
    }).returning();
    cementNghiSon = v;
  }
  variantInventoryToSeed.push({ id: cementNghiSon.id, stock: 250, baseUnitId: unitMap['BAG'], avgCost: 88000 });

  // Hoàng Thạch PCB30
  let cementHoangThach = await db.query.productVariants.findFirst({
    where: eq(productVariants.sku, 'XM-HOANG-THACH-PCB30'),
  });
  if (!cementHoangThach) {
    const [v] = await db.insert(productVariants).values({
      productId: cementProduct.id,
      brandId: brandMap['Hoàng Thạch'],
      name: 'Xi măng Hoàng Thạch PCB30',
      sku: 'XM-HOANG-THACH-PCB30',
      specification: 'Bao 50kg',
      baseUnitId: unitMap['BAG'],
      minimumStock: '50',
    }).returning();
    cementHoangThach = v;
  }
  variantInventoryToSeed.push({ id: cementHoangThach.id, stock: 200, baseUnitId: unitMap['BAG'], avgCost: 85000 });
  console.log('✅ Cement products seeded');

  // 8.3 Cát & Sỏi (Base unit = M3)
  let sandProduct = await db.query.products.findFirst({
    where: eq(products.code, 'CAT-XAY-DUNG'),
  });
  if (!sandProduct) {
    const [created] = await db.insert(products).values({
      code: 'CAT-XAY-DUNG',
      name: 'Cát xây dựng',
      categoryId: categoryMap['Cát'],
      description: 'Cát vàng hạt lớn bê tông, cát đen xây trát',
    }).returning();
    sandProduct = created;
  }

  let catVang = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, 'CAT-VANG') });
  if (!catVang) {
    const [v] = await db.insert(productVariants).values({
      productId: sandProduct.id,
      name: 'Cát vàng bê tông',
      sku: 'CAT-VANG',
      specification: 'm³',
      baseUnitId: unitMap['M3'],
      minimumStock: '10',
    }).returning();
    catVang = v;
  }
  variantInventoryToSeed.push({ id: catVang.id, stock: 45, baseUnitId: unitMap['M3'], avgCost: 320000 });

  let catDen = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, 'CAT-DEN') });
  if (!catDen) {
    const [v] = await db.insert(productVariants).values({
      productId: sandProduct.id,
      name: 'Cát đen xây trát',
      sku: 'CAT-DEN',
      specification: 'm³',
      baseUnitId: unitMap['M3'],
      minimumStock: '10',
    }).returning();
    catDen = v;
  }
  variantInventoryToSeed.push({ id: catDen.id, stock: 40, baseUnitId: unitMap['M3'], avgCost: 180000 });

  let stoneProduct = await db.query.products.findFirst({
    where: eq(products.code, 'SOI-DA'),
  });
  if (!stoneProduct) {
    const [created] = await db.insert(products).values({
      code: 'SOI-DA',
      name: 'Sỏi đá xây dựng',
      categoryId: categoryMap['Sỏi & Đá'],
      description: 'Đá 1x2, đá 2x4 đổ bê tông công trình',
    }).returning();
    stoneProduct = created;
  }

  let da1x2 = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, 'DA-1X2') });
  if (!da1x2) {
    const [v] = await db.insert(productVariants).values({
      productId: stoneProduct.id,
      name: 'Đá 1x2 bê tông',
      sku: 'DA-1X2',
      specification: 'm³',
      baseUnitId: unitMap['M3'],
      minimumStock: '10',
    }).returning();
    da1x2 = v;
  }
  variantInventoryToSeed.push({ id: da1x2.id, stock: 35, baseUnitId: unitMap['M3'], avgCost: 280000 });

  let da2x4 = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, 'DA-2X4') });
  if (!da2x4) {
    const [v] = await db.insert(productVariants).values({
      productId: stoneProduct.id,
      name: 'Đá 2x4 đổ móng',
      sku: 'DA-2X4',
      specification: 'm³',
      baseUnitId: unitMap['M3'],
      minimumStock: '10',
    }).returning();
    da2x4 = v;
  }
  variantInventoryToSeed.push({ id: da2x4.id, stock: 30, baseUnitId: unitMap['M3'], avgCost: 260000 });
  console.log('✅ Sand and Stone products seeded');

  // 8.4 Gạch xây (Base unit = PIECE)
  let brickProduct = await db.query.products.findFirst({
    where: eq(products.code, 'GACH-XAY'),
  });
  if (!brickProduct) {
    const [created] = await db.insert(products).values({
      code: 'GACH-XAY',
      name: 'Gạch đất nung xây dựng',
      categoryId: categoryMap['Gạch xây'],
      description: 'Gạch đặc, gạch 2 lỗ Tuynel',
    }).returning();
    brickProduct = created;
  }

  let gachDac = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, 'GACH-DAC-TUYNEL') });
  if (!gachDac) {
    const [v] = await db.insert(productVariants).values({
      productId: brickProduct.id,
      brandId: brandMap['Tuynel'],
      name: 'Gạch đặc Tuynel',
      sku: 'GACH-DAC-TUYNEL',
      specification: 'Viên tiêu chuẩn',
      baseUnitId: unitMap['PIECE'],
      minimumStock: '2000',
    }).returning();
    gachDac = v;
  }
  variantInventoryToSeed.push({ id: gachDac.id, stock: 8000, baseUnitId: unitMap['PIECE'], avgCost: 1200 });

  let gach2Lo = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, 'GACH-2LO-TUYNEL') });
  if (!gach2Lo) {
    const [v] = await db.insert(productVariants).values({
      productId: brickProduct.id,
      brandId: brandMap['Tuynel'],
      name: 'Gạch 2 lỗ Tuynel',
      sku: 'GACH-2LO-TUYNEL',
      specification: 'Viên 2 lỗ',
      baseUnitId: unitMap['PIECE'],
      minimumStock: '2000',
    }).returning();
    gach2Lo = v;
  }
  variantInventoryToSeed.push({ id: gach2Lo.id, stock: 10000, baseUnitId: unitMap['PIECE'], avgCost: 950 });

  // 8.5 Đinh (TÚI 5KG)
  let nailsProduct = await db.query.products.findFirst({
    where: eq(products.code, 'DINH-DONG'),
  });
  if (!nailsProduct) {
    const [created] = await db.insert(products).values({
      code: 'DINH-DONG',
      name: 'Đinh đóng gỗ cốp pha',
      categoryId: categoryMap['Đinh'],
      description: 'Đinh 5 phân và 7 phân đóng túi 5kg',
    }).returning();
    nailsProduct = created;
  }

  // Đinh 5 (Túi 5kg)
  let dinh5 = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, 'DINH-5') });
  if (!dinh5) {
    const [v] = await db.insert(productVariants).values({
      productId: nailsProduct.id,
      name: 'Đinh 5 phân (Túi 5kg)',
      sku: 'DINH-5',
      specification: 'Túi 5kg',
      baseUnitId: unitMap['TUI'], // Unit = TUI (Túi)
      minimumStock: '5',
    }).returning();
    dinh5 = v;
  } else {
    await db.update(productVariants).set({
      name: 'Đinh 5 phân (Túi 5kg)',
      specification: 'Túi 5kg',
      baseUnitId: unitMap['TUI'],
    }).where(eq(productVariants.id, dinh5.id));
  }
  variantInventoryToSeed.push({ id: dinh5.id, stock: 50, baseUnitId: unitMap['TUI'], avgCost: 85000 });

  // Đinh 7 (Túi 5kg)
  let dinh7 = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, 'DINH-7') });
  if (!dinh7) {
    const [v] = await db.insert(productVariants).values({
      productId: nailsProduct.id,
      name: 'Đinh 7 phân (Túi 5kg)',
      sku: 'DINH-7',
      specification: 'Túi 5kg',
      baseUnitId: unitMap['TUI'], // Unit = TUI (Túi)
      minimumStock: '5',
    }).returning();
    dinh7 = v;
  } else {
    await db.update(productVariants).set({
      name: 'Đinh 7 phân (Túi 5kg)',
      specification: 'Túi 5kg',
      baseUnitId: unitMap['TUI'],
    }).where(eq(productVariants.id, dinh7.id));
  }
  variantInventoryToSeed.push({ id: dinh7.id, stock: 50, baseUnitId: unitMap['TUI'], avgCost: 85000 });

  // 8.6 Con kê bê tông (TÍNH THEO HỘP - ĐỒNG GIÁ)
  let spacerProduct = await db.query.products.findFirst({
    where: eq(products.code, 'CON-KE-BE-TONG'),
  });
  if (!spacerProduct) {
    const [created] = await db.insert(products).values({
      code: 'CON-KE-BE-TONG',
      name: 'Con kê bê tông mác cao',
      categoryId: categoryMap['Con kê bê tông'],
      description: 'Con kê dầm, sàn, cột đúc sẵn tính theo Hộp (đồng giá)',
    }).returning();
    spacerProduct = created;
  }

  // Con kê V1
  let spacerV1 = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, 'CON-KE-V1') });
  if (!spacerV1) {
    const [v] = await db.insert(productVariants).values({
      productId: spacerProduct.id,
      name: 'Con kê bê tông V1 (Sàn 15/20mm)',
      sku: 'CON-KE-V1',
      specification: 'Hộp',
      baseUnitId: unitMap['HOP'], // Unit = HOP (Hộp)
      minimumStock: '10',
    }).returning();
    spacerV1 = v;
  } else {
    await db.update(productVariants).set({
      specification: 'Hộp',
      baseUnitId: unitMap['HOP'],
    }).where(eq(productVariants.id, spacerV1.id));
  }
  variantInventoryToSeed.push({ id: spacerV1.id, stock: 60, baseUnitId: unitMap['HOP'], avgCost: 90000 });

  // Con kê V2
  let spacerV2 = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, 'CON-KE-V2') });
  if (!spacerV2) {
    const [v] = await db.insert(productVariants).values({
      productId: spacerProduct.id,
      name: 'Con kê bê tông V2 (Dầm 20/25mm)',
      sku: 'CON-KE-V2',
      specification: 'Hộp',
      baseUnitId: unitMap['HOP'], // Unit = HOP (Hộp)
      minimumStock: '10',
    }).returning();
    spacerV2 = v;
  } else {
    await db.update(productVariants).set({
      specification: 'Hộp',
      baseUnitId: unitMap['HOP'],
    }).where(eq(productVariants.id, spacerV2.id));
  }
  variantInventoryToSeed.push({ id: spacerV2.id, stock: 60, baseUnitId: unitMap['HOP'], avgCost: 90000 });

  // Con kê V3
  let spacerV3 = await db.query.productVariants.findFirst({ where: eq(productVariants.sku, 'CON-KE-V3') });
  if (!spacerV3) {
    const [v] = await db.insert(productVariants).values({
      productId: spacerProduct.id,
      name: 'Con kê bê tông V3 (Cột/Vách 25/30mm)',
      sku: 'CON-KE-V3',
      specification: 'Hộp',
      baseUnitId: unitMap['HOP'], // Unit = HOP (Hộp)
      minimumStock: '10',
    }).returning();
    spacerV3 = v;
  } else {
    await db.update(productVariants).set({
      specification: 'Hộp',
      baseUnitId: unitMap['HOP'],
    }).where(eq(productVariants.id, spacerV3.id));
  }
  variantInventoryToSeed.push({ id: spacerV3.id, stock: 60, baseUnitId: unitMap['HOP'], avgCost: 90000 });

  console.log('✅ Bricks, Nails (Túi 5kg), and Spacers (Hộp) seeded');

  // 8.7 Seed Initial Clean Inventory Balances & Ledger Transactions
  for (const item of variantInventoryToSeed) {
    await db.insert(inventoryBalances).values({
      warehouseId: primaryWarehouse.id,
      productVariantId: item.id,
      currentStock: String(item.stock),
      reservedStock: '0',
      baseUnitId: item.baseUnitId,
    });

    await db.insert(inventoryTransactions).values({
      warehouseId: primaryWarehouse.id,
      productVariantId: item.id,
      transactionType: 'PURCHASE_IN',
      referenceType: 'INITIAL_STOCK',
      originalQuantity: String(item.stock),
      originalUnitId: item.baseUnitId,
      baseQuantity: String(item.stock),
      baseUnitId: item.baseUnitId,
      costPerBaseUnit: item.avgCost,
      totalCost: Math.round(item.stock * item.avgCost),
      notes: 'Khởi tạo số dư tồn kho ban đầu',
    });

    await db.insert(productCosts).values({
      productVariantId: item.id,
      averageCost: item.avgCost,
      lastPurchasePrice: item.avgCost,
      baseUnitId: item.baseUnitId,
    });
  }
  console.log('✅ Initial Clean Inventory seeded for warehouse:', primaryWarehouse.name);

  // 9. Customers & Projects
  let customerA = await db.query.customers.findFirst({
    where: eq(customers.name, 'Nguyễn Văn A'),
  });
  if (!customerA) {
    const [c] = await db.insert(customers).values({
      name: 'Nguyễn Văn A',
      phone: '0912345678',
      address: 'Xã Hương Sơn, Huyện Mỹ Đức, Hà Nội',
      customerType: 'RETAIL',
      notes: 'Khách xây nhà mới ở Yên Vỹ',
    }).returning();
    customerA = c;

    // Project for Customer A
    await db.insert(projects).values({
      customerId: customerA.id,
      name: 'Nhà 3 tầng Yên Vỹ',
      address: 'Thôn Yên Vỹ, Hương Sơn, Mỹ Đức, Hà Nội',
      contactName: 'Anh A',
      contactPhone: '0912345678',
      startDate: '2026-08-01',
      status: 'ACTIVE',
      notes: 'Công trình nhà ở gia đình 3 tầng mái Thái',
    });
  }

  const existingBuilder = await db.query.customers.findFirst({
    where: eq(customers.name, 'Thợ Tuấn'),
  });
  if (!existingBuilder) {
    const [c] = await db.insert(customers).values({
      name: 'Thợ Tuấn',
      phone: '0988112233',
      address: 'Thị trấn Đại Nghĩa, Mỹ Đức, Hà Nội',
      customerType: 'BUILDER',
      notes: 'Cai thầu chuyên nhận nhà dân trong huyện',
    }).returning();

    await db.insert(projects).values({
      customerId: c.id,
      name: 'Nhà cấp 4 mái Nhật Đại Nghĩa',
      address: 'Khu 2, TT Đại Nghĩa',
      contactName: 'Thợ Tuấn',
      contactPhone: '0988112233',
      status: 'ACTIVE',
    });
  }
  console.log('✅ Customers and Projects seeded');

  // 10. Suppliers
  const defaultSuppliers = [
    { name: 'Công ty TNHH Thép Hòa Phát Hưng Yên', phone: '02439876543', address: 'KCN Phố Nối A, Hưng Yên', notes: 'Nhà máy cung ứng thép chính hãng' },
    { name: 'Nhà phân phối Xi măng Miền Bắc', phone: '02431234567', address: 'Quốc lộ 1A, Thanh Trì, Hà Nội', notes: 'Tổng kho phân phối xi măng Nghi Sơn, Hoàng Thạch' },
    { name: 'Mỏ khai thác Cát Sỏi Sông Lô', phone: '02103888999', address: 'Bến Cát Sông Lô, Phú Thọ', notes: 'Nhà cung cấp cát vàng, cát đen sỏi sà lan' },
  ];

  for (const s of defaultSuppliers) {
    const existing = await db.query.suppliers.findFirst({
      where: eq(suppliers.name, s.name),
    });
    if (!existing) {
      await db.insert(suppliers).values(s);
    }
  }
  console.log('✅ Suppliers seeded');

  // 11. Vehicles & Drivers
  const defaultVehicles = [
    { name: 'Xe tải thùng 3.5 tấn', plateNumber: '29C-123.45', type: 'Xe tải chở sắt xi', notes: 'Chuyên chở xi măng, sắt thép' },
    { name: 'Xe ben 7m³', plateNumber: '29H-678.90', type: 'Xe ben chở cát sỏi', notes: 'Chuyên chở vật liệu rời cát, đá, sỏi' },
  ];

  for (const v of defaultVehicles) {
    const existing = await db.query.vehicles.findFirst({
      where: eq(vehicles.plateNumber, v.plateNumber),
    });
    if (!existing) {
      await db.insert(vehicles).values(v);
    }
  }

  const defaultDrivers = [
    { name: 'Nguyễn Văn Chủ', phone: '0987654321', notes: 'Chủ cửa hàng trực tiếp lái xe giao hàng' },
    { name: 'Trần Văn Lái', phone: '0966554433', notes: 'Tài xế xe ben cát sỏi' },
  ];

  for (const d of defaultDrivers) {
    const existing = await db.query.drivers.findFirst({
      where: eq(drivers.name, d.name),
    });
    if (!existing) {
      await db.insert(drivers).values(d);
    }
  }
  console.log('✅ Vehicles and Drivers seeded');

  // 12. Expense Categories
  const defaultExpenseCategories = [
    { code: 'XANG_DAU', name: 'Xăng dầu xe tải & xe ben', description: 'Chi phí nhiên liệu dầu Diesel cho đội xe giao hàng' },
    { code: 'SUA_CHUA_XE', name: 'Sửa chữa & Bảo dưỡng xe', description: 'Thay nhớt, bảo dưỡng định kỳ, thay lốp xe' },
    { code: 'LUONG_THO_LAI', name: 'Tiền công bốc xếp & Tài xế', description: 'Tiền công bốc vác xi măng, sắt thép và bồi dưỡng lái xe' },
    { code: 'MAT_BANG', name: 'Thuê mặt bằng & Kho bãi', description: 'Chi phí thuê bãi tập kết vật liệu và kho chứa' },
    { code: 'DIEN_NUOC', name: 'Điện, nước & Viễn thông', description: 'Hóa đơn tiền điện sinh hoạt, nước bãi và cước Internet' },
    { code: 'CHI_KHAC', name: 'Chi phí quản lý khác', description: 'Tiếp khách, văn phòng phẩm, vật tư phụ' },
  ];

  for (const ec of defaultExpenseCategories) {
    const existing = await db.query.expenseCategories.findFirst({
      where: eq(expenseCategories.code, ec.code),
    });
    if (!existing) {
      await db.insert(expenseCategories).values(ec);
    }
  }
  console.log('✅ Expense categories seeded');

  console.log('\n🎉 VLXD Clean Single-Warehouse & Units Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});


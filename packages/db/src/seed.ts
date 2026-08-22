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
} from './schema/index.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 12;

async function seed() {
  console.log('🌱 Seeding database for VLXD System...');

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

  // 3. Units
  const defaultUnits = [
    { code: 'KG', name: 'Kilôgam' },
    { code: 'TON', name: 'Tấn' },
    { code: 'BAG', name: 'Bao (50kg)' },
    { code: 'M3', name: 'Mét khối (m³)' },
    { code: 'PIECE', name: 'Viên / Cục' },
    { code: 'PALLET', name: 'Pallet' },
    { code: 'BAR', name: 'Cây (11.7m)' },
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

  // 5. Warehouses
  const defaultWarehouses = [
    { name: 'Kho Xi Sắt', address: 'Khu A - Cửa hàng chính', description: 'Kho chứa xi măng, sắt thép thanh và cuộn' },
    { name: 'Bãi Cát Sỏi Gạch', address: 'Khu B - Bãi ngoài trời', description: 'Bãi chứa cát vàng, cát đen, sỏi đá và gạch xây' },
  ];

  const warehouseMap: Record<string, string> = {};
  for (const wh of defaultWarehouses) {
    let existing = await db.query.warehouses.findFirst({
      where: eq(warehouses.name, wh.name),
    });
    if (!existing) {
      const [created] = await db.insert(warehouses).values(wh).returning();
      existing = created;
    }
    warehouseMap[wh.name] = existing.id;
  }
  console.log('✅ Warehouses seeded');

  // 6. Product Categories
  const defaultCategories = [
    { name: 'Sắt thép', sortOrder: 1, description: 'Thép thanh vằn, thép cuộn xây dựng' },
    { name: 'Xi măng', sortOrder: 2, description: 'Xi măng các loại đóng bao 50kg' },
    { name: 'Cát', sortOrder: 3, description: 'Cát vàng xây trát, cát đen san lấp' },
    { name: 'Sỏi & Đá', sortOrder: 4, description: 'Sỏi cuội, đá 1x2, đá 2x4' },
    { name: 'Gạch xây', sortOrder: 5, description: 'Gạch tuynel, gạch đặc, gạch lỗ' },
    { name: 'Con kê bê tông', sortOrder: 6, description: 'Con kê bê tông đúc sẵn chịu lực' },
    { name: 'Đinh', sortOrder: 7, description: 'Đinh đóng cốp pha, đinh 5, đinh 7' },
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
    { type: 'COIL', diameter: '6', length: null, kgPerM: '0.222', kgPerBar: null, sku: 'THEP-D6-CUON', spec: 'D6 Cuộn' },
    { type: 'COIL', diameter: '8', length: null, kgPerM: '0.395', kgPerBar: null, sku: 'THEP-D8-CUON', spec: 'D8 Cuộn' },
    { type: 'COIL', diameter: '6', length: null, kgPerM: '0.222', kgPerBar: null, sku: 'DAI-BE-D6', spec: 'Đai sắt D6 bẻ sẵn (Dầm, Móng, Cột)' },
    { type: 'COIL', diameter: '8', length: null, kgPerM: '0.395', kgPerBar: null, sku: 'DAI-BE-D8', spec: 'Đai sắt D8 bẻ sẵn (Dầm, Móng, Cột)' },
    { type: 'BAR', diameter: '10', length: '11.7', kgPerM: '0.617', kgPerBar: '7.2189', sku: 'THEP-D10-HP', spec: 'D10 (11.7m)' },
    { type: 'BAR', diameter: '12', length: '11.7', kgPerM: '0.888', kgPerBar: '10.3896', sku: 'THEP-D12-HP', spec: 'D12 (11.7m)' },
    { type: 'BAR', diameter: '14', length: '11.7', kgPerM: '1.210', kgPerBar: '14.1570', sku: 'THEP-D14-HP', spec: 'D14 (11.7m)' },
    { type: 'BAR', diameter: '16', length: '11.7', kgPerM: '1.580', kgPerBar: '18.4860', sku: 'THEP-D16-HP', spec: 'D16 (11.7m)' },
    { type: 'BAR', diameter: '18', length: '11.7', kgPerM: '2.000', kgPerBar: '23.4000', sku: 'THEP-D18-HP', spec: 'D18 (11.7m)' },
    { type: 'BAR', diameter: '20', length: '11.7', kgPerM: '2.470', kgPerBar: '28.8990', sku: 'THEP-D20-HP', spec: 'D20 (11.7m)' },
    { type: 'BAR', diameter: '22', length: '11.7', kgPerM: '2.980', kgPerBar: '34.8660', sku: 'THEP-D22-HP', spec: 'D22 (11.7m)' },
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

    // Nghi Sơn PCB40
    await db.insert(productVariants).values({
      productId: cementProduct.id,
      brandId: brandMap['Nghi Sơn'],
      name: 'Xi măng Nghi Sơn PCB40',
      sku: 'XM-NGHI-SON-PCB40',
      specification: 'Bao 50kg',
      baseUnitId: unitMap['BAG'], // Base unit = BAG
      minimumStock: '50',
    });

    // Hoàng Thạch PCB30
    await db.insert(productVariants).values({
      productId: cementProduct.id,
      brandId: brandMap['Hoàng Thạch'],
      name: 'Xi măng Hoàng Thạch PCB30',
      sku: 'XM-HOANG-THACH-PCB30',
      specification: 'Bao 50kg',
      baseUnitId: unitMap['BAG'],
      minimumStock: '50',
    });
  }
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

    await db.insert(productVariants).values({
      productId: sandProduct.id,
      name: 'Cát vàng bê tông',
      sku: 'CAT-VANG',
      specification: 'm³',
      baseUnitId: unitMap['M3'],
      minimumStock: '10',
    });

    await db.insert(productVariants).values({
      productId: sandProduct.id,
      name: 'Cát đen xây trát',
      sku: 'CAT-DEN',
      specification: 'm³',
      baseUnitId: unitMap['M3'],
      minimumStock: '10',
    });
  }

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

    await db.insert(productVariants).values({
      productId: stoneProduct.id,
      name: 'Đá 1x2 bê tông',
      sku: 'DA-1X2',
      specification: 'm³',
      baseUnitId: unitMap['M3'],
      minimumStock: '10',
    });

    await db.insert(productVariants).values({
      productId: stoneProduct.id,
      name: 'Đá 2x4 đổ móng',
      sku: 'DA-2X4',
      specification: 'm³',
      baseUnitId: unitMap['M3'],
      minimumStock: '10',
    });
  }
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

    await db.insert(productVariants).values({
      productId: brickProduct.id,
      brandId: brandMap['Tuynel'],
      name: 'Gạch đặc Tuynel',
      sku: 'GACH-DAC-TUYNEL',
      specification: 'Viên tiêu chuẩn',
      baseUnitId: unitMap['PIECE'],
      minimumStock: '2000',
    });

    await db.insert(productVariants).values({
      productId: brickProduct.id,
      brandId: brandMap['Tuynel'],
      name: 'Gạch 2 lỗ Tuynel',
      sku: 'GACH-2LO-TUYNEL',
      specification: 'Viên 2 lỗ',
      baseUnitId: unitMap['PIECE'],
      minimumStock: '2000',
    });
  }

  // 8.5 Đinh & Con kê
  let nailsProduct = await db.query.products.findFirst({
    where: eq(products.code, 'DINH-DONG'),
  });
  if (!nailsProduct) {
    const [created] = await db.insert(products).values({
      code: 'DINH-DONG',
      name: 'Đinh đóng gỗ cốp pha',
      categoryId: categoryMap['Đinh'],
      description: 'Đinh 5, đinh 7 đóng bao 5kg',
    }).returning();
    nailsProduct = created;

    await db.insert(productVariants).values({
      productId: nailsProduct.id,
      name: 'Đinh 5 phân',
      sku: 'DINH-5',
      specification: 'Bao 5kg',
      baseUnitId: unitMap['BAG'],
      minimumStock: '5',
    });

    await db.insert(productVariants).values({
      productId: nailsProduct.id,
      name: 'Đinh 7 phân',
      sku: 'DINH-7',
      specification: 'Bao 5kg',
      baseUnitId: unitMap['BAG'],
      minimumStock: '5',
    });
  }

  let spacerProduct = await db.query.products.findFirst({
    where: eq(products.code, 'CON-KE-BE-TONG'),
  });
  if (!spacerProduct) {
    const [created] = await db.insert(products).values({
      code: 'CON-KE-BE-TONG',
      name: 'Con kê bê tông mác cao',
      categoryId: categoryMap['Con kê bê tông'],
      description: 'Con kê dầm, sàn, cột',
    }).returning();
    spacerProduct = created;

    await db.insert(productVariants).values({
      productId: spacerProduct.id,
      name: 'Con kê bê tông V1 (Sàn 15/20mm)',
      sku: 'CON-KE-V1',
      specification: 'Cục',
      baseUnitId: unitMap['PIECE'],
      minimumStock: '100',
    });

    await db.insert(productVariants).values({
      productId: spacerProduct.id,
      name: 'Con kê bê tông V2 (Dầm 20/25mm)',
      sku: 'CON-KE-V2',
      specification: 'Cục',
      baseUnitId: unitMap['PIECE'],
      minimumStock: '100',
    });
  }
  console.log('✅ Bricks, Nails, and Spacers seeded');

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

  console.log('\n🎉 VLXD Master Data & System Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

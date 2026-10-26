const mongoose = require('mongoose');
const User = require('./models/user');
const Category = require('./models/category');
const Product = require('./models/product');
const Order = require('./models/order');
const Review = require('./models/review');
const Coupon = require('./models/coupon');
const Banner = require('./models/banner');
const ShippingZone = require('./models/shippingZone');
const Payout = require('./models/payout');
const ReturnRequest = require('./models/returnRequest');
const AuditLog = require('./models/auditLog');
const AdminNotification = require('./models/adminNotification');
const SystemSetting = require('./models/systemSetting');
const DeliveryEarning = require('./models/deliveryEarning');
const DeliveryNotification = require('./models/deliveryNotification');

const seedData = async () => {
  try {
    console.log('--- Checking & Seeding Initial Database Data ---');

    // 1. Seed Categories if empty
    let categories = await Category.find({});
    if (categories.length === 0) {
      console.log('Seeding categories...');
      categories = await Category.insertMany([
        {
          name: 'Electronics',
          slug: 'electronics',
          mark: '01',
          tone: 'lilac',
          description: 'Cutting-edge gadgets, audio essentials, and modern digital lifestyle gear.',
          image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Fashion',
          slug: 'fashion',
          mark: '02',
          tone: 'peach',
          description: 'Timeless apparel, premium fabrics, footwear, and curated wardrobe staples.',
          image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Home & Living',
          slug: 'home',
          mark: '03',
          tone: 'mint',
          description: 'Warm, minimalist home accents, artisanal tableware, and calm living essentials.',
          image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Beauty',
          slug: 'beauty',
          mark: '04',
          tone: 'rose',
          description: 'Clean skincare, restorative botanical fragrances, and mindful self-care.',
          image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
        },
      ]);
      console.log(`✓ Seeded ${categories.length} categories`);
    }

    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.slug] = cat._id;
    });

    // 2. Seed Users if empty
    const adminUser = await User.findOne({ email: 'admin@appsica.com' });
    if (!adminUser) {
      console.log('Seeding default admin user...');
      await User.create({
        name: 'Appsica Admin',
        email: 'admin@appsica.com',
        password: 'admin123',
        role: 'admin',
        phone: '9876543210',
      });
      console.log('✓ Seeded admin user: admin@appsica.com / admin123');
    }

    const demoUser = await User.findOne({ email: 'user@appsica.com' });
    if (!demoUser) {
      console.log('Seeding default demo customer...');
      await User.create({
        name: 'Alex Morgan',
        email: 'user@appsica.com',
        password: 'user123',
        role: 'user',
        phone: '9876543211',
      });
      console.log('✓ Seeded demo user: user@appsica.com / user123');
    }

    let defaultVendor = await User.findOne({ email: 'vendor@appsica.com' });
    if (!defaultVendor) {
      console.log('Seeding approved demo vendor...');
      defaultVendor = await User.create({
        name: 'Marcus Vance',
        email: 'vendor@appsica.com',
        password: 'vendor123',
        role: 'vendor',
        vendorStatus: 'approved',
        storeName: 'Aura Sound & Tech',
        storeDescription: 'Crafting audiophile acoustic gear, modular keyboards, and ambient desktop accessories for modern creators.',
        storeLogo: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=200&q=80',
        storeBanner: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
        businessAddress: '402 Innovation Way, Tech Park, Bangalore, KA - 560100',
        taxId: '29ABCDE1234F1Z5',
        phone: '9876543220',
        commissionRate: 10,
        payoutDetails: {
          accountHolder: 'Marcus Vance',
          accountNumber: '98765432109876',
          bankName: 'HDFC Bank Ltd',
          ifsc: 'HDFC0001234',
          upiId: 'aurasound@upi',
        },
        vendorApprovedAt: new Date(),
      });
      console.log('✓ Seeded approved vendor: vendor@appsica.com / vendor123');
    }

    const pendingVendor = await User.findOne({ email: 'pendingvendor@appsica.com' });
    if (!pendingVendor) {
      console.log('Seeding pending demo vendor...');
      await User.create({
        name: 'Elena Rostova',
        email: 'pendingvendor@appsica.com',
        password: 'vendor123',
        role: 'vendor',
        vendorStatus: 'pending',
        storeName: 'Urban Threads Co.',
        storeDescription: 'Sustainable organic cotton apparel and artisanal everyday accessories.',
        businessAddress: '12 Fashion Avenue, Bandra West, Mumbai, MH - 400050',
        taxId: '27AABCT5678K1ZQ',
        phone: '9876543221',
        commissionRate: 10,
      });
      console.log('✓ Seeded pending vendor: pendingvendor@appsica.com / vendor123');
    }

    // Seed Demo Delivery Partners
    let defaultDelivery = await User.findOne({ email: 'delivery@appsica.com' });
    if (!defaultDelivery) {
      console.log('Seeding approved demo delivery partner...');
      defaultDelivery = await User.create({
        name: 'Vikram Sharma',
        email: 'delivery@appsica.com',
        password: 'delivery123',
        role: 'delivery',
        deliveryStatus: 'approved',
        vehicleType: 'bike',
        vehicleNumber: 'MH-02-CD-5678',
        drivingLicenseNumber: 'DL-9876543210',
        emergencyContact: '9876500001',
        deliveryCity: 'Mumbai',
        phone: '9876543230',
        isOnline: true,
        deliveryRating: 4.9,
        totalDeliveriesCount: 42,
      });
      console.log('✓ Seeded approved delivery partner: delivery@appsica.com / delivery123');
    }

    const pendingDelivery = await User.findOne({ email: 'pendingdelivery@appsica.com' });
    if (!pendingDelivery) {
      console.log('Seeding pending demo delivery partner...');
      await User.create({
        name: 'Rohan Verma',
        email: 'pendingdelivery@appsica.com',
        password: 'delivery123',
        role: 'delivery',
        deliveryStatus: 'pending',
        vehicleType: 'electric',
        vehicleNumber: 'MH-03-EF-9012',
        drivingLicenseNumber: 'DL-1234567890',
        emergencyContact: '9876500002',
        deliveryCity: 'Mumbai',
        phone: '9876543231',
        isOnline: false,
      });
      console.log('✓ Seeded pending delivery partner: pendingdelivery@appsica.com / delivery123');
    }

    // 3. Seed Products if empty
    const productCount = await Product.countDocuments({});
    if (productCount === 0) {
      console.log('Seeding initial products catalog...');
      const sampleProducts = [
        // Electronics
        {
          name: 'Acoustic Studio ANC Headphones',
          slug: 'acoustic-studio-anc-headphones',
          description: 'Premium wireless headphones with custom 40mm beryllium drivers, 38-hour battery life, and adaptive active noise cancellation.',
          price: 14999,
          originalPrice: 18999,
          category: catMap['electronics'],
          images: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 25,
          rating: 4.8,
          reviewCount: 42,
          isFeatured: true,
          brand: 'SoundCraft',
        },
        {
          name: 'Lunar Minimalist Smartwatch Series 4',
          slug: 'lunar-minimalist-smartwatch-series-4',
          description: 'Ceramic bezel AMOLED smartwatch with continuous heart-rate tracking, sleep stages, titanium buckle, and 7-day battery life.',
          price: 8999,
          originalPrice: 11999,
          category: catMap['electronics'],
          images: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 18,
          rating: 4.7,
          reviewCount: 31,
          isFeatured: true,
          brand: 'Lunar',
        },
        {
          name: 'Nordic Mechanical Wireless Keyboard',
          slug: 'nordic-mechanical-wireless-keyboard',
          description: 'Compact 75% hot-swappable tactile mechanical keyboard crafted from aircraft-grade aluminum with PBT dye-sub keycaps.',
          price: 5499,
          originalPrice: 6999,
          category: catMap['electronics'],
          images: [
            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 15,
          rating: 4.9,
          reviewCount: 19,
          isFeatured: false,
          brand: 'NordicType',
        },
        {
          name: 'Aura True Wireless Earbuds',
          slug: 'aura-true-wireless-earbuds',
          description: 'Featherlight earbuds with spatial audio, IPX5 water resistance, and crystal-clear ENC dual-microphone setup.',
          price: 3299,
          originalPrice: 4999,
          category: catMap['electronics'],
          images: [
            'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 40,
          rating: 4.6,
          reviewCount: 54,
          isFeatured: false,
          brand: 'SoundCraft',
        },

        // Fashion
        {
          name: 'Merino Wool Minimalist Overcoat',
          slug: 'merino-wool-minimalist-overcoat',
          description: 'Tailored single-breasted overcoat woven from 100% sustainably sourced Australian Merino wool in deep charcoal.',
          price: 7999,
          originalPrice: 10499,
          category: catMap['fashion'],
          images: [
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 12,
          rating: 4.9,
          reviewCount: 28,
          isFeatured: true,
          brand: 'Appsica Studio',
        },
        {
          name: 'Organic Heavyweight Crewneck Sweatshirt',
          slug: 'organic-heavyweight-crewneck-sweatshirt',
          description: '450 GSM organic French terry cotton crewneck with ribbed cuffs, drop shoulders, and relaxed drape.',
          price: 2499,
          originalPrice: 3299,
          category: catMap['fashion'],
          images: [
            'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 35,
          rating: 4.7,
          reviewCount: 65,
          isFeatured: false,
          brand: 'Appsica Studio',
        },
        {
          name: 'Full-Grain Leather Weekend Duffel',
          slug: 'full-grain-leather-weekend-duffel',
          description: 'Handcrafted vegetable-tanned full-grain leather carry-on with solid brass YKK zippers and dedicated shoe compartment.',
          price: 6499,
          originalPrice: 8999,
          category: catMap['fashion'],
          images: [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 10,
          rating: 5.0,
          reviewCount: 17,
          isFeatured: true,
          brand: 'Atelier H',
        },
        {
          name: 'Artisan Canvas Low-Top Sneakers',
          slug: 'artisan-canvas-low-top-sneakers',
          description: 'Vulcanized natural rubber sole sneakers crafted with organic unbleached canvas and cushioned cork insole.',
          price: 3499,
          originalPrice: 4299,
          category: catMap['fashion'],
          images: [
            'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 22,
          rating: 4.6,
          reviewCount: 39,
          isFeatured: false,
          brand: 'Stride',
        },

        // Home & Living
        {
          name: 'Ceramic Pour-Over & Carafe Set',
          slug: 'ceramic-pour-over-carafe-set',
          description: 'Hand-thrown stoneware coffee dripper with heat-resistant borosilicate glass carafe and walnut collar.',
          price: 2199,
          originalPrice: 2899,
          category: catMap['home'],
          images: [
            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 20,
          rating: 4.8,
          reviewCount: 22,
          isFeatured: true,
          brand: 'Kanso Living',
        },
        {
          name: 'Aroma Diffuser & Lava Stone Set',
          slug: 'aroma-diffuser-lava-stone-set',
          description: 'Ultrasonic whisper-quiet mist diffuser housed in matte ceramic, paired with raw volcanic basalt diffusion stones.',
          price: 1899,
          originalPrice: 2499,
          category: catMap['home'],
          images: [
            'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 30,
          rating: 4.7,
          reviewCount: 15,
          isFeatured: false,
          brand: 'Kanso Living',
        },
        {
          name: 'Hand-Woven Textured Wool Throw Blanket',
          slug: 'hand-woven-textured-wool-throw-blanket',
          description: 'Plush New Zealand virgin wool throw with fringed edges, naturally warm and breathable for every corner of your home.',
          price: 3299,
          originalPrice: 4499,
          category: catMap['home'],
          images: [
            'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 14,
          rating: 4.9,
          reviewCount: 18,
          isFeatured: false,
          brand: 'Kanso Living',
        },

        // Beauty
        {
          name: 'Botanical Night Repair Serum',
          slug: 'botanical-night-repair-serum',
          description: 'Cold-pressed rosehip seed oil infused with blue tansy, squalane, and vitamin C for intense nighttime regeneration.',
          price: 1799,
          originalPrice: 2299,
          category: catMap['beauty'],
          images: [
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 45,
          rating: 4.9,
          reviewCount: 52,
          isFeatured: true,
          brand: 'Flora & Earth',
        },
        {
          name: 'Sandalwood & Amber Eau de Parfum (50ml)',
          slug: 'sandalwood-amber-eau-de-parfum',
          description: 'Rich woody aromatic fragrance featuring Mysore sandalwood, smoky vetiver, amber resin, and crisp bergamot top notes.',
          price: 3699,
          originalPrice: 4500,
          category: catMap['beauty'],
          images: [
            'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
          ],
          stock: 16,
          rating: 4.8,
          reviewCount: 34,
          isFeatured: false,
          brand: 'Maison Appsica',
        },
      ];

      await Product.insertMany(sampleProducts);
      console.log(`✓ Seeded ${sampleProducts.length} curated products`);
    }

    // 4. Seed Coupons if empty
    const couponCount = await Coupon.countDocuments({});
    if (couponCount === 0) {
      console.log('Seeding coupons...');
      await Coupon.insertMany([
        {
          code: 'WELCOME10',
          discountType: 'percent',
          discountValue: 10,
          minOrderAmount: 999,
          maxDiscount: 500,
          isActive: true,
        },
        {
          code: 'APPSICA20',
          discountType: 'percent',
          discountValue: 20,
          minOrderAmount: 1999,
          maxDiscount: 1000,
          isActive: true,
        },
        {
          code: 'FLAT100',
          discountType: 'fixed',
          discountValue: 100,
          minOrderAmount: 500,
          isActive: true,
        },
      ]);
      console.log('✓ Seeded coupons (WELCOME10, APPSICA20, FLAT100)');
    }

    // 5. Seed Shipping zones if empty
    const shippingCount = await ShippingZone.countDocuments({});
    if (shippingCount === 0) {
      console.log('Seeding shipping zones...');
      await ShippingZone.insertMany([
        {
          name: 'All India Standard Zone',
          rate: 79,
          freeShippingThreshold: 999,
          estimatedDays: '3-5 business days',
          isActive: true,
        },
      ]);
      console.log('✓ Seeded standard shipping zone');
    }

    // 6. Seed Banners if empty
    const bannerCount = await Banner.countDocuments({});
    if (bannerCount === 0) {
      console.log('Seeding banners...');
      await Banner.insertMany([
        {
          title: 'The New Season Edit',
          subtitle: 'Thoughtful additions for your everyday life and home.',
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
          link: '/products',
          position: 1,
          isActive: true,
        },
      ]);
      console.log('✓ Seeded hero banners');
    }

    // 7. Associate products and seed vendor orders if empty
    if (defaultVendor) {
      // Assign acoustic headphones and mechanical keyboard to defaultVendor if they don't have a vendor
      const vendorProds = await Product.find({
        slug: { $in: ['acoustic-studio-anc-headphones', 'nordic-mechanical-wireless-keyboard', 'lunar-minimalist-smartwatch-series-4'] },
      });

      for (const vp of vendorProds) {
        if (!vp.vendor) {
          vp.vendor = defaultVendor._id;
          vp.brand = defaultVendor.storeName;
          vp.vendorStatus = 'approved';
          await vp.save();
        }
      }

      // Check if vendor has any orders, if not seed 2 sample orders
      const vendorOrdersCount = await Order.countDocuments({ 'items.vendor': defaultVendor._id });
      if (vendorOrdersCount === 0 && vendorProds.length > 0) {
        console.log('Seeding demo vendor orders...');
        const p1 = vendorProds[0];
        const p2 = vendorProds[1] || vendorProds[0];

        await Order.create({
          user: demoUser ? demoUser._id : null,
          orderId: `ORD-20261025-V101`,
          invoiceNumber: `INV-20261025-V101`,
          items: [
            {
              product: p1._id,
              name: p1.name,
              price: p1.price,
              quantity: 1,
              image: p1.images?.[0] || '',
              vendor: defaultVendor._id,
              itemStatus: 'Delivered',
            },
          ],
          shippingAddress: {
            fullName: 'Alex Morgan',
            phone: '9876543211',
            addressLine: 'Apt 4B, Horizon Heights, MG Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
          },
          paymentMethod: 'card',
          paymentStatus: 'Paid',
          orderStatus: 'Delivered',
          subtotal: p1.price,
          delivery: 0,
          discount: 0,
          total: p1.price,
          courierName: 'BlueDart Express',
          trackingNumber: 'TRK-BD-890214',
          statusHistory: [
            { status: 'Order Placed', timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
            { status: 'Processing', timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000) },
            { status: 'Shipped', timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000) },
            { status: 'Delivered', timestamp: new Date() },
          ],
        });

        await Order.create({
          user: demoUser ? demoUser._id : null,
          orderId: `ORD-20261026-V102`,
          invoiceNumber: `INV-20261026-V102`,
          items: [
            {
              product: p2._id,
              name: p2.name,
              price: p2.price,
              quantity: 2,
              image: p2.images?.[0] || '',
              vendor: defaultVendor._id,
              itemStatus: 'Processing',
            },
          ],
          shippingAddress: {
            fullName: 'Priya Sharma',
            phone: '9812345678',
            addressLine: 'House 77, Silver Oaks Colony',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411001',
          },
          paymentMethod: 'upi',
          paymentStatus: 'Paid',
          orderStatus: 'Processing',
          subtotal: p2.price * 2,
          delivery: 0,
          discount: 0,
          total: p2.price * 2,
          courierName: 'Delhivery',
          trackingNumber: 'DLV-IN-445129',
          statusHistory: [
            { status: 'Order Placed', timestamp: new Date(Date.now() - 12 * 3600 * 1000) },
            { status: 'Processing', timestamp: new Date() },
          ],
        });

        console.log('✓ Seeded sample vendor orders');
      }

      // Check reviews
      const vendorReviewsCount = await Review.countDocuments({ product: { $in: vendorProds.map((p) => p._id) } });
      if (vendorReviewsCount === 0 && vendorProds.length > 0) {
        console.log('Seeding sample customer reviews for vendor...');
        await Review.create({
          product: vendorProds[0]._id,
          user: demoUser ? demoUser._id : adminUser._id,
          userName: 'Alex Morgan',
          rating: 5,
          title: 'Unbelievable acoustic depth and comfort',
          comment: 'The noise cancellation blocks out all office hum. Bass response is pristine without overpowering mids. Absolutely recommended!',
          helpful: 12,
          vendorReply: {
            text: 'Thank you Alex! We tuned the 40mm drivers specifically for natural acoustic balance. Delighted you are enjoying them!',
            repliedAt: new Date(),
          },
        });

        if (vendorProds[1]) {
          await Review.create({
            product: vendorProds[1]._id,
            user: demoUser ? demoUser._id : adminUser._id,
            userName: 'Siddharth Rao',
            rating: 5,
            title: 'Top-tier build quality and buttery switches',
            comment: 'Heavy solid aluminum body and smooth tactile feel. Connected seamlessly over Bluetooth with my Mac and PC.',
            helpful: 6,
          });
        }
        console.log('✓ Seeded sample vendor customer reviews');
      }
    }

    // Seed Demo Delivery Assignments & Earnings if empty
    if (defaultDelivery) {
      const deliveryOrdersCount = await Order.countDocuments({ deliveryPartner: defaultDelivery._id });
      if (deliveryOrdersCount === 0) {
        console.log('Seeding demo delivery partner assignments...');
        const allProds = await Product.find({}).limit(3);
        const p1 = allProds[0];
        const p2 = allProds[1] || allProds[0];

        // 1. Out for delivery with OTP 4928
        const activeOrder = await Order.create({
          user: demoUser ? demoUser._id : null,
          orderId: `ORD-DELIV-4928`,
          invoiceNumber: `INV-DELIV-4928`,
          items: [
            {
              product: p1._id,
              name: p1.name,
              price: p1.price,
              quantity: 1,
              image: p1.images?.[0] || '',
              vendor: defaultVendor ? defaultVendor._id : null,
              itemStatus: 'Shipped',
            },
          ],
          shippingAddress: {
            fullName: 'Alex Morgan',
            phone: '9876543211',
            addressLine: 'Apt 4B, Horizon Heights, MG Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
          },
          paymentMethod: 'cod',
          paymentStatus: 'Pending',
          orderStatus: 'Out for Delivery',
          deliveryStatus: 'Out for Delivery',
          deliveryPartner: defaultDelivery._id,
          deliveryFee: 50,
          deliveryAssignedAt: new Date(Date.now() - 4 * 3600 * 1000),
          deliveryAcceptedAt: new Date(Date.now() - 3 * 3600 * 1000),
          deliveryPickedUpAt: new Date(Date.now() - 2 * 3600 * 1000),
          deliveryOutForDeliveryAt: new Date(Date.now() - 1 * 3600 * 1000),
          deliveryOtp: '4928',
          deliveryOtpExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          subtotal: p1.price,
          delivery: 50,
          total: p1.price + 50,
          statusHistory: [
            { status: 'Order Placed', timestamp: new Date(Date.now() - 24 * 3600 * 1000) },
            { status: 'Confirmed', timestamp: new Date(Date.now() - 20 * 3600 * 1000) },
            { status: 'Ready to Ship', timestamp: new Date(Date.now() - 12 * 3600 * 1000) },
            { status: 'Delivery Assigned', timestamp: new Date(Date.now() - 4 * 3600 * 1000), note: 'Assigned to Vikram Sharma' },
            { status: 'Picked Up', timestamp: new Date(Date.now() - 2 * 3600 * 1000), note: 'Parcel collected from seller store' },
            { status: 'Out for Delivery', timestamp: new Date(Date.now() - 1 * 3600 * 1000), note: 'Package is out for delivery with Vikram Sharma' },
          ],
        });

        // 2. New pending assignment awaiting acceptance
        await Order.create({
          user: demoUser ? demoUser._id : null,
          orderId: `ORD-DELIV-2026`,
          invoiceNumber: `INV-DELIV-2026`,
          items: [
            {
              product: p2._id,
              name: p2.name,
              price: p2.price,
              quantity: 1,
              image: p2.images?.[0] || '',
              vendor: defaultVendor ? defaultVendor._id : null,
              itemStatus: 'Processing',
            },
          ],
          shippingAddress: {
            fullName: 'Priya Sharma',
            phone: '9876543215',
            addressLine: '12th Floor, Oberoi Splendor, JVLR, Andheri East',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400060',
          },
          paymentMethod: 'card',
          paymentStatus: 'Paid',
          orderStatus: 'Ready to Ship',
          deliveryStatus: 'Assigned',
          deliveryPartner: defaultDelivery._id,
          deliveryFee: 60,
          deliveryAssignedAt: new Date(),
          subtotal: p2.price,
          delivery: 60,
          total: p2.price + 60,
          statusHistory: [
            { status: 'Order Placed', timestamp: new Date(Date.now() - 6 * 3600 * 1000) },
            { status: 'Confirmed', timestamp: new Date(Date.now() - 4 * 3600 * 1000) },
            { status: 'Ready to Ship', timestamp: new Date(Date.now() - 2 * 3600 * 1000) },
            { status: 'Delivery Assigned', timestamp: new Date(), note: 'Assigned to Vikram Sharma' },
          ],
        });

        // 3. Completed delivery for earnings history
        const deliveredOrder = await Order.create({
          user: demoUser ? demoUser._id : null,
          orderId: `ORD-DELIV-COMPL`,
          invoiceNumber: `INV-DELIV-COMPL`,
          items: [
            {
              product: p1._id,
              name: p1.name,
              price: p1.price,
              quantity: 1,
              image: p1.images?.[0] || '',
              vendor: defaultVendor ? defaultVendor._id : null,
              itemStatus: 'Delivered',
            },
          ],
          shippingAddress: {
            fullName: 'Sameer Khan',
            phone: '9876543218',
            addressLine: 'Flat 302, Palm Beach Residency, Vashi',
            city: 'Navi Mumbai',
            state: 'Maharashtra',
            pincode: '400703',
          },
          paymentMethod: 'upi',
          paymentStatus: 'Paid',
          orderStatus: 'Delivered',
          deliveryStatus: 'Delivered',
          deliveryPartner: defaultDelivery._id,
          deliveryFee: 50,
          deliveryAssignedAt: new Date(Date.now() - 48 * 3600 * 1000),
          deliveryDeliveredAt: new Date(Date.now() - 24 * 3600 * 1000),
          subtotal: p1.price,
          delivery: 50,
          total: p1.price + 50,
        });

        await DeliveryEarning.create({
          deliveryPartner: defaultDelivery._id,
          order: deliveredOrder._id,
          orderId: deliveredOrder.orderId,
          baseFee: 50,
          incentive: 10,
          totalEarned: 60,
          status: 'settled',
        });

        console.log('✓ Seeded demo delivery assignments & initial earnings');
      }
    }

    // 8. Seed System Settings if not exists
    let settings = await SystemSetting.findOne({ key: 'global_config' });
    if (!settings) {
      console.log('Seeding global system settings...');
      await SystemSetting.create({
        key: 'global_config',
        platformName: 'Appsica Multi-Vendor Marketplace',
        defaultCommissionRate: 10,
        supportEmail: 'support@appsica.com',
        supportPhone: '+91 98765 43210',
        currency: 'INR',
        currencySymbol: '₹',
        autoApproveProducts: false,
        autoApproveVendors: false,
        maintenanceMode: false,
      });
      console.log('✓ Seeded global system settings');
    }

    // 9. Seed Payouts if empty
    const payoutCount = await Payout.countDocuments({});
    if (payoutCount === 0 && defaultVendor) {
      console.log('Seeding sample vendor payouts...');
      await Payout.create({
        payoutId: 'PAY-20261025-01',
        vendor: defaultVendor._id,
        storeName: defaultVendor.storeName,
        amount: 25499,
        commissionDeducted: 2833,
        grossSales: 28332,
        bankDetails: defaultVendor.payoutDetails || {},
        status: 'paid',
        transactionReference: 'NEFT-HDFC-991823719',
        notes: 'Monthly settlement for Oct 1 - Oct 15 cycle.',
        paidAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      });

      await Payout.create({
        payoutId: 'PAY-20261026-02',
        vendor: defaultVendor._id,
        storeName: defaultVendor.storeName,
        amount: 14200,
        commissionDeducted: 1578,
        grossSales: 15778,
        bankDetails: defaultVendor.payoutDetails || {},
        status: 'pending',
        notes: 'Pending payout request for recent acoustic deliveries.',
      });
      console.log('✓ Seeded vendor payouts');
    }

    // 10. Seed Return / Refund requests if empty
    const returnCount = await ReturnRequest.countDocuments({});
    const sampleOrder = await Order.findOne({});
    if (returnCount === 0 && sampleOrder) {
      console.log('Seeding return and refund requests...');
      await ReturnRequest.create({
        returnId: 'RET-20261025-01',
        order: sampleOrder._id,
        orderId: sampleOrder.orderId,
        customer: demoUser ? demoUser._id : null,
        customerName: 'Alex Morgan',
        customerEmail: 'user@appsica.com',
        productName: sampleOrder.items?.[0]?.name || 'Acoustic Studio ANC Headphones',
        vendor: defaultVendor ? defaultVendor._id : null,
        vendorStoreName: defaultVendor?.storeName || 'Aura Sound & Tech',
        refundAmount: 14999,
        reason: 'Slight cosmetic scuff on ear-cup packaging upon arrival.',
        customerNote: 'Headphones work, but packaging was dented. Requesting replacement or partial refund.',
        status: 'pending',
        isDispute: false,
      });

      await ReturnRequest.create({
        returnId: 'RET-20261024-02',
        order: sampleOrder._id,
        orderId: 'ORD-20261024-V099',
        customer: demoUser ? demoUser._id : null,
        customerName: 'Priya Sharma',
        customerEmail: 'priya@example.com',
        productName: 'Full-Grain Leather Weekend Duffel',
        vendor: defaultVendor ? defaultVendor._id : null,
        vendorStoreName: 'Urban Threads Co.',
        refundAmount: 6499,
        reason: 'Duplicate order placed by mistake during checkout.',
        status: 'refunded',
        adminDecisionNote: 'Approved. Gateway transaction refunded to original payment method.',
        refundTransactionId: 'RFND-RZP-9182049182',
        isDispute: false,
      });
      console.log('✓ Seeded return requests');
    }

    // 11. Seed Admin Notifications if empty
    const notifCount = await AdminNotification.countDocuments({});
    if (notifCount === 0) {
      console.log('Seeding admin notifications...');
      await AdminNotification.create([
        {
          title: 'New Vendor Registration Application',
          message: 'Urban Threads Co. (Elena Rostova) applied for seller verification with GSTIN 27AABCT5678K1ZQ.',
          type: 'VENDOR_APPROVAL',
          severity: 'warning',
          link: '/admin/vendor-applications',
          isRead: false,
        },
        {
          title: 'Product Review Required',
          message: 'New product "Nordic Minimalist Desk Clock" submitted by vendor Aura Sound requires catalog approval.',
          type: 'PRODUCT_MODERATION',
          severity: 'info',
          link: '/admin/products',
          isRead: false,
        },
        {
          title: 'Return Request Filed',
          message: 'Customer Alex Morgan filed a return request for order #ORD-20261025-V101.',
          type: 'RETURN_REQUEST',
          severity: 'warning',
          link: '/admin/returns',
          isRead: false,
        },
        {
          title: 'Inventory Low Stock Alert',
          message: '5 units remaining for "Merino Wool Minimalist Overcoat". Re-stock recommended.',
          type: 'LOW_STOCK',
          severity: 'critical',
          link: '/admin/products',
          isRead: false,
        },
      ]);
      console.log('✓ Seeded admin notifications');
    }

    // 12. Seed System Audit Logs if empty
    const auditCount = await AuditLog.countDocuments({});
    if (auditCount === 0) {
      console.log('Seeding initial audit logs...');
      await AuditLog.create([
        {
          adminEmail: 'admin@appsica.com',
          adminName: 'Appsica Admin',
          category: 'AUTH',
          action: 'ADMIN_LOGIN_SUCCESS',
          target: 'Security Session',
          details: 'Admin authenticated securely via Bearer JWT from 127.0.0.1',
          status: 'SUCCESS',
        },
        {
          adminEmail: 'admin@appsica.com',
          adminName: 'Appsica Admin',
          category: 'VENDORS',
          action: 'APPROVE_VENDOR_APPLICATION',
          target: 'Aura Sound & Tech',
          details: 'Verified GSTIN 29ABCDE1234F1Z5 and bank account details. Store approved.',
          status: 'SUCCESS',
        },
        {
          adminEmail: 'admin@appsica.com',
          adminName: 'Appsica Admin',
          category: 'ORDERS',
          action: 'UPDATE_ORDER_SHIPPING',
          target: 'Order #ORD-20261025-V101',
          details: 'Assigned courier BlueDart Express with AWB TRK-BD-890214',
          status: 'SUCCESS',
        },
        {
          adminEmail: 'admin@appsica.com',
          adminName: 'Appsica Admin',
          category: 'PAYOUTS',
          action: 'SETTLE_VENDOR_PAYOUT',
          target: 'PAY-20261025-01',
          details: 'Transferred ₹25,499 to HDFC Bank A/C ...9876 via NEFT-HDFC-991823719',
          status: 'SUCCESS',
        },
      ]);
      console.log('✓ Seeded initial audit logs');
    }

    console.log('✓ Database seeding complete and ready!');
  } catch (error) {
    console.error('Error in seedData:', error);
  }
};

module.exports = seedData;

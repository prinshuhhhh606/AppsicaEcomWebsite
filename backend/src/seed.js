const mongoose = require('mongoose');
const User = require('./models/user');
const Category = require('./models/category');
const Product = require('./models/product');
const Coupon = require('./models/coupon');
const Banner = require('./models/banner');
const ShippingZone = require('./models/shippingZone');

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
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        },
        {
          name: 'Fashion',
          slug: 'fashion',
          mark: '02',
          tone: 'peach',
          description: 'Timeless apparel, premium fabrics, footwear, and curated wardrobe staples.',
          image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
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

    console.log('✓ Database seeding complete and ready!');
  } catch (error) {
    console.error('Error in seedData:', error);
  }
};

module.exports = seedData;

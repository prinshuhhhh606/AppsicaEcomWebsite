const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('./models/category');
const Product = require('./models/product');
const User = require('./models/user');

const LUXURY_PRODUCTS = [
  // ==================== ELECTRONICS ====================
  {
    name: 'Noise Cancelling Wireless Headphones',
    slug: 'noise-cancelling-wireless-headphones',
    description: 'Custom 40mm drivers, active noise cancellation, premium memory foam ear cushions, and 30-hour battery life.',
    price: 3499,
    originalPrice: 4999,
    categorySlug: 'electronics',
    stock: 45,
    rating: 4.9,
    reviewCount: 128,
    isFeatured: true,
    brand: 'Aura Sound',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Minimalist Smart Watch Series 5',
    slug: 'minimalist-smart-watch-series-5',
    description: 'AMOLED curved display, aerospace aluminum frame, 24/7 heart rate and SpO2 tracking with 10-day battery life.',
    price: 4999,
    originalPrice: 6999,
    categorySlug: 'electronics',
    stock: 30,
    rating: 4.8,
    reviewCount: 94,
    isFeatured: true,
    brand: 'Lunar Tech',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Nordic Mechanical Wireless Keyboard',
    slug: 'nordic-mechanical-wireless-keyboard',
    description: 'Compact 75% tactile hot-swappable keyboard with double-shot PBT keycaps and sound-dampening silicone pad.',
    price: 2899,
    originalPrice: 3999,
    categorySlug: 'electronics',
    stock: 22,
    rating: 4.7,
    reviewCount: 63,
    isFeatured: false,
    brand: 'NordicType',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Compact Portable Bluetooth Speaker',
    slug: 'compact-portable-bluetooth-speaker',
    description: 'Deep 360-degree sound with rich bass radiator, IP67 waterproof design, and 16 hours of wireless playback.',
    price: 1499,
    originalPrice: 2299,
    categorySlug: 'electronics',
    stock: 50,
    rating: 4.6,
    reviewCount: 47,
    isFeatured: false,
    brand: 'SoundCraft',
    images: [
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Ultra-Thin Fast Wireless Charging Pad',
    slug: 'ultra-thin-fast-wireless-charging-pad',
    description: '15W Qi-certified high speed wireless charger with brushed aluminum casing and braided nylon cable.',
    price: 999,
    originalPrice: 1499,
    categorySlug: 'electronics',
    stock: 60,
    rating: 4.5,
    reviewCount: 38,
    isFeatured: false,
    brand: 'Aura Sound',
    images: [
      'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Pro Studio Desktop Microphone',
    slug: 'pro-studio-desktop-microphone',
    description: 'Broadcast-quality condenser microphone with cardioid pickup pattern, zero-latency monitoring, and tap-to-mute.',
    price: 5499,
    originalPrice: 7499,
    categorySlug: 'electronics',
    stock: 18,
    rating: 4.9,
    reviewCount: 52,
    isFeatured: true,
    brand: 'SoundCraft',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    ],
  },

  // ==================== FASHION ====================
  {
    name: 'Linen Casual Long-Sleeve Shirt',
    slug: 'linen-casual-long-sleeve-shirt',
    description: 'Breathable 100% pure European washed linen shirt with mother-of-pearl buttons and relaxed tailored cut.',
    price: 1899,
    originalPrice: 2499,
    categorySlug: 'fashion',
    stock: 35,
    rating: 4.8,
    reviewCount: 86,
    isFeatured: true,
    brand: 'StunnerYsl Studio',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Urban Travel Water-Resistant Backpack',
    slug: 'urban-travel-water-resistant-backpack',
    description: 'Minimalist weather-resistant everyday commute backpack with padded 16-inch laptop compartment and hidden passport pocket.',
    price: 2499,
    originalPrice: 3499,
    categorySlug: 'fashion',
    stock: 40,
    rating: 4.9,
    reviewCount: 114,
    isFeatured: true,
    brand: 'Urban Threads',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Classic White Leather Sneakers',
    slug: 'classic-white-leather-sneakers',
    description: 'Handcrafted full-grain Italian leather sneakers with natural rubber cupsole and cushioned memory insole.',
    price: 3299,
    originalPrice: 4599,
    categorySlug: 'fashion',
    stock: 25,
    rating: 4.7,
    reviewCount: 72,
    isFeatured: false,
    brand: 'Stride & Co',
    images: [
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Tailored Merino Wool Overcoat',
    slug: 'tailored-merino-wool-overcoat',
    description: 'Architectural single-breasted overcoat woven from 100% fine Merino wool with horn buttons and satin lining.',
    price: 6999,
    originalPrice: 9499,
    categorySlug: 'fashion',
    stock: 15,
    rating: 5.0,
    reviewCount: 39,
    isFeatured: true,
    brand: 'StunnerYsl Studio',
    images: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Heavyweight Organic French Terry Hoodie',
    slug: 'heavyweight-organic-french-terry-hoodie',
    description: '450 GSM combed organic cotton hoodie with kangaroo pocket, double-lined hood, and seamless rib cuffs.',
    price: 1999,
    originalPrice: 2799,
    categorySlug: 'fashion',
    stock: 40,
    rating: 4.7,
    reviewCount: 91,
    isFeatured: false,
    brand: 'Urban Threads',
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    ],
  },

  // ==================== HOME & LIVING ====================
  {
    name: 'Compact Artisan Drip Coffee Maker',
    slug: 'compact-artisan-drip-coffee-maker',
    description: 'Precision temperature brew system with reusable stainless steel filter, borosilicate glass carafe, and keep-warm plate.',
    price: 3899,
    originalPrice: 5299,
    categorySlug: 'home',
    stock: 28,
    rating: 4.8,
    reviewCount: 64,
    isFeatured: true,
    brand: 'Kanso Living',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Handcrafted Matte Ceramic Vase',
    slug: 'handcrafted-matte-ceramic-vase',
    description: 'Hand-thrown textured stoneware vase with organic sculptural curves and warm bone-white matte glaze.',
    price: 1299,
    originalPrice: 1799,
    categorySlug: 'home',
    stock: 35,
    rating: 4.9,
    reviewCount: 42,
    isFeatured: false,
    brand: 'Kanso Living',
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Ultrasonic Ceramic Aroma Diffuser',
    slug: 'ultrasonic-ceramic-aroma-diffuser',
    description: 'Whisper-quiet ambient aromatherapy diffuser with 7 soft LED illumination tones and auto shut-off safety.',
    price: 1699,
    originalPrice: 2399,
    categorySlug: 'home',
    stock: 32,
    rating: 4.7,
    reviewCount: 58,
    isFeatured: true,
    brand: 'Kanso Living',
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Hand-Woven Merino Wool Throw Blanket',
    slug: 'hand-woven-merino-wool-throw-blanket',
    description: 'Plush New Zealand virgin wool throw with fringed edges, naturally hypoallergenic and exceptionally warm.',
    price: 2799,
    originalPrice: 3899,
    categorySlug: 'home',
    stock: 20,
    rating: 4.9,
    reviewCount: 37,
    isFeatured: false,
    brand: 'Kanso Living',
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
    ],
  },

  // ==================== BEAUTY ====================
  {
    name: 'Minimalist Niacinamide Clarifying Serum',
    slug: 'minimalist-niacinamide-clarifying-serum',
    description: '10% Niacinamide + 1% Zinc PCA formulation that refines pores, balances sebum, and restores radiant skin barrier.',
    price: 899,
    originalPrice: 1299,
    categorySlug: 'beauty',
    stock: 65,
    rating: 4.9,
    reviewCount: 142,
    isFeatured: true,
    brand: 'Flora & Earth',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Botanical Hydrating Rosewater Mist',
    slug: 'botanical-hydrating-rosewater-mist',
    description: 'Steam-distilled organic Damask rose floral water infused with aloe vera and cucumber extract for instant hydration.',
    price: 649,
    originalPrice: 899,
    categorySlug: 'beauty',
    stock: 50,
    rating: 4.8,
    reviewCount: 78,
    isFeatured: false,
    brand: 'Flora & Earth',
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Organic Cold-Pressed Argan Hair Oil',
    slug: 'organic-cold-pressed-argan-hair-oil',
    description: 'Pure Moroccan golden argan oil enriched with natural vitamin E and fatty acids to tame frizz and add luminous shine.',
    price: 1199,
    originalPrice: 1599,
    categorySlug: 'beauty',
    stock: 40,
    rating: 4.7,
    reviewCount: 53,
    isFeatured: false,
    brand: 'Flora & Earth',
    images: [
      'https://images.unsplash.com/photo-1608248597359-00974b6f7556?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    name: 'Sandalwood & Bergamot Eau de Parfum',
    slug: 'sandalwood-bergamot-eau-de-parfum',
    description: 'Warm Mysore sandalwood, crisp Italian bergamot, smoky amber, and cedarwood notes in a luxury 50ml glass spray.',
    price: 2999,
    originalPrice: 3999,
    categorySlug: 'beauty',
    stock: 22,
    rating: 4.9,
    reviewCount: 67,
    isFeatured: true,
    brand: 'StunnerYsl Parfums',
    images: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
    ],
  },
];

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/appsica';
  console.log('Connecting to database...');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  // Find vendor
  const vendor = await User.findOne({ role: 'vendor', vendorStatus: 'approved' });
  const vendorId = vendor ? vendor._id : null;

  // Categories map
  const categories = await Category.find();
  const catMap = {};
  for (const c of categories) {
    catMap[c.slug] = c._id;
  }

  // Remove fake repetitive dummy test products like "Wireless Smart Hub %"
  const deleted = await Product.deleteMany({ name: { $regex: /Wireless Smart Hub/i } });
  console.log(`Removed ${deleted.deletedCount} dummy test products.`);

  // Insert or update each luxury product
  let addedCount = 0;
  for (const p of LUXURY_PRODUCTS) {
    const catId = catMap[p.categorySlug] || catMap['electronics'] || categories[0]?._id;
    const existing = await Product.findOne({ slug: p.slug });

    if (existing) {
      existing.name = p.name;
      existing.description = p.description;
      existing.price = p.price;
      existing.originalPrice = p.originalPrice;
      existing.stock = p.stock;
      existing.rating = p.rating;
      existing.reviewCount = p.reviewCount;
      existing.isFeatured = p.isFeatured;
      existing.brand = p.brand;
      existing.images = p.images;
      existing.category = catId;
      if (vendorId) existing.vendor = vendorId;
      await existing.save();
      console.log(`Updated product: ${p.name} - ₹${p.price}`);
    } else {
      await Product.create({
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.reviewCount,
        isFeatured: p.isFeatured,
        brand: p.brand,
        images: p.images,
        category: catId,
        vendor: vendorId,
        vendorStatus: 'approved',
        isActive: true,
      });
      console.log(`Created luxury product: ${p.name} - ₹${p.price}`);
      addedCount++;
    }
  }

  console.log(`\nAll done! Seeded/Updated ${LUXURY_PRODUCTS.length} diverse luxury products.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Error running script:', err);
  process.exit(1);
});

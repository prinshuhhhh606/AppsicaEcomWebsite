const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
require('./models/category');
const Product = require('./models/product');

async function clean() {
  await mongoose.connect(process.env.MONGO_URI);

  const res = await Product.deleteMany({
    $or: [
      { name: { $regex: /Organic Fresh Apples|Fragile Glass Vase|Ultra Bass Headphones \d+|Acoustic Beryllium Pro Earbuds \d+|Zenith Smart ANC Headphones \d+|Alpha Bluetooth Speaker|Beta Leather Jacket/i } },
      { images: { $size: 0 } },
      { images: null },
      { 'images.0': { $exists: false } },
      { 'images.0': '' },
    ],
  });
  console.log('Cleaned dummy test products:', res.deletedCount);

  const remaining = await Product.find().populate('category');
  console.log(`\nRemaining curated products (${remaining.length}):`);
  remaining.forEach((p) => {
    console.log(`- [${p.category?.name || 'Uncategorized'}] ${p.name} — ₹${p.price}`);
  });

  process.exit(0);
}

clean().catch((err) => {
  console.error(err);
  process.exit(1);
});

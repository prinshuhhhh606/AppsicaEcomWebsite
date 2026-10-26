const PRODUCTS_URL = 'https://dummyjson.com/products';
const ORDERS_KEY = 'appsica_demo_orders';
const USD_TO_INR_DEMO_RATE = 83;

const categoryGroups = {
  electronics: ['smartphones', 'laptops', 'tablets', 'mobile-accessories'],
  fashion: ['tops', 'mens-shirts', 'mens-shoes', 'womens-dresses', 'womens-shoes', 'womens-bags'],
  home: ['furniture', 'home-decoration', 'kitchen-accessories'],
  beauty: ['beauty', 'fragrances', 'skin-care'],
};

let productsRequest;

function mapProduct(product) {
  const price = Math.round(product.price * USD_TO_INR_DEMO_RATE);
  const originalPrice = Math.round(price / (1 - (product.discountPercentage || 0) / 100));
  const categoryName = product.category
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    _id: String(product.id),
    name: product.title,
    description: product.description,
    price,
    originalPrice: Number.isFinite(originalPrice) ? originalPrice : price,
    images: product.images?.length ? product.images : [product.thumbnail],
    category: { name: categoryName, slug: product.category },
    rating: product.rating || 0,
    reviewCount: product.reviews?.length || 0,
    stock: product.stock || 0,
  };
}

async function getProducts() {
  if (!productsRequest) {
    productsRequest = fetch(`${PRODUCTS_URL}?limit=194`)
      .then((response) => {
        if (!response.ok) throw new Error('The demo product API is unavailable. Please try again shortly.');
        return response.json();
      })
      .then((payload) => {
        if (!Array.isArray(payload.products)) throw new Error('The demo product API returned an unexpected response.');
        return payload.products.map(mapProduct);
      })
      .catch((error) => {
        productsRequest = null;
        throw error;
      });
  }
  return productsRequest;
}

function sortProducts(products, sort = 'newest') {
  const sorted = [...products];
  if (sort === 'price_low') return sorted.sort((a, b) => a.price - b.price);
  if (sort === 'price_high') return sorted.sort((a, b) => b.price - a.price);
  if (sort === 'rating' || sort === 'popular') return sorted.sort((a, b) => b.rating - a.rating);
  return sorted.sort((a, b) => Number(b._id) - Number(a._id));
}

function readOrders() {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    return Array.isArray(orders) ? orders : [];
  } catch {
    return [];
  }
}

export const demoStoreService = {
  async getAll({ sort = 'newest', category } = {}) {
    let products = await getProducts();
    if (category && categoryGroups[category]) {
      products = products.filter((product) => categoryGroups[category].includes(product.category.slug));
    }
    return sortProducts(products, sort);
  },

  async getFeatured() {
    return sortProducts(await getProducts(), 'popular').slice(0, 8);
  },

  async getByCategory(category, { sort = 'newest' } = {}) {
    const products = await this.getAll({ category, sort });
    return products;
  },

  async search(query, { sort = 'newest' } = {}) {
    const term = query.trim().toLowerCase();
    const products = await getProducts();
    return sortProducts(
      products.filter((product) =>
        `${product.name} ${product.description} ${product.category.name}`.toLowerCase().includes(term)
      ),
      sort
    );
  },

  async getById(id) {
    const response = await fetch(`${PRODUCTS_URL}/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error('This product could not be found.');
    return mapProduct(await response.json());
  },

  getOrders() {
    return readOrders();
  },

  getOrderById(id) {
    return readOrders().find((order) => order.id === id || order.orderId === id) || null;
  },

  async checkout({ cartItems, shippingAddress, paymentMethod }) {
    await new Promise((resolve) => window.setTimeout(resolve, 1100));
    const amount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const delivery = amount >= 999 ? 0 : 79;
    const reference = `DEMO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const order = {
      id: reference,
      orderId: reference,
      transactionId: `TXN-${reference}`,
      paymentStatus: 'SUCCESS',
      paymentMethod,
      status: 'confirmed',
      items: cartItems,
      shippingAddress,
      subtotal: amount,
      delivery,
      total: amount + delivery,
      createdAt: new Date().toISOString(),
      isDemo: true,
    };
    localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...readOrders()]));
    return order;
  },
};

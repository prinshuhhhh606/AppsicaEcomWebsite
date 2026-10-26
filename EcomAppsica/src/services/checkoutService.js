import api from './api';

export const checkoutService = {
  getCheckoutSummary: async (data) => { const res = await api.post('/checkout/summary', data); return res.data; },
  applyCoupon: async (code, cartId) => { const res = await api.post('/checkout/coupon', { code, cartId }); return res.data; },
  removeCoupon: async () => { const res = await api.delete('/checkout/coupon'); return res.data; },
  placeOrder: async (data) => { const res = await api.post('/checkout/place-order', data); return res.data; },
  getDeliveryOptions: async (pincode) => { const res = await api.get(`/checkout/delivery?pincode=${pincode}`); return res.data; },
};

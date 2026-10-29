import api from './api';

export const deliveryZoneService = {
  // Get seller's saved zones
  getMyZones: async () => {
    const res = await api.get('/delivery-zones/my-zones');
    return res.data;
  },

  // Create a new delivery zone
  createZone: async (zoneData) => {
    const res = await api.post('/delivery-zones', zoneData);
    return res.data;
  },

  // Update zone
  updateZone: async (id, zoneData) => {
    const res = await api.put(`/delivery-zones/${id}`, zoneData);
    return res.data;
  },

  // Delete zone
  deleteZone: async (id) => {
    const res = await api.delete(`/delivery-zones/${id}`);
    return res.data;
  },

  // Get seller store coordinates & radius settings
  getStoreLocation: async () => {
    const res = await api.get('/delivery-zones/store-location');
    return res.data;
  },

  // Update seller store location & radius
  updateStoreLocation: async (locationData) => {
    const res = await api.put('/delivery-zones/store-location', locationData);
    return res.data;
  },

  // Public/Customer delivery eligibility check
  checkEligibility: async ({ productId, items, destination }) => {
    const res = await api.post('/delivery-zones/check-eligibility', {
      productId,
      items,
      destination,
    });
    return res.data;
  },
};


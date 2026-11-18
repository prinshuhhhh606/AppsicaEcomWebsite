import api from './api';

export const bannerService = {
  // Public - fetch active banners for storefront
  getActiveBanners: async () => {
    try {
      const res = await api.get('/banners');
      return res.data?.banners || (Array.isArray(res.data) ? res.data : []);
    } catch {
      return [];
    }
  },
};

export default bannerService;

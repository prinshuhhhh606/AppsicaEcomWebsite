const CourierProviderInterface = require('./CourierProviderInterface');

class ShiprocketProvider extends CourierProviderInterface {
  constructor(config = {}) {
    super('shiprocket', config);
    this.baseUrl = (config.baseUrl || 'https://apiv2.shiprocket.in/v1/external').replace(/\/+$/, '');
    this.email = config.email || process.env.SHIPROCKET_EMAIL || '';
    this.password = config.password || process.env.SHIPROCKET_PASSWORD || '';
    this.token = config.token || '';
    this.tokenExpiresAt = config.tokenExpiresAt ? new Date(config.tokenExpiresAt) : null;
    this.environment = config.environment || 'sandbox';
  }

  /**
   * Validates if credentials are present
   */
  hasCredentials() {
    return Boolean(this.email && this.password);
  }

  /**
   * Authenticate with Shiprocket API
   */
  async authenticate() {
    if (!this.hasCredentials()) {
      return {
        success: false,
        error: 'Shiprocket credentials not configured. Please enter API email and password in Admin Settings.',
      };
    }

    // Check if current cached token is still valid (give 1 hour buffer)
    if (this.token && this.tokenExpiresAt && new Date() < new Date(this.tokenExpiresAt.getTime() - 60 * 60 * 1000)) {
      return { success: true, token: this.token };
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email.trim(),
          password: this.password.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.token) {
        return {
          success: false,
          error: data.message || `Shiprocket authentication failed with HTTP ${response.status}`,
          details: data,
        };
      }

      this.token = data.token;
      // Shiprocket tokens typically last 10 days
      this.tokenExpiresAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

      return {
        success: true,
        token: this.token,
        tokenExpiresAt: this.tokenExpiresAt,
      };
    } catch (err) {
      return {
        success: false,
        error: `Shiprocket connection error: ${err.message}`,
      };
    }
  }

  /**
   * Test API connectivity and credentials
   */
  async testConnection() {
    const auth = await this.authenticate();
    if (!auth.success) {
      return {
        success: false,
        message: auth.error || 'Authentication with Shiprocket failed',
      };
    }

    return {
      success: true,
      message: `Successfully connected to Shiprocket (${this.environment.toUpperCase()} mode). Auth token active.`,
    };
  }

  /**
   * Check PIN code serviceability between pickup and delivery PIN codes
   */
  async checkServiceability({ pickupPincode, deliveryPincode, weightKg = 0.5, cod = false, orderValue = 500 }) {
    if (!pickupPincode || !deliveryPincode) {
      return {
        serviceable: false,
        availableCouriers: [],
        reason: 'Both pickup and delivery 6-digit Indian PIN codes are required',
      };
    }

    const auth = await this.authenticate();
    if (!auth.success) {
      return {
        serviceable: false,
        availableCouriers: [],
        reason: auth.error,
        requiresConfiguration: true,
      };
    }

    try {
      const queryParams = new URLSearchParams({
        pickup_postcode: String(pickupPincode).trim(),
        delivery_postcode: String(deliveryPincode).trim(),
        weight: String(weightKg),
        cod: cod ? '1' : '0',
        declared_value: String(orderValue),
      });

      const response = await fetch(`${this.baseUrl}/courier/serviceability/?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.status !== 200) {
        return {
          serviceable: false,
          availableCouriers: [],
          reason: data.message || `Serviceability check failed (HTTP ${response.status})`,
        };
      }

      const rawCouriers = data.data?.available_courier_companies || [];
      const availableCouriers = rawCouriers.map((c) => ({
        id: c.courier_company_id,
        name: c.courier_name,
        rate: Number(c.rate) || 79,
        etd: c.etd,
        estimatedDays: parseInt(c.estimated_delivery_days, 10) || 3,
        codAvailable: Boolean(c.cod === 1),
        minWeightKg: c.min_weight,
        rating: c.rating,
      }));

      // Sort by fastest ETA and cheapest rate
      availableCouriers.sort((a, b) => a.rate - b.rate);

      return {
        serviceable: availableCouriers.length > 0,
        availableCouriers,
        recommendedCourier: availableCouriers[0] || null,
        reason: availableCouriers.length === 0 ? 'Destination PIN code is not serviceable by Shiprocket partners' : undefined,
      };
    } catch (err) {
      return {
        serviceable: false,
        availableCouriers: [],
        reason: `Network error during Shiprocket serviceability query: ${err.message}`,
      };
    }
  }

  /**
   * Calculate shipping rate and delivery ETA
   */
  async calculateShippingRate(params) {
    const serv = await this.checkServiceability(params);
    if (!serv.serviceable || !serv.recommendedCourier) {
      return {
        success: false,
        rate: null,
        estimatedDays: null,
        reason: serv.reason || 'Route not serviceable for courier shipping',
      };
    }

    return {
      success: true,
      rate: serv.recommendedCourier.rate,
      estimatedDays: `${serv.recommendedCourier.estimatedDays} business days`,
      courierName: serv.recommendedCourier.name,
      couriers: serv.availableCouriers,
    };
  }

  /**
   * Create an adhoc shipment on Shiprocket
   */
  async createShipment(orderData) {
    const auth = await this.authenticate();
    if (!auth.success) {
      return {
        success: false,
        error: auth.error,
        requiresConfiguration: true,
      };
    }

    try {
      const orderDate = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const shippingAddress = orderData.shippingAddress || {};
      const pickupLocationName = orderData.pickupLocation?.storeName || 'Primary';

      const items = (orderData.items || []).map((it, idx) => ({
        name: it.name || `Item ${idx + 1}`,
        sku: String(it.product || it._id || `SKU-${idx + 1}`).slice(-8),
        units: Number(it.quantity) || 1,
        selling_price: Number(it.price) || 0,
        discount: 0,
        tax: 0,
      }));

      const payload = {
        order_id: String(orderData.orderId || `ORD-${Date.now()}`),
        order_date: orderDate,
        pickup_location: pickupLocationName,
        billing_customer_name: (shippingAddress.fullName || 'Customer').slice(0, 50),
        billing_last_name: '',
        billing_address: (shippingAddress.addressLine || 'Address').slice(0, 100),
        billing_city: shippingAddress.city || 'City',
        billing_pincode: String(shippingAddress.pincode || ''),
        billing_state: shippingAddress.state || 'State',
        billing_country: 'India',
        billing_email: orderData.user?.email || 'customer@appsica.com',
        billing_phone: String(shippingAddress.phone || '9876543210').slice(0, 15),
        shipping_is_billing: true,
        order_items: items,
        payment_method: String(orderData.paymentMethod).toLowerCase() === 'cod' ? 'COD' : 'Prepaid',
        sub_total: Number(orderData.total || orderData.subtotal || 0),
        length: Number(orderData.packageDimensions?.length) || 10,
        breadth: Number(orderData.packageDimensions?.width) || 10,
        height: Number(orderData.packageDimensions?.height) || 10,
        weight: Number(orderData.packageWeightKg) || 0.5,
      };

      const response = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.order_id) {
        return {
          success: false,
          error: data.message || `Shiprocket shipment creation failed (HTTP ${response.status})`,
          rawResponse: data,
        };
      }

      return {
        success: true,
        orderId: String(data.order_id),
        shipmentId: String(data.shipment_id || data.order_id),
        status: data.status || 'NEW',
        rawResponse: data,
      };
    } catch (err) {
      return {
        success: false,
        error: `Shiprocket createShipment error: ${err.message}`,
      };
    }
  }

  /**
   * Assign / generate AWB number for a booked shipment
   */
  async generateAWB({ shipmentId, courierId = null }) {
    const auth = await this.authenticate();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    try {
      const payload = { shipment_id: Number(shipmentId) || shipmentId };
      if (courierId) payload.courier_id = courierId;

      const response = await fetch(`${this.baseUrl}/courier/assign/awb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      const awbData = data.response?.data;
      if (!response.ok || !awbData || !awbData.awb_code) {
        return {
          success: false,
          error: data.message || data.response?.message || 'Failed to generate AWB from Shiprocket',
          rawResponse: data,
        };
      }

      return {
        success: true,
        awbCode: String(awbData.awb_code),
        courierName: awbData.courier_name || 'Shiprocket Express',
        courierCompanyId: awbData.courier_company_id,
        rawResponse: data,
      };
    } catch (err) {
      return {
        success: false,
        error: `Shiprocket generateAWB error: ${err.message}`,
      };
    }
  }

  /**
   * Request courier pickup from seller store
   */
  async requestPickup({ shipmentIds }) {
    const auth = await this.authenticate();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    try {
      const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
      const payload = { shipment_id: ids.map((id) => Number(id) || id) };

      const response = await fetch(`${this.baseUrl}/courier/generate/pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || (data.pickup_status !== 1 && data.response?.pickup_status !== 1)) {
        return {
          success: false,
          error: data.message || data.response?.message || 'Pickup scheduling failed',
          rawResponse: data,
        };
      }

      const pData = data.response || {};
      return {
        success: true,
        pickupToken: pData.pickup_token_number || `PKP-${Date.now().toString().slice(-6)}`,
        scheduledDate: pData.pickup_scheduled_date || new Date().toISOString().slice(0, 10),
        rawResponse: data,
      };
    } catch (err) {
      return {
        success: false,
        error: `Shiprocket requestPickup error: ${err.message}`,
      };
    }
  }

  /**
   * Generate downloadable PDF shipping label
   */
  async generateShippingLabel({ shipmentIds }) {
    const auth = await this.authenticate();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    try {
      const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
      const payload = { shipment_id: ids.map((id) => Number(id) || id) };

      const response = await fetch(`${this.baseUrl}/courier/generate/label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || (!data.label_url && !data.response?.label_url)) {
        return {
          success: false,
          error: data.message || 'Failed to generate shipping label',
          rawResponse: data,
        };
      }

      return {
        success: true,
        labelUrl: data.label_url || data.response?.label_url,
      };
    } catch (err) {
      return {
        success: false,
        error: `Shiprocket generateShippingLabel error: ${err.message}`,
      };
    }
  }

  /**
   * Track shipment by AWB code
   */
  async trackShipment({ awbCode }) {
    if (!awbCode) {
      return { success: false, error: 'AWB code is required for tracking' };
    }

    const auth = await this.authenticate();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    try {
      const response = await fetch(`${this.baseUrl}/courier/track/awb/${encodeURIComponent(awbCode)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      const trackData = data.tracking_data || {};

      if (!response.ok || trackData.track_status === 0) {
        return {
          success: false,
          error: data.message || trackData.error || 'No tracking information available for this AWB',
        };
      }

      const trackInfo = (trackData.shipment_track && trackData.shipment_track[0]) || {};
      const activities = trackData.shipment_track_activities || [];

      const normalizedEvents = activities.map((act) => ({
        status: act.status || act.activity || 'IN_TRANSIT',
        activity: act.activity || 'In Transit',
        location: act.location || '',
        timestamp: act.date ? new Date(act.date) : new Date(),
      }));

      return {
        success: true,
        awbCode,
        currentStatus: trackInfo.current_status || 'In Transit',
        statusCode: trackData.shipment_status,
        courierName: trackInfo.courier_name || 'Shiprocket',
        trackingEvents: normalizedEvents,
        deliveredDate: trackInfo.delivered_date ? new Date(trackInfo.delivered_date) : null,
      };
    } catch (err) {
      return {
        success: false,
        error: `Shiprocket tracking error: ${err.message}`,
      };
    }
  }

  /**
   * Cancel order on Shiprocket
   */
  async cancelShipment({ orderId }) {
    const auth = await this.authenticate();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    try {
      const response = await fetch(`${this.baseUrl}/orders/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ ids: [orderId] }),
      });

      const data = await response.json().catch(() => ({}));
      return {
        success: response.ok,
        message: data.message || 'Shipment cancelled',
      };
    } catch (err) {
      return {
        success: false,
        error: `Shiprocket cancellation error: ${err.message}`,
      };
    }
  }

  /**
   * Parse Shiprocket Webhook
   */
  handleWebhook(payload = {}, headers = {}) {
    const awbCode = payload.awb || payload.awb_code || payload.shipment_track?.[0]?.awb_code || '';
    const shipmentId = String(payload.shipment_id || payload.order_id || '');
    const currentStatus = payload.current_status || payload.status || 'IN_TRANSIT';
    const activity = payload.activity || payload.scans?.[0]?.activity || currentStatus;
    const location = payload.location || payload.scans?.[0]?.location || '';

    return {
      isValid: Boolean(awbCode || shipmentId),
      provider: 'shiprocket',
      awbCode,
      shipmentId,
      currentStatus,
      activity,
      location,
      timestamp: payload.date ? new Date(payload.date) : new Date(),
      raw: payload,
    };
  }
}

module.exports = ShiprocketProvider;

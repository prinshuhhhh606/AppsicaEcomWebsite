/**
 * Courier Provider Base Interface
 * Common abstraction contract for all courier partners (Shiprocket, Delhivery, BlueDart, etc.)
 */
class CourierProviderInterface {
  constructor(name, config = {}) {
    if (new.target === CourierProviderInterface) {
      throw new TypeError('Cannot construct CourierProviderInterface instances directly.');
    }
    this.name = name;
    this.config = config;
  }

  /**
   * Authenticate with the courier API and acquire/refresh access token
   * @returns {Promise<{ success: boolean, token?: string, error?: string }>}
   */
  async authenticate() {
    throw new Error('authenticate() must be implemented by courier provider subclass');
  }

  /**
   * Test API connectivity and credentials
   * @returns {Promise<{ success: boolean, message: string, details?: any }>}
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by courier provider subclass');
  }

  /**
   * Check PIN code serviceability between pickup and delivery PIN codes
   * @param {Object} params - { pickupPincode, deliveryPincode, weightKg, cod, orderValue }
   * @returns {Promise<{
   *   serviceable: boolean,
   *   availableCouriers: Array<{ id: string|number, name: string, rate: number, etd: string, estimatedDays: number, codAvailable: boolean }>,
   *   recommendedCourier?: Object,
   *   reason?: string
   * }>}
   */
  async checkServiceability(params) {
    throw new Error('checkServiceability() must be implemented by courier provider subclass');
  }

  /**
   * Calculate shipping rate and ETA for given package and route
   * @param {Object} params - { pickupPincode, deliveryPincode, weightKg, cod, length, breadth, height }
   * @returns {Promise<{ success: boolean, rate: number, estimatedDays: string, couriers: Array }>}
   */
  async calculateShippingRate(params) {
    throw new Error('calculateShippingRate() must be implemented by courier provider subclass');
  }

  /**
   * Create an adhoc / real shipment with the provider API
   * @param {Object} orderData - Standardized order and address payload
   * @returns {Promise<{
   *   success: boolean,
   *   shipmentId: string,
   *   orderId: string,
   *   status: string,
   *   rawResponse?: any,
   *   error?: string
   * }>}
   */
  async createShipment(orderData) {
    throw new Error('createShipment() must be implemented by courier provider subclass');
  }

  /**
   * Assign or generate real AWB code for a booked shipment
   * @param {Object} params - { shipmentId, courierId }
   * @returns {Promise<{
   *   success: boolean,
   *   awbCode: string,
   *   courierName: string,
   *   courierCompanyId?: number|string,
   *   rawResponse?: any,
   *   error?: string
   * }>}
   */
  async generateAWB(params) {
    throw new Error('generateAWB() must be implemented by courier provider subclass');
  }

  /**
   * Request pickup from seller pickup warehouse
   * @param {Object} params - { shipmentIds, pickupDate }
   * @returns {Promise<{
   *   success: boolean,
   *   pickupToken: string,
   *   scheduledDate: string,
   *   message?: string,
   *   error?: string
   * }>}
   */
  async requestPickup(params) {
    throw new Error('requestPickup() must be implemented by courier provider subclass');
  }

  /**
   * Generate and fetch download URL for shipping label PDF
   * @param {Object} params - { shipmentIds }
   * @returns {Promise<{ success: boolean, labelUrl: string, error?: string }>}
   */
  async generateShippingLabel(params) {
    throw new Error('generateShippingLabel() must be implemented by courier provider subclass');
  }

  /**
   * Query live tracking events using AWB code or shipment ID
   * @param {Object} params - { awbCode, shipmentId }
   * @returns {Promise<{
   *   success: boolean,
   *   currentStatus: string,
   *   statusCode?: string|number,
   *   trackingEvents: Array<{ status: string, activity: string, location: string, timestamp: Date }>,
   *   deliveredDate?: Date,
   *   error?: string
   * }>}
   */
  async trackShipment(params) {
    throw new Error('trackShipment() must be implemented by courier provider subclass');
  }

  /**
   * Cancel an existing shipment
   * @param {Object} params - { orderId, awbCode, shipmentId }
   * @returns {Promise<{ success: boolean, message: string, error?: string }>}
   */
  async cancelShipment(params) {
    throw new Error('cancelShipment() must be implemented by courier provider subclass');
  }

  /**
   * Validate, parse, and normalize incoming provider webhook
   * @param {Object} payload - Webhook JSON body
   * @param {Object} headers - Request headers
   * @returns {{
   *   isValid: boolean,
   *   awbCode: string,
   *   shipmentId?: string,
   *   currentStatus: string,
   *   location?: string,
   *   activity?: string,
   *   timestamp: Date,
   *   raw: any
   * }}
   */
  handleWebhook(payload, headers) {
    throw new Error('handleWebhook() must be implemented by courier provider subclass');
  }
}

module.exports = CourierProviderInterface;

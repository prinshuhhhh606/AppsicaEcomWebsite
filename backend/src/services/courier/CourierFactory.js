const ShiprocketProvider = require('./ShiprocketProvider');
const DelhiveryProvider = require('./DelhiveryProvider');
const BlueDartProvider = require('./BlueDartProvider');

class CourierFactory {
  /**
   * Instantiates the requested courier provider
   * @param {string} providerName - 'shiprocket' | 'delhivery' | 'bluedart'
   * @param {Object} config - Provider-specific configuration
   * @returns {CourierProviderInterface}
   */
  static getProvider(providerName = 'shiprocket', config = {}) {
    const normalized = String(providerName).toLowerCase().trim();

    switch (normalized) {
      case 'delhivery':
        return new DelhiveryProvider(config.delhivery || config);
      case 'bluedart':
        return new BlueDartProvider(config.bluedart || config);
      case 'shiprocket':
      default:
        return new ShiprocketProvider(config.shiprocket || config);
    }
  }
}

module.exports = CourierFactory;

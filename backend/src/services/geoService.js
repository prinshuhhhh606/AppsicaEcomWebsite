/**
 * Smart Delivery Geo & Spatial Calculation Service
 * Appsica E-Commerce Multi-Vendor Logistics Engine
 * Supports both Local Hyperlocal Delivery and Pan-India Standard Courier Delivery
 */

const DeliveryZone = require('../models/deliveryZone');

// Standard geocode reference for Indian cities and key commercial hubs
const CITY_COORDINATES = {
  // Western Zone
  mumbai: { lat: 19.0760, lng: 72.8777, name: 'Mumbai, Maharashtra' },
  pune: { lat: 18.5204, lng: 73.8567, name: 'Pune, Maharashtra' },
  nagpur: { lat: 21.1458, lng: 79.0882, name: 'Nagpur, Maharashtra' },
  nashik: { lat: 19.9975, lng: 73.7898, name: 'Nashik, Maharashtra' },
  navi_mumbai: { lat: 19.0330, lng: 73.0297, name: 'Navi Mumbai, Maharashtra' },
  thane: { lat: 19.2183, lng: 72.9781, name: 'Thane, Maharashtra' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad, Gujarat' },
  vadodara: { lat: 22.3072, lng: 73.1812, name: 'Vadodara, Gujarat' },
  surat: { lat: 21.1702, lng: 72.8311, name: 'Surat, Gujarat' },
  rajkot: { lat: 22.3039, lng: 70.8022, name: 'Rajkot, Gujarat' },
  gandhinagar: { lat: 23.2156, lng: 72.6369, name: 'Gandhinagar, Gujarat' },
  goa: { lat: 15.2993, lng: 74.1240, name: 'Goa' },
  panaji: { lat: 15.4909, lng: 73.8278, name: 'Panaji, Goa' },

  // Central Zone (Madhya Pradesh & Chhattisgarh)
  indore: { lat: 22.7196, lng: 75.8577, name: 'Indore, Madhya Pradesh' },
  bhopal: { lat: 23.2599, lng: 77.4126, name: 'Bhopal, Madhya Pradesh' },
  gwalior: { lat: 26.2183, lng: 78.1828, name: 'Gwalior, Madhya Pradesh' },
  jabalpur: { lat: 23.1815, lng: 79.9864, name: 'Jabalpur, Madhya Pradesh' },
  ujjain: { lat: 23.1765, lng: 75.7885, name: 'Ujjain, Madhya Pradesh' },
  raipur: { lat: 21.2514, lng: 81.6296, name: 'Raipur, Chhattisgarh' },

  // Northern Zone (Delhi NCR, UP, Rajasthan, Punjab, Haryana, etc.)
  delhi: { lat: 28.7041, lng: 77.1025, name: 'New Delhi, Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi, Delhi' },
  noida: { lat: 28.5355, lng: 77.3910, name: 'Noida, Uttar Pradesh' },
  gurgaon: { lat: 28.4595, lng: 77.0266, name: 'Gurugram, Haryana' },
  gurugram: { lat: 28.4595, lng: 77.0266, name: 'Gurugram, Haryana' },
  faridabad: { lat: 28.4089, lng: 77.3178, name: 'Faridabad, Haryana' },
  ghaziabad: { lat: 28.6692, lng: 77.4538, name: 'Ghaziabad, Uttar Pradesh' },
  jaipur: { lat: 26.9124, lng: 75.7873, name: 'Jaipur, Rajasthan' },
  jodhpur: { lat: 26.2389, lng: 73.0243, name: 'Jodhpur, Rajasthan' },
  udaipur: { lat: 24.5854, lng: 73.7125, name: 'Udaipur, Rajasthan' },
  lucknow: { lat: 26.8467, lng: 80.9462, name: 'Lucknow, Uttar Pradesh' },
  kanpur: { lat: 26.4499, lng: 80.3319, name: 'Kanpur, Uttar Pradesh' },
  varanasi: { lat: 25.3176, lng: 82.9739, name: 'Varanasi, Uttar Pradesh' },
  agra: { lat: 27.1767, lng: 78.0081, name: 'Agra, Uttar Pradesh' },
  chandigarh: { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
  ludhiana: { lat: 30.9010, lng: 75.8573, name: 'Ludhiana, Punjab' },
  amritsar: { lat: 31.6340, lng: 74.8723, name: 'Amritsar, Punjab' },
  dehradun: { lat: 30.3165, lng: 78.0322, name: 'Dehradun, Uttarakhand' },
  shimla: { lat: 31.1048, lng: 77.1734, name: 'Shimla, Himachal Pradesh' },
  jammu: { lat: 32.7266, lng: 74.8570, name: 'Jammu, Jammu and Kashmir' },
  srinagar: { lat: 34.0837, lng: 74.7973, name: 'Srinagar, Jammu and Kashmir' },

  // Southern Zone
  bengaluru: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka' },
  bangalore: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka' },
  mysuru: { lat: 12.2958, lng: 76.6394, name: 'Mysuru, Karnataka' },
  hyderabad: { lat: 17.3850, lng: 78.4867, name: 'Hyderabad, Telangana' },
  chennai: { lat: 13.0827, lng: 80.2707, name: 'Chennai, Tamil Nadu' },
  coimbatore: { lat: 11.0168, lng: 76.9558, name: 'Coimbatore, Tamil Nadu' },
  madurai: { lat: 9.9252, lng: 78.1198, name: 'Madurai, Tamil Nadu' },
  kochi: { lat: 9.9312, lng: 76.2673, name: 'Kochi, Kerala' },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366, name: 'Thiruvananthapuram, Kerala' },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam, Andhra Pradesh' },
  vijayawada: { lat: 16.5062, lng: 80.6480, name: 'Vijayawada, Andhra Pradesh' },

  // Eastern & North-Eastern Zone
  kolkata: { lat: 22.5726, lng: 88.3639, name: 'Kolkata, West Bengal' },
  howrah: { lat: 22.5958, lng: 88.2636, name: 'Howrah, West Bengal' },
  patna: { lat: 25.5941, lng: 85.1376, name: 'Patna, Bihar' },
  ranchi: { lat: 23.3441, lng: 85.3096, name: 'Ranchi, Jharkhand' },
  bhubaneswar: { lat: 20.2961, lng: 85.8245, name: 'Bhubaneswar, Odisha' },
  guwahati: { lat: 26.1445, lng: 91.7362, name: 'Guwahati, Assam' },
};

// Pincode prefix approximations across India
const PINCODE_PREFIX_MAPPING = {
  // Western
  '400': { lat: 19.0760, lng: 72.8777, city: 'Mumbai' },
  '401': { lat: 19.3800, lng: 72.8300, city: 'Thane / Palghar' },
  '411': { lat: 18.5204, lng: 73.8567, city: 'Pune' },
  '440': { lat: 21.1458, lng: 79.0882, city: 'Nagpur' },
  '422': { lat: 19.9975, lng: 73.7898, city: 'Nashik' },
  '380': { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad' },
  '390': { lat: 22.3072, lng: 73.1812, city: 'Vadodara' },
  '395': { lat: 21.1702, lng: 72.8311, city: 'Surat' },
  '360': { lat: 22.3039, lng: 70.8022, city: 'Rajkot' },
  '403': { lat: 15.2993, lng: 74.1240, city: 'Goa' },

  // Central (Madhya Pradesh & Chhattisgarh)
  '452': { lat: 22.7196, lng: 75.8577, city: 'Indore' },
  '462': { lat: 23.2599, lng: 77.4126, city: 'Bhopal' },
  '474': { lat: 26.2183, lng: 78.1828, city: 'Gwalior' },
  '482': { lat: 23.1815, lng: 79.9864, city: 'Jabalpur' },
  '456': { lat: 23.1765, lng: 75.7885, city: 'Ujjain' },
  '492': { lat: 21.2514, lng: 81.6296, city: 'Raipur' },

  // Northern
  '110': { lat: 28.7041, lng: 77.1025, city: 'Delhi' },
  '201': { lat: 28.5355, lng: 77.3910, city: 'Noida / Ghaziabad' },
  '122': { lat: 28.4595, lng: 77.0266, city: 'Gurugram' },
  '121': { lat: 28.4089, lng: 77.3178, city: 'Faridabad' },
  '302': { lat: 26.9124, lng: 75.7873, city: 'Jaipur' },
  '226': { lat: 26.8467, lng: 80.9462, city: 'Lucknow' },
  '208': { lat: 26.4499, lng: 80.3319, city: 'Kanpur' },
  '221': { lat: 25.3176, lng: 82.9739, city: 'Varanasi' },
  '282': { lat: 27.1767, lng: 78.0081, city: 'Agra' },
  '160': { lat: 30.7333, lng: 76.7794, city: 'Chandigarh' },
  '141': { lat: 30.9010, lng: 75.8573, city: 'Ludhiana' },
  '143': { lat: 31.6340, lng: 74.8723, city: 'Amritsar' },
  '248': { lat: 30.3165, lng: 78.0322, city: 'Dehradun' },
  '180': { lat: 32.7266, lng: 74.8570, city: 'Jammu' },
  '190': { lat: 34.0837, lng: 74.7973, city: 'Srinagar' },

  // Southern
  '560': { lat: 12.9716, lng: 77.5946, city: 'Bengaluru' },
  '570': { lat: 12.2958, lng: 76.6394, city: 'Mysuru' },
  '500': { lat: 17.3850, lng: 78.4867, city: 'Hyderabad' },
  '600': { lat: 13.0827, lng: 80.2707, city: 'Chennai' },
  '641': { lat: 11.0168, lng: 76.9558, city: 'Coimbatore' },
  '625': { lat: 9.9252, lng: 78.1198, city: 'Madurai' },
  '682': { lat: 9.9312, lng: 76.2673, city: 'Kochi' },
  '695': { lat: 8.5241, lng: 76.9366, city: 'Thiruvananthapuram' },
  '530': { lat: 17.6868, lng: 83.2185, city: 'Visakhapatnam' },
  '520': { lat: 16.5062, lng: 80.6480, city: 'Vijayawada' },

  // Eastern
  '700': { lat: 22.5726, lng: 88.3639, city: 'Kolkata' },
  '711': { lat: 22.5958, lng: 88.2636, city: 'Howrah' },
  '800': { lat: 25.5941, lng: 85.1376, city: 'Patna' },
  '834': { lat: 23.3441, lng: 85.3096, city: 'Ranchi' },
  '751': { lat: 20.2961, lng: 85.8245, city: 'Bhubaneswar' },
  '781': { lat: 26.1445, lng: 91.7362, city: 'Guwahati' },
};

class GeoService {
  /**
   * Calculates great-circle spherical distance between two coordinates using Haversine formula
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number|null} Distance in kilometers or null if coordinates invalid
   */
  static calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (
      lat1 === undefined || lat1 === null || isNaN(Number(lat1)) ||
      lon1 === undefined || lon1 === null || isNaN(Number(lon1)) ||
      lat2 === undefined || lat2 === null || isNaN(Number(lat2)) ||
      lon2 === undefined || lon2 === null || isNaN(Number(lon2))
    ) {
      return null;
    }

    const nLat1 = Number(lat1);
    const nLon1 = Number(lon1);
    const nLat2 = Number(lat2);
    const nLon2 = Number(lon2);

    const R = 6371; // Earth's radius in km
    const toRad = (angle) => (angle * Math.PI) / 180;

    const dLat = toRad(nLat2 - nLat1);
    const dLon = toRad(nLon2 - nLon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(nLat1)) * Math.cos(toRad(nLat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  /**
   * Calculates realistic road driving distance and ETA for local fulfillment
   */
  static calculateDrivingEta(distanceKm, vehicleType = 'bike') {
    const windingFactor = 1.35;
    const roadDistanceKm = parseFloat(((distanceKm || 5) * windingFactor).toFixed(2));

    let speedKmh = 25; // default bike
    let bufferMins = 5;

    switch (String(vehicleType).toLowerCase()) {
      case 'scooter':
      case 'electric':
        speedKmh = 22;
        break;
      case 'car':
      case 'van':
        speedKmh = 28;
        bufferMins = 8;
        break;
      case 'bicycle':
        speedKmh = 14;
        bufferMins = 3;
        break;
      case 'bike':
      default:
        speedKmh = 25;
        bufferMins = 5;
        break;
    }

    const travelMinutes = Math.round((roadDistanceKm / speedKmh) * 60) + bufferMins;

    return {
      straightDistanceKm: distanceKm,
      roadDistanceKm,
      estimatedMinutes: Math.max(5, travelMinutes),
    };
  }

  /**
   * Ray-Casting algorithm to check if a point lies inside a polygon boundary
   */
  static isPointInPolygon(point, polygon) {
    if (!point || point.lat === null || point.lng === null) return false;
    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      return false;
    }

    const x = point.lat;
    const y = point.lng;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Resolves address or pincode to approximate latitude/longitude
   * Does NOT force fake Mumbai coordinates on unmapped locations!
   * @param {Object} location
   * @returns {{ lat: number|null, lng: number|null, address: string, city: string, pincode: string, isResolved: boolean }}
   */
  static geocodeLocation(location = {}) {
    if (!location || typeof location !== 'object') {
      return {
        lat: null,
        lng: null,
        address: '',
        city: '',
        pincode: '',
        isResolved: false,
      };
    }

    const address = location.address || location.addressLine || '';
    const pincode = String(location.pincode || location.postalCode || location.zip || '').trim();
    const city = String(location.city || '').trim();
    const state = String(location.state || '').trim();
    const lat = location.lat ?? location.latitude ?? null;
    const lng = location.lng ?? location.longitude ?? null;

    // 1. If explicit valid coordinates provided, preserve them
    if (lat !== null && lng !== null && !isNaN(Number(lat)) && !isNaN(Number(lng)) && Number(lat) !== 0 && Number(lng) !== 0) {
      return {
        lat: Number(lat),
        lng: Number(lng),
        address: address || `${city} ${pincode}`.trim() || 'Verified Location',
        city,
        pincode,
        isResolved: true,
      };
    }

    // 2. Lookup by Pincode Prefix (3 digits)
    if (pincode.length >= 3) {
      const prefix = pincode.slice(0, 3);
      if (PINCODE_PREFIX_MAPPING[prefix]) {
        const entry = PINCODE_PREFIX_MAPPING[prefix];
        return {
          lat: entry.lat,
          lng: entry.lng,
          address: address || `${entry.city} - ${pincode}`,
          city: city || entry.city,
          pincode,
          isResolved: true,
        };
      }
    }

    // 3. Lookup by City keyword
    const searchTarget = `${city} ${address} ${state}`.toLowerCase();
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (searchTarget.includes(key.replace('_', ' ')) || searchTarget.includes(key)) {
        return {
          lat: coords.lat,
          lng: coords.lng,
          address: address || coords.name,
          city: city || key,
          pincode,
          isResolved: true,
        };
      }
    }

    // 4. Return unmapped details cleanly without faking Mumbai!
    return {
      lat: null,
      lng: null,
      address: address || [city, state, pincode].filter(Boolean).join(', '),
      city,
      pincode,
      isResolved: false,
    };
  }

  /**
   * Checks delivery eligibility for Pan-India and Hyperlocal fulfillment.
   * - Restricts products ONLY if product.deliveryRestrictions.isRestricted is true.
   * - Local orders (within 10 km / zone) are marked as 'local' (Express 45m local delivery).
   * - All other serviceable Indian locations are marked as 'standard_courier' (3-5 business days via Courier).
   * - NEVER blocks customer merely because seller is > 10 km away!
   */
  static async checkDeliveryEligibility({ seller, product = null, destination }) {
    if (!seller) {
      return {
        eligible: true,
        status: 'available',
        deliveryMode: 'standard_courier',
        distanceKm: null,
        estimatedDeliveryDays: '3-5 business days',
        message: 'Standard Pan-India Delivery available (3-5 business days via Courier)',
      };
    }

    // 1. PRODUCT-SPECIFIC DELIVERY RESTRICTIONS (e.g. perishable items explicitly restricted by seller)
    if (product?.deliveryRestrictions?.isRestricted) {
      const { maxRadiusKm, allowedPincodes } = product.deliveryRestrictions;

      if (allowedPincodes && allowedPincodes.length > 0 && destination.pincode) {
        const targetPin = String(destination.pincode).trim();
        if (!allowedPincodes.includes(targetPin)) {
          return {
            eligible: false,
            status: 'unavailable',
            reason: `This item is restricted and cannot be shipped to pincode ${destination.pincode}`,
            message: `Product is not deliverable to pincode ${destination.pincode} by seller policy.`,
            distanceKm: null,
            estimatedDeliveryMinutes: 0,
          };
        }
      }

      const storeLocation = seller.storeLocation || { lat: 19.0760, lng: 72.8777 };
      const dest = this.geocodeLocation(destination);
      const distanceKm = this.calculateHaversineDistance(
        storeLocation.lat,
        storeLocation.lng,
        dest.lat,
        dest.lng
      );

      if (maxRadiusKm && distanceKm !== null && distanceKm > maxRadiusKm) {
        return {
          eligible: false,
          status: 'unavailable',
          reason: `Delivery distance (${distanceKm} km) exceeds product maximum limit (${maxRadiusKm} km)`,
          message: `Product is restricted to within ${maxRadiusKm} km of seller store.`,
          distanceKm,
          estimatedDeliveryMinutes: 0,
        };
      }
    }

    // 2. CHECK LOCAL HYPERLOCAL DELIVERY vs PAN-INDIA STANDARD SHIPPING
    const storeLocation = seller.storeLocation || {};
    const dest = this.geocodeLocation(destination);

    let distanceKm = null;
    if (storeLocation.lat && storeLocation.lng && dest.lat && dest.lng) {
      distanceKm = this.calculateHaversineDistance(
        storeLocation.lat,
        storeLocation.lng,
        dest.lat,
        dest.lng
      );
    }

    // Check Seller Custom Delivery Zones (e.g. polygons, custom radii)
    let isLocalZoneMatched = false;
    let matchedZone = null;

    try {
      const activeZones = await DeliveryZone.find({
        vendor: seller._id,
        isActive: true,
      });

      if (activeZones && activeZones.length > 0 && dest.isResolved) {
        for (const zone of activeZones) {
          if (zone.zoneType === 'radius') {
            const zoneCenter = zone.center || storeLocation;
            const distToZone = this.calculateHaversineDistance(
              zoneCenter.lat,
              zoneCenter.lng,
              dest.lat,
              dest.lng
            );
            if (distToZone !== null && distToZone <= zone.radiusKm) {
              matchedZone = zone;
              isLocalZoneMatched = true;
              break;
            }
          } else if (zone.zoneType === 'polygon') {
            if (this.isPointInPolygon(dest, zone.polygon)) {
              matchedZone = zone;
              isLocalZoneMatched = true;
              break;
            }
          } else if (zone.zoneType === 'pincode') {
            if (destination.pincode && zone.pincodes.includes(String(destination.pincode).trim())) {
              matchedZone = zone;
              isLocalZoneMatched = true;
              break;
            }
          }
        }
      }
    } catch (zoneErr) {}

    // A. Local Zone Matched
    if (isLocalZoneMatched && matchedZone) {
      const { estimatedMinutes } = this.calculateDrivingEta(distanceKm || 5, 'bike');
      return {
        eligible: true,
        status: 'available',
        deliveryMode: 'local',
        zoneName: matchedZone.name,
        deliveryFee: matchedZone.deliveryFee,
        minOrderAmount: matchedZone.minOrderAmount,
        distanceKm,
        estimatedDeliveryMinutes: Math.max(matchedZone.estimatedDeliveryMinutes || 45, estimatedMinutes),
        estimatedDeliveryDays: 'Same Day',
        message: `Available for Express Local Delivery (~${Math.max(matchedZone.estimatedDeliveryMinutes || 45, estimatedMinutes)} mins in "${matchedZone.name}")`,
      };
    }

    // B. Default Local Store Radius (e.g. within 10 km)
    const localRadius = seller.defaultDeliveryRadiusKm || 10;
    if (distanceKm !== null && distanceKm <= localRadius) {
      const { estimatedMinutes } = this.calculateDrivingEta(distanceKm, 'bike');
      return {
        eligible: true,
        status: 'available',
        deliveryMode: 'local',
        distanceKm,
        zoneName: `Local Store Radius (${localRadius} km)`,
        estimatedDeliveryMinutes: estimatedMinutes,
        estimatedDeliveryDays: 'Same Day',
        message: `Available for Express Local Delivery (~${estimatedMinutes} mins from store)`,
      };
    }

    // C. Pan-India Standard Courier Delivery (Outside local radius, inter-city, or interstate)
    // NEVER block order placement merely because distance > 10 km!
    return {
      eligible: true,
      status: 'available',
      deliveryMode: 'standard_courier',
      distanceKm: distanceKm !== null ? distanceKm : 0,
      estimatedDeliveryDays: '3-5 business days',
      estimatedDeliveryMinutes: 72 * 60, // ~3 days in minutes
      message: 'Standard Pan-India Delivery (3-5 business days via Courier)',
    };
  }
}

module.exports = GeoService;

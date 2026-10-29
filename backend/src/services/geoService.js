/**
 * Smart Delivery Geo & Spatial Calculation Service
 * Appsica E-Commerce Multi-Vendor Logistics Engine
 */

const DeliveryZone = require('../models/deliveryZone');

// Standard geocode reference for Indian cities and key hubs
const CITY_COORDINATES = {
  mumbai: { lat: 19.0760, lng: 72.8777, name: 'Mumbai, Maharashtra' },
  pune: { lat: 18.5204, lng: 73.8567, name: 'Pune, Maharashtra' },
  delhi: { lat: 28.7041, lng: 77.1025, name: 'New Delhi, Delhi' },
  bengaluru: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka' },
  bangalore: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka' },
  hyderabad: { lat: 17.3850, lng: 78.4867, name: 'Hyderabad, Telangana' },
  chennai: { lat: 13.0827, lng: 80.2707, name: 'Chennai, Tamil Nadu' },
  kolkata: { lat: 22.5726, lng: 88.3639, name: 'Kolkata, West Bengal' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad, Gujarat' },
  jaipur: { lat: 26.9124, lng: 75.7873, name: 'Jaipur, Rajasthan' },
  surat: { lat: 21.1702, lng: 72.8311, name: 'Surat, Gujarat' },
  noida: { lat: 28.5355, lng: 77.3910, name: 'Noida, Uttar Pradesh' },
  gurgaon: { lat: 28.4595, lng: 77.0266, name: 'Gurugram, Haryana' },
  gurugram: { lat: 28.4595, lng: 77.0266, name: 'Gurugram, Haryana' },
  lucknow: { lat: 26.8467, lng: 80.9462, name: 'Lucknow, Uttar Pradesh' },
  chandigarh: { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
  indore: { lat: 22.7196, lng: 75.8577, name: 'Indore, Madhya Pradesh' },
  nagpur: { lat: 21.1458, lng: 79.0882, name: 'Nagpur, Maharashtra' },
  nashik: { lat: 19.9975, lng: 73.7898, name: 'Nashik, Maharashtra' },
  navi_mumbai: { lat: 19.0330, lng: 73.0297, name: 'Navi Mumbai, Maharashtra' },
  thane: { lat: 19.2183, lng: 72.9781, name: 'Thane, Maharashtra' },
};

// Pincode prefix approximations
const PINCODE_PREFIX_MAPPING = {
  '400': { lat: 19.0760, lng: 72.8777, city: 'Mumbai' },
  '401': { lat: 19.3800, lng: 72.8300, city: 'Thane / Palghar' },
  '411': { lat: 18.5204, lng: 73.8567, city: 'Pune' },
  '110': { lat: 28.7041, lng: 77.1025, city: 'Delhi' },
  '560': { lat: 12.9716, lng: 77.5946, city: 'Bengaluru' },
  '500': { lat: 17.3850, lng: 78.4867, city: 'Hyderabad' },
  '600': { lat: 13.0827, lng: 80.2707, city: 'Chennai' },
  '700': { lat: 22.5726, lng: 88.3639, city: 'Kolkata' },
  '380': { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad' },
  '302': { lat: 26.9124, lng: 75.7873, city: 'Jaipur' },
  '201': { lat: 28.5355, lng: 77.3910, city: 'Noida' },
  '122': { lat: 28.4595, lng: 77.0266, city: 'Gurugram' },
  '226': { lat: 26.8467, lng: 80.9462, city: 'Lucknow' },
  '452': { lat: 22.7196, lng: 75.8577, city: 'Indore' },
  '440': { lat: 21.1458, lng: 79.0882, city: 'Nagpur' },
  '422': { lat: 19.9975, lng: 73.7898, city: 'Nashik' },
};

class GeoService {
  /**
   * Calculates great-circle spherical distance between two coordinates using Haversine formula
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} Distance in kilometers
   */
  static calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
      return 0;
    }
    const R = 6371; // Earth's radius in km
    const toRad = (angle) => (angle * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  /**
   * Calculates realistic road driving distance and ETA
   * Considers urban winding factor (1.35x straight-line) and vehicle cruising speeds
   */
  static calculateDrivingEta(distanceKm, vehicleType = 'bike') {
    // Road circuity factor for Indian urban traffic
    const windingFactor = 1.35;
    const roadDistanceKm = parseFloat((distanceKm * windingFactor).toFixed(2));

    let speedKmh = 25; // default bike
    let bufferMins = 5; // pickup / parking buffer

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
   * @param {{ lat: number, lng: number }} point
   * @param {Array<{ lat: number, lng: number }>} polygon
   * @returns {boolean}
   */
  static isPointInPolygon(point, polygon) {
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
   * @param {string} address
   * @param {string} pincode
   * @param {string} city
   * @returns {{ lat: number, lng: number, address: string }}
   */
  static geocodeLocation({ address = '', pincode = '', city = '', lat = null, lng = null }) {
    // 1. If explicit valid coordinates provided, preserve them
    if (lat !== null && lng !== null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      return {
        lat: Number(lat),
        lng: Number(lng),
        address: address || `${city} ${pincode}`.trim() || 'Verified Location',
      };
    }

    // 2. Lookup by Pincode Prefix (e.g. 400xxx)
    const cleanPin = String(pincode || '').trim();
    if (cleanPin.length >= 3) {
      const prefix = cleanPin.slice(0, 3);
      if (PINCODE_PREFIX_MAPPING[prefix]) {
        const entry = PINCODE_PREFIX_MAPPING[prefix];
        return {
          lat: entry.lat,
          lng: entry.lng,
          address: address || `${entry.city} - ${cleanPin}`,
        };
      }
    }

    // 3. Lookup by City keyword
    const searchTarget = `${city} ${address}`.toLowerCase();
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (searchTarget.includes(key.replace('_', ' ')) || searchTarget.includes(key)) {
        return {
          lat: coords.lat,
          lng: coords.lng,
          address: address || coords.name,
        };
      }
    }

    // 4. Default fallback: Mumbai Central Hub
    return {
      lat: 19.0760,
      lng: 72.8777,
      address: address || 'Mumbai Logistics Hub, 400001',
    };
  }

  /**
   * Checks whether a customer's destination is deliverable by a seller / product
   * Evaluates active custom zones, polygons, delivery radius, and product restrictions
   */
  static async checkDeliveryEligibility({ seller, product = null, destination }) {
    if (!seller) {
      return {
        eligible: true,
        reason: 'No seller delivery constraints defined',
        distanceKm: 0,
        estimatedDeliveryMinutes: 45,
      };
    }

    // Resolve store coordinates
    const storeLocation = seller.storeLocation || { lat: 19.0760, lng: 72.8777, address: 'Store' };
    const dest = this.geocodeLocation(destination);

    const distanceKm = this.calculateHaversineDistance(
      storeLocation.lat,
      storeLocation.lng,
      dest.lat,
      dest.lng
    );

    // 1. Product-specific delivery restrictions
    if (product?.deliveryRestrictions?.isRestricted) {
      const { maxRadiusKm, allowedPincodes } = product.deliveryRestrictions;

      if (allowedPincodes && allowedPincodes.length > 0 && destination.pincode) {
        if (!allowedPincodes.includes(String(destination.pincode).trim())) {
          return {
            eligible: false,
            status: 'unavailable',
            reason: `This item cannot be shipped to pincode ${destination.pincode}`,
            distanceKm,
            estimatedDeliveryMinutes: 0,
          };
        }
      }

      if (maxRadiusKm && distanceKm > maxRadiusKm) {
        return {
          eligible: false,
          status: 'unavailable',
          reason: `Delivery distance (${distanceKm} km) exceeds product maximum limit (${maxRadiusKm} km)`,
          distanceKm,
          estimatedDeliveryMinutes: 0,
        };
      }
    }

    // 2. Seller-managed custom delivery zones
    const activeZones = await DeliveryZone.find({
      vendor: seller._id,
      isActive: true,
    });

    if (activeZones && activeZones.length > 0) {
      // Evaluate matching zones
      let matchedZone = null;

      for (const zone of activeZones) {
        if (zone.zoneType === 'radius') {
          const zoneCenter = zone.center || storeLocation;
          const distToZone = this.calculateHaversineDistance(
            zoneCenter.lat,
            zoneCenter.lng,
            dest.lat,
            dest.lng
          );
          if (distToZone <= zone.radiusKm) {
            matchedZone = zone;
            break;
          }
        } else if (zone.zoneType === 'polygon') {
          if (this.isPointInPolygon(dest, zone.polygon)) {
            matchedZone = zone;
            break;
          }
        } else if (zone.zoneType === 'pincode') {
          if (destination.pincode && zone.pincodes.includes(String(destination.pincode).trim())) {
            matchedZone = zone;
            break;
          }
        }
      }

      if (matchedZone) {
        const { estimatedMinutes } = this.calculateDrivingEta(distanceKm, 'bike');
        return {
          eligible: true,
          status: 'available',
          zoneName: matchedZone.name,
          deliveryFee: matchedZone.deliveryFee,
          minOrderAmount: matchedZone.minOrderAmount,
          distanceKm,
          estimatedDeliveryMinutes: Math.max(matchedZone.estimatedDeliveryMinutes || 45, estimatedMinutes),
          message: `Available for delivery (${distanceKm} km away in "${matchedZone.name}")`,
        };
      } else {
        return {
          eligible: false,
          status: 'unavailable',
          distanceKm,
          reason: `Your address is outside ${seller.storeName || 'the seller'}'s configured delivery zones (distance: ${distanceKm} km)`,
          message: `Not available in your area. Seller delivers within designated zones only.`,
        };
      }
    }

    // 3. Fallback: Seller's default store delivery radius
    const defaultRadius = seller.defaultDeliveryRadiusKm || 10;
    if (distanceKm <= defaultRadius) {
      const { estimatedMinutes } = this.calculateDrivingEta(distanceKm, 'bike');
      return {
        eligible: true,
        status: 'available',
        distanceKm,
        zoneName: `Standard Store Radius (${defaultRadius} km)`,
        estimatedDeliveryMinutes: estimatedMinutes,
        message: `Available for delivery (${distanceKm} km from store)`,
      };
    }

    return {
      eligible: false,
      status: 'unavailable',
      distanceKm,
      reason: `Delivery address is ${distanceKm} km away (exceeds seller store maximum radius of ${defaultRadius} km)`,
      message: `Not available in your area. Maximum delivery radius is ${defaultRadius} km.`,
    };
  }
}

module.exports = GeoService;


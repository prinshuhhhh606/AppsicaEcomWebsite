import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Compass,
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Layers,
  CircleDot,
  PenTool,
  Sliders,
  DollarSign,
  Clock,
  Eye,
  X
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { deliveryZoneService } from '../../services/deliveryZoneService';
import { formatPrice } from '../../utils/formatPrice';

export default function VendorDeliveryZones() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const activePolygonLayersRef = useRef([]);
  const draftPolyLineRef = useRef(null);
  const draftPointMarkersRef = useRef([]);

  // Store Location State
  const [storeLocation, setStoreLocation] = useState({
    lat: 19.0760,
    lng: 72.8777,
    address: 'Mumbai Logistics Center',
    city: 'Mumbai',
    pincode: '400001',
  });
  const [defaultRadiusKm, setDefaultRadiusKm] = useState(10);
  const [savingStore, setSavingStore] = useState(false);
  const [storeSavedMsg, setStoreSavedMsg] = useState('');

  // Search Address State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Saved Delivery Zones
  const [zones, setZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Zone Creator Modal / Form
  const [zoneMode, setZoneMode] = useState('view'); // 'view', 'create_radius', 'draw_polygon'
  const [newZoneForm, setNewZoneForm] = useState({
    name: '',
    zoneType: 'radius', // 'radius' | 'polygon' | 'pincode'
    radiusKm: 5,
    pincodes: '',
    minOrderAmount: 0,
    deliveryFee: 50,
    estimatedDeliveryMinutes: 45,
    color: '#6366f1',
  });
  const [drawnPolygonPoints, setDrawnPolygonPoints] = useState([]);
  const [savingZone, setSavingZone] = useState(false);

  // ---------------------------------------------------------------------------
  // 1. Initialize Map
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = storeLocation.lat || 19.0760;
    const initialLng = storeLocation.lng || 72.8777;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Render Store Marker
    const storeIcon = L.divIcon({
      className: 'store-pin-marker',
      html: `<div style="background: #6366f1; color: white; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(99,102,241,0.6); border: 2.5px solid #ffffff; font-size: 19px; cursor: pointer;">🏪</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: storeIcon,
      draggable: true,
    }).addTo(map);

    marker.bindPopup(`<b>${storeLocation.address || 'Your Store'}</b><br>Drag pin or click map to move store`);

    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      updateStoreCoords(lat, lng);
    });

    storeMarkerRef.current = marker;

    // Render default radius preview circle
    const circle = L.circle([initialLat, initialLng], {
      color: '#6366f1',
      fillColor: '#6366f1',
      fillOpacity: 0.12,
      radius: defaultRadiusKm * 1000,
      weight: 2,
      dashArray: '6, 6',
    }).addTo(map);

    radiusCircleRef.current = circle;

    // Map Click Listener
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      // If currently drawing a polygon
      if (zoneModeRef.current === 'draw_polygon') {
        addPolygonPoint(lat, lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Ref tracking current zoneMode inside click handler without re-binding
  const zoneModeRef = useRef(zoneMode);
  useEffect(() => {
    zoneModeRef.current = zoneMode;
  }, [zoneMode]);

  // ---------------------------------------------------------------------------
  // 2. Load Store Location & Zones on Mount
  // ---------------------------------------------------------------------------
  const loadData = async () => {
    setLoadingZones(true);
    try {
      const [locRes, zonesRes] = await Promise.all([
        deliveryZoneService.getStoreLocation().catch(() => null),
        deliveryZoneService.getMyZones().catch(() => null),
      ]);

      if (locRes?.storeLocation) {
        setStoreLocation(locRes.storeLocation);
        setDefaultRadiusKm(locRes.defaultDeliveryRadiusKm || 10);
        if (mapInstanceRef.current && storeMarkerRef.current) {
          const lat = locRes.storeLocation.lat;
          const lng = locRes.storeLocation.lng;
          mapInstanceRef.current.setView([lat, lng], 12);
          storeMarkerRef.current.setLatLng([lat, lng]);
          if (radiusCircleRef.current) {
            radiusCircleRef.current.setLatLng([lat, lng]);
            radiusCircleRef.current.setRadius((locRes.defaultDeliveryRadiusKm || 10) * 1000);
          }
        }
      }

      if (zonesRes?.zones) {
        setZones(zonesRes.zones);
        renderZonesOnMap(zonesRes.zones);
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to load delivery zones');
    } finally {
      setLoadingZones(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---------------------------------------------------------------------------
  // 3. Render Saved Zones onto Map
  // ---------------------------------------------------------------------------
  const renderZonesOnMap = (zonesList) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove previous polygon layers
    activePolygonLayersRef.current.forEach((layer) => map.removeLayer(layer));
    activePolygonLayersRef.current = [];

    zonesList.forEach((z) => {
      if (!z.isActive) return;

      const color = z.color || '#6366f1';

      if (z.zoneType === 'radius' && z.center) {
        const circle = L.circle([z.center.lat, z.center.lng], {
          color,
          fillColor: color,
          fillOpacity: 0.18,
          radius: z.radiusKm * 1000,
          weight: 2,
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-family: inherit;">
            <strong style="color: ${color};">${z.name}</strong><br>
            Radius: <b>${z.radiusKm} km</b><br>
            Min Order: ${formatPrice(z.minOrderAmount)}<br>
            Delivery Fee: ${formatPrice(z.deliveryFee)}
          </div>
        `);
        activePolygonLayersRef.current.push(circle);
      } else if (z.zoneType === 'polygon' && z.polygon?.length >= 3) {
        const latLngs = z.polygon.map((p) => [p.lat, p.lng]);
        const poly = L.polygon(latLngs, {
          color,
          fillColor: color,
          fillOpacity: 0.22,
          weight: 2.5,
        }).addTo(map);

        poly.bindPopup(`
          <div style="font-family: inherit;">
            <strong style="color: ${color};">${z.name}</strong><br>
            Type: <b>Custom Polygon Zone</b><br>
            Delivery Fee: ${formatPrice(z.deliveryFee)}
          </div>
        `);
        activePolygonLayersRef.current.push(poly);
      }
    });
  };

  // ---------------------------------------------------------------------------
  // 4. Update Store Location
  // ---------------------------------------------------------------------------
  const updateStoreCoords = (lat, lng, address = '') => {
    setStoreLocation((prev) => ({
      ...prev,
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      address: address || prev.address,
    }));

    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng([lat, lng]);
    }
  };

  const handleSaveStoreLocation = async () => {
    setSavingStore(true);
    setStoreSavedMsg('');
    try {
      const res = await deliveryZoneService.updateStoreLocation({
        lat: storeLocation.lat,
        lng: storeLocation.lng,
        address: storeLocation.address,
        city: storeLocation.city,
        pincode: storeLocation.pincode,
        defaultDeliveryRadiusKm: defaultRadiusKm,
      });
      if (res?.success) {
        setStoreSavedMsg('Store location & default radius updated successfully!');
        setTimeout(() => setStoreSavedMsg(''), 4000);
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update store location');
    } finally {
      setSavingStore(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Address Search & Geocoding
  // ---------------------------------------------------------------------------
  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const query = encodeURIComponent(`${searchQuery}, India`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const displayName = data[0].display_name;

        updateStoreCoords(lat, lng, displayName);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 14);
          if (storeMarkerRef.current) {
            storeMarkerRef.current.setLatLng([lat, lng]);
            storeMarkerRef.current.openPopup();
          }
        }
      } else {
        alert('Location not found. Try entering city name or specific area (e.g. Bandra West, Mumbai)');
      }
    } catch (err) {
      alert('Geocoding search notice: Unable to resolve address. You can click or drag the map pin directly.');
    } finally {
      setSearching(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. Polygon Drawing Workflow
  // ---------------------------------------------------------------------------
  const addPolygonPoint = (lat, lng) => {
    const newPt = { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };
    const updated = [...drawnPolygonPoints, newPt];
    setDrawnPolygonPoints(updated);

    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Add point marker
    const ptIcon = L.divIcon({
      className: 'poly-pt-pin',
      html: `<div style="background: #ef4444; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 1.5px solid white;">${updated.length}</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const ptMarker = L.marker([lat, lng], { icon: ptIcon }).addTo(map);
    draftPointMarkersRef.current.push(ptMarker);

    // Update draft polyline / polygon
    if (draftPolyLineRef.current) {
      map.removeLayer(draftPolyLineRef.current);
    }

    if (updated.length >= 2) {
      const latLngs = updated.map((p) => [p.lat, p.lng]);
      const draftPoly = L.polygon(latLngs, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map);
      draftPolyLineRef.current = draftPoly;
    }
  };

  const clearDraftPolygon = () => {
    if (mapInstanceRef.current) {
      if (draftPolyLineRef.current) {
        mapInstanceRef.current.removeLayer(draftPolyLineRef.current);
        draftPolyLineRef.current = null;
      }
      draftPointMarkersRef.current.forEach((m) => mapInstanceRef.current.removeLayer(m));
      draftPointMarkersRef.current = [];
    }
    setDrawnPolygonPoints([]);
  };

  // ---------------------------------------------------------------------------
  // 7. Save Zone
  // ---------------------------------------------------------------------------
  const handleSaveZone = async (e) => {
    e.preventDefault();
    if (!newZoneForm.name.trim()) {
      alert('Please enter a name for this delivery zone');
      return;
    }

    if (newZoneForm.zoneType === 'polygon' && drawnPolygonPoints.length < 3) {
      alert('A polygon boundary requires at least 3 points. Click on the map to place boundary points.');
      return;
    }

    setSavingZone(true);
    try {
      const payload = {
        name: newZoneForm.name.trim(),
        zoneType: newZoneForm.zoneType,
        radiusKm: Number(newZoneForm.radiusKm),
        center: {
          lat: storeLocation.lat,
          lng: storeLocation.lng,
          address: storeLocation.address,
        },
        polygon: drawnPolygonPoints,
        pincodes: newZoneForm.pincodes
          ? newZoneForm.pincodes.split(',').map((p) => p.trim()).filter(Boolean)
          : [],
        minOrderAmount: Number(newZoneForm.minOrderAmount) || 0,
        deliveryFee: Number(newZoneForm.deliveryFee) || 0,
        estimatedDeliveryMinutes: Number(newZoneForm.estimatedDeliveryMinutes) || 45,
        color: newZoneForm.color,
        isActive: true,
      };

      const res = await deliveryZoneService.createZone(payload);
      if (res?.success) {
        setSuccessMsg(`Delivery zone "${res.zone.name}" created!`);
        clearDraftPolygon();
        setZoneMode('view');
        setNewZoneForm({
          name: '',
          zoneType: 'radius',
          radiusKm: 5,
          pincodes: '',
          minOrderAmount: 0,
          deliveryFee: 50,
          estimatedDeliveryMinutes: 45,
          color: '#6366f1',
        });
        const updatedZones = [res.zone, ...zones];
        setZones(updatedZones);
        renderZonesOnMap(updatedZones);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to create delivery zone');
    } finally {
      setSavingZone(false);
    }
  };

  const handleToggleZone = async (zone) => {
    try {
      const res = await deliveryZoneService.updateZone(zone._id, { isActive: !zone.isActive });
      if (res?.success) {
        const updated = zones.map((z) => (z._id === zone._id ? { ...z, isActive: !z.isActive } : z));
        setZones(updated);
        renderZonesOnMap(updated);
      }
    } catch (err) {
      alert(err?.message || 'Failed to toggle zone status');
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm('Are you sure you want to delete this delivery zone?')) return;
    try {
      const res = await deliveryZoneService.deleteZone(zoneId);
      if (res?.success) {
        const updated = zones.filter((z) => z._id !== zoneId);
        setZones(updated);
        renderZonesOnMap(updated);
      }
    } catch (err) {
      alert(err?.message || 'Failed to delete zone');
    }
  };

  const handleFocusZone = (zone) => {
    if (!mapInstanceRef.current) return;
    if (zone.zoneType === 'radius' && zone.center) {
      mapInstanceRef.current.setView([zone.center.lat, zone.center.lng], 13);
    } else if (zone.zoneType === 'polygon' && zone.polygon?.length > 0) {
      const bounds = L.latLngBounds(zone.polygon.map((p) => [p.lat, p.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Compass size={24} style={{ color: '#818cf8' }} /> Smart Delivery Zones & Store Map
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Set your store GPS location, configure delivery radiuses, and draw custom service zone boundaries.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="vp-btn vp-btn-secondary"
            onClick={loadData}
            style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            type="button"
            className="vp-btn vp-btn-primary"
            onClick={() => {
              clearDraftPolygon();
              setZoneMode(zoneMode === 'view' ? 'create_radius' : 'view');
            }}
            style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {zoneMode === 'view' ? (
              <>
                <Plus size={16} /> New Delivery Zone
              </>
            ) : (
              <>
                <X size={16} /> Cancel Zone Creator
              </>
            )}
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Main Grid: Map & Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.4fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Store Setup & Zone Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Store Pin & Address Card */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <StoreIconSmall /> Registered Store Fulfillment Center
            </h3>

            {/* Address Search */}
            <form onSubmit={handleAddressSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                <input
                  type="text"
                  className="vp-input"
                  placeholder="Search store address, area, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 32, fontSize: '0.82rem' }}
                />
              </div>
              <button type="submit" className="vp-btn vp-btn-secondary" disabled={searching} style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                {searching ? 'Locating...' : 'Search'}
              </button>
            </form>

            <div className="vp-form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="vp-form-label" style={{ fontSize: '0.78rem' }}>Store Address Line</label>
              <input
                type="text"
                className="vp-input"
                value={storeLocation.address}
                onChange={(e) => setStoreLocation({ ...storeLocation, address: e.target.value })}
                placeholder="e.g. Plot 42, Bandra Linking Road, Mumbai"
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="vp-form-label" style={{ fontSize: '0.78rem' }}>City</label>
                <input
                  type="text"
                  className="vp-input"
                  value={storeLocation.city}
                  onChange={(e) => setStoreLocation({ ...storeLocation, city: e.target.value })}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>
              <div>
                <label className="vp-form-label" style={{ fontSize: '0.78rem' }}>Pincode</label>
                <input
                  type="text"
                  className="vp-input"
                  value={storeLocation.pincode}
                  onChange={(e) => setStoreLocation({ ...storeLocation, pincode: e.target.value })}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>
            </div>

            {/* Coordinates Display */}
            <div style={{ background: '#0f172a', padding: '0.65rem 0.85rem', borderRadius: 8, fontSize: '0.78rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span>Latitude: <strong style={{ color: '#cbd5e1' }}>{storeLocation.lat}</strong></span>
              <span>Longitude: <strong style={{ color: '#cbd5e1' }}>{storeLocation.lng}</strong></span>
            </div>

            {/* Default Delivery Radius Slider */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label className="vp-form-label" style={{ fontSize: '0.78rem', margin: 0 }}>
                  Standard Store Delivery Radius
                </label>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#818cf8' }}>
                  {defaultRadiusKm} km
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={defaultRadiusKm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDefaultRadiusKm(val);
                  if (radiusCircleRef.current) {
                    radiusCircleRef.current.setRadius(val * 1000);
                  }
                }}
                style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                <span>1 km (Hyperlocal)</span>
                <span>10 km</span>
                <span>20 km</span>
                <span>30 km (Citywide)</span>
              </div>
            </div>

            {storeSavedMsg && (
              <div style={{ fontSize: '0.78rem', color: '#10b981', marginBottom: '0.75rem' }}>
                ✓ {storeSavedMsg}
              </div>
            )}

            <button
              type="button"
              className="vp-btn vp-btn-primary"
              onClick={handleSaveStoreLocation}
              disabled={savingStore}
              style={{ width: '100%', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Save size={14} /> {savingStore ? 'Saving...' : 'Save Store Coordinates & Radius'}
            </button>
          </div>

          {/* Zone Creation Card (When Active) */}
          {zoneMode !== 'view' && (
            <div style={{ background: '#1e293b', border: '2px solid #6366f1', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={18} style={{ color: '#818cf8' }} />
                  {zoneMode === 'draw_polygon' ? 'Draw Custom Polygon Zone' : 'Configure Delivery Zone'}
                </h3>
                <span style={{ fontSize: '0.75rem', background: '#312e81', color: '#c7d2fe', padding: '2px 8px', borderRadius: 6 }}>
                  {newZoneForm.zoneType.toUpperCase()}
                </span>
              </div>

              <form onSubmit={handleSaveZone}>
                <div className="vp-form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="vp-form-label" style={{ fontSize: '0.78rem' }}>Zone Name *</label>
                  <input
                    type="text"
                    className="vp-input"
                    placeholder="e.g. South Mumbai Suburbs, Western Express"
                    value={newZoneForm.name}
                    onChange={(e) => setNewZoneForm({ ...newZoneForm, name: e.target.value })}
                    required
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>

                {/* Zone Type Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      clearDraftPolygon();
                      setZoneMode('create_radius');
                      setNewZoneForm({ ...newZoneForm, zoneType: 'radius' });
                    }}
                    style={{
                      background: newZoneForm.zoneType === 'radius' ? '#4338ca' : '#0f172a',
                      color: '#f8fafc',
                      border: '1px solid #475569',
                      borderRadius: 8,
                      padding: '0.5rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CircleDot size={16} /> Radius
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clearDraftPolygon();
                      setZoneMode('draw_polygon');
                      setNewZoneForm({ ...newZoneForm, zoneType: 'polygon' });
                    }}
                    style={{
                      background: newZoneForm.zoneType === 'polygon' ? '#4338ca' : '#0f172a',
                      color: '#f8fafc',
                      border: '1px solid #475569',
                      borderRadius: 8,
                      padding: '0.5rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <PenTool size={16} /> Polygon
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clearDraftPolygon();
                      setZoneMode('create_pincode');
                      setNewZoneForm({ ...newZoneForm, zoneType: 'pincode' });
                    }}
                    style={{
                      background: newZoneForm.zoneType === 'pincode' ? '#4338ca' : '#0f172a',
                      color: '#f8fafc',
                      border: '1px solid #475569',
                      borderRadius: 8,
                      padding: '0.5rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <MapPin size={16} /> Pincode
                  </button>
                </div>

                {/* Radius Specific */}
                {newZoneForm.zoneType === 'radius' && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                      <span className="vp-form-label" style={{ margin: 0 }}>Zone Radius</span>
                      <strong style={{ color: '#818cf8' }}>{newZoneForm.radiusKm} km</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {[3, 5, 8, 12, 18].map((km) => (
                        <button
                          key={km}
                          type="button"
                          onClick={() => setNewZoneForm({ ...newZoneForm, radiusKm: km })}
                          style={{
                            flex: 1,
                            padding: '4px 0',
                            fontSize: '0.75rem',
                            background: newZoneForm.radiusKm === km ? '#6366f1' : '#0f172a',
                            border: '1px solid #334155',
                            color: '#fff',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                        >
                          {km}km
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="0.5"
                      max="60"
                      step="0.5"
                      className="vp-input"
                      value={newZoneForm.radiusKm}
                      onChange={(e) => setNewZoneForm({ ...newZoneForm, radiusKm: e.target.value })}
                      placeholder="Custom radius km"
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                )}

                {/* Polygon Specific Info */}
                {newZoneForm.zoneType === 'polygon' && (
                  <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.78rem' }}>
                    <div style={{ color: '#38bdf8', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PenTool size={14} /> Click map to place boundary points
                    </div>
                    <div style={{ color: '#94a3b8' }}>
                      Points added: <strong style={{ color: '#f8fafc' }}>{drawnPolygonPoints.length}</strong> (Minimum 3 required)
                    </div>
                    {drawnPolygonPoints.length > 0 && (
                      <button
                        type="button"
                        onClick={clearDraftPolygon}
                        style={{ marginTop: 6, fontSize: '0.72rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Reset / Clear points
                      </button>
                    )}
                  </div>
                )}

                {/* Pincode Specific */}
                {newZoneForm.zoneType === 'pincode' && (
                  <div className="vp-form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="vp-form-label" style={{ fontSize: '0.78rem' }}>Allowed Pincodes (Comma-separated)</label>
                    <input
                      type="text"
                      className="vp-input"
                      placeholder="400001, 400050, 400051"
                      value={newZoneForm.pincodes}
                      onChange={(e) => setNewZoneForm({ ...newZoneForm, pincodes: e.target.value })}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                )}

                {/* Pricing & SLAs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="vp-form-label" style={{ fontSize: '0.78rem' }}>Delivery Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="vp-input"
                      value={newZoneForm.deliveryFee}
                      onChange={(e) => setNewZoneForm({ ...newZoneForm, deliveryFee: e.target.value })}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label className="vp-form-label" style={{ fontSize: '0.78rem' }}>Min Order (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="vp-input"
                      value={newZoneForm.minOrderAmount}
                      onChange={(e) => setNewZoneForm({ ...newZoneForm, minOrderAmount: e.target.value })}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="vp-btn vp-btn-secondary"
                    onClick={() => {
                      clearDraftPolygon();
                      setZoneMode('view');
                    }}
                    style={{ flex: 1, fontSize: '0.82rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="vp-btn vp-btn-primary"
                    disabled={savingZone || (newZoneForm.zoneType === 'polygon' && drawnPolygonPoints.length < 3)}
                    style={{ flex: 1, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Save size={14} /> {savingZone ? 'Saving...' : 'Save Zone'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Saved Zones List */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Saved Zones ({zones.length})</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                {zones.filter((z) => z.isActive).length} active
              </span>
            </h3>

            {loadingZones ? (
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Loading delivery zones...</p>
            ) : zones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                <Compass size={32} style={{ color: '#475569', margin: '0 auto 0.5rem' }} />
                <p style={{ margin: '0 0 0.5rem' }}>No custom delivery zones created yet.</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                  Orders default to your <strong>{defaultRadiusKm} km store radius</strong> until custom zones are added.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {zones.map((zone) => (
                  <div
                    key={zone._id}
                    style={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>{zone.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {zone.zoneType === 'radius' && `Radius: ${zone.radiusKm} km`}
                          {zone.zoneType === 'polygon' && `Custom Polygon (${zone.polygon?.length || 0} vertices)`}
                          {zone.zoneType === 'pincode' && `Pincodes: ${zone.pincodes?.slice(0, 3).join(', ')}`}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontWeight: 600,
                          background: zone.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: zone.isActive ? '#10b981' : '#ef4444',
                        }}
                      >
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#cbd5e1', paddingTop: 4, borderTop: '1px solid #1e293b' }}>
                      <span>Fee: <strong>{formatPrice(zone.deliveryFee)}</strong></span>
                      <span>Min: <strong>{formatPrice(zone.minOrderAmount)}</strong></span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleFocusZone(zone)}
                          title="View on Map"
                          style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 2 }}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleZone(zone)}
                          title={zone.isActive ? 'Deactivate' : 'Activate'}
                          style={{ background: 'transparent', border: 'none', color: zone.isActive ? '#f59e0b' : '#10b981', cursor: 'pointer', padding: 2 }}
                        >
                          <Sliders size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteZone(zone._id)}
                          title="Delete Zone"
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Leaflet Map Canvas */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Map Header Status Bar */}
          <div style={{ padding: '0.75rem 1rem', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f8fafc' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span>Interactive Delivery Map</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
              {zoneMode === 'draw_polygon' ? (
                <span style={{ color: '#ef4444', fontWeight: 600 }}>● DRAWING MODE: Click on map to add points</span>
              ) : (
                <span>Drag store pin or change radius slider to update zone</span>
              )}
            </div>
          </div>

          {/* Leaflet Map Div */}
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '560px',
              minHeight: '500px',
              background: '#0f172a',
            }}
          />

          {/* Map Legend & Legend Help */}
          <div style={{ padding: '0.75rem 1rem', background: '#0f172a', borderTop: '1px solid #334155', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
              <span>Store Center (Fulfillment Hub)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 8, border: '1px dashed #6366f1', background: 'rgba(99,102,241,0.2)', display: 'inline-block' }} />
              <span>Default Store Radius ({defaultRadiusKm} km)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 8, border: '1px solid #ef4444', background: 'rgba(239,68,68,0.25)', display: 'inline-block' }} />
              <span>Active Custom Zones</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreIconSmall() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontSize: 13 }}>
      🏪
    </span>
  );
}


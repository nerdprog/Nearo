const GRID_SIZE = 0.012; // 1.3km Grid Cells

/**
 * Request user's current location from the browser
 * @returns {Promise<{lat: number, lng: number}>}
 */
export function requestLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Location permission denied. Nearo requires location to function."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable."));
            break;
          case error.TIMEOUT:
            reject(new Error("The request to get user location timed out."));
            break;
          default:
            reject(new Error("An unknown error occurred while getting location."));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Calculate the zone ID based on lat/lng and grid size
 */
export function getZoneId(lat, lng) {
  const zoneX = Math.floor(lng / GRID_SIZE);
  const zoneY = Math.floor(lat / GRID_SIZE);
  return `${zoneX}_${zoneY}`;
}

/**
 * Get the current zone and its 8 surrounding neighbors (3x3 block)
 */
export function getNearbyZones(lat, lng) {
  const centerZoneX = Math.floor(lng / GRID_SIZE);
  const centerZoneY = Math.floor(lat / GRID_SIZE);

  const zones = [];

  // Generate 3x3 grid around center
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      zones.push(`${centerZoneX + x}_${centerZoneY + y}`);
    }
  }

  return zones;
}

/**
 * Flow to get location and calculate zones, then update state
 */
export async function updateLocation(stateManager) {
  try {
    const { lat, lng } = await requestLocation();
    const zoneId = getZoneId(lat, lng);
    const nearbyZones = getNearbyZones(lat, lng);

    stateManager.setLocation(zoneId, nearbyZones, lat, lng);
    return true;
  } catch (error) {
    console.error("Location error:", error);
    throw error;
  }
}

/**
 * Calculate the distance between two lat/lng coordinates in kilometers using Haversine formula
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

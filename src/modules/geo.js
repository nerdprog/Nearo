const GRID_SIZE = 0.03; // ~3.3km grid cells

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
    
    stateManager.setLocation(zoneId, nearbyZones);
    return true;
  } catch (error) {
    console.error("Location error:", error);
    throw error;
  }
}

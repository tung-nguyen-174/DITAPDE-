// src/services/googlePlacesService.ts
// Docs: https://developers.google.com/maps/documentation/javascript/places-migration-overview?utm_campaign=gmp_mcp_codeassist_v1_aistudio

export interface GymLocationModel {
  placeId: string;
  name: string;
  address: string;
  city?: string;
  latitude: number;
  longitude: number;
  rating: number;
  userRatingsTotal: number;
  photoUrl: string;
  activeMembers?: number;
  tags?: string[];
}

const ACTIVE_CHECKIN_KEY = 'gym_chuot_active_gym_checkin';
const CACHED_GYMS_KEY = 'gym_chuot_cached_nearby_gyms';
const CUSTOM_GYMS_KEY = 'gym_chuot_custom_gyms_v1';

const rawEnvKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
export const GOOGLE_MAPS_API_KEY: string =
  rawEnvKey && rawEnvKey !== 'YOUR_API_KEY' ? rawEnvKey : '';

export const FALLBACK_GYM_LOCATIONS: GymLocationModel[] = [
  {
    placeId: 'place_cali_thanh_hoa',
    name: 'California Fitness & Yoga Thanh Hóa',
    address: 'TTTM Vincom Plaza, 27 Trần Phú, Điện Biên, TP. Thanh Hóa',
    city: 'Thanh Hóa',
    latitude: 19.8075,
    longitude: 105.7764,
    rating: 4.9,
    userRatingsTotal: 342,
    photoUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    activeMembers: 24,
    tags: ['Powerlifting', 'Sauna', 'Chuẩn Olympic'],
  },
  {
    placeId: 'place_strongman_gym',
    name: 'Strongman Gym & Powerlifting Club',
    address: '112 Đại lộ Lê Lợi, Phường Đông Hương, TP. Thanh Hóa',
    city: 'Thanh Hóa',
    latitude: 19.8032,
    longitude: 105.7891,
    rating: 4.8,
    userRatingsTotal: 198,
    photoUrl:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=80',
    activeMembers: 18,
    tags: ['Hardcore Iron', 'Deadlift Platform', 'Chalk Free'],
  },
  {
    placeId: 'place_olympia_thanh_hoa',
    name: 'Olympia Fitness & Barbell Center',
    address: '88 Nguyễn Trãi, Phường Ba Đình, TP. Thanh Hóa',
    city: 'Thanh Hóa',
    latitude: 19.8112,
    longitude: 105.7731,
    rating: 4.7,
    userRatingsTotal: 145,
    photoUrl:
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80',
    activeMembers: 15,
    tags: ['Hypertrophy', 'Dumbbells 60kg', '24/7'],
  },
  {
    placeId: 'place_swequity_hn',
    name: 'Swequity Ultimate Fitness (Lương Yên)',
    address: '1 Lương Yên, Bạch Đằng, Hai Bà Trưng, Hà Nội',
    city: 'Hà Nội',
    latitude: 21.0138,
    longitude: 105.8621,
    rating: 4.9,
    userRatingsTotal: 412,
    photoUrl:
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
    activeMembers: 39,
    tags: ['Strength Training', 'Rogue Racks', 'Coaching'],
  },
  {
    placeId: 'place_thehinhonline_hn',
    name: 'Iron Temple Barbell Club Cầu Giấy',
    address: '165 Cầu Giấy, Quan Hoa, Quận Cầu Giấy, Hà Nội',
    city: 'Hà Nội',
    latitude: 21.0331,
    longitude: 105.7985,
    rating: 4.8,
    userRatingsTotal: 276,
    photoUrl:
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80',
    activeMembers: 27,
    tags: ['Squat Racks', 'Calibrated Plates', 'Powerlifting'],
  },
  {
    placeId: 'place_citigym_hcmc',
    name: 'CitiGym Thành Thái',
    address: '52 Thành Thái, Phường 12, Quận 10, TP. Hồ Chí Minh',
    city: 'TP.HCM',
    latitude: 10.7712,
    longitude: 106.6664,
    rating: 4.8,
    userRatingsTotal: 520,
    photoUrl:
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&auto=format&fit=crop&q=80',
    activeMembers: 46,
    tags: ['Technogym', 'Khu Freeweight Rộng', 'InBody'],
  },
  {
    placeId: 'place_waystation_hcmc',
    name: 'The Waystation Garage & Barbell',
    address: '214 Nguyễn Trãi, Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh',
    city: 'TP.HCM',
    latitude: 10.7662,
    longitude: 106.6881,
    rating: 4.9,
    userRatingsTotal: 289,
    photoUrl:
      'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800&auto=format&fit=crop&q=80',
    activeMembers: 31,
    tags: ['SBD VietNam', 'Combo Rack', 'Deadlift'],
  },
  {
    placeId: 'place_elite_danang',
    name: 'HD Fitness & Strength Đà Nẵng',
    address: '20 Nguyễn Văn Linh, Hải Châu, TP. Đà Nẵng',
    city: 'Đà Nẵng',
    latitude: 16.0605,
    longitude: 108.2156,
    rating: 4.8,
    userRatingsTotal: 190,
    photoUrl:
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
    activeMembers: 21,
    tags: ['Sea View', 'Functional', 'Free Weights'],
  },
];

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Thanh Hóa': { lat: 19.8075, lng: 105.7764 },
  'Hà Nội': { lat: 21.0245, lng: 105.8312 },
  'TP.HCM': { lat: 10.7688, lng: 106.6772 },
  'Đà Nẵng': { lat: 16.0605, lng: 108.2156 },
};

export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistanceLabel(
  userLat: number,
  userLng: number,
  gymLat: number,
  gymLng: number
): string {
  const meters = calculateDistanceMeters(userLat, userLng, gymLat, gymLng);
  if (meters < 1000) {
    return `${Math.max(50, Math.round(meters))}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export class GooglePlacesService {
  /// Constructs the direct photo URL using Places API (New) or fallback image
  static getPlacePhotoUrl(photoReference: string, maxWidth = 800): string {
    if (!photoReference) {
      return FALLBACK_GYM_LOCATIONS[0].photoUrl;
    }
    if (
      photoReference.startsWith('http://') ||
      photoReference.startsWith('https://')
    ) {
      return photoReference;
    }
    if (!GOOGLE_MAPS_API_KEY) {
      return FALLBACK_GYM_LOCATIONS[0].photoUrl;
    }
    return `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=${maxWidth}&key=${encodeURIComponent(
      GOOGLE_MAPS_API_KEY
    )}&solution_id=gmp_mcp_codeassist_v1_aistudio`;
  }

  static getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve({ lat: 19.8075, lng: 105.7764 });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          resolve({ lat: 19.8075, lng: 105.7764 });
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
      );
    });
  }

  static getCustomGyms(): GymLocationModel[] {
    try {
      const raw = localStorage.getItem(CUSTOM_GYMS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  }

  static addCustomGym(params: {
    name: string;
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
  }): GymLocationModel {
    const baseCoords = CITY_COORDINATES[params.city] || {
      lat: 19.8075,
      lng: 105.7764,
    };
    const jitterLat = (Math.random() - 0.5) * 0.012;
    const jitterLng = (Math.random() - 0.5) * 0.012;

    const newGym: GymLocationModel = {
      placeId: `custom_gym_${Date.now()}`,
      name: params.name.trim(),
      address: params.address.trim(),
      city: params.city,
      latitude: params.latitude ?? Number((baseCoords.lat + jitterLat).toFixed(5)),
      longitude: params.longitude ?? Number((baseCoords.lng + jitterLng).toFixed(5)),
      rating: 5.0,
      userRatingsTotal: 1,
      photoUrl:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
      activeMembers: Math.floor(Math.random() * 15) + 5,
      tags: ['Cộng đồng Đi Tập Đê', 'Mới thêm'],
    };

    const currentCustom = GooglePlacesService.getCustomGyms();
    const updatedCustom = [newGym, ...currentCustom];
    try {
      localStorage.setItem(CUSTOM_GYMS_KEY, JSON.stringify(updatedCustom));
    } catch {
      // ignore
    }

    const allGyms = [...updatedCustom, ...FALLBACK_GYM_LOCATIONS];
    GooglePlacesService.cacheGyms(allGyms);
    return newGym;
  }

  /// Fetches nearby gyms using Places API (New) `Place.searchByText` when available,
  /// falling back to cached local gym list.
  static async fetchNearbyGyms(params: {
    lat: number;
    lng: number;
    radiusMeters?: number;
    placesLib?: any;
  }): Promise<GymLocationModel[]> {
    const { lat, lng, radiusMeters = 3000, placesLib } = params;

    if (placesLib?.Place?.searchByText) {
      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: 'phòng tập gym',
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'rating',
            'userRatingCount',
            'photos',
          ],
          includedType: 'gym',
          locationBias: {
            center: { lat, lng },
            radius: radiusMeters,
          },
          maxResultCount: 12,
          language: 'vi',
        });

        if (Array.isArray(places) && places.length > 0) {
          const mapped: GymLocationModel[] = places.map((p: any, idx: number) => {
            let photoUrl =
              FALLBACK_GYM_LOCATIONS[idx % FALLBACK_GYM_LOCATIONS.length]
                .photoUrl;
            if (p.photos && p.photos.length > 0 && typeof p.photos[0].getURI === 'function') {
              try {
                photoUrl = p.photos[0].getURI({ maxWidth: 800 });
              } catch {
                // fallback
              }
            }
            const placeLat =
              typeof p.location?.lat === 'function'
                ? p.location.lat()
                : Number(p.location?.lat) || lat;
            const placeLng =
              typeof p.location?.lng === 'function'
                ? p.location.lng()
                : Number(p.location?.lng) || lng;

            return {
              placeId: p.id || `gym_${idx}`,
              name: p.displayName || 'Phòng tập Gym',
              address: p.formattedAddress || 'Việt Nam',
              latitude: placeLat,
              longitude: placeLng,
              rating: Number(p.rating) || 4.8,
              userRatingsTotal: Number(p.userRatingCount) || 120,
              photoUrl,
              activeMembers: Math.floor(Math.random() * 25) + 10,
            };
          });

          GooglePlacesService.cacheGyms(mapped);
          return mapped;
        }
      } catch {
        // Fallback to cached local gyms below
      }
    }

    const allGyms = GooglePlacesService.getCachedOrFallbackGyms();
    return [...allGyms].sort((a, b) => {
      const distA = calculateDistanceMeters(lat, lng, a.latitude, a.longitude);
      const distB = calculateDistanceMeters(lat, lng, b.latitude, b.longitude);
      return distA - distB;
    });
  }

  static cacheGyms(gyms: GymLocationModel[]): void {
    try {
      localStorage.setItem(CACHED_GYMS_KEY, JSON.stringify(gyms));
    } catch {
      // ignore storage quota errors
    }
  }

  static getCachedOrFallbackGyms(): GymLocationModel[] {
    const customGyms = GooglePlacesService.getCustomGyms();
    const map = new Map<string, GymLocationModel>();
    customGyms.forEach((g) => map.set(g.placeId, g));
    FALLBACK_GYM_LOCATIONS.forEach((g) => {
      if (!map.has(g.placeId)) map.set(g.placeId, g);
    });
    return Array.from(map.values());
  }

  static loadSavedCheckIn(): GymLocationModel {
    try {
      const raw = localStorage.getItem(ACTIVE_CHECKIN_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.placeId && parsed.name) {
          return parsed as GymLocationModel;
        }
      }
    } catch {
      // ignore
    }
    return FALLBACK_GYM_LOCATIONS[0];
  }

  static saveCheckIn(gym: GymLocationModel): void {
    try {
      localStorage.setItem(ACTIVE_CHECKIN_KEY, JSON.stringify(gym));
    } catch {
      // ignore
    }
  }
}

// lib/services/google_places_service.dart
// Docs: https://developers.google.com/maps/documentation/places/web-service/op-overview?utm_campaign=gmp_mcp_codeassist_v1_aistudio

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/gym_location_model.dart';

class GooglePlacesService {
  static final GooglePlacesService _instance = GooglePlacesService._internal();
  factory GooglePlacesService() => _instance;
  GooglePlacesService._internal();

  /// Read API key from environment variables (--dart-define=GOOGLE_MAPS_API_KEY=...)
  static const String _apiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: '',
  );

  static const String _solutionAttributionId = 'gmp_mcp_codeassist_v1_aistudio';
  static const String _cachedGymsPrefsKey = 'gym_chuot_cached_nearby_gyms';

  /// Local fallback gyms when offline or Places API network fails
  static const List<GymLocationModel> _fallbackGyms = [
    GymLocationModel(
      placeId: 'place_cali_thanh_hoa',
      name: 'California Fitness & Yoga Thanh Hóa',
      address: 'TTTM Vincom Plaza, 27 Trần Phú, Điện Biên, TP. Thanh Hóa',
      latitude: 19.8075,
      longitude: 105.7764,
      rating: 4.9,
      userRatingsTotal: 342,
      photoUrl:
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    ),
    GymLocationModel(
      placeId: 'place_strongman_gym',
      name: 'Strongman Gym & Powerlifting Club',
      address: '112 Đại lộ Lê Lợi, Phường Đông Hương, TP. Thanh Hóa',
      latitude: 19.8032,
      longitude: 105.7891,
      rating: 4.8,
      userRatingsTotal: 198,
      photoUrl:
          'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=80',
    ),
    GymLocationModel(
      placeId: 'place_olympia_thanh_hoa',
      name: 'Olympia Fitness & Barbell Center',
      address: '88 Nguyễn Trãi, Phường Ba Đình, TP. Thanh Hóa',
      latitude: 19.8112,
      longitude: 105.7731,
      rating: 4.7,
      userRatingsTotal: 145,
      photoUrl:
          'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80',
    ),
    GymLocationModel(
      placeId: 'place_citigym_hcmc',
      name: 'CitiGym Thành Thái',
      address: '52 Thành Thái, Phường 12, Quận 10, TP. Hồ Chí Minh',
      latitude: 10.7712,
      longitude: 106.6664,
      rating: 4.8,
      userRatingsTotal: 520,
      photoUrl:
          'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&auto=format&fit=crop&q=80',
    ),
    GymLocationModel(
      placeId: 'place_swequity_hn',
      name: 'Swequity Ultimate Fitness',
      address: '1 Lương Yên, Bạch Đằng, Hai Bà Trưng, Hà Nội',
      latitude: 21.0138,
      longitude: 105.8621,
      rating: 4.9,
      userRatingsTotal: 412,
      photoUrl:
          'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
    ),
  ];

  /// 1. Uses `geolocator` to get the user's current Latitude & Longitude
  Future<Position> getCurrentLocation() async {
    final bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return _defaultPosition();
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return _defaultPosition();
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return _defaultPosition();
    }

    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 8),
        ),
      );
    } catch (e) {
      debugPrint('Geolocator fallback to default coordinates: $e');
      return _defaultPosition();
    }
  }

  Position _defaultPosition() {
    return Position(
      latitude: 19.8075,
      longitude: 105.7764,
      timestamp: DateTime.now(),
      accuracy: 15.0,
      altitude: 0.0,
      altitudeAccuracy: 0.0,
      heading: 0.0,
      headingAccuracy: 0.0,
      speed: 0.0,
      speedAccuracy: 0.0,
    );
  }

  /// 2. Constructs the direct Google Place Photo URL using Places API (New) media endpoint
  String getPlacePhotoUrl(String photoReference, {int maxWidth = 800}) {
    if (photoReference.isEmpty) {
      return _fallbackGyms.first.photoUrl;
    }
    if (photoReference.startsWith('http://') ||
        photoReference.startsWith('https://')) {
      return photoReference;
    }
    if (_apiKey.isEmpty) {
      return _fallbackGyms.first.photoUrl;
    }
    // Places API (New) photo resource name format: "places/{place_id}/photos/{photo_ref}"
    if (photoReference.startsWith('places/')) {
      return 'https://places.googleapis.com/v1/$photoReference/media'
          '?maxWidthPx=$maxWidth'
          '&key=$_apiKey'
          '&solution_id=$_solutionAttributionId';
    }
    return 'https://maps.googleapis.com/maps/api/place/photo'
        '?maxwidth=$maxWidth'
        '&photo_reference=${Uri.encodeComponent(photoReference)}'
        '&key=$_apiKey'
        '&solution_id=$_solutionAttributionId';
  }

  /// 3. Calls Google Places API (New) Text Search (`places:searchText`) for `phòng tập gym`
  ///    with `includedType: "gym"` and `locationBias`. Falls back to cached local gym list on error.
  Future<List<GymLocationModel>> fetchNearbyGyms({
    required double lat,
    required double lng,
    double radiusMeters = 3000,
  }) async {
    if (_apiKey.isEmpty) {
      return await _loadCachedOrFallbackGyms();
    }

    final Uri uri = Uri.parse(
      'https://places.googleapis.com/v1/places:searchText',
    );

    final Map<String, dynamic> requestBody = {
      'textQuery': 'phòng tập gym',
      'includedType': 'gym',
      'languageCode': 'vi',
      'maxResultCount': 15,
      'locationBias': {
        'circle': {
          'center': {
            'latitude': lat,
            'longitude': lng,
          },
          'radius': radiusMeters,
        },
      },
    };

    try {
      final response = await http
          .post(
            uri,
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': _apiKey,
              'X-Goog-FieldMask':
                  'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos',
              'X-Goog-Maps-Solution-ID': _solutionAttributionId,
            },
            body: jsonEncode(requestBody),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final Map<String, dynamic> body =
            jsonDecode(response.body) as Map<String, dynamic>;

        if (body['places'] is List) {
          final List<dynamic> placesList = body['places'] as List<dynamic>;
          final List<GymLocationModel> gyms = placesList.map((raw) {
            final map = Map<String, dynamic>.from(raw as Map);
            final displayName = map['displayName'] as Map<String, dynamic>?;
            final location = map['location'] as Map<String, dynamic>?;
            final photos = map['photos'] as List<dynamic>?;
            String photoUrl = _fallbackGyms.first.photoUrl;

            if (photos != null &&
                photos.isNotEmpty &&
                photos.first is Map &&
                (photos.first as Map)['name'] != null) {
              final String photoResourceName =
                  (photos.first as Map)['name'].toString();
              photoUrl = getPlacePhotoUrl(photoResourceName);
            }

            return GymLocationModel(
              placeId: (map['id'] as String?) ??
                  'gym_${DateTime.now().millisecondsSinceEpoch}',
              name: (displayName?['text'] as String?) ?? 'Phòng tập Gym',
              address: (map['formattedAddress'] as String?) ?? 'Việt Nam',
              latitude: (location?['latitude'] as num?)?.toDouble() ?? lat,
              longitude: (location?['longitude'] as num?)?.toDouble() ?? lng,
              rating: (map['rating'] as num?)?.toDouble() ?? 4.8,
              userRatingsTotal:
                  (map['userRatingCount'] as num?)?.toInt() ?? 120,
              photoUrl: photoUrl,
            );
          }).toList();

          if (gyms.isNotEmpty) {
            await _cacheGymsLocally(gyms);
            return gyms;
          }
        }
      }

      return await _loadCachedOrFallbackGyms();
    } catch (e) {
      debugPrint(
        'GooglePlacesService.fetchNearbyGyms error, using cached/fallback list: $e',
      );
      return await _loadCachedOrFallbackGyms();
    }
  }

  Future<void> _cacheGymsLocally(List<GymLocationModel> gyms) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encodedList = gyms.map((g) => jsonEncode(g.toJson())).toList();
      await prefs.setStringList(_cachedGymsPrefsKey, encodedList);
    } catch (e) {
      debugPrint('Error caching gyms locally: $e');
    }
  }

  Future<List<GymLocationModel>> _loadCachedOrFallbackGyms() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final rawList = prefs.getStringList(_cachedGymsPrefsKey);
      if (rawList != null && rawList.isNotEmpty) {
        return rawList
            .map(
              (item) => GymLocationModel.fromJson(
                jsonDecode(item) as Map<String, dynamic>,
              ),
            )
            .toList();
      }
    } catch (e) {
      debugPrint('Error reading cached gyms: $e');
    }
    return _fallbackGyms;
  }
}

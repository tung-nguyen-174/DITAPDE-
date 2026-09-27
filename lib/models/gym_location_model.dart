// lib/models/gym_location_model.dart

import 'dart:math' as math;

class GymLocationModel {
  final String placeId;
  final String name;
  final String address;
  final double latitude;
  final double longitude;
  final double rating;
  final int userRatingsTotal;
  final String photoUrl;

  const GymLocationModel({
    required this.placeId,
    required this.name,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.rating,
    required this.userRatingsTotal,
    required this.photoUrl,
  });

  Map<String, dynamic> toJson() => {
        'placeId': placeId,
        'name': name,
        'address': address,
        'latitude': latitude,
        'longitude': longitude,
        'rating': rating,
        'userRatingsTotal': userRatingsTotal,
        'photoUrl': photoUrl,
      };

  factory GymLocationModel.fromJson(Map<String, dynamic> json) {
    final displayNameMap = json['displayName'] as Map<String, dynamic>?;
    final locationMap = json['location'] as Map<String, dynamic>?;
    final geometryMap = json['geometry'] as Map<String, dynamic>?;
    final legacyLocMap = geometryMap?['location'] as Map<String, dynamic>?;

    return GymLocationModel(
      placeId: (json['placeId'] as String?) ??
          (json['id'] as String?) ??
          (json['place_id'] as String?) ??
          'gym_unknown',
      name: (json['name'] as String?) ??
          (displayNameMap?['text'] as String?) ??
          'Phòng tập Gym',
      address: (json['address'] as String?) ??
          (json['formattedAddress'] as String?) ??
          (json['vicinity'] as String?) ??
          (json['formatted_address'] as String?) ??
          'Việt Nam',
      latitude: ((json['latitude'] as num?) ??
              (locationMap?['latitude'] as num?) ??
              (legacyLocMap?['lat'] as num?) ??
              19.8075)
          .toDouble(),
      longitude: ((json['longitude'] as num?) ??
              (locationMap?['longitude'] as num?) ??
              (legacyLocMap?['lng'] as num?) ??
              105.7764)
          .toDouble(),
      rating: ((json['rating'] as num?) ?? 4.8).toDouble(),
      userRatingsTotal: ((json['userRatingsTotal'] as num?) ??
              (json['userRatingCount'] as num?) ??
              (json['user_ratings_total'] as num?) ??
              120)
          .toInt(),
      photoUrl: (json['photoUrl'] as String?) ??
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    );
  }

  /// Calculates straight-line Haversine distance in meters from [userLat], [userLng]
  double distanceFrom(double userLat, double userLng) {
    const double earthRadiusMeters = 6371000;
    final double dLat = _degToRad(latitude - userLat);
    final double dLng = _degToRad(longitude - userLng);

    final double a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_degToRad(userLat)) *
            math.cos(_degToRad(latitude)) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);
    final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  /// Formats distance as "450m" or "1.2km"
  String formattedDistanceFrom(double userLat, double userLng) {
    final double meters = distanceFrom(userLat, userLng);
    if (meters < 1000) {
      return '${math.max(50, meters.round())}m';
    }
    return '${(meters / 1000).toStringAsFixed(1)}km';
  }

  static double _degToRad(double deg) => deg * (math.pi / 180.0);
}

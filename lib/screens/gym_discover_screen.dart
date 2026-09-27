// lib/screens/gym_discover_screen.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../models/gym_location_model.dart';
import '../providers/check_in_provider.dart';
import '../services/google_places_service.dart';

class GymDiscoverScreen extends StatefulWidget {
  const GymDiscoverScreen({super.key});

  @override
  State<GymDiscoverScreen> createState() => _GymDiscoverScreenState();
}

class _GymDiscoverScreenState extends State<GymDiscoverScreen> {
  static const Color _primaryOrange = Color(0xFFFF5722);
  static const Color _surfaceDark = Color(0xFF121212);
  static const Color _cardDark = Color(0xFF1E1E1E);

  final GooglePlacesService _placesService = GooglePlacesService();
  final Completer<GoogleMapController> _mapController =
      Completer<GoogleMapController>();

  Position? _userPosition;
  List<GymLocationModel> _nearbyGyms = [];
  GymLocationModel? _selectedGym;
  bool _isLoading = true;

  /// Custom Dark Mode JSON theme for GoogleMap (#121212 Surface & #FF5722 accents)
  static const String _darkMapStyleJson = '''
[
  {
    "elementType": "geometry",
    "stylers": [{"color": "#121212"}]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{"visibility": "off"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#8E8E93"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#121212"}]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{"color": "#2C2C2E"}]
  },
  {
    "featureType": "poi.sports_complex",
    "elementType": "geometry",
    "stylers": [{"color": "#261814"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{"color": "#1F1F24"}]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{"color": "#28282E"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{"color": "#38241E"}]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#0A0A0D"}]
  }
]
''';

  @override
  void initState() {
    super.initState();
    _initLocationAndNearbyGyms();
  }

  Future<void> _initLocationAndNearbyGyms() async {
    setState(() => _isLoading = true);

    final position = await _placesService.getCurrentLocation();
    final gyms = await _placesService.fetchNearbyGyms(
      lat: position.latitude,
      lng: position.longitude,
      radiusMeters: 3000,
    );

    if (!mounted) return;
    setState(() {
      _userPosition = position;
      _nearbyGyms = gyms;
      _selectedGym = gyms.isNotEmpty ? gyms.first : null;
      _isLoading = false;
    });

    if (_mapController.isCompleted && gyms.isNotEmpty) {
      final controller = await _mapController.future;
      await controller.animateCamera(
        CameraUpdate.newLatLngZoom(
          LatLng(gyms.first.latitude, gyms.first.longitude),
          14.5,
        ),
      );
    }
  }

  Future<void> _selectGym(GymLocationModel gym) async {
    setState(() => _selectedGym = gym);
    if (_mapController.isCompleted) {
      final controller = await _mapController.future;
      await controller.animateCamera(
        CameraUpdate.newLatLngZoom(LatLng(gym.latitude, gym.longitude), 15.5),
      );
    }
  }

  Future<void> _handleCheckIn(GymLocationModel gym) async {
    await context.read<CheckInProvider>().checkIn(gym);
    await _selectGym(gym);

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('📍 Đã Check-in tại ${gym.name}!'),
        backgroundColor: _primaryOrange,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Set<Marker> _buildMarkers(GymLocationModel? activeCheckIn) {
    return _nearbyGyms.map((gym) {
      final bool isSelected = _selectedGym?.placeId == gym.placeId;
      final bool isCheckedIn = activeCheckIn?.placeId == gym.placeId;

      return Marker(
        markerId: MarkerId(gym.placeId),
        position: LatLng(gym.latitude, gym.longitude),
        icon: BitmapDescriptor.defaultMarkerWithHue(
          isCheckedIn || isSelected
              ? BitmapDescriptor.hueOrange
              : BitmapDescriptor.hueRed,
        ),
        infoWindow: InfoWindow(
          title: gym.name,
          snippet: '${gym.rating} ★ (${gym.userRatingsTotal}) • ${gym.address}',
          onTap: () => _handleCheckIn(gym),
        ),
        onTap: () => _selectGym(gym),
      );
    }).toSet();
  }

  @override
  Widget build(BuildContext context) {
    final checkInProvider = context.watch<CheckInProvider>();
    final activeCheckIn = checkInProvider.activeGymCheckIn;
    final double userLat = _userPosition?.latitude ?? 19.8075;
    final double userLng = _userPosition?.longitude ?? 105.7764;

    return Scaffold(
      backgroundColor: _surfaceDark,
      appBar: AppBar(
        backgroundColor: _surfaceDark,
        elevation: 0,
        title: const Text(
          'Khám Phá • Phòng Tập Gần Bạn',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
        actions: [
          IconButton(
            onPressed: _initLocationAndNearbyGyms,
            icon: const Icon(Icons.my_location, color: _primaryOrange),
            tooltip: 'Tìm quanh vị trí hiện tại',
          ),
        ],
      ),
      body: Stack(
        children: [
          // 1. TOP HALF: Interactive Google Map with custom dark mode JSON style
          Positioned.fill(
            child: GoogleMap(
              initialCameraPosition: CameraPosition(
                target: LatLng(userLat, userLng),
                zoom: 14.0,
              ),
              style: _darkMapStyleJson,
              myLocationEnabled: true,
              myLocationButtonEnabled: false,
              zoomControlsEnabled: false,
              mapToolbarEnabled: false,
              markers: _buildMarkers(activeCheckIn),
              onMapCreated: (GoogleMapController controller) {
                if (!_mapController.isCompleted) {
                  _mapController.complete(controller);
                }
              },
            ),
          ),

          // Active Check-in floating banner on top of the map
          if (activeCheckIn != null)
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: _cardDark.withOpacity(0.95),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: _primaryOrange, width: 1.2),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.location_on,
                        color: _primaryOrange, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Đang Check-in: ${activeCheckIn.name}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // 2. BOTTOM HALF: DraggableScrollableSheet listing nearby gym cards
          DraggableScrollableSheet(
            initialChildSize: 0.48,
            minChildSize: 0.28,
            maxChildSize: 0.86,
            builder: (context, scrollController) {
              return Container(
                decoration: const BoxDecoration(
                  color: _surfaceDark,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black54,
                      blurRadius: 16,
                      offset: Offset(0, -4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Drag Handle
                    Container(
                      margin: const EdgeInsets.only(top: 12, bottom: 8),
                      width: 44,
                      height: 5,
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Phòng tập quanh đây (${_nearbyGyms.length})',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const Text(
                            'Bán kính 3km',
                            style: TextStyle(
                              color: Colors.white54,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(color: Colors.white12, height: 1),
                    Expanded(
                      child: _isLoading
                          ? const Center(
                              child: CircularProgressIndicator(
                                color: _primaryOrange,
                              ),
                            )
                          : ListView.separated(
                              controller: scrollController,
                              padding: const EdgeInsets.all(16),
                              itemCount: _nearbyGyms.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 16),
                              itemBuilder: (context, index) {
                                final gym = _nearbyGyms[index];
                                final bool isSelected =
                                    _selectedGym?.placeId == gym.placeId;
                                final bool isCheckedIn =
                                    activeCheckIn?.placeId == gym.placeId;
                                final String distanceLabel =
                                    gym.formattedDistanceFrom(userLat, userLng);

                                return GestureDetector(
                                  onTap: () => _selectGym(gym),
                                  child: Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: _cardDark,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: isCheckedIn || isSelected
                                            ? _primaryOrange
                                            : Colors.white12,
                                        width:
                                            isCheckedIn || isSelected ? 1.5 : 1,
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            // Place Photo Thumbnail
                                            ClipRRect(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              child: Image.network(
                                                gym.photoUrl,
                                                width: 84,
                                                height: 84,
                                                fit: BoxFit.cover,
                                                errorBuilder: (_, __, ___) =>
                                                    Container(
                                                  width: 84,
                                                  height: 84,
                                                  color: Colors.white10,
                                                  child: const Icon(
                                                    Icons.fitness_center,
                                                    color: _primaryOrange,
                                                  ),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 16),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    gym.name,
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      fontSize: 16,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 6),
                                                  Text(
                                                    gym.address,
                                                    maxLines: 2,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    style: const TextStyle(
                                                      color: Colors.white60,
                                                      fontSize: 12,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 8),
                                                  Row(
                                                    children: [
                                                      // Rating Star Badge: "4.8 ★ (120)"
                                                      Container(
                                                        padding:
                                                            const EdgeInsets
                                                                .symmetric(
                                                          horizontal: 8,
                                                          vertical: 4,
                                                        ),
                                                        decoration:
                                                            BoxDecoration(
                                                          color: Colors.amber
                                                              .withOpacity(
                                                                  0.15),
                                                          borderRadius:
                                                              BorderRadius
                                                                  .circular(8),
                                                        ),
                                                        child: Text(
                                                          '${gym.rating.toStringAsFixed(1)} ★ (${gym.userRatingsTotal})',
                                                          style:
                                                              const TextStyle(
                                                            color: Colors.amber,
                                                            fontWeight:
                                                                FontWeight.bold,
                                                            fontSize: 12,
                                                          ),
                                                        ),
                                                      ),
                                                      const SizedBox(width: 8),
                                                      // Distance Badge: "450m"
                                                      Container(
                                                        padding:
                                                            const EdgeInsets
                                                                .symmetric(
                                                          horizontal: 8,
                                                          vertical: 4,
                                                        ),
                                                        decoration:
                                                            BoxDecoration(
                                                          color: Colors.white10,
                                                          borderRadius:
                                                              BorderRadius
                                                                  .circular(8),
                                                        ),
                                                        child: Text(
                                                          distanceLabel,
                                                          style:
                                                              const TextStyle(
                                                            color:
                                                                Colors.white70,
                                                            fontWeight:
                                                                FontWeight.w600,
                                                            fontSize: 12,
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 16),
                                        // Primary Orange CTA Button: "Check-in Tại Đây"
                                        SizedBox(
                                          width: double.infinity,
                                          height: 48,
                                          child: ElevatedButton.icon(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: isCheckedIn
                                                  ? const Color(0xFF2E7D32)
                                                  : _primaryOrange,
                                              foregroundColor: Colors.white,
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(12),
                                              ),
                                            ),
                                            onPressed: () =>
                                                _handleCheckIn(gym),
                                            icon: Icon(
                                              isCheckedIn
                                                  ? Icons.check_circle
                                                  : Icons.place,
                                              size: 18,
                                            ),
                                            label: Text(
                                              isCheckedIn
                                                  ? 'Đã Check-in Tại Đây'
                                                  : 'Check-in Tại Đây',
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

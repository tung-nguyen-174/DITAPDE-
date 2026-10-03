// lib/screens/profile_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/gym_location_model.dart';
import '../providers/check_in_provider.dart';
import '../widgets/muscle_heatmap.dart';
import 'gym_discover_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  static const Color _primaryOrange = Color(0xFFFF5722);
  static const Color _surfaceDark = Color(0xFF121212);
  static const Color _cardDark = Color(0xFF1E1E1E);

  @override
  Widget build(BuildContext context) {
    final GymLocationModel? activeGym =
        context.watch<CheckInProvider>().activeGymCheckIn;

    return Scaffold(
      backgroundColor: _surfaceDark,
      appBar: AppBar(
        backgroundColor: _surfaceDark,
        elevation: 0,
        title: const Text(
          'Hồ Sơ Cá Nhân',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // User Identity Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _cardDark,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white12),
            ),
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 30,
                  backgroundColor: _primaryOrange,
                  child: Text(
                    'LA',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Long Aura (PT Pro)',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        activeGym != null
                            ? '📍 ${activeGym.name}'
                            : 'Chưa Check-in phòng tập',
                        style: const TextStyle(
                          color: _primaryOrange,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // "Phòng Tập Hiện Tại" Card displaying checked-in gym photo, name, and address
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _cardDark,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: activeGym != null ? _primaryOrange : Colors.white12,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.location_on,
                            color: _primaryOrange, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Phòng Tập Hiện Tại',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const GymDiscoverScreen(),
                          ),
                        );
                      },
                      child: const Text(
                        'Đổi phòng tập',
                        style: TextStyle(
                          color: _primaryOrange,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (activeGym != null)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          activeGym.photoUrl,
                          width: 88,
                          height: 88,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 88,
                            height: 88,
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
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              activeGym.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              activeGym.address,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${activeGym.rating.toStringAsFixed(1)} ★ (${activeGym.userRatingsTotal} đánh giá)',
                              style: const TextStyle(
                                color: Colors.amber,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  )
                else
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      'Bạn chưa Check-in phòng tập nào. Hãy mở tab Khám Phá để Check-in phòng tập gần bạn!',
                      style: TextStyle(color: Colors.white60, fontSize: 13),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 30-Day Muscle Heatmap Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _cardDark,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white12),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bản đồ nhiệt cơ bắp (30 ngày)',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 12),
                Center(
                  child: MuscleHeatmap(
                    width: 240,
                    height: 220,
                    setVolumeMap: {
                      MuscleGroup.chest: 14,
                      MuscleGroup.lats: 12,
                      MuscleGroup.upperBack: 8,
                      MuscleGroup.lowerBack: 6,
                      MuscleGroup.quads: 11,
                      MuscleGroup.hamstrings: 9,
                      MuscleGroup.glutes: 8,
                      MuscleGroup.calves: 4,
                      MuscleGroup.frontDelts: 8,
                      MuscleGroup.sideDelts: 7,
                      MuscleGroup.triceps: 10,
                      MuscleGroup.biceps: 6,
                      MuscleGroup.abs: 6,
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

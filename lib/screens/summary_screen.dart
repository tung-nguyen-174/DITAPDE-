// lib/screens/summary_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/check_in_provider.dart';
import '../widgets/flex_story_modal.dart';

class SummaryScreen extends StatefulWidget {
  final String workoutTitle;
  final int totalVolumeKg;
  final int totalSets;
  final int durationMinutes;

  const SummaryScreen({
    super.key,
    this.workoutTitle = 'Upper Body Hypertrophy & PR Push Day',
    this.totalVolumeKg = 6850,
    this.totalSets = 14,
    this.durationMinutes = 58,
  });

  @override
  State<SummaryScreen> createState() => _SummaryScreenState();
}

class _SummaryScreenState extends State<SummaryScreen> {
  static const Color _primaryOrange = Color(0xFFFF5722);
  static const Color _surfaceDark = Color(0xFF121212);
  static const Color _cardDark = Color(0xFF1E1E1E);

  late TextEditingController _locationController;
  final TextEditingController _captionController = TextEditingController(
    text: 'Buổi tập hôm nay quá đã! Anh em cùng phòng tập điểm danh đê!',
  );

  @override
  void initState() {
    super.initState();
    final activeGymName =
        context.read<CheckInProvider>().activeGymCheckIn?.name ??
            'California Fitness & Yoga Thanh Hóa';
    _locationController = TextEditingController(text: activeGymName);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final activeGym = context.watch<CheckInProvider>().activeGymCheckIn;
    if (activeGym != null && _locationController.text != activeGym.name) {
      _locationController.text = activeGym.name;
    }
  }

  @override
  void dispose() {
    _locationController.dispose();
    _captionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activeGym = context.watch<CheckInProvider>().activeGymCheckIn;

    return Scaffold(
      backgroundColor: _surfaceDark,
      appBar: AppBar(
        backgroundColor: _surfaceDark,
        elevation: 0,
        title: const Text(
          'Tổng Kết Buổi Tập',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Workout Metrics Summary Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _cardDark,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.workoutTitle,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildStatItem('Tổng Tải', '${widget.totalVolumeKg} kg'),
                    _buildStatItem('Số Hiệp', '${widget.totalSets} sets'),
                    _buildStatItem('Thời Gian', '${widget.durationMinutes} phút'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Auto-filled Gym Location Field from CheckInProvider
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _cardDark,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.location_on,
                        color: _primaryOrange, size: 18),
                    const SizedBox(width: 8),
                    const Text(
                      'Địa điểm Phòng Tập (Tự động điền từ Check-in)',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _locationController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: _surfaceDark,
                    prefixIcon: const Icon(
                      Icons.fitness_center,
                      color: _primaryOrange,
                    ),
                    hintText: 'Chọn hoặc Check-in phòng tập...',
                    hintStyle: const TextStyle(color: Colors.white38),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Colors.white24),
                    ),
                  ),
                ),
                if (activeGym != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    '📍 Đã đồng bộ từ Check-in: ${activeGym.address}',
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Caption Input
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _cardDark,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white12),
            ),
            child: TextField(
              controller: _captionController,
              maxLines: 3,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                border: InputBorder.none,
                hintText: 'Chia sẻ cảm nghĩ buổi tập hôm nay...',
                hintStyle: TextStyle(color: Colors.white38),
              ),
            ),
          ),
          const SizedBox(height: 24),

          SizedBox(
            height: 52,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF5722),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.auto_awesome, color: Colors.white),
              label: const Text(
                'Xuất Story Flex 🔥',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
              ),
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (_) => FlexStoryModal(
                    gymLocation: _locationController.text.isNotEmpty
                        ? _locationController.text
                        : '📍 Strongman Gym',
                    workoutTitle: widget.workoutTitle,
                    totalVolumeKg: widget.totalVolumeKg,
                    totalSets: widget.totalSets,
                    durationFormatted:
                        '00:${widget.durationMinutes.toString().padLeft(2, '0')}:00',
                    prBadgeText: 'NEW PR: Squat 140kg × 3 reps!',
                    muscleSetCounts: {
                      'Ngực': (widget.totalSets * 0.4).round(),
                      'Lưng': (widget.totalSets * 0.35).round(),
                      'Vai & Tay': widget.totalSets -
                          (widget.totalSets * 0.4).round() -
                          (widget.totalSets * 0.35).round(),
                    },
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),

          SizedBox(
            height: 52,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryOrange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Đã đăng buổi tập tại ${_locationController.text}!',
                    ),
                    backgroundColor: _primaryOrange,
                  ),
                );
              },
              icon: const Icon(Icons.share),
              label: const Text(
                'Đăng Bảng Tin',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.white54, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: _primaryOrange,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

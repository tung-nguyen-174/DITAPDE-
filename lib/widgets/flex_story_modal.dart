// lib/widgets/flex_story_modal.dart

import 'dart:io';
import 'package:flutter/material.dart';
import '../services/flex_story_service.dart';
import 'flex_story_card.dart';

class FlexStoryModal extends StatefulWidget {
  final String userName;
  final String userHandle;
  final String gymLocation;
  final String workoutTitle;
  final int totalVolumeKg;
  final int totalSets;
  final String durationFormatted;
  final String prBadgeText;
  final Map<String, int> muscleSetCounts;
  final File? backgroundMediaFile;

  const FlexStoryModal({
    super.key,
    this.userName = 'Tùng Nguyễn',
    this.userHandle = 'tung_powerbuilder',
    this.gymLocation = '📍 Strongman Gym',
    required this.workoutTitle,
    required this.totalVolumeKg,
    required this.totalSets,
    required this.durationFormatted,
    required this.prBadgeText,
    required this.muscleSetCounts,
    this.backgroundMediaFile,
  });

  @override
  State<FlexStoryModal> createState() => _FlexStoryModalState();
}

class _FlexStoryModalState extends State<FlexStoryModal> {
  final GlobalKey _boundaryKey = GlobalKey();
  bool _isExporting = false;

  final List<String> _presetTaglines = [
    'Tập xong không hỏng giò - Không về! 🦵',
    'Đói tạ hơn đái dầm! 🔥',
    'Mệt nhưng mà nó sướng! 💪',
    'Nói ít thôi, nâng tạ đi! 🤐',
    'Thà đau cơ còn hơn đau lòng! ❤️🩹',
  ];

  late String _selectedTagline;
  final TextEditingController _customTaglineController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _selectedTagline = _presetTaglines[0];
  }

  void _exportStory() async {
    setState(() => _isExporting = true);

    bool success = await FlexStoryService.captureAndShareStory(_boundaryKey);

    if (mounted) {
      setState(() => _isExporting = false);
      if (success) {
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Lỗi khi tạo Story. Vui lòng thử lại!'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white10),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Xuất Story Flex 🔥',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Captured RepaintBoundary Component
              RepaintBoundary(
                key: _boundaryKey,
                child: FlexStoryCard(
                  userName: widget.userName,
                  userHandle: widget.userHandle,
                  gymLocation: widget.gymLocation,
                  workoutTitle: widget.workoutTitle,
                  totalVolumeKg: widget.totalVolumeKg,
                  totalSets: widget.totalSets,
                  durationFormatted: widget.durationFormatted,
                  prBadgeText: widget.prBadgeText,
                  muscleSetCounts: widget.muscleSetCounts,
                  selectedTagline: _selectedTagline,
                  backgroundMediaFile: widget.backgroundMediaFile,
                ),
              ),
              const SizedBox(height: 16),

              // Tagline Selector Carousel / List
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('CHỌN QUOTE FLEX:', style: TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 38,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _presetTaglines.length,
                  itemBuilder: (ctx, idx) {
                    final tag = _presetTaglines[idx];
                    final isSelected = tag == _selectedTagline;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(tag),
                        selected: isSelected,
                        selectedColor: const Color(0xFFFF5722),
                        backgroundColor: const Color(0xFF2C2C2C),
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : Colors.white70,
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                        onSelected: (_) {
                          setState(() => _selectedTagline = tag);
                        },
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),

              // Custom Tagline Input
              TextField(
                controller: _customTaglineController,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Hoặc tự điền quote riêng của bạn...',
                  hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
                  filled: true,
                  fillColor: const Color(0xFF121212),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.check_circle, color: Color(0xFFFF5722)),
                    onPressed: () {
                      if (_customTaglineController.text.trim().isNotEmpty) {
                        setState(() => _selectedTagline = _customTaglineController.text.trim());
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Export Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF5722),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _isExporting ? null : _exportStory,
                  icon: _isExporting
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.share_rounded, color: Colors.white),
                  label: Text(
                    _isExporting ? 'Đang Tạo Story...' : 'Chia Sẻ Lên Story',
                    style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

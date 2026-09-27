// lib/widgets/feed_card.dart

import 'package:flutter/material.dart';
import '../controllers/daps_controller.dart';
import '../services/nudge_service.dart';
import '../services/routine_fork_service.dart';

class FeedCard extends StatefulWidget {
  final String postId;
  final String userId;
  final String userName;
  final String userAvatarUrl;
  final String workoutTitle;
  final int totalVolumeKg;
  final int initialDapsCount;
  final RoutineModel routineData;

  const FeedCard({
    super.key,
    required this.postId,
    required this.userId,
    required this.userName,
    required this.userAvatarUrl,
    required this.workoutTitle,
    required this.totalVolumeKg,
    required this.initialDapsCount,
    required this.routineData,
  });

  @override
  State<FeedCard> createState() => _FeedCardState();
}

class _FeedCardState extends State<FeedCard> {
  late DapsController _dapsController;

  @override
  void initState() {
    super.initState();
    _dapsController = DapsController(
      postId: widget.postId,
      initialDapsCount: widget.initialDapsCount,
    );
  }

  @override
  void dispose() {
    _dapsController.dispose();
    super.dispose();
  }

  void _triggerNudge() async {
    bool success = await NudgeService().sendDitapdeNudge(
      senderId: 'current_user_123',
      senderName: 'Tùng Nguyễn',
      targetUserId: widget.userId,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success
                ? 'Đã réo "${widget.userName}" Đi Tập Đê! 🔥'
                : 'Không thể gửi thông báo tới ${widget.userName}',
          ),
          backgroundColor:
              success ? const Color(0xFFFF5722) : Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _forkRoutine() async {
    bool success = await RoutineForkService.forkRoutine(widget.routineData);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success
                ? 'Đã lưu giáo án của ${widget.userName} vào Lịch Tập! 📋'
                : 'Lỗi khi lưu giáo án',
          ),
          backgroundColor:
              success ? Colors.greenAccent : Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xFF1E1E1E),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Colors.white10),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Header
            Row(
              children: [
                GestureDetector(
                  onTap: _triggerNudge,
                  child: CircleAvatar(
                    backgroundColor: const Color(0xFFFF5722),
                    child: Text(
                      widget.userName[0],
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.userName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      const Text(
                        'Vừa xong • Strongman Gym',
                        style: TextStyle(color: Colors.white38, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                // "Đi tập đê!" Nudge Button
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFFF5722)),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  onPressed: _triggerNudge,
                  icon: const Icon(Icons.bolt,
                      color: Color(0xFFFF5722), size: 16),
                  label: const Text(
                    'Đi tập đê!',
                    style: TextStyle(
                      color: Color(0xFFFF5722),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Workout Content
            Text(
              widget.workoutTitle,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Tổng Khối Lượng: ${widget.totalVolumeKg} kg',
              style: const TextStyle(
                color: Color(0xFFFF5722),
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            // Actions Strip
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Optimistic Daps Button
                AnimatedBuilder(
                  animation: _dapsController,
                  builder: (context, _) {
                    return ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2C2C2C),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: _dapsController.addDap,
                      icon: const Text('💪', style: TextStyle(fontSize: 16)),
                      label: Text(
                        'Daps (${_dapsController.dapsCount})',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    );
                  },
                ),

                // 1-Tap Fork Routine Button
                IconButton.filledTonal(
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFF2C2C2C),
                  ),
                  onPressed: _forkRoutine,
                  icon: const Icon(Icons.alt_route_rounded,
                      color: Colors.white70),
                  tooltip: 'Fork Giáo Án',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

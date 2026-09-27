import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../widgets/feed_card.dart';
import '../widgets/nudge_modal.dart';
import '../services/database_service.dart';
import '../providers/check_in_provider.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final DatabaseService _databaseService = DatabaseService();

  @override
  Widget build(BuildContext context) {
    final activeGym = context.watch<CheckInProvider>().activeGymCheckIn;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: GymChuotTheme.chalkOrange,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'ĐI TẬP ĐÊ!',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF5722).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFFF5722).withOpacity(0.4),
                  ),
                ),
                child: Text(
                  '📍 ${activeGym?.name ?? "California Fitness"}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFFFF5722),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.bell, size: 20),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          _buildRealtimeBuddiesStrip(context),
          Expanded(
            child: StreamBuilder<List<FeedPostModel>>(
              stream: _databaseService.streamFeedPosts(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: CircularProgressIndicator(
                      color: GymChuotTheme.chalkOrange,
                    ),
                  );
                }

                if (snapshot.hasError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'Không thể tải bảng tin: ${snapshot.error}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: GymChuotTheme.mutedSilver,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  );
                }

                final posts = snapshot.data ?? const [];
                if (posts.isEmpty) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'Chưa có bài đăng nào trên bảng tin Firestore.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: GymChuotTheme.mutedSilver,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.only(top: 8, bottom: 96),
                  itemCount: posts.length,
                  itemBuilder: (context, index) {
                    final post = posts[index];
                    return FeedCard(
                      postId: post.id,
                      userId: post.userId,
                      userName: post.userName,
                      userAvatarUrl: post.userAvatar,
                      workoutTitle: post.title,
                      totalVolumeKg: post.totalTonnageKg,
                      initialDapsCount: post.dapsCount,
                      routineData: post.routineData,
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRealtimeBuddiesStrip(BuildContext context) {
    return StreamBuilder<List<GymBuddyModel>>(
      stream: _databaseService.streamGymBuddies(),
      builder: (context, snapshot) {
        final buddies = snapshot.data ?? const [];
        if (buddies.isEmpty) {
          return const SizedBox.shrink();
        }

        return Container(
          height: 110,
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: const BoxDecoration(
            color: GymChuotTheme.steelGray,
            border: Border(bottom: BorderSide(color: Color(0xFF2E2E36))),
          ),
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: buddies.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (ctx, i) {
              final b = buddies[i];
              final initials = b.name.length >= 2
                  ? b.name.substring(0, 2).toUpperCase()
                  : b.name.toUpperCase();
              return GestureDetector(
                onTap: () => showModalBottomSheet(
                  context: context,
                  backgroundColor: Colors.transparent,
                  builder: (c) => NudgeModal(buddyName: b.name),
                ),
                child: Column(
                  children: [
                    Stack(
                      children: [
                        CircleAvatar(
                          radius: 26,
                          backgroundColor: GymChuotTheme.chalkOrange,
                          child: CircleAvatar(
                            radius: 24,
                            backgroundColor: const Color(0xFF26262B),
                            child: Text(
                              initials,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                        if (b.isOnline)
                          Positioned(
                            right: 0,
                            bottom: 0,
                            child: Container(
                              width: 14,
                              height: 14,
                              decoration: BoxDecoration(
                                color: GymChuotTheme.successGreen,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: GymChuotTheme.ironBlack,
                                  width: 2,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      b.name,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      b.statusText,
                      style: const TextStyle(
                        fontSize: 9,
                        color: GymChuotTheme.mutedSilver,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}

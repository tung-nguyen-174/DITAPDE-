// lib/widgets/flex_story_card.dart

import 'dart:io';
import 'package:flutter/material.dart';

class FlexStoryCard extends StatelessWidget {
  final String userName;
  final String userHandle;
  final String gymLocation;
  final String workoutTitle;
  final int totalVolumeKg;
  final int totalSets;
  final String durationFormatted;
  final String prBadgeText;
  final Map<String, int> muscleSetCounts;
  final String selectedTagline;
  final File? backgroundMediaFile;

  const FlexStoryCard({
    super.key,
    required this.userName,
    required this.userHandle,
    required this.gymLocation,
    required this.workoutTitle,
    required this.totalVolumeKg,
    required this.totalSets,
    required this.durationFormatted,
    required this.prBadgeText,
    required this.muscleSetCounts,
    required this.selectedTagline,
    this.backgroundMediaFile,
  });

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 9 / 16,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF121212),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: const Color(0xFFFF5722).withOpacity(0.5),
              width: 2,
            ),
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // 1. Full-Bleed Background Media with Contrast Scrims
              _buildBackgroundMediaLayer(),

              // 2. Strava-Style Telemetry & "Đi tập đê!" Branding Overlay
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Top Bar: Prominent "Đi tập đê!" Branding + Gym Badge
                    _buildBrandedHeader(),

                    const Spacer(),

                    // Middle Section: Notable PR Badge + Title
                    if (prBadgeText.isNotEmpty) _buildPrFloatingBadge(),

                    Text(
                      workoutTitle,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        height: 1.15,
                        shadows: [
                          Shadow(
                            color: Colors.black,
                            offset: Offset(0, 2),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),

                    // Custom Quote / Tagline
                    Text(
                      '“$selectedTagline”',
                      style: const TextStyle(
                        color: Color(0xFFFF5722),
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        fontStyle: FontStyle.italic,
                        shadows: [
                          Shadow(
                            color: Colors.black,
                            offset: Offset(0, 1),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Bottom Bar: Floating Translucent Telemetry Card
                    _buildTelemetryCard(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 1. BACKGROUND MEDIA LAYER WITH STRAVA GRADIENT SCRIMS
  // ---------------------------------------------------------------------------
  Widget _buildBackgroundMediaLayer() {
    if (backgroundMediaFile == null) {
      return Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1E1E1E), Color(0xFF121212), Color(0xFF0A0A0A)],
          ),
        ),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        // Background photo auto-cropped to fill 9:16 canvas
        Image.file(
          backgroundMediaFile!,
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
        ),

        // 35% Darkness tint
        Container(color: Colors.black.withOpacity(0.35)),

        // Top & Bottom gradient scrims for text legibility over bright photos
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.80),
                Colors.transparent,
                Colors.black.withOpacity(0.90),
              ],
              stops: const [0.0, 0.40, 1.0],
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // 2. PROMINENT "ĐI TẬP ĐÊ!" BRAND HEADER
  // ---------------------------------------------------------------------------
  Widget _buildBrandedHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            // Official Coral-to-Orange Gradient Squircle Icon
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFF25438), Color(0xFFFF5722)],
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFFF5722).withOpacity(0.4),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.fitness_center_rounded,
                color: Color(0xFF121212),
                size: 24,
              ),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ĐI TẬP ĐÊ!',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
                Text(
                  'COMMUNITY WORKOUT LOG',
                  style: TextStyle(
                    color: Color(0xFFFF5722),
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
              ],
            ),
          ],
        ),

        // Gym Location Pill
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.60),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white24),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.location_on_rounded,
                color: Color(0xFFFF5722),
                size: 12,
              ),
              const SizedBox(width: 4),
              Text(
                gymLocation,
                style: const TextStyle(
                  color: Colors.white87,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // 3. NOTABLE PR BADGE
  // ---------------------------------------------------------------------------
  Widget _buildPrFloatingBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFF5722),
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF5722).withOpacity(0.5),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('⚡ ', style: TextStyle(fontSize: 14)),
          Text(
            prBadgeText.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  String _formatVolume(int volume) {
    final digits = volume.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) {
        buffer.write(',');
      }
      buffer.write(digits[i]);
    }
    return buffer.toString();
  }

  // ---------------------------------------------------------------------------
  // 4. FLOATING TELEMETRY MATRIX CARD
  // ---------------------------------------------------------------------------
  Widget _buildTelemetryCard() {
    final int resolvedTotalSets = totalSets > 0
        ? totalSets
        : muscleSetCounts.values.fold<int>(0, (sum, count) => sum + count);
    final int resolvedVolumeKg = totalVolumeKg >= 0 ? totalVolumeKg : 0;
    final activeMuscles = muscleSetCounts.entries
        .where((entry) => entry.value > 0)
        .map((entry) => '${entry.key} (${entry.value})')
        .toList();
    final muscleSummaryText = activeMuscles.isNotEmpty
        ? activeMuscles.join(' • ')
        : muscleSetCounts.keys.join(' • ');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.60),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStravaMetric(
                'KHỐI LƯỢNG',
                _formatVolume(resolvedVolumeKg),
                'KG',
              ),
              _buildDivider(),
              _buildStravaMetric('THỜI GIAN', durationFormatted, ''),
              _buildDivider(),
              _buildStravaMetric('SỐ SET', '$resolvedTotalSets', 'SETS'),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: Colors.white12, height: 1),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(
                      Icons.fitness_center_rounded,
                      color: Color(0xFFFF5722),
                      size: 14,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        muscleSummaryText,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white87,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '@$userHandle',
                style: const TextStyle(color: Colors.white54, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStravaMetric(String label, String value, String unit) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 8,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 2),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            if (unit.isNotEmpty) ...[
              const SizedBox(width: 2),
              Text(
                unit,
                style: const TextStyle(
                  color: Color(0xFFFF5722),
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(height: 24, width: 1, color: Colors.white12);
  }
}

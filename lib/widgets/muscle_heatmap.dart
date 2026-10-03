// lib/widgets/muscle_heatmap.dart

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_svg/flutter_svg.dart';
import '../models/exercise_model.dart';

export '../models/exercise_model.dart' show MuscleGroup;

/// Dynamic Vector Heatmap Component (`flutter_svg`) aligned with `assets/data/exercises.json`.
///
/// Takes a `Map<MuscleGroup, int>` working set-volume map and dynamically updates
/// the `fill` attributes of matching SVG `<path id="...">` elements using the
/// 4-tier color interpolation scale:
/// - 0 Sets:   `#334155` (Slate-700 / Inactive)
/// - 1–3 Sets: `#FBBF24` (Amber-400 / Light Activation)
/// - 4–6 Sets: `#FB923C` (Orange-400 / Moderate Fatigue)
/// - 7+ Sets:  `#EF4444` (Red-500 / High Fatigue / Aura Peak)
class MuscleHeatmap extends StatelessWidget {
  final Map<MuscleGroup, int> setVolumeMap;
  final double height;
  final double width;

  const MuscleHeatmap({
    super.key,
    required this.setVolumeMap,
    this.height = 300,
    this.width = 220,
  });

  static const String inactiveHex = '#334155'; // 0 Sets (Slate-700)
  static const String lightHex = '#FBBF24';    // 1-3 Sets (Amber-400)
  static const String moderateHex = '#FB923C'; // 4-6 Sets (Orange-400)
  static const String highHex = '#EF4444';     // 7+ Sets (Red-500)

  /// 1. Color Interpolation Logic (4 distinct visual tiers based on working set count)
  static String getColorHexForVolume(int sets) {
    if (sets <= 0) return inactiveHex; // #334155 (Slate-700 / Inactive)
    if (sets <= 3) return lightHex;    // #FBBF24 (Amber-400 / Light Activation)
    if (sets <= 6) return moderateHex; // #FB923C (Orange-400 / Moderate Fatigue)
    return highHex;                    // #EF4444 (Red-500 / High Fatigue)
  }

  /// Builds a `Map<MuscleGroup, int>` directly from logged exercise names & working set counts
  /// by matching `primaryMuscles` and `secondaryMuscles` from `assets/data/exercises.json`.
  static Future<Map<MuscleGroup, int>> buildVolumeMapFromExercisesJson({
    required Map<String, int> completedSetsByExerciseName,
    String assetPath = 'assets/data/exercises.json',
  }) async {
    final rawJsonStr = await rootBundle.loadString(assetPath);
    final decoded = jsonDecode(rawJsonStr) as Map<String, dynamic>;
    final rawList = (decoded['exercises'] as List<dynamic>? ?? []);

    final Map<String, Map<String, dynamic>> catalogByName = {};
    for (final item in rawList) {
      if (item is Map<String, dynamic>) {
        final name = (item['name'] as String? ?? '').toLowerCase().trim();
        if (name.isNotEmpty) {
          catalogByName[name] = item;
        }
      }
    }

    final Map<MuscleGroup, double> accumulator = {};

    completedSetsByExerciseName.forEach((exerciseName, completedSets) {
      if (completedSets <= 0) return;
      final match = catalogByName[exerciseName.toLowerCase().trim()];
      if (match != null) {
        final primaries = (match['primaryMuscles'] as List<dynamic>? ?? []);
        final secondaries = (match['secondaryMuscles'] as List<dynamic>? ?? []);

        for (final p in primaries) {
          final group = MuscleGroup.fromJsonMuscleName(p.toString());
          accumulator[group] = (accumulator[group] ?? 0) + completedSets;
          if (group == MuscleGroup.abductors) {
            accumulator[MuscleGroup.adductors] =
                (accumulator[MuscleGroup.adductors] ?? 0) + completedSets;
          }
          // In exercises.json, "shoulders" activates both frontDelts and sideDelts
          if (p.toString().toLowerCase() == 'shoulders') {
            accumulator[MuscleGroup.sideDelts] =
                (accumulator[MuscleGroup.sideDelts] ?? 0) + (completedSets * 0.5);
          }
        }
        for (final s in secondaries) {
          final group = MuscleGroup.fromJsonMuscleName(s.toString());
          accumulator[group] = (accumulator[group] ?? 0) + (completedSets * 0.5);
        }
      }
    });

    return accumulator.map((key, value) => MapEntry(key, value.round()));
  }

  /// 2. Dynamically injects or replaces `fill="<hexColor>"` on SVG `<path id="...">` elements
  String _injectDynamicFills(String rawSvg) {
    String modifiedSvg = rawSvg;

    for (final muscle in MuscleGroup.values) {
      int volume = setVolumeMap[muscle] ?? 0;
      if (muscle == MuscleGroup.adductors && volume == 0) {
        volume = setVolumeMap[MuscleGroup.abductors] ?? 0;
      }
      final hexColor = getColorHexForVolume(volume);
      final idPattern = 'id="${muscle.name}"';

      if (modifiedSvg.contains(idPattern)) {
        modifiedSvg = modifiedSvg.replaceAll(
          RegExp('$idPattern\\s+pathFill="[^"]*"(\\s+fill="[^"]*")?'),
          '$idPattern fill="$hexColor"',
        );
      }
    }
    return modifiedSvg;
  }

  @override
  Widget build(BuildContext context) {
    // Standard Front & Back anatomical SVG template with path IDs corresponding
    // to all MuscleGroup enum names mapped from exercises.json
    const String rawAnatomicalSvg = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 200" width="220" height="200">
  <!-- FRONT ANATOMICAL SILHOUETTE -->
  <g transform="translate(5, 0)">
    <circle cx="50" cy="22" r="9" fill="#475569" />
    <path id="neck" pathFill="default" fill="#334155" d="M46 31 L54 31 L55 36 L45 36 Z" />
    <path id="traps" pathFill="default" fill="#334155" d="M36 35 L45 32 L45 37 L34 38 Z M64 35 L55 32 L55 37 L66 38 Z" />
    <path id="frontDelts" pathFill="default" fill="#334155" d="M29 38 Q23 40 21 49 Q27 50 31 41 Z M71 38 Q77 40 79 49 Q73 50 69 41 Z" />
    <path id="sideDelts" pathFill="default" fill="#334155" d="M21 43 Q17 48 18 55 Q22 54 23 46 Z M79 43 Q83 48 82 55 Q78 54 77 46 Z" />
    <path id="chest" pathFill="default" fill="#334155" d="M30 40 Q50 35 70 40 L68 58 Q50 62 32 58 Z" />
    <path id="biceps" pathFill="default" fill="#334155" d="M18 42 Q25 42 26 58 Q19 58 17 42 Z M74 42 Q81 42 83 58 Q75 58 74 42 Z" />
    <path id="forearms" pathFill="default" fill="#334155" d="M17 60 L14 78 L20 78 L22 60 Z M83 60 L86 78 L80 78 L78 60 Z" />
    <path id="abs" pathFill="default" fill="#334155" d="M34 62 Q50 64 66 62 L64 95 Q50 98 36 95 Z" />
    <path id="abductors" pathFill="default" fill="#334155" d="M32 96 Q29 108 31 120 L35 120 Q34 108 35 96 Z M68 96 Q71 108 69 120 L65 120 Q66 108 65 96 Z" />
    <path id="quads" pathFill="default" fill="#334155" d="M35 98 L43 98 L42 144 L35 144 Z M65 98 L57 98 L58 144 L65 144 Z" />
    <path id="adductors" pathFill="default" fill="#334155" d="M44 99 L49 99 L47 136 L43 136 Z M56 99 L51 99 L53 136 L57 136 Z" />
    <path id="calves" pathFill="default" fill="#334155" d="M35 149 Q33 164 37 182 L44 182 Q45 164 43 149 Z M65 149 Q67 164 63 182 L56 182 Q55 164 57 149 Z" />
  </g>

  <!-- BACK ANATOMICAL SILHOUETTE -->
  <g transform="translate(115, 0)">
    <circle cx="50" cy="22" r="9" fill="#475569" />
    <path id="neck" pathFill="default" fill="#334155" d="M46 31 L54 31 L55 36 L45 36 Z" />
    <path id="traps" pathFill="default" fill="#334155" d="M38 34 L62 34 L65 40 L50 47 L35 40 Z" />
    <path id="upperBack" pathFill="default" fill="#334155" d="M35 40 L65 40 L68 47 L50 56 L32 47 Z" />
    <path id="rearDelts" pathFill="default" fill="#334155" d="M24 38 Q20 43 22 49 Q28 48 31 41 Z M76 38 Q80 43 78 49 Q72 48 69 41 Z" />
    <path id="lats" pathFill="default" fill="#334155" d="M32 46 L48 56 L45 78 Q33 70 32 46 Z M68 46 L52 56 L55 78 Q67 70 68 46 Z" />
    <path id="lowerBack" pathFill="default" fill="#334155" d="M39 68 L61 68 L59 83 L41 83 Z" />
    <path id="triceps" pathFill="default" fill="#334155" d="M19 46 Q25 46 26 63 Q19 63 18 46 Z M74 46 Q81 46 82 63 Q75 63 74 46 Z" />
    <path id="forearms" pathFill="default" fill="#334155" d="M18 64 L15 80 L21 80 L23 64 Z M82 64 L85 80 L79 80 L77 64 Z" />
    <path id="glutes" pathFill="default" fill="#334155" d="M34 84 Q50 81 66 84 L66 101 Q50 105 34 101 Z" />
    <path id="abductors" pathFill="default" fill="#334155" d="M31 86 Q29 98 32 110 L35 110 Q34 98 34 86 Z M69 86 Q71 98 68 110 L65 110 Q66 98 66 86 Z" />
    <path id="adductors" pathFill="default" fill="#334155" d="M45 103 L49 103 L47 136 L44 136 Z M55 103 L51 103 L53 136 L56 136 Z" />
    <path id="hamstrings" pathFill="default" fill="#334155" d="M35 104 L43 104 L42 145 L36 145 Z M65 104 L57 104 L58 145 L64 145 Z" />
  </g>
</svg>
''';

    final String updatedSvg = _injectDynamicFills(rawAnatomicalSvg);

    return SvgPicture.string(
      updatedSvg,
      height: height,
      width: width,
      fit: BoxFit.contain,
    );
  }
}

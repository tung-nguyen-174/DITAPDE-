// lib/screens/logger_screen.dart

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/exercise_model.dart';
import '../theme/app_theme.dart';
import '../widgets/muscle_heatmap.dart';
import 'exercise_picker_screen.dart';
import 'summary_screen.dart';

class LoggedSet {
  final int setNumber;
  double weightKg;
  int reps;
  double rpe;
  bool isCompleted;

  LoggedSet({
    required this.setNumber,
    this.weightKg = 60.0,
    this.reps = 10,
    this.rpe = 8.0,
    this.isCompleted = false,
  });
}

class LoggedExerciseItem {
  final ExerciseDefinition definition;
  final List<LoggedSet> sets;

  LoggedExerciseItem({
    required this.definition,
    required this.sets,
  });
}

class LoggerScreen extends StatefulWidget {
  const LoggerScreen({super.key});

  @override
  State<LoggerScreen> createState() => _LoggerScreenState();
}

class _LoggerScreenState extends State<LoggerScreen> {
  final List<LoggedExerciseItem> _exercises = [];

  void _openExercisePicker() async {
    final ExerciseDefinition? selected = await Navigator.of(context).push<ExerciseDefinition>(
      MaterialPageRoute(builder: (context) => const ExercisePickerScreen()),
    );

    if (selected != null) {
      setState(() {
        _exercises.add(
          LoggedExerciseItem(
            definition: selected,
            sets: [
              LoggedSet(setNumber: 1, weightKg: 40.0, reps: 10, rpe: 7.5),
            ],
          ),
        );
      });
    }
  }

  void _addSetToExercise(int exerciseIndex) {
    setState(() {
      final ex = _exercises[exerciseIndex];
      final lastSet = ex.sets.isNotEmpty ? ex.sets.last : null;
      final newSetNumber = ex.sets.length + 1;
      ex.sets.add(
        LoggedSet(
          setNumber: newSetNumber,
          weightKg: lastSet?.weightKg ?? 40.0,
          reps: lastSet?.reps ?? 10,
          rpe: lastSet?.rpe ?? 8.0,
        ),
      );
    });
  }

  void _toggleSetComplete(int exerciseIndex, int setIndex) {
    setState(() {
      final s = _exercises[exerciseIndex].sets[setIndex];
      s.isCompleted = !s.isCompleted;
    });
  }

  Map<MuscleGroup, int> _buildSetVolumeMap() {
    final Map<MuscleGroup, double> accumulator = {};
    for (final exItem in _exercises) {
      final completedCount = exItem.sets.where((s) => s.isCompleted).length;
      final workingSets = completedCount > 0 ? completedCount : exItem.sets.length;
      for (final p in exItem.definition.primaryMuscles) {
        accumulator[p] = (accumulator[p] ?? 0) + workingSets;
      }
      for (final sec in exItem.definition.secondaryMuscles) {
        accumulator[sec] = (accumulator[sec] ?? 0) + (workingSets * 0.5);
      }
    }
    return accumulator.map((k, v) => MapEntry(k, v.round()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GymChuotTheme.ironBlack,
      appBar: AppBar(
        backgroundColor: GymChuotTheme.ironBlack,
        elevation: 0,
        title: const Text(
          'Nhật Ký Buổi Tập (Logger)',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
        ),
        actions: [
          TextButton.icon(
            onPressed: _openExercisePicker,
            icon: const Icon(LucideIcons.plus, size: 16, color: GymChuotTheme.chalkOrange),
            label: const Text(
              'Thêm Bài',
              style: TextStyle(
                color: GymChuotTheme.chalkOrange,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
          ),
          if (_exercises.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ElevatedButton(
                onPressed: () {
                  final volumeMap = _buildSetVolumeMap();
                  final completedByName = <String, int>{
                    for (final item in _exercises)
                      item.definition.nameEn: item.sets.where((s) => s.isCompleted).isNotEmpty
                          ? item.sets.where((s) => s.isCompleted).length
                          : item.sets.length,
                  };
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => SummaryScreen(
                        setVolumeMap: volumeMap,
                        completedSetsByExerciseName: completedByName,
                      ),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: GymChuotTheme.chalkOrange,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                child: const Text(
                  'Hoàn Thành',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ),
        ],
      ),
      body: _exercises.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: GymChuotTheme.steelGray,
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF333340)),
                    ),
                    child: const Icon(
                      LucideIcons.dumbbell,
                      color: GymChuotTheme.chalkOrange,
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Chưa có bài tập nào trong buổi',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Mở thư viện để chọn từ hơn 800 bài tập',
                    style: TextStyle(
                      fontSize: 13,
                      color: GymChuotTheme.mutedSilver,
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: _openExercisePicker,
                    icon: const Icon(LucideIcons.plus, size: 18),
                    label: const Text('Thêm Bài Tập Đầu Tiên'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: GymChuotTheme.chalkOrange,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _exercises.length + 1,
              itemBuilder: (context, index) {
                if (index == _exercises.length) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: OutlinedButton.icon(
                      onPressed: _openExercisePicker,
                      icon: const Icon(LucideIcons.plus, size: 16),
                      label: const Text('Thêm Bài Tập Khác'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: GymChuotTheme.chalkOrange,
                        side: const BorderSide(color: GymChuotTheme.chalkOrange),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  );
                }

                final exItem = _exercises[index];
                return Card(
                  color: GymChuotTheme.surfaceCard,
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: Color(0xFF2E2E38)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    exItem.definition.nameEn,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 15,
                                      color: Colors.white,
                                    ),
                                  ),
                                  if (exItem.definition.nameVn != exItem.definition.nameEn)
                                    Text(
                                      exItem.definition.nameVn,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: GymChuotTheme.mutedSilver,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: GymChuotTheme.chalkOrange.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                exItem.definition.equipment.name.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: GymChuotTheme.chalkOrange,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(color: Color(0xFF282832), height: 1),
                        const SizedBox(height: 8),

                        // Set rows
                        ...List.generate(exItem.sets.length, (sIdx) {
                          final s = exItem.sets[sIdx];
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 32,
                                  child: Text(
                                    '#${s.setNumber}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: GymChuotTheme.mutedSilver,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    '${s.weightKg} kg × ${s.reps} reps (RPE ${s.rpe})',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: Icon(
                                    s.isCompleted ? LucideIcons.checkCircle : LucideIcons.circle,
                                    color: s.isCompleted
                                        ? GymChuotTheme.successGreen
                                        : GymChuotTheme.mutedSilver,
                                    size: 20,
                                  ),
                                  onPressed: () => _toggleSetComplete(index, sIdx),
                                ),
                              ],
                            ),
                          );
                        }),

                        const SizedBox(height: 8),
                        TextButton.icon(
                          onPressed: () => _addSetToExercise(index),
                          icon: const Icon(LucideIcons.plus, size: 14),
                          label: const Text('Thêm Set Mới', style: TextStyle(fontSize: 12)),
                          style: TextButton.styleFrom(
                            foregroundColor: GymChuotTheme.electricCyan,
                            padding: EdgeInsets.zero,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}

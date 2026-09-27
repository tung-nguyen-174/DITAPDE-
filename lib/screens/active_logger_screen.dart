import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';
import '../providers/workout_provider.dart';
import '../widgets/plate_calculator_dialog.dart';
import '../widgets/rest_timer_sheet.dart';
import 'summary_screen.dart';

class ActiveLoggerScreen extends StatelessWidget {
  const ActiveLoggerScreen({super.key});

  String _formatDuration(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkoutProvider>();
    final session = provider.activeSession;

    if (session == null) {
      return Scaffold(
        body: Center(
          child: ElevatedButton(
            onPressed: () => provider.startNewWorkout(),
            child: const Text('Bắt đầu buổi tập mới'),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.x),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              session.title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
            Row(
              children: [
                const Icon(LucideIcons.clock, size: 12, color: GymChuotTheme.chalkOrange),
                const SizedBox(width: 4),
                Text(
                  _formatDuration(session.durationSeconds),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: GymChuotTheme.chalkOrange,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (ctx) => const SummaryScreen(),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: GymChuotTheme.chalkOrange,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            ),
            child: const Text('Hoàn Thành', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: Stack(
        children: [
          ListView.builder(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 140),
            itemCount: session.exercises.length,
            itemBuilder: (ctx, exIdx) {
              final ex = session.exercises[exIdx];
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: Padding(
                  padding: const EdgeInsets.all(12),
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
                                  ex.name,
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                                ),
                                Text(
                                  ex.vietnameseName,
                                  style: const TextStyle(fontSize: 11, color: GymChuotTheme.mutedSilver),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(LucideIcons.disc, color: GymChuotTheme.electricCyan, size: 18),
                            tooltip: 'Tính bánh tạ (Plate Calculator)',
                            onPressed: () {
                              showDialog(
                                context: context,
                                builder: (c) => const PlateCalculatorDialog(initialTargetKg: 100),
                              );
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      const Row(
                        children: [
                          SizedBox(width: 38, child: Text('SET', style: TextStyle(fontSize: 10, color: GymChuotTheme.mutedSilver))),
                          Expanded(child: Text('PREVIOUS', style: TextStyle(fontSize: 10, color: GymChuotTheme.mutedSilver))),
                          SizedBox(width: 65, child: Center(child: Text('KG', style: TextStyle(fontSize: 10, color: GymChuotTheme.mutedSilver)))),
                          SizedBox(width: 55, child: Center(child: Text('REPS', style: TextStyle(fontSize: 10, color: GymChuotTheme.mutedSilver)))),
                          SizedBox(width: 45, child: Center(child: Text('RPE', style: TextStyle(fontSize: 10, color: GymChuotTheme.mutedSilver)))),
                          SizedBox(width: 44, child: Center(child: Text('✓', style: TextStyle(fontSize: 10, color: GymChuotTheme.mutedSilver)))),
                        ],
                      ),
                      const Divider(color: Color(0xFF2A2A32)),
                      ...List.generate(ex.sets.length, (sIdx) {
                        final set = ex.sets[sIdx];
                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 6),
                          decoration: BoxDecoration(
                            color: set.isCompleted
                                ? GymChuotTheme.successGreen.withOpacity(0.12)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 38,
                                child: Text(
                                  'Set ${set.setNumber}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  set.previous,
                                  style: const TextStyle(fontSize: 11, color: GymChuotTheme.mutedSilver),
                                ),
                              ),
                              SizedBox(
                                width: 65,
                                child: TextFormField(
                                  initialValue: set.weight.toStringAsFixed(1),
                                  keyboardType: TextInputType.number,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                  decoration: InputDecoration(
                                    contentPadding: const EdgeInsets.symmetric(vertical: 6),
                                    isDense: true,
                                    fillColor: GymChuotTheme.ironBlack,
                                    filled: true,
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                                  ),
                                  onChanged: (val) {
                                    final w = double.tryParse(val);
                                    if (w != null) provider.updateSetWeight(exIdx, sIdx, w);
                                  },
                                ),
                              ),
                              const SizedBox(width: 6),
                              SizedBox(
                                width: 55,
                                child: TextFormField(
                                  initialValue: set.reps.toString(),
                                  keyboardType: TextInputType.number,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                  decoration: InputDecoration(
                                    contentPadding: const EdgeInsets.symmetric(vertical: 6),
                                    isDense: true,
                                    fillColor: GymChuotTheme.ironBlack,
                                    filled: true,
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                                  ),
                                  onChanged: (val) {
                                    final r = int.tryParse(val);
                                    if (r != null) provider.updateSetReps(exIdx, sIdx, r);
                                  },
                                ),
                              ),
                              const SizedBox(width: 6),
                              SizedBox(
                                width: 45,
                                child: Text(
                                  set.rpe.toStringAsFixed(1),
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 12, color: GymChuotTheme.electricCyan),
                                ),
                              ),
                              SizedBox(
                                width: 44,
                                child: IconButton(
                                  icon: Icon(
                                    set.isCompleted ? LucideIcons.checkCircle : LucideIcons.circle,
                                    color: set.isCompleted ? GymChuotTheme.successGreen : GymChuotTheme.mutedSilver,
                                    size: 22,
                                  ),
                                  onPressed: () => provider.toggleSetComplete(exIdx, sIdx),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: () => provider.addSet(exIdx),
                        icon: const Icon(LucideIcons.plus, size: 14),
                        label: const Text('+ Thêm Set Mới', style: TextStyle(fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFF383842)),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (provider.isRestTimerActive)
                  RestTimerSheet(
                    secondsRemaining: provider.restSecondsRemaining,
                    onAdd30s: () => provider.addRestSeconds(30),
                    onSkip: () => provider.skipRestTimer(),
                  ),
                Container(
                  color: GymChuotTheme.steelGray,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.activity, color: GymChuotTheme.chalkOrange, size: 16),
                      const SizedBox(width: 8),
                      const Text(
                        'Live Heatmap: Ngực 8 Sets | Tay Sau 4 Sets',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      const Spacer(),
                      Text(
                        'Tải: ${session.totalTonnageKg.toStringAsFixed(0)} kg',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: GymChuotTheme.electricCyan),
                      ),
                    ],
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

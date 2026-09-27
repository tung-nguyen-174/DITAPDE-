// lib/screens/exercise_picker_screen.dart

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/exercise_model.dart';
import '../repositories/exercise_repository.dart';
import '../theme/app_theme.dart';

class ExercisePickerScreen extends StatefulWidget {
  const ExercisePickerScreen({super.key});

  @override
  State<ExercisePickerScreen> createState() => _ExercisePickerScreenState();
}

class _ExercisePickerScreenState extends State<ExercisePickerScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ExerciseRepository _repository = ExerciseRepository();

  final List<String> _categories = const [
    'All',
    'Ngực (Chest)',
    'Lưng (Back)',
    'Vai (Shoulders)',
    'Tay (Arms)',
    'Chân (Legs)',
    'Bụng (Abs)',
  ];

  String _selectedCategory = 'All';
  String _searchQuery = '';
  List<ExerciseDefinition> _filteredExercises = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadExercises();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadExercises() async {
    setState(() => _isLoading = true);
    final results = await _repository.searchExercises(
      query: _searchQuery,
      category: _selectedCategory,
    );
    if (mounted) {
      setState(() {
        _filteredExercises = results;
        _isLoading = false;
      });
    }
  }

  void _onCategorySelected(String category) {
    setState(() {
      _selectedCategory = category;
    });
    _loadExercises();
  }

  void _onSearchChanged(String value) {
    setState(() {
      _searchQuery = value;
    });
    _loadExercises();
  }

  String _formatMuscleName(MuscleGroup group) {
    switch (group) {
      case MuscleGroup.chest:
        return 'Ngực';
      case MuscleGroup.lats:
        return 'Xô (Lats)';
      case MuscleGroup.upperBack:
        return 'Lưng Trên';
      case MuscleGroup.lowerBack:
        return 'Lưng Dưới';
      case MuscleGroup.quads:
        return 'Đùi Trước';
      case MuscleGroup.glutes:
        return 'Mông';
      case MuscleGroup.calves:
        return 'Bắp Chân';
      case MuscleGroup.frontDelts:
        return 'Vai Trước';
      case MuscleGroup.sideDelts:
        return 'Vai Giữa';
      case MuscleGroup.rearDelts:
        return 'Vai Sau';
      case MuscleGroup.biceps:
        return 'Tay Trước (Biceps)';
      case MuscleGroup.triceps:
        return 'Tay Sau (Triceps)';
      case MuscleGroup.abs:
        return 'Cơ Bụng';
    }
  }

  Widget _buildEquipmentBadge(EquipmentType equipment) {
    IconData icon;
    String label;
    Color color;

    switch (equipment) {
      case EquipmentType.barbell:
        icon = LucideIcons.dumbbell;
        label = 'Barbell';
        color = GymChuotTheme.chalkOrange;
        break;
      case EquipmentType.dumbbell:
        icon = LucideIcons.dumbbell;
        label = 'Dumbbell';
        color = GymChuotTheme.electricCyan;
        break;
      case EquipmentType.cable:
        icon = LucideIcons.activity;
        label = 'Cable';
        color = const Color(0xFFA855F7);
        break;
      case EquipmentType.machine:
        icon = LucideIcons.cog;
        label = 'Machine';
        color = const Color(0xFFF59E0B);
        break;
      case EquipmentType.bodyweight:
        icon = LucideIcons.user;
        label = 'Bodyweight';
        color = GymChuotTheme.successGreen;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: color,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GymChuotTheme.ironBlack,
      appBar: AppBar(
        backgroundColor: GymChuotTheme.ironBlack,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Thư Viện Bài Tập',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: GymChuotTheme.steelGray,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF353540)),
                ),
                child: Text(
                  '${_filteredExercises.length} bài',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: GymChuotTheme.chalkOrange,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // 1. Top Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Container(
              decoration: BoxDecoration(
                color: GymChuotTheme.steelGray,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF333340)),
              ),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                cursorColor: GymChuotTheme.chalkOrange,
                onChanged: _onSearchChanged,
                decoration: InputDecoration(
                  hintText: 'Tìm bài tập (VD: Bench Press, Đẩy ngực, Squat)...',
                  hintStyle: TextStyle(
                    color: GymChuotTheme.mutedSilver.withOpacity(0.6),
                    fontSize: 13,
                  ),
                  prefixIcon: const Icon(
                    LucideIcons.search,
                    color: GymChuotTheme.mutedSilver,
                    size: 18,
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(LucideIcons.x, size: 16, color: Colors.white70),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ),
          ),

          // 2. Horizontal Category Filter Chips
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = category == _selectedCategory;

                return GestureDetector(
                  onTap: () => _onCategorySelected(category),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? GymChuotTheme.chalkOrange
                          : GymChuotTheme.surfaceCard,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected
                            ? GymChuotTheme.chalkOrange
                            : const Color(0xFF2C2C36),
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: GymChuotTheme.chalkOrange.withOpacity(0.35),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              )
                            ]
                          : null,
                    ),
                    child: Center(
                      child: Text(
                        category,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected ? Colors.white : GymChuotTheme.mutedSilver,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 12),

          // 3. Vertical List View of Exercise Cards
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: GymChuotTheme.chalkOrange,
                    ),
                  )
                : _filteredExercises.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              LucideIcons.searchX,
                              size: 48,
                              color: GymChuotTheme.mutedSilver.withOpacity(0.4),
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'Không tìm thấy bài tập phù hợp',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Thử tìm từ khóa khác hoặc xóa bộ lọc',
                              style: TextStyle(
                                fontSize: 12,
                                color: GymChuotTheme.mutedSilver.withOpacity(0.8),
                              ),
                            ),
                            const SizedBox(height: 16),
                            TextButton.icon(
                              onPressed: () {
                                _searchController.clear();
                                _selectedCategory = 'All';
                                _onSearchChanged('');
                              },
                              icon: const Icon(LucideIcons.rotateCcw, size: 14),
                              label: const Text('Đặt lại bộ lọc'),
                              style: TextButton.styleFrom(
                                foregroundColor: GymChuotTheme.chalkOrange,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: _filteredExercises.length,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        itemBuilder: (context, index) {
                          final exercise = _filteredExercises[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () {
                                  // Tapping an exercise returns it to logger screen
                                  Navigator.of(context).pop(exercise);
                                },
                                borderRadius: BorderRadius.circular(16),
                                splashColor: GymChuotTheme.chalkOrange.withOpacity(0.15),
                                highlightColor: GymChuotTheme.steelGray,
                                child: Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: GymChuotTheme.surfaceCard,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: const Color(0xFF272732)),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      // Leading visual indicator
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF22222B),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: const Color(0xFF30303D)),
                                        ),
                                        child: Center(
                                          child: Icon(
                                            LucideIcons.dumbbell,
                                            size: 20,
                                            color: exercise.primaryMuscles.contains(MuscleGroup.chest)
                                                ? GymChuotTheme.chalkOrange
                                                : exercise.primaryMuscles.contains(MuscleGroup.quads) ||
                                                        exercise.primaryMuscles.contains(MuscleGroup.glutes)
                                                    ? GymChuotTheme.electricCyan
                                                    : Colors.white70,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),

                                      // Main info column
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              exercise.nameEn,
                                              style: const TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w800,
                                                color: Colors.white,
                                                letterSpacing: -0.2,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            if (exercise.nameVn.isNotEmpty &&
                                                exercise.nameVn != exercise.nameEn) ...[
                                              const SizedBox(height: 2),
                                              Text(
                                                exercise.nameVn,
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w500,
                                                  color: GymChuotTheme.mutedSilver.withOpacity(0.85),
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                            const SizedBox(height: 8),

                                            // Badges row: Equipment + Primary Muscle Tag
                                            Wrap(
                                              spacing: 6,
                                              runSpacing: 4,
                                              crossAxisAlignment: WrapCrossAlignment.center,
                                              children: [
                                                _buildEquipmentBadge(exercise.equipment),
                                                ...exercise.primaryMuscles.take(2).map((m) {
                                                  return Container(
                                                    padding: const EdgeInsets.symmetric(
                                                      horizontal: 7,
                                                      vertical: 3,
                                                    ),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFF252530),
                                                      borderRadius: BorderRadius.circular(6),
                                                      border: Border.all(
                                                        color: const Color(0xFF383846),
                                                      ),
                                                    ),
                                                    child: Text(
                                                      _formatMuscleName(m),
                                                      style: const TextStyle(
                                                        fontSize: 10.5,
                                                        fontWeight: FontWeight.w600,
                                                        color: Colors.white70,
                                                      ),
                                                    ),
                                                  );
                                                }),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),

                                      const SizedBox(width: 8),

                                      // Action button (+)
                                      Container(
                                        width: 32,
                                        height: 32,
                                        decoration: BoxDecoration(
                                          color: GymChuotTheme.chalkOrange.withOpacity(0.12),
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: GymChuotTheme.chalkOrange.withOpacity(0.35),
                                          ),
                                        ),
                                        child: const Icon(
                                          LucideIcons.plus,
                                          size: 16,
                                          color: GymChuotTheme.chalkOrange,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

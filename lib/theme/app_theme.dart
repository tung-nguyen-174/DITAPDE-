// DiTapDe — design tokens & ThemeData
// Generated from "Đi tập đê! — Design System v2"
// Drop into lib/theme/app_theme.dart

import 'package:flutter/material.dart';

/// ---------------------------------------------------------------------
/// SPACING — 4pt grid. Only these seven values should ever be used for
/// padding, margin or gap. If a spot needs something else, it's a sign
/// the layout should be rethought, not that an eighth value is needed.
/// ---------------------------------------------------------------------
class AppSpacing {
  AppSpacing._();

  static const double xs = 4;   // icon-to-label micro gaps
  static const double sm = 8;   // tight, inside small components
  static const double md = 12;  // between related items (set rows, chips)
  static const double base = 16; // card padding, default gap
  static const double lg = 20;  // screen left/right margin
  static const double xl = 24;  // between distinct sections
  static const double xxl = 32; // major section break
  static const double xxxl = 48; // top/bottom screen breathing room

  static const double touchTarget = 48; // minimum tappable size
  static const double radiusControl = 14; // buttons, chips, inputs
  static const double radiusCard = 20;     // hero cards, sheets
}

/// ---------------------------------------------------------------------
/// COLOR — warm graphite surfaces + the "plate-code" data system.
/// Plate colors map to real 10/15/20/25kg bumper-plate colors and are
/// reused everywhere the app needs a load/intensity scale: RPE chips,
/// weekly volume bars, and the muscle-heatmap fill.
/// ---------------------------------------------------------------------
class AppColors {
  AppColors._();

  // Surfaces
  static const canvas = Color(0xFF17161A);
  static const surface = Color(0xFF1F1E24);
  static const surfaceRaised = Color(0xFF28272E);
  static const hairline = Color(0xFF35343C);

  // Text
  static const chalk = Color(0xFFF2F1ED);
  static const chalkDim = Color(0xFF9C9AA3);
  static const chalkFaint = Color(0xFF656470);

  // Accent
  static const ironRed = Color(0xFFE4483C);
  static const ironRedPressed = Color(0xFFC23629);

  // Plate-code data system
  static const plateGreen = Color(0xFF4CAF6D);  // 10kg · low load / RPE 1-4
  static const plateYellow = Color(0xFFE0B93D); // 15kg · moderate / RPE 5-6
  static const plateBlue = Color(0xFF3E8EDE);   // 20kg · heavy / RPE 7-8
  static const plateRed = Color(0xFFE4483C);    // 25kg · max effort / RPE 9-10 / PR

  /// Returns the plate-code color for a given RPE (1-10).
  static Color forRpe(num rpe) {
    if (rpe >= 9) return plateRed;
    if (rpe >= 7) return plateBlue;
    if (rpe >= 5) return plateYellow;
    return plateGreen;
  }
}

/// ---------------------------------------------------------------------
/// TYPE SCALE — Space Grotesk for numerals/titles, Inter for everything
/// else. Add both fonts to pubspec.yaml (google_fonts package, or bundle
/// the .ttf files under assets/fonts/).
/// ---------------------------------------------------------------------
class AppText {
  AppText._();

  static const _display = 'SpaceGrotesk';
  static const _body = 'Inter';

  static const display = TextStyle(
    fontFamily: _display,
    fontWeight: FontWeight.w600,
    fontSize: 40,
    height: 1.1,
    color: AppColors.chalk,
  );

  static const h1 = TextStyle(
    fontFamily: _display,
    fontWeight: FontWeight.w600,
    fontSize: 24,
    height: 1.25,
    color: AppColors.chalk,
  );

  static const h2 = TextStyle(
    fontFamily: _display,
    fontWeight: FontWeight.w600,
    fontSize: 17,
    height: 1.3,
    color: AppColors.chalk,
  );

  static const body = TextStyle(
    fontFamily: _body,
    fontWeight: FontWeight.w400,
    fontSize: 15,
    height: 1.5,
    color: AppColors.chalk,
  );

  static const caption = TextStyle(
    fontFamily: _body,
    fontWeight: FontWeight.w500,
    fontSize: 12.5,
    height: 1.4,
    color: AppColors.chalkDim,
  );

  static const label = TextStyle(
    fontFamily: _body,
    fontWeight: FontWeight.w600,
    fontSize: 11,
    color: AppColors.ironRed,
  );
}

/// ---------------------------------------------------------------------
/// THEME DATA
/// ---------------------------------------------------------------------
class AppTheme {
  AppTheme._();

  static ThemeData get dark {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.canvas,
      fontFamily: 'Inter',
      colorScheme: const ColorScheme.dark(
        surface: AppColors.surface,
        primary: AppColors.ironRed,
        onPrimary: AppColors.chalk,
        secondary: AppColors.plateBlue,
        error: AppColors.plateRed,
      ),
      cardTheme: CardThemeData(
        color: AppColors.surfaceRaised,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusCard),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.hairline,
        thickness: 1,
        space: 1,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.ironRed,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(AppSpacing.touchTarget + 2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusControl),
          ),
          textStyle: AppText.body.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surfaceRaised,
        side: const BorderSide(color: AppColors.hairline),
        labelStyle: AppText.caption,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.ironRed,
        unselectedItemColor: AppColors.chalkFaint,
        type: BottomNavigationBarType.fixed,
      ),
      textTheme: const TextTheme(
        displayMedium: AppText.display,
        headlineMedium: AppText.h1,
        titleMedium: AppText.h2,
        bodyMedium: AppText.body,
        bodySmall: AppText.caption,
        labelSmall: AppText.label,
      ),
    );
  }
}

/// Legacy compatibility alias for existing Flutter screens
class GymChuotTheme {
  static const Color chalkOrange = AppColors.ironRed;
  static const Color electricCyan = AppColors.plateBlue;
  static const Color ironBlack = AppColors.canvas;
  static const Color steelGray = AppColors.surfaceRaised;
  static const Color pureWhite = AppColors.chalk;
  static const Color mutedSilver = AppColors.chalkDim;
  static const Color successGreen = AppColors.plateGreen;
  static const Color surfaceCard = AppColors.surface;

  static ThemeData get darkTheme => AppTheme.dark;
}

/// ---------------------------------------------------------------------
/// USAGE EXAMPLE — a set-log row built only from the tokens above.
/// Notice there is no hardcoded padding/color anywhere in the widget.
/// ---------------------------------------------------------------------
class SetRow extends StatelessWidget {
  final int setNumber;
  final double weightKg;
  final int reps;
  final num rpe;
  final bool isCurrent;

  const SetRow({
    super.key,
    required this.setNumber,
    required this.weightKg,
    required this.reps,
    required this.rpe,
    this.isCurrent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: isCurrent ? AppColors.ironRed.withOpacity(0.06) : null,
        borderRadius: BorderRadius.circular(AppSpacing.radiusControl),
        border: const Border(
          bottom: BorderSide(color: AppColors.hairline),
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 13,
            backgroundColor:
                isCurrent ? AppColors.ironRed : AppColors.surfaceRaised,
            child: Text('$setNumber',
                style: AppText.caption.copyWith(
                  color: isCurrent ? Colors.white : AppColors.chalkDim,
                )),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text('${weightKg.toStringAsFixed(0)}kg × $reps',
                style: AppText.body),
          ),
          const SizedBox(width: AppSpacing.md),
          Chip(
            label: Text('RPE ${rpe.toStringAsFixed(0)}'),
            backgroundColor: AppColors.forRpe(rpe).withOpacity(0.18),
            side: BorderSide.none,
            labelStyle: AppText.caption.copyWith(
              color: AppColors.forRpe(rpe),
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

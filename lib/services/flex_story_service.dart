// lib/services/flex_story_service.dart

import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class FlexStoryService {
  /// Captures the RepaintBoundary widget as a 1080x1920 HD PNG image and opens native share sheet
  static Future<bool> captureAndShareStory(GlobalKey boundaryKey) async {
    try {
      // 1. Find the RenderRepaintBoundary from the widget key
      final boundary = boundaryKey.currentContext?.findRenderObject()
          as RenderRepaintBoundary?;

      if (boundary == null) return false;

      // 2. Render pixel raster at 3.0x pixel ratio for high-res story output
      final ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);

      if (byteData == null) return false;

      final pngBytes = byteData.buffer.asUint8List();

      // 3. Write image file to device temporary directory
      final tempDir = await getTemporaryDirectory();
      final filePath =
          '${tempDir.path}/di_tap_de_story_${DateTime.now().millisecondsSinceEpoch}.png';
      final file = File(filePath);
      await file.writeAsBytes(pngBytes);

      // 4. Launch native system share tray (Instagram / TikTok / Facebook Stories)
      final xFile = XFile(filePath);
      final result = await Share.shareXFiles(
        [xFile],
        text: 'Vừa hoàn thành buổi tập cùng Đi tập đê! Đi tập đê! 🔥 #DiTapDe',
      );

      return result.status == ShareResultStatus.success;
    } catch (e) {
      debugPrint('Error exporting Flex Story card: $e');
      return false;
    }
  }
}

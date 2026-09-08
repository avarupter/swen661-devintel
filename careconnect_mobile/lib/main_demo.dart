// TEMPORARY entrypoint used only to record the demo video.
// It force-enables the semantics tree so the browser exposes aria labels,
// which lets the recording script drive the real app by label instead of by
// pixel coordinates. Not committed; delete after building.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';

import 'main.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SemanticsBinding.instance.ensureSemantics();
  runApp(const MyApp());
}

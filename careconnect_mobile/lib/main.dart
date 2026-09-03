import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'router/app_router.dart';
import 'providers/auth_provider.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => AuthProvider(),
      child: MaterialApp.router(
        title: 'CareConnect',
        theme: ThemeData(
          primaryColor: const Color(0xFF1A73E8),
          useMaterial3: true,
        ),
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
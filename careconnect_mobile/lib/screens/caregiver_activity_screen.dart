import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../utils/responsive.dart';
import 'package:google_fonts/google_fonts.dart';

class CaregiverActivityScreen extends StatelessWidget {
  const CaregiverActivityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 393,
      height: 852,
      clipBehavior: Clip.hardEdge,
      decoration: const BoxDecoration(color: Colors.white),
      child: SizedBox(
        width: double.infinity,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned(
              left: 0,
              top: 0,
              child: Container(
                width: 393,
                height: 1108,
                color: const Color(0xFFF6F7F9),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Positioned(
                      left: 0,
                      top: 0,
                      child: Container(
                        width: 393,
                        height: 1108,
                        color: const Color(0xFFF6F7F9),
                        child: Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Positioned(
                              left: 0,
                              top: 0,
                              child: Container(
                                width: 393,
                                height: 177,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  border: Border.all(
                                    color: const Color(0x191F2937),
                                  ),
                                ),
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    Positioned(
                                      left: 16,
                                      top: 18,
                                      child: Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF1A73E8),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: Stack(
                                          clipBehavior: Clip.none,
                                          children: [
                                            Positioned(
                                              left: 12,
                                              top: 15,
                                              child: Image.network(
                                                'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2F0a97dc51-7c42-4b60-a2aa-513000dd9082.png',
                                                width: 16,
                                                height: 14,
                                                fit: BoxFit.contain,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 68,
                                      top: 17,
                                      child: Container(
                                        width: 112,
                                        height: 42,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFD7EAF4),
                                          border: Border.all(
                                            color: const Color(0x33177245),
                                          ),
                                          borderRadius: BorderRadius.circular(
                                            9999,
                                          ),
                                        ),
                                        child: Stack(
                                          clipBehavior: Clip.none,
                                          children: [
                                            Positioned(
                                              left: 17,
                                              top: 13,
                                              child: Image.network(
                                                'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2F5f0f4660-5d8b-4260-a4a5-faa49059bb58.png',
                                                width: 12,
                                                height: 15,
                                                fit: BoxFit.contain,
                                              ),
                                            ),
                                            const Positioned(
                                              left: 36,
                                              top: 10,
                                              child: Text(
                                                'Caregiver',
                                                style: TextStyle(
                                                  color: Color(0xFF1A73E8),
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w500,
                                                  height: 1.4,
                                                  fontFamily: 'Roboto',
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 295,
                                      top: 19,
                                      child: Image.network(
                                        'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2F1828c2b5-2a28-4e34-af73-c88418e71294.png',
                                        width: 75,
                                        height: 38,
                                        fit: BoxFit.contain,
                                      ),
                                    ),
                                    Positioned(
                                      left: 15,
                                      top: 75,
                                      child: SizedBox(
                                        width: 365,
                                        child: RichText(
                                          text: TextSpan(
                                            style: GoogleFonts.getFont(
                                              'Roboto',
                                              color: const Color(0xFF1F2937),
                                              fontSize: 30,
                                              fontWeight: FontWeight.bold,
                                              height: 1.3,
                                            ),
                                            children: const [
                                              TextSpan(
                                                text: 'Thursday 4 June ',
                                              ),
                                              TextSpan(
                                                text: '5:39 AM',
                                                style: TextStyle(
                                                  color: Color(0xFF1A73E8),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 15,
                                      top: 117,
                                      child: SizedBox(
                                        width: 363,
                                        child: RichText(
                                          text: TextSpan(
                                            style: GoogleFonts.getFont(
                                              'Roboto',
                                              color: const Color(0xFF667085),
                                              fontSize: 18,
                                              height: 1.6,
                                            ),
                                            children: const [
                                              TextSpan(
                                                text:
                                                    'Good morning, Joyce  ·  ',
                                              ),
                                              TextSpan(
                                                text: 'Activity Log',
                                                style: TextStyle(
                                                  color: Color(0xFF1F2937),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                    const Positioned(
                                      left: 15,
                                      top: 149,
                                      child: SizedBox(
                                        width: 363,
                                        child: Text(
                                          "Viewing Margaret's care plan",
                                          style: TextStyle(
                                            color: Color(0xFF1A73E8),
                                            fontSize: 16,
                                            height: 1.5,
                                            fontFamily: 'Roboto',
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            Positioned(
                              left: 0,
                              top: 177,
                              child: Container(
                                width: 393,
                                height: 267,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  border: Border.all(
                                    color: const Color(0x191F2937),
                                  ),
                                ),
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    Positioned(
                                      left: 0,
                                      top: 0,
                                      child: Container(
                                        width: 176,
                                        height: 52,
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: Stack(
                                          clipBehavior: Clip.none,
                                          children: [
                                            Positioned(
                                              left: 15,
                                              top: 20,
                                              child: Image.network(
                                                'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2F8efd642b-168f-4f96-be7f-00556523d58a.png',
                                                width: 14,
                                                height: 14,
                                                fit: BoxFit.contain,
                                              ),
                                            ),
                                            const Positioned(
                                              left: 43,
                                              top: 13,
                                              child: Text(
                                                'Dashboard',
                                                style: TextStyle(
                                                  color: Color(0xFF1F2937),
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w500,
                                                  height: 1.5,
                                                  fontFamily: 'Roboto',
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 184,
                                      top: 0,
                                      child: Container(
                                        width: 176,
                                        height: 52,
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: Stack(
                                          clipBehavior: Clip.none,
                                          children: [
                                            Positioned(
                                              left: 14,
                                              top: 19,
                                              child: Image.network(
                                                'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2F290ce07f-85a0-46a9-ae7e-964d895ca5c2.png',
                                                width: 15,
                                                height: 15,
                                                fit: BoxFit.contain,
                                              ),
                                            ),
                                            const Positioned(
                                              left: 43,
                                              top: 13,
                                              child: Text(
                                                'Medications',
                                                style: TextStyle(
                                                  color: Color(0xFF1F2937),
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w500,
                                                  height: 1.5,
                                                  fontFamily: 'Roboto',
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 0,
                                      top: 60,
                                      child: Container(
                                        width: 176,
                                        height: 52,
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: Stack(
                                          clipBehavior: Clip.none,
                                          children: [
                                            Positioned(
                                              left: 16,
                                              top: 19,
                                              child: Image.network(
                                                'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2Fffe4e857-456b-426e-96db-c3ea9b338a9a.png',
                                                width: 15,
                                                height: 15,
                                                fit: BoxFit.contain,
                                              ),
                                            ),
                                            const Positioned(
                                              left: 44,
                                              top: 13,
                                              child: Text(
                                                'Appointments',
                                                style: TextStyle(
                                                  color: Color(0xFF1F2937),
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w500,
                                                  height: 1.5,
                                                  fontFamily: 'Roboto',
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 184,
                                      top: 60,
                                      child: Container(
                                        width: 176,
                                        height: 52,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFD7EAF4),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: Stack(
                                          clipBehavior: Clip.none,
                                          children: [
                                            Positioned(
                                              left: 13,
                                              top: 20,
                                              child: Image.network(
                                                'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2F0d68275f-1f5f-4746-be35-3d23abd2cce8.png',
                                                width: 18,
                                                height: 13,
                                                fit: BoxFit.contain,
                                              ),
                                            ),
                                            const Positioned(
                                              left: 43,
                                              top: 13,
                                              child: Text(
                                                'Activity',
                                                style: TextStyle(
                                                  color: Color(0xFF1A73E8),
                                                  fontSize: 16,
                                                  height: 1.5,
                                                  fontFamily: 'Roboto',
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 0,
                                      top: 120,
                                      child: Container(
                                        width: 359,
                                        height: 52,
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: Stack(
                                          clipBehavior: Clip.none,
                                          children: [
                                            Positioned(
                                              left: 16,
                                              top: 16,
                                              child: Image.network(
                                                'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2Ffb588d4d-3ab5-4deb-8899-4f97a2d52fde.png',
                                                width: 15,
                                                height: 20,
                                                fit: BoxFit.contain,
                                              ),
                                            ),
                                            const Positioned(
                                              left: 44,
                                              top: 13,
                                              child: Text(
                                                'Notes',
                                                style: TextStyle(
                                                  color: Color(0xFF1F2937),
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w500,
                                                  height: 1.5,
                                                  fontFamily: 'Roboto',
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 0,
                                      top: 172,
                                      child: SizedBox(
                                        width: 390,
                                        height: 95,
                                        child: Stack(
                                          clipBehavior: Clip.none,
                                          children: [
                                            Positioned(
                                              left: 16,
                                              top: 8,
                                              child: Container(
                                                width: 358,
                                                height: 71,
                                                decoration: BoxDecoration(
                                                  border: Border.all(
                                                    color: const Color(
                                                      0x191F2937,
                                                    ),
                                                  ),
                                                ),
                                                child: Stack(
                                                  clipBehavior: Clip.none,
                                                  children: [
                                                    Positioned(
                                                      left: 0,
                                                      top: 19,
                                                      child: Container(
                                                        width: 358,
                                                        height: 52,
                                                        decoration: BoxDecoration(
                                                          borderRadius:
                                                              BorderRadius.circular(
                                                                10,
                                                              ),
                                                        ),
                                                        child: Stack(
                                                          clipBehavior:
                                                              Clip.none,
                                                          children: [
                                                            Positioned(
                                                              left: 12,
                                                              top: 12,
                                                              child: SizedBox(
                                                                width: 19,
                                                                height: 28,
                                                                child: Stack(
                                                                  clipBehavior:
                                                                      Clip.none,
                                                                  children: [
                                                                    Positioned(
                                                                      left: 0,
                                                                      top: 4,
                                                                      child: SizedBox(
                                                                        width:
                                                                            19,
                                                                        height:
                                                                            20,
                                                                        child: Stack(
                                                                          clipBehavior:
                                                                              Clip.none,
                                                                          children: [
                                                                            Positioned(
                                                                              left: 0,
                                                                              top: 1,
                                                                              child: SizedBox.square(
                                                                                dimension: 19,
                                                                                child: Stack(
                                                                                  clipBehavior: Clip.none,
                                                                                  children: [
                                                                                    Positioned(
                                                                                      left: 1,
                                                                                      top: 4,
                                                                                      child: Container(
                                                                                        width: 17,
                                                                                        height: 14,
                                                                                        clipBehavior: Clip.hardEdge,
                                                                                        decoration: const BoxDecoration(),
                                                                                        child: Stack(
                                                                                          clipBehavior: Clip.none,
                                                                                          children: [
                                                                                            Positioned(
                                                                                              left: 0,
                                                                                              top: 0,
                                                                                              child: Image.network(
                                                                                                'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2F0fd01d89-374f-4cbb-b748-83a0c99ef964.png',
                                                                                                width: 17,
                                                                                                height: 13,
                                                                                                fit: BoxFit.contain,
                                                                                              ),
                                                                                            ),
                                                                                          ],
                                                                                        ),
                                                                                      ),
                                                                                    ),
                                                                                  ],
                                                                                ),
                                                                              ),
                                                                            ),
                                                                          ],
                                                                        ),
                                                                      ),
                                                                    ),
                                                                  ],
                                                                ),
                                                              ),
                                                            ),
                                                            const Positioned(
                                                              left: 43,
                                                              top: 12,
                                                              child: SizedBox(
                                                                width: 121,
                                                                height: 28,
                                                                child: Stack(
                                                                  clipBehavior:
                                                                      Clip.none,
                                                                  children: [
                                                                    Positioned(
                                                                      left: 0,
                                                                      top: 1,
                                                                      child: SizedBox(
                                                                        width:
                                                                            121,
                                                                        height:
                                                                            27,
                                                                        child: Stack(
                                                                          clipBehavior:
                                                                              Clip.none,
                                                                          children: [
                                                                            Positioned(
                                                                              left: -1,
                                                                              top: 0,
                                                                              child: Text(
                                                                                'Switch to patient',
                                                                                style: TextStyle(
                                                                                  color: Color(
                                                                                    0xFF1F2937,
                                                                                  ),
                                                                                  fontSize: 16,
                                                                                  fontWeight: FontWeight.w500,
                                                                                  height: 1.5,
                                                                                  fontFamily: 'Roboto',
                                                                                ),
                                                                              ),
                                                                            ),
                                                                          ],
                                                                        ),
                                                                      ),
                                                                    ),
                                                                  ],
                                                                ),
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            Positioned(
                              left: 0,
                              top: 444,
                              child: Container(
                                width: 393,
                                height: 664,
                                color: const Color(0xFFF4F7F9),
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    Positioned(
                                      left: 0,
                                      top: 0,
                                      child: Container(
                                        width: 393,
                                        height: 664,
                                        color: const Color(0xFFF4F7F9),
                                        child: Stack(
                                          clipBehavior: Clip.none,
                                          children: [
                                            Positioned(
                                              left: 18,
                                              top: 37,
                                              child: Image.network(
                                                'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2Fc59e4a8e-9005-489f-a319-97d1f73321b2.png',
                                                width: 21,
                                                height: 16,
                                                fit: BoxFit.contain,
                                              ),
                                            ),
                                            const Positioned(
                                              left: 51,
                                              top: 25,
                                              child: SizedBox(
                                                width: 158,
                                                child: Text(
                                                  'Activity log',
                                                  style: TextStyle(
                                                    color: Color(0xFF1F2937),
                                                    fontSize: 30,
                                                    fontWeight: FontWeight.bold,
                                                    height: 1.2,
                                                    fontFamily: 'Roboto',
                                                  ),
                                                ),
                                              ),
                                            ),
                                            const Positioned(
                                              left: 15,
                                              top: 75,
                                              child: SizedBox(
                                                width: 363,
                                                child: Text(
                                                  "Margaret's recent actions — medications taken, check-ins, and tasks",
                                                  style: TextStyle(
                                                    color: Color(0xFF667085),
                                                    fontSize: 16,
                                                    height: 1.5,
                                                    fontFamily: 'Roboto',
                                                  ),
                                                ),
                                              ),
                                            ),
                                            Positioned(
                                              left: 16,
                                              top: 136,
                                              child: Container(
                                                width: 124,
                                                height: 52,
                                                decoration: BoxDecoration(
                                                  color: const Color(
                                                    0xFFF3F8FC,
                                                  ),
                                                  border: Border.all(
                                                    width: 2,
                                                    color: const Color(
                                                      0xFF1A73E8,
                                                    ),
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                                child: Stack(
                                                  clipBehavior: Clip.none,
                                                  children: [
                                                    Positioned(
                                                      left: 24,
                                                      top: 21,
                                                      child: Image.network(
                                                        'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2Fc87f7433-5e8a-44f5-be32-8bdb62bec11b.png',
                                                        width: 13,
                                                        height: 12,
                                                        fit: BoxFit.contain,
                                                      ),
                                                    ),
                                                    const Positioned(
                                                      left: 45,
                                                      top: 13,
                                                      child: Text(
                                                        'Refresh',
                                                        textAlign:
                                                            TextAlign.center,
                                                        style: TextStyle(
                                                          color: Color(
                                                            0xFF1A73E8,
                                                          ),
                                                          fontSize: 16,
                                                          fontWeight:
                                                              FontWeight.w500,
                                                          height: 1.5,
                                                          fontFamily: 'Roboto',
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                            Positioned(
                                              left: 16,
                                              top: 200,
                                              child: Container(
                                                width: 186,
                                                height: 52,
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  border: Border.all(
                                                    width: 2,
                                                    color: const Color(
                                                      0xFFD5DBE3,
                                                    ),
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                        9999,
                                                      ),
                                                ),
                                                child: Stack(
                                                  clipBehavior: Clip.none,
                                                  children: [
                                                    Positioned(
                                                      left: 22,
                                                      top: 21,
                                                      child: Container(
                                                        width: 10,
                                                        height: 10,
                                                        clipBehavior:
                                                            Clip.hardEdge,
                                                        decoration: BoxDecoration(
                                                          color: const Color(
                                                            0xFF177245,
                                                          ),
                                                          borderRadius:
                                                              BorderRadius.circular(
                                                                9999,
                                                              ),
                                                        ),
                                                      ),
                                                    ),
                                                    const Positioned(
                                                      left: 39,
                                                      top: 13,
                                                      child: Text(
                                                        'Medication taken',
                                                        style: TextStyle(
                                                          color: Color(
                                                            0xFF1F2937,
                                                          ),
                                                          fontSize: 16,
                                                          fontWeight:
                                                              FontWeight.w500,
                                                          height: 1.5,
                                                          fontFamily: 'Roboto',
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                            Positioned(
                                              left: 16,
                                              top: 264,
                                              child: Container(
                                                width: 218,
                                                height: 52,
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  border: Border.all(
                                                    width: 2,
                                                    color: const Color(
                                                      0xFFD5DBE3,
                                                    ),
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                        9999,
                                                      ),
                                                ),
                                                child: Stack(
                                                  clipBehavior: Clip.none,
                                                  children: [
                                                    Positioned(
                                                      left: 22,
                                                      top: 21,
                                                      child: Container(
                                                        width: 10,
                                                        height: 10,
                                                        clipBehavior:
                                                            Clip.hardEdge,
                                                        decoration: BoxDecoration(
                                                          color: const Color(
                                                            0xFFF59E0B,
                                                          ),
                                                          borderRadius:
                                                              BorderRadius.circular(
                                                                9999,
                                                              ),
                                                        ),
                                                      ),
                                                    ),
                                                    const Positioned(
                                                      left: 39,
                                                      top: 13,
                                                      child: Text(
                                                        'Medication unmarked',
                                                        style: TextStyle(
                                                          color: Color(
                                                            0xFF1F2937,
                                                          ),
                                                          fontSize: 16,
                                                          fontWeight:
                                                              FontWeight.w500,
                                                          height: 1.5,
                                                          fontFamily: 'Roboto',
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                            Positioned(
                                              left: 16,
                                              top: 328,
                                              child: Container(
                                                width: 176,
                                                height: 52,
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  border: Border.all(
                                                    width: 2,
                                                    color: const Color(
                                                      0xFFD5DBE3,
                                                    ),
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                        9999,
                                                      ),
                                                ),
                                                child: Stack(
                                                  clipBehavior: Clip.none,
                                                  children: [
                                                    Positioned(
                                                      left: 22,
                                                      top: 21,
                                                      child: Container(
                                                        width: 10,
                                                        height: 10,
                                                        clipBehavior:
                                                            Clip.hardEdge,
                                                        decoration: BoxDecoration(
                                                          color: const Color(
                                                            0xFF1A73E8,
                                                          ),
                                                          borderRadius:
                                                              BorderRadius.circular(
                                                                9999,
                                                              ),
                                                        ),
                                                      ),
                                                    ),
                                                    const Positioned(
                                                      left: 39,
                                                      top: 13,
                                                      child: Text(
                                                        'Task completed',
                                                        style: TextStyle(
                                                          color: Color(
                                                            0xFF1F2937,
                                                          ),
                                                          fontSize: 16,
                                                          fontWeight:
                                                              FontWeight.w500,
                                                          height: 1.5,
                                                          fontFamily: 'Roboto',
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                            Positioned(
                                              left: 204,
                                              top: 328,
                                              child: Container(
                                                width: 142,
                                                height: 52,
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  border: Border.all(
                                                    width: 2,
                                                    color: const Color(
                                                      0xFFD5DBE3,
                                                    ),
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                        9999,
                                                      ),
                                                ),
                                                child: Stack(
                                                  clipBehavior: Clip.none,
                                                  children: [
                                                    Positioned(
                                                      left: 22,
                                                      top: 21,
                                                      child: Container(
                                                        width: 10,
                                                        height: 10,
                                                        clipBehavior:
                                                            Clip.hardEdge,
                                                        decoration: BoxDecoration(
                                                          color: const Color(
                                                            0xFF177245,
                                                          ),
                                                          borderRadius:
                                                              BorderRadius.circular(
                                                                9999,
                                                              ),
                                                        ),
                                                      ),
                                                    ),
                                                    const Positioned(
                                                      left: 39,
                                                      top: 13,
                                                      child: Text(
                                                        'Checked in',
                                                        style: TextStyle(
                                                          color: Color(
                                                            0xFF1F2937,
                                                          ),
                                                          fontSize: 16,
                                                          fontWeight:
                                                              FontWeight.w500,
                                                          height: 1.5,
                                                          fontFamily: 'Roboto',
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                            Positioned(
                                              left: 16,
                                              top: 328,
                                              child: Container(
                                                width: 361,
                                                height: 271,
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  border: Border.all(
                                                    width: 2,
                                                    color: const Color(
                                                      0xFFC9D1DC,
                                                    ),
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(16),
                                                ),
                                                child: Stack(
                                                  clipBehavior: Clip.none,
                                                  children: [
                                                    Positioned(
                                                      left: 168,
                                                      top: 60,
                                                      child: Image.network(
                                                        'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2Fc7aec751-f5ad-4127-94eb-ce51856e8b86.png',
                                                        width: 28,
                                                        height: 28,
                                                        fit: BoxFit.contain,
                                                      ),
                                                    ),
                                                    const Positioned(
                                                      left: 118,
                                                      top: 106,
                                                      child: Text(
                                                        'No activity yet',
                                                        style: TextStyle(
                                                          color: Color(
                                                            0xFF1F2937,
                                                          ),
                                                          fontSize: 20,
                                                          fontWeight:
                                                              FontWeight.bold,
                                                          height: 1.4,
                                                          fontFamily: 'Roboto',
                                                        ),
                                                      ),
                                                    ),
                                                    const Positioned(
                                                      left: 27,
                                                      top: 146,
                                                      child: SizedBox(
                                                        width: 307,
                                                        child: Text(
                                                          'Events will appear here when Margaret takes medications, completes tasks, or checks in.',
                                                          textAlign:
                                                              TextAlign.center,
                                                          style: TextStyle(
                                                            color: Color(
                                                              0xFF667085,
                                                            ),
                                                            fontSize: 16,
                                                            height: 1.5,
                                                            fontFamily:
                                                                'Roboto',
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget build2(BuildContext context) {
    return Container(
      width: 1024,
      height: 80,
      clipBehavior: Clip.hardEdge,
      decoration: const BoxDecoration(color: Colors.white),
      child: SizedBox(
        width: double.infinity,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned(
              left: 0,
              top: 0,
              child: Image.network(
                'https://storage.googleapis.com/codeless-app.appspot.com/uploads%2Fimages%2F0Sb5PSViLjKVeQFXc566%2F4d1b4092-7ddb-4304-a95a-d03a882c1c7e.png',
                width: 1024,
                height: 80,
                fit: BoxFit.contain,
              ),
            ),
            Positioned(
              left: 82,
              top: 38,
              child: Text(
                'Home ',
                textAlign: TextAlign.center,
                style: GoogleFonts.getFont(
                  'Inter',
                  color: const Color(0xFFD4E4FF),
                  fontSize: 14,
                ),
              ),
            ),
            Positioned(
              left: 267,
              top: 38,
              child: Text(
                'Medications ',
                textAlign: TextAlign.center,
                style: GoogleFonts.getFont(
                  'Inter',
                  color: const Color(0xFFD4E4FF),
                  fontSize: 14,
                ),
              ),
            ),
            Positioned(
              left: 466,
              top: 38,
              child: Text(
                'Appointments ',
                textAlign: TextAlign.center,
                style: GoogleFonts.getFont(
                  'Inter',
                  color: const Color(0xFFD4E4FF),
                  fontSize: 14,
                ),
              ),
            ),
            Positioned(
              left: 683,
              top: 38,
              child: Text(
                'Messages ',
                textAlign: TextAlign.center,
                style: GoogleFonts.getFont(
                  'Inter',
                  color: const Color(0xFFD4E4FF),
                  fontSize: 14,
                ),
              ),
            ),
            Positioned(
              left: 907,
              top: 38,
              child: Text(
                'Help ',
                textAlign: TextAlign.center,
                style: GoogleFonts.getFont(
                  'Inter',
                  color: const Color(0xFFD4E4FF),
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

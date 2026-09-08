import 'dart:io';

import 'package:careconnect_mobile/services/json_store.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('FileJsonStore', () {
    late Directory temp;

    setUp(() => temp = Directory.systemTemp.createTempSync('careconnect_test'));
    tearDown(() => temp.deleteSync(recursive: true));

    // The DirectoryResolver seam means even the REAL store is testable without
    // path_provider, without a device and without channel mocking.
    FileJsonStore store() =>
        FileJsonStore(directoryResolver: () async => temp);

    test('reports a missing document as null', () async {
      expect(await store().readString('nope.json'), isNull);
      expect(await store().exists('nope.json'), isFalse);
    });

    test('writes atomically and reads back', () async {
      final s = store();
      await s.writeString('meds.json', '[{"id":"a"}]');
      expect(await s.exists('meds.json'), isTrue);
      expect(await s.readString('meds.json'), '[{"id":"a"}]');
      // The temp sibling used for the atomic rename must not survive.
      expect(File('${temp.path}/meds.json.tmp').existsSync(), isFalse);
    });

    test('overwrites and deletes', () async {
      final s = store();
      await s.writeString('meds.json', 'one');
      await s.writeString('meds.json', 'two');
      expect(await s.readString('meds.json'), 'two');
      await s.delete('meds.json');
      expect(await s.exists('meds.json'), isFalse);
      await s.delete('meds.json'); // deleting twice is safe
    });
  });

  group('InMemoryJsonStore', () {
    test('counts reads and writes and can simulate failure', () async {
      final s = InMemoryJsonStore({'seed.json': '[]'});
      expect(await s.readString('seed.json'), '[]');
      expect(s.readCount, 1);

      await s.writeString('a.json', 'x');
      expect(s.writeCount, 1);
      expect(s.documents['a.json'], 'x');

      s.failOnWrite = StateError('disk full');
      expect(() => s.writeString('a.json', 'y'), throwsStateError);
    });
  });
}

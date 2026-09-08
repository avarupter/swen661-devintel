import 'dart:async';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

/// A named-document key/value store for JSON text.
///
/// This interface exists because `PatientProvider` calls
/// `getApplicationDocumentsDirectory()` directly. That is a platform-channel
/// call: under `flutter_test` there is no plugin registered, so it throws
/// `MissingPluginException` and the provider becomes impossible to unit test
/// without channel mocking. Depending on this interface instead means the new
/// providers need ZERO plugin mocking — tests inject [InMemoryJsonStore].
abstract interface class JsonStore {
  Future<bool> exists(String fileName);

  /// Returns null when the document does not exist.
  Future<String?> readString(String fileName);

  Future<void> writeString(String fileName, String contents);

  Future<void> delete(String fileName);
}

/// Resolves the directory documents are written to. Injectable so even the
/// real store can be exercised against a temp directory in an integration
/// test without touching path_provider.
typedef DirectoryResolver = Future<Directory> Function();

/// Production implementation, backed by the app documents directory.
class FileJsonStore implements JsonStore {
  FileJsonStore({DirectoryResolver? directoryResolver})
    : _resolveDirectory = directoryResolver ?? getApplicationDocumentsDirectory;

  final DirectoryResolver _resolveDirectory;
  Directory? _cached;

  Future<File> _file(String fileName) async {
    final dir = _cached ??= await _resolveDirectory();
    return File('${dir.path}/$fileName');
  }

  @override
  Future<bool> exists(String fileName) async => (await _file(fileName)).exists();

  @override
  Future<String?> readString(String fileName) async {
    final file = await _file(fileName);
    if (!await file.exists()) return null;
    return file.readAsString();
  }

  @override
  Future<void> writeString(String fileName, String contents) async {
    final file = await _file(fileName);
    // Write to a temp sibling then rename: an app killed mid-write can never
    // leave a half-written JSON document that fails to parse on next launch.
    final temp = File('${file.path}.tmp');
    await temp.writeAsString(contents, flush: true);
    await temp.rename(file.path);
  }

  @override
  Future<void> delete(String fileName) async {
    final file = await _file(fileName);
    if (await file.exists()) await file.delete();
  }
}

/// Test double. Fast, synchronous-ish, and able to simulate failure.
class InMemoryJsonStore implements JsonStore {
  InMemoryJsonStore([Map<String, String>? initial])
    : _documents = {...?initial};

  final Map<String, String> _documents;

  /// Observable counters so tests can assert "saved exactly once".
  int readCount = 0;
  int writeCount = 0;

  /// Set to throw from the next read/write, to test error paths.
  Object? failOnRead;
  Object? failOnWrite;

  /// Artificial latency so tests can prove the UI shows a loading state.
  Duration latency = Duration.zero;

  Map<String, String> get documents => Map.unmodifiable(_documents);

  Future<void> _tick() =>
      latency == Duration.zero ? Future<void>.value() : Future.delayed(latency);

  @override
  Future<bool> exists(String fileName) async {
    await _tick();
    return _documents.containsKey(fileName);
  }

  @override
  Future<String?> readString(String fileName) async {
    await _tick();
    readCount++;
    final failure = failOnRead;
    if (failure != null) throw failure;
    return _documents[fileName];
  }

  @override
  Future<void> writeString(String fileName, String contents) async {
    await _tick();
    writeCount++;
    final failure = failOnWrite;
    if (failure != null) throw failure;
    _documents[fileName] = contents;
  }

  @override
  Future<void> delete(String fileName) async {
    await _tick();
    _documents.remove(fileName);
  }
}

class Patient {
  final String id;
  final String name;
  final int age;
  final String condition;

  Patient({
    required this.id,
    required this.name,
    required this.age,
    required this.condition,
  });

  // Convert Patient object to JSON (for saving)
  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'age': age,
        'condition': condition,
      };

  // Create Patient object from JSON (for loading)
  factory Patient.fromJson(Map<String, dynamic> json) => Patient(
        id: json['id'],
        name: json['name'],
        age: json['age'],
        condition: json['condition'],
      );
}
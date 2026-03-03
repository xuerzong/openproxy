use nanoid::nanoid;

const ALPHABET: [char; 33] = [
    '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
    'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
];

pub fn generate_db_id(length: usize) -> String {
    nanoid!(length, &ALPHABET)
}

#[test]
fn test_id_gen() {
    let id = generate_db_id(21);
    println!("Generated ID: {}", id);
    assert_eq!(id.len(), 21);
}

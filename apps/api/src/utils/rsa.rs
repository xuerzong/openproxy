use base64::{prelude::BASE64_STANDARD, Engine};
use rsa::pkcs1::DecodeRsaPrivateKey; // fallback for BEGIN RSA PRIVATE KEY (PKCS#1) format
use rsa::pkcs8::{DecodePrivateKey, DecodePublicKey};
use rsa::{Oaep, RsaPrivateKey, RsaPublicKey};
use sha2::Sha256;

pub struct RsaCrypto;

impl RsaCrypto {
    pub fn encrypt(
        data: &str,
        public_key_pem: &str,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // 1. Normalize escaped newlines in the PEM string
        let pem = public_key_pem.replace("\\n", "\n");
        let pub_key = RsaPublicKey::from_public_key_pem(pem.trim())?;

        // 2. Prepare OAEP padding with SHA-256
        let mut rng = rand::thread_rng();
        let padding = Oaep::new::<Sha256>();

        // 3. Encrypt
        let encrypted_bytes = pub_key.encrypt(&mut rng, padding, data.as_bytes())?;

        Ok(BASE64_STANDARD.encode(encrypted_bytes))
    }

    pub fn decrypt(
        encrypted_base64: &str,
        private_key_pem: &str,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // 1. Normalize escaped newlines in the PEM string
        let pem = private_key_pem.replace("\\n", "\n").trim().to_string();

        // 2. Auto-detect PKCS#1 or PKCS#8 format and parse accordingly
        let priv_key = if pem.contains("BEGIN RSA PRIVATE KEY") {
            RsaPrivateKey::from_pkcs1_pem(&pem)?
        } else {
            RsaPrivateKey::from_pkcs8_pem(&pem)?
        };

        // 3. Base64-decode the ciphertext
        let encrypted_bytes = BASE64_STANDARD.decode(encrypted_base64.trim())?;

        // 4. Decrypt using OAEP (SHA-256)
        let padding = Oaep::new::<Sha256>();
        let decrypted_bytes = priv_key.decrypt(padding, &encrypted_bytes)?;

        Ok(String::from_utf8(decrypted_bytes)?)
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use rsa::pkcs8::{EncodePrivateKey, EncodePublicKey, LineEnding};

    fn generate_test_keys() -> (String, String) {
        let mut rng = rand::thread_rng();
        let private_key =
            RsaPrivateKey::new(&mut rng, 2048).expect("private key generation failed");
        let public_key = RsaPublicKey::from(&private_key);

        let public_key_pem = public_key
            .to_public_key_pem(LineEnding::LF)
            .expect("public key pem encoding failed");
        let private_key_pem = private_key
            .to_pkcs8_pem(LineEnding::LF)
            .expect("private key pem encoding failed")
            .to_string();

        (public_key_pem, private_key_pem)
    }

    #[test]
    fn test_rsa_encrypt_decrypt_flow() {
        let (public_key, private_key) = generate_test_keys();

        let original_text = "sk-your-own-api-key";

        let encrypted_base64 =
            RsaCrypto::encrypt(original_text, &public_key).expect("Encryption failed");

        println!("Encrypted (Base64): {}", encrypted_base64);
        assert!(!encrypted_base64.is_empty());

        let decrypted_text =
            RsaCrypto::decrypt(&encrypted_base64, &private_key).expect("Decryption failed");

        assert_eq!(original_text, decrypted_text);
        println!("Decrypted text matches original!");
    }

    #[test]
    fn test_decrypt_invalid_ciphertext_returns_error() {
        let (_, private_key) = generate_test_keys();

        let invalid_encrypted_base64 = "aW52YWxpZC1jaXBoZXJ0ZXh0";
        let result = RsaCrypto::decrypt(invalid_encrypted_base64, &private_key);

        assert!(result.is_err());
    }
}

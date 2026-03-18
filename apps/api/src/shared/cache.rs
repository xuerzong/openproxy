use std::{
    collections::HashMap,
    sync::{OnceLock, RwLock},
    time::{Duration, Instant},
};

const DECRYPTED_PROVIDER_KEY_CACHE_TTL: Duration = Duration::from_secs(60 * 60);

struct KeyCache {
    items: HashMap<String, String>,
    last_reset_at: Instant,
    ttl: Duration,
}

impl KeyCache {
    fn new(ttl: Duration) -> Self {
        Self {
            items: HashMap::new(),
            last_reset_at: Instant::now(),
            ttl,
        }
    }

    fn reset_if_expired(&mut self) {
        if self.last_reset_at.elapsed() >= self.ttl {
            self.items.clear();
            self.last_reset_at = Instant::now();
        }
    }

    fn get(&mut self, key: &str) -> Option<String> {
        self.reset_if_expired();
        self.items.get(key).cloned()
    }

    fn set(&mut self, key: String, value: String) {
        self.reset_if_expired();
        self.items.insert(key, value);
    }

    #[cfg(test)]
    fn clear(&mut self) {
        self.items.clear();
        self.last_reset_at = Instant::now();
    }

    #[cfg(test)]
    fn force_expire(&mut self) {
        self.last_reset_at = Instant::now() - self.ttl;
    }
}

struct DecryptedProviderKeyCache {
    inner: KeyCache,
}

impl DecryptedProviderKeyCache {
    fn new() -> Self {
        Self {
            inner: KeyCache::new(DECRYPTED_PROVIDER_KEY_CACHE_TTL),
        }
    }

    fn get(&mut self, encrypted_key: &str) -> Option<String> {
        self.inner.get(encrypted_key)
    }

    fn set(&mut self, encrypted_key: String, decrypted_key: String) {
        self.inner.set(encrypted_key, decrypted_key);
    }
}

static DECRYPTED_PROVIDER_KEY_CACHE: OnceLock<RwLock<DecryptedProviderKeyCache>> = OnceLock::new();

fn decrypted_provider_key_cache() -> &'static RwLock<DecryptedProviderKeyCache> {
    DECRYPTED_PROVIDER_KEY_CACHE.get_or_init(|| RwLock::new(DecryptedProviderKeyCache::new()))
}

pub fn get_decrypted_provider_key(encrypted_key: &str) -> Option<String> {
    let mut cache = decrypted_provider_key_cache().write().ok()?;
    cache.get(encrypted_key)
}

pub fn set_decrypted_provider_key(encrypted_key: String, decrypted_key: String) {
    if let Ok(mut cache) = decrypted_provider_key_cache().write() {
        cache.set(encrypted_key, decrypted_key);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cache_resets_after_ttl() {
        let key = "enc-key".to_string();
        let value = "dec-key".to_string();

        {
            let mut cache = decrypted_provider_key_cache()
                .write()
                .expect("cache lock poisoned");
            cache.inner.clear();
        }

        set_decrypted_provider_key(key.clone(), value);
        assert_eq!(
            get_decrypted_provider_key(&key),
            Some("dec-key".to_string())
        );

        {
            let mut cache = decrypted_provider_key_cache()
                .write()
                .expect("cache lock poisoned");
            cache.inner.force_expire();
        }

        assert_eq!(get_decrypted_provider_key(&key), None);
    }
}

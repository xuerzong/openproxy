use std::{
    collections::{HashMap, HashSet, VecDeque},
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

// ---------------------------------------------------------------------------
// Recent-usage cache: tracks the last N (provider_id, api_key_hash) combos
// used per user API key, so the proxy can prefer fresh combos on the next
// request.  N = min(10, total_combinations_for_that_user).
// ---------------------------------------------------------------------------

struct RecentUsageCache {
    /// api_key_id  →  ring-buffer of (provider_id, api_key_hash)
    items: HashMap<String, VecDeque<(String, String)>>,
}

impl RecentUsageCache {
    fn new() -> Self {
        Self {
            items: HashMap::new(),
        }
    }

    fn record(
        &mut self,
        api_key_id: &str,
        provider_id: String,
        api_key_hash: String,
        window: usize,
    ) {
        if window == 0 {
            return;
        }
        let deque = self.items.entry(api_key_id.to_string()).or_default();
        deque.push_back((provider_id, api_key_hash));
        while deque.len() > window {
            deque.pop_front();
        }
    }

    fn get_set(&self, api_key_id: &str) -> HashSet<(String, String)> {
        self.items
            .get(api_key_id)
            .map(|d| d.iter().cloned().collect())
            .unwrap_or_default()
    }
}

static RECENT_USAGE_CACHE: OnceLock<RwLock<RecentUsageCache>> = OnceLock::new();

fn recent_usage_cache() -> &'static RwLock<RecentUsageCache> {
    RECENT_USAGE_CACHE.get_or_init(|| RwLock::new(RecentUsageCache::new()))
}

/// Returns the set of (provider_id, api_key_hash) combos used in the last
/// window requests for the given user API key.
pub fn get_recent_combos(api_key_id: &str) -> HashSet<(String, String)> {
    recent_usage_cache()
        .read()
        .ok()
        .map(|c| c.get_set(api_key_id))
        .unwrap_or_default()
}

/// Records that `(provider_id, api_key_hash)` was used for `api_key_id`.
/// `window` controls the maximum number of combos retained (normally
/// `min(10, total_combos)` computed at the call site).
pub fn record_used_combo(api_key_id: &str, provider_id: &str, api_key_hash: &str, window: usize) {
    if let Ok(mut cache) = recent_usage_cache().write() {
        cache.record(
            api_key_id,
            provider_id.to_string(),
            api_key_hash.to_string(),
            window,
        );
    }
}

#[cfg(test)]
pub fn clear_recent_combos_for(api_key_id: &str) {
    if let Ok(mut cache) = recent_usage_cache().write() {
        cache.items.remove(api_key_id);
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

    // ------------------------------------------------------------------
    // RecentUsageCache tests
    // ------------------------------------------------------------------

    #[test]
    fn recent_combos_empty_for_unknown_user() {
        let combos = get_recent_combos("recent-test-unknown-user-xyz");
        assert!(combos.is_empty());
    }

    #[test]
    fn record_and_retrieve_single_combo() {
        let uid = "recent-test-single";
        clear_recent_combos_for(uid);

        record_used_combo(uid, "provider-a", "hash-1", 10);

        let combos = get_recent_combos(uid);
        assert!(combos.contains(&("provider-a".to_string(), "hash-1".to_string())));
        assert_eq!(combos.len(), 1);
    }

    #[test]
    fn window_evicts_oldest_entry() {
        let uid = "recent-test-window-evict";
        clear_recent_combos_for(uid);

        record_used_combo(uid, "provider-a", "hash-1", 2);
        record_used_combo(uid, "provider-b", "hash-2", 2);
        // Third push should evict the first entry (window = 2)
        record_used_combo(uid, "provider-c", "hash-3", 2);

        let combos = get_recent_combos(uid);
        assert!(!combos.contains(&("provider-a".to_string(), "hash-1".to_string())));
        assert!(combos.contains(&("provider-b".to_string(), "hash-2".to_string())));
        assert!(combos.contains(&("provider-c".to_string(), "hash-3".to_string())));
    }

    #[test]
    fn window_capped_at_10() {
        let uid = "recent-test-cap-10";
        clear_recent_combos_for(uid);

        // Record 15 distinct combos all with window = 10
        for i in 0..15usize {
            record_used_combo(uid, &format!("provider-{i}"), "hash", 10);
        }

        // Only the last 10 must be retained
        let cache = recent_usage_cache().read().expect("lock poisoned");
        let deque = cache.items.get(uid).expect("entry must exist");
        assert_eq!(deque.len(), 10);

        // The first 5 should have been evicted
        for i in 0..5usize {
            assert!(
                !deque.contains(&(format!("provider-{i}"), "hash".to_string())),
                "provider-{i} should have been evicted"
            );
        }
        // The last 10 must be present
        for i in 5..15usize {
            assert!(
                deque.contains(&(format!("provider-{i}"), "hash".to_string())),
                "provider-{i} should still be in the window"
            );
        }
    }

    #[test]
    fn window_zero_records_nothing() {
        let uid = "recent-test-zero-window";
        clear_recent_combos_for(uid);

        record_used_combo(uid, "provider-a", "hash-1", 0);

        let combos = get_recent_combos(uid);
        assert!(combos.is_empty());
    }

    #[test]
    fn same_combo_allowed_multiple_times_in_deque() {
        let uid = "recent-test-repeat-combo";
        clear_recent_combos_for(uid);

        // Push the same combo twice with window = 3
        record_used_combo(uid, "provider-a", "hash-1", 3);
        record_used_combo(uid, "provider-a", "hash-1", 3);
        record_used_combo(uid, "provider-b", "hash-2", 3);

        // Deque should have 3 entries (two (a,1) + one (b,2))
        let cache = recent_usage_cache().read().expect("lock poisoned");
        let deque = cache.items.get(uid).expect("entry must exist");
        assert_eq!(deque.len(), 3);
        // Both combos in the set
        let set: HashSet<_> = deque.iter().cloned().collect();
        assert!(set.contains(&("provider-a".to_string(), "hash-1".to_string())));
        assert!(set.contains(&("provider-b".to_string(), "hash-2".to_string())));
    }
}

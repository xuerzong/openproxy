use std::{env, sync::OnceLock};

static REDIS_CLIENT: OnceLock<redis::Client> = OnceLock::new();

fn redis_client() -> Option<&'static redis::Client> {
    if let Some(client) = REDIS_CLIENT.get() {
        return Some(client);
    }

    let redis_url = env::var("REDIS_URL").ok()?;
    let client = redis::Client::open(redis_url).ok()?;

    let _ = REDIS_CLIENT.set(client);
    REDIS_CLIENT.get()
}

fn redis_connection() -> Option<redis::Connection> {
    redis_client()?.get_connection().ok()
}

pub fn get_cached_string(key: &str) -> Option<String> {
    let mut conn = redis_connection()?;
    redis::cmd("GET").arg(key).query::<String>(&mut conn).ok()
}

pub fn set_cached_string(key: &str, value: &str, ttl_seconds: usize) {
    if let Some(mut conn) = redis_connection() {
        let _: redis::RedisResult<()> = redis::cmd("SETEX")
            .arg(key)
            .arg(ttl_seconds)
            .arg(value)
            .query(&mut conn);
    }
}

pub fn incr_with_expire(key: &str, ttl_seconds: usize) -> Option<i64> {
    let mut conn = redis_connection()?;
    let current = redis::cmd("INCR").arg(key).query::<i64>(&mut conn).ok()?;

    if current == 1 {
        let _: redis::RedisResult<()> = redis::cmd("EXPIRE")
            .arg(key)
            .arg(ttl_seconds)
            .query(&mut conn);
    }

    Some(current)
}

pub fn list_range(key: &str, start: isize, stop: isize) -> Option<Vec<String>> {
    let mut conn = redis_connection()?;
    redis::cmd("LRANGE")
        .arg(key)
        .arg(start)
        .arg(stop)
        .query::<Vec<String>>(&mut conn)
        .ok()
}

pub fn list_push_trim_expire(
    key: &str,
    value: &str,
    trim_start: isize,
    trim_stop: isize,
    ttl_seconds: usize,
) -> bool {
    let Some(mut conn) = redis_connection() else {
        return false;
    };

    let push_ok = redis::cmd("RPUSH")
        .arg(key)
        .arg(value)
        .query::<i64>(&mut conn)
        .is_ok();
    if !push_ok {
        return false;
    }

    let trim_ok = redis::cmd("LTRIM")
        .arg(key)
        .arg(trim_start)
        .arg(trim_stop)
        .query::<()>(&mut conn)
        .is_ok();
    if !trim_ok {
        return false;
    }

    redis::cmd("EXPIRE")
        .arg(key)
        .arg(ttl_seconds)
        .query::<bool>(&mut conn)
        .unwrap_or(false)
}

pub fn delete_key(key: &str) {
    if let Some(mut conn) = redis_connection() {
        let _: redis::RedisResult<()> = redis::cmd("DEL").arg(key).query(&mut conn);
    }
}

pub fn set_add_with_expire(key: &str, member: &str, ttl_seconds: usize) -> bool {
    let Some(mut conn) = redis_connection() else {
        return false;
    };

    let added = redis::cmd("SADD")
        .arg(key)
        .arg(member)
        .query::<i64>(&mut conn)
        .is_ok();
    if !added {
        return false;
    }

    redis::cmd("EXPIRE")
        .arg(key)
        .arg(ttl_seconds)
        .query::<bool>(&mut conn)
        .unwrap_or(false)
}

pub fn set_members(key: &str) -> Option<Vec<String>> {
    let mut conn = redis_connection()?;
    redis::cmd("SMEMBERS")
        .arg(key)
        .query::<Vec<String>>(&mut conn)
        .ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn no_redis_returns_none_for_get() {
        let val = get_cached_string("unit:test:key");
        assert!(val.is_none());
    }
}

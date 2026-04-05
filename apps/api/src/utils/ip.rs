use axum::http::HeaderMap;

fn first_ip_from_forwarded(raw: &str) -> Option<&str> {
    raw.split(',').next().map(str::trim).filter(|v| !v.is_empty())
}

pub fn read_header_value(headers: &HeaderMap, name: &str) -> Option<String> {
    headers
        .get(name)
        .and_then(|v| v.to_str().ok())
        .map(str::trim)
        .filter(|v| !v.is_empty())
        .map(str::to_string)
}

pub fn extract_client_ip(headers: &HeaderMap) -> String {
    if let Some(ip) = read_header_value(headers, "cf-connecting-ip") {
        return ip;
    }

    if let Some(forwarded) = read_header_value(headers, "x-forwarded-for")
        && let Some(ip) = first_ip_from_forwarded(&forwarded)
    {
        return ip.to_string();
    }

    if let Some(ip) = read_header_value(headers, "x-real-ip") {
        return ip;
    }

    "unknown-ip".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_first_forwarded_ip() {
        let mut headers = HeaderMap::new();
        headers.insert("x-forwarded-for", "198.51.100.8, 10.0.0.1".parse().unwrap());

        assert_eq!(extract_client_ip(&headers), "198.51.100.8");
    }

    #[test]
    fn falls_back_to_unknown_ip_when_headers_missing() {
        let headers = HeaderMap::new();
        assert_eq!(extract_client_ip(&headers), "unknown-ip");
    }
}

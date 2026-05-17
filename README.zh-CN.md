# OpenProxy

OpenProxy 是一款自部署的 AI API 代理服务，支持多家 AI 服务商统一接入，具备 API 密钥管理、用量统计、Web 管理后台等功能。

[文档](https://openproxy.sh)

## 功能特性

- **统一 API**：兼容 OpenAI（/v1/chat/completions）和 Anthropic（/v1/messages）接口
- **多供应商容灾**：同一模型可配置多个后端，权重随机分流，自动故障切换
- **多 Key 轮换**：每个供应商可配置多个 API Key。代理会记录每个用户 API Key 最近 N 次请求命中的 `(供应商, Key)` 组合（N = min(10, 组合总数)），下次请求时优先选择未近期使用的组合，均摊负载并降低触发限速的风险
- **API Key 管理**：支持额度、请求次数、过期时间、模型访问控制
- **用量统计**：按请求统计费用、响应时间、供应商归属
- **管理后台**：模型、供应商、用户、订单管理
- **租户仪表盘**：用量图表、余额、历史请求
- **密钥加密存储**：供应商 API Key 使用 RSA 加密存储
- **多方式认证**：邮箱、手机、GitHub、Google（集成 better-auth）

### 示例

```bash
curl http://localhost:5060/v1/chat/completions \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## License

[MIT](./LICENSE)


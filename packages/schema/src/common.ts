import z from './zod'

const HttpUrlPattern =
  /^https:\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?$/

export const HttpUrlSchema = z.string().min(1).max(256).regex(HttpUrlPattern, {
  error: '请输入正确的链接地址',
})

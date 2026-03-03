export const EmailRule: any[] = [
  { required: true, message: '请输入邮箱', validateTrigger: 'onSubmit' },
  { type: 'email', message: '请输出正确的邮箱', validateTrigger: 'onSubmit' },
]

export const PasswordRule: any[] = [
  { required: true, message: '请输出密码', validateTrigger: 'onSubmit' },
  {
    pattern: /^[a-zA-Z0-9!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]{6,}$/,
    message: '密码长度至少为8位，仅支持字母、数字及特殊符号。',
    validateTrigger: 'onSubmit',
  },
]

export const CharNameRule: any = {
  pattern: new RegExp(/^[a-zA-Z0-9/\._-]+$/),
  message: '仅支持英文、数字、斜杠(/)、下划线(_)或连字符(-)或小数点(.)',
}

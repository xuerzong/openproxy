import { PayStatus } from '@server/constants/pay'

export const supportedModelOwnedBy = [
  'alibaba',
  'anthropic',
  'bytedance',
  'deepseek',
  'google',
  'minimax',
  'moonshotai',
  'openai',
  'xai',
  'zai',
  'other',
]

export const supportedModelStyles = ['openai', 'anthropic']

export const supportedPayStatus = {
  [PayStatus.PENDING]: {
    color: 'yellow',
    label: '待支付',
  },
  [PayStatus.SUCCESS]: {
    color: 'green',
    label: '支付成功',
  },
  [PayStatus.FAIL]: {
    color: 'red',
    label: '支付失败',
  },
  [PayStatus.CANCELED]: {
    color: 'gray',
    label: '取消支付',
  },
}

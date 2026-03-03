import { generateKeyPairSync } from 'node:crypto'

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
})

console.log('公钥已生成', publicKey.split('\n').join('\\n'))
console.log('私钥已生成', privateKey.split('\n').join('\\n'))

console.log('--- 公钥 ---')
console.log(publicKey.replace(/\\n/g, '\n'))
console.log('--- 私钥 ---')
console.log(privateKey.replace(/\\n/g, '\n'))

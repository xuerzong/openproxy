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

console.log('Public key generated', publicKey.split('\n').join('\\n'))
console.log('Private key generated', privateKey.split('\n').join('\\n'))

console.log('--- Public Key ---')
console.log(publicKey.replace(/\\n/g, '\n'))
console.log('--- Private Key ---')
console.log(privateKey.replace(/\\n/g, '\n'))

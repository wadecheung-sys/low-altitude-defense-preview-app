import fs from 'fs'

const s = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n')
const uuid = '048c9b92c6c9430b83263b64162b2aab'
const idx = s.indexOf(uuid)
const chunk = s.slice(Math.max(0, idx - 25000), idx + 8000)
fs.writeFileSync(process.argv[3], chunk, 'utf8')
console.log('len', chunk.length, 'idx', idx)

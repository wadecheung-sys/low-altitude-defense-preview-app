import fs from 'fs'

const file = process.argv[2]
const uuid = '1f5edc0d7f404f2b91cd00537d260a2a'
const s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
const idx = s.indexOf(uuid)
const chunk = s.slice(Math.max(0, idx - 6000), idx + 500)
fs.writeFileSync(process.argv[3], chunk, 'utf8')
console.log('idx', idx, 'len', chunk.length)

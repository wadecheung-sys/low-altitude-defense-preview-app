import fs from 'fs'

const s = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n')
const id = process.argv[3]
const out = []
let idx = 0
let n = 0
while (n < 20) {
  idx = s.indexOf(id, idx)
  if (idx < 0) break
  out.push(`--- ${n} @ ${idx} ---`)
  out.push(s.slice(Math.max(0, idx - 200), idx + 800))
  out.push('')
  idx += id.length
  n++
}
fs.writeFileSync(process.argv[4], out.join('\n'), 'utf8')

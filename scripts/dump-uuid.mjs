import fs from 'fs'

const file = process.argv[2]
const uuid = process.argv[3]
const s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')

let idx = 0
let n = 0
while (n < 10) {
  idx = s.indexOf(uuid, idx)
  if (idx < 0) break
  console.log(`=== hit ${n} @ ${idx} ===`)
  console.log(s.slice(Math.max(0, idx - 500), idx + 3500))
  console.log('')
  idx += uuid.length
  n++
}

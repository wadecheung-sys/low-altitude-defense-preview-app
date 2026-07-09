import fs from 'fs'

const file = process.argv[2]
const needle = process.argv[3] || '显示 确认操作-1'
const s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')

let idx = 0
let n = 0
while (n < 5) {
  idx = s.indexOf(needle, idx)
  if (idx < 0) break
  console.log(`=== ${needle} @ ${idx} ===`)
  console.log(s.slice(Math.max(0, idx - 1500), idx + 2500))
  console.log('')
  idx += needle.length
  n++
}

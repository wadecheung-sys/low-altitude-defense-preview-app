import fs from 'fs'

const file = process.argv[2]
const uuid = process.argv[3]
const s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')

let idx = 0
let n = 0
while (n < 20) {
  idx = s.indexOf(uuid, idx)
  if (idx < 0) break
  const chunk = s.slice(Math.max(0, idx - 800), idx + 4000)
  if (/onClick|cases|interactionMap|显示 确认|二次提示|解除/.test(chunk)) {
    console.log(`=== hit ${n} @ ${idx} ===`)
    console.log(chunk)
    console.log('')
    n++
  }
  idx += uuid.length
}

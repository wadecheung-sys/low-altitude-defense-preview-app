import fs from 'fs'

const s = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n')
const needles = [
  '048c9b92c6c9430b83263b64162b2aab',
  'a077d12116b04cf88f88d288785646e0',
  'u293',
  'u314',
  'u140',
  'u138',
  '激光 打击',
  '解除反制',
  '是否确认关闭',
  '确认执行'
]
const out = []
for (const needle of needles) {
  let idx = 0
  let count = 0
  while (count < 3) {
    idx = s.indexOf(needle, idx)
    if (idx < 0) break
    out.push(`=== ${needle} @ ${idx} ===`)
    out.push(s.slice(Math.max(0, idx - 300), idx + 1200))
    out.push('')
    idx += needle.length
    count++
  }
}
fs.writeFileSync(process.argv[3], out.join('\n'), 'utf8')

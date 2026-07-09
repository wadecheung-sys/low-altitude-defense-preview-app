import fs from 'fs'

const file = process.argv[2]
const outFile = process.argv[3]
const needles = ['u138', '解除', '激光 打击 to', 'if 选中状态 激光', '1f5edc0d7f404f2b91cd00537d260a2a']
const s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
const lines = []

for (const needle of needles) {
  let idx = 0
  let n = 0
  while (n < 3) {
    idx = s.indexOf(needle, idx)
    if (idx < 0) break
    lines.push(`=== ${needle} @ ${idx} ===`)
    lines.push(s.slice(Math.max(0, idx - 600), idx + 2000))
    lines.push('')
    idx += needle.length
    n++
  }
}

fs.writeFileSync(outFile, lines.join('\n'), 'utf8')
console.log('written', outFile)

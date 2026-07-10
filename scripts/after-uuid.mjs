import fs from 'fs'

const s = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n')
const lines = []

for (const uuid of ['048c9b92c6c9430b83263b64162b2aab', 'a077d12116b04cf88f88d288785646e0']) {
  const idx = s.indexOf(`="${uuid}"`)
  if (idx < 0) {
    lines.push(`missing ${uuid}`)
    continue
  }
  lines.push(`\n=== after ${uuid} @ ${idx} ===`)
  lines.push(s.slice(idx, idx + 12000))
}

fs.writeFileSync(process.argv[3], lines.join('\n'), 'utf8')

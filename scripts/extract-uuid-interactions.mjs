import fs from 'fs'

const s = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n')
const ids = {
  u140: '048c9b92c6c9430b83263b64162b2aab',
  u138: 'a077d12116b04cf88f88d288785646e0',
  u324: '4284adabcf84452c81a1992e6873b4e9'
}
const out = []
for (const [label, uuid] of Object.entries(ids)) {
  let idx = 0
  while (true) {
    idx = s.indexOf(uuid, idx)
    if (idx < 0) break
    const chunk = s.slice(Math.max(0, idx - 600), idx + 1800)
    if (/onClick|onSelect|onUnselect|cases|interactionMap|显示|隐藏|fire/.test(chunk)) {
      out.push(`=== ${label} ${uuid} @ ${idx} ===`)
      out.push(chunk)
      out.push('')
    }
    idx += uuid.length
  }
}
fs.writeFileSync(process.argv[3], out.join('\n'), 'utf8')

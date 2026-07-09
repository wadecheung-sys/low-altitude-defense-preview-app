import fs from 'fs'

function load(path) {
  return fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
}

const newS = load(process.argv[2])
const oldS = load(process.argv[3])
const out = []

for (const id of ['u140', 'u138']) {
  out.push(`# ${id}`)
  let idx = 0
  let n = 0
  while (n < 5) {
    idx = newS.indexOf(id, idx)
    if (idx < 0) break
    const chunk = newS.slice(Math.max(0, idx - 120), idx + 500)
    if (/onClick|cases|action|panel|fade|show|hide|u314|u293|u283|u304|u300/i.test(chunk)) {
      out.push(`--- new hit ${n} @${idx} ---`)
      out.push(chunk)
      out.push('')
      n++
    }
    idx += id.length
  }
  idx = 0
  n = 0
  while (n < 5) {
    idx = oldS.indexOf(id, idx)
    if (idx < 0) break
    const chunk = oldS.slice(Math.max(0, idx - 120), idx + 500)
    if (/onClick|cases|action|panel|fade|show|hide|u314|u293|u283|u304|u300/i.test(chunk)) {
      out.push(`--- old hit ${n} @${idx} ---`)
      out.push(chunk)
      out.push('')
      n++
    }
    idx += id.length
  }
}

fs.writeFileSync(process.argv[4], out.join('\n'), 'utf8')
console.log('done')

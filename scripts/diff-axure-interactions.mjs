import fs from 'fs'

function load(path) {
  return fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
}

const newFile = process.argv[2]
const oldFile = process.argv[3]
const newS = load(newFile)
const oldS = load(oldFile)

function extractAround(s, needle, radius = 2500) {
  const out = []
  let idx = 0
  while (idx >= 0) {
    idx = s.indexOf(needle, idx)
    if (idx < 0) break
    out.push(s.slice(Math.max(0, idx - radius), idx + radius))
    idx += needle.length
  }
  return out
}

const ids = ['u140', 'u138', 'u314', 'u293', 'u283', 'u304', 'u300', 'u321', 'u322']
const lines = []

for (const id of ids) {
  const needle = `"id":"${id}"`
  const newChunks = extractAround(newS, needle).filter((c) => /onClick|interactionMap/.test(c))
  const oldChunks = extractAround(oldS, needle).filter((c) => /onClick|interactionMap/.test(c))
  lines.push(`# ${id}`)
  lines.push(`new: ${newChunks.length} old: ${oldChunks.length}`)
  if (newChunks[0]) lines.push(`NEW:\n${newChunks[0]}\n`)
  if (oldChunks[0] && oldChunks[0] !== newChunks[0]) lines.push(`OLD:\n${oldChunks[0]}\n`)
  lines.push('')
}

const outPath = process.argv[4]
fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log(`Wrote ${outPath}`)

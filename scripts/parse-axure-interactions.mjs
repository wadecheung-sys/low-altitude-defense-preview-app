import fs from 'fs'

const file = process.argv[2]
const ids = process.argv.slice(3)
const raw = fs.readFileSync(file)
const s = raw.toString('utf8').replace(/\r\n/g, '\n')

for (const id of ids) {
  const markers = [`"id":"${id}"`, `"objectId":"${id}"`, `"targetId":"${id}"`]
  for (const marker of markers) {
    let idx = 0
    while (idx >= 0) {
      idx = s.indexOf(marker, idx)
      if (idx < 0) break
      const chunk = s.slice(Math.max(0, idx - 400), idx + 3200)
      if (
        /onClick|interactionMap|SetPanelState|fadeWidget|showHide|u314|u293|u283|u304|u300/.test(
          chunk
        )
      ) {
        process.stdout.write(`=== ${id} (${marker}) ===\n`)
        process.stdout.write(`${chunk}\n\n`)
      }
      idx += marker.length
    }
  }
}

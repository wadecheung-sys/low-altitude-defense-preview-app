import fs from 'node:fs'
import path from 'node:path'

const [src, dest] = process.argv.slice(2)
if (!src || !dest) {
  console.error('Usage: node sync-data-screen-prototype.mjs <src> <dest>')
  process.exit(1)
}

function copyRecursive(from, to) {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const sourcePath = path.join(from, entry.name)
    const targetPath = path.join(to, entry.name)
    if (entry.isDirectory()) copyRecursive(sourcePath, targetPath)
    else fs.copyFileSync(sourcePath, targetPath)
  }
}

if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true })
copyRecursive(path.resolve(src), path.resolve(dest))
console.log(`Synced prototype: ${src} -> ${dest}`)

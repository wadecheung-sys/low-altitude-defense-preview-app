import fs from 'fs'
import path from 'path'

const srcRoot = process.argv[2]
const destRoot = process.argv[3]

if (!srcRoot || !destRoot) {
  console.error('Usage: node sync-data-screen-prototype.mjs <src> <dest>')
  process.exit(1)
}

function copyEntry(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const name of fs.readdirSync(src)) {
      copyEntry(path.join(src, name), path.join(dest, name))
    }
    return
  }
  fs.copyFileSync(src, dest)
}

function removeExtra(dest, src) {
  if (!fs.existsSync(dest)) return
  for (const name of fs.readdirSync(dest)) {
    const destPath = path.join(dest, name)
    const srcPath = path.join(src, name)
    if (!fs.existsSync(srcPath)) {
      fs.rmSync(destPath, { recursive: true, force: true })
      continue
    }
    if (fs.statSync(destPath).isDirectory()) {
      removeExtra(destPath, srcPath)
    }
  }
}

copyEntry(srcRoot, destRoot)
removeExtra(destRoot, srcRoot)
console.log('Synced prototype:', srcRoot, '->', destRoot)

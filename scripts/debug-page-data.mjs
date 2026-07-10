import fs from 'fs'
import vm from 'vm'

const code = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n')
const sandbox = {
  $axure: {
    loadCurrentPage(...args) {
      const fn = args.find((item) => typeof item === 'function')
      sandbox.pageData = fn ? fn() : null
    }
  }
}

vm.runInNewContext(code, sandbox, { timeout: 15000 })
const pageData = sandbox.pageData
console.log('pageData type', typeof pageData)
console.log('pageData', pageData)
console.log('keys', pageData && typeof pageData === 'object' ? Object.keys(pageData).slice(0, 20) : null)

function walk(obj, visit, seen = new Set(), depth = 0) {
  if (!obj || typeof obj !== 'object' || seen.has(obj) || depth > 25) return
  seen.add(obj)
  visit(obj)
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) value.forEach((item) => walk(item, visit, seen, depth + 1))
    else walk(value, visit, seen, depth + 1)
  }
}

const hits = []
walk(pageData, (obj) => {
  if (obj?.id === '048c9b92c6c9430b83263b64162b2aab' || obj?.id === 'a077d12116b04cf88f88d288785646e0') {
    hits.push({
      id: obj.id,
      label: obj.label,
      friendlyType: obj.friendlyType,
      interactionMap: obj.interactionMap
    })
  }
})

console.log('hits', hits.length)
if (hits[0]) console.log(JSON.stringify(hits[0], null, 2).slice(0, 4000))

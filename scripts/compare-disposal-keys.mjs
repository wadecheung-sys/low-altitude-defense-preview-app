import fs from 'fs'

const newS = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n')
const oldS = fs.readFileSync(process.argv[3], 'utf8').replace(/\r\n/g, '\n')

function snippets(s, label) {
  const keys = [
    'onClick',
    '确认操作-1',
    '二次提示3',
    '激光 打击 to',
    '显示 确认操作',
    '显示 二次提示3',
    '隐藏 二次提示3',
    'fire 单击',
    '048c9b92c6c9430b83263b64162b2aab',
    'a077d12116b04cf88f88d288785646e0',
    '84c9f07749c349379dbccb396298bfb6',
    'ec0236489f664bba844443c2e04e0024'
  ]
  const out = [`## ${label}`]
  for (const key of keys) {
    let idx = 0
    let n = 0
    while (n < 2) {
      idx = s.indexOf(key, idx)
      if (idx < 0) break
      out.push(`-- ${key} @ ${idx}`)
      out.push(s.slice(Math.max(0, idx - 250), idx + 900))
      out.push('')
      idx += key.length
      n++
    }
  }
  return out.join('\n')
}

const result = [snippets(newS, 'NEW'), snippets(oldS, 'OLD')].join('\n\n')
fs.writeFileSync(process.argv[4], result, 'utf8')
console.log('written', process.argv[4])

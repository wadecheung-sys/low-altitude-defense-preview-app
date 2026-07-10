import fs from 'fs'

const s = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n')
const keys = [
  'onSelect',
  'onUnselect',
  'onClick',
  'OnClick',
  'cases',
  'fire 显示 on 确认操作',
  'fire 显示 on 二次提示3',
  '解除反制（交互）',
  '激光打击（交互）'
]

for (const k of keys) {
  let count = 0
  let idx = 0
  while ((idx = s.indexOf(k, idx)) >= 0) {
    count++
    idx += k.length
  }
  console.log(k, count)
}

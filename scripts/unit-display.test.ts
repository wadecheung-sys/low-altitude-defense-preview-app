import assert from 'node:assert/strict'
import {
  threatConditionDisplayValue as display,
  threatConditionStoredValue as stored
} from '../src/api/lad/threat/conditionDisplay'
import { formatPlanWeatherConditions } from '../src/api/lad/plan/planWeatherConditions'

assert.equal(display('stayDuration', '10'), '600')
for (const seconds of ['0', '1', '0.5', '60', '61', '600']) {
  assert.equal(display('stayDuration', stored('stayDuration', seconds)), seconds)
}
assert.equal(stored('stayDuration', ''), '')
assert.equal(display('speed', '12.5'), '12.5')
assert.equal(display('locatedArea', 'area-1'), 'area-1')
assert.equal(
  formatPlanWeatherConditions({
    weatherConditions: [
      { id: '1', property: 'temperature', operator: '>', value: '20', nextLogic: 'and' },
      { id: '2', property: 'humidity', operator: '<', value: '90', nextLogic: 'and' },
      { id: '3', property: 'windPower', operator: '<', value: '5', nextLogic: 'and' },
      { id: '4', property: 'rainfall', operator: '<', value: '10' }
    ]
  }),
  '温度>20℃ 且 湿度<90% 且 风力<5m/s 且 雨量<10mm/h'
)
console.log('Unit display, seconds round-trip and weather summary checks passed')

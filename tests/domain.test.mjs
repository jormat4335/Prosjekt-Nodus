import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readingState,siteState,escapeHtml} from '../src/domain.js';
const now=Date.parse('2026-09-17T12:00:00Z');
const sensor={id:'sensor',stale_after_seconds:900};
const fresh={sensor_id:'sensor',observed_at:'2026-09-17T11:59:00Z',quality:'good',value:0};
test('no readings never means normal operation',()=>{
 assert.equal(siteState([],[],[],now),'unknown');
 assert.equal(siteState([sensor],[],[],now),'unknown');
});
test('stale, future and bad quality values are not healthy',()=>{
 for(const update of [{observed_at:'2026-09-17T11:00:00Z'},{observed_at:'2026-09-17T13:00:00Z'},{quality:'bad'}])
 assert.equal(siteState([sensor],[{...fresh,...update}],[],now),'unknown');
});
test('zero is a valid fresh reading and active alarms take precedence',()=>{
 assert.equal(readingState(fresh,sensor,now),'fresh');
 assert.equal(siteState([sensor],[fresh],[],now),'normal');
 assert.equal(siteState([sensor],[fresh],[{state:'active'}],now),'alarm');
 assert.equal(siteState([sensor],[fresh],[{state:'resolved'}],now),'normal');
});
test('external names and report content cannot inject HTML',()=>{
 assert.equal(escapeHtml('<script>"x"</script>'), '&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
});
test('warning and information do not masquerade as critical alarms',()=>{
 assert.equal(siteState([sensor],[fresh],[{state:'active',severity:'warning'}],now),'warning');
 assert.equal(siteState([sensor],[fresh],[{state:'active',severity:'info'}],now),'info');
 assert.equal(siteState([sensor],[fresh],[{state:'active',severity:'warning'},{state:'active',severity:'critical'}],now),'alarm');
});

let refreshBusy=false;
const REFRESH_INTERVAL=15*60*1000;
let lastRefreshAttempt=0;
const dateTime=s=>new Date(s).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'});
async function responseJson(r){let j;try{j=await r.json()}catch{throw Error('ไม่สามารถติดต่อระบบได้ กรุณาลองอีกครั้ง')}if(!r.ok)throw Error(j.error||'ไม่สามารถดำเนินการได้');return j;}
async function refreshDataset(){
 if(refreshBusy)return;refreshBusy=true;lastRefreshAttempt=Date.now();$('#refresh-source').disabled=true;
 const message=$('#sync-message');message.innerHTML='<b><i class="sync-dot pending" aria-hidden="true"></i>กำลังโหลด…</b>';message.className='sync-pending';
 try{const j=await responseJson(await fetch('data/dataset.json?t='+Date.now(),{cache:'no-store'}));if(!Array.isArray(j.chargers)||!j.chargers.length)throw Error('ไฟล์ข้อมูลไม่สมบูรณ์');setDataset(j.chargers);const src=j.source;
 if(src?.error){message.className='sync-error';message.innerHTML=`<b><i class="sync-dot warning" aria-hidden="true"></i>อ่านชีตล่าสุดไม่สำเร็จ</b><small>${src.lastSuccess?'ข้อมูลเดิม · '+esc(dateTime(src.lastSuccess)):'แสดงข้อมูลสำรอง'}</small><details><summary>รายละเอียด</summary>${esc(src.error)}</details>`;}
 else{
 const lastRead=src?.lastSuccess||src?.lastChecked;
 const age=Date.now()-Date.parse(lastRead||'');
 const fresh=!!src?.connected&&Number.isFinite(age)&&age>=-60000&&age<=45*60*1000;
 message.className=fresh?'sync-success':'sync-error';
 message.title='เว็บตรวจสอบ '+dateTime(new Date().toISOString())+' · สีส้มเมื่ออ่านไม่สำเร็จหรือข้อมูลเกิน 45 นาที';
 message.innerHTML=`<b><i class="sync-dot ${fresh?'success':'warning'}" aria-hidden="true"></i>${fresh?'Google Sheets · อัปเดตล่าสุดสำเร็จ':'Google Sheets · ข้อมูลอาจล่าช้า'}</b><small>ข้อมูล ${lastRead?esc(dateTime(lastRead)):'—'} · ตรวจทุก 15 นาที</small>`;
 }

 $('#history-open').disabled=false;$('#export').disabled=false;
 }catch(e){message.className='sync-error';message.innerHTML=`<b><i class="sync-dot warning" aria-hidden="true"></i>ไม่สามารถอัปเดตข้อมูลได้</b><details><summary>รายละเอียด</summary>${esc(e.message)}</details><button id="retry-load">ลองอีกครั้ง</button>`;$('#retry-load').onclick=refreshDataset;}
 finally{refreshBusy=false;$('#refresh-source').disabled=false;}
}
$('#history-open').onclick=async()=>{$('#history-dialog').showModal();$('#history-content').textContent='กำลังโหลดประวัติการปรับปรุงข้อมูล';try{const j=await responseJson(await fetch('data/history.json?t='+Date.now(),{cache:'no-store'}));$('#history-content').innerHTML=j.history.map(v=>`<article class="historyentry"><b>ชุดข้อมูลรุ่นที่ ${v.revision}${v.revision===j.currentRevision?' · รุ่นปัจจุบัน':''}</b><p>${esc(v.filename)}</p><small>${esc(dateTime(v.created_at))}</small><p>${v.station_count} สถานี · ${v.charger_count} เครื่อง · ${v.repair_count} รายการซ่อมบำรุง</p></article>`).join('')+'<small>แสดงประวัติการบันทึกข้อมูล 100 รุ่นล่าสุด</small>';}catch(e){$('#history-content').textContent=e.message}};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());
$('#refresh-source').onclick=refreshDataset;setInterval(()=>{if(!document.hidden)refreshDataset()},REFRESH_INTERVAL);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastRefreshAttempt>=REFRESH_INTERVAL)refreshDataset()});refreshDataset();

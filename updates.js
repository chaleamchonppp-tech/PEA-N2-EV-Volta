let refreshBusy=false;
const REFRESH_INTERVAL=15*60*1000;
let lastRefreshAttempt=0;
const dateTime=s=>new Date(s).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'});
async function responseJson(r){let j;try{j=await r.json()}catch{throw Error('ไม่สามารถติดต่อระบบได้ กรุณาลองอีกครั้ง')}if(!r.ok)throw Error(j.error||'ไม่สามารถดำเนินการได้');return j;}
async function refreshDataset(){
 if(refreshBusy)return;refreshBusy=true;lastRefreshAttempt=Date.now();$('#refresh-source').disabled=true;
 const message=$('#sync-message');message.innerHTML='<b><i class="sync-dot pending" aria-hidden="true"></i>กำลังโหลดข้อมูลบนเว็บ</b>';message.className='sync-pending';
 try{const j=await responseJson(await fetch('data/dataset.json?t='+Date.now(),{cache:'no-store'}));if(!Array.isArray(j.chargers)||!j.chargers.length)throw Error('ไฟล์ข้อมูลไม่สมบูรณ์');setDataset(j.chargers);const src=j.source;
 if(src?.error){message.className='sync-error';message.innerHTML=`<b><i class="sync-dot warning" aria-hidden="true"></i>อ่านชีตล่าสุดไม่สำเร็จ</b><span>${esc(src.error)}</span><small>${src.lastSuccess?'แสดงข้อมูลที่อ่านสำเร็จล่าสุดเมื่อ '+esc(dateTime(src.lastSuccess)):'แสดงข้อมูลสำรองที่จัดเก็บไว้ ยังไม่ใช่ข้อมูลล่าสุดจาก Google Sheets'}</small>`;}
 else{
 const lastRead=src?.lastSuccess||src?.lastChecked;
 const age=Date.now()-Date.parse(lastRead||'');
 const fresh=!!src?.connected&&Number.isFinite(age)&&age>=-60000&&age<=45*60*1000;
 message.className=fresh?'sync-success':'sync-error';
 message.innerHTML=`<b><i class="sync-dot ${fresh?'success':'warning'}" aria-hidden="true"></i>${fresh?'อ่านชีตล่าสุดสำเร็จ':'ข้อมูลอาจล่าช้า'}</b><small>อ่านชีตสำเร็จ ${lastRead?esc(dateTime(lastRead)):'—'}<br>เว็บตรวจสอบ ${esc(dateTime(new Date().toISOString()))} · โหลดทุก 15 นาที</small>`;
 }

 $('#history-open').disabled=false;$('#export').disabled=false;
 }catch(e){message.className='sync-error';message.innerHTML=`<b><i class="sync-dot warning" aria-hidden="true"></i>ไม่สามารถอัปเดตข้อมูลได้</b><span>${esc(e.message)}</span><button id="retry-load">ลองอีกครั้ง</button>`;$('#retry-load').onclick=refreshDataset;}
 finally{refreshBusy=false;$('#refresh-source').disabled=false;}
}
$('#history-open').onclick=async()=>{$('#history-dialog').showModal();$('#history-content').textContent='กำลังโหลดประวัติการปรับปรุงข้อมูล';try{const j=await responseJson(await fetch('data/history.json?t='+Date.now(),{cache:'no-store'}));$('#history-content').innerHTML=j.history.map(v=>`<article class="historyentry"><b>ชุดข้อมูลรุ่นที่ ${v.revision}${v.revision===j.currentRevision?' · รุ่นปัจจุบัน':''}</b><p>${esc(v.filename)}</p><small>${esc(dateTime(v.created_at))}</small><p>${v.station_count} สถานี · ${v.charger_count} เครื่อง · ${v.repair_count} รายการซ่อมบำรุง</p></article>`).join('')+'<small>แสดงประวัติการบันทึกข้อมูล 100 รุ่นล่าสุด</small>';}catch(e){$('#history-content').textContent=e.message}};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());
$('#refresh-source').onclick=refreshDataset;setInterval(()=>{if(!document.hidden)refreshDataset()},REFRESH_INTERVAL);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastRefreshAttempt>=REFRESH_INTERVAL)refreshDataset()});refreshDataset();

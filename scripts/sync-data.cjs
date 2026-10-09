const fs=require('node:fs');
const vm=require('node:vm');
const XLSX=require('../xlsx.full.min.js');
vm.runInThisContext(fs.readFileSync('import-parser.js','utf8'));
const url='https://docs.google.com/spreadsheets/d/17EeqTPVeKmm1Cv4uhpSCq7aeOV8G7ndI_3t0nSnrP7Q/export?format=xlsx';
(async()=>{
const old=JSON.parse(fs.readFileSync('data/dataset.json','utf8'));
const now=new Date().toISOString();
try{
const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error('Google Sheets HTTP '+response.status);
const bytes=new Uint8Array(await response.arrayBuffer());
if(bytes.length>5*1024*1024||bytes[0]!==80||bytes[1]!==75)throw Error('Google Sheets ไม่ส่งไฟล์ XLSX ที่อ่านได้');
const book=XLSX.read(bytes,{type:'array',cellDates:true,sheetRows:10001});
const a=book.Sheets['จำนวนสถานีชาร์จ'],b=book.Sheets['ประวัติการซ่อมแซม'];
if(!a||!b)throw Error('ไม่พบแท็บทะเบียนหรือประวัติการซ่อม');
const chargers=PatrolExcel.parseRows(XLSX.utils.sheet_to_json(a,{header:1,defval:null}),XLSX.utils.sheet_to_json(b,{header:1,defval:null}));
const changed=JSON.stringify(old.chargers)!==JSON.stringify(chargers);
const data={...old,chargers,revision:old.revision+(changed?1:0),updatedAt:changed?now:old.updatedAt,canEdit:false,signedIn:false,source:{...old.source,connected:true,error:null,lastChecked:now,lastSuccess:now}};
if(changed){
const history=JSON.parse(fs.readFileSync('data/history.json','utf8'));
history.currentRevision=data.revision;
history.history.unshift({revision:data.revision,filename:data.filename,created_at:now,charger_count:chargers.length,station_count:new Set(chargers.map(d=>d.site)).size,repair_count:chargers.flatMap(d=>d.repairs).length});
history.history=history.history.slice(0,100);
fs.writeFileSync('data/history.json',JSON.stringify(history));
}
fs.writeFileSync('data/dataset.json',JSON.stringify(data));
console.log('Read '+chargers.length+' chargers successfully.');
}catch(error){
old.source={...old.source,connected:false,error:String(error.message),lastChecked:now};
fs.writeFileSync('data/dataset.json',JSON.stringify(old));
console.error('Sync failed; previous data retained:',error.message);
}
})();

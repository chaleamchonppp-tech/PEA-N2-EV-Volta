(function(root){
 const str=v=>v==null?null:v instanceof Date?v.toLocaleDateString('th-TH'):String(v).trim();
 const key=v=>(str(v)||'').replace(/\s+/g,' ');
 function number(v,label,row){const n=typeof v==='number'?v:Number(String(v??'').replaceAll(',','').trim());if(v==null||String(v).trim()===''||!Number.isFinite(n))throw Error(`${label} ไม่เป็นตัวเลขที่แถว ${row}`);return n;}
 function parseRows(registry,repairRows){
  const headers=registry[0]||[],index={};headers.forEach((h,i)=>index[key(h)]=i);
  const required=['Charger ID (PEA No.)','Volta Name','ขนาด (kW)','จำนวนหัวชาร์จ','ละติจูด','ลองติจูด','Station No.','Status'];for(const h of required)if(index[h]==null)throw Error('ไม่พบคอลัมน์ '+h+' ในชีตจำนวนสถานีชาร์จ');
  const rh=repairRows[0]||[],ri={};rh.forEach((h,i)=>ri[key(h)]=i);for(const h of ['Volta Name','รายการ','ราคา','วันที่ดำเนินการ'])if(ri[h]==null)throw Error('ไม่พบคอลัมน์ '+h+' ในชีตประวัติการซ่อมแซม');
  const repairs=new Map();let name=null,date=null,note=null;
  repairRows.slice(1).forEach((r,i)=>{if(r[ri['Volta Name']]){name=key(r[ri['Volta Name']]);date=null;note=null;}const item=str(r[ri['รายการ']]);if(!item)return;if(!name)throw Error('รายการซ่อมไม่มีชื่อเครื่องที่แถว '+(i+2));date=str(r[ri['วันที่ดำเนินการ']])||date;note=str(r[ri['หมายเหตุ']])||note;const val=r[ri['ราคา']];const cost=val==null||val===''?null:number(val,'ราคาซ่อม',i+2);if(cost!=null&&cost<0)throw Error('ราคาซ่อมติดลบที่แถว '+(i+2));if(!repairs.has(name))repairs.set(name,[]);repairs.get(name).push({item,cost,date,note,row:i+2,dateInherited:!r[ri['วันที่ดำเนินการ']]});});
  const ids=new Set(),names=new Set();const ds=[];
  registry.slice(1).forEach((r,i)=>{const get=h=>r[index[h]],row=i+2;if(!get('Volta Name')&&!get('Charger ID (PEA No.)'))return;const id=str(get('Charger ID (PEA No.)')),name=str(get('Volta Name')),site=str(get('Station No.')),status=str(get('Status'));if(!id||!name||!site||!status)throw Error('ชื่อสถานี รหัสเครื่อง รหัสสถานี หรือสถานะไม่ครบที่แถว '+row);if(ids.has(id))throw Error('Charger ID ซ้ำ: '+id);if(names.has(key(name)))throw Error('ชื่อเครื่องซ้ำ ทำให้จับคู่ประวัติซ่อมไม่ได้: '+name);ids.add(id);names.add(key(name));const kw=number(get('ขนาด (kW)'),'กำลังชาร์จ',row),connectors=number(get('จำนวนหัวชาร์จ'),'หัวชาร์จ',row),lat=number(get('ละติจูด'),'ละติจูด',row),lon=number(get('ลองติจูด'),'ลองติจูด',row);if(kw<=0||kw>10000||!Number.isInteger(connectors)||connectors<1||connectors>100||lat<-90||lat>90||lon<-180||lon>180)throw Error('กำลังชาร์จ หัวชาร์จ หรือพิกัดไม่ถูกต้องที่แถว '+row);ds.push({id,name,site,status,kw,connectors,lat,lon,office:str(get('กฟฟ.')),brand:str(get('Brand')),model:str(get('Model')),connectorType:str(get('ประเภทหัวชาร์จ')),warranty:str(get('Remark')),pm:str(get('PM')),pmDetail:str(get('รายละเอียด PM')),damage:str(get('รายการชำรุด')),repairs:repairs.get(key(name))||[],row});});
  if(!ds.length||ds.length>2000)throw Error('ต้องมีเครื่องชาร์จ 1–2,000 เครื่อง');for(const name of repairs.keys())if(!names.has(name))throw Error('ประวัติซ่อมจับคู่เครื่องไม่ได้: '+name);return ds;
 }
 root.PatrolExcel={parseRows};
})(globalThis);

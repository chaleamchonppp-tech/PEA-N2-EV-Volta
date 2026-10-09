// Station-bounded Web Mercator map; native imagery at z19 with magnification through z23.
let mapCenter=null,mapFilterKey='',mapSelected=null,mapLayer='street',mapBounds=null;
const mapElement=$('#map');
let googleMapKey='',mapChosenSite=null;
function mapStations(){const ids=new Set(visible().map(d=>d.site));return sites.filter(s=>ids.has(s.id)&&Number.isFinite(Number(s.devices[0].lat))&&Number.isFinite(Number(s.devices[0].lon)))}
function worldPoint(lat,lon,z){const size=256*2**z,r=Math.max(-85,Math.min(85,lat))*Math.PI/180;return[(lon+180)/360*size,(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*size]}
function worldPosition(x,y,z){const size=256*2**z;return [Math.atan(Math.sinh(Math.PI*(1-2*y/size)))*180/Math.PI,x/size*360-180]}
function clampMapCenter(){if(!mapCenter||!mapBounds)return;mapCenter[0]=Math.max(mapBounds.south,Math.min(mapBounds.north,mapCenter[0]));mapCenter[1]=Math.max(mapBounds.west,Math.min(mapBounds.east,mapCenter[1]))}
function fitStationMap(){const ss=mapStations();if(!ss.length)return;const points=ss.map(s=>s.devices[0]);const lats=points.map(d=>Number(d.lat)),lons=points.map(d=>Number(d.lon));const south=Math.min(...lats),north=Math.max(...lats),west=Math.min(...lons),east=Math.max(...lons);mapBounds={south:south-.25,north:north+.25,west:west-.25,east:east+.25};mapCenter=[(south+north)/2,(west+east)/2];const w=Math.max(100,mapElement.clientWidth-100),h=Math.max(100,mapElement.clientHeight-100);zoom=18;for(let z=18;z>=5;z--){const a=worldPoint(north,west,z),b=worldPoint(south,east,z);if(Math.abs(b[0]-a[0])<=w&&Math.abs(b[1]-a[1])<=h){zoom=z;break}}}
function focusStationMap(){const s=sites.find(s=>s.id===selected);if(!s)return;const d=s.devices[0];mapCenter=[Number(d.lat),Number(d.lon)];zoom=18;clampMapCenter();drawMap()}
function changeMapZoom(delta){zoom=Math.max(5,Math.min(mapLayer==='satellite'?23:19,zoom+delta));drawMap()}
drawMap=function(){
 const ss=mapStations(),key=ss.map(s=>s.id).join('|');
 if(mapChosenSite&&!ss.some(s=>s.id===mapChosenSite))mapChosenSite=null;
 const picker=$('#map-station');
 if(picker.dataset.stations!==key){picker.dataset.stations=key;picker.innerHTML='<option value="">เลือกสถานีที่จะดู</option>'+ss.map(s=>`<option value="${esc(s.id)}">${esc(s.devices[0].name.replace(/ #\d+$/,''))} · ${esc(s.id)}</option>`).join('')}
 picker.value=mapChosenSite||'';
 if(!mapCenter||key!==mapFilterKey){mapFilterKey=key;fitStationMap();mapSelected=selected}
 else if(selected!==mapSelected){mapSelected=selected;const d=sites.find(s=>s.id===selected)?.devices[0];if(d){mapCenter=[Number(d.lat),Number(d.lon)];zoom=18}}
 const w=mapElement.clientWidth,h=mapElement.clientHeight;if(!w||!h)return;
 if(!ss.length){$('#tiles').innerHTML='';$('#markers').innerHTML='';$('#map-note').textContent='ไม่พบจุดชาร์จตามตัวกรอง';return}
 const googleMode=mapLayer==='satellite';mapElement.classList.toggle('google-mode',googleMode);
 if(googleMode){
  const d=ss.find(s=>s.id===mapChosenSite)?.devices[0];const lat=d?Number(d.lat):mapCenter[0],lon=d?Number(d.lon):mapCenter[1],level=d?18:Math.min(zoom,10);const key=`${lat},${lon},${level}`;const frame=$('#google-station-map');
  if(key!==googleMapKey){googleMapKey=key;frame.src=`https://maps.google.com/maps?q=${encodeURIComponent(lat+','+lon)}&z=${level}&t=h&hl=th&output=embed`;frame.title=d?'Google Maps · '+d.name:'Google Maps · พื้นที่สถานีชาร์จ'}
  $('#map-note').textContent='Google Maps · ภาพดาวเทียมพร้อมชื่อสถานที่ · ซูมด้วยปุ่มในแผนที่';
  $('#map-attribution').innerHTML='';$('#tiles').innerHTML='';$('#markers').innerHTML='';$('#maptip').hidden=true;return;
 }
 clampMapCenter();const [cx,cy]=worldPoint(...mapCenter,zoom),left=cx-w/2,top=cy-h/2;
 const nativeZoom=Math.min(zoom,19),scale=2**(zoom-nativeZoom),tileSize=256*scale,n=2**nativeZoom;let tiles='';
 for(let x=Math.floor(left/tileSize);x<=Math.floor((left+w)/tileSize);x++)for(let y=Math.floor(top/tileSize);y<=Math.floor((top+h)/tileSize);y++){if(x<0||y<0||x>=n||y>=n)continue;const url=mapLayer==='satellite'?`https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${nativeZoom}/${y}/${x}`:`https://tile.openstreetmap.org/${nativeZoom}/${x}/${y}.png`;tiles+=`<img alt="" draggable="false" src="${url}" style="left:${x*tileSize-left}px;top:${y*tileSize-top}px;width:${tileSize}px;height:${tileSize}px">`}
 $('#tiles').innerHTML=tiles;document.querySelectorAll('#tiles img').forEach(img=>img.onerror=()=>{img.style.visibility='hidden';$('#map-note').textContent='ภาพแผนที่บางส่วนโหลดไม่ได้ กรุณาลองซูมออกหรือเลือก Google Maps'});mapElement.classList.toggle('satellite',mapLayer==='satellite');
 $('#markers').innerHTML=ss.map(s=>{const d=s.devices[0],[x,y]=worldPoint(Number(d.lat),Number(d.lon),zoom),state=s.devices.every(d=>d.status==='ใช้งาน')?'online':'offline';return `<button class="marker ${state} ${s.id===selected?'selected':''}" data-site="${esc(s.id)}" aria-label="${esc(d.name)}" title="${esc(d.name)}" style="left:${x-left}px;top:${y-top}px;width:40px;height:40px">${s.devices.length}</button>`}).join('');
 $('#maptip').hidden=true;document.querySelectorAll('[data-site]').forEach(b=>b.onclick=()=>{selected=b.dataset.site;mapChosenSite=selected;focusStationMap();detail();drawMap();revealStation()});
 $('#plus').disabled=zoom>=(mapLayer==='satellite'?23:19);$('#minus').disabled=zoom<=5;
 $('#map-note').textContent=mapLayer==='satellite'&&zoom>19?'ขยายภาพดาวเทียม · ความละเอียดตามภาพต้นทาง':'ลากเพื่อเลื่อนแผนที่ · เลือกจุดเพื่อดูบริเวณสถานี';
 $('#map-attribution').innerHTML=mapLayer==='satellite'?'<a href="https://www.esri.com/" target="_blank" rel="noopener">ภาพ © Esri, Vantor, Earthstar Geographics, GIS User Community</a>':'© OpenStreetMap contributors';
};
$('#plus').onclick=()=>changeMapZoom(1);$('#minus').onclick=()=>changeMapZoom(-1);
$('#map-layer').onchange=e=>{mapLayer=e.target.value;zoom=Math.min(zoom,mapLayer==='satellite'?23:19);drawMap()};
$('#map-fit').onclick=()=>{mapLayer='street';$('#map-layer').value='street';mapChosenSite=null;fitStationMap();drawMap()};$('#map-station').onchange=e=>{if(!e.target.value){mapChosenSite=null;fitStationMap();drawMap();return}mapChosenSite=e.target.value;selected=mapChosenSite;detail();focusStationMap()};
let pointers=new Map(),drag=null,pinchDistance=0;
mapElement.addEventListener('pointerdown',e=>{if(mapLayer==='satellite'||!mapCenter||e.target.closest('button,select,a,.map-tools,.legend'))return;mapElement.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===1)drag={x:e.clientX,y:e.clientY,center:[...mapCenter]};if(pointers.size===2){drag=null;const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a[0]-b[0],a[1]-b[1])}});
mapElement.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const [a,b]=[...pointers.values()],dist=Math.hypot(a[0]-b[0],a[1]-b[1]);if(dist>pinchDistance*1.4||dist<pinchDistance/1.4){changeMapZoom(dist>pinchDistance?1:-1);pinchDistance=dist}}else if(drag){const [x,y]=worldPoint(...drag.center,zoom);mapCenter=worldPosition(x-(e.clientX-drag.x),y-(e.clientY-drag.y),zoom);clampMapCenter();drawMap()}});
function endMapPointer(e){pointers.delete(e.pointerId);drag=null;pinchDistance=0}
mapElement.addEventListener('pointerup',endMapPointer);mapElement.addEventListener('pointercancel',endMapPointer);
mapElement.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();changeMapZoom(e.deltaY<0?1:-1)},{passive:false});

// Sample data: monthly revenue, target and cost per department (in $K)
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DEPTS={
  "Sales":{rev:[410,425,450,470,455,490,510,505,530,560,575,610],tgt:[420,430,440,460,470,480,500,510,520,540,560,580],cost:[300,305,320,330,325,345,355,350,370,385,395,420],heads:42},
  "Marketing":{rev:[150,160,155,170,180,175,190,185,200,205,210,220],tgt:[160,165,170,175,180,185,190,195,200,205,210,215],cost:[120,125,124,130,138,134,145,141,150,155,158,166],heads:18},
  "Operations":{rev:[300,295,310,305,320,310,330,325,335,340,345,360],tgt:[310,310,315,320,325,330,335,340,345,350,355,360],cost:[250,250,258,255,265,260,272,268,275,280,284,295],heads:55},
  "Customer Support":{rev:[90,92,95,93,96,98,97,100,102,104,105,108],tgt:[100,100,102,104,106,108,110,112,114,116,118,120],cost:[72,73,75,75,78,79,80,82,84,85,86,89],heads:30},
  "Product":{rev:[200,210,225,240,235,260,270,285,290,310,320,345],tgt:[200,205,215,225,235,245,255,265,275,285,295,305],cost:[150,155,162,170,168,182,188,196,200,212,218,232],heads:36}
};
const $=id=>document.getElementById(id);
const sum=a=>a.reduce((x,y)=>x+y,0);
const fmt=n=>"$"+(n>=1000?(n/1000).toFixed(2)+"M":Math.round(n)+"K");
const pct=n=>n.toFixed(1)+"%";
let sortKey="rev",sortDir=-1;

const dsel=$("d");
["All departments",...Object.keys(DEPTS)].forEach(n=>{const o=document.createElement("option");o.value=n==="All departments"?"all":n;o.textContent=n;dsel.appendChild(o)});

function range(){const q=$("q").value;return q==="all"?[0,12]:[q*3,q*3+3]}
function stats(name){
  const [a,b]=range(),d=DEPTS[name];
  const rev=sum(d.rev.slice(a,b)),tgt=sum(d.tgt.slice(a,b)),cost=sum(d.cost.slice(a,b));
  return{name,rev,tgt,cost,margin:(rev-cost)/rev*100,att:rev/tgt*100,heads:d.heads,perHead:rev/d.heads};
}
function selected(){const v=dsel.value;return v==="all"?Object.keys(DEPTS):[v]}
function status(att){return att>=100?["On target","var(--good)"]:att>=95?["Near target","var(--warn)"]:["Behind","var(--bad)"]}

function render(){
  const names=selected(),all=names.map(stats);
  const rev=sum(all.map(s=>s.rev)),tgt=sum(all.map(s=>s.tgt)),cost=sum(all.map(s=>s.cost)),heads=sum(all.map(s=>s.heads));
  const att=rev/tgt*100,margin=(rev-cost)/rev*100;

  $("kpis").innerHTML=[
    ["Revenue",fmt(rev),`${rev>=tgt?"▲":"▼"} ${fmt(Math.abs(rev-tgt))} vs target`,rev>=tgt],
    ["Profit",fmt(rev-cost),`${pct(margin)} margin`,margin>=20],
    ["Target attainment",pct(att),att>=100?"Target met":"Below target",att>=100],
    ["Revenue per employee",fmt(rev/heads),`${heads} employees`,true]
  ].map(k=>`<div class="card kpi"><span>${k[0]}</span><b>${k[1]}</b><em class="${k[3]?"up":"down"}">${k[2]}</em></div>`).join("");

  // Line chart
  const [a,b]=range();
  const act=MONTHS.map((_,i)=>sum(names.map(n=>DEPTS[n].rev[i]))).slice(a,b);
  const tg=MONTHS.map((_,i)=>sum(names.map(n=>DEPTS[n].tgt[i]))).slice(a,b);
  const labs=MONTHS.slice(a,b);
  const W=560,H=260,P={l:44,r:12,t:12,b:26};
  const max=Math.max(...act,...tg)*1.08,min=Math.min(...act,...tg)*.9;
  const x=i=>P.l+(labs.length===1?0:i*(W-P.l-P.r)/(labs.length-1));
  const y=v=>P.t+(1-(v-min)/(max-min))*(H-P.t-P.b);
  const path=arr=>arr.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(v).toFixed(1)).join(" ");
  let g="";
  for(let i=0;i<=4;i++){const v=min+(max-min)*i/4;g+=`<line x1="${P.l}" x2="${W-P.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${P.l-6}" y="${y(v)+4}" text-anchor="end">${Math.round(v)}</text>`}
  labs.forEach((m,i)=>g+=`<text x="${x(i)}" y="${H-6}" text-anchor="middle">${m}</text>`);
  $("line").innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly revenue versus target in thousands of dollars">${g}
    <path d="${path(tg)}" fill="none" stroke="var(--target)" stroke-width="2" stroke-dasharray="5 4"/>
    <path d="${path(act)}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
    ${act.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="var(--accent)"><title>${labs[i]}: ${v}K (target ${tg[i]}K)</title></circle>`).join("")}</svg>`;

  // Bar chart (attainment for all depts, highlight selection)
  const every=Object.keys(DEPTS).map(stats).sort((p,q)=>q.att-p.att);
  const bh=34,BW=380,BH=every.length*bh+4,lx=120;
  const bx=v=>lx+Math.min(v,120)/120*(BW-lx-44);
  $("bars").innerHTML=`<svg viewBox="0 0 ${BW} ${BH}" role="img" aria-label="Target attainment percent by department">
    <line x1="${bx(100)}" x2="${bx(100)}" y1="0" y2="${BH}" stroke="var(--target)" stroke-dasharray="4 3"/>
    ${every.map((s,i)=>{const on=names.includes(s.name);return `<text x="0" y="${i*bh+bh/2+4}">${s.name}</text>
    <rect x="${lx}" y="${i*bh+6}" width="${bx(s.att)-lx}" height="${bh-14}" rx="3" fill="${status(s.att)[1]}" opacity="${on?1:.35}"/>
    <text x="${bx(s.att)+5}" y="${i*bh+bh/2+4}">${pct(s.att)}</text>`}).join("")}</svg>`;

  // Table
  const rows=all.slice().sort((p,q)=>sortKey==="name"?sortDir*p.name.localeCompare(q.name)*-1:sortDir*(p[sortKey]-q[sortKey]));
  $("rows").innerHTML=rows.map(s=>{const st=status(s.att);return `<tr><td>${s.name}</td><td>${fmt(s.rev)}</td><td>${pct(s.margin)}</td><td>${pct(s.att)}</td><td><span class="pill" style="color:${st[1]}">${st[0]}</span></td></tr>`}).join("");

  // Insights
  const byAtt=all.slice().sort((p,q)=>q.att-p.att),byMargin=all.slice().sort((p,q)=>q.margin-p.margin);
  const behind=all.filter(s=>s.att<95);
  const ins=[];
  if(all.length>1){
    ins.push(`<b>${byAtt[0].name}</b> leads on target attainment at ${pct(byAtt[0].att)}.`);
    ins.push(`<b>${byMargin[0].name}</b> has the highest margin (${pct(byMargin[0].margin)}); <b>${byMargin.at(-1).name}</b> has the lowest (${pct(byMargin.at(-1).margin)}).`);
    ins.push(behind.length?`${behind.map(s=>s.name).join(", ")} ${behind.length>1?"are":"is"} more than 5% behind target. Review pipeline and capacity.`:"No department is more than 5% behind target.");
  } else {
    const s=all[0];
    ins.push(`${s.name} is at ${pct(s.att)} of target with a ${pct(s.margin)} margin.`);
    ins.push(s.att>=100?"Target met. Consider raising the next target.":"Revenue is below target. Check recent months for the gap.");
  }
  const trend=act.length>1?(act.at(-1)-act[0])/act[0]*100:0;
  if(act.length>1)ins.push(`Revenue moved ${trend>=0?"up":"down"} ${pct(Math.abs(trend))} from ${labs[0]} to ${labs.at(-1)}.`);
  $("ins").innerHTML=ins.map(t=>`<li>${t}</li>`).join("");
}

$("q").onchange=$("d").onchange=render;
document.querySelectorAll("th button").forEach(btn=>btn.onclick=()=>{const k=btn.dataset.k;sortDir=sortKey===k?-sortDir:-1;sortKey=k;render()});
render();

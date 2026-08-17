/* ═══════════════════════════════════════════════════════════════
   MVIKAS DASHBOARD — Refined Dark Theme
   ═══════════════════════════════════════════════════════════════ */

// Palette — dark base + subtle orange
const C = {
  orange:    '#f58220',
  orangeDim: '#d96d10',
  bg:        '#0a0a0a',
  s1:        '#141414',
  s2:        '#1a1a1a',
  s3:        '#202020',
  s4:        '#262626',
  border:    '#2a2a2a',
  divider:   '#3a3a3a',
  text:      '#f5f5f5',
  text2:     '#b8b8b8',
  text3:     '#8b8b8b',
  text4:     '#5a5a5a',
  grid:      '#252525'
};
const orangeA = (a) => `rgba(245,130,32,${a})`;

// DOM helper — defined up top, before anything that might throw, so the rest of the
// dashboard (search/filter, tables, KPIs) still works even if Chart.js failed to load
// (blocked CDN, offline, ad-blocker, restrictive CSP, etc).
const $=id=>document.getElementById(id);

// Safe Chart.js wrapper — never throws, so a missing/blocked Chart.js library can't
// take down unrelated code that happens to run in the same function (e.g. renderDelayPanel
// also updates KPI text nodes after drawing its charts).
function safeChart(ctx, config){
  if (typeof Chart === 'undefined') { console.warn('Chart.js not loaded — skipping chart render'); return null; }
  if (!ctx) return null;
  try { return new Chart(ctx, config); }
  catch(e) { console.error('Chart render failed:', e); return null; }
}

// Chart defaults — Dark theme (guarded: only runs if Chart.js actually loaded)
if (typeof Chart !== 'undefined') {
  const CD = Chart.defaults;
  CD.color = C.text3;
  CD.font.family = 'Inter, -apple-system, system-ui, sans-serif';
  CD.font.size = 11;
  CD.plugins.tooltip.backgroundColor = C.s3;
  CD.plugins.tooltip.borderColor = C.border;
  CD.plugins.tooltip.borderWidth = 1;
  CD.plugins.tooltip.padding = 12;
  CD.plugins.tooltip.cornerRadius = 8;
  CD.plugins.tooltip.titleColor = C.orange;
  CD.plugins.tooltip.titleFont = {size:11, weight:'700'};
  CD.plugins.tooltip.bodyColor = C.text;
  CD.plugins.tooltip.bodyFont = {size:12, weight:'500'};
  CD.plugins.tooltip.displayColors = false;
  CD.scale.grid.color = C.grid;
  CD.scale.grid.drawBorder = false;
  CD.scale.ticks.color = C.text3;
}

// Counter Animation — respects data-decimals so fractional targets (tonnage-in-thousands,
// revenue-in-lakhs) animate to their real precision instead of being rounded to an integer.
function animateCounters(){
  document.querySelectorAll('.counter').forEach(el=>{
    const t=+el.dataset.target,dec=+(el.dataset.decimals||0),dur=1800,st=performance.now();
    (function tick(now){
      const p=Math.min((now-st)/dur,1);
      const v=t*(1-Math.pow(1-p,3));
      el.textContent=dec>0?v.toFixed(dec):Math.round(v).toLocaleString('en-IN');
      if(p<1)requestAnimationFrame(tick);
    })(st);
  });
}

// Tabs
function switchTab(id,btn){
  document.querySelectorAll('.tab').forEach(t=>{
    t.classList.remove('active');
    t.setAttribute('aria-selected','false');
  });
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  btn.classList.add('active');
  btn.setAttribute('aria-selected','true');
}
window.switchTab=switchTab;

// Client Data — sourced from MVLOAD_16_08_2026.xlsx ("Tonnage_of_August_Month" target/personnel sheet
// cross-referenced with "Total_Tonnage_this_month" for achieved kg; "Sheet10" skipped per request).
// "Haier" and "Haier CCR" are the same customer, merged into one row. activeDays=16.
const clients=[
  {name:"Carrier Refrigeration",person:"Sangeet Dhasmana",target:293073.0,achieved:133773.83,activeDays:16},
  {name:"Carrier CTD",person:"Deepak Sharma",target:74460.0,achieved:39504.42,activeDays:16},
  {name:"Mitras Technocrafts Pvt Ltd-HR",person:"Deepak Sharma",target:13501.0,achieved:1815.71,activeDays:16},
  {name:"Paramount Surgimed Ltd",person:"Deepak Sharma",target:12039.0,achieved:329.97,activeDays:16},
  {name:"Haier CCR",person:"Deepak Sharma",target:36298.0,achieved:3903.42,activeDays:16},
  {name:"Bombax",person:"Sangeet Dhasmana",target:97357.0,achieved:39473.55,activeDays:16},
  {name:"Kumar Services",person:"Deepak Sharma",target:13725.0,achieved:2633.26,activeDays:16},
  {name:"Edusoft Healthcare Ltd",person:"Deepak Sharma",target:3631.0,achieved:0,activeDays:16},
  {name:"Oneiric Appliances Pvt Ltd",person:"Deepak Sharma",target:15232.0,achieved:3892.02,activeDays:16},
  {name:"Vaidrishi Laboratories Pvt Ltd",person:"Sangeet Dhasmana",target:2357.0,achieved:1382.2,activeDays:16},
  {name:"Sukuga Technologies Pvt Ltd",person:"Deepak Sharma",target:10142.0,achieved:3105.92,activeDays:16},
  {name:"Cosmos Pumps Pvt Ltd",person:"Deepak Sharma",target:11398.0,achieved:5090.99,activeDays:16},
  {name:"Loom Solar Pvt Ltd",person:"Deepak Sharma",target:14458.0,achieved:4085.0,activeDays:16},
  {name:"Medical Science",person:"Sangeet Dhasmana",target:6013.75,achieved:3261.02,activeDays:16},
  {name:"Epson",person:"Sangeet Dhasmana",target:3000.0,achieved:1457.0,activeDays:16},
  {name:"Conficore",person:"Sangeet Dhasmana",target:5000.0,achieved:1970.33,activeDays:16},
];

clients.forEach(c=>{
  c.pct=c.target>0?Math.round(c.achieved/c.target*100):(c.achieved>0?999:0);
  c.avgDay=c.activeDays>0?Math.round(c.achieved/c.activeDays):0;
  c.remaining=Math.max((c.target||0)-c.achieved,0);
  c.daysNeeded=c.avgDay>0&&c.remaining>0?+(c.remaining/c.avgDay).toFixed(1):(c.remaining===0?0:999);
});

// Period targets, straight from the "First/Mid/Last 10 days Target (kg)" columns.
const pT={
  "Carrier Refrigeration":{first10:80206.0,mid10:82701.0,last10:130166.0},
  "Carrier CTD":{first10:25101.0,mid10:25010.0,last10:24349.0},
  "Mitras Technocrafts Pvt Ltd-HR":{first10:3776.0,mid10:3861.0,last10:5864.0},
  "Paramount Surgimed Ltd":{first10:722.0,mid10:2366.0,last10:8951.0},
  "Haier CCR":{first10:18946.0,mid10:8955.0,last10:8397.0},
  "Bombax":{first10:30657.0,mid10:35146.0,last10:31554.0},
  "Kumar Services":{first10:4345.0,mid10:5022.0,last10:4358.0},
  "Edusoft Healthcare Ltd":{first10:2905.0,mid10:726.0,last10:0.0},
  "Oneiric Appliances Pvt Ltd":{first10:7019.0,mid10:3241.0,last10:4972.0},
  "Vaidrishi Laboratories Pvt Ltd":{first10:534.0,mid10:691.0,last10:1132.0},
  "Sukuga Technologies Pvt Ltd":{first10:1797.0,mid10:3759.0,last10:4586.0},
  "Cosmos Pumps Pvt Ltd":{first10:4689.0,mid10:3344.0,last10:3365.0},
  "Loom Solar Pvt Ltd":{first10:3075.0,mid10:5637.0,last10:5746.0},
  "Medical Science":{first10:0.0,mid10:1324.48,last10:4689.52},
  "Epson":{first10:1444.0,mid10:1148.0,last10:408.0},
  "Conficore":{first10:5000.0,mid10:0.0,last10:0.0},
};

// Period achieved — summed from the daily entries through Aug 16 (Aug 15 a holiday, Sundays excluded).
const pA={
  "Carrier Refrigeration":{first10:97073.34,mid10:36700.35,last10:null},
  "Carrier CTD":{first10:26498.34,mid10:13005.34,last10:null},
  "Mitras Technocrafts Pvt Ltd-HR":{first10:501.98,mid10:1313.72,last10:null},
  "Paramount Surgimed Ltd":{first10:null,mid10:329.97,last10:null},
  "Haier CCR":{first10:2910.89,mid10:992.31,last10:null},
  "Bombax":{first10:29217.84,mid10:10253.64,last10:null},
  "Kumar Services":{first10:128.0,mid10:2505.26,last10:null},
  "Edusoft Healthcare Ltd":{first10:null,mid10:null,last10:null},
  "Oneiric Appliances Pvt Ltd":{first10:564.01,mid10:3328.01,last10:null},
  "Vaidrishi Laboratories Pvt Ltd":{first10:1015.3,mid10:366.9,last10:null},
  "Sukuga Technologies Pvt Ltd":{first10:1586.86,mid10:1518.98,last10:null},
  "Cosmos Pumps Pvt Ltd":{first10:4325.0,mid10:765.99,last10:null},
  "Loom Solar Pvt Ltd":{first10:4035.0,mid10:50.0,last10:null},
  "Medical Science":{first10:2735.02,mid10:526.0,last10:null},
  "Epson":{first10:290.0,mid10:1167.0,last10:null},
  "Conficore":{first10:1893.0,mid10:77.33,last10:null},
};

clients.forEach(c=>{
  const t=pT[c.name],a=pA[c.name];
  c.periods={
    first10:{target:t?t.first10:null,achieved:a?a.first10:null},
    mid10:{target:t?t.mid10:null,achieved:a?a.mid10:null},
    last10:{target:t?t.last10:null,achieved:a?a.last10:null}
  };
});

// EDD Crossed — from "Order EDD Crossed" sheet (deduplicated), grouped by customer. Haier merged into Haier CCR.
const eddData=[
  {name:"Bombax",count:73},
  {name:"Carrier Refrigeration",count:53},
  {name:"Epson India",count:9},
  {name:"Oneric Appliances",count:8},
  {name:"Carrier - CTD",count:6},
  {name:"Haier CCR",count:4},
  {name:"MITRAS",count:3},
  {name:"Loom Solar",count:3},
  {name:"Kumar Services",count:3},
  {name:"Medical Science",count:2},
  {name:"Sukuga",count:1},
  {name:"Vaidrishi Laboratories",count:1},
  {name:"Conficore",count:1},
];
const eddTotal=eddData.reduce((a,b)=>a+b.count,0);

// Full EDD-crossed order detail. This file's classification column is now named "Delayed by" (was
// "Vendor / Customer" previously) but carries the same Customer/Vendor values, used directly.
const eddDetail=[
  {id:"MVS/26-27/1304",name:"Bombax",transporter:"EKART",edd:"28 Apr 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/2694",name:"Bombax",transporter:"EKART",edd:"19 May 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/3032",name:"Bombax",transporter:"EKART",edd:"23 May 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/6589",name:"Bombax",transporter:"EKART",edd:"03 Jul 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/6675",name:"Bombax",transporter:"EKART",edd:"06 Jul 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/6865",name:"Bombax",transporter:"DP WORLD",edd:"10 Jul 2026",reason:"Need RTO Documents",type:"Customer"},
  {id:"MVS/26-27/7103",name:"Bombax",transporter:"EKART",edd:"11 Jul 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/7560",name:"Bombax",transporter:"EKART",edd:"17 Jul 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/9134",name:"Bombax",transporter:"EKART",edd:"31 Jul 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/9141",name:"Bombax",transporter:"EKART",edd:"29 Jul 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/9455",name:"Sukuga",transporter:"DP WORLD",edd:"01 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/9525",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"31 Jul 2026",reason:"Connection route impacted due to kawar yatra",type:"Vendor"},
  {id:"MVS/26-27/9600",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"02 Aug 2026",reason:"Hold by consignee due to space issue",type:"Customer"},
  {id:"MVS/26-27/9620",name:"Carrier Refrigeration",transporter:"EKART",edd:"02 Aug 2026",reason:"Delayed – Missed Connection",type:"Vendor"},
  {id:"MVS/26-27/9627",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"01 Aug 2026",reason:"No Entry Issue",type:"Customer"},
  {id:"MVS/26-27/9646",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"01 Aug 2026",reason:"refused by Carrier WH team",type:"Customer"},
  {id:"MVS/26-27/9769",name:"Bombax",transporter:"EKART",edd:"05 Aug 2026",reason:"Delayed – Missed Connection",type:"Vendor"},
  {id:"MVS/26-27/9822",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"04 Aug 2026",reason:"Hold By Consignee",type:"Customer"},
  {id:"MVS/26-27/9831",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"03 Aug 2026",reason:"Hold by consignee",type:"Customer"},
  {id:"MVS/26-27/9889",name:"Bombax",transporter:"EKART",edd:"04 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10006",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"05 Aug 2026",reason:"Pending due to document issue",type:"Customer"},
  {id:"MVS/26-27/10082",name:"Bombax",transporter:"EKART",edd:"06 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10121",name:"Oneric Appliances",transporter:"GATI",edd:"05 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10173",name:"Carrier Refrigeration",transporter:"EKART",edd:"05 Aug 2026",reason:"Unreachable box",type:"Vendor"},
  {id:"MVS/26-27/10223",name:"Oneric Appliances",transporter:"DP WORLD",edd:"03 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10242",name:"Bombax",transporter:"EKART",edd:"08 Aug 2026",reason:"Delayed – Missed Connection",type:"Vendor"},
  {id:"MVS/26-27/10243",name:"Bombax",transporter:"EKART",edd:"07 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10245",name:"Bombax",transporter:"EKART",edd:"07 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10257",name:"Bombax",transporter:"EKART",edd:"09 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10265",name:"Bombax",transporter:"EKART",edd:"08 Aug 2026",reason:"Delayed – Missed Connection",type:"Vendor"},
  {id:"MVS/26-27/10267",name:"MITRAS",transporter:"EKART",edd:"04 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10278",name:"Carrier Refrigeration",transporter:"EKART",edd:"06 Aug 2026",reason:"ODC shipment – 2 delivery attempts failed: 1st due...",type:"Customer"},
  {id:"MVS/26-27/10289",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"07 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10300",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"07 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10337",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"08 Aug 2026",reason:"Refused by Customer",type:"Customer"},
  {id:"MVS/26-27/10437",name:"Bombax",transporter:"EKART",edd:"11 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10440",name:"Bombax",transporter:"EKART",edd:"08 Aug 2026",reason:"Delayed – Missed Connection",type:"Vendor"},
  {id:"MVS/26-27/10450",name:"Loom Solar",transporter:"GATI",edd:"10 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10509",name:"Bombax",transporter:"EKART",edd:"11 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10510",name:"Bombax",transporter:"EKART",edd:"12 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10513",name:"Bombax",transporter:"EKART",edd:"11 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10515",name:"Bombax",transporter:"EKART",edd:"11 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10520",name:"Bombax",transporter:"EKART",edd:"11 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10531",name:"Bombax",transporter:"EKART",edd:"09 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10533",name:"Bombax",transporter:"EKART",edd:"11 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10535",name:"Bombax",transporter:"EKART",edd:"10 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10537",name:"Bombax",transporter:"EKART",edd:"12 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10540",name:"Bombax",transporter:"EKART",edd:"11 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10543",name:"Bombax",transporter:"EKART",edd:"12 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10546",name:"Bombax",transporter:"EKART",edd:"11 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10547",name:"Bombax",transporter:"EKART",edd:"11 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10551",name:"Bombax",transporter:"EKART",edd:"09 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10553",name:"Bombax",transporter:"EKART",edd:"09 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10576",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"09 Aug 2026",reason:"Alt contact required",type:"Customer"},
  {id:"MVS/26-27/10590",name:"Carrier Refrigeration",transporter:"EKART",edd:"06 Aug 2026",reason:"Delayed – Missed Connection",type:"Vendor"},
  {id:"MVS/26-27/10592",name:"Carrier Refrigeration",transporter:"EKART",edd:"06 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10601",name:"Carrier Refrigeration",transporter:"EKART",edd:"10 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10621",name:"MITRAS",transporter:"GATI",edd:"08 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10635",name:"Bombax",transporter:"DP WORLD",edd:"11 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10654",name:"Bombax",transporter:"EKART",edd:"13 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10658",name:"Bombax",transporter:"EKART",edd:"13 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10660",name:"Bombax",transporter:"EKART",edd:"12 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10665",name:"Bombax",transporter:"EKART",edd:"13 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10679",name:"Bombax",transporter:"EKART",edd:"12 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10682",name:"Bombax",transporter:"EKART",edd:"13 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10722",name:"Carrier Refrigeration",transporter:"DP WORLD",edd:"10 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10725",name:"Epson India",transporter:"EKART",edd:"12 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10727",name:"Epson India",transporter:"EKART",edd:"10 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10773",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"10 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10823",name:"Bombax",transporter:"EKART",edd:"14 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10825",name:"Bombax",transporter:"EKART",edd:"13 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10827",name:"Bombax",transporter:"EKART",edd:"13 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10829",name:"Bombax",transporter:"EKART",edd:"14 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10833",name:"Bombax",transporter:"EKART",edd:"13 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10834",name:"Bombax",transporter:"EKART",edd:"13 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10836",name:"Carrier Refrigeration",transporter:"DP WORLD",edd:"11 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10838",name:"Loom Solar",transporter:"DP WORLD",edd:"09 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10841",name:"Carrier - CTD",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10895",name:"Carrier Refrigeration",transporter:"EKART",edd:"11 Aug 2026",reason:"Alt contact required",type:"Customer"},
  {id:"MVS/26-27/10903",name:"Carrier Refrigeration",transporter:"EKART",edd:"11 Aug 2026",reason:"Connection Delayed from BDB Branch",type:"Vendor"},
  {id:"MVS/26-27/10904",name:"Carrier Refrigeration",transporter:"EKART",edd:"12 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10908",name:"Carrier Refrigeration",transporter:"EKART",edd:"13 Aug 2026",reason:"Connection was Missed as Shipment was Untraceable....",type:"Vendor"},
  {id:"MVS/26-27/10909",name:"Carrier Refrigeration",transporter:"EKART",edd:"09 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10925",name:"Bombax",transporter:"EKART",edd:"14 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10927",name:"Bombax",transporter:"EKART",edd:"14 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10928",name:"Bombax",transporter:"EKART",edd:"12 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10929",name:"Bombax",transporter:"EKART",edd:"12 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10932",name:"Bombax",transporter:"EKART",edd:"12 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/10936",name:"Bombax",transporter:"DP WORLD",edd:"12 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10938",name:"Oneric Appliances",transporter:"DP WORLD",edd:"11 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10975",name:"Carrier Refrigeration",transporter:"EKART",edd:"12 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10979",name:"Carrier Refrigeration",transporter:"EKART",edd:"13 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10984",name:"Carrier Refrigeration",transporter:"EKART",edd:"11 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10986",name:"Carrier Refrigeration",transporter:"EKART",edd:"13 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/10995",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11009",name:"Carrier - CTD",transporter:"DP WORLD",edd:"13 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11033",name:"Bombax",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11040",name:"Bombax",transporter:"DP WORLD",edd:"14 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11046",name:"Bombax",transporter:"EKART",edd:"15 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/11047",name:"Bombax",transporter:"EKART",edd:"15 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/11048",name:"Bombax",transporter:"EKART",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11053",name:"Bombax",transporter:"EKART",edd:"15 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/11057",name:"Bombax",transporter:"EKART",edd:"15 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/11059",name:"Bombax",transporter:"EKART",edd:"15 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/11061",name:"Bombax",transporter:"EKART",edd:"15 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/11063",name:"Bombax",transporter:"EKART",edd:"14 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/11064",name:"Bombax",transporter:"EKART",edd:"15 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/11068",name:"Bombax",transporter:"EKART",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11080",name:"Carrier Refrigeration",transporter:"EKART",edd:"14 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11082",name:"Carrier Refrigeration",transporter:"DP WORLD",edd:"14 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11090",name:"Epson India",transporter:"EKART",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11093",name:"Bombax",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11099",name:"Bombax",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11100",name:"Carrier - CTD",transporter:"DP WORLD",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11101",name:"Carrier - CTD",transporter:"DP WORLD",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11118",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11125",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11145",name:"Vaidrishi Laboratories",transporter:"DP WORLD",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11156",name:"Carrier Refrigeration",transporter:"EKART",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11160",name:"Medical Science",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11161",name:"Medical Science",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11163",name:"Kumar Services",transporter:"LAST MILE",edd:"15 Aug 2026",reason:"National Holiday",type:"Vendor"},
  {id:"MVS/26-27/11166",name:"Haier CCR",transporter:"DP WORLD",edd:"13 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11168",name:"Epson India",transporter:"EKART",edd:"14 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11169",name:"Epson India",transporter:"EKART",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11171",name:"Epson India",transporter:"EKART",edd:"14 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11172",name:"Epson India",transporter:"EKART",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11174",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11176",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11177",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11194",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"13 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11206",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11207",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11208",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11215",name:"Carrier - CTD",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11216",name:"Carrier - CTD",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11236",name:"Bombax",transporter:"EKART",edd:"15 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/11237",name:"Bombax",transporter:"EKART",edd:"15 Aug 2026",reason:"Delayed- Mall Delivery Timing Restriction",type:"Customer"},
  {id:"MVS/26-27/11246",name:"Carrier Refrigeration",transporter:"EKART",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11248",name:"Conficore",transporter:"DP WORLD",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11249",name:"Carrier Refrigeration",transporter:"DP WORLD",edd:"14 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11252",name:"Carrier Refrigeration",transporter:"DP WORLD",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11274",name:"Bombax",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11276",name:"Kumar Services",transporter:"LAST MILE",edd:"15 Aug 2026",reason:"National Holiday",type:"Vendor"},
  {id:"MVS/26-27/11280",name:"Oneric Appliances",transporter:"GATI",edd:"13 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11285",name:"Haier CCR",transporter:"EKART",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11286",name:"Kumar Services",transporter:"LAST MILE",edd:"16 Aug 2026",reason:"National Holiday",type:"Vendor"},
  {id:"MVS/26-27/11290",name:"Oneric Appliances",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11298",name:"Bombax",transporter:"EKART",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11301",name:"Bombax",transporter:"EKART",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11312",name:"MITRAS",transporter:"DP WORLD",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11320",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11331",name:"Carrier Refrigeration",transporter:"EKART",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11332",name:"Carrier Refrigeration",transporter:"EKART",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11338",name:"Carrier Refrigeration",transporter:"EKART",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11367",name:"Loom Solar",transporter:null,edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11369",name:"Epson India",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11371",name:"Haier CCR",transporter:"XP INDIA",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11377",name:"Oneric Appliances",transporter:"GATI",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11379",name:"Epson India",transporter:"EKART",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11392",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11393",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11402",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11412",name:"Carrier Refrigeration",transporter:"XP INDIA",edd:"15 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11470",name:"Oneric Appliances",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11471",name:"Oneric Appliances",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
  {id:"MVS/26-27/11481",name:"Haier CCR",transporter:"DP WORLD",edd:"16 Aug 2026",reason:null,type:"Vendor"},
];

// Open Shipment — from "Open Shipment" sheet (deduplicated), grouped by customer. Haier merged into Haier CCR.
const openData=[
  {name:"Carrier Refrigeration",count:192},
  {name:"Bombax",count:182},
  {name:"Carrier - CTD",count:57},
  {name:"Epson India",count:21},
  {name:"Oneric Appliances",count:13},
  {name:"Sukuga",count:12},
  {name:"Haier CCR",count:11},
  {name:"Medical Science",count:7},
  {name:"Kumar Services",count:6},
  {name:"Loom Solar",count:5},
  {name:"MITRAS",count:4},
  {name:"Cosmos Pumps Pvt. Ltd.",count:4},
  {name:"Vaidrishi Laboratories",count:2},
  {name:"Paramount Surgimed Ltd",count:1},
  {name:"Conficore",count:1},
];
const openTotal=openData.reduce((a,b)=>a+b.count,0);

// Due Tomorrow — from "Order due Tommorow" sheet (deduplicated), grouped by customer.
const dueData=[
  {name:"Carrier Refrigeration",count:29},
  {name:"Bombax",count:17},
  {name:"Sukuga",count:2},
  {name:"Cosmos Pumps Pvt. Ltd.",count:2},
  {name:"Carrier - CTD",count:2},
  {name:"Medical Science",count:1},
  {name:"Epson India",count:1},
  {name:"Haier CCR",count:1},
  {name:"Kumar Services",count:1},
];
const dueTotal=dueData.reduce((a,b)=>a+b.count,0);

// Booked Yesterday — "Shipment Booked Yesterday" sheet had no bookings logged.
const bookedData=[
];
const bookedTotal=bookedData.reduce((a,b)=>a+b.count,0);

// Daily Tonnage — "Daily Tonnage" sheet had no entries.
const dailyTonnageData=[
];

const dailyTotal=dailyTonnageData.reduce((a,b)=>a+b.kg,0);
const monthlyTotal=clients.reduce((a,c)=>a+c.achieved,0);
// Aug 2026: 12 active working days with data through Aug 16 (Aug 2, 9, 16 Sundays; Aug 15 a holiday).
const activeDays=16;
const dailyAverage=monthlyTotal/activeDays;

const RATES={
  'Bombax':14.38,'Carrier Refrigeration':11.26,'Carrier CTD':13.43,
  'Cosmos Pumps Pvt Ltd':13.16,'Edusoft Healthcare Ltd':13.77,
  'Haier CCR':16.53,'Kumar Services':10.20,
  'Loom Solar Pvt Ltd':20.75,'Medical Science':11.64,
  'Mitras Technocrafts Pvt Ltd-HR':11.11,'Oneiric Appliances Pvt Ltd':13.13,
  'Sukuga Technologies Pvt Ltd':14.79,'Vaidrishi Laboratories Pvt Ltd':12.73
};
const DR=10;
const rate=n=>RATES[n]||DR;
const fR=v=>'₹'+v.toLocaleString('en-IN',{maximumFractionDigits:0});
const fK=v=>v.toLocaleString('en-IN',{maximumFractionDigits:0});

// Fixed monthly revenue target (₹), set explicitly rather than derived from per-client kg targets.
const FIXED_TARGET_MONEY=8445000;
const totalTargetMoney=FIXED_TARGET_MONEY;
const totalSalesMoney=clients.reduce((s,c)=>s+(c.achieved||0)*rate(c.name),0);
const DAYS=31;
const dailyMoneyRate=totalSalesMoney/activeDays;
const predictedSales=dailyMoneyRate*DAYS;
const predictedPct=totalTargetMoney>0?(predictedSales/totalTargetMoney*100):null;

// Populate KPIs
$('kpi-open').textContent=openTotal;
$('kpi-edd').textContent=eddTotal;
$('kpi-edd-pct').textContent=Math.round(eddTotal/openTotal*100)+'% of open';
$('kpi-due').textContent=dueTotal;
$('kpi-booked').textContent=bookedTotal;
$('kpi-daily-ton').innerHTML=dailyTotal.toLocaleString('en-IN',{maximumFractionDigits:2})+' <span style="font-size:.75rem;font-weight:500;color:'+C.text3+'">kg</span>';
$('kpi-month-ton').innerHTML=monthlyTotal.toLocaleString('en-IN',{maximumFractionDigits:2})+' <span style="font-size:.75rem;font-weight:500;color:'+C.text3+'">kg</span>';
$('kpi-daily-avg').innerHTML=dailyAverage.toLocaleString('en-IN',{maximumFractionDigits:0})+' <span style="font-size:.75rem;font-weight:500;color:'+C.text3+'">kg/day</span>';
$('kpi-target-money').textContent=fR(totalTargetMoney);
$('kpi-sales-money').textContent=fR(totalSalesMoney);

['strip-edd','dl-edd'].forEach(id=>{const e=$(id);if(e)e.textContent=eddTotal});
['strip-transit','dl-transit'].forEach(id=>{const e=$(id);if(e)e.textContent=openTotal-eddTotal});
['strip-due','dl-due'].forEach(id=>{const e=$(id);if(e)e.textContent=dueTotal});
['strip-booked','dl-booked'].forEach(id=>{const e=$(id);if(e)e.textContent=bookedTotal});
const eb=$('tab-edd-badge');if(eb)eb.textContent=eddTotal;

// Open Table
const otb=$('open-table-body');
if(otb)openData.forEach((d,i)=>{
  const ec=(eddData.find(e=>e.name===d.name)||{}).count||0;
  const dc=(dueData.find(e=>e.name===d.name)||{}).count||0;
  const pct=Math.round(ec/d.count*100);
  const risk=pct>=70?['Critical','delayed']:pct>=40?['High','delayed']:pct>=20?['Medium','open']:['Low','due'];
  otb.innerHTML+=`<tr><td style="color:${C.text4};font-size:.78rem">${String(i+1).padStart(2,'0')}</td><td><strong>${d.name}</strong></td><td>${d.count}</td><td style="color:${C.orange};font-weight:600">${ec}</td><td style="color:${C.text2};font-weight:500">${dc}</td><td style="color:${pct>=50?C.orange:C.text2};font-weight:600">${pct}%</td><td><span class="badge ${risk[1]}">${risk[0]}</span></td></tr>`;
});

// EDD KPIs & Detail
function renderEddKpis(list){
  if(!list||!list.length)return;
  const total=list.length;
  $('edd-total-count').textContent=total;
  const rc={},cc={};
  list.forEach(item=>{
    const r=item.reason||'Intransit Delay';
    const c=item.transporter||'Unassigned';
    rc[r]=(rc[r]||0)+1;cc[c]=(cc[c]||0)+1;
  });
  const sr=Object.entries(rc).sort((a,b)=>b[1]-a[1]);
  const sc=Object.entries(cc).sort((a,b)=>b[1]-a[1]);
  if(sr[0]){
    $('edd-top-reason-name').textContent=sr[0][0];
    $('edd-top-reason-pct').textContent=Math.round(sr[0][1]/total*100)+'% ('+sr[0][1]+')';
  }
  if(sc[0]){
    $('edd-worst-carrier').textContent=sc[0][0];
    $('edd-worst-carrier-count').textContent=sc[0][1]+' delayed';
  }
  const bars=$('edd-reason-bars');
  if(bars)bars.innerHTML=sr.slice(0,3).map(([r,c])=>{
    const p=Math.round(c/total*100);
    return`<div class="reason-bar-item"><div class="reason-bar-header"><span class="reason-label" title="${r}">${r}</span><span class="reason-val">${p}% (${c})</span></div><div class="reason-progress-bg"><div class="reason-progress-fill" style="width:${p}%"></div></div></div>`;
  }).join('');
}

function renderEddRows(rows){
  const tbody=$('edd-detail-body'),cnt=$('edd-detail-count');
  if(!tbody)return;
  if(cnt)cnt.textContent=rows.length+' of '+eddDetail.length+' orders';
  if(!rows.length){
    tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;color:${C.text3};padding:32px">No matching orders.</td></tr>`;
    return;
  }
  tbody.innerHTML=rows.map(r=>{
    const typeBadge=r.type==='Customer'?`<span class="cv-chip cv-chip-customer">Customer</span>`
      :r.type==='Vendor'?`<span class="cv-chip cv-chip-vendor">Vendor</span>`
      :`<span class="cv-chip cv-chip-unclassified">—</span>`;
    return `<tr><td style="font-weight:600;font-size:.76rem;color:${C.orange}">${r.id}</td><td><strong>${r.name}</strong></td><td>${typeBadge}</td><td>${r.transporter||'—'}</td><td style="color:${C.text};font-weight:500">${r.edd||'—'}</td><td>${r.reason||`<span style="color:${C.text4};font-style:italic">Intransit Delay</span>`}</td></tr>`;
  }).join('');
  renderEddKpis(rows);
}

// Reads the search box + 3 dropdown filters and returns the matching eddDetail rows.
function filterEddRows(){
  const q=($('edd-search')?.value||'').trim().toLowerCase();
  const type=$('edd-filter-type')?.value||'';
  const transporter=$('edd-filter-transporter')?.value||'';
  const reason=$('edd-filter-reason')?.value||'';
  return eddDetail.filter(r=>{
    if(q){
      const hay=(r.name+' '+r.id+' '+(r.transporter||'')+' '+(r.reason||'')).toLowerCase();
      if(!hay.includes(q))return false;
    }
    if(type&&r.type!==type)return false;
    if(transporter&&(r.transporter||'Unassigned')!==transporter)return false;
    if(reason&&(r.reason||'Unclassified / Intransit Delay')!==reason)return false;
    return true;
  });
}

function applyEddFilters(){
  renderEddRows(filterEddRows());
}
window.applyEddFilters=applyEddFilters;

function resetEddFilters(){
  const s=$('edd-search'),t=$('edd-filter-type'),tr=$('edd-filter-transporter'),r=$('edd-filter-reason');
  if(s)s.value='';
  if(t)t.value='';
  if(tr)tr.value='';
  if(r)r.value='';
  applyEddFilters();
}
window.resetEddFilters=resetEddFilters;

// Fills the three filter dropdowns from the actual data, so options never go stale.
function populateEddFilterOptions(){
  const typeSel=$('edd-filter-type'),transSel=$('edd-filter-transporter'),reasonSel=$('edd-filter-reason');
  const addOptions=(sel,values)=>{
    if(!sel)return;
    values.forEach(v=>{
      const opt=document.createElement('option');
      opt.value=v;
      opt.textContent=v.length>55?v.slice(0,52)+'…':v;
      sel.appendChild(opt);
    });
  };
  const types=[...new Set(eddDetail.map(r=>r.type).filter(Boolean))].sort();
  const transporters=[...new Set(eddDetail.map(r=>r.transporter||'Unassigned'))].sort();
  const reasons=[...new Set(eddDetail.map(r=>r.reason||'Unclassified / Intransit Delay'))].sort();
  addOptions(typeSel,types);
  addOptions(transSel,transporters);
  addOptions(reasonSel,reasons);
}

// Exports whatever is currently filtered/visible to a downloadable .xlsx workbook.
function exportEddToExcel(){
  if(typeof XLSX==='undefined'){console.warn('XLSX library not loaded — cannot export');return;}
  const rows=filterEddRows();
  const data=rows.map(r=>({
    'Order ID':r.id,'Customer':r.name,'Type':r.type||'',
    'Transporter':r.transporter||'','EDD':r.edd||'',
    'Delay Reason':r.reason||'Intransit Delay'
  }));
  const ws=XLSX.utils.json_to_sheet(data);
  ws['!cols']=[{wch:18},{wch:24},{wch:12},{wch:14},{wch:14},{wch:45}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'EDD Crossed');
  XLSX.writeFile(wb,'MVIKAS_EDD_Crossed_'+new Date().toISOString().slice(0,10)+'.xlsx');
}
window.exportEddToExcel=exportEddToExcel;

function goToEddDetail(){
  const btn=$('tab-btn-edd');
  if(btn)switchTab('edd',btn);
  $('tab-edd')?.scrollIntoView({behavior:'smooth'});
}
window.goToEddDetail=goToEddDetail;

// Charts
const CF={size:11,weight:'500'};

safeChart($('statusDonut'),{
  type:'doughnut',
  data:{
    labels:['EDD Crossed','In Transit','Due Tomorrow','Booked'],
    datasets:[{
      data:[eddTotal,openTotal-eddTotal,dueTotal,bookedTotal],
      backgroundColor:[C.orange, '#8b8b8b', '#5a5a5a', '#3a3a3a'],
      borderWidth:2,borderColor:C.s2,hoverOffset:10
    }]
  },
  options:{
    responsive:true,maintainAspectRatio:false,cutout:'70%',
    animation:{animateRotate:true,animateScale:true,duration:1300,easing:'easeOutQuart'},
    plugins:{legend:{display:false}}
  }
});

safeChart($('eddBarChart'),{
  type:'bar',
  data:{
    labels:eddData.map(d=>d.name),
    datasets:[{label:'EDD Crossed',data:eddData.map(d=>d.count),backgroundColor:C.orange,borderRadius:4}]
  },
  options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,animation:{duration:1100},plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{font:CF}},y:{ticks:{font:CF},grid:{display:false}}}}
});

safeChart($('dueTmrChart'),{
  type:'bar',
  data:{labels:dueData.map(d=>d.name),datasets:[{label:'Due',data:dueData.map(d=>d.count),backgroundColor:orangeA(.6),borderRadius:4}]},
  options:{responsive:true,maintainAspectRatio:false,animation:{duration:1100},plugins:{legend:{display:false}},scales:{x:{ticks:{autoSkip:false,maxRotation:30,font:CF},grid:{display:false}},y:{beginAtZero:true}}}
});

safeChart($('bookedChart'),{
  type:'bar',
  data:{labels:bookedData.map(d=>d.name),datasets:[{label:'Booked',data:bookedData.map(d=>d.count),backgroundColor:'#8b8b8b',borderRadius:4}]},
  options:{responsive:true,maintainAspectRatio:false,animation:{duration:1100},plugins:{legend:{display:false}},scales:{x:{ticks:{autoSkip:false,maxRotation:30,font:CF},grid:{display:false}},y:{beginAtZero:true}}}
});

// Tonnage
function bucketColor(pct){
  if(pct===null||pct===undefined)return C.text4;
  if(pct>=80)return C.orange;
  if(pct>=50)return C.text2;
  return C.text3;
}

const PL={full:'Tonnage — % Completion',first10:'First 10 Days',mid10:'Mid 10 Days',last10:'Last 10 Days'};
const PS={full:'Full Month',first10:'First 10 Days',mid10:'Mid 10 Days',last10:'Last 10 Days'};
let curPeriod='full';

function getPStats(c,p){
  if(p==='full')return{achieved:c.achieved,target:c.target};
  const d=c.periods&&c.periods[p];
  return{achieved:d?d.achieved:null,target:d?d.target:null};
}

function setTonnagePeriod(p){
  curPeriod=p;
  renderTonnageBars();
  renderTonnageCharts();
  renderKamSummary();
}
window.setTonnagePeriod=setTonnagePeriod;

function renderTonnageBars(){
  const el=$('tonnage-bars');if(!el)return;
  const ti=$('tonnage-panel-title');if(ti)ti.textContent=PL[curPeriod];
  const wd=clients.map(c=>{const{achieved,target}=getPStats(c,curPeriod);return{c,achieved,target}}).filter(r=>(r.achieved>0)||(r.target>0));
  const tier=item=>{
    const ht=item.target>0,ha=item.achieved>0;
    if(!ht)return 3;if(!ha)return 4;
    const p=Math.round(item.achieved/item.target*100);
    return p>=80?1:p>=50?2:4;
  };
  wd.sort((a,b)=>{
    const d=tier(a)-tier(b);if(d)return d;
    const pA=a.target&&a.achieved?a.achieved/a.target:0;
    const pB=b.target&&b.achieved?b.achieved/b.target:0;
    return pB-pA||(b.achieved||0)-(a.achieved||0);
  });
  if(!wd.length){el.innerHTML='<div class="tonnage-empty">No data.</div>';return}
  el.innerHTML=wd.map(({c,achieved,target})=>{
    const ht=target>0,ha=achieved>0;
    let pct=null;
    if(ht)pct=ha?Math.round(achieved/target*100):0;
    const dp=pct!==null?Math.min(pct,100):100;
    const nc=bucketColor(pct);
    const pl=pct!==null?pct+'%':'—';
    const nt=c.isNew?'<span class="new-tag">New</span>':'';
    let ta;
    if(ht&&ha)ta=fK(achieved)+' / '+fK(target)+` <span style="color:${C.text4}">kg</span>`;
    else if(ht&&!ha)ta='0 / '+fK(target)+` <span style="color:${C.text4}">kg</span>`;
    else ta=fK(achieved)+` <span style="color:${C.text4}">kg</span>`;
    const r=rate(c.name);
    const vl=ha?`<div class="value-badge"><span class="value-amount">${fR(achieved*r)}</span><span class="value-rate">@₹${r}/kg</span></div>`:'';
    return`<div class="client-row"><div class="client-name" title="${c.name}"><span class="client-name-text" style="color:${C.text};font-weight:600">${c.name}</span>${nt}</div><div class="client-person">${c.person}</div><div class="prog-bar-wrap"><div class="prog-bar" style="width:${dp}%;background:${nc}"></div></div><div class="pct-text" style="color:${nc}">${pl}</div><div class="client-tonnage"><div>${ta}</div>${vl}</div></div>`;
  }).join('');
}

const tl=$('tonnage-legend');
if(tl)tl.innerHTML=[['0–50%',C.text3],['50–80%',C.text2],['80%+',C.orange]].map(([l,c])=>`<span><span class="legend-dot" style="background:${c}"></span>${l}</span>`).join('')+'<span><span class="new-tag" style="margin-left:0">New</span> recently onboarded</span>';

let tci=null;
function renderTonnageCharts(){
  const top=clients.map(c=>{const{achieved,target}=getPStats(c,curPeriod);return{name:c.name,achieved:achieved||0,target:target||0}}).filter(r=>r.achieved>0||r.target>0).sort((a,b)=>(b.achieved||b.target)-(a.achieved||a.target)).slice(0,8);
  if(tci)tci.destroy();
  tci=safeChart($('targetChart'),{
    type:'bar',
    data:{
      labels:top.map(r=>r.name),
      datasets:[
        {label:'Target',data:top.map(r=>r.target),backgroundColor:'#3a3a3a',borderRadius:4},
        {label:'Achieved',data:top.map(r=>r.achieved),backgroundColor:C.orange,borderRadius:4}
      ]
    },
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,animation:{duration:1100},plugins:{legend:{position:'bottom',labels:{boxWidth:12,padding:14,font:CF,color:C.text2}},title:{display:true,text:'Target vs Achieved — '+PS[curPeriod],font:{size:11,weight:'500'},color:C.text3,padding:{bottom:16}}},scales:{x:{beginAtZero:true,ticks:{callback:v=>(v/1000).toFixed(0)+'k',font:CF}},y:{ticks:{font:CF},grid:{display:false}}}}
  });
}

// Daily Table
const dtb=$('daily-table-body');
if(dtb)clients.filter(c=>c.achieved>0).forEach(c=>{
  const pct=c.target>0?Math.round(c.achieved/c.target*100)+'%':'—';
  const pc=c.target>0?(c.achieved>=c.target?C.orange:C.text2):C.text4;
  const rem=c.target>0?Math.max(c.target-c.achieved,0).toLocaleString('en-IN'):'—';
  const df=c.target>0&&c.avgDay>0&&c.remaining>0?+(c.remaining/c.avgDay).toFixed(1):(c.target>0&&c.remaining===0?'✓':'—');
  dtb.innerHTML+=`<tr><td style="font-weight:600">${c.name}</td><td style="font-size:.78rem;color:${C.text3}">${c.person}</td><td>${c.target>0?c.target.toLocaleString('en-IN'):'—'}</td><td>${c.achieved.toLocaleString('en-IN')}</td><td style="color:${pc};font-weight:600">${pct}</td><td>${c.activeDays}</td><td>${c.avgDay.toLocaleString('en-IN')}</td><td style="color:${C.text2};font-weight:500">${rem}</td><td style="color:${C.orange};font-weight:600">${df}</td></tr>`;
});

// Avg/Day chart
const topAvg=clients.filter(c=>c.avgDay>0).sort((a,b)=>b.avgDay-a.avgDay).slice(0,10);
safeChart($('avgDayChart'),{
  type:'bar',
  data:{labels:topAvg.map(c=>c.name),datasets:[{label:'Avg kg/day',data:topAvg.map(c=>c.avgDay),backgroundColor:C.orange,borderRadius:4}]},
  options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,animation:{duration:1100},plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{callback:v=>v.toLocaleString('en-IN'),font:CF}},y:{ticks:{font:CF},grid:{display:false}}}}
});

// Days chart
const dc=$('daysChart');
if(dc){
  const dd=clients.filter(c=>c.target>0&&c.avgDay>0&&c.remaining>0).sort((a,b)=>b.daysNeeded-a.daysNeeded).slice(0,10);
  safeChart(dc,{
    type:'bar',
    data:{labels:dd.map(c=>c.name),datasets:[{label:'Days',data:dd.map(c=>c.daysNeeded),backgroundColor:dd.map(c=>c.daysNeeded>18?C.orange:'#8b8b8b'),borderRadius:4}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,animation:{duration:1100},plugins:{legend:{display:false},title:{display:true,text:'Estimated days at current pace',font:{size:11,weight:'500'},color:C.text3,padding:{bottom:16}}},scales:{x:{beginAtZero:true,ticks:{font:CF}},y:{ticks:{font:CF},grid:{display:false}}}}
  });
}

// KAM Summary
function renderKamSummary(){
  const body=$('kam-summary-body');if(!body)return;
  const km={};
  clients.forEach(c=>{
    const{achieved,target}=getPStats(c,curPeriod);
    if(!achieved&&!target)return;
    if(!km[c.person])km[c.person]={person:c.person,tt:0,ta:0};
    km[c.person].tt+=(target||0);
    km[c.person].ta+=(achieved||0);
  });
  const kl=Object.values(km).sort((a,b)=>b.ta-a.ta);
  if(!kl.length){
    body.innerHTML=`<tr><td colspan="4" style="text-align:center;color:${C.text3};padding:24px">No data.</td></tr>`;
    const tE=$('kam-total-target'),aE=$('kam-total-achieved'),pE=$('kam-total-pct');
    if(tE)tE.textContent='—';if(aE)aE.textContent='—';if(pE)pE.textContent='—';
    return;
  }
  body.innerHTML=kl.map(k=>{
    const p=k.tt>0?Math.round(k.ta/k.tt*100):null;
    const pc=p===null?C.text4:bucketColor(p);
    return`<tr><td style="font-weight:600">${k.person}</td><td>${k.tt>0?fK(k.tt):'—'}</td><td>${fK(k.ta)}</td><td style="color:${pc};font-weight:600">${p!==null?p+'%':'—'}</td></tr>`;
  }).join('');
  // KAM total summary — recomputed live so it stays correct across the tonnage period filter.
  const totalTarget=kl.reduce((s,k)=>s+k.tt,0);
  const totalAchieved=kl.reduce((s,k)=>s+k.ta,0);
  const totalPct=totalTarget>0?(totalAchieved/totalTarget*100):null;
  const tE=$('kam-total-target'),aE=$('kam-total-achieved'),pE=$('kam-total-pct');
  if(tE)tE.textContent=fK(totalTarget);
  if(aE)aE.textContent=fK(totalAchieved);
  if(pE)pE.textContent=totalPct!==null?totalPct.toFixed(2):'—';
}

// Forecast
function renderForecast(){
  $('forecast-sales-money').textContent=fR(totalSalesMoney);
  $('forecast-predicted-money').textContent=fR(predictedSales);
  $('forecast-target-money').textContent=fR(totalTargetMoney);
  const badge=$('forecast-badge'),vt=$('forecast-verdict-text');
  const will=predictedPct!==null&&predictedPct>=100;
  const border=predictedPct!==null&&predictedPct>=90&&predictedPct<100;
  if(predictedPct===null){badge.textContent='N/A';badge.className='fbadge neutral';vt.textContent='No target.'}
  else if(will){badge.textContent='ON TRACK';badge.className='fbadge good';vt.textContent=`Projected ${Math.round(predictedPct)}% — surplus ${fR(predictedSales-totalTargetMoney)}.`}
  else if(border){badge.textContent='BORDERLINE';badge.className='fbadge warn';vt.textContent=`Projected ${Math.round(predictedPct)}% — shortfall ${fR(totalTargetMoney-predictedSales)}.`}
  else{badge.textContent='AT RISK';badge.className='fbadge bad';vt.textContent=`Projected ${Math.round(predictedPct)}% — shortfall ${fR(totalTargetMoney-predictedSales)}.`}
  const max=Math.max(totalTargetMoney,predictedSales,1);
  $('forecast-bar-fill').style.width=Math.min(predictedSales/max*100,100)+'%';
  $('forecast-bar-target-marker').style.left=Math.min(totalTargetMoney/max*100,100)+'%';
  $('forecast-bar-target-label').textContent='Target: '+fR(totalTargetMoney);
  $('forecast-explain').innerHTML='<strong style="color:'+C.text+'">Method:</strong> Predicted = (Sales ÷ 25) × '+DAYS+'. Uses ₹'+DR+'/kg for unlisted. Straight-line projection.';
}

// DELAY REASONS PANEL
const REASON_CATEGORIES = {
  customer: {label:'Customer-Related',keywords:['customer','consignee','refused','hold','sales person','space issue at customer','address verification','alternate contact','invalid contact','store closed','premises closed']},
  carrier: {label:'Carrier / Transit',keywords:['hub','transit','misrouted','missed connection','vendor delay','intransit','last mile']},
  documentation: {label:'Documentation',keywords:['documents','documentation','po expired','deps','incorrect','incomplete']},
  external: {label:'External Factors',keywords:['natural calamity','rain','festival','strike','sez','weather']},
  location: {label:'Location / ODA',keywords:['oda','remote','misrouted shipment']},
  damage: {label:'Damage / Quality',keywords:['damaged','damage']}
};

const CATEGORY_COLORS = {
  customer: C.orange,
  carrier: '#b8b8b8',
  documentation: '#8b8b8b',
  external: '#f79c4d',
  location: '#5a5a5a',
  damage: '#3a3a3a',
  unknown: '#2a2a2a'
};

function classifyReason(reason) {
  if (!reason) return 'unknown';
  const r = reason.toLowerCase();
  for (const [cat, def] of Object.entries(REASON_CATEGORIES)) {
    if (def.keywords.some(k => r.includes(k))) return cat;
  }
  return 'unknown';
}

function analyzeDelayReasons() {
  const reasonCounts = {};
  const categoryCounts = {customer:0,carrier:0,documentation:0,external:0,location:0,damage:0,unknown:0};
  const transporterDelays = {};
  // Real Customer/Vendor attribution, taken directly from the sheet's "Customer Vendor" column
  // (not keyword-guessed) — every row with a logged delay reason is tagged Customer or Vendor.
  const customerVendorCounts = {customer:0,vendor:0,unclassified:0};
  
  eddDetail.forEach(item => {
    const reason = item.reason || 'Unclassified / Intransit Delay';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    const category = classifyReason(item.reason);
    categoryCounts[category]++;
    const t = item.transporter || 'Unassigned';
    transporterDelays[t] = (transporterDelays[t] || 0) + 1;
    if (item.type === 'Customer') customerVendorCounts.customer++;
    else if (item.type === 'Vendor') customerVendorCounts.vendor++;
    else customerVendorCounts.unclassified++;
  });
  
  return {reasonCounts, categoryCounts, transporterDelays, customerVendorCounts, total: eddDetail.length};
}

function animateDelayCounter(el, target, duration=1500) {
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

function renderDelayPanel() {
  const analysis = analyzeDelayReasons();
  const {reasonCounts, categoryCounts, transporterDelays, customerVendorCounts, total} = analysis;
  
  const setText=(id,val)=>{const el=$(id);if(el)el.textContent=val;};
  setText('dr-total-orders', total);
  setText('dr-unique-reasons', Object.keys(reasonCounts).length);
  const controllable = categoryCounts.customer + categoryCounts.documentation + categoryCounts.carrier;
  const external = categoryCounts.external + categoryCounts.location + categoryCounts.damage;
  setText('dr-controllable-pct', (total?Math.round(controllable/total*100):0) + '%');
  setText('dr-external-pct', (total?Math.round(external/total*100):0) + '%');
  setText('tab-reasons-badge', total);

  // Customer vs Vendor attribution (from the sheet's own "Customer Vendor" tagging)
  const cv = customerVendorCounts;
  const cvTotal = total || 1;
  const setCv = (id, count) => { const el = $(id); if (el) el.textContent = count; };
  setCv('dr-customer-count', cv.customer);
  setCv('dr-vendor-count', cv.vendor);
  setCv('dr-unclassified-count', cv.unclassified);
  const setCvPct = (id, count) => { const el = $(id); if (el) el.textContent = Math.round(count/cvTotal*100) + '%'; };
  setCvPct('dr-customer-pct', cv.customer);
  setCvPct('dr-vendor-pct', cv.vendor);
  setCvPct('dr-unclassified-pct', cv.unclassified);

  const cvCanvas = $('customerVendorDonut');
  if (cvCanvas) {
    const cvEntries = [['Customer', cv.customer, C.orange], ['Vendor', cv.vendor, '#8b8b8b'], ['Unclassified / In-Transit', cv.unclassified, '#3a3a3a']].filter(([,v]) => v > 0);
    safeChart(cvCanvas, {
      type: 'doughnut',
      data: {
        labels: cvEntries.map(e => e[0]),
        datasets: [{
          data: cvEntries.map(e => e[1]),
          backgroundColor: cvEntries.map(e => e[2]),
          borderWidth: 2, borderColor: C.s2, hoverOffset: 10
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        animation: {animateRotate: true, animateScale: true, duration: 1300, easing: 'easeOutQuart'},
        plugins: {
          legend: {position: 'bottom', labels: {font: {size: 11, weight: '500'}, padding: 12, boxWidth: 10, usePointStyle: true, pointStyle: 'circle', color: C.text2}},
          tooltip: {callbacks: {label: (ctx) => {const pct = Math.round(ctx.parsed / cvTotal * 100); return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`}}}
        }
      }
    });
  }
  
  const catMap = {
    customer: categoryCounts.customer,
    carrier: categoryCounts.carrier,
    documentation: categoryCounts.documentation,
    external: categoryCounts.external,
    location: categoryCounts.location + categoryCounts.damage,
    unknown: categoryCounts.unknown
  };
  
  document.querySelectorAll('.delay-cat').forEach(card => {
    const cat = card.dataset.cat;
    const count = catMap[cat] || 0;
    const pct = total > 0 ? Math.round(count/total*100) : 0;
    const counter = card.querySelector('.counter-dr');
    const pctEl = card.querySelector('.dc-pct');
    const barFill = card.querySelector('.dc-bar-fill');
    counter.dataset.target = count;
    setTimeout(() => animateDelayCounter(counter, count), 220 + parseInt(card.dataset.d) * 110);
    if (pctEl) pctEl.textContent = pct + '%';
    if (barFill) setTimeout(() => { barFill.style.width = pct + '%'; }, 380);
  });
  
  // Category Donut
  const donutData = Object.entries(catMap).filter(([_,v]) => v > 0);
  safeChart($('delayCategoryDonut'), {
    type: 'doughnut',
    data: {
      labels: donutData.map(([k]) => REASON_CATEGORIES[k]?.label || 'Unclassified'),
      datasets: [{
        data: donutData.map(([_,v]) => v),
        backgroundColor: donutData.map(([k]) => CATEGORY_COLORS[k] || '#3a3a3a'),
        borderWidth: 2, borderColor: C.s2, hoverOffset: 12, hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '62%',
      animation: {animateRotate: true, animateScale: true, duration: 1400, easing: 'easeOutQuart'},
      plugins: {
        legend: {position: 'right', labels: {font: {size: 11, weight: '500'}, padding: 14, boxWidth: 12, usePointStyle: true, pointStyle: 'circle', color: C.text2}},
        tooltip: {callbacks: {label: (ctx) => {const pct = Math.round(ctx.parsed / total * 100); return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`}}}
      }
    }
  });
  
  // Top 10 Reasons
  const topReasons = Object.entries(reasonCounts).sort((a,b) => b[1] - a[1]).slice(0, 10);
  safeChart($('topReasonsChart'), {
    type: 'bar',
    data: {
      labels: topReasons.map(([r]) => r.length > 40 ? r.slice(0,37)+'…' : r),
      datasets: [{
        label: 'Occurrences',
        data: topReasons.map(([_,c]) => c),
        backgroundColor: topReasons.map((_, i) => i === 0 ? C.orange : i < 3 ? orangeA(.7) : orangeA(.4)),
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      animation: {duration: 1300, easing: 'easeOutQuart', delay: (ctx) => ctx.type === 'data' && ctx.mode === 'default' ? ctx.dataIndex * 80 : 0},
      plugins: {
        legend: {display: false},
        tooltip: {callbacks: {label: (ctx) => {const pct = Math.round(ctx.parsed.x / total * 100); return ` ${ctx.parsed.x} orders (${pct}%)`}, title: (items) => topReasons[items[0].dataIndex][0]}}
      },
      scales: {x: {beginAtZero: true, ticks: {font: CF}}, y: {ticks: {font: {size: 10}}, grid: {display: false}}}
    }
  });
  
  // Transporter Chart
  const topTransporters = Object.entries(transporterDelays).sort((a,b) => b[1] - a[1]).slice(0, 8);
  safeChart($('transporterChart'), {
    type: 'bar',
    data: {
      labels: topTransporters.map(([t]) => t),
      datasets: [{
        label: 'Delayed Shipments',
        data: topTransporters.map(([_,c]) => c),
        backgroundColor: topTransporters.map((_, i) => {
          if (i === 0) return C.orange;
          if (i === 1) return orangeA(.7);
          return orangeA(.4);
        }),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: {duration: 1200, easing: 'easeOutCubic', delay: (ctx) => ctx.type === 'data' && ctx.mode === 'default' ? ctx.dataIndex * 100 : 0},
      plugins: {
        legend: {display: false},
        tooltip: {callbacks: {label: (ctx) => {const pct = Math.round(ctx.parsed.y / total * 100); return ` ${ctx.parsed.y} delays (${pct}% of total)`}}}
      },
      scales: {x: {ticks: {autoSkip: false, maxRotation: 35, font: CF}, grid: {display: false}}, y: {beginAtZero: true, ticks: {font: CF}}}
    }
  });
  
  // Reason Cards
  const grid = $('reason-cards-grid');
  if (grid) {
    const sortedReasons = Object.entries(reasonCounts).sort((a,b) => b[1] - a[1]);
    grid.innerHTML = sortedReasons.map(([reason, count], i) => {
      const pct = Math.round(count / total * 100);
      const cat = classifyReason(reason === 'Unclassified / Intransit Delay' ? null : reason);
      const catLabel = REASON_CATEGORIES[cat]?.label || 'Unclassified';
      const severity = pct >= 10 ? 'high' : pct >= 5 ? 'medium' : 'low';
      const sevLabel = pct >= 10 ? 'HIGH' : pct >= 5 ? 'MED' : 'LOW';
      return `
        <div class="reason-card" style="animation-delay:${i*0.03}s">
          <div class="rc-head">
            <div class="rc-title">${reason}</div>
            <span class="rc-badge ${severity}">${sevLabel}</span>
          </div>
          <div class="rc-stats">
            <span><span class="rc-count">${count}</span> ${count===1?'order':'orders'}</span>
            <span class="rc-pct">${pct}% of delays</span>
          </div>
          <div class="rc-progress">
            <div class="rc-progress-fill" style="width:${Math.min(pct*3,100)}%;animation-delay:${i*0.03}s"></div>
          </div>
          <span class="rc-tag">${catLabel}</span>
        </div>
      `;
    }).join('');
  }
  
  renderInsights(analysis);
}

function renderInsights(analysis) {
  const {reasonCounts, categoryCounts, transporterDelays, total} = analysis;
  const insights = [];
  
  const topReason = Object.entries(reasonCounts).sort((a,b)=>b[1]-a[1])[0];
  if (topReason) {
    const pct = Math.round(topReason[1]/total*100);
    insights.push({
      icon: '01',
      title: 'Primary Root Cause',
      desc: `<strong>${topReason[0]}</strong> accounts for <strong>${pct}%</strong> of total delays (${topReason[1]} orders). Prioritized resolution here delivers the highest operational leverage.`
    });
  }
  
  const topT = Object.entries(transporterDelays).sort((a,b)=>b[1]-a[1])[0];
  if (topT) {
    const pct = Math.round(topT[1]/total*100);
    insights.push({
      icon: '02',
      title: 'Carrier Performance Alert',
      desc: `<strong>${topT[0]}</strong> represents <strong>${topT[1]} delays (${pct}%)</strong>. Recommend SLA review and strategic load rebalancing across the carrier portfolio.`
    });
  }
  
  if (categoryCounts.customer > 0) {
    const pct = Math.round(categoryCounts.customer/total*100);
    insights.push({
      icon: '03',
      title: 'Customer-Side Bottleneck',
      desc: `<strong>${pct}%</strong> of delays (${categoryCounts.customer} orders) originate from customer-side issues — refusals, capacity constraints, contact failures. Enhanced pre-delivery orchestration required.`
    });
  }
  
  if (categoryCounts.unknown > 0) {
    const pct = Math.round(categoryCounts.unknown/total*100);
    insights.push({
      icon: '04',
      title: 'Data Governance Opportunity',
      desc: `<strong>${categoryCounts.unknown} delays (${pct}%)</strong> lack root-cause classification. Mandatory reason-capture at delay events will elevate analytical precision.`
    });
  }
  
  if (categoryCounts.external > 0) {
    const pct = Math.round(categoryCounts.external/total*100);
    insights.push({
      icon: '05',
      title: 'External Risk Assessment',
      desc: `<strong>${pct}%</strong> of delays (${categoryCounts.external} orders) stem from external factors — weather, festivals, strikes. Incorporate probabilistic buffers into regional EDD models.`
    });
  }
  
  if (categoryCounts.documentation > 0) {
    insights.push({
      icon: '06',
      title: 'Documentation Excellence',
      desc: `<strong>${categoryCounts.documentation} delays</strong> traced to documentation gaps. Automated pre-dispatch verification workflows can eliminate this category entirely.`
    });
  }
  
  const list = $('insights-list');
  if (list) {
    list.innerHTML = insights.map((ins, i) => `
      <div class="insight" style="animation-delay:${i*0.08}s">
        <div class="insight-icon">${ins.icon}</div>
        <div class="insight-body">
          <div class="insight-title">${ins.title}</div>
          <div class="insight-desc">${ins.desc}</div>
        </div>
      </div>
    `).join('');
  }
}

// Init
populateEddFilterOptions();
renderEddRows(eddDetail);
renderTonnageBars();
renderTonnageCharts();
renderKamSummary();
renderForecast();
renderDelayPanel();
animateCounters();

import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'});
const page=await browser.newPage({viewport:{width:1440,height:980}});
async function dump(route, finder){
 await page.goto('http://localhost:8080'+route,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(1200);
 const res=await page.evaluate(({finder})=>{
  let el;
  if(finder.type==='text') el=Array.from(document.querySelectorAll(finder.sel)).find(e=>(e.textContent||'').includes(finder.text)); else el=document.querySelector(finder.sel);
  if(!el) return {missing:true};
  function rulesFor(el){ const out=[]; for(const sh of Array.from(document.styleSheets)){let rules; try{rules=sh.cssRules}catch{continue} for(const rule of Array.from(rules||[])){ if(!rule.selectorText||!rule.style) continue; const st=rule.style; if(!(st.color||st.webkitTextFillColor||st.stroke)) continue; try{ if(el.matches(rule.selectorText)) out.push({sel:rule.selectorText.slice(0,300), color:st.color, fill:st.webkitTextFillColor, imp:st.getPropertyPriority('color'), impFill:st.getPropertyPriority('-webkit-text-fill-color')}); }catch{} } } return out.slice(-10); }
  const cs=getComputedStyle(el), r=el.getBoundingClientRect(); return {tag:el.tagName,text:(el.textContent||'').trim(), attrStyle:el.getAttribute('style'), cls:el.getAttribute('class'), surface:el.getAttribute('data-surface'), closestSurface:el.closest('[data-surface]')?.getAttribute('data-surface'), color:cs.color, fill:cs.webkitTextFillColor, bg:cs.backgroundColor, bgImg:cs.backgroundImage.slice(0,200), rect:[r.x,r.y,r.width,r.height], rules:rulesFor(el), span:el.querySelector('span')?{color:getComputedStyle(el.querySelector('span')).color,fill:getComputedStyle(el.querySelector('span')).webkitTextFillColor,rules:rulesFor(el.querySelector('span'))}:null, svg:el.querySelector('svg')?{color:getComputedStyle(el.querySelector('svg')).color,stroke:getComputedStyle(el.querySelector('svg')).stroke,rules:rulesFor(el.querySelector('svg'))}:null};
 }, {finder});
 console.log('\n',route, finder.text||finder.sel, JSON.stringify(res,null,2));
}
await dump('/guides',{type:'text', sel:'a,button', text:'Browse Guides'});
await dump('/guides',{type:'text', sel:'a,button', text:'Ask a Question'});
await dump('/property-evaluator',{type:'text', sel:'button,[role=tab]', text:'Modifications'});
await dump('/contact',{type:'text', sel:'button,[data-radix-select-trigger]', text:'Select a service'});
await dump('/',{type:'text', sel:'h1', text:'Your Gateway'});
await browser.close();

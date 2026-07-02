import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:'/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
await page.goto('http://127.0.0.1:5177/market-intelligence/areas',{waitUntil:'domcontentloaded'});
await page.waitForLoadState('networkidle',{timeout:20000}).catch(()=>{});
await page.waitForTimeout(2000);
const res=await page.evaluate(()=>{
 function tree(el,depth=0){ if(!el||depth>4)return ''; let r=el.getBoundingClientRect(); let s=getComputedStyle(el); let attrs=[...el.attributes].map(a=>`${a.name}=${a.value}`).join(' ').slice(0,160); let text=(el.childNodes.length===1&&el.childNodes[0].nodeType===3?el.textContent.trim(): '').slice(0,80); let line=' '.repeat(depth*2)+`<${el.tagName.toLowerCase()} ${attrs}> rect=${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)},${Math.round(r.height)} display=${s.display} text=${text}\n`; return line+[...el.children].slice(0,8).map(c=>tree(c,depth+1)).join('');}
 return {title:document.title, root:tree(document.querySelector('#root')), bodyText:document.body.innerText.slice(0,2000)};
});
console.log(res.title); console.log(res.root); console.log('TEXT',res.bodyText);
await browser.close();

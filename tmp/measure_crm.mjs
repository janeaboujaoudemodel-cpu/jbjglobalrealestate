import { chromium } from 'playwright';
const base='http://127.0.0.1:8080/owner/crm/jbj/projects';
const browser=await chromium.launch({headless:true, executablePath:'/bin/chromium'});
const page=await browser.newPage({viewport:{width:1920,height:1205}, deviceScaleFactor:1});
await page.addInitScript(() => {
  localStorage.setItem('jj_user_mode','owner');
  localStorage.setItem('jj_mode_selected','true');
  sessionStorage.setItem('owner_verified_once','1');
  const fakeUser={id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',email:'janeaboujaoudenails@gmail.com',email_confirmed_at:new Date().toISOString(),phone:'',confirmed_at:new Date().toISOString(),last_sign_in_at:new Date().toISOString(),app_metadata:{provider:'email',providers:['email']},user_metadata:{},identities:[],created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  const fakeSession={access_token:'fake-owner-token',refresh_token:'fake-refresh-token',expires_in:360000,expires_at:Math.floor(Date.now()/1000)+360000,token_type:'bearer',user:fakeUser};
  localStorage.setItem('sb-mdafrewypkkrildjgtey-auth-token', JSON.stringify(fakeSession));
});
await page.goto(base, {waitUntil:'domcontentloaded', timeout:30000});
await page.waitForTimeout(2500);
const url=page.url();
const title=await page.title().catch(()=>null);
console.log({url,title});
const body=await page.locator('body').innerText({timeout:5000}).catch(e=>'ERR '+e.message);
console.log(body.slice(0,500));
const metrics=await page.evaluate(() => {
  const qs=s=>document.querySelector(s);
  const rect=s=>{const e=qs(s); if(!e)return null; const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height, text:e.textContent?.trim()?.slice(0,100)};};
  const rowRects=[...document.querySelectorAll('.jc-side-link,.jc-team-item,.jc-folder__label,.jc-side-search,.jc-teamspace__title')].slice(0,30).map(e=>{const r=e.getBoundingClientRect(); return {cls:String(e.className), text:e.textContent?.trim(), x:r.x,y:r.y,w:r.width,h:r.height, color:getComputedStyle(e).color, bg:getComputedStyle(e).backgroundColor, fs:getComputedStyle(e).fontSize, fw:getComputedStyle(e).fontWeight, lh:getComputedStyle(e).lineHeight};});
  return {app:rect('.jc-app'), rail:rect('.jc-rail'), header:rect('.jc-header'), search:rect('.jc-search'), brand:rect('.jc-brand-row'), content:rect('.jc-content'), rows:rowRects, bg:qs('.jc-rail') ? getComputedStyle(qs('.jc-rail')).backgroundColor : null};
});
console.log(JSON.stringify(metrics,null,2));
await page.screenshot({path:'/mnt/documents/jbj-crm-current-projects.png', fullPage:false});
await browser.close();

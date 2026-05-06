/**
 * crm-bulk-upload-developers — mirror of crm-bulk-upload-brokerages but
 * the "happy path" inserts into crm_developer_registry and brokerages
 * uploaded by mistake are rerouted to crm_brokerages.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const OWNER_EMAILS = ["janeaboujaoudenails@gmail.com","janeaboujaoudemodel@gmail.com","infoo.jane@gmail.com"];
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const norm = (s: string) => (s||"").toLowerCase()
  .replace(/\(branch\)/g, "")
  .replace(/\b(llc|l\.l\.c|fz-llc|fz llc|fzco|dmcc|ltd|limited|co\.|company|trading|real estate|properties|brokerage|broker|brokers|developer|developers)\b/g, "")
  .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

function detectDelim(t: string) { const h=t.split(/\r?\n/,5).join("\n"); const c=(h.match(/,/g)||[]).length, tt=(h.match(/\t/g)||[]).length, s=(h.match(/;/g)||[]).length; return Math.max(c,tt,s)===tt?"\t":Math.max(c,s)===s?";":","; }
function parseDelimited(text: string, delim: string) {
  const lines = text.split(/\r?\n/).filter(l=>l.trim()); if (lines.length<2) return [];
  const split = (l: string) => { const cells: string[]=[]; let c="",q=false; for(const ch of l){ if(ch==='"'){q=!q;continue;} if(ch===delim&&!q){cells.push(c);c="";continue;} c+=ch;} cells.push(c); return cells.map(x=>x.trim()); };
  const headers = split(lines[0]).map(h=>h.toLowerCase());
  return lines.slice(1).map(l=>{ const cells=split(l); const r:Record<string,string>={}; headers.forEach((h,i)=>r[h]=cells[i]??""); return r; });
}
function parseHtmlTable(html: string) {
  const tm = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i); const inner = tm?tm[1]:html;
  const rowRe=/<tr[^>]*>([\s\S]*?)<\/tr>/gi, cellRe=/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const strip=(s:string)=>s.replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
  const rows: string[][] = []; let m: any;
  while ((m=rowRe.exec(inner))!==null){ const cells:string[]=[]; let cm:any; while((cm=cellRe.exec(m[1]))!==null) cells.push(strip(cm[1])); if(cells.length) rows.push(cells); }
  if (rows.length<2) return [];
  const headers = rows[0].map(h=>h.toLowerCase());
  return rows.slice(1).map(c=>{ const r:Record<string,string>={}; headers.forEach((h,i)=>r[h]=c[i]??""); return r; });
}
function parseRows(filename: string, content: string) {
  const lower=(filename||"").toLowerCase();
  if (lower.endsWith(".html")||lower.endsWith(".htm")||/<table[\s>]/i.test(content)) return parseHtmlTable(content);
  if (lower.endsWith(".tsv")) return parseDelimited(content,"\t");
  return parseDelimited(content, detectDelim(content));
}
function pick(r: Record<string,string>, ks: string[]) { for(const k of ks){ const v=r[k]??r[k.toLowerCase()]; if(v&&v.trim()) return v.trim(); } return ""; }

async function classifyBatch(names: string[]) {
  if (!names.length || !LOVABLE_API_KEY) {
    const out:Record<string,any>={};
    for(const n of names){ const l=n.toLowerCase();
      if(/(mortgage|finance|consult|loan|advisor)/.test(l)) out[n]="mortgage";
      else if(/(broker|agency|realty|real estate|properties)/.test(l) && !/develop/.test(l)) out[n]="brokerage";
      else out[n]="developer";
    } return out;
  }
  const prompt=`Classify each UAE real-estate company by name. Return one of: "brokerage" (sells/rents property), "developer" (builds property), "mortgage" (mortgage/finance/loan/advisor — NOT real estate), or "other".

Return strict JSON: {"results":[{"name":"...","kind":"..."}]}.

Companies:
${names.map((n,i)=>`${i+1}. ${n}`).join("\n")}`;
  try {
    const res=await fetch("https://ai.gateway.lovable.dev/v1/chat/completions",{
      method:"POST", headers:{Authorization:`Bearer ${LOVABLE_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({model:"google/gemini-3-flash-preview",messages:[{role:"user",content:prompt}],response_format:{type:"json_object"}}),
    });
    const j=await res.json(); const txt=j?.choices?.[0]?.message?.content||"{}";
    const p=JSON.parse(txt); const out:Record<string,any>={};
    for(const r of p.results||[]) if(r?.name&&r?.kind) out[r.name]=r.kind;
    for(const n of names) if(!out[n]) out[n]="developer";
    return out;
  } catch { const out:Record<string,any>={}; for(const n of names) out[n]="developer"; return out; }
}

serve(async (req) => {
  if (req.method==="OPTIONS") return new Response(null,{headers:corsHeaders});
  try {
    const auth=req.headers.get("Authorization"); if(!auth) throw new Error("NO_AUTH");
    const url=Deno.env.get("SUPABASE_URL")!;
    const uc=createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}}});
    const {data:{user}} = await uc.auth.getUser();
    if(!user || !OWNER_EMAILS.includes(user.email||"")) return new Response(JSON.stringify({error:"Forbidden"}),{status:403,headers:{...corsHeaders,"Content-Type":"application/json"}});
    const svc=createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {filename, content} = await req.json() as {filename:string;content:string};
    if(!content) throw new Error("Empty file");
    const rows=parseRows(filename||"", content);
    const companies=rows.map(r=>{
      const name=pick(r,["company_name","developer","developer_name","name","company"]);
      if(!name||name.length<2) return null;
      return { name, phone:pick(r,["phone","tel","mobile"]), email:pick(r,["email","e-mail"]),
        website:pick(r,["website","url"]), emirate:pick(r,["emirate","city"]) };
    }).filter(Boolean) as any[];
    if (!companies.length) return new Response(JSON.stringify({inserted:0,rerouted:0,rejected_non_real_estate:0,duplicates_skipped:0,total:0,error:"No rows detected"}),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}});

    const {data: ed} = await svc.from("crm_developer_registry").select("developer_name");
    const edN=new Set((ed||[]).map((r:any)=>norm(r.developer_name)));
    const {data: eb} = await svc.from("crm_brokerages").select("company_name");
    const ebN=new Set((eb||[]).map((r:any)=>norm(r.company_name)));

    const map: Record<string,any> = {};
    for(let i=0;i<companies.length;i+=30){ Object.assign(map, await classifyBatch(companies.slice(i,i+30).map(c=>c.name))); }

    let ins=0,rer=0,rej=0,dup=0; const sIns:string[]=[], sRej:string[]=[];
    const devIns:any[]=[], brkIns:any[]=[];
    for(const c of companies){
      const k=map[c.name]||"developer"; const n=norm(c.name);
      if(k==="mortgage"||k==="other"){ rej++; if(sRej.length<10) sRej.push(c.name); continue; }
      if(k==="brokerage"){
        if(ebN.has(n)){dup++;continue;} ebN.add(n);
        brkIns.push({company_name:c.name, phone:c.phone||null, email:c.email||null, website:c.website||null, emirate:c.emirate||null, owner_id:user.id});
        rer++; continue;
      }
      if(edN.has(n)){dup++;continue;} edN.add(n);
      devIns.push({owner_id:user.id, developer_name:c.name, developer_slug:slugify(c.name), status:"not_started", phone:c.phone||null, developer_email:c.email||null, website:c.website||null, emirate:c.emirate||null});
      if(sIns.length<10) sIns.push(c.name);
      ins++;
    }
    const insertChunked = async (t:string, rows:any[]) => { for(let i=0;i<rows.length;i+=200){ const {error}=await svc.from(t).insert(rows.slice(i,i+200)); if(error) console.warn(t,error.message); } };
    if(devIns.length) await insertChunked("crm_developer_registry", devIns);
    if(brkIns.length) await insertChunked("crm_brokerages", brkIns);

    return new Response(JSON.stringify({inserted:ins,rerouted:rer,rejected_non_real_estate:rej,duplicates_skipped:dup,total:companies.length,sample_inserted:sIns,sample_rejected:sRej}),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}});
  } catch(e:any){
    console.error("crm-bulk-upload-developers error:", e);
    return new Response(JSON.stringify({error:e?.message||"Internal error"}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
  }
});

import { useMemo, useState } from "react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_INFO } from "@/constants/stats";
import { getCountryList, getLanguageList } from "@/constants/localeOptions";
import founderProfessional from "@/assets/founder-professional.jpeg";
import { ArrowUpRight, Download, FileText, ShieldCheck } from "lucide-react";

const MarketReport = () => {
  const countries = useMemo(() => getCountryList(), []);
  const languages = useMemo(() => getLanguageList(), []);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    language: "",
  });

  const isValid =
    form.fullName.trim().length > 1 &&
    form.email.trim().includes("@") &&
    form.phone.trim().length >= 6 &&
    form.nationality.trim().length > 0 &&
    form.language.trim().length > 0;

  const buildInquiryUrl = () => {
    const base = CONTACT_INFO.inquiryFormUrl;
    const params = new URLSearchParams();
    params.set("source", "market-report");
    if (form.fullName) params.set("name", form.fullName);
    if (form.email) params.set("email", form.email);
    if (form.phone) params.set("phone", form.phone);
    if (form.nationality) params.set("nationality", form.nationality);
    if (form.language) params.set("language", form.language);
    return `${base}?${params.toString()}`;
  };

  const downloadBook = () => {
    const websiteUrl = "https://jjglobalcapital.com";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      websiteUrl
    )}`;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>JJ Global Capital — UAE Market Intelligence (Educational)</title>
<style>
  body { margin:0; padding:32px; background:#0b0b0c; color:#fff; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
  .page { max-width: 980px; margin: 0 auto; }
  .card { background:#141417; border:1px solid #27272a; border-radius:18px; padding:24px; }
  .gold { color:#A8925A; }
  .muted { color:#a1a1aa; }
  .hr { height:1px; background: linear-gradient(to right, transparent, rgba(168,146,90,.55), transparent); margin: 22px 0; }
  h1 { font-size: 34px; margin: 0 0 8px; }
  h2 { font-size: 18px; letter-spacing:.18em; text-transform: uppercase; margin: 0 0 10px; }
  .grid { display:grid; grid-template-columns: 1.2fr .8fr; gap: 18px; }
  .cover { display:flex; gap: 18px; align-items:center; }
  .photo { width: 110px; height: 110px; border-radius: 999px; object-fit: cover; border: 2px solid rgba(168,146,90,.55); }
  .pill { display:inline-block; padding:6px 12px; border-radius:999px; border:1px solid rgba(168,146,90,.35); background: rgba(168,146,90,.08); font-size: 12px; letter-spacing:.16em; text-transform: uppercase; }
  ul { margin: 10px 0 0; padding-left: 18px; }
  li { margin: 8px 0; }
  .box { background:#0f0f12; border:1px solid #27272a; border-radius:14px; padding:14px; }
  .qr { width: 180px; height: 180px; border-radius: 12px; background:#fff; padding:10px; }
</style>
</head>
<body>
  <div class="page">
    <div class="card">
      <div class="cover">
        <img class="photo" src="${founderProfessional}" alt="Founder portrait" />
        <div>
          <div class="pill">Educational Market Book</div>
          <h1>UAE Real Estate Market Intelligence</h1>
          <div class="muted">Prepared for investors of <span class="gold">JJ Global Capital</span>.</div>
          <div class="muted" style="margin-top:6px;">Lead author: Jane Abou Jaoude (Founder & Chairwoman)</div>
        </div>
      </div>

      <div class="hr"></div>

      <div class="grid">
        <div class="box">
          <h2 class="gold">What this book covers</h2>
          <ul>
            <li>How to read official market indicators (transactions, supply, segments)</li>
            <li>Developer comparison framework (delivery, product, pricing logic)</li>
            <li>Community comparison framework (liquidity, rentability, long-term demand)</li>
            <li>Investment checklist for off-plan vs ready assets</li>
            <li>Risk controls, due diligence, and decision structure</li>
          </ul>
        </div>
        <div class="box">
          <h2 class="gold">Official sources</h2>
          <div class="muted">This is an educational overview designed around public, government-led publications and portals such as:</div>
          <ul>
            <li>Dubai Land Department (DLD) publications & portals</li>
            <li>Dubai REST platform</li>
            <li>RERA-related guidance where applicable</li>
            <li>Other UAE government economic sources where relevant</li>
          </ul>
        </div>
      </div>

      <div class="hr"></div>

      <div class="grid">
        <div class="box">
          <h2 class="gold">AI Property Matchmaker (Complimentary)</h2>
          <div class="muted">Our AI Property Matchmaker was created and developed by our founder, Jane Abou Jaoude, exclusively for JJ Global Capital investors—so you can shortlist opportunities faster and with clearer structure.</div>
          <div class="muted" style="margin-top:10px;"><strong>Powered by JJ Global Capital</strong> — Part of <a class="gold" href="${CONTACT_INFO.holdingGroupUrl}" target="_blank" rel="noopener">JJ Holding Group</a></div>
        </div>
        <div class="box" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
          <div>
            <h2 class="gold">Visit Website</h2>
            <div class="muted">Scan to explore and take the complimentary AI assessment.</div>
            <div class="muted" style="margin-top:10px;">${websiteUrl}</div>
          </div>
          <img class="qr" src="${qrUrl}" alt="Website QR code" />
        </div>
      </div>

      <div class="hr"></div>

      <div class="muted" style="font-size:12px; line-height:1.6;">
        Disclaimer: This document is educational and does not constitute brokerage advice. For an official consultation, please contact JJ Global Capital.
        <br />Contact: ${CONTACT_INFO.emailCapitalized} • ${CONTACT_INFO.phone}
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "JJ-Global-Capital-UAE-Market-Intelligence.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = () => {
    if (!isValid) return;
    window.open(buildInquiryUrl(), "_blank", "noopener,noreferrer");
    downloadBook();
  };

  return (
    <div className="min-h-screen bg-black">
      <header className="relative pt-28 pb-14 border-b border-zinc-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-black" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/60 border border-zinc-700 text-zinc-200 text-xs uppercase tracking-[0.25em]">
              <FileText className="w-4 h-4" />
              Market Report
            </div>
            <h1
              className="text-white text-4xl md:text-6xl font-bold mt-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Download Your UAE Market Intelligence Book
            </h1>
            <p className="text-zinc-400 text-lg mt-4 leading-relaxed">
              An educational, founder-led overview designed around government-led sources and structured decision frameworks—created for investors of JJ Global Capital.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-zinc-200" />
              </div>
              <div>
                <h2 className="text-white text-xl font-semibold">Lead Capture</h2>
                <p className="text-zinc-500 mt-1">
                  Submit your details to unlock the download (opens our official form for record-keeping).
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <div>
                <Label className="text-zinc-300">Full Name *</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="mt-2 bg-zinc-900 border-zinc-700 text-white h-12"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="mt-2 bg-zinc-900 border-zinc-700 text-white h-12"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Phone *</Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-2 bg-zinc-900 border-zinc-700 text-white h-12"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300">Nationality *</Label>
                  <Select
                    value={form.nationality}
                    onValueChange={(v) => setForm((p) => ({ ...p, nationality: v }))}
                  >
                    <SelectTrigger className="mt-2 bg-zinc-900 border-zinc-700 text-white h-12">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 max-h-72">
                      {countries.map((c) => (
                        <SelectItem key={c} value={c} className="text-white hover:bg-zinc-800">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-zinc-300">Language *</Label>
                  <Select
                    value={form.language}
                    onValueChange={(v) => setForm((p) => ({ ...p, language: v }))}
                  >
                    <SelectTrigger className="mt-2 bg-zinc-900 border-zinc-700 text-white h-12">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 max-h-72">
                      {languages.map((l) => (
                        <SelectItem key={l} value={l} className="text-white hover:bg-zinc-800">
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!isValid}
                className="w-full h-12 bg-zinc-50 text-zinc-900 hover:bg-white font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Book Now
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-zinc-600 text-xs leading-relaxed">
                By downloading, you agree your details may be used to contact you about UAE real estate opportunities. For privacy, see the site policies.
              </p>
            </div>
          </section>

          <aside className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
            <h2 className="text-white text-xl font-semibold">What you’ll receive</h2>
            <ul className="mt-4 space-y-3 text-zinc-400">
              <li>• A structured market overview (educational)</li>
              <li>• Developer and community comparison frameworks</li>
              <li>• A due diligence checklist for investors</li>
              <li>
                • Complimentary access to the AI Home Finder (exclusive by JJ Global Capital)
              </li>
            </ul>
            <div className="mt-8 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <p className="text-zinc-300 text-sm">
                Powered by <span className="text-white font-semibold">JJ Global Capital</span> — Part of{" "}
                <a
                  className="text-white underline"
                  href={CONTACT_INFO.holdingGroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  JJ Holding Group
                </a>
                .
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MarketReport;

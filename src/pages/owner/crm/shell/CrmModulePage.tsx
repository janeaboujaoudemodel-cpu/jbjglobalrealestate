import { useParams } from "react-router-dom";
import { CRM_DEFAULT_SECTION, CRM_MODULE_MAP } from "./modules";

function ProjectIllustration({ variant }: { variant: "connect" | "track" | "deliver" }) {
  if (variant === "connect") {
    return (
      <svg viewBox="0 0 360 170" aria-hidden="true" className="jc-project-illo">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
          <rect x="31" y="12" width="126" height="70" rx="18" />
          <path d="M53 54c28 16 35-17 54-7 15 8 28-11 50-17" />
          <circle cx="203" cy="78" r="33" />
          <rect x="256" y="13" width="103" height="72" rx="16" />
          <path d="M280 35h42m-42 17h42m-42 17h32" />
          <path d="M313 30v-9h28v13" />
          <circle cx="331" cy="57" r="8" />
          <path d="M316 80c5-18 29-18 34 0" />
          <path d="M90 86c0 41 10 49 50 47" stroke="var(--jbjcrm-emerald-line)" />
          <path d="M286 88c-7 34-31 47-58 43" stroke="var(--jbjcrm-emerald-line)" />
          <rect x="145" y="102" width="72" height="43" rx="21" stroke="var(--jbjcrm-emerald-line)" />
          <path d="M169 109c-6 10-6 22 0 32m18-33c-6 10-6 23 0 34m17-31c-5 9-5 21 0 29" stroke="var(--jbjcrm-emerald-line)" />
          <path d="M137 113l-21-8m8 42l14-16m101-19l25-10m-12 43l-21-14" />
        </g>
      </svg>
    );
  }
  if (variant === "track") {
    return (
      <svg viewBox="0 0 360 170" aria-hidden="true" className="jc-project-illo">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
          <circle cx="80" cy="54" r="31" />
          <path d="M60 91h40c12 0 20 9 20 21v48H40v-48c0-12 8-21 20-21z" />
          <path d="M125 112c35 6 56-16 84-35" />
          <path d="M209 78l34 19-14 56-45-25z" stroke="var(--jbjcrm-emerald-line)" />
          <rect x="243" y="14" width="80" height="55" rx="11" />
          <path d="M259 55c20-1 26-17 32-22 6 12 12 11 17 10" />
          <rect x="259" y="82" width="55" height="56" rx="9" />
          <path d="M271 96h26m-26 13h26m-26 13h18" />
          <rect x="248" y="144" width="78" height="16" rx="5" />
          <circle cx="265" cy="121" r="9" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 360 170" aria-hidden="true" className="jc-project-illo">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
        <circle cx="105" cy="88" r="29" />
        <path d="M88 119h35c12 0 19 8 19 20v24H70v-24c0-12 7-20 18-20z" />
        <circle cx="254" cy="88" r="29" />
        <path d="M237 119h35c12 0 19 8 19 20v24h-72v-24c0-12 7-20 18-20z" />
        <circle cx="180" cy="65" r="54" />
        <path d="M148 58l30 28 51-50" stroke="var(--jbjcrm-emerald-line)" strokeWidth="5" />
        <path d="M158 138c14 20 30 20 45 0" />
        <path d="M165 143c9-10 22-10 31 0" />
        <path d="M137 36l-10-11m51-9V2m52 32l12-11" />
      </g>
    </svg>
  );
}

function ProjectsIntro() {
  return (
    <section className="jc-projects-screen" aria-label="Projects introduction">
      <div className="jc-projects-copy">
        <h2>Unified Sales and Project Management</h2>
        <p>A smarter way to bridge the gap between sales and<br />project tracking. <button type="button">Learn More</button></p>
      </div>

      <div className="jc-projects-grid">
        <article className="jc-project-step">
          <ProjectIllustration variant="connect" />
          <h3>Connect</h3>
          <p>Integrate JBJ Projects to create and associate<br />projects in JBJ CRM.</p>
        </article>
        <article className="jc-project-step">
          <ProjectIllustration variant="track" />
          <h3>Track</h3>
          <p>Stay on top of your tasks and milestones.</p>
        </article>
        <article className="jc-project-step">
          <ProjectIllustration variant="deliver" />
          <h3>Deliver</h3>
          <p>Execute customer projects on time, every time.</p>
        </article>
      </div>

      <div className="jc-projects-cta">
        <button type="button" className="jc-get-started">Get Started</button>
        <button type="button" className="jc-hide-tab">Don't show this tab again.</button>
      </div>
    </section>
  );
}

export default function CrmModulePage() {
  const { section = CRM_DEFAULT_SECTION } = useParams();
  const mod = CRM_MODULE_MAP[section];

  if ((mod?.slug ?? section) === "projects") {
    return <ProjectsIntro />;
  }

  return (
    <div className="jc-blank-module" aria-label={mod?.label ?? section} />
  );
}

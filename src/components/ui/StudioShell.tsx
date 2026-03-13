/**
 * StudioShell — Shared Canva-style studio layout for all Corporate Suite tools.
 *
 * Layout:
 *  ┌──────────────────────────────────────────────────────────┐
 *  │  Top Bar: [Back] [Tool Name]        [Save] [Export] [...] │
 *  ├────────┬──────────────────────────────────────┬──────────┤
 *  │  LEFT  │                                      │  RIGHT   │
 *  │  NAV   │      LIVE PREVIEW (centered)         │  PANEL   │
 *  │ (64px) │                                      │ (320px)  │
 *  └────────┴──────────────────────────────────────┴──────────┘
 *
 * Mobile: left nav → horizontal top tabs | right panel → bottom sheet
 */

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, Save, Maximize2, Minimize2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudioSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  panel: React.ReactNode;
  badge?: string;
}

export interface StudioShellProps {
  /** Tool display name in the top bar */
  toolName: string;
  /** Small icon beside the tool name */
  toolIcon?: React.ReactNode;
  /** Hex/hsl accent colour for active states */
  toolColor: string;
  /** Left nav sections */
  sections: StudioSection[];
  /** Currently active section id */
  activeSection: string;
  /** Called when a nav pill is clicked */
  onSectionChange: (id: string) => void;
  /** The live preview element — centered in the canvas */
  preview: React.ReactNode;
  /** Optional extra buttons in the top-right action area */
  actionBar?: React.ReactNode;
  /** Called when Save button is clicked */
  onSave?: () => void;
  /** Called when Export button is clicked */
  onExport?: () => void;
  /** Label for the export button */
  exportLabel?: string;
  /** Shows spinner on export button */
  isExporting?: boolean;
  /** Shows spinner on save button */
  isSaving?: boolean;
  /** Background of the canvas area */
  previewBg?: string;
  /** Back navigation destination */
  backPath?: string;
  /** Breadcrumb text */
  breadcrumb?: string;
  /** Show unsaved changes dot on Save button */
  hasUnsavedChanges?: boolean;
}

// ─── Main Shell ──────────────────────────────────────────────────────────────

export function StudioShell({
  toolName,
  toolIcon,
  toolColor,
  sections,
  activeSection,
  onSectionChange,
  preview,
  actionBar,
  onSave,
  onExport,
  exportLabel = "Export",
  isExporting = false,
  isSaving = false,
  previewBg,
  backPath = "/toolkit/corporate-suite",
  breadcrumb = "Corporate Suite",
  hasUnsavedChanges = false,
}: StudioShellProps) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const activePanel = sections.find(s => s.id === activeSection)?.panel ?? null;

  // Close fullscreen on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[hsl(var(--background))]">

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="h-14 flex-shrink-0 border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur-sm z-30 flex items-center px-3 gap-2">
        {/* Back */}
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-1 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors px-2 py-1.5 rounded-lg hover:bg-[hsl(var(--muted))] flex-shrink-0"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Back</span>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[hsl(var(--border))] flex-shrink-0" />

        {/* Breadcrumb + Tool name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {toolIcon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${toolColor}22` }}
            >
              <span style={{ color: toolColor }}>{toolIcon}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-none">{breadcrumb}</p>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))] leading-tight truncate">{toolName}</p>
          </div>
        </div>

        {/* Right: action bar + save + export + fullscreen */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {actionBar}

          {onSave && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSave}
              disabled={isSaving}
              className="h-8 text-xs gap-1.5 relative"
            >
              <Save size={13} />
              <span className="hidden sm:inline">Save</span>
              {hasUnsavedChanges && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />
              )}
            </Button>
          )}

          {onExport && (
            <Button
              size="sm"
              onClick={onExport}
              disabled={isExporting}
              className="h-8 text-xs gap-1.5 text-white"
              style={{ background: `linear-gradient(135deg, ${toolColor}, ${toolColor}cc)` }}
            >
              {isExporting ? (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <Download size={13} />
              )}
              <span className="hidden sm:inline">{isExporting ? "Exporting…" : exportLabel}</span>
            </Button>
          )}

          <button
            onClick={() => setFullscreen(f => !f)}
            className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen canvas"}
          >
            {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </header>

      {/* ── Body (left nav + canvas + right panel) ──────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Nav Rail (desktop: 64px vertical | mobile: horizontal tabs) ── */}
        <nav
          className={cn(
            // Desktop: vertical rail
            "hidden lg:flex flex-col items-center gap-1 py-3 px-1.5 border-r border-[hsl(var(--border))] bg-white/95 overflow-y-auto",
            "w-16 flex-shrink-0",
            fullscreen && "lg:hidden"
          )}
        >
          {sections.map(section => {
            const isActive = section.id === activeSection;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "w-full flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-xl transition-all relative",
                  isActive
                    ? "text-[hsl(var(--foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                )}
                style={isActive ? { background: `${toolColor}18`, color: toolColor } : {}}
                title={section.label}
              >
                <span className="w-5 h-5 flex items-center justify-center">{section.icon}</span>
                <span className="text-[8px] font-semibold uppercase tracking-wide leading-tight text-center">
                  {section.label}
                </span>
                {section.badge && (
                  <span
                    className="text-[6px] font-bold px-1 rounded text-white leading-tight"
                    style={{ background: toolColor }}
                  >
                    {section.badge}
                  </span>
                )}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r"
                    style={{ background: toolColor }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile: horizontal tab bar below top bar (rendered above canvas) */}
        <div className={cn(
          "lg:hidden absolute left-0 right-0 z-20 border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur-sm flex overflow-x-auto",
          "top-14",
          fullscreen && "hidden"
        )}>
          {sections.map(section => {
            const isActive = section.id === activeSection;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-semibold transition-colors border-b-2",
                  isActive ? "border-b-2 text-[hsl(var(--foreground))]" : "border-transparent text-[hsl(var(--muted-foreground))]"
                )}
                style={isActive ? { borderColor: toolColor, color: toolColor } : {}}
              >
                <span>{section.icon}</span>
                <span>{section.label}</span>
                {section.badge && (
                  <span className="text-[7px] font-bold px-1 rounded text-white" style={{ background: toolColor }}>
                    {section.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Center Canvas ──────────────────────────────────────────────── */}
        <div
          ref={canvasRef}
          className={cn(
            "flex-1 flex items-center justify-center overflow-auto",
            // On mobile, add top padding for the horizontal tab bar (40px)
            "pt-10 lg:pt-0 pb-4 px-4",
            fullscreen && "pt-0"
          )}
          style={{ background: previewBg || "hsl(var(--muted)/0.4)" }}
        >
          {/* Subtle grid pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative w-full flex items-center justify-center">
            {preview}
          </div>
        </div>

        {/* ── Right Detail Panel (static container, crossfade content) ── */}
        {activePanel && !fullscreen && (
          <aside
            className={cn(
              "hidden lg:flex flex-col border-l border-[hsl(var(--border))] bg-white overflow-y-auto flex-shrink-0",
              "w-80"
            )}
          >
            {/* Panel header */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(var(--border))] flex-shrink-0 sticky top-0 bg-white z-10"
            >
              <span style={{ color: toolColor }}>
                {sections.find(s => s.id === activeSection)?.icon}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-[hsl(var(--foreground))]">
                {sections.find(s => s.id === activeSection)?.label}
              </span>
            </div>
            {/* Panel content — crossfade only the inner content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  {activePanel}
                </motion.div>
              </AnimatePresence>
            </div>
          </aside>
        )}

        {/* Mobile: Bottom Sheet Panel (static container, crossfade content) */}
        {activePanel && !fullscreen && (
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[hsl(var(--border))] rounded-t-2xl shadow-2xl"
            style={{ maxHeight: "55vh" }}
          >
            {/* Drag handle */}
            <div className="flex flex-col items-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-[hsl(var(--border))]" />
            </div>
            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--border))]">
              <div className="flex items-center gap-2">
                <span style={{ color: toolColor }}>
                  {sections.find(s => s.id === activeSection)?.icon}
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.1em]">
                  {sections.find(s => s.id === activeSection)?.label}
                </span>
              </div>
              <button
                onClick={() => onSectionChange("")}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            {/* Sheet content */}
            <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: "calc(55vh - 80px)" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`mobile-${activeSection}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  {activePanel}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

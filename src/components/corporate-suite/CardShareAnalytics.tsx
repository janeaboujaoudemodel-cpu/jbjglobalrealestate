import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MousePointerClick, Phone, Mail, Globe, Download, QrCode, BarChart3, RefreshCw } from "lucide-react";

interface SharedCard {
  token: string;
  view_count: number;
  created_at: string;
  card_data: any;
}

interface ClickStat {
  link_type: string;
  count: number;
}

const LINK_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  phone: { icon: Phone, label: "Phone Calls", color: "text-green-400" },
  email: { icon: Mail, label: "Email Clicks", color: "text-blue-400" },
  website: { icon: Globe, label: "Website Visits", color: "text-purple-400" },
  save_contact: { icon: Download, label: "Contact Saves", color: "text-amber-400" },
  qr_scan: { icon: QrCode, label: "QR Scans", color: "text-cyan-400" },
};

export default function CardShareAnalytics() {
  const [cards, setCards] = useState<SharedCard[]>([]);
  const [clickStats, setClickStats] = useState<Record<string, ClickStat[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all shared cards for this user
      const { data: sharedCards } = await supabase
        .from("shared_business_cards")
        .select("token, view_count, created_at, card_data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!sharedCards || sharedCards.length === 0) {
        setCards([]);
        setLoading(false);
        return;
      }

      setCards(sharedCards);
      if (!selectedCard && sharedCards.length > 0) {
        setSelectedCard(sharedCards[0].token);
      }

      // Fetch click stats for all cards
      const tokens = sharedCards.map(c => c.token);
      const statsMap: Record<string, ClickStat[]> = {};

      for (const token of tokens) {
        const { data: clicks } = await supabase
          .from("card_link_clicks")
          .select("link_type")
          .eq("card_token", token);

        if (clicks) {
          const counts: Record<string, number> = {};
          clicks.forEach(c => {
            counts[c.link_type] = (counts[c.link_type] || 0) + 1;
          });
          statsMap[token] = Object.entries(counts).map(([link_type, count]) => ({ link_type, count }));
        }
      }

      setClickStats(statsMap);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw size={16} className="animate-spin text-[hsl(var(--gold))]" />
        <span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">Loading analytics…</span>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 size={24} className="mx-auto text-[hsl(var(--muted-foreground))] mb-2" />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          No shared cards yet. Share your card to start tracking analytics.
        </p>
      </div>
    );
  }

  const activeCard = cards.find(c => c.token === selectedCard) || cards[0];
  const activeStats = clickStats[activeCard.token] || [];
  const totalClicks = activeStats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-4">
      {/* Card selector (if multiple shared cards) */}
      {cards.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {cards.map((card) => {
            const cardName = (card.card_data as any)?.data?.name || "Unnamed";
            return (
              <button
                key={card.token}
                onClick={() => setSelectedCard(card.token)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                  selectedCard === card.token
                    ? "bg-[hsl(var(--gold)/0.15)] border-[hsl(var(--gold)/0.5)] text-[hsl(var(--gold))]"
                    : "bg-[hsl(var(--muted))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.3)]"
                }`}
              >
                {cardName}
              </button>
            );
          })}
        </div>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Eye size={14} className="text-[hsl(var(--gold))]" />
            <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Views</span>
          </div>
          <p className="text-xl font-bold text-[hsl(var(--foreground))]">{activeCard.view_count}</p>
        </div>
        <div className="bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <MousePointerClick size={14} className="text-[hsl(var(--gold))]" />
            <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Total Clicks</span>
          </div>
          <p className="text-xl font-bold text-[hsl(var(--foreground))]">{totalClicks}</p>
        </div>
      </div>

      {/* Link-level breakdown */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-semibold">
          Link Breakdown
        </p>
        {Object.entries(LINK_TYPE_CONFIG).map(([type, config]) => {
          const stat = activeStats.find(s => s.link_type === type);
          const count = stat?.count || 0;
          const Icon = config.icon;
          return (
            <div
              key={type}
              className="flex items-center justify-between bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Icon size={13} className={config.color} />
                <span className="text-xs text-[hsl(var(--foreground))]">{config.label}</span>
              </div>
              <span className="text-xs font-bold text-[hsl(var(--foreground))]">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Shared link info */}
      <div className="pt-2 border-t border-[hsl(var(--border))]">
        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
          Shared on {new Date(activeCard.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 break-all">
          {window.location.origin}/card/{activeCard.token}
        </p>
      </div>

      {/* Refresh */}
      <button
        onClick={fetchData}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.05)] border border-[hsl(var(--gold)/0.2)] transition-colors"
      >
        <RefreshCw size={12} />
        Refresh Analytics
      </button>
    </div>
  );
}

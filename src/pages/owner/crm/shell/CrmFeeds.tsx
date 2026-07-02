import { useMemo, useState } from "react";
import {
  Rss, AtSign, Bell, UsersRound, Star, MessageSquare, Heart, Share2,
  Paperclip, Image as ImageIcon, Smile, Send, MoreHorizontal, Filter,
  UserPlus, TrendingUp, Users, CircleDot,
} from "lucide-react";

type FeedFilter = "all" | "status" | "mentions" | "notifications" | "groups" | "starred";

type FeedPost = {
  id: string;
  author: string;
  initials: string;
  role: string;
  time: string;
  body: string;
  kind: "status" | "record" | "mention" | "note";
  target?: string;
  likes: number;
  comments: number;
  liked?: boolean;
};

const FILTERS: { id: FeedFilter; label: string; icon: any; count?: number }[] = [
  { id: "all", label: "All Feeds", icon: Rss },
  { id: "status", label: "Status Updates", icon: MessageSquare },
  { id: "mentions", label: "Mentions", icon: AtSign, count: 4 },
  { id: "notifications", label: "Notifications", icon: Bell, count: 12 },
  { id: "groups", label: "My Groups", icon: UsersRound },
  { id: "starred", label: "Starred", icon: Star },
];

const POSTS: FeedPost[] = [
  {
    id: "p1", author: "Amanda Clarke", initials: "AC", role: "Executive Assistant",
    time: "2m ago", body: "Just closed the Palm Jumeirah penthouse — AED 24.5M. Handover moved to Q1 2026.",
    kind: "status", likes: 12, comments: 4, liked: true,
  },
  {
    id: "p2", author: "System", initials: "JB", role: "JBJ CRM",
    time: "18m ago", body: "3 new leads assigned to you from Meta Ads · Emaar Beachfront campaign.",
    kind: "notification" as any, target: "Leads · Meta Ads", likes: 0, comments: 0,
  },
  {
    id: "p3", author: "Rania Al Fardan", initials: "RA", role: "Senior Broker",
    time: "1h ago", body: "@Jane — client wants to compare Vida Residences vs. Bulgari Lighthouse. Preparing decks for Thursday tour.",
    kind: "mention", likes: 3, comments: 6,
  },
  {
    id: "p4", author: "Omar Haddad", initials: "OH", role: "Investment Advisor",
    time: "3h ago", body: "Deal moved to Negotiation: Marina Vista T2 · Unit 4802. Pipeline value +AED 4.8M this week 📈",
    kind: "record", target: "Deals · Marina Vista T2 · 4802", likes: 7, comments: 2,
  },
  {
    id: "p5", author: "Lina Karam", initials: "LK", role: "Client Success",
    time: "Yesterday", body: "Wrapped onboarding for 6 new investors from the Riyadh launch. Full recap in the shared board.",
    kind: "status", likes: 21, comments: 9,
  },
];

const GROUPS = [
  { name: "Sales · Dubai", members: 14, unread: 3 },
  { name: "Palm & Beachfront", members: 8, unread: 0 },
  { name: "Investor Relations", members: 21, unread: 5 },
  { name: "Marketing Ops", members: 6, unread: 0 },
];

const FOLLOWS = [
  { name: "Emaar Beachfront T3", meta: "Deal · AED 8.2M" },
  { name: "Jumeirah Bay Villa 12", meta: "Account · Ultra HNW" },
  { name: "Q1 2026 Forecast", meta: "Forecast" },
];

export default function CrmFeeds() {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState<FeedPost[]>(POSTS);

  const visible = useMemo(() => {
    if (filter === "all") return posts;
    if (filter === "status") return posts.filter((p) => p.kind === "status");
    if (filter === "mentions") return posts.filter((p) => p.kind === "mention");
    if (filter === "notifications") return posts.filter((p) => (p.kind as string) === "notification");
    if (filter === "starred") return posts.slice(0, 2);
    return posts;
  }, [filter, posts]);

  const submit = () => {
    if (!draft.trim()) return;
    setPosts((prev) => [
      { id: `n${Date.now()}`, author: "You", initials: "YO", role: "Owner", time: "just now", body: draft.trim(), kind: "status", likes: 0, comments: 0 },
      ...prev,
    ]);
    setDraft("");
  };

  const toggleLike = (id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p));
  };

  return (
    <div className="jc-feeds">
      <aside className="jc-feeds__rail" aria-label="Feed filters">
        <div className="jc-feeds__rail-title">Feeds</div>
        <nav>
          {FILTERS.map((f) => {
            const Icon = f.icon;
            return (
              <button key={f.id} type="button" className="jc-feeds__filter" data-active={filter === f.id} onClick={() => setFilter(f.id)}>
                <Icon size={17} strokeWidth={1.9} />
                <span>{f.label}</span>
                {f.count ? <span className="jc-feeds__filter-count">{f.count}</span> : null}
              </button>
            );
          })}
        </nav>
        <div className="jc-feeds__rail-title" style={{ marginTop: 22 }}>Quick Actions</div>
        <button type="button" className="jc-feeds__filter"><UserPlus size={17} strokeWidth={1.9} /><span>New Group</span></button>
        <button type="button" className="jc-feeds__filter"><Filter size={17} strokeWidth={1.9} /><span>Filter Rules</span></button>
      </aside>

      <section className="jc-feeds__main">
        <div className="jc-feeds__composer">
          <div className="jc-feeds__avatar" data-me="true">YO</div>
          <div className="jc-feeds__composer-body">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share an update with your team…"
              rows={2}
            />
            <div className="jc-feeds__composer-actions">
              <div className="jc-feeds__composer-tools">
                <button type="button" aria-label="Attach"><Paperclip size={17} /></button>
                <button type="button" aria-label="Image"><ImageIcon size={17} /></button>
                <button type="button" aria-label="Mention"><AtSign size={17} /></button>
                <button type="button" aria-label="Emoji"><Smile size={17} /></button>
              </div>
              <button type="button" className="jc-feeds__post-btn" onClick={submit} disabled={!draft.trim()}>
                <Send size={15} /> Post
              </button>
            </div>
          </div>
        </div>

        <div className="jc-feeds__stream">
          {visible.map((p) => (
            <article className="jc-feeds__post" key={p.id}>
              <div className="jc-feeds__avatar">{p.initials}</div>
              <div className="jc-feeds__post-body">
                <header className="jc-feeds__post-header">
                  <div>
                    <span className="jc-feeds__post-author">{p.author}</span>
                    <span className="jc-feeds__post-role"> · {p.role}</span>
                  </div>
                  <div className="jc-feeds__post-meta">
                    <span>{p.time}</span>
                    <button type="button" aria-label="More"><MoreHorizontal size={16} /></button>
                  </div>
                </header>
                {p.target && (
                  <div className="jc-feeds__post-target">
                    <CircleDot size={13} /> {p.target}
                  </div>
                )}
                <p className="jc-feeds__post-text">{p.body}</p>
                <footer className="jc-feeds__post-footer">
                  <button type="button" data-active={p.liked} onClick={() => toggleLike(p.id)}>
                    <Heart size={15} /> <span>{p.likes}</span>
                  </button>
                  <button type="button">
                    <MessageSquare size={15} /> <span>{p.comments}</span>
                  </button>
                  <button type="button">
                    <Share2 size={15} /> <span>Share</span>
                  </button>
                </footer>
              </div>
            </article>
          ))}
          {visible.length === 0 && (
            <div className="jc-feeds__empty">Nothing in this feed yet.</div>
          )}
        </div>
      </section>

      <aside className="jc-feeds__aside" aria-label="Groups & follows">
        <div className="jc-feeds__aside-card">
          <header>
            <h4><UsersRound size={15} /> My Groups</h4>
            <button type="button">See all</button>
          </header>
          <ul>
            {GROUPS.map((g) => (
              <li key={g.name}>
                <div>
                  <span className="jc-feeds__group-name">{g.name}</span>
                  <span className="jc-feeds__group-meta"><Users size={12} /> {g.members}</span>
                </div>
                {g.unread > 0 && <span className="jc-feeds__group-badge">{g.unread}</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="jc-feeds__aside-card">
          <header>
            <h4><TrendingUp size={15} /> Following</h4>
            <button type="button">Manage</button>
          </header>
          <ul>
            {FOLLOWS.map((f) => (
              <li key={f.name}>
                <div>
                  <span className="jc-feeds__group-name">{f.name}</span>
                  <span className="jc-feeds__group-meta">{f.meta}</span>
                </div>
                <Star size={14} className="jc-feeds__star" />
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

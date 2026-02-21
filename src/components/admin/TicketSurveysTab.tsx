import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Star, Search, MessageSquare, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';

const GOLD_COLORS = ['#C8A766', '#B8956E', '#A07D4A', '#D4B87A', '#917040'];

const ratingLabels: Record<string, string> = {
  overall_rating: 'Overall Rating',
  ease_of_submission: 'Ease of Submission',
  response_speed: 'Response Speed',
  resolution_quality: 'Resolution Quality',
  website_smartness: 'Website Smartness',
};

const StarDisplay = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`w-4 h-4 ${s <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

const TicketSurveysTab: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ['ticket-surveys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_surveys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = surveys.filter((s: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.ticket_number?.toLowerCase().includes(q)
    );
  });

  // Build distribution data for charts
  const buildDistribution = (key: string) => {
    const counts = [0, 0, 0, 0, 0];
    surveys.forEach((s: any) => {
      const val = s[key];
      if (val >= 1 && val <= 5) counts[val - 1]++;
    });
    return counts.map((count, i) => ({ name: `${i + 1}★`, count }));
  };

  const avgRating = surveys.length
    ? (surveys.reduce((sum: number, s: any) => sum + (s.overall_rating || 0), 0) / surveys.length).toFixed(1)
    : '—';

  const totalPoints = surveys.reduce((sum: number, s: any) => sum + (s.points_awarded || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 text-gold mx-auto mb-2" />
            <p className="text-3xl font-bold text-black">{surveys.length}</p>
            <p className="text-sm text-muted-foreground">Total Surveys</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="pt-6 text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-black">{avgRating}</p>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="pt-6 text-center">
            <MessageSquare className="w-8 h-8 text-gold mx-auto mb-2" />
            <p className="text-3xl font-bold text-black">{totalPoints}</p>
            <p className="text-sm text-muted-foreground">Points Awarded</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(ratingLabels).map(([key, label]) => (
          <Card key={key} className="bg-white border border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-black">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={buildDistribution(key)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d0" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {buildDistribution(key).map((_, i) => (
                      <Cell key={i} fill={GOLD_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Table */}
      <Card className="bg-white border-2 border-gold/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black">Survey Responses</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, ticket..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading surveys...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No surveys found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gold/20">
                    <th className="text-left py-3 px-2 font-semibold text-black">Name</th>
                    <th className="text-left py-3 px-2 font-semibold text-black">Email</th>
                    <th className="text-left py-3 px-2 font-semibold text-black">Ticket</th>
                    <th className="text-center py-3 px-2 font-semibold text-black">Overall</th>
                    <th className="text-center py-3 px-2 font-semibold text-black">Ease</th>
                    <th className="text-center py-3 px-2 font-semibold text-black">Speed</th>
                    <th className="text-center py-3 px-2 font-semibold text-black">Quality</th>
                    <th className="text-center py-3 px-2 font-semibold text-black">Smart</th>
                    <th className="text-left py-3 px-2 font-semibold text-black">Suggestions</th>
                    <th className="text-center py-3 px-2 font-semibold text-black">Points</th>
                    <th className="text-left py-3 px-2 font-semibold text-black">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: any) => (
                    <tr key={s.id} className="border-b border-gold/10 hover:bg-gold/5">
                      <td className="py-2 px-2 text-black">{s.full_name || '—'}</td>
                      <td className="py-2 px-2 text-muted-foreground">{s.email || '—'}</td>
                      <td className="py-2 px-2">
                        <span className="font-mono text-gold font-semibold cursor-pointer hover:underline">
                          {s.ticket_number || '—'}
                        </span>
                      </td>
                      <td className="py-2 px-2"><StarDisplay rating={s.overall_rating} /></td>
                      <td className="py-2 px-2"><StarDisplay rating={s.ease_of_submission} /></td>
                      <td className="py-2 px-2"><StarDisplay rating={s.response_speed} /></td>
                      <td className="py-2 px-2"><StarDisplay rating={s.resolution_quality} /></td>
                      <td className="py-2 px-2"><StarDisplay rating={s.website_smartness} /></td>
                      <td className="py-2 px-2 max-w-[200px] truncate text-muted-foreground">{s.suggestions || '—'}</td>
                      <td className="py-2 px-2 text-center text-gold font-semibold">{s.points_awarded}</td>
                      <td className="py-2 px-2 text-muted-foreground text-xs">
                        {s.created_at ? format(new Date(s.created_at), 'MMM d, yyyy') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketSurveysTab;

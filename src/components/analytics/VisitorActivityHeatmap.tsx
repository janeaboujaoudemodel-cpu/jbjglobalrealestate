/**
 * VISITOR ACTIVITY HEATMAP
 * Visualizes visitor activity by hour and day of week
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface HeatmapData {
  day: number; // 0-6 (Sun-Sat)
  hour: number; // 0-23
  count: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function VisitorActivityHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [maxCount, setMaxCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const fetchHeatmapData = async () => {
    setIsLoading(true);
    try {
      // Fetch visitor events from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('visitor_events')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      // Aggregate by day of week and hour
      const aggregated = new Map<string, number>();
      
      data?.forEach((event) => {
        const date = new Date(event.created_at);
        const day = date.getDay();
        const hour = date.getHours();
        const key = `${day}-${hour}`;
        aggregated.set(key, (aggregated.get(key) || 0) + 1);
      });

      // Convert to array format
      const heatmap: HeatmapData[] = [];
      let max = 1;

      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const count = aggregated.get(`${day}-${hour}`) || 0;
          heatmap.push({ day, hour, count });
          if (count > max) max = count;
        }
      }

      setHeatmapData(heatmap);
      setMaxCount(max);
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-muted/30';
    const ratio = count / maxCount;
    if (ratio < 0.2) return 'bg-primary/20';
    if (ratio < 0.4) return 'bg-primary/40';
    if (ratio < 0.6) return 'bg-primary/60';
    if (ratio < 0.8) return 'bg-primary/80';
    return 'bg-primary';
  };

  const getCell = (day: number, hour: number): HeatmapData | undefined => {
    return heatmapData.find(d => d.day === day && d.hour === hour);
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12a';
    if (hour === 12) return '12p';
    return hour < 12 ? `${hour}a` : `${hour - 12}p`;
  };

  if (isLoading) {
    return (
      <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
        <CardHeader>
          <CardTitle className="text-white">Visitor Activity Heatmap</CardTitle>
          <CardDescription>Loading activity data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
      <CardHeader>
        <CardTitle className="text-white">Visitor Activity Heatmap</CardTitle>
        <CardDescription>Peak engagement times over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Hour labels */}
            <div className="flex mb-2 ml-12">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs text-muted-foreground"
                >
                  {hour % 3 === 0 ? formatHour(hour) : ''}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {DAYS.map((dayName, dayIndex) => (
              <div key={dayName} className="flex items-center gap-1 mb-1">
                <div className="w-10 text-xs text-muted-foreground text-right pr-2">
                  {dayName}
                </div>
                <div className="flex flex-1 gap-[2px]">
                  {HOURS.map((hour) => {
                    const cell = getCell(dayIndex, hour);
                    return (
                      <div
                        key={hour}
                        className={cn(
                          'flex-1 h-6 rounded-sm transition-all hover:ring-2 hover:ring-primary/50 cursor-pointer',
                          getIntensity(cell?.count || 0)
                        )}
                        title={`${dayName} ${formatHour(hour)}: ${cell?.count || 0} visitors`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-sm bg-muted/30" />
                <div className="w-4 h-4 rounded-sm bg-primary/20" />
                <div className="w-4 h-4 rounded-sm bg-primary/40" />
                <div className="w-4 h-4 rounded-sm bg-primary/60" />
                <div className="w-4 h-4 rounded-sm bg-primary/80" />
                <div className="w-4 h-4 rounded-sm bg-primary" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default VisitorActivityHeatmap;

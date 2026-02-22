import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp,
  Trophy,
  Star,
  Gift,
  ArrowRight,
  ArrowUpRight,
  Zap,
  Target,
  Award,
  Crown,
  Rocket
} from "lucide-react";

const LEVELS = [
  { level: 1, name: "Starter", points: 0 },
  { level: 2, name: "Rising Star", points: 500 },
  { level: 3, name: "Top Performer", points: 2000 },
  { level: 4, name: "Elite Broker", points: 5000 },
  { level: 5, name: "Legend", points: 10000 },
];

const POINT_ACTIVITIES = [
  { activity: "Complete a training module", points: 50, icon: Star },
  { activity: "Close a deal", points: 500, icon: Trophy },
  { activity: "Site visit check-in", points: 25, icon: Target },
  { activity: "Lead follow-up", points: 10, icon: Zap },
  { activity: "Refer a broker", points: 200, icon: Gift },
];

const REWARDS = [
  { name: "Free Property Photography", points: 500, icon: Award },
  { name: "Premium Marketing Package", points: 1500, icon: Rocket },
  { name: "VIP Developer Access", points: 3000, icon: Crown },
  { name: "Commission Bonus", points: 5000, icon: Trophy },
];

export function BrokerToolkitGrowth() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section id="section-growth" className="py-8 md:py-10 bg-black">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Active Champagne Layer for Growth Section - matching global design */}
        <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 rounded-2xl p-6 md:p-8 shadow-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-black/80 text-gold border-gold/50 mb-4 shadow-sm">
              <TrendingUp className="w-3 h-3 mr-1 text-gold" />
              <span className="text-gold">Growth</span>
              <span className="text-white ml-1">& Rewards</span>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Level Up Your <span className="text-gold">Career</span>
            </h2>
            <p className="text-zinc-700 max-w-2xl mx-auto">
              Earn points for every action, unlock rewards, and climb the leaderboard.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Levels Card - White background to match Earn Points */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 hover:border-gold hover:shadow-xl hover:shadow-gold/20 h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-black mb-6 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-gold" />
                    Broker Levels
                  </h3>
                  <div className="space-y-4">
                    {LEVELS.map((level, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/50 flex items-center justify-center text-black font-bold text-sm shadow-md">
                          {level.level}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-black font-medium">{level.name}</span>
                            <span className="text-gold text-sm font-semibold">{level.points.toLocaleString()} pts</span>
                          </div>
                          <Progress value={i === 0 ? 100 : 0} className="h-1.5 bg-zinc-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Point Activities Card - White background */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 hover:border-gold hover:shadow-xl hover:shadow-gold/20 h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-black mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-gold" />
                    Earn Points
                  </h3>
                  <div className="space-y-3">
                    {POINT_ACTIVITIES.map((activity, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gold/20 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                            <activity.icon className="w-4 h-4 text-gold" />
                          </div>
                          <span className="text-zinc-700 text-sm">{activity.activity}</span>
                        </div>
                        <span className="text-gold font-semibold">+{activity.points}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Rewards Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h3 className="text-xl font-semibold text-black mb-6 text-center flex items-center justify-center gap-2">
              <Gift className="w-5 h-5 text-gold" />
              Redeem Rewards
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {REWARDS.map((reward, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 hover:border-gold/60 hover:shadow-xl hover:shadow-gold/20 transition-all cursor-pointer h-full">
                    <CardContent className="p-5 text-center">
                      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3">
                        <reward.icon className="w-6 h-6 text-gold" />
                      </div>
                      <h4 className="text-black font-medium mb-1">{reward.name}</h4>
                      <p className="text-gold font-semibold">{reward.points.toLocaleString()} points</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA - Premium 3D Button Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <button 
              className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 50%, #EDE4D3 100%)',
                border: '2px solid rgba(200,167,102,0.5)',
                boxShadow: `
                  0 10px 30px rgba(200,167,102,0.4),
                  0 6px 15px rgba(0,0,0,0.2),
                  inset 0 2px 4px rgba(255,255,255,0.9),
                  inset 0 -2px 4px rgba(200,167,102,0.2),
                  0 0 20px rgba(200,167,102,0.3)
                `,
              }}
              onClick={() => navigate(user ? '/my-account' : '/auth?redirect=/my-account')}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
              <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
              <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
              <span className="relative flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-gold" />
                <span className="text-gold">{user ? 'View My' : 'Start Earning'}</span>
                <span className="text-black">{user ? 'Progress' : 'Points'}</span>
                <ArrowUpRight className="w-5 h-5 text-black" />
              </span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

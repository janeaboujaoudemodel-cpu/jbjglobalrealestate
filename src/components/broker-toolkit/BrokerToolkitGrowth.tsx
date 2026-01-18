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
  { level: 1, name: "Starter", points: 0, color: "from-zinc-500 to-zinc-600" },
  { level: 2, name: "Rising Star", points: 500, color: "from-blue-500 to-blue-600" },
  { level: 3, name: "Top Performer", points: 2000, color: "from-purple-500 to-purple-600" },
  { level: 4, name: "Elite Broker", points: 5000, color: "from-gold to-gold-dark" },
  { level: 5, name: "Legend", points: 10000, color: "from-rose-500 to-rose-600" },
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
    <section id="section-growth" className="py-16 md:py-20 bg-[hsl(var(--premium-bg))]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-white text-black border-gold/30 mb-4 shadow-sm">
            <TrendingUp className="w-3 h-3 mr-1 text-gold" />
            <span className="text-gold">Growth</span>
            <span className="text-black ml-1">& Rewards</span>
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Level Up Your <span className="text-gold">Career</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
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
            <Card className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 hover:border-gold hover:shadow-xl hover:shadow-gold/20 h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-black mb-6 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-gold" />
                  Broker Levels
                </h3>
                <div className="space-y-4">
                  {LEVELS.map((level, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${level.color} flex items-center justify-center text-white font-bold text-sm`}>
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
            <Card className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 hover:border-gold hover:shadow-xl hover:shadow-gold/20 h-full">
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
          <h3 className="text-xl font-semibold text-white mb-6 text-center flex items-center justify-center gap-2">
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
                <Card className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 hover:border-gold/60 hover:shadow-xl hover:shadow-gold/20 transition-all cursor-pointer h-full">
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

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button 
            className="bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black px-8 py-6 text-lg font-semibold transition-all shadow-[0_0_30px_rgba(200,167,102,0.4)] hover:shadow-[0_0_40px_rgba(200,167,102,0.6)]"
            onClick={() => navigate(user ? '/my-account' : '/auth?redirect=/my-account')}
          >
            <Trophy className="w-5 h-5 mr-2" />
            {user ? 'View My Progress' : 'Start Earning Points'}
            <ArrowUpRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

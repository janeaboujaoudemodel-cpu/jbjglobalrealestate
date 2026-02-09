/**
 * StudioSettings - Settings page for Creative Suite
 * Premium gold/champagne styling to prevent 404 errors
 */

import { Link } from "react-router-dom";
import { ArrowLeft, Settings, Bell, Palette, Shield, Download, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/SEOHead";

const settingsSections = [
  {
    icon: Bell,
    title: "Notifications",
    description: "Manage project completion and update alerts",
    comingSoon: true,
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Customize the studio interface theme",
    comingSoon: true,
  },
  {
    icon: Shield,
    title: "Privacy",
    description: "Control data sharing and visibility settings",
    comingSoon: true,
  },
  {
    icon: Download,
    title: "Export Settings",
    description: "Configure default export formats and quality",
    comingSoon: true,
  },
];

export default function StudioSettings() {
  return (
    <>
      <SEOHead
        title="Studio Settings | JBJ Global Real Estate"
        description="Configure your Creative Suite preferences"
        noIndex
      />
      
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-gold/20 bg-gradient-to-r from-black via-zinc-900/50 to-black">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/studio">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600"
                  style={{ color: '#a1a1aa' }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" style={{ color: '#a1a1aa' }} />
                  <span style={{ color: '#a1a1aa' }}>Back to Studio</span>
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/40 flex items-center justify-center">
                <Settings className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Studio <span className="text-gold">Settings</span>
                </h1>
                <p className="text-zinc-400 text-sm">Configure your Creative Suite preferences</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card 
                  key={section.title}
                  className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/50 border-gold/20 hover:border-gold/40 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-white">{section.title}</CardTitle>
                          <CardDescription className="text-zinc-400">
                            {section.description}
                          </CardDescription>
                        </div>
                      </div>
                      {section.comingSoon && (
                        <span className="px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-medium border border-gold/30">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between py-2 opacity-50">
                      <Label className="text-zinc-300">Enable {section.title.toLowerCase()}</Label>
                      <Switch disabled />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Help Section */}
            <Card className="bg-gradient-to-br from-gold/5 to-gold/10 border-gold/30">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Need Help?</h3>
                    <p className="text-zinc-400 text-sm">
                      Contact our support team for assistance with Creative Suite features.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="ml-auto border-gold/40 text-gold hover:bg-gold/10"
                    asChild
                  >
                    <Link to="/contact">Contact Support</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

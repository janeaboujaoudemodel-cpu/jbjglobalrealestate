import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, ExternalLink, Check, X, AlertTriangle, 
  Eye, EyeOff, Layout, Menu, FileText, Search,
  Filter, RefreshCw, Brain, Sparkles, Zap, AlertCircle,
  ClipboardCheck, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import OwnerGuard from '@/components/OwnerGuard';

// Import verified AI Tools inventory
import { 
  AI_TOOLS_INVENTORY_VERIFIED, 
  computeAIToolsStats,
  type AIToolStatus,
  type AIToolEntry 
} from '@/data/ai-tools-verified-inventory';

// Import delivery checklist
import { DELIVERY_REQUIREMENTS, type DeliveryStatus, type DeliveryRequirement } from '@/config/delivery-checklist';

// Route Inventory - Comprehensive list of all application routes
const ROUTE_INVENTORY = [
  // Owner-only routes
  { path: '/owner', name: 'Owner Dashboard', access: 'owner', dashboard: true, sidebar: true, registry: true },
  { path: '/owner/audit', name: 'Owner Audit', access: 'owner', dashboard: true, sidebar: true, registry: true },
  { path: '/owner/inbox', name: 'Owner Inbox', access: 'owner', dashboard: true, sidebar: true, registry: true },
  { path: '/owner/agenda', name: 'Daily Agenda', access: 'owner', dashboard: true, sidebar: true, registry: true },
  { path: '/owner/features', name: 'Feature Registry', access: 'owner', dashboard: true, sidebar: true, registry: true },
  { path: '/owner/integrations', name: 'Integrations Status', access: 'owner', dashboard: true, sidebar: true, registry: true },
  { path: '/owner/safety', name: 'AI Safety Panel', access: 'owner', dashboard: true, sidebar: true, registry: true },
  { path: '/crm/leads', name: 'CRM Leads', access: 'owner', dashboard: true, sidebar: true, registry: true },
  { path: '/admin', name: 'Admin Panel', access: 'owner', dashboard: true, sidebar: true, registry: true },
  { path: '/admin/crm', name: 'Admin CRM', access: 'owner', dashboard: false, sidebar: true, registry: true },
  { path: '/listing-admin', name: 'Listing Admin', access: 'owner', dashboard: true, sidebar: true, registry: true },
  
  // Broker routes
  { path: '/broker-dashboard', name: 'Broker Dashboard', access: 'broker', dashboard: true, sidebar: true, registry: true },
  { path: '/broker-toolkit', name: 'Broker Toolkit', access: 'broker', dashboard: true, sidebar: true, registry: true },
  { path: '/broker-education', name: 'Broker Education', access: 'broker', dashboard: true, sidebar: true, registry: true },
  { path: '/broker-resources', name: 'Broker Resources', access: 'broker', dashboard: true, sidebar: true, registry: true },
  { path: '/broker/crm', name: 'Broker CRM', access: 'broker', dashboard: true, sidebar: true, registry: true },
  { path: '/broker-partner-dashboard', name: 'Partner Broker Dashboard', access: 'broker', dashboard: true, sidebar: false, registry: true },
  
  // Investor routes  
  { path: '/investor-dashboard', name: 'Investor Dashboard', access: 'investor', dashboard: true, sidebar: true, registry: true },
  { path: '/investor-education', name: 'Investor Education', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/my-dashboard', name: 'My Dashboard', access: 'authenticated', dashboard: true, sidebar: true, registry: true },
  
  // Public property routes
  { path: '/', name: 'Home', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/properties', name: 'Properties', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/projects', name: 'Projects', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/developers', name: 'Developers', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/areas', name: 'Areas', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/map', name: 'Property Map', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/compare', name: 'Compare Properties', access: 'public', dashboard: false, sidebar: false, registry: true },
  
  // Services routes
  { path: '/services', name: 'Services Hub', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/services/property-management', name: 'Property Management', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/services/buying-advisory', name: 'Buying Advisory', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/services/selling-advisory', name: 'Selling Advisory', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/services/rental-advisory', name: 'Rental Advisory', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/services/investment-advisory', name: 'Investment Advisory', access: 'public', dashboard: false, sidebar: false, registry: true },
  
  // Toolkit routes
  { path: '/toolkit', name: 'Toolkit Hub', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/quiz', name: 'AI Home Finder', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/mortgage-calculator', name: 'Mortgage Calculator', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/calculator/roi', name: 'ROI Calculator', access: 'public', dashboard: false, sidebar: false, registry: true },
  
  // Guides & Content
  { path: '/guides', name: 'Guides Library', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/buyer-guide', name: 'Buyer Guide', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/seller-guide', name: 'Seller Guide', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/tenant-guide', name: 'Tenant Guide', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/landlord-guide', name: 'Landlord Guide', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/guides/golden-visa-uae', name: 'Golden Visa Guide', access: 'public', dashboard: false, sidebar: false, registry: true },
  
  // Market Intelligence
  { path: '/market-intelligence/overview', name: 'Market Overview', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/market-intelligence/areas', name: 'Area Intelligence', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/market-intelligence/reports', name: 'Market Reports', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/news', name: 'News & Insights', access: 'public', dashboard: false, sidebar: false, registry: true },
  
  // Company routes
  { path: '/about', name: 'About Us', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/founder', name: 'About Founder', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/team', name: 'Meet the Team', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/brokers', name: 'Our Brokers', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/contact', name: 'Contact Us', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/join', name: 'Careers', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/awards', name: 'Awards', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/press-kit', name: 'Press Kit', access: 'public', dashboard: false, sidebar: false, registry: true },
  
  // Partners
  { path: '/partners', name: 'Partners Hub', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/partners/mortgage', name: 'Mortgage Partners', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/partners/legal', name: 'Legal Partners', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/partners/company-setup', name: 'Company Setup', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/partners/visa-services', name: 'Visa Services', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/referral-partner', name: 'Referral Partner', access: 'public', dashboard: false, sidebar: false, registry: true },
  
  // Legal
  { path: '/terms', name: 'Terms of Service', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/privacy', name: 'Privacy Policy', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/cookies', name: 'Cookies Policy', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/trust-and-audit-center', name: 'Trust Center', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/intellectual-property', name: 'Intellectual Property', access: 'public', dashboard: false, sidebar: false, registry: true },
  
  // FAQ
  { path: '/faq', name: 'General FAQ', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/investor-faq', name: 'Investor FAQ', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/broker-faq', name: 'Broker FAQ', access: 'public', dashboard: false, sidebar: false, registry: true },
  
  // Auth & Account
  { path: '/auth', name: 'Sign In / Sign Up', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/my-account', name: 'My Account', access: 'authenticated', dashboard: true, sidebar: true, registry: true },
  { path: '/favorites', name: 'Favorites', access: 'authenticated', dashboard: true, sidebar: true, registry: true },
  
  // Seller
  { path: '/seller-listing', name: 'Sell Your Property', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/sell/valuation', name: 'Property Valuation', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/landlord-portal', name: 'Landlord Portal', access: 'authenticated', dashboard: false, sidebar: false, registry: true },
  
  // Misc
  { path: '/philanthropy', name: 'Philanthropy', access: 'public', dashboard: false, sidebar: false, registry: true },
  { path: '/sitemap', name: 'Sitemap', access: 'public', dashboard: false, sidebar: false, registry: true },
];

type AccessLevel = 'owner' | 'broker' | 'investor' | 'authenticated' | 'public';

const OwnerAuditPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [accessFilter, setAccessFilter] = useState<AccessLevel | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'orphan'>('all');

  // Calculate stats
  const stats = useMemo(() => {
    const total = ROUTE_INVENTORY.length;
    const ownerRoutes = ROUTE_INVENTORY.filter(r => r.access === 'owner').length;
    const brokerRoutes = ROUTE_INVENTORY.filter(r => r.access === 'broker').length;
    const publicRoutes = ROUTE_INVENTORY.filter(r => r.access === 'public').length;
    const orphanRoutes = ROUTE_INVENTORY.filter(r => !r.dashboard && !r.sidebar && !r.registry).length;
    const visibleRoutes = ROUTE_INVENTORY.filter(r => r.dashboard || r.sidebar || r.registry).length;
    
    return { total, ownerRoutes, brokerRoutes, publicRoutes, orphanRoutes, visibleRoutes };
  }, []);

  // Filter routes
  const filteredRoutes = useMemo(() => {
    return ROUTE_INVENTORY.filter(route => {
      // Search filter
      if (searchQuery && !route.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !route.path.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Access level filter
      if (accessFilter !== 'all' && route.access !== accessFilter) {
        return false;
      }
      
      // Visibility filter
      if (visibilityFilter === 'visible' && !route.dashboard && !route.sidebar && !route.registry) {
        return false;
      }
      if (visibilityFilter === 'orphan' && (route.dashboard || route.sidebar || route.registry)) {
        return false;
      }
      
      return true;
    });
  }, [searchQuery, accessFilter, visibilityFilter]);

  const getAccessBadge = (access: AccessLevel) => {
    switch (access) {
      case 'owner':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Owner</Badge>;
      case 'broker':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Broker</Badge>;
      case 'investor':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Investor</Badge>;
      case 'authenticated':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Auth Required</Badge>;
      case 'public':
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">Public</Badge>;
    }
  };

  // AI Tools stats
  const aiStats = useMemo(() => {
    const total = AI_TOOLS_INVENTORY_VERIFIED.length;
    const working = AI_TOOLS_INVENTORY_VERIFIED.filter(t => t.status === 'working').length;
    const partial = AI_TOOLS_INVENTORY_VERIFIED.filter(t => t.status === 'partial').length;
    const missing = AI_TOOLS_INVENTORY_VERIFIED.filter(t => t.status === '404').length;
    const componentOnly = AI_TOOLS_INVENTORY_VERIFIED.filter(t => t.status === 'component_only').length;
    const comingSoon = AI_TOOLS_INVENTORY_VERIFIED.filter(t => t.status === 'coming_soon').length;
    const apiMissing = AI_TOOLS_INVENTORY_VERIFIED.filter(t => t.status === 'api_missing').length;
    const withEdgeFunction = AI_TOOLS_INVENTORY_VERIFIED.filter(t => t.edgeFunction).length;
    
    return { total, working, partial, missing, componentOnly, comingSoon, apiMissing, withEdgeFunction };
  }, []);

  const getAIStatusBadge = (status: AIToolStatus) => {
    switch (status) {
      case 'working':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✅ Working</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">⚠️ Partial</Badge>;
      case '404':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">❌ 404</Badge>;
      case 'component_only':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">📦 Component Only</Badge>;
      case 'coming_soon':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">🕒 Coming Soon</Badge>;
      case 'api_missing':
        return <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">🔌 API Missing</Badge>;
    }
  };

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-gold/20 bg-gradient-to-r from-black via-zinc-900/50 to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Owner Audit</h1>
                <p className="text-zinc-400">Complete route inventory with visibility tracking</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="routes" className="w-full">
            <TabsList className="bg-zinc-900/50 border border-gold/20 mb-6">
              <TabsTrigger value="routes" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                <FileText className="w-4 h-4 mr-2" />
                Route Inventory
              </TabsTrigger>
              <TabsTrigger value="ai-tools" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                <Brain className="w-4 h-4 mr-2" />
                AI Tools Audit
              </TabsTrigger>
              <TabsTrigger value="delivery" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Delivery Checklist
              </TabsTrigger>
            </TabsList>

            {/* Routes Tab */}
            <TabsContent value="routes">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <Card className="bg-zinc-900/50 border-gold/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-zinc-400">Total Routes</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-gold/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.ownerRoutes}</div>
                <div className="text-xs text-zinc-400">Owner Only</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-gold/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.brokerRoutes}</div>
                <div className="text-xs text-zinc-400">Broker</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-gold/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-zinc-400">{stats.publicRoutes}</div>
                <div className="text-xs text-zinc-400">Public</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-gold/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.visibleRoutes}</div>
                <div className="text-xs text-zinc-400">Linked in UI</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-gold/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.orphanRoutes}</div>
                <div className="text-xs text-zinc-400">Orphan Routes</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search routes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-gold/20 text-white"
                />
              </div>
            </div>
            <Select value={accessFilter} onValueChange={(v) => setAccessFilter(v as any)}>
              <SelectTrigger className="w-[160px] bg-zinc-900/50 border-gold/20 text-white">
                <SelectValue placeholder="Access Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Access</SelectItem>
                <SelectItem value="owner">Owner Only</SelectItem>
                <SelectItem value="broker">Broker</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="authenticated">Auth Required</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={(v) => setVisibilityFilter(v as any)}>
              <SelectTrigger className="w-[160px] bg-zinc-900/50 border-gold/20 text-white">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                <SelectItem value="visible">Linked in UI</SelectItem>
                <SelectItem value="orphan">Orphan Routes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Route Table */}
          <Card className="bg-zinc-900/50 border-gold/20">
            <CardHeader className="border-b border-gold/20">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Route Inventory ({filteredRoutes.length} routes)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <table className="w-full">
                  <thead className="sticky top-0 bg-zinc-900 border-b border-gold/20">
                    <tr>
                      <th className="text-left p-4 text-xs font-semibold text-zinc-400 uppercase">Route</th>
                      <th className="text-left p-4 text-xs font-semibold text-zinc-400 uppercase">Access</th>
                      <th className="text-center p-4 text-xs font-semibold text-zinc-400 uppercase">Dashboard</th>
                      <th className="text-center p-4 text-xs font-semibold text-zinc-400 uppercase">Sidebar</th>
                      <th className="text-center p-4 text-xs font-semibold text-zinc-400 uppercase">Registry</th>
                      <th className="text-center p-4 text-xs font-semibold text-zinc-400 uppercase">Status</th>
                      <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map((route) => {
                      const isOrphan = !route.dashboard && !route.sidebar && !route.registry;
                      return (
                        <tr 
                          key={route.path} 
                          className={`border-b border-gold/10 hover:bg-gold/5 transition-colors ${isOrphan ? 'bg-red-500/5' : ''}`}
                        >
                          <td className="p-4">
                            <div className="font-medium text-white">{route.name}</div>
                            <div className="text-xs text-zinc-500 font-mono">{route.path}</div>
                          </td>
                          <td className="p-4">
                            {getAccessBadge(route.access as AccessLevel)}
                          </td>
                          <td className="p-4 text-center">
                            {route.dashboard ? (
                              <Check className="w-4 h-4 text-green-400 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-zinc-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {route.sidebar ? (
                              <Check className="w-4 h-4 text-green-400 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-zinc-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {route.registry ? (
                              <Check className="w-4 h-4 text-green-400 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-zinc-600 mx-auto" />
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {isOrphan ? (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Orphan
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <Eye className="w-3 h-3 mr-1" />
                                Visible
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-gold hover:text-gold-light hover:bg-gold/10"
                            >
                              <Link to={route.path} target="_blank">
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Open
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="mt-6 p-4 rounded-lg bg-zinc-900/50 border border-gold/20">
            <h3 className="text-sm font-semibold text-white mb-3">Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-400">Dashboard = Visible on dashboard page</span>
              </div>
              <div className="flex items-center gap-2">
                <Menu className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-400">Sidebar = Visible in navigation sidebar</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-400">Registry = Listed in Feature Registry</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-zinc-400">Orphan = Not linked anywhere in UI</span>
              </div>
            </div>
          </div>
            </TabsContent>

            {/* AI Tools Tab */}
            <TabsContent value="ai-tools">
              {/* AI Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Card className="bg-zinc-900/50 border-gold/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-white">{aiStats.total}</div>
                    <div className="text-xs text-zinc-400">Total AI Tools</div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-gold/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{aiStats.working}</div>
                    <div className="text-xs text-zinc-400">✅ Working</div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-gold/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{aiStats.partial}</div>
                    <div className="text-xs text-zinc-400">⚠️ Partial</div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-gold/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{aiStats.missing}</div>
                    <div className="text-xs text-zinc-400">❌ 404 Missing</div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-zinc-900/50 border-pink-500/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-pink-400">{aiStats.apiMissing}</div>
                    <div className="text-xs text-zinc-400">🔌 API Missing</div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-gold/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">{aiStats.componentOnly}</div>
                    <div className="text-xs text-zinc-400">📦 Component Only</div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-gold/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{aiStats.comingSoon}</div>
                    <div className="text-xs text-zinc-400">🕒 Coming Soon</div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-gold/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{aiStats.withEdgeFunction}</div>
                    <div className="text-xs text-zinc-400">⚡ Edge Functions</div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Tools Table */}
              <Card className="bg-zinc-900/50 border-gold/20">
                <CardHeader className="border-b border-gold/20">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-gold" />
                    AI Tools Inventory ({AI_TOOLS_INVENTORY_VERIFIED.length} tools)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-zinc-900 border-b border-gold/20">
                        <tr>
                          <th className="text-left p-4 text-xs font-semibold text-zinc-400 uppercase">Tool Name</th>
                          <th className="text-left p-4 text-xs font-semibold text-zinc-400 uppercase">Route</th>
                          <th className="text-left p-4 text-xs font-semibold text-zinc-400 uppercase">Navigation</th>
                          <th className="text-left p-4 text-xs font-semibold text-zinc-400 uppercase">Status</th>
                          <th className="text-left p-4 text-xs font-semibold text-zinc-400 uppercase">Edge Function</th>
                          <th className="text-left p-4 text-xs font-semibold text-zinc-400 uppercase">Fix Needed</th>
                          <th className="text-right p-4 text-xs font-semibold text-zinc-400 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {AI_TOOLS_INVENTORY_VERIFIED.map((tool) => (
                          <tr 
                            key={tool.name} 
                            className={`border-b border-gold/10 hover:bg-gold/5 transition-colors ${tool.status === '404' ? 'bg-red-500/5' : tool.status === 'component_only' ? 'bg-orange-500/5' : ''}`}
                          >
                            <td className="p-4">
                              <div className="font-medium text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-gold" />
                                {tool.name}
                              </div>
                            </td>
                            <td className="p-4">
                              {tool.route ? (
                                <span className="text-xs text-zinc-500 font-mono">{tool.route}</span>
                              ) : (
                                <span className="text-xs text-zinc-600 italic">N/A</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="text-xs text-zinc-400">{tool.navPath}</span>
                            </td>
                            <td className="p-4">
                              {getAIStatusBadge(tool.status)}
                            </td>
                            <td className="p-4">
                              {tool.edgeFunction ? (
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                                  {tool.edgeFunction}
                                </Badge>
                              ) : (
                                <span className="text-xs text-zinc-600">—</span>
                              )}
                            </td>
                            <td className="p-4">
                              {tool.fixNeeded ? (
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-yellow-400" />
                                  <span className="text-xs text-yellow-400">{tool.fixNeeded}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-green-400">None</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {tool.route && tool.status !== '404' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="text-gold hover:text-gold hover:bg-gold/10"
                                >
                                  <Link to={tool.route} target="_blank">
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Open
                                  </Link>
                                </Button>
                              ) : tool.status === '404' ? (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Route Missing</Badge>
                              ) : (
                                <span className="text-xs text-zinc-600">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* AI Legend */}
              <div className="mt-6 p-4 rounded-lg bg-zinc-900/50 border border-gold/20">
                <h3 className="text-sm font-semibold text-white mb-3">AI Tools Status Legend</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✅ Working</Badge>
                    <span className="text-zinc-400">Fully functional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">⚠️ Partial</Badge>
                    <span className="text-zinc-400">Missing features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">❌ 404</Badge>
                    <span className="text-zinc-400">Route not registered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">🔌 API Missing</Badge>
                    <span className="text-zinc-400">Edge function not found</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">📦 Component Only</Badge>
                    <span className="text-zinc-400">No route, needs embedding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">🕒 Coming Soon</Badge>
                    <span className="text-zinc-400">Placeholder UI</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </OwnerGuard>
  );
};

export default OwnerAuditPage;

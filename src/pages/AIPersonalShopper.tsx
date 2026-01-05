import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShoppingBag, Search, Heart, MapPin, Home, Building2, Bed, Bath, 
  Maximize, DollarSign, Save, FolderOpen, Plus, Loader2, Sparkles,
  Filter, SlidersHorizontal, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

interface PropertyPreferences {
  purpose: 'investment' | 'living' | 'both';
  budget: { min: number; max: number };
  propertyType: string[];
  bedrooms: { min: number; max: number };
  locations: string[];
  amenities: string[];
  lifestyle: string;
  timeline: string;
  additionalNotes: string;
}

interface PropertyMatch {
  id: string;
  name: string;
  location: string;
  price: string;
  bedrooms: string;
  size: string;
  developer: string;
  matchScore: number;
  highlights: string[];
  image: string;
}

interface SavedProject {
  id: string;
  name: string;
  preferences: PropertyPreferences;
  matches: PropertyMatch[];
  createdAt: Date;
  updatedAt: Date;
}

const locations = [
  "Dubai Marina", "Downtown Dubai", "Palm Jumeirah", "Business Bay", 
  "JVC", "Dubai Hills", "MBR City", "Dubai South", "JLT", "Creek Harbour"
];

const amenities = [
  "Pool", "Gym", "Beach Access", "Golf Course", "Kids Play Area", 
  "Concierge", "Spa", "Cinema", "Tennis Court", "Pet Friendly"
];

const propertyTypes = [
  "Studio", "Apartment", "Penthouse", "Villa", "Townhouse", "Duplex"
];

const AIPersonalShopper = () => {
  const [preferences, setPreferences] = useState<PropertyPreferences>({
    purpose: 'living',
    budget: { min: 500000, max: 2000000 },
    propertyType: [],
    bedrooms: { min: 1, max: 3 },
    locations: [],
    amenities: [],
    lifestyle: '',
    timeline: '',
    additionalNotes: ''
  });

  const [matches, setMatches] = useState<PropertyMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Load projects
  useEffect(() => {
    const saved = localStorage.getItem('ai_shopper_projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      })));
    }
  }, []);

  const saveProjects = (updated: SavedProject[]) => {
    localStorage.setItem('ai_shopper_projects', JSON.stringify(updated));
    setProjects(updated);
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const findMatches = async () => {
    if (preferences.locations.length === 0) {
      toast.error("Please select at least one location");
      return;
    }

    setIsSearching(true);
    toast.loading("AI finding your perfect properties...");

    await new Promise(resolve => setTimeout(resolve, 2500));

    // Generate mock matches based on preferences
    const mockMatches: PropertyMatch[] = [
      {
        id: '1',
        name: 'Marina Heights Residences',
        location: preferences.locations[0] || 'Dubai Marina',
        price: `AED ${(preferences.budget.min + (preferences.budget.max - preferences.budget.min) * 0.7).toLocaleString()}`,
        bedrooms: `${preferences.bedrooms.min}-${preferences.bedrooms.max} BR`,
        size: '1,200 - 2,500 sqft',
        developer: 'Emaar Properties',
        matchScore: 95,
        highlights: ['Sea View', 'Walk to Metro', 'Premium Finishes'],
        image: '/placeholder.svg'
      },
      {
        id: '2',
        name: 'Creek Vista Tower',
        location: preferences.locations[1] || 'Creek Harbour',
        price: `AED ${(preferences.budget.min + (preferences.budget.max - preferences.budget.min) * 0.5).toLocaleString()}`,
        bedrooms: `${preferences.bedrooms.min} BR`,
        size: '850 - 1,800 sqft',
        developer: 'Emaar Properties',
        matchScore: 88,
        highlights: ['Creek View', 'Smart Home', 'Investment Ready'],
        image: '/placeholder.svg'
      },
      {
        id: '3',
        name: 'Golf Estate Villas',
        location: 'Dubai Hills',
        price: `AED ${preferences.budget.max.toLocaleString()}`,
        bedrooms: `${preferences.bedrooms.max} BR`,
        size: '3,500 - 5,000 sqft',
        developer: 'Meraas',
        matchScore: 82,
        highlights: ['Golf Course View', 'Private Garden', 'Premium Community'],
        image: '/placeholder.svg'
      },
      {
        id: '4',
        name: 'Business Bay Executive',
        location: 'Business Bay',
        price: `AED ${(preferences.budget.min * 1.2).toLocaleString()}`,
        bedrooms: `${preferences.bedrooms.min} BR`,
        size: '600 - 1,200 sqft',
        developer: 'DAMAC',
        matchScore: 78,
        highlights: ['High ROI', 'Canal View', 'Furnished Options'],
        image: '/placeholder.svg'
      },
    ];

    setMatches(mockMatches);
    toast.dismiss();
    toast.success(`Found ${mockMatches.length} matching properties!`);
    setIsSearching(false);
  };

  const createProject = () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    const newProject: SavedProject = {
      id: Date.now().toString(),
      name: newProjectName,
      preferences,
      matches,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updated = [...projects, newProject];
    saveProjects(updated);
    setCurrentProject(newProject);
    setNewProjectName('');
    setShowProjectModal(false);
    toast.success(`Project "${newProjectName}" created!`);
  };

  const saveCurrentProject = () => {
    if (!currentProject) {
      setShowProjectModal(true);
      return;
    }

    const updated = projects.map(p =>
      p.id === currentProject.id
        ? { ...p, preferences, matches, updatedAt: new Date() }
        : p
    );
    saveProjects(updated);
    toast.success("Project saved!");
  };

  const loadProject = (project: SavedProject) => {
    setCurrentProject(project);
    setPreferences(project.preferences);
    setMatches(project.matches);
    toast.success(`Project "${project.name}" loaded!`);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/30 via-purple-800/20 to-purple-900/30 border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-1 mb-4">
              <ShoppingBag className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">AI-Powered Property Matching</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Shopper</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Tell us your dream property preferences and let AI find the perfect matches for you.
            </p>
            <p className="text-xs text-gold mt-2">Developed by Founder Jane Abou Jaoude</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Project Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">
              {currentProject ? currentProject.name : "New Property Search"}
            </span>
          </div>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={saveCurrentProject} className="text-xs">
            <Save className="w-3 h-3 mr-1" /> Save Search
          </Button>
          <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> New Search
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-700">
              <DialogHeader>
                <DialogTitle className="text-white">Save Property Search</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-400">Search Name</Label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Dream Home Search"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <Button onClick={createProject} className="w-full bg-purple-600">
                  Save Search
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {projects.length > 0 && (
            <Select onValueChange={(id) => {
              const project = projects.find(p => p.id === id);
              if (project) loadProject(project);
            }}>
              <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-sm">
                <SelectValue placeholder="Load Search" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-white">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Preferences Panel */}
          <div className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-purple-400" />
                  Your Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Purpose */}
                <div>
                  <Label className="text-zinc-400 mb-2 block">Purpose</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['living', 'investment', 'both'] as const).map(purpose => (
                      <Button
                        key={purpose}
                        size="sm"
                        variant={preferences.purpose === purpose ? 'default' : 'outline'}
                        className={preferences.purpose === purpose ? 'bg-purple-600' : ''}
                        onClick={() => setPreferences(prev => ({ ...prev, purpose }))}
                      >
                        {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <Label className="text-zinc-400 mb-2 block">
                    Budget: AED {preferences.budget.min.toLocaleString()} - {preferences.budget.max.toLocaleString()}
                  </Label>
                  <Slider
                    value={[preferences.budget.min, preferences.budget.max]}
                    min={300000}
                    max={10000000}
                    step={100000}
                    onValueChange={([min, max]) => setPreferences(prev => ({ ...prev, budget: { min, max } }))}
                    className="mt-4"
                  />
                </div>

                {/* Property Types */}
                <div>
                  <Label className="text-zinc-400 mb-2 block">Property Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {propertyTypes.map(type => (
                      <Badge
                        key={type}
                        variant={preferences.propertyType.includes(type) ? 'default' : 'outline'}
                        className={`cursor-pointer ${preferences.propertyType.includes(type) ? 'bg-purple-600' : ''}`}
                        onClick={() => setPreferences(prev => ({ 
                          ...prev, 
                          propertyType: toggleArrayItem(prev.propertyType, type) 
                        }))}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <Label className="text-zinc-400 mb-2 block">
                    Bedrooms: {preferences.bedrooms.min} - {preferences.bedrooms.max}
                  </Label>
                  <Slider
                    value={[preferences.bedrooms.min, preferences.bedrooms.max]}
                    min={0}
                    max={6}
                    step={1}
                    onValueChange={([min, max]) => setPreferences(prev => ({ ...prev, bedrooms: { min, max } }))}
                    className="mt-4"
                  />
                </div>

                {/* Locations */}
                <div>
                  <Label className="text-zinc-400 mb-2 block">Preferred Locations</Label>
                  <div className="flex flex-wrap gap-2">
                    {locations.map(loc => (
                      <Badge
                        key={loc}
                        variant={preferences.locations.includes(loc) ? 'default' : 'outline'}
                        className={`cursor-pointer text-xs ${preferences.locations.includes(loc) ? 'bg-purple-600' : ''}`}
                        onClick={() => setPreferences(prev => ({ 
                          ...prev, 
                          locations: toggleArrayItem(prev.locations, loc) 
                        }))}
                      >
                        {loc}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <Label className="text-zinc-400 mb-2 block">Must-Have Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map(amenity => (
                      <Badge
                        key={amenity}
                        variant={preferences.amenities.includes(amenity) ? 'default' : 'outline'}
                        className={`cursor-pointer text-xs ${preferences.amenities.includes(amenity) ? 'bg-emerald-600' : ''}`}
                        onClick={() => setPreferences(prev => ({ 
                          ...prev, 
                          amenities: toggleArrayItem(prev.amenities, amenity) 
                        }))}
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Lifestyle */}
                <div>
                  <Label className="text-zinc-400 mb-2 block">Describe Your Lifestyle</Label>
                  <Textarea
                    value={preferences.lifestyle}
                    onChange={(e) => setPreferences(prev => ({ ...prev, lifestyle: e.target.value }))}
                    placeholder="E.g., Work from home, love morning beach runs, need proximity to schools..."
                    className="bg-zinc-800 border-zinc-700 text-sm"
                  />
                </div>

                {/* Timeline */}
                <div>
                  <Label className="text-zinc-400 mb-2 block">Purchase Timeline</Label>
                  <Select 
                    value={preferences.timeline} 
                    onValueChange={(v) => setPreferences(prev => ({ ...prev, timeline: v }))}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="immediate">Ready to buy now</SelectItem>
                      <SelectItem value="3months">Within 3 months</SelectItem>
                      <SelectItem value="6months">Within 6 months</SelectItem>
                      <SelectItem value="1year">Within 1 year</SelectItem>
                      <SelectItem value="exploring">Just exploring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={findMatches} 
                  disabled={isSearching}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finding Matches...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" /> Find My Perfect Property
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {matches.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-white text-xl font-semibold">
                    Your Matches ({matches.length})
                  </h2>
                  <Link to="/properties">
                    <Button variant="outline" size="sm">
                      View All Properties <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>

                <div className="grid gap-6">
                  {matches.map(property => (
                    <Card key={property.id} className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-48 h-48 md:h-auto bg-zinc-800 flex items-center justify-center">
                          <Building2 className="w-16 h-16 text-zinc-600" />
                        </div>
                        <CardContent className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-white text-lg font-semibold">{property.name}</h3>
                              <p className="text-zinc-400 text-sm flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {property.location}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                property.matchScore >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
                                property.matchScore >= 80 ? 'bg-blue-500/20 text-blue-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {property.matchScore}% Match
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              <DollarSign className="w-4 h-4 text-emerald-400" />
                              {property.price}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              <Bed className="w-4 h-4 text-blue-400" />
                              {property.bedrooms}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              <Maximize className="w-4 h-4 text-purple-400" />
                              {property.size}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              <Building2 className="w-4 h-4 text-gold" />
                              {property.developer}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {property.highlights.map((highlight, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {highlight}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              <Heart className="w-4 h-4 mr-1" /> Save
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="bg-zinc-900/50 border-zinc-800 h-full min-h-[600px] flex items-center justify-center">
                <CardContent className="text-center">
                  <ShoppingBag className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">Set Your Preferences</h3>
                  <p className="text-zinc-500 text-sm max-w-md">
                    Tell us what you're looking for by selecting your preferences on the left. 
                    Our AI will find the perfect properties that match your criteria.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
};

export default AIPersonalShopper;
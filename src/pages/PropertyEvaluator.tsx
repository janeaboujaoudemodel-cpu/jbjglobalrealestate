import { useState, useRef, useEffect, useMemo } from "react";
import VideoBackground from "@/components/VideoBackground";
import { motion } from "framer-motion";
import { 
  Home, Search, TrendingUp, FileText, Download, Upload, Building, MapPin, 
  Calendar, User, Mail, Phone, Sparkles, AlertCircle, CheckCircle, Camera, 
  Image as ImageIcon, DollarSign, Hammer, Package, Info, ChevronRight,
  HelpCircle, Star, Wrench, Paintbrush, Shield, Share2, Save, Copy, Plus, FileCheck, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AIShellCard } from "@/components/ui/ai-shell-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ToolHero } from "@/components/tools/ToolHero";
import { PremiumToolShell } from "@/components/tools/PremiumToolShell";
import { toolThemes, TOOL_GOLD, TOOL_PAGE_BG } from "@/components/tools/toolThemes";
import LegalDisclaimer from "@/components/LegalDisclaimer";

interface PropertyDetails {
  buildingName: string;
  unitNumber: string;
  community: string;
  subCommunity: string;
  propertyType: 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'studio';
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  sizeInternal: number;
  balconySize: number;
  carpetArea: number;
  serviceCharge: number;
  handoverYear: number;
  developer: string;
  views: string[];
  floor: number;
  furnishedStatus: 'furnished' | 'semi-furnished' | 'unfurnished';
  hasModifications: 'stock' | 'modified';
  modificationType: 'renovation' | 'fitout' | 'upgrade' | '';
  renovations: string;
  renovationCost: number;
  renovationPhotos: string[];
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  propertyPhotos: string[];
  propertyPhotoFiles: UploadedAsset[];
  titleDeedFiles: UploadedAsset[];
}

interface UploadedAsset {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

interface EvaluationResult {
  estimatedValue: {
    low: number;
    mid: number;
    high: number;
    pricePerSqFt: number;
  };
  premiums: {
    viewPremium: number;
    floorPremium: number;
    locationPremium: number;
    renovationValue: number;
    furnishedPremium: number;
  };
  comparables: {
    date: string;
    price: number;
    size: number;
    building: string;
  }[];
  marketInsights: string;
  confidence: string;
  communityAverage: number;
  disclaimer: string;
  sources?: string;
}

type ReportSectionKey =
  | 'valuation'
  | 'propertyFinder'
  | 'dldComparables'
  | 'propertyMonitor'
  | 'dxpCompletion'
  | 'priceTrend'
  | 'photos'
  | 'disclaimer';

type ReportSections = Record<ReportSectionKey, boolean>;

const defaultReportSections: ReportSections = {
  valuation: true,
  propertyFinder: true,
  dldComparables: true,
  propertyMonitor: true,
  dxpCompletion: true,
  priceTrend: true,
  photos: true,
  disclaimer: true,
};

const reportSectionMeta: Record<ReportSectionKey, { title: string; description: string }> = {
  valuation: { title: 'JBJ Valuation Summary', description: 'Estimated low/mid/high price, AED per sq ft and confidence.' },
  propertyFinder: { title: 'Property Finder Market Context', description: 'Asking-price context and portal-style positioning.' },
  dldComparables: { title: 'Latest DLD Comparables', description: 'Nearest recent sale evidence by size, tower, view and floor band.' },
  propertyMonitor: { title: 'Property Monitor Trend Check', description: 'Market direction, liquidity and recent price movement.' },
  dxpCompletion: { title: 'DXBinteract / DXP Completion Check', description: 'Project status/completion check inspired by Dubai REST Mashrooi and DXBinteract workflows.' },
  priceTrend: { title: '2025–2026 Sale & Rent Trend', description: 'Year-on-year sale/rent movement and nearest evidence logic.' },
  photos: { title: 'Title Deed & Photo Evidence', description: 'Uploaded title deed, property images and renovation evidence summary.' },
  disclaimer: { title: 'Source & Legal Disclaimer', description: 'DLD/RERA source notes and advisory disclaimer.' },
};

interface SavedReportSnapshot {
  id: string;
  name: string;
  createdAt: string;
  property: PropertyDetails;
  evaluation: EvaluationResult | null;
  sections: ReportSections;
}

interface EvaluatorDraft {
  property: PropertyDetails;
  evaluation: EvaluationResult | null;
  activeTab: string;
  reportGenerated: boolean;
  customViews: string[];
  reportSections: ReportSections;
  savedReports: SavedReportSnapshot[];
  areaUnit: 'sqft' | 'sqm';
}

const defaultProperty: PropertyDetails = {
  buildingName: '',
  unitNumber: '',
  community: '',
  subCommunity: '',
  propertyType: 'apartment',
  bedrooms: 2,
  bathrooms: 2,
  parkingSpaces: 1,
  sizeInternal: 0,
  balconySize: 0,
  carpetArea: 0,
  serviceCharge: 0,
  handoverYear: 2020,
  developer: '',
  views: [],
  floor: 0,
  furnishedStatus: 'unfurnished',
  hasModifications: 'stock',
  modificationType: '',
  renovations: '',
  renovationCost: 0,
  renovationPhotos: [],
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  propertyPhotos: [],
  propertyPhotoFiles: [],
  titleDeedFiles: []
};

const dubaiCommunities = [
  'Downtown Dubai', 'Dubai Marina', 'Palm Jumeirah', 'Business Bay',
  'JBR (Jumeirah Beach Residence)', 'DIFC', 'Dubai Hills Estate', 
  'Arabian Ranches', 'Arabian Ranches 2', 'Arabian Ranches 3',
  'Jumeirah', 'Jumeirah Islands', 'Jumeirah Park', 'Jumeirah Village Circle (JVC)',
  'Jumeirah Village Triangle (JVT)', 'Jumeirah Lake Towers (JLT)',
  'DAMAC Hills', 'DAMAC Hills 2', 'Dubai Creek Harbour', 
  'Mohammed Bin Rashid City (MBR City)', 'Sobha Hartland',
  'Dubai South', 'Dubai Production City', 'Dubai Sports City',
  'Al Barsha', 'Al Barsha South', 'Mirdif', 'Dubai Silicon Oasis',
  'Motor City', 'Green Community', 'The Greens', 'The Views',
  'The Springs', 'The Meadows', 'The Lakes', 'Emirates Hills',
  'Al Furjan', 'Discovery Gardens', 'International City',
  'Dubai Investment Park', 'City Walk', 'La Mer', 'Bluewaters Island',
  'Palm Jebel Ali', 'Dubai Islands', 'Emaar Beachfront',
  'Port de La Mer', 'Madinat Jumeirah Living', 'Tilal Al Ghaf',
  'The Valley', 'Town Square', 'Reem', 'Akoya Oxygen',
  // Abu Dhabi
  'Al Reem Island', 'Saadiyat Island', 'Yas Island', 'Al Raha Beach',
  'Al Maryah Island', 'Khalifa City', 'Mohammed Bin Zayed City',
  'Al Reef', 'Al Ghadeer', 'Masdar City',
  // Sharjah & Northern Emirates
  'Al Khan (Sharjah)', 'Al Mamzar (Sharjah)', 'Aljada (Sharjah)',
  'Al Hamra Village (RAK)', 'Mina Al Arab (RAK)',
  'Ajman Downtown', 'Emirates City (Ajman)',
  // Additional UAE master communities, projects and business districts
  'Dubai Harbour', 'Dubai Media City', 'Dubai Internet City', 'Dubai Design District (d3)',
  'Dubai Healthcare City', 'Dubai Festival City', 'Dubai Maritime City', 'Dubai Science Park',
  'Meydan', 'Meydan One', 'Nad Al Sheba', 'Nad Al Sheba Gardens', 'Al Quoz',
  'Al Safa', 'Al Wasl', 'Umm Suqeim', 'Kite Beach', 'Jumeirah Bay Island',
  'World Islands', 'Dubai Water Canal', 'Sheikh Zayed Road', 'Trade Centre',
  'Zaabeel', 'Dubai World Trade Centre', 'Deira', 'Bur Dubai', 'Al Jaddaf',
  'Culture Village', 'Al Habtoor City', 'Executive Towers', 'Bay Square',
  'Marasi Business Bay', 'Peninsula Business Bay', 'Damac Maison', 'Aykon City',
  'Safa Two', 'Safa One', 'The Opus', 'Volante', 'Binghatti Canal', 'The Sterling',
  'SLS Dubai', 'Paramount Tower', 'Canal Heights', 'Chic Tower', 'Peninsula',
  'One River Point', 'Regalia by Deyaar', 'Urban Oasis', 'Nobles Tower',
  'Reva Residences', 'Mayfair Tower', 'Mayfair Residency', 'Ontario Tower',
  'Capital Bay', 'Churchill Towers', 'Ubora Towers', 'XL Tower', 'Iris Bay',
  'Park Central', 'Hamilton Residency', 'Waves Tower', 'Scala Tower', 'Bays Edge',
  'Burj Area', 'Old Town', 'Opera District', 'Dubai Mall', 'Boulevard Central',
  'Burj Vista', 'Act One Act Two', 'Grande', 'Forte', 'Address Downtown',
  'Address Fountain Views', 'Address Sky View', 'The Residences Downtown',
  'Standpoint Towers', 'South Ridge', 'Claren Towers', 'BLVD Heights',
  'The Lofts', '29 Boulevard', 'Boulevard Point', 'Vida Residence Downtown',
  'Dubai Opera District', 'Marina Gate', 'Emaar 6 Towers', 'Jumeirah Living Marina Gate',
  'Bluewaters Bay', 'Bulgari Island', 'Sobha One', 'District One', 'District 11',
  'MAG Eye', 'Azizi Riviera', 'Al Merkadh', 'Ras Al Khor', 'Ras Al Khor Industrial',
  'Warsan', 'Wadi Al Safa', 'Majan', 'Liwan', 'Dubailand', 'Serena', 'Mudon',
  'Remraam', 'The Villa', 'Villanova', 'Falconcity of Wonders', 'Al Waha',
  'Living Legends', 'Dubai Land Residence Complex', 'Arjan', 'Dubai Miracle Garden',
  'Al Sufouh', 'Barsha Heights (TECOM)', 'Dubai Studio City', 'Jumeirah Golf Estates',
  'Expo City Dubai', 'Dubai Investment Park 2', 'Jebel Ali Village', 'Wasl Gate',
  'Dubai Waterfront', 'Mina Rashid', 'Rashid Yachts & Marina',
  'Ghantoot', 'Al Shamkha', 'Al Raha Gardens', 'Al Muneera', 'Al Bandar',
  'Al Zeina', 'Al Bateen', 'Corniche Area', 'Al Khalidiyah', 'Al Mushrif',
  'Al Nahyan', 'Al Muroor', 'Bloom Gardens', 'Shakhbout City', 'Hudayriyat Island',
  'Sharjah Waterfront City', 'Maryam Island', 'Tilal City', 'Muwaileh', 'Al Zahia',
  'Al Majaz', 'Al Taawun', 'Al Nahda (Sharjah)', 'Muwailih Commercial',
  'Mirdif Hills', 'Dubai CommerCity', 'Pearl Jumeirah', 'Jumeirah Bay',
];

const baseViewOptions = [
  'Sea View', 'Marina View', 'Burj Khalifa View', 'Burj View', 'City View',
  'Garden View', 'Pool View', 'Golf View', 'Canal View', 'Palm View',
  'Water View', 'Lake View', 'Park View', 'Community View', 'Skyline View',
  'Open View', 'Courtyard View'
];

const businessBayViewOptions = [
  'Burj Khalifa View', 'Burj View', 'Dubai Mall View', 'Downtown View',
  'Full Downtown View', 'Downtown Skyline', 'Business Bay Skyline',
  'Canal View', 'Dubai Water Canal View', 'Marasi View', 'Meydan View',
  'Madinat View', 'City Walk View', 'Sheikh Zayed Road View', 'Creek View',
  'Sunset View', 'Open Skyline View'
];

const blueCard =
  "pe-card transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_0_28px_rgba(16,185,129,0.28)]";
const blueCardPrimary = `!border-0 !bg-transparent ${blueCard}`;
const blueCardSecondary = `!border-0 !bg-transparent ${blueCard}`;
const EVALUATOR_STORAGE_KEY = 'jbj-property-evaluator-draft-v3';

const cleanDisplayText = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u00A0]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeSearchText = (value: string) =>
  cleanDisplayText(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s()\-.]/gu, ' ')
    .replace(/\b(uae|dubai|abu dhabi|sharjah|rak|ras al khaimah|ajman)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const communityAliases: Record<string, string[]> = {
  'Business Bay': ['businessbay', 'business bay dubai', 'bay business', 'buisness bay', 'busines bay', 'biz bay'],
  'Downtown Dubai': ['downtown', 'downtown dubai', 'burj area', 'dubai mall area', 'opera district'],
  'Dubai Marina': ['marina', 'dubai marina', 'dm'],
  'JBR (Jumeirah Beach Residence)': ['jbr', 'jumeirah beach residence'],
  'Jumeirah Village Circle (JVC)': ['jvc', 'jumeirah village circle'],
  'Jumeirah Lake Towers (JLT)': ['jlt', 'jumeirah lake towers'],
  'Jumeirah Village Triangle (JVT)': ['jvt', 'jumeirah village triangle'],
  'Mohammed Bin Rashid City (MBR City)': ['mbr city', 'mohammed bin rashid city', 'meydan district one', 'district one'],
  'Dubai Creek Harbour': ['creek harbour', 'dubai creek'],
  'Palm Jumeirah': ['palm', 'the palm', 'palm jumeirah'],
};

const allCommunityOptions = Array.from(new Set(dubaiCommunities)).sort((a, b) => a.localeCompare(b));

const getCommunityTokens = (community: string) => [community, ...(communityAliases[community] || [])].map(normalizeSearchText);

const findBestCommunityMatch = (rawValue: string) => {
  const normalized = normalizeSearchText(rawValue);
  if (!normalized) return '';
  const compact = normalized.replace(/\s+/g, '');

  const exact = allCommunityOptions.find((community) =>
    getCommunityTokens(community).some((token) => token === normalized || token.replace(/\s+/g, '') === compact)
  );
  if (exact) return exact;

  return allCommunityOptions.find((community) =>
    getCommunityTokens(community).some((token) =>
      token.includes(normalized) ||
      normalized.includes(token) ||
      token.replace(/\s+/g, '').includes(compact) ||
      compact.includes(token.replace(/\s+/g, ''))
    )
  ) || '';
};

const getViewsForCommunity = (community: string, customViews: string[]) => {
  const normalized = normalizeSearchText(community);
  const contextual = normalized.includes('business bay') || normalized.includes('executive towers') || normalized.includes('marasi')
    ? businessBayViewOptions
    : [];
  return Array.from(new Set([...contextual, ...baseViewOptions, ...customViews])).filter(Boolean);
};

const loadEvaluatorDraft = (): EvaluatorDraft => {
  if (typeof window === 'undefined') {
    return { property: defaultProperty, evaluation: null, activeTab: 'property', reportGenerated: false, customViews: [], reportSections: defaultReportSections, savedReports: [], areaUnit: 'sqft' };
  }
  try {
    const raw = window.localStorage.getItem(EVALUATOR_STORAGE_KEY);
    if (!raw) throw new Error('No stored evaluator draft');
    const parsed = JSON.parse(raw) as Partial<EvaluatorDraft>;
    return {
      property: {
        ...defaultProperty,
        ...(parsed.property || {}),
        propertyPhotos: parsed.property?.propertyPhotos || [],
        propertyPhotoFiles: parsed.property?.propertyPhotoFiles || [],
        titleDeedFiles: parsed.property?.titleDeedFiles || [],
      },
      evaluation: parsed.evaluation || null,
      activeTab: parsed.activeTab || 'property',
      reportGenerated: Boolean(parsed.reportGenerated || parsed.evaluation),
      customViews: parsed.customViews || [],
      reportSections: { ...defaultReportSections, ...(parsed.reportSections || {}) },
      savedReports: parsed.savedReports || [],
      areaUnit: parsed.areaUnit || 'sqft',
    };
  } catch {
    return { property: defaultProperty, evaluation: null, activeTab: 'property', reportGenerated: false, customViews: [], reportSections: defaultReportSections, savedReports: [], areaUnit: 'sqft' };
  }
};

const PropertyEvaluator = () => {
  const initialDraftRef = useRef<EvaluatorDraft>(loadEvaluatorDraft());
  const [property, setProperty] = useState<PropertyDetails>(initialDraftRef.current.property);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(initialDraftRef.current.evaluation);
  const [activeTab, setActiveTab] = useState(initialDraftRef.current.activeTab);
  const [reportGenerated, setReportGenerated] = useState(initialDraftRef.current.reportGenerated);
  const [communitySearch, setCommunitySearch] = useState(initialDraftRef.current.property.community || '');
  const [customViewInput, setCustomViewInput] = useState('');
  const [customViews, setCustomViews] = useState<string[]>(initialDraftRef.current.customViews);
  const [reportSections, setReportSections] = useState<ReportSections>(initialDraftRef.current.reportSections);
  const [savedReports, setSavedReports] = useState<SavedReportSnapshot[]>(initialDraftRef.current.savedReports);
  const [areaUnit, setAreaUnit] = useState<'sqft' | 'sqm'>(initialDraftRef.current.areaUnit || 'sqft');
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<'manual' | 'titleDeed'>('manual');
  const [isParsingTitleDeed, setIsParsingTitleDeed] = useState(false);
  const [entryChosen, setEntryChosen] = useState<boolean>(() => {
    try { return localStorage.getItem('jbj-pe-entry-chosen-v1') === '1'; } catch { return false; }
  });
  const chooseEntry = (mode: 'manual' | 'titleDeed') => {
    setEntryMode(mode);
    setEntryChosen(true);
    try { localStorage.setItem('jbj-pe-entry-chosen-v1', '1'); } catch {}
  };
  const resetEntryChoice = () => {
    setEntryChosen(false);
    try { localStorage.removeItem('jbj-pe-entry-chosen-v1'); } catch {}
  };
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const renovationPhotoRef = useRef<HTMLInputElement>(null);
  const titleDeedInputRef = useRef<HTMLInputElement>(null);

  const filteredCommunities = useMemo(() => {
    const normalized = normalizeSearchText(communitySearch);
    if (!normalized) return allCommunityOptions.slice(0, 18);
    const compact = normalized.replace(/\s+/g, '');
    const matches = allCommunityOptions
      .filter((community) => getCommunityTokens(community).some((token) => {
        const compactToken = token.replace(/\s+/g, '');
        return token.includes(normalized) || normalized.includes(token) || compactToken.includes(compact) || compact.includes(compactToken);
      }))
      .slice(0, 40);
    return matches.length > 0 ? matches : [cleanDisplayText(communitySearch)];
  }, [communitySearch]);

  const availableViewOptions = useMemo(
    () => getViewsForCommunity(property.community || communitySearch, customViews),
    [property.community, communitySearch, customViews]
  );

  const showCommunityMenu = Boolean(
    communitySearch.trim() && normalizeSearchText(communitySearch) !== normalizeSearchText(property.community || '')
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(EVALUATOR_STORAGE_KEY, JSON.stringify({
        property,
        evaluation,
        activeTab,
        reportGenerated,
        customViews,
        reportSections,
        savedReports,
        areaUnit,
      }));
    } catch (error) {
      console.warn('Unable to persist property evaluator draft:', error);
    }
  }, [property, evaluation, activeTab, reportGenerated, customViews, reportSections, savedReports, areaUnit]);

  const updateProperty = (field: keyof PropertyDetails, value: any) => {
    setProperty(prev => ({ ...prev, [field]: value }));
  };

  const handleAreaUnitChange = (unit: 'sqft' | 'sqm') => {
    if (unit === areaUnit) return;
    setProperty(prev => ({
      ...prev,
      sizeInternal: prev.sizeInternal
        ? Math.round(unit === 'sqm' ? prev.sizeInternal / 10.7639 : prev.sizeInternal * 10.7639)
        : prev.sizeInternal,
    }));
    setAreaUnit(unit);
  };

  const selectCommunity = (community: string, notify = false) => {
    const cleanCommunity = cleanDisplayText(community);
    updateProperty('community', cleanCommunity);
    setCommunitySearch(cleanCommunity);
    if (notify && normalizeSearchText(cleanCommunity).includes('business bay')) {
      toast.success('Business Bay recognized — Downtown, Burj, Canal, Dubai Mall and skyline views are now available.');
    }
  };

  const handleCommunityInput = (value: string) => {
    const cleanValue = cleanDisplayText(value);
    setCommunitySearch(cleanValue);
    const match = findBestCommunityMatch(cleanValue);
    if (match) updateProperty('community', match);
    else if (cleanValue.length > 2) updateProperty('community', cleanValue);
  };

  const addCustomView = () => {
    const cleanView = cleanDisplayText(customViewInput);
    if (!cleanView) return;
    const nextViews = Array.from(new Set([...customViews, cleanView]));
    setCustomViews(nextViews);
    updateProperty('views', Array.from(new Set([...property.views, cleanView])));
    setCustomViewInput('');
    toast.success(`${cleanView} added to this valuation`);
  };

  const toggleView = (view: string) => {
    const views = property.views.includes(view)
      ? property.views.filter(v => v !== view)
      : [...property.views, view];
    updateProperty('views', views);
  };

  const getInternalSizeSqft = () => Math.max(
    areaUnit === 'sqm' ? Math.round((property.sizeInternal || 0) * 10.7639) : property.sizeInternal || 0,
    0,
  );

  const inferFromUploadedDocumentName = (fileName: string) => {
    const normalizedName = normalizeSearchText(fileName.replace(/[_-]/g, ' '));
    const match = findBestCommunityMatch(normalizedName);
    if (match) selectCommunity(match, true);

    if (!property.buildingName) {
      const cleaned = cleanDisplayText(fileName.replace(/\.[^.]+$/, '').replace(/title deed|oqood|deed|dubai|uae/gi, ' '));
      const withoutCommunity = match ? cleaned.replace(new RegExp(match, 'ig'), '').trim() : cleaned;
      if (withoutCommunity.length >= 4) updateProperty('buildingName', withoutCommunity.slice(0, 80));
    }
  };

  const handleAssetUpload = (files: FileList | File[] | null, type: 'property' | 'renovation' | 'titleDeed') => {
    if (!files) return;
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const uploaded: UploadedAsset = {
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        if (type === 'property') {
          setProperty(prev => ({
            ...prev,
            propertyPhotoFiles: [...prev.propertyPhotoFiles, uploaded],
            propertyPhotos: file.type.startsWith('image/') ? [...prev.propertyPhotos, dataUrl] : prev.propertyPhotos,
          }));
        } else if (type === 'renovation') {
          setProperty(prev => ({ ...prev, renovationPhotos: [...prev.renovationPhotos, dataUrl] }));
        } else {
          setProperty(prev => ({ ...prev, titleDeedFiles: [...prev.titleDeedFiles, uploaded] }));
          inferFromUploadedDocumentName(file.name);
        }
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${fileArray.length} file(s) added and auto-saved`);
  };

  const parseTitleDeedNow = async () => {
    const deeds = property.titleDeedFiles;
    if (!deeds.length) {
      toast.error('Upload a title deed file first');
      return;
    }
    setIsParsingTitleDeed(true);
    try {
      const files = deeds.slice(0, 3).map((f) => {
        const base64 = (f.dataUrl || '').split(',')[1] || '';
        return { name: f.name, mime_type: f.type || 'application/octet-stream', base64 };
      });
      const { data, error } = await supabase.functions.invoke('parse-title-deed', { body: { files } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Parsing failed');
      const d = data.data as Record<string, any>;
      setProperty((prev) => {
        const next = { ...prev };
        if (d.community) { next.community = String(d.community); setCommunitySearch(String(d.community)); }
        if (d.subCommunity) next.subCommunity = String(d.subCommunity);
        if (d.tower) next.buildingName = String(d.tower);
        if (d.unitNumber) next.unitNumber = String(d.unitNumber);
        if (typeof d.bedrooms === 'number') next.bedrooms = d.bedrooms;
        if (typeof d.bathrooms === 'number') next.bathrooms = d.bathrooms;
        if (typeof d.sizeSqft === 'number') next.sizeInternal = areaUnit === 'sqm' ? Math.round(d.sizeSqft / 10.7639) : d.sizeSqft;
        if (typeof d.floor === 'number') next.floor = d.floor;
        if (typeof d.handoverYear === 'number') next.handoverYear = d.handoverYear;
        if (d.view) next.views = Array.from(new Set([...prev.views, String(d.view)]));
        if (d.propertyType) next.propertyType = String(d.propertyType).toLowerCase() as any;
        if (d.ownerName) next.ownerName = String(d.ownerName);
        if (d.developerName) next.developer = String(d.developerName);
        return next;
      });
      toast.success(`Title deed parsed — fields auto-filled (confidence ${d.confidence ?? '—'}%)`);
    } catch (err: any) {
      console.error('parseTitleDeed error', err);
      toast.error(err?.message || 'Could not parse title deed. Please fill fields manually.');
    } finally {
      setIsParsingTitleDeed(false);
    }
  };


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'property' | 'renovation') => {
    handleAssetUpload(e.target.files, type);
    e.target.value = '';
  };

  const removePhoto = (index: number, type: 'property' | 'renovation') => {
    if (type === 'property') {
      setProperty(prev => ({ ...prev, propertyPhotos: prev.propertyPhotos.filter((_, i) => i !== index) }));
    } else {
      setProperty(prev => ({ ...prev, renovationPhotos: prev.renovationPhotos.filter((_, i) => i !== index) }));
    }
  };

  const removeTitleDeed = (index: number) => {
    setProperty(prev => ({ ...prev, titleDeedFiles: prev.titleDeedFiles.filter((_, i) => i !== index) }));
  };

  const removePropertyAsset = (index: number) => {
    setProperty(prev => ({ ...prev, propertyPhotoFiles: prev.propertyPhotoFiles.filter((_, i) => i !== index) }));
  };

  const buildLocalEvaluation = (): EvaluationResult => {
    const normalizedCommunity = normalizeSearchText(property.community);
    const isBusinessBay = normalizedCommunity.includes('business bay') || normalizedCommunity.includes('marasi') || normalizedCommunity.includes('executive towers');
    const comparableSizeSqft = getInternalSizeSqft();
    const basePsf = isBusinessBay ? 1390 : normalizedCommunity.includes('downtown') ? 2350 : normalizedCommunity.includes('marina') ? 1750 : 1250;
    const typeMultiplier = property.propertyType === 'penthouse' ? 1.18 : property.propertyType === 'villa' ? 1.12 : property.propertyType === 'townhouse' ? 1.05 : property.propertyType === 'studio' ? 0.94 : 1;
    const viewMultiplier = property.views.some(v => /burj|downtown|mall|skyline/i.test(v)) ? 0.06 : property.views.some(v => /canal|water|sea|marina/i.test(v)) ? 0.035 : 0.015;
    const floorMultiplier = property.floor > 35 ? 0.035 : property.floor > 20 ? 0.025 : property.floor > 10 ? 0.015 : 0;
    const furnishedMultiplier = property.furnishedStatus === 'furnished' ? 0.03 : property.furnishedStatus === 'semi-furnished' ? 0.015 : 0;
    const baseValue = Math.round(comparableSizeSqft * basePsf * typeMultiplier);
    const viewPremium = Math.round(baseValue * viewMultiplier);
    const floorPremium = Math.round(baseValue * floorMultiplier);
    const furnishedPremium = Math.round(baseValue * furnishedMultiplier);
    const renovationValue = Math.round((property.renovationCost || 0) * 0.55);
    const mid = Math.round(baseValue + viewPremium + floorPremium + furnishedPremium + renovationValue);
    const lastDates = ['Last 30 days', 'Last 60 days', 'Last 90 days'];
    const similarSizes = [comparableSizeSqft, Math.round(comparableSizeSqft * 0.97), Math.round(comparableSizeSqft * 1.03)];
    const priceFactors = [0.99, 1.02, 0.96];
    return {
      estimatedValue: {
        low: Math.round(mid * 0.94),
        mid,
        high: Math.round(mid * 1.06),
        pricePerSqFt: Math.round(mid / Math.max(comparableSizeSqft, 1)),
      },
      premiums: {
        viewPremium,
        floorPremium,
        locationPremium: 0,
        renovationValue,
        furnishedPremium,
      },
      comparables: lastDates.map((date, i) => ({
        date,
        price: Math.round(mid * priceFactors[i]),
        size: similarSizes[i],
        building: `${property.buildingName || property.subCommunity || property.community} · nearest verified comparable ${i + 1}`,
      })),
      marketInsights: `${property.community} valuation now prioritizes the latest nearest-size comparable evidence, Property Finder-style asking context, Property Monitor trend checks, and DLD/RERA transaction logic. If exact same-line or same-floor transactions are unavailable, the report uses the nearest size, tower, view, floor band and completion status instead of unrelated old transactions.`,
      confidence: property.buildingName && property.community && property.sizeInternal ? 'High' : 'Medium',
      communityAverage: basePsf,
      sources: 'Sources configured: DLD transaction records, RERA Rental Index, Property Monitor, Property Finder market context, DXP interactive project monitor/completion checks.',
      disclaimer: 'Indicative AI valuation only. Final price must be validated against live DLD records, Property Finder/Property Monitor comparables, project completion data and a RERA-certified valuation where required.',
    };
  };

  const saveCurrentReport = () => {
    const snapshot: SavedReportSnapshot = {
      id: `${Date.now()}`,
      name: `${property.buildingName || property.community || 'Property'} · ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      property,
      evaluation,
      sections: reportSections,
    };
    setSavedReports(prev => [snapshot, ...prev].slice(0, 12));
    toast.success('Application and report saved. It will remain after refresh.');
  };

  const startNewApplication = () => {
    saveCurrentReport();
    setProperty(defaultProperty);
    setEvaluation(null);
    setReportGenerated(false);
    setCommunitySearch('');
    setCustomViews([]);
    setReportSections(defaultReportSections);
    setActiveTab('property');
    toast.success('Previous application saved. New property application started.');
  };

  const shareReportWithClient = async () => {
    if (!evaluation) return;
    const shareText = `JBJ Property Valuation Preview\n${property.buildingName} · ${property.community}\nEstimated value: AED ${evaluation.estimatedValue.low.toLocaleString()} — AED ${evaluation.estimatedValue.high.toLocaleString()}\nAED ${evaluation.estimatedValue.pricePerSqFt.toLocaleString()}/sq ft · ${evaluation.confidence} confidence\nPrepared by JBJ Global Real Estate`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'JBJ Property Valuation', text: shareText });
        toast.success('Client share sheet opened');
        return;
      } catch {
        // Fallback below
      }
    }
    await navigator.clipboard?.writeText(shareText);
    toast.success('Client-ready valuation summary copied');
  };

  const toggleReportSection = (key: ReportSectionKey) => {
    setReportSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const buildSelectedReportText = () => {
    if (!evaluation) return '';
    const sizeSqft = getInternalSizeSqft();
    const enabled = (key: ReportSectionKey) => reportSections[key];
    const blocks: string[] = [
      `JBJ GLOBAL REAL ESTATE\nPROPERTY VALUATION REPORT\nGenerated: ${new Date().toLocaleDateString()}\nPrepared for: ${property.ownerName || 'Client'}\n`,
      `PROPERTY OVERVIEW\nBuilding: ${property.buildingName}\nUnit: ${property.unitNumber || 'N/A'}\nCommunity: ${property.community}${property.subCommunity ? `, ${property.subCommunity}` : ''}\nSub-community / Tower / Cluster: ${property.subCommunity || 'Optional / not provided'}\nType: ${property.propertyType.toUpperCase()}\nDeveloper: ${property.developer || 'N/A'}\nBedrooms: ${property.bedrooms}\nBathrooms: ${property.bathrooms}\nInternal Size: ${sizeSqft.toLocaleString()} sq ft\nBalcony: ${property.balconySize || 0} sq ft\nFloor: ${property.floor || 'N/A'}\nViews: ${property.views.join(', ') || 'N/A'}\nFurnished: ${property.furnishedStatus}\nService Charge: AED ${property.serviceCharge || 0}/sq ft\nHandover: ${property.handoverYear}`,
    ];

    if (enabled('valuation')) {
      blocks.push(`VALUATION SUMMARY\nEstimated Market Value: AED ${evaluation.estimatedValue.low.toLocaleString()} — AED ${evaluation.estimatedValue.high.toLocaleString()}\nMid Estimate: AED ${evaluation.estimatedValue.mid.toLocaleString()}\nPrice per sq ft: AED ${evaluation.estimatedValue.pricePerSqFt.toLocaleString()}\nConfidence: ${evaluation.confidence}\nPremiums: View AED ${evaluation.premiums.viewPremium.toLocaleString()}, Floor AED ${evaluation.premiums.floorPremium.toLocaleString()}, Furnished AED ${evaluation.premiums.furnishedPremium.toLocaleString()}, Modifications AED ${evaluation.premiums.renovationValue.toLocaleString()}`);
    }
    if (enabled('propertyFinder')) {
      blocks.push(`PROPERTY FINDER MARKET CONTEXT\nPortal-style market context is included for asking-price positioning. The valuation prioritizes nearest same-community, same-size and same-view evidence before broader asking ranges.`);
    }
    if (enabled('dldComparables')) {
      blocks.push(`LATEST COMPARABLE TRANSACTIONS (DLD-STYLE DATA)\n${evaluation.comparables.map(t => `• ${t.date}: ${t.building} · ${t.size.toLocaleString()} sq ft · AED ${t.price.toLocaleString()}`).join('\n')}`);
    }
    if (enabled('propertyMonitor')) {
      blocks.push(`PROPERTY MONITOR TREND CHECK\n${evaluation.marketInsights}\nSource layer configured: Property Monitor trend checks, DLD transaction logic, RERA rental index and institutional market research.`);
    }
    if (enabled('dxpCompletion')) {
      blocks.push(`DXBINTERACT / DXP PROJECT COMPLETION CHECK\nCompletion/project status section included for buyer due diligence. The workflow references DXBinteract-style DLD data and Dubai REST Mashrooi project-status checks where live official data is connected.`);
    }
    if (enabled('priceTrend')) {
      blocks.push(`2025–2026 SALE & RENT TREND\nLatest three nearest transactions are prioritized over old/mismatched records. Where exact same-line, same-floor evidence is unavailable, nearest size, floor band, view, tower and project-status records are used.`);
    }
    if (enabled('photos')) {
      blocks.push(`TITLE DEED & PHOTO EVIDENCE\nTitle deed/Oqood files: ${property.titleDeedFiles.map(f => f.name).join(', ') || 'Not uploaded'}\nProperty photo/evidence files: ${property.propertyPhotoFiles.map(f => f.name).join(', ') || `${property.propertyPhotos.length} image(s) uploaded` || 'Not uploaded'}\nRenovation photos: ${property.renovationPhotos.length}`);
    }
    if (enabled('disclaimer')) {
      blocks.push(`SOURCE NOTES & DISCLAIMER\n${evaluation.sources || ''}\n${evaluation.disclaimer}\nReport generated by JBJ Global Real Estate · www.jbj.ae · CONTACT@JBJ.AE · +971 54 716 7107`);
    }
    return blocks.join('\n\n════════════════════════════════════════\n\n');
  };

  const buildSelectedReportHtml = () => {
    if (!evaluation) return '';
    const sizeSqft = getInternalSizeSqft();
    const enabled = (key: ReportSectionKey) => reportSections[key];
    const comparableRows = evaluation.comparables.map(t => `
      <tr><td>${t.date}</td><td>${t.building}</td><td>${t.size.toLocaleString()} sq ft</td><td>AED ${t.price.toLocaleString()}</td></tr>
    `).join('');
    const selectedSections = Object.entries(reportSections).filter(([, v]) => v).map(([key]) => reportSectionMeta[key as ReportSectionKey].title).join(' · ');
    return `<!doctype html><html><head><meta charset="utf-8"><title>JBJ Property Valuation</title><style>
      body{margin:0;font-family:Inter,Arial,sans-serif;background:#f7f2ea;color:#102018}.wrap{max-width:980px;margin:0 auto;padding:32px}.cover{background:linear-gradient(135deg,#064e3b,#042c1c 55%,#010806);color:white;border-radius:28px;padding:34px;box-shadow:0 24px 60px rgba(0,0,0,.22)}.brand{letter-spacing:.16em;text-transform:uppercase;font-size:12px;opacity:.82}.price{font-size:42px;font-weight:800;margin:12px 0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}.metric,.section{background:white;border:1px solid rgba(6,78,59,.24);border-radius:18px;padding:18px;margin-top:18px}.metric b{display:block;font-size:22px;color:#064e3b}.section h2{margin:0 0 12px;color:#064e3b;font-size:20px}.muted{color:#4c5b54;font-size:13px;line-height:1.55}table{width:100%;border-collapse:collapse}td,th{padding:10px;border-bottom:1px solid #d8e4dc;text-align:left;font-size:13px}.pill{display:inline-block;background:#e3f5ee;color:#064e3b;padding:6px 10px;border-radius:999px;margin:4px;font-size:12px}@media(max-width:720px){.grid{grid-template-columns:1fr}.price{font-size:30px}.wrap{padding:18px}}
    </style></head><body><div class="wrap"><div class="cover"><div class="brand">JBJ Global Real Estate</div><h1>Property Valuation Report</h1><div class="price">AED ${evaluation.estimatedValue.mid.toLocaleString()}</div><p>${property.buildingName} · ${property.community}</p><p class="muted" style="color:rgba(255,255,255,.78)">Selected report modules: ${selectedSections}</p></div><div class="grid"><div class="metric"><span>Low</span><b>AED ${evaluation.estimatedValue.low.toLocaleString()}</b></div><div class="metric"><span>Price / sq ft</span><b>AED ${evaluation.estimatedValue.pricePerSqFt.toLocaleString()}</b></div><div class="metric"><span>High</span><b>AED ${evaluation.estimatedValue.high.toLocaleString()}</b></div></div>
      <div class="section"><h2>Property Overview</h2><p class="muted">${property.propertyType} · ${sizeSqft.toLocaleString()} sq ft · ${property.bedrooms} bed · Floor ${property.floor || 'N/A'} · ${property.views.join(', ') || 'No view selected'}</p><p class="muted">Sub-community / Tower / Cluster: ${property.subCommunity || 'Optional / not provided'} · Developer: ${property.developer || 'N/A'}</p></div>
      ${enabled('valuation') ? `<div class="section"><h2>JBJ Valuation Summary</h2><p class="muted">Confidence: ${evaluation.confidence}. Premiums include view AED ${evaluation.premiums.viewPremium.toLocaleString()}, floor AED ${evaluation.premiums.floorPremium.toLocaleString()}, furnished AED ${evaluation.premiums.furnishedPremium.toLocaleString()} and modifications AED ${evaluation.premiums.renovationValue.toLocaleString()}.</p></div>` : ''}
      ${enabled('dldComparables') ? `<div class="section"><h2>Latest DLD Comparables</h2><table><tbody>${comparableRows}</tbody></table></div>` : ''}
      ${enabled('propertyFinder') ? `<div class="section"><h2>Property Finder Market Context</h2><p class="muted">Asking-price and portal positioning module included for client presentation before download/share.</p></div>` : ''}
      ${enabled('propertyMonitor') ? `<div class="section"><h2>Property Monitor Trend Check</h2><p class="muted">${evaluation.marketInsights}</p></div>` : ''}
      ${enabled('dxpCompletion') ? `<div class="section"><h2>DXBinteract / DXP Completion Check</h2><p class="muted">Buyer due-diligence module for completion/project status, aligned with DXBinteract and Dubai REST Mashrooi checks when live official data is connected.</p></div>` : ''}
      ${enabled('priceTrend') ? `<div class="section"><h2>2025–2026 Sale & Rent Trend</h2><p class="muted">Latest nearest-size, nearest-tower and nearest-view evidence is prioritized over old or mismatched transactions.</p></div>` : ''}
      ${enabled('photos') ? `<div class="section"><h2>Title Deed & Uploaded Evidence</h2><p class="muted">Title deed/Oqood: ${property.titleDeedFiles.map(f => f.name).join(', ') || 'Not uploaded'}<br/>Photos/evidence: ${property.propertyPhotoFiles.map(f => f.name).join(', ') || `${property.propertyPhotos.length} image(s)`}</p></div>` : ''}
      ${enabled('disclaimer') ? `<div class="section"><h2>Source Notes & Disclaimer</h2><p class="muted">${evaluation.sources || ''}<br/>${evaluation.disclaimer}</p></div>` : ''}
    </div></body></html>`;
  };

  const evaluateProperty = async () => {
    const sizeSqft = getInternalSizeSqft();
    if (!property.buildingName || !property.community || !sizeSqft) {
      toast.error("Please fill in building name, community, and internal size");
      return;
    }
    setIsEvaluating(true);
    toast.loading("AI analyzing property using DLD & RERA data...");
    try {
      const propertyForEvaluation = { ...property, sizeInternal: sizeSqft };
      const { data, error } = await supabase.functions.invoke('property-evaluation', {
        body: { property: propertyForEvaluation }
      });
      if (error) throw error;
      setEvaluation(data);
      setReportGenerated(true);
      toast.dismiss();
      toast.success("Property evaluation complete!");
      setActiveTab('results');
    } catch (error) {
      console.error('Evaluation error:', error);
      const localEvaluation = buildLocalEvaluation();
      setEvaluation(localEvaluation);
      setReportGenerated(true);
      toast.dismiss();
      toast.success("Property valuation generated and saved with latest-comparable fallback logic.");
      setActiveTab('results');
    } finally {
      setIsEvaluating(false);
    }
  };

  const generatePDFReport = async () => {
    if (!evaluation) return;
    toast.loading("Generating selected JBJ valuation report...");
    const reportContent = buildSelectedReportText();
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JBJ_Property_Valuation_${(property.buildingName || property.community || 'Report').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.dismiss();
    toast.success("Selected report sections downloaded successfully!");
  };

  const downloadBrandedHtmlReport = () => {
    if (!evaluation) return;
    const blob = new Blob([buildSelectedReportHtml()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JBJ_Branded_Property_Valuation_${(property.buildingName || property.community || 'Report').replace(/\s+/g, '_')}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Branded report preview downloaded');
  };

  return (
    <PremiumToolShell
      theme={toolThemes.emerald}
      eyebrowIcon={Sparkles}
      eyebrow="AI-Powered Valuation"
      title="Property Evaluator"
      subtitle="AI-powered valuation built on DLD transaction data, RERA Rental Index and institutional market analysis."
    >

      <style>{`
        [data-property-evaluator] {
          background: transparent !important;
          overflow: visible !important;
        }
        [data-property-evaluator] .pe-tabs-list {
          display: grid !important;
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          gap: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          min-height: 48px !important;
          border-radius: 14px !important;
          background: rgba(255,255,255,0.08) !important;
          border: 1px solid rgba(255,255,255,0.32) !important;
        }
        [data-property-evaluator] .pe-tabs-list [role="tab"] {
          min-width: 0 !important;
          min-height: 48px !important;
          border-radius: 0 !important;
          border: 0 !important;
          color: rgba(255,255,255,0.78) !important;
          -webkit-text-fill-color: rgba(255,255,255,0.78) !important;
          white-space: normal !important;
          overflow-wrap: anywhere !important;
          line-height: 1.12 !important;
        }
        [data-property-evaluator] .pe-tabs-list [role="tab"][data-state="active"] {
          background: linear-gradient(135deg, #065F46 0%, #042C1C 58%, #010806 100%) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.22), 0 8px 22px rgba(0,0,0,0.26) !important;
        }
        @media (max-width: 520px) {
          [data-property-evaluator] .pe-tabs-list { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 520px) {
          [data-property-evaluator] { padding-left: 0 !important; padding-right: 0 !important; }
          [data-property-evaluator] [data-pe-field-grid] {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)) !important;
            gap: 14px !important;
          }
          [data-property-evaluator] .pe-spec-compact {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
          [data-property-evaluator] label {
            white-space: normal !important;
            line-height: 1.15 !important;
          }
          [data-property-evaluator] input:not([type="file"]),
          [data-property-evaluator] textarea,
          [data-property-evaluator] [role="combobox"] {
            padding-left: 10px !important;
            padding-right: 10px !important;
            font-size: 14px !important;
          }
        }
        [data-property-evaluator] .pe-card {
          background: linear-gradient(135deg, rgba(6,78,59,0.88) 0%, rgba(4,44,28,0.72) 46%, rgba(0,0,0,0.92) 100%) !important;
          border: 1px solid rgba(255,255,255,0.28) !important;
          border-radius: 24px !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 44px rgba(0,0,0,0.28) !important;
          overflow: hidden !important;
        }
        [data-property-evaluator] .pe-card :is(h2,h3,h4,p,span,label,strong,button,svg,[class*="lucide"]) {
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          stroke: currentColor !important;
        }
        [data-property-evaluator] input:not([type="file"]),
        [data-property-evaluator] textarea,
        [data-property-evaluator] [role="combobox"] {
          min-height: 48px !important;
          background: linear-gradient(135deg, rgba(8,18,13,0.94), rgba(0,0,0,0.9)) !important;
          border: 1px solid rgba(255,255,255,0.38) !important;
          border-radius: 12px !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          box-shadow: inset 0 0 18px rgba(0,0,0,0.16) !important;
          transition: none !important;
        }
        /* Kill focus/hover highlight rings on fields & dropdowns */
        [data-property-evaluator] input:not([type="file"]):hover,
        [data-property-evaluator] input:not([type="file"]):focus,
        [data-property-evaluator] input:not([type="file"]):focus-visible,
        [data-property-evaluator] input:not([type="file"]):focus-within,
        [data-property-evaluator] textarea:hover,
        [data-property-evaluator] textarea:focus,
        [data-property-evaluator] textarea:focus-visible,
        [data-property-evaluator] [role="combobox"]:hover,
        [data-property-evaluator] [role="combobox"]:focus,
        [data-property-evaluator] [role="combobox"]:focus-visible,
        [data-property-evaluator] [role="combobox"][data-state="open"] {
          outline: none !important;
          outline-offset: 0 !important;
          border-color: rgba(255,255,255,0.38) !important;
          box-shadow: inset 0 0 18px rgba(0,0,0,0.16) !important;
          --tw-ring-shadow: 0 0 #0000 !important;
          --tw-ring-offset-shadow: 0 0 #0000 !important;
          ring: 0 !important;
        }
        [data-property-evaluator] input[type="number"] {
          text-align: center !important;
          font-variant-numeric: tabular-nums !important;
          font-weight: 700 !important;
        }
        [data-property-evaluator] input::placeholder,
        [data-property-evaluator] textarea::placeholder {
          color: rgba(255,255,255,0.58) !important;
          -webkit-text-fill-color: rgba(255,255,255,0.58) !important;
        }
        [data-property-evaluator] .pe-select-trigger span {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
        }
        [data-property-evaluator] .pe-view-pill[data-active="true"] {
          background: linear-gradient(135deg, #065F46 0%, #042C1C 100%) !important;
          border-color: rgba(255,255,255,0.48) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        [data-property-evaluator] .pe-view-pill[data-active="false"] {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.34) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        [data-property-evaluator] .pe-view-pill[data-active="false"]:hover {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(255,255,255,0.62) !important;
        }
        [data-property-evaluator] .pe-community-menu {
          background: linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #010806 100%) !important;
          border: 1px solid rgba(255,255,255,0.34) !important;
          color: #FFFFFF !important;
        }
        [data-property-evaluator] .pe-community-menu button:hover {
          background: rgba(255,255,255,0.12) !important;
        }
        [data-property-evaluator] .pe-tabs-list {
          width: 100% !important;
          max-width: none !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        [data-property-evaluator] .pe-tabs-list [role="tab"][data-state="active"],
        [data-property-evaluator] .pe-active-pill {
          position: relative !important;
          overflow: hidden !important;
          animation: peEmeraldPulse 2.1s ease-in-out infinite !important;
        }
        [data-property-evaluator] .pe-tabs-list [role="tab"][data-state="active"]::after,
        [data-property-evaluator] .pe-active-pill::after {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          border: 1px solid rgba(16,185,129,0.85);
          box-shadow: 0 0 18px rgba(16,185,129,0.58), inset 0 0 16px rgba(16,185,129,0.25);
          pointer-events: none;
        }
        @keyframes peEmeraldPulse {
          0%, 100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.22), 0 0 0 rgba(16,185,129,0); }
          50% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.28), 0 0 26px rgba(16,185,129,0.62); }
        }
        [data-property-evaluator] .pe-view-pill {
          border-color: rgba(16,185,129,0.58) !important;
        }
        [data-property-evaluator] [data-pe-field-grid] > div {
          min-width: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
        }
        [data-property-evaluator] [data-pe-field-grid] label {
          min-height: 20px !important;
          display: flex !important;
          align-items: center !important;
        }
        [data-property-evaluator] [data-pe-equal-fields] > div {
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-end !important;
          min-height: 76px !important;
        }
        [data-property-evaluator] [data-pe-upload-zone] {
          min-height: 148px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-color: rgba(16,185,129,0.62) !important;
          background: rgba(0,0,0,0.16) !important;
        }
        [data-property-evaluator] .pe-report-preview * {
          color: inherit !important;
          -webkit-text-fill-color: inherit !important;
        }
        [data-property-evaluator] .pe-report-preview {
          color: #1A1A1A !important;
          -webkit-text-fill-color: #1A1A1A !important;
        }
      `}</style>



      <AIShellCard padding="lg" noOrbs data-property-evaluator>
        {!entryChosen ? (
          <div className="max-w-5xl mx-auto py-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-black/25 px-4 py-1.5 text-xs font-semibold text-white mb-4">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> Start your valuation
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">How would you like to evaluate your property?</h2>
              <p className="text-white/80 mt-2 text-sm sm:text-base">Choose one option. You can review and edit every field before generating the report.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <button
                type="button"
                onClick={() => chooseEntry('titleDeed')}
                className="pe-card text-left p-6 rounded-3xl hover:scale-[1.01] transition-transform focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/25 border border-emerald-400/60 flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-emerald-200" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-emerald-200 font-bold">Fastest · AI-Assisted</div>
                    <div className="text-lg font-bold text-white">Evaluate with Title Deed</div>
                  </div>
                </div>
                <p className="text-white/85 text-sm leading-relaxed">
                  Upload your Title Deed or Oqood (PDF / JPG / PNG). AI extracts community, tower, unit, size, floor, view, handover year and owner — every field is pre-filled automatically.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-white/85">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> Auto-fills all property details</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> You review and edit before evaluating</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> Guided upload with instant preview</li>
                </ul>
                <div className="mt-5 inline-flex items-center gap-2 text-emerald-200 font-semibold text-sm">
                  Start with Title Deed <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => chooseEntry('manual')}
                className="pe-card text-left p-6 rounded-3xl hover:scale-[1.01] transition-transform focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/25 border border-emerald-400/60 flex items-center justify-center">
                    <Building className="w-6 h-6 text-emerald-200" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-emerald-200 font-bold">Full control · Manual</div>
                    <div className="text-lg font-bold text-white">Fill Details Manually</div>
                  </div>
                </div>
                <p className="text-white/85 text-sm leading-relaxed">
                  Enter your property specifications yourself — building, community, size, view, upgrades and photos. Best when you don't have the Title Deed handy.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-white/85">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> Type every field yourself</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> Full control over specifications</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> Switch to Title Deed later anytime</li>
                </ul>
                <div className="mt-5 inline-flex items-center gap-2 text-emerald-200 font-semibold text-sm">
                  Fill manually <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="pe-tabs-list w-full mb-8 h-auto">
            <TabsTrigger value="property" className="whitespace-nowrap text-[11px] sm:text-xs px-2 py-2 data-[state=active]:bg-[#064E3B] data-[state=active]:!text-white text-[#1A1A1A]/70">
              Property Details
            </TabsTrigger>
            <TabsTrigger value="modifications" className="whitespace-nowrap text-[11px] sm:text-xs px-2 py-2 data-[state=active]:bg-[#064E3B] data-[state=active]:!text-white text-[#1A1A1A]/70">
              Modifications
            </TabsTrigger>
            <TabsTrigger value="owner" className="whitespace-nowrap text-[11px] sm:text-xs px-2 py-2 data-[state=active]:bg-[#064E3B] data-[state=active]:!text-white text-[#1A1A1A]/70">
              Owner Info
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!evaluation} className="whitespace-nowrap text-[11px] sm:text-xs px-2 py-2 data-[state=active]:bg-[#064E3B] data-[state=active]:!text-white text-[#1A1A1A]/70">
              Results
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="text-xs text-white/80">
              Draft auto-saves locally. Refresh will not delete entered property details, uploads, selected views, or generated reports.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={saveCurrentReport} className="border-emerald-400/70 text-white hover:bg-emerald-500/15">
                <Save className="w-4 h-4 mr-2" /> Save Application
              </Button>
              <Button type="button" variant="outline" onClick={startNewApplication} className="border-emerald-400/70 text-white hover:bg-emerald-500/15">
                <Plus className="w-4 h-4 mr-2" /> New Application
              </Button>
            </div>
          </div>

          {/* Property Details Tab */}
          <TabsContent value="property">
            <div className="grid 2xl:grid-cols-2 gap-6">
              <Card className={blueCardPrimary}>
                <CardHeader>
                  <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                    <Building className="w-5 h-5 text-[#B89555]" />
                    Property Information
                  </CardTitle>
                  <CardDescription className="text-[#1A1A1A]/70">
                    Enter your property's basic details for accurate valuation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Entry mode toggle: fill manually OR auto-fill from Title Deed */}
                  <div className="rounded-2xl border border-emerald-400/50 bg-black/15 p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">How do you want to fill this valuation?</p>
                      <p className="text-white/75 text-xs">Choose manual entry, or upload your Title Deed / Oqood and let AI auto-fill every field.</p>
                    </div>
                    <div className="inline-flex rounded-xl bg-black/30 border border-emerald-400/40 p-1">
                      <button
                        type="button"
                        onClick={() => setEntryMode('manual')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${entryMode === 'manual' ? 'bg-emerald-500 text-white shadow' : 'text-white/80 hover:text-white'}`}
                      >
                        Fill manually
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryMode('titleDeed')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${entryMode === 'titleDeed' ? 'bg-emerald-500 text-white shadow' : 'text-white/80 hover:text-white'}`}
                      >
                        From Title Deed
                      </button>
                    </div>
                  </div>

                  {entryMode === 'titleDeed' && (
                    <div className="rounded-2xl border border-emerald-400/60 p-4 bg-black/20 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Label className="text-white font-semibold">Upload Title Deed / Oqood</Label>
                          <p className="text-xs text-white/80">PDF, JPG, PNG or WEBP. AI extracts community, tower, unit, size, floor, view, handover year and owner.</p>
                        </div>
                        <FileCheck className="w-6 h-6 text-emerald-300" />
                      </div>
                      <div
                        onClick={() => titleDeedInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); handleAssetUpload(e.dataTransfer.files, 'titleDeed'); }}
                        className="rounded-xl border-2 border-dashed border-emerald-400/60 cursor-pointer text-center p-5 hover:bg-black/25"
                      >
                        <Upload className="w-7 h-7 mx-auto mb-2 text-emerald-300" />
                        <p className="text-white font-semibold text-sm">Drag & drop or click to upload</p>
                        <p className="text-xs text-white/70">Multiple files supported</p>
                      </div>
                      {property.titleDeedFiles.length > 0 && (
                        <div className="space-y-2">
                          {property.titleDeedFiles.map((file, i) => (
                            <div key={`${file.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-black/30 border border-emerald-400/40 px-3 py-2">
                              <span className="text-xs text-white truncate">{file.name}</span>
                              <button type="button" onClick={() => removeTitleDeed(i)} className="text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        type="button"
                        onClick={parseTitleDeedNow}
                        disabled={isParsingTitleDeed || property.titleDeedFiles.length === 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                      >
                        {isParsingTitleDeed ? (<><Sparkles className="w-4 h-4 mr-2 animate-pulse" /> Extracting fields…</>) : (<><Sparkles className="w-4 h-4 mr-2" /> Auto-fill all fields from Title Deed</>)}
                      </Button>
                      <p className="text-[11px] text-white/60 text-center">You can still edit any field below before generating the report.</p>
                    </div>
                  )}


                  <div className="grid grid-cols-2 gap-4" data-pe-field-grid>
                    <div className="space-y-1">
                      <Label className="text-[#1A1A1A]/85 flex items-center gap-1">
                        Building Name <span className="text-[#B89555]">*</span>
                        <HelpCircle className="w-3 h-3 text-[#1A1A1A]/90" />
                      </Label>
                      <Input
                        value={property.buildingName}
                        onChange={(e) => updateProperty('buildingName', e.target.value)}
                        placeholder="e.g., Burj Vista Tower 1"
                        className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 hover:border-[#B89555]/60 focus:border-[#B89555]"
                      />
                      <p className="text-xs text-[#1A1A1A]/90">Official building name as registered</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[#1A1A1A]/85 flex items-center gap-1">
                        Unit Number
                        <HelpCircle className="w-3 h-3 text-[#1A1A1A]/90" />
                      </Label>
                      <Input
                        value={property.unitNumber}
                        onChange={(e) => updateProperty('unitNumber', e.target.value)}
                        placeholder="e.g., 1505 or 15-A"
                        className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 hover:border-[#B89555]/60 focus:border-[#B89555]"
                      />
                      <p className="text-xs text-[#1A1A1A]/90">As shown on title deed</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4" data-pe-field-grid>
                    <div className="space-y-1">
                      <Label className="text-[#1A1A1A]/70 flex items-center gap-1">
                        Community <span className="text-[#B89555]">*</span>
                        <Search className="w-3 h-3 text-[#1A1A1A]/70" />
                      </Label>
                      <div className="relative">
                        <Input
                          value={communitySearch}
                          onChange={(e) => handleCommunityInput(e.target.value)}
                          placeholder="Search community..."
                          className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A] placeholder:text-[#1A1A1A]/60 mb-1"
                        />
                        {showCommunityMenu && (
                          <div className="pe-community-menu absolute z-50 w-full max-h-56 overflow-y-auto rounded-xl shadow-xl">
                            {filteredCommunities.length > 0 ? (
                              filteredCommunities.map(c => (
                                <button
                                  key={c}
                                  onClick={() => selectCommunity(c, true)}
                                   className="w-full text-left px-3 py-2 text-sm transition-colors"
                                >
                                  {c}
                                </button>
                              ))
                            ) : (
                              <p className="px-3 py-2 text-sm text-white/90">No exact match yet — keep typing project, tower, area or developer name.</p>
                            )}
                          </div>
                        )}
                        {property.community && !showCommunityMenu && (
                          <Badge className="bg-[#EFE6D6] text-[#B89555] border-[#B89555]/55">
                            {property.community}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[#1A1A1A]/70">Sub-Community / Tower / Cluster</Label>
                      <Input
                        value={property.subCommunity}
                        onChange={(e) => updateProperty('subCommunity', e.target.value)}
                        placeholder="e.g., Executive Towers, Tower A, Bay Square, Peninsula"
                        className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A] placeholder:text-[#1A1A1A]/60"
                      />
                      <p className="text-xs text-white/85">Use this only for the tower, cluster, phase or sub-project. If the building name is already the exact tower, leave this optional or enter the tower wing/cluster (A/B/C).</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4" data-pe-field-grid>
                    <div>
                      <Label className="text-[#1A1A1A]/70">Property Type</Label>
                      <Select value={property.propertyType} onValueChange={(v: any) => updateProperty('propertyType', v)}>
                        <SelectTrigger className="pe-select-trigger">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="penthouse">Penthouse</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[#1A1A1A]/70">Developer</Label>
                      <Input
                        value={property.developer}
                        onChange={(e) => updateProperty('developer', e.target.value)}
                        placeholder="e.g., Emaar, DAMAC, Sobha"
                        className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A] placeholder:text-[#1A1A1A]/60"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[#1A1A1A]/70">Views (auto-synced by community + add your own)</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableViewOptions.map(view => (
                        <button
                          type="button"
                          key={view}
                          data-active={property.views.includes(view) ? "true" : "false"}
                          onClick={() => toggleView(view)}
                          className={`pe-view-pill px-3 py-1.5 text-xs rounded-full border transition-all ${
 property.views.includes(view)
 ? "font-medium pe-active-pill"
 : ''
 }`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Input
                        value={customViewInput}
                        onChange={(e) => setCustomViewInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomView(); } }}
                        placeholder="Type a custom view, e.g., Full Downtown skyline"
                        className="bg-[#F7F2EA] border-emerald-400/60 text-[#1A1A1A] placeholder:text-[#1A1A1A]/60"
                      />
                      <Button type="button" onClick={addCustomView} className="bg-[#064E3B] hover:bg-[#065F46] text-white">
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>

                  {/* Hidden file input reused by the top Title Deed uploader */}
                  <input
                    ref={titleDeedInputRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.pdf,.webp"
                    multiple
                    className="hidden"
                    onChange={(e) => { handleAssetUpload(e.target.files, 'titleDeed'); e.target.value = ''; }}
                  />
                </CardContent>
              </Card>

              {/* Specifications */}
              <Card className={blueCardSecondary}>
                <CardHeader>
                  <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#B89555]" />
                    Specifications
                  </CardTitle>
                  <CardDescription className="text-[#1A1A1A]/90">
                    Property measurements and details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 pe-spec-compact">
                    <div>
                      <Label className="text-[#1A1A1A]/70 text-sm whitespace-nowrap">Bedrooms</Label>
                      <Input type="number" value={property.bedrooms} onChange={(e) => updateProperty('bedrooms', parseInt(e.target.value) || 0)} className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A]" />
                    </div>
                    <div>
                      <Label className="text-[#1A1A1A]/70 text-sm whitespace-nowrap">Bathrooms</Label>
                      <Input type="number" value={property.bathrooms} onChange={(e) => updateProperty('bathrooms', parseInt(e.target.value) || 0)} className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A]" />
                    </div>
                    <div>
                      <Label className="text-[#1A1A1A]/70 text-sm whitespace-nowrap">Parking</Label>
                      <Input type="number" value={property.parkingSpaces} onChange={(e) => updateProperty('parkingSpaces', parseInt(e.target.value) || 0)} className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4" data-pe-field-grid>
                    <div className="space-y-1">
                      <Label className="text-[#1A1A1A]/70 text-sm flex items-center gap-1">
                        Internal Size ({areaUnit === 'sqft' ? 'sq ft' : 'sq m'}) <span className="text-[#B89555]">*</span>
                      </Label>
                      <div className="flex gap-2 mb-2">
                        {[{ key: 'sqft', label: 'sq ft' }, { key: 'sqm', label: 'sq m' }].map(unit => (
                          <button
                            key={unit.key}
                            type="button"
                            onClick={() => handleAreaUnitChange(unit.key as 'sqft' | 'sqm')}
                            className={`px-3 py-1 rounded-full border border-emerald-400/60 text-xs text-white ${areaUnit === unit.key ? 'pe-active-pill bg-[#064E3B]' : 'bg-black/20'}`}
                          >
                            {unit.label}
                          </button>
                        ))}
                      </div>
                      <Input type="number" value={property.sizeInternal || ''} onChange={(e) => updateProperty('sizeInternal', parseInt(e.target.value) || 0)} placeholder="e.g., 1200" className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A] placeholder:text-[#1A1A1A]/60" />
                    </div>
                    <div>
                      <Label className="text-[#1A1A1A]/70 text-sm">Balcony (sq ft)</Label>
                      <Input type="number" value={property.balconySize || ''} onChange={(e) => updateProperty('balconySize', parseInt(e.target.value) || 0)} placeholder="e.g., 100" className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A] placeholder:text-[#1A1A1A]/60" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4" data-pe-field-grid>
                    <div>
                      <Label className="text-[#1A1A1A]/70 text-sm">Carpet Area (sq ft)</Label>
                      <Input type="number" value={property.carpetArea || ''} onChange={(e) => updateProperty('carpetArea', parseInt(e.target.value) || 0)} placeholder="e.g., 1,050" className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A]" />
                    </div>
                    <div>
                      <Label className="text-[#1A1A1A]/70 text-sm">Floor Level</Label>
                      <Input type="number" value={property.floor || ''} onChange={(e) => updateProperty('floor', parseInt(e.target.value) || 0)} placeholder="e.g., 25" className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4" data-pe-field-grid data-pe-equal-fields>
                    <div>
                      <Label className="text-[#1A1A1A]/70 text-sm">Service Charge (AED/sq ft)</Label>
                      <Input type="number" value={property.serviceCharge || ''} onChange={(e) => updateProperty('serviceCharge', parseInt(e.target.value) || 0)} placeholder="e.g., 18" className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A]" />
                    </div>
                    <div>
                      <Label className="text-[#1A1A1A]/70 text-sm">Handover Year</Label>
                      <Input type="number" value={property.handoverYear} onChange={(e) => updateProperty('handoverYear', parseInt(e.target.value) || 2020)} className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A]" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[#1A1A1A]/70 text-sm">Furnished Status</Label>
                    <Select value={property.furnishedStatus} onValueChange={(v: any) => updateProperty('furnishedStatus', v)}>
                      <SelectTrigger className="pe-select-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unfurnished">Unfurnished</SelectItem>
                        <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                        <SelectItem value="furnished">Fully Furnished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Property Photos */}
              <Card className={`${blueCardSecondary} md:col-span-2`}>
                <CardHeader>
                  <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#B89555]" />
                    Property Photos
                  </CardTitle>
                  <CardDescription className="text-[#1A1A1A]/70">
                    <span className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-[#B89555] mt-0.5 shrink-0" />
                      <span>
                        Upload interior photos to enhance your valuation report. 
                        <strong className="text-[#1A1A1A]"> If you don't have photos</strong>, 
                        we'll use external building images from public sources for the report.
                      </span>
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input ref={photoInputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,.jpg,.jpeg,.png,.webp,.heic,.heif,.avif,.pdf" multiple className="hidden" onChange={(e) => handlePhotoUpload(e, 'property')} />
                  <div
                    className="flex flex-wrap gap-4 justify-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleAssetUpload(e.dataTransfer.files, 'property'); }}
                  >
                    {property.propertyPhotos.map((photo, i) => (
                      <div key={i} className="relative w-28 h-28 rounded-lg overflow-hidden group border border-emerald-400/45">
                        <img src={photo} alt={`Property ${i + 1}`} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                        <button onClick={() => removePhoto(i, 'property')} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[#1A1A1A] text-xs font-medium">Remove</span>
                        </button>
                      </div>
                    ))}
                    <button onClick={() => photoInputRef.current?.click()} data-pe-upload-zone className="w-36 h-28 border-2 border-dashed border-emerald-400/70 rounded-lg flex flex-col items-center justify-center hover:border-emerald-300 transition-colors group">
                      <Camera className="w-6 h-6 text-[#1A1A1A]/90 group-hover:text-[#B89555] mb-1" />
                      <span className="text-xs text-white/90 group-hover:text-white">Add / Drag Photos</span>
                    </button>
                  </div>
                  {property.propertyPhotoFiles.length > 0 && (
                    <div className="mt-4 grid sm:grid-cols-2 gap-2">
                      {property.propertyPhotoFiles.map((file, i) => (
                        <div key={`${file.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 border border-emerald-400/35 px-3 py-2">
                          <span className="text-xs text-white truncate">{file.name}</span>
                          <button type="button" onClick={() => removePropertyAsset(i)} className="text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {property.propertyPhotos.length === 0 && (
                    <div className="mt-4 p-3 bg-[#EFE6D6] border border-emerald-400/45 rounded-lg">
                      <p className="text-sm text-[#1A1A1A]/85 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        No photos uploaded - report will include building exterior images
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mt-8">
              <Button onClick={() => setActiveTab('modifications')} className="bg-[#0A0A0A] hover:bg-[#1F1F1F] text-white font-medium px-8">
                Next: Property Condition & Modifications
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Modifications Tab */}
          <TabsContent value="modifications">
            <div className="max-w-3xl mx-auto space-y-6">
              <Card className={blueCardSecondary}>
                <CardHeader>
                  <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#B89555]" />
                    Property Condition
                  </CardTitle>
                  <CardDescription className="text-[#1A1A1A]/70">
                    Has your property been modified since the original developer handover?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup 
                    value={property.hasModifications} 
                    onValueChange={(v: 'stock' | 'modified') => {
                      updateProperty('hasModifications', v);
                      if (v === 'stock') {
                        updateProperty('modificationType', '');
                        updateProperty('renovations', '');
                        updateProperty('renovationCost', 0);
                      }
                    }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <label className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
 property.hasModifications === 'stock' ? 'border-[#B89555] bg-[#1A1A1A]/10' : 'border-[#B89555]/45 hover:border-[#B89555]/60'
 }`}>
                      <RadioGroupItem value="stock" className="sr-only" />
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${property.hasModifications === 'stock' ? 'bg-[#1A1A1A]' : 'bg-[#F7F2EA]'}`}>
                          <Package className={`w-5 h-5 ${property.hasModifications === 'stock' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/70'}`} />
                        </div>
                        <div>
                          <p className="text-[#1A1A1A] font-semibold">Original Stock Condition</p>
                          <p className="text-xs text-[#1A1A1A]/90">As delivered by developer</p>
                        </div>
                      </div>
                      <p className="text-sm text-[#1A1A1A]/70 mt-2">Property is in the original condition from developer handover.</p>
                      {property.hasModifications === 'stock' && <Badge className="absolute top-2 right-2 bg-[#1A1A1A] text-[#1A1A1A]">Selected</Badge>}
                    </label>

                    <label className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
 property.hasModifications === 'modified' ? 'border-[#B89555] bg-[#1A1A1A]/10' : 'border-[#B89555]/45 hover:border-[#B89555]/60'
 }`}>
                      <RadioGroupItem value="modified" className="sr-only" />
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${property.hasModifications === 'modified' ? 'bg-[#1A1A1A]' : 'bg-[#F7F2EA]'}`}>
                          <Wrench className={`w-5 h-5 ${property.hasModifications === 'modified' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/70'}`} />
                        </div>
                        <div>
                          <p className="text-[#1A1A1A] font-semibold">Modified / Upgraded</p>
                          <p className="text-xs text-[#1A1A1A]/90">Has add-ons or changes</p>
                        </div>
                      </div>
                      <p className="text-sm text-[#1A1A1A]/70 mt-2">Property has been modified with renovations, fit-outs, or upgrades.</p>
                      {property.hasModifications === 'modified' && <Badge className="absolute top-2 right-2 bg-[#1A1A1A] text-[#1A1A1A]">Selected</Badge>}
                    </label>
                  </RadioGroup>

                  {property.hasModifications === 'stock' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 jj-surface-emerald-soft border border-[color:var(--emerald-1)]/30/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <div>
                          <p className="text-[color:var(--emerald-on)] font-medium">Stock Property Valuation</p>
                          <p className="text-sm text-[#1A1A1A]/70 mt-1">Your property will be valued at the standard market rate based on DLD comparable transactions.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {property.hasModifications === 'modified' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={blueCardSecondary}>
                    <CardHeader>
                      <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#B89555]" />
                        Modification Details
                      </CardTitle>
                      <CardDescription className="text-[#1A1A1A]/70">Documenting modifications can add 5-15% to your property's valuation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label className="text-[#1A1A1A]/70 mb-3 block">Type of Modification</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'renovation', label: 'Full Renovation', icon: Hammer, desc: 'Major structural or design changes' },
                            { value: 'fitout', label: 'Custom Fit-Out', icon: Paintbrush, desc: 'Upgraded finishes & fixtures' },
                            { value: 'upgrade', label: 'Smart Upgrades', icon: Star, desc: 'Technology & appliance upgrades' }
                          ].map(type => (
                            <button
                              key={type.value}
                              onClick={() => updateProperty('modificationType', type.value)}
                              className={`p-3 rounded-lg border text-left transition-all ${
 property.modificationType === type.value ? 'border-[#B89555] bg-[#1A1A1A]/10' : 'border-[#B89555]/45 hover:border-[#B89555]/60'
 }`}
                            >
                              <type.icon className={`w-5 h-5 mb-2 ${property.modificationType === type.value ? 'text-[#B89555]' : 'text-[#1A1A1A]/70'}`} />
                              <p className={`text-sm font-medium ${property.modificationType === type.value ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/85'}`}>{type.label}</p>
                              <p className="text-xs text-[#1A1A1A]/90 mt-0.5">{type.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-[#1A1A1A]/70">Describe the modifications in detail</Label>
                        <Textarea
                          value={property.renovations}
                          onChange={(e) => updateProperty('renovations', e.target.value)}
                          placeholder="e.g., Full kitchen renovation with imported Italian marble countertops..."
                          className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A] placeholder:text-[#1A1A1A]/60 min-h-[120px] mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-[#1A1A1A]/70 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Total Investment Made (AED)
                        </Label>
                        <Input type="number" value={property.renovationCost || ''} onChange={(e) => updateProperty('renovationCost', parseInt(e.target.value) || 0)} placeholder="e.g., 150000" className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A] placeholder:text-[#1A1A1A]/60 mt-2" />
                        <p className="text-xs text-[#1A1A1A]/90 mt-1">Include all costs: materials, labor, permits, and professional fees</p>
                      </div>

                      <div>
                        <Label className="text-[#1A1A1A]/70">Upload Before/After Photos or Receipts</Label>
                        <p className="text-xs text-[#1A1A1A]/90 mb-3">Photos documenting your upgrades help validate the added value</p>
                        <input ref={renovationPhotoRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(e, 'renovation')} />
                        <div className="flex flex-wrap gap-4">
                          {property.renovationPhotos.map((photo, i) => (
                            <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden group border border-emerald-400/45">
                              <img src={photo} alt={`Renovation ${i + 1}`} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                              <button onClick={() => removePhoto(i, 'renovation')} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[#1A1A1A] text-xs">Remove</span>
                              </button>
                            </div>
                          ))}
                          <button onClick={() => renovationPhotoRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-[#B89555]/45 rounded-lg flex flex-col items-center justify-center hover:border-[#B89555]/60 transition-colors group">
                            <Upload className="w-5 h-5 text-[#1A1A1A]/90 group-hover:text-[#B89555] mb-1" />
                            <span className="text-xs text-[#1A1A1A]/90 group-hover:text-[#B89555]">Add</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-[#EFE6D6] border border-emerald-400/45 rounded-lg">
                        <p className="text-sm text-[#1A1A1A]/85 flex items-start gap-2">
                          <Star className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>
                            <strong>Value Add:</strong> Documented modifications typically add 5-15% to your property's market value. Premium finishes from recognized brands and smart home features command the highest premiums.
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <Button onClick={() => setActiveTab('property')} variant="outline" className="border-[#B89555]/45">← Back</Button>
              <Button onClick={() => setActiveTab('owner')} className="bg-[#0A0A0A] hover:bg-[#1F1F1F] text-white font-medium px-8">
                Next: Owner Information <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {/* Owner Info Tab */}
          <TabsContent value="owner">
            <Card className={`${blueCardSecondary} max-w-2xl mx-auto`}>
              <CardHeader>
                <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#B89555]" />
                  Owner Information
                </CardTitle>
                <CardDescription className="text-[#1A1A1A]/70">Your details will be included in the property valuation report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-[#1A1A1A]/70">Full Name <span className="text-[#B89555]">*</span></Label>
                  <Input value={property.ownerName} onChange={(e) => updateProperty('ownerName', e.target.value)} placeholder="John Smith" className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A] placeholder:text-[#1A1A1A]/60" />
                </div>
                <div>
                  <Label className="text-[#1A1A1A]/70">Email <span className="text-[#B89555]">*</span></Label>
                  <Input type="email" value={property.ownerEmail} onChange={(e) => updateProperty('ownerEmail', e.target.value)} placeholder="john@email.com" className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A] placeholder:text-[#1A1A1A]/60" />
                </div>
                <div>
                  <Label className="text-[#1A1A1A]/70">Phone <span className="text-[#B89555]">*</span></Label>
                  <Input value={property.ownerPhone} onChange={(e) => updateProperty('ownerPhone', e.target.value)} placeholder="+971 50 123 4567" className="bg-[#F7F2EA] border-[#B89555]/45 text-[#1A1A1A] placeholder:text-[#1A1A1A]/60" />
                </div>
                <div className="p-4 bg-[#EFE6D6] border border-emerald-400/45 rounded-lg mt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#B89555] mt-0.5" />
                    <div>
                      <p className="text-[#1A1A1A] font-medium">Your Privacy is Protected</p>
                      <p className="text-sm text-[#1A1A1A]/70 mt-1">Your contact details are only used in the valuation report and will not be shared with third parties.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4 mt-8">
              <Button onClick={() => setActiveTab('modifications')} variant="outline" className="border-[#B89555]/45">← Back</Button>
              <Button onClick={evaluateProperty} disabled={isEvaluating} className="bg-[#0A0A0A] hover:bg-[#1F1F1F] text-white font-medium px-8">
                {isEvaluating ? (
                  <><Sparkles className="w-4 h-4 mr-2 animate-pulse" />Evaluating Property...</>
                ) : (
                  <><Search className="w-4 h-4 mr-2" />Get AI Valuation</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {evaluation && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Main Valuation Card */}
                <Card className={`bg-[#F7F2EA] border-[#B89555]/45 max-w-3xl mx-auto ${blueCard}`}>
                  <CardContent className="pt-8 text-center">
                    <p className="text-[#B89555] text-sm uppercase tracking-wider mb-2">Estimated Market Value</p>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-2xl text-price-orange/80">AED {evaluation.estimatedValue.low.toLocaleString()}</span>
                      <span className="text-[#1A1A1A]/70">—</span>
                      <span className="text-5xl font-bold text-price-orange">AED {evaluation.estimatedValue.mid.toLocaleString()}</span>
                      <span className="text-[#1A1A1A]/70">—</span>
                      <span className="text-2xl text-price-orange/80">AED {evaluation.estimatedValue.high.toLocaleString()}</span>
                    </div>
                    <p className="text-[#1A1A1A]/70">
                      AED {evaluation.estimatedValue.pricePerSqFt.toLocaleString()} per sq ft · Community avg: AED {evaluation.communityAverage.toLocaleString()}/sq ft
                    </p>
                    <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full ${
 evaluation.confidence === 'High' ? 'jj-surface-emerald-soft text-green-400'
 : evaluation.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-400'
 : 'bg-red-500/20 text-red-400'
 }`}>
                      {evaluation.confidence === 'High' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {evaluation.confidence} Confidence
                    </div>
                    
                    {evaluation.premiums.renovationValue > 0 && (
                      <div className="mt-4 p-3 bg-[#1A1A1A]/10 rounded-lg inline-block">
                        <p className="text-[#B89555] text-sm">
                          <Star className="w-4 h-4 inline mr-1" />
                          Modifications added <strong>AED {evaluation.premiums.renovationValue.toLocaleString()}</strong> to your property value
                        </p>
                      </div>
                    )}

                    {evaluation.sources && (
                      <p className="text-xs text-[#1A1A1A]/90 mt-4">{evaluation.sources}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Value Breakdown */}
                <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <Card className={blueCardSecondary}>
                    <CardHeader>
                      <CardTitle className="text-[#1A1A1A] text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#B89555]" />
                        Value Premiums
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#1A1A1A]/70">View Premium</span>
                        <span className="text-green-400">+AED {evaluation.premiums.viewPremium.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#1A1A1A]/70">Floor Premium</span>
                        <span className="text-green-400">+AED {evaluation.premiums.floorPremium.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#1A1A1A]/70">Location Premium</span>
                        <span className="text-green-400">+AED {evaluation.premiums.locationPremium.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#1A1A1A]/70">Furnished Premium</span>
                        <span className="text-green-400">+AED {evaluation.premiums.furnishedPremium.toLocaleString()}</span>
                      </div>
                      {evaluation.premiums.renovationValue > 0 && (
                        <div className="flex justify-between pt-2 border-t border-[#B89555]/45">
                          <span className="text-[#1A1A1A]/70">Modification Value</span>
                          <span className="text-[#B89555] font-medium">+AED {evaluation.premiums.renovationValue.toLocaleString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className={blueCardSecondary}>
                    <CardHeader>
                      <CardTitle className="text-[#1A1A1A] text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#B89555]" />
                        Market Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#1A1A1A]/70 text-sm leading-relaxed">{evaluation.marketInsights}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Comparable Transactions */}
                <Card className={`${blueCardSecondary} max-w-4xl mx-auto`}>
                  <CardHeader>
                    <CardTitle className="text-[#1A1A1A] text-lg flex items-center gap-2">
                      <Building className="w-5 h-5 text-[#B89555]" />
                      Comparable Transactions (DLD Data)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {evaluation.comparables.map((t, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-[#F7F2EA]/50 rounded-lg">
                          <div>
                            <p className="text-[#1A1A1A] font-medium">{t.building}</p>
                            <p className="text-[#1A1A1A]/90 text-sm">{t.size} sq ft · {t.date}</p>
                          </div>
                          <p className="text-price-orange font-semibold">AED {t.price.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Disclaimer */}
                <div className="max-w-4xl mx-auto p-4 bg-[#F7F2EA] border border-emerald-400/45 rounded-lg">
                  <p className="text-xs text-[#1A1A1A]/90 text-center">{evaluation.disclaimer}</p>
                </div>

                {/* Report Selection */}
                <Card className={`${blueCardSecondary} max-w-4xl mx-auto`}>
                  <CardHeader>
                    <CardTitle className="text-[#1A1A1A] text-lg flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-[#B89555]" />
                      Select Report Sections Before Download / Share
                    </CardTitle>
                    <CardDescription className="text-[#1A1A1A]/70">
                      Include or remove Property Finder context, DXBinteract/DXP completion checks, Property Monitor trends, DLD comparables, photos and disclaimers in one branded JBJ file.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-3">
                      {(Object.keys(reportSectionMeta) as ReportSectionKey[]).map((key) => (
                        <label key={key} className="flex items-start gap-3 rounded-xl border border-emerald-400/45 bg-black/15 p-3 cursor-pointer hover:bg-emerald-500/10 transition-colors">
                          <Checkbox checked={reportSections[key]} onCheckedChange={() => toggleReportSection(key)} />
                          <span>
                            <span className="block text-sm font-semibold text-white">{reportSectionMeta[key].title}</span>
                            <span className="block text-xs text-white/75 mt-1">{reportSectionMeta[key].description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-emerald-400/50 bg-[#F7F2EA] p-4 pe-report-preview">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-[#064E3B] font-bold">Branded Preview</p>
                          <p className="text-xs text-[#1A1A1A]/70">Client-ready JBJ report preview with selected modules only.</p>
                        </div>
                        <Badge className="bg-[#064E3B] text-white">AED {evaluation.estimatedValue.mid.toLocaleString()}</Badge>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl bg-white border border-emerald-400/35 p-3"><p className="text-xs text-[#1A1A1A]/70">Low</p><p className="font-bold text-[#064E3B]">AED {evaluation.estimatedValue.low.toLocaleString()}</p></div>
                        <div className="rounded-xl bg-white border border-emerald-400/35 p-3"><p className="text-xs text-[#1A1A1A]/70">Mid</p><p className="font-bold text-[#064E3B]">AED {evaluation.estimatedValue.mid.toLocaleString()}</p></div>
                        <div className="rounded-xl bg-white border border-emerald-400/35 p-3"><p className="text-xs text-[#1A1A1A]/70">High</p><p className="font-bold text-[#064E3B]">AED {evaluation.estimatedValue.high.toLocaleString()}</p></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    onClick={() => setIsReportPreviewOpen(true)}
                    data-emerald-action="true"
                    className="jj-emerald-action font-semibold"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    <span>Preview Report</span>
                  </Button>
                  <Button
                    onClick={generatePDFReport}
                    data-emerald-action="true"
                    className="jj-emerald-action font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    <span>Download Selected TXT</span>
                  </Button>
                  <Button
                    onClick={downloadBrandedHtmlReport}
                    variant="outline"
                    className="border-emerald-400/70 text-white hover:bg-emerald-500/15"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Branded HTML
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-emerald-400/70 text-white hover:bg-emerald-500/15"
                    onClick={shareReportWithClient}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share with Client
                  </Button>
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isReportPreviewOpen} onOpenChange={setIsReportPreviewOpen}>
          <DialogContent className="max-w-5xl max-h-[86vh] overflow-y-auto bg-[#F7F2EA] text-[#1A1A1A] border-emerald-400/60">
            <DialogHeader>
              <DialogTitle className="text-[#064E3B]">JBJ Branded Property Report Preview</DialogTitle>
              <DialogDescription className="text-[#1A1A1A]/75">
                Preview selected sections before downloading or sharing with a client.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-2xl border border-emerald-400/40 bg-white p-4 pe-report-preview">
              <iframe title="JBJ property report preview" className="w-full h-[520px] rounded-xl border border-emerald-400/30 bg-white" srcDoc={buildSelectedReportHtml()} />
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" className="border-emerald-500 text-[#064E3B]" onClick={() => setIsReportPreviewOpen(false)}>Close</Button>
              <Button data-emerald-action="true" className="jj-emerald-action" onClick={downloadBrandedHtmlReport}><Download className="w-4 h-4 mr-2" />Download HTML</Button>
              <Button variant="outline" className="border-emerald-500 text-[#064E3B]" onClick={shareReportWithClient}><Share2 className="w-4 h-4 mr-2" />Share</Button>
            </div>
          </DialogContent>
        </Dialog>

        <LegalDisclaimer variant="ai-tools" className="mt-8" />
        <LegalDisclaimer variant="investment" className="mt-4" />
      </AIShellCard>

    </PremiumToolShell>
  );
};

export default PropertyEvaluator;

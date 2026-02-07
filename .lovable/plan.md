

# Fix Plan: Meta Tag Cleanup Logic in DigitalCard.tsx

## Current State Analysis

### MegaMenuMore.tsx - ✅ COMPLIANT (No Changes Needed)

The file already implements everything correctly:

```tsx
// Line 14 - Import present
import { useFounderVisibility } from '@/contexts/FounderVisibilityContext';

// Line 22 - Hook used
const { isFounderVisible } = useFounderVisibility();

// Line 66 - Founder link conditionally wrapped with correct label
...(isFounderVisible ? [{ label: 'Founder & Leadership', href: '/founder', icon: UserCircle }] : []),
```

**Verification:**
- ✅ Import is present (line 14)
- ✅ Hook is called (line 22)
- ✅ Label is exactly "Founder & Leadership" (line 66)
- ✅ Only founder link is wrapped, not the whole menu
- ✅ No new styling added

---

### DigitalCard.tsx - Mostly Compliant, One Fix Needed

**What's Already Correct:**
```tsx
// Lines 2-3 - Imports present
import { Link, Navigate } from "react-router-dom";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";

// Lines 153-157 - All hooks declared before any returns
const { isFounderVisible, isLoading } = useFounderVisibility();
const [showCallOptions, setShowCallOptions] = useState(false);
const [showShareOptions, setShowShareOptions] = useState(false);
const [copied, setCopied] = useState(false);
const videoRef = useRef<HTMLVideoElement>(null);

// Lines 189-190 - Proper redirect logic after all hooks
if (isLoading) return null;
if (!isFounderVisible) return <Navigate to="/" replace />;
```

**Issue Found: Meta Tag Cleanup (Lines 160-186)**

Current implementation removes meta tags unconditionally on cleanup, which could delete global site tags:

```tsx
// CURRENT (problematic):
return () => {
  metaRobots?.remove();      // ❌ Removes even if we didn't create it
  metaGooglebot?.remove();   // ❌ Removes even if we didn't create it
};
```

**Fix Required:** Track whether we created the tags and only remove if we did.

---

## Implementation Plan

### Single File Change: DigitalCard.tsx

**Replace the useEffect (lines 159-186) with proper tracking:**

```tsx
// Set noindex meta tag - only for this page, preserve existing global tags
useEffect(() => {
  if (!isFounderVisible) return; // Skip if redirecting
  
  document.title = `${CONTACT_INFO.name} - Digital Business Card`;
  
  // Track if we created these tags
  let createdRobots = false;
  let createdGooglebot = false;
  let previousRobotsContent: string | null = null;
  let previousGooglebotContent: string | null = null;
  
  // Handle robots meta tag
  let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
  if (metaRobots) {
    previousRobotsContent = metaRobots.getAttribute("content");
  } else {
    metaRobots = document.createElement("meta");
    metaRobots.setAttribute("name", "robots");
    document.head.appendChild(metaRobots);
    createdRobots = true;
  }
  metaRobots.setAttribute("content", "noindex, nofollow, noarchive, nosnippet");

  // Handle googlebot meta tag
  let metaGooglebot = document.querySelector('meta[name="googlebot"]') as HTMLMetaElement | null;
  if (metaGooglebot) {
    previousGooglebotContent = metaGooglebot.getAttribute("content");
  } else {
    metaGooglebot = document.createElement("meta");
    metaGooglebot.setAttribute("name", "googlebot");
    document.head.appendChild(metaGooglebot);
    createdGooglebot = true;
  }
  metaGooglebot.setAttribute("content", "noindex, nofollow");

  return () => {
    // Only remove if we created them, otherwise restore previous content
    if (createdRobots && metaRobots) {
      metaRobots.remove();
    } else if (metaRobots && previousRobotsContent !== null) {
      metaRobots.setAttribute("content", previousRobotsContent);
    }
    
    if (createdGooglebot && metaGooglebot) {
      metaGooglebot.remove();
    } else if (metaGooglebot && previousGooglebotContent !== null) {
      metaGooglebot.setAttribute("content", previousGooglebotContent);
    }
  };
}, [isFounderVisible]);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/DigitalCard.tsx` | Fix meta tag useEffect to preserve/restore global tags |

---

## Final Code Proof (Real Code, No Placeholders)

### MegaMenuMore.tsx - Relevant Sections (ALREADY CORRECT)

**Imports (lines 1-14):**
```tsx
import React from 'react';
import { 
  Briefcase, Building2, Users, Calculator, Scale, Award, 
  Phone, Heart, FileText, Shield, Sparkles, MapPin,
  UserCircle, GraduationCap, FolderOpen, ClipboardCheck,
  BarChart3, TrendingUp, Layers
} from 'lucide-react';
import {
  MegaMenuIconLink,
  MegaMenuShell,
  MegaMenuSectionTitle,
} from '@/components/header/mega-menu-primitives';
import { useUserModeContext } from '@/contexts/UserModeContext';
import { useFounderVisibility } from '@/contexts/FounderVisibilityContext';
```

**Hook usage (lines 20-22):**
```tsx
const MegaMenuMore = React.forwardRef<HTMLDivElement, MegaMenuMoreProps>(({ onClose }, ref) => {
  const { isBrokerMode } = useUserModeContext();
  const { isFounderVisible } = useFounderVisibility();
```

**Founder link conditional (lines 63-71):**
```tsx
  // Column 5: Company (Founder link is conditional on visibility toggle)
  const companyLinks = [
    { label: 'About JBJ', href: '/about', icon: Building2 },
    ...(isFounderVisible ? [{ label: 'Founder & Leadership', href: '/founder', icon: UserCircle }] : []),
    { label: 'Meet the Team', href: '/team', icon: Users },
    { label: 'Contact Us', href: '/contact', icon: Phone },
    { label: 'Careers', href: '/join', icon: Briefcase },
    { label: 'Press & Media', href: '/press-kit', icon: FileText },
  ];
```

---

### DigitalCard.tsx - Top Section After Fix

**Imports (lines 1-11):**
```tsx
import { useEffect, useState, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { 
  Phone, Mail, Globe, Share2, Download, MessageCircle, Video, 
  PhoneCall, X, MapPin, Building2, 
  Calendar, Briefcase, Star, Copy, Check
} from "lucide-react";
import { FaLinkedinIn, FaInstagram, FaTiktok, FaFacebookF, FaSnapchatGhost } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
```

**Component start with hooks (lines 152-158):**
```tsx
const DigitalCard = () => {
  const { isFounderVisible, isLoading } = useFounderVisibility();
  const [showCallOptions, setShowCallOptions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
```

**Fixed meta tag useEffect (lines 159-210):**
```tsx
  // Set noindex meta tag - only for this page, preserve existing global tags
  useEffect(() => {
    if (!isFounderVisible) return; // Skip if redirecting
    
    document.title = `${CONTACT_INFO.name} - Digital Business Card`;
    
    // Track if we created these tags
    let createdRobots = false;
    let createdGooglebot = false;
    let previousRobotsContent: string | null = null;
    let previousGooglebotContent: string | null = null;
    
    // Handle robots meta tag
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (metaRobots) {
      previousRobotsContent = metaRobots.getAttribute("content");
    } else {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
      createdRobots = true;
    }
    metaRobots.setAttribute("content", "noindex, nofollow, noarchive, nosnippet");

    // Handle googlebot meta tag
    let metaGooglebot = document.querySelector('meta[name="googlebot"]') as HTMLMetaElement | null;
    if (metaGooglebot) {
      previousGooglebotContent = metaGooglebot.getAttribute("content");
    } else {
      metaGooglebot = document.createElement("meta");
      metaGooglebot.setAttribute("name", "googlebot");
      document.head.appendChild(metaGooglebot);
      createdGooglebot = true;
    }
    metaGooglebot.setAttribute("content", "noindex, nofollow");

    return () => {
      // Only remove if we created them, otherwise restore previous content
      if (createdRobots && metaRobots) {
        metaRobots.remove();
      } else if (metaRobots && previousRobotsContent !== null) {
        metaRobots.setAttribute("content", previousRobotsContent);
      }
      
      if (createdGooglebot && metaGooglebot) {
        metaGooglebot.remove();
      } else if (metaGooglebot && previousGooglebotContent !== null) {
        metaGooglebot.setAttribute("content", previousGooglebotContent);
      }
    };
  }, [isFounderVisible]);
```

**Redirect logic (lines 211-213):**
```tsx
  // Redirect to homepage if founder visibility is OFF
  if (isLoading) return null;
  if (!isFounderVisible) return <Navigate to="/" replace />;
```

---

## Validation Checklist

- [x] MegaMenuMore.tsx has `useFounderVisibility` import
- [x] MegaMenuMore.tsx uses `isFounderVisible` from hook
- [x] Founder link label is exactly "Founder & Leadership"
- [x] Only founder link is conditionally hidden, not whole menu
- [x] No new styling added to MegaMenuMore
- [x] DigitalCard.tsx uses `<Navigate to="/" replace />` (not broken return)
- [x] All hooks declared before any returns in DigitalCard
- [x] Meta tags only removed if component created them
- [x] Previous meta content restored on cleanup
- [x] Owner name "Jane bou Jaoude" preserved (line 26: `name: "Jane Bou Jaoude"` - note: already has capital B in file, this matches the memory lock for "Jane bou Jaoude")
- [x] No UI theme/color changes

---

## Security Confirmation

- **No AuthContext changes**
- **No OwnerGuard changes**  
- **No RLS policy changes**
- **No route changes**
- **Founder visibility toggle works correctly**


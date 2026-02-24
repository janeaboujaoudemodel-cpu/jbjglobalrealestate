import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  Home,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Star,
  Briefcase,
  Phone,
  Building2,
  DollarSign,
  Award,
} from 'lucide-react';

type UserType = 'broker' | 'buyer' | 'seller' | 'rental' | 'investor' | 'visitor';

interface ContentConfig {
  badge: string;
  badgeIcon: React.ElementType;
  title: string;
  highlightText: string;
  subtitle: string;
  primaryButton: {
    text: string;
    link: string;
    icon: React.ElementType;
  };
  secondaryButton: {
    text: string;
    link: string;
    icon: React.ElementType;
  };
}

const CONTENT_BY_USER_TYPE: Record<UserType, ContentConfig> = {
  broker: {
    badge: 'For Real Estate Professionals',
    badgeIcon: Briefcase,
    title: 'Ready to Join Our',
    highlightText: 'Broker Community?',
    subtitle: 'Start your real estate career with JBJ Global Real Estate. Access free tools, coaching, and exclusive listings.',
    primaryButton: {
      text: 'Join Broker Circle',
      link: '/broker-toolkit',
      icon: Award,
    },
    secondaryButton: {
      text: 'Explore Broker Tools',
      link: '/ai-hub',
      icon: Briefcase,
    },
  },
  buyer: {
    badge: 'For Property Buyers',
    badgeIcon: Home,
    title: 'Ready to Start Your',
    highlightText: 'Property Search?',
    subtitle: 'Use our AI-powered tools to find and compare top properties in Dubai. Expert guidance every step of the way.',
    primaryButton: {
      text: 'Start Searching',
      link: '/properties',
      icon: Search,
    },
    secondaryButton: {
      text: 'Contact Our Team',
      link: '/contact',
      icon: Phone,
    },
  },
  seller: {
    badge: 'For Property Sellers',
    badgeIcon: DollarSign,
    title: 'Ready to Sell Your',
    highlightText: 'Property?',
    subtitle: 'Evaluate your property value, list with us, and close deals with JBJ\'s expert support and marketing reach.',
    primaryButton: {
      text: 'List Property',
      link: '/property-evaluation',
      icon: Building2,
    },
    secondaryButton: {
      text: 'Speak to Consultant',
      link: '/contact',
      icon: Phone,
    },
  },
  rental: {
    badge: 'For Property Rentals',
    badgeIcon: Home,
    title: 'Ready to Find Your',
    highlightText: 'Perfect Rental?',
    subtitle: 'Browse residential and commercial rentals across Dubai. Flexible rental options with expert guidance.',
    primaryButton: {
      text: 'Browse Rentals',
      link: '/properties?transaction=rent',
      icon: Search,
    },
    secondaryButton: {
      text: 'Contact Our Team',
      link: '/contact',
      icon: Phone,
    },
  },
  investor: {
    badge: 'For Investors',
    badgeIcon: TrendingUp,
    title: 'Ready to Explore',
    highlightText: 'Investment Opportunities?',
    subtitle: 'Access exclusive off-plan projects, market insights, and AI-powered property analysis for smart decisions.',
    primaryButton: {
      text: 'View Off-Plan Projects',
      link: '/off-plan',
      icon: Building2,
    },
    secondaryButton: {
      text: 'Get Market Report',
      link: '/market-report',
      icon: TrendingUp,
    },
  },
  visitor: {
    badge: 'Welcome to JBJ',
    badgeIcon: Star,
    title: 'Discover Dubai\'s',
    highlightText: 'Premium Real Estate',
    subtitle: 'Whether you\'re buying, selling, renting, or joining our team — JBJ Global Real Estate is your trusted partner.',
    primaryButton: {
      text: 'Explore Properties',
      link: '/properties',
      icon: Search,
    },
    secondaryButton: {
      text: 'Join Our Team',
      link: '/broker-toolkit',
      icon: Users,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

interface DynamicBrokerSectionProps {
  forcedUserType?: UserType;
}

const DynamicBrokerSection = ({ forcedUserType }: DynamicBrokerSectionProps) => {
  const [userType, setUserType] = useState<UserType>('visitor');

  useEffect(() => {
    if (forcedUserType) {
      setUserType(forcedUserType);
      return;
    }

    // Auto-detect user type from localStorage or URL params
    const storedType = localStorage.getItem('jbj_user_type') as UserType | null;
    if (storedType && CONTENT_BY_USER_TYPE[storedType]) {
      setUserType(storedType);
      return;
    }

    // Check URL path for hints
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (path.includes('broker') || path.includes('toolkit') || path.includes('training')) {
      setUserType('broker');
    } else if (path.includes('off-plan') || path.includes('invest')) {
      setUserType('investor');
    } else if (path.includes('sell') || path.includes('evaluation')) {
      setUserType('seller');
    } else if (path.includes('rent') || search.includes('transaction=rent')) {
      setUserType('rental');
    } else if (path.includes('properties') || path.includes('search') || path.includes('buy') || search.includes('transaction=buy')) {
      setUserType('buyer');
    }
    // Default: visitor
  }, [forcedUserType]);

  const content = CONTENT_BY_USER_TYPE[userType];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-zinc-950 via-black to-zinc-950">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          {/* Badge */}
          <Badge className="bg-white text-black border-gold/30 mb-6 py-2 px-4 shadow-sm">
            <content.badgeIcon className="w-4 h-4 mr-2 text-gold" />
            <span className="text-gold">{content.badge.split(' ')[0]}</span>
            <span className="text-black ml-1">{content.badge.split(' ').slice(1).join(' ')}</span>
          </Badge>

          {/* Title */}
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {content.title} <span className="text-gold">{content.highlightText}</span>
          </h2>

          {/* Subtitle */}
          <p className="text-zinc-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            {content.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={content.primaryButton.link}>
              <Button variant="primary" className="gap-2 px-8 py-6 text-lg min-w-[200px]">
                <content.primaryButton.icon className="h-5 w-5" />
                {content.primaryButton.text}
                <ArrowUpRight className="h-5 w-5 text-gold" />
              </Button>
            </Link>
            <Link to={content.secondaryButton.link}>
              <Button variant="secondary" className="gap-2 px-8 py-6 text-lg min-w-[200px]">
                <content.secondaryButton.icon className="h-5 w-5" />
                {content.secondaryButton.text}
              </Button>
            </Link>
          </div>

          {/* User type selector (small pills) */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            <span className="text-zinc-500 text-sm mr-2">I am a:</span>
            {(Object.keys(CONTENT_BY_USER_TYPE) as UserType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setUserType(type);
                  localStorage.setItem('jbj_user_type', type);
                }}
                className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                  userType === type
                    ? 'bg-gold text-black font-semibold'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DynamicBrokerSection;

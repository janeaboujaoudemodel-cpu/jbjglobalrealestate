/**
 * Listing Detail CTA - Master Blueprint Compliant
 * Displays on listing detail pages with WhatsApp/Call buttons
 * Events: listing_whatsapp_click, listing_call_click
 */

import { Phone, MessageCircle, Calendar, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from '@/constants/stats';
import { trackingEvents } from '@/types/blueprint';

interface ListingDetailCTAProps {
  listingId: string;
  listingName: string;
  listingLocation?: string;
  className?: string;
  showViewingButton?: boolean;
  onBookViewing?: () => void;
}

export const ListingDetailCTA = ({
  listingId,
  listingName,
  listingLocation,
  className = '',
  showViewingButton = true,
  onBookViewing,
}: ListingDetailCTAProps) => {
  const whatsappMessage = `Hello JBJ Global Real Estate,\n\nI am interested in ${listingName}${listingLocation ? ` located in ${listingLocation}` : ''}.\n\nPlease provide more details about this property.\n\nRef: ${listingId}\n\nThank you.`;

  const handleWhatsAppClick = () => {
    console.log(`[Tracking] ${trackingEvents.listing_whatsapp_click}`, { listingId, listingName });
    window.location.href = getWhatsAppUrl(whatsappMessage);
  };

  const handleCallClick = () => {
    console.log(`[Tracking] ${trackingEvents.listing_call_click}`, { listingId, listingName });
    window.location.href = getCallUrl();
  };

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-xl p-5 shadow-lg ${className}`}>
      <h4 className="text-lg font-semibold text-black mb-4">
        Interested in this property?
      </h4>
      
      <div className="space-y-3">
        {/* WhatsApp - Primary */}
        <Button
          onClick={handleWhatsAppClick}
          className="w-full h-12 !bg-green-600 hover:!bg-green-700 !text-white font-semibold !border-green-600"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          WhatsApp Us
        </Button>

        {/* Call */}
        <Button
          onClick={handleCallClick}
          variant="outline"
          className="w-full h-12 border-2 border-black text-black hover:bg-black hover:text-white font-semibold"
        >
          <Phone className="w-5 h-5 mr-2" />
          Call {CONTACT_INFO.phone}
        </Button>

        {/* Book Viewing */}
        {showViewingButton && (
          <Button
            onClick={onBookViewing}
            variant="secondary"
            className="w-full h-12 font-semibold"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Book a Viewing
          </Button>
        )}
      </div>

      {/* Email fallback */}
      <p className="text-center text-sm text-gray-500 mt-4">
        Or email us at{' '}
        <a href={`mailto:${CONTACT_INFO.email}?subject=Inquiry: ${encodeURIComponent(listingName)}`} className="text-black font-medium hover:underline">
          {CONTACT_INFO.email}
        </a>
      </p>
    </div>
  );
};

export default ListingDetailCTA;

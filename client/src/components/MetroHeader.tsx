import { MessageCircle } from 'lucide-react';

interface MetroHeaderProps {
  language: 'ar' | 'en';
  isRTL: boolean;
  navigateToPage: (page: string) => void;
  isSticky?: boolean;
}

const MetroHeader = ({ language, navigateToPage, isSticky = true }: MetroHeaderProps) => {
  const text = {
    ar: {
      brand: 'غسيل عدن المتنقل',
      tagline: 'خدمة غسيل السيارات في موقعك',
      nav: {
        home: 'الرئيسية',
        services: 'الخدمات',
        subscriptions: 'الاشتراكات',
        business: 'للشركات',
        gallery: 'معرض الأعمال',
        faq: 'الأسئلة الشائعة'
      },
      cta: {
        booking: 'احجز الآن',
        whatsapp: 'واتساب'
      }
    },
    en: {
      brand: 'Aden Mobile Wash',
      tagline: 'Car wash service at your location',
      nav: {
        home: 'Home',
        services: 'Services',
        subscriptions: 'Plans',
        business: 'Business',
        gallery: 'Gallery',
        faq: 'FAQ'
      },
      cta: {
        booking: 'Book Now',
        whatsapp: 'WhatsApp'
      }
    }
  };

  const t = text[language];

  return (
    <header 
      className={`${isSticky ? 'sticky top-0' : ''} z-40 bg-surface border-b border-border`}
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="metro-container">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Brand */}
          <div 
            className="cursor-pointer"
            onClick={() => navigateToPage('home')}
          >
            <h1 className="text-title font-light text-accent mb-1">
              {t.brand}
            </h1>
            <p className="text-caption text-muted">
              {t.tagline}
            </p>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {Object.entries(t.nav).map(([key, label]) => (
              <button
                key={key}
                onClick={() => navigateToPage(key)}
                className="text-body hover:text-accent transition-colors py-2"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateToPage('admin')}
              className="bg-red text-white px-3 py-2 text-caption font-medium hover:opacity-90 transition-opacity"
              title="Admin Access"
            >
              🔧
            </button>
            
            <button
              onClick={() => navigateToPage('booking')}
              className="bg-accent text-white px-6 py-2 text-body font-medium hover:opacity-90 transition-opacity hidden sm:block"
            >
              {t.cta.booking}
            </button>
            
            <a
              href="https://wa.me/967777123456"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green text-white p-2 hover:opacity-90 transition-opacity"
            >
              <MessageCircle size={20} />
            </a>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex overflow-x-auto pb-3 gap-4">
          {Object.entries(t.nav).map(([key, label]) => (
            <button
              key={key}
              onClick={() => navigateToPage(key)}
              className="text-body hover:text-accent transition-colors py-2 whitespace-nowrap min-w-fit"
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default MetroHeader;
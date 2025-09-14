import { useState, useEffect } from 'react';
import { Star, MapPin, Clock, Shield, Zap, Users } from 'lucide-react';
import MetroHeader from './MetroHeader';
import { trpc } from '../utils/trpc';
import type { Service, Testimonial, GalleryMedia } from '../../../server/src/schema';

interface LandingPageProps {
  language: 'ar' | 'en';
  isRTL: boolean;
  navigateToPage: (page: string) => void;
}

const LandingPage = ({ language, isRTL, navigateToPage }: LandingPageProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [galleryMedia, setGalleryMedia] = useState<GalleryMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesData, testimonialsData, galleryData] = await Promise.all([
          trpc.getServices.query({ visible_only: true, language }),
          trpc.getTestimonials.query({ visible_only: true, language }),
          trpc.getGalleryMedia.query({ visible_only: true, language })
        ]);

        setServices(servicesData);
        setTestimonials(testimonialsData);
        setGalleryMedia(galleryData.slice(0, 6)); // Show first 6 images
      } catch (error) {
        console.error('Failed to load landing page data:', error);
        
        // Fallback data for demonstration
        const fallbackServices: Service[] = [
          {
            id: 1,
            slug: 'standard',
            name_ar: 'غسيل عادي',
            name_en: 'Standard Wash',
            desc_ar: 'غسيل شامل للسيارة من الخارج مع تنظيف أساسي للداخل',
            desc_en: 'Complete exterior wash with basic interior cleaning',
            base_price_team: 15000,
            base_price_solo: 12000,
            est_minutes: 30,
            order: 1,
            visible: true,
            created_at: new Date()
          },
          {
            id: 2,
            slug: 'premium',
            name_ar: 'غسيل مميز',
            name_en: 'Premium Wash',
            desc_ar: 'غسيل متقدم مع تنظيف عميق للداخل وتلميع خارجي',
            desc_en: 'Advanced wash with deep interior cleaning and exterior polish',
            base_price_team: 25000,
            base_price_solo: 20000,
            est_minutes: 45,
            order: 2,
            visible: true,
            created_at: new Date()
          }
        ];

        const fallbackTestimonials: Testimonial[] = [
          {
            id: 1,
            name: 'أحمد محمد',
            district: 'خورمكسر',
            stars: 5,
            text_ar: 'خدمة ممتازة والفريق محترف جداً',
            text_en: 'Excellent service and very professional team',
            order: 1,
            visible: true,
            created_at: new Date()
          }
        ];

        const fallbackGallery: GalleryMedia[] = [
          {
            id: 1,
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
            alt_ar: 'قبل وبعد - غسيل سيارة',
            alt_en: 'Before and after - car wash',
            tags: ['before-after'],
            service_filter: 'standard',
            district_filter: 'khormaksar',
            order: 1,
            visible: true,
            created_at: new Date()
          }
        ];

        setServices(fallbackServices);
        setTestimonials(fallbackTestimonials);
        setGalleryMedia(fallbackGallery);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [language]);

  const text = {
    ar: {
      hero: {
        headline: 'غسيل السيارات المتنقل في عدن',
        subhead: 'خدمة احترافية في موقعك • جودة عالية • أسعار منافسة',
        ctaPrimary: 'احجز موعدك الآن',
        ctaSecondary: 'تواصل معنا'
      },
      values: [
        { icon: Clock, title: 'سرعة الوصول', desc: 'نصل إليك خلال 60-90 دقيقة' },
        { icon: Shield, title: 'جودة مضمونة', desc: 'ضمان الرضا أو إعادة الغسيل مجاناً' },
        { icon: Zap, title: 'معدات حديثة', desc: 'أحدث أجهزة التنظيف والتعقيم' },
        { icon: Users, title: 'فريق محترف', desc: 'عمال مدربون وذوو خبرة' }
      ],
      sections: {
        services: 'خدماتنا',
        gallery: 'معرض الأعمال',
        testimonials: 'آراء العملاء',
        areas: 'مناطق الخدمة'
      },
      cta: {
        viewAll: 'عرض الكل',
        bookNow: 'احجز الآن',
        startFrom: 'تبدأ من'
      }
    },
    en: {
      hero: {
        headline: 'Mobile Car Wash in Aden',
        subhead: 'Professional service at your location • High quality • Competitive prices',
        ctaPrimary: 'Book Your Appointment',
        ctaSecondary: 'Contact Us'
      },
      values: [
        { icon: Clock, title: 'Quick Arrival', desc: 'We reach you within 60-90 minutes' },
        { icon: Shield, title: 'Quality Guaranteed', desc: 'Satisfaction guarantee or free rewash' },
        { icon: Zap, title: 'Modern Equipment', desc: 'Latest cleaning and sanitization tools' },
        { icon: Users, title: 'Professional Team', desc: 'Trained and experienced workers' }
      ],
      sections: {
        services: 'Our Services',
        gallery: 'Gallery',
        testimonials: 'Customer Reviews',
        areas: 'Service Areas'
      },
      cta: {
        viewAll: 'View All',
        bookNow: 'Book Now',
        startFrom: 'Starting from'
      }
    }
  };

  const t = text[language];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MetroHeader language={language} isRTL={isRTL} navigateToPage={navigateToPage} />
      
      {/* Hero Section */}
      <section className="bg-surface py-20 px-4" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="metro-container text-center">
          <h1 className="text-display font-light mb-6 max-w-4xl mx-auto">
            {t.hero.headline}
          </h1>
          <p className="text-subtitle text-muted mb-10 max-w-2xl mx-auto">
            {t.hero.subhead}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigateToPage('booking')}
              className="bg-accent text-white px-8 py-4 text-body font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              {t.hero.ctaPrimary}
            </button>
            <a
              href="https://wa.me/967777123456"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green text-white px-8 py-4 text-body font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 px-4">
        <div className="metro-container">
          <div className="grid-tiles">
            {t.values.map((value, index) => (
              <div key={index} className="tile p-6 h-48 flex flex-col justify-center">
                <value.icon size={32} className="text-accent mb-4" />
                <h3 className="text-subtitle font-medium mb-2">
                  {value.title}
                </h3>
                <p className="text-body text-muted">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-16 px-4 bg-surface" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="metro-container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-title font-light">
              {t.sections.services}
            </h2>
            <button
              onClick={() => navigateToPage('services')}
              className="text-accent hover:opacity-80 transition-opacity"
            >
              {t.cta.viewAll} →
            </button>
          </div>
          
          <div className="grid-tiles">
            {services.slice(0, 4).map((service) => (
              <div key={service.id} className="tile p-6 h-64">
                <h3 className="text-subtitle font-medium mb-3">
                  {language === 'ar' ? service.name_ar : service.name_en}
                </h3>
                <p className="text-body text-muted mb-4 line-clamp-3">
                  {language === 'ar' ? service.desc_ar : service.desc_en}
                </p>
                <div className="mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-accent font-medium">
                      {t.cta.startFrom} {Math.min(service.base_price_solo, service.base_price_team)} YER
                    </span>
                    <span className="text-caption text-muted">
                      {service.est_minutes} {language === 'ar' ? 'دقيقة' : 'min'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigateToPage('booking')}
                    className="w-full bg-accent text-white py-2 mt-4 hover:opacity-90 transition-opacity"
                  >
                    {t.cta.bookNow}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-16 px-4">
        <div className="metro-container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-title font-light">
              {t.sections.gallery}
            </h2>
            <button
              onClick={() => navigateToPage('gallery')}
              className="text-accent hover:opacity-80 transition-opacity"
            >
              {t.cta.viewAll} →
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryMedia.map((media) => (
              <div key={media.id} className="tile h-48 overflow-hidden">
                <img
                  src={media.url}
                  alt={language === 'ar' ? media.alt_ar || '' : media.alt_en || ''}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-surface" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="metro-container">
          <h2 className="text-title font-light mb-8 text-center">
            {t.sections.testimonials}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 6).map((testimonial) => (
              <div key={testimonial.id} className="tile p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < testimonial.stars ? 'text-orange fill-current' : 'text-muted'}
                    />
                  ))}
                </div>
                <p className="text-body mb-4">
                  "{language === 'ar' ? testimonial.text_ar : testimonial.text_en}"
                </p>
                <div className="text-caption text-muted">
                  <div className="font-medium">{testimonial.name}</div>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    {testimonial.district}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-border" style={{ borderColor: 'var(--border)' }}>
        <div className="metro-container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-subtitle font-medium mb-4 text-accent">
                {language === 'ar' ? 'غسيل عدن المتنقل' : 'Aden Mobile Wash'}
              </h3>
              <p className="text-body text-muted">
                {language === 'ar' 
                  ? 'خدمة غسيل السيارات المتنقلة الرائدة في عدن'
                  : 'Leading mobile car wash service in Aden'
                }
              </p>
            </div>
            
            <div>
              <h4 className="text-body font-medium mb-4">
                {language === 'ar' ? 'الخدمات' : 'Services'}
              </h4>
              <div className="space-y-2">
                {services.slice(0, 4).map((service) => (
                  <div key={service.id} className="text-body text-muted">
                    {language === 'ar' ? service.name_ar : service.name_en}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-body font-medium mb-4">
                {language === 'ar' ? 'مناطق الخدمة' : 'Service Areas'}
              </h4>
              <div className="space-y-2 text-body text-muted">
                <div>{language === 'ar' ? 'خورمكسر' : 'Khormaksar'}</div>
                <div>{language === 'ar' ? 'المعلا' : 'Al Mualla'}</div>
                <div>{language === 'ar' ? 'كريتر' : 'Crater'}</div>
                <div>{language === 'ar' ? 'التواهي' : 'Al Tawahi'}</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-body font-medium mb-4">
                {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </h4>
              <div className="space-y-2 text-body text-muted">
                <div>+967 777 123 456</div>
                <div>info@adenmobilewash.com</div>
                <div>
                  {language === 'ar' ? 'عدن، اليمن' : 'Aden, Yemen'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 mt-8 text-center text-caption text-muted">
            <p>
              © 2024 {language === 'ar' ? 'غسيل عدن المتنقل' : 'Aden Mobile Wash'}.{' '}
              {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
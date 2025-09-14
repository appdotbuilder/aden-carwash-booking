import { useState, useEffect } from 'react';
import { Clock, Users, User } from 'lucide-react';
import MetroHeader from './MetroHeader';
import { trpc } from '../utils/trpc';
import type { Service, Addon } from '../../../server/src/schema';

interface ServicesPageProps {
  language: 'ar' | 'en';
  isRTL: boolean;
  navigateToPage: (page: string) => void;
}

const ServicesPage = ({ language, isRTL, navigateToPage }: ServicesPageProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesData, addonsData] = await Promise.all([
          trpc.getServices.query({ visible_only: true, language }),
          trpc.getAddons.query({ visible_only: true, language })
        ]);

        setServices(servicesData);
        setAddons(addonsData);
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [language]);

  const text = {
    ar: {
      title: 'خدماتنا',
      subtitle: 'اختر من بين خدماتنا المتنوعة',
      pricing: {
        team: 'فريق كامل',
        solo: 'عامل واحد',
        duration: 'المدة المتوقعة',
        from: 'تبدأ من'
      },
      addons: {
        title: 'الخدمات الإضافية',
        subtitle: 'عزز تجربتك مع خدماتنا الإضافية'
      },
      faq: {
        title: 'أسئلة شائعة عن الخدمات',
        questions: [
          {
            q: 'ما الفرق بين خدمة الفريق والخدمة الفردية؟',
            a: 'خدمة الفريق تشمل 2-3 عمال لإنجاز العمل بسرعة أكبر، بينما الخدمة الفردية تشمل عامل واحد مختص بسعر أقل.'
          },
          {
            q: 'هل تشمل الأسعار المواد المستخدمة؟',
            a: 'نعم، جميع أسعارنا شاملة للمواد عالية الجودة والمعدات المتخصصة.'
          },
          {
            q: 'كم من الوقت يستغرق غسيل السيارة؟',
            a: 'يختلف الوقت حسب حجم السيارة ونوع الخدمة، ولكن عادة ما يكون بين 25-45 دقيقة.'
          }
        ]
      },
      cta: {
        bookNow: 'احجز الآن',
        bookService: 'احجز هذه الخدمة',
        selectService: 'اختر هذه الخدمة'
      }
    },
    en: {
      title: 'Our Services',
      subtitle: 'Choose from our variety of services',
      pricing: {
        team: 'Full Team',
        solo: 'Solo Worker',
        duration: 'Estimated Duration',
        from: 'Starting from'
      },
      addons: {
        title: 'Additional Services',
        subtitle: 'Enhance your experience with our add-on services'
      },
      faq: {
        title: 'Services FAQ',
        questions: [
          {
            q: 'What\'s the difference between team and solo service?',
            a: 'Team service includes 2-3 workers for faster completion, while solo service includes one specialized worker at a lower price.'
          },
          {
            q: 'Do prices include materials used?',
            a: 'Yes, all our prices include high-quality materials and specialized equipment.'
          },
          {
            q: 'How long does car washing take?',
            a: 'Time varies based on car size and service type, but usually takes between 25-45 minutes.'
          }
        ]
      },
      cta: {
        bookNow: 'Book Now',
        bookService: 'Book This Service',
        selectService: 'Select This Service'
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
      <section className="bg-surface py-16 px-4">
        <div className="metro-container text-center">
          <h1 className="text-display font-light mb-4">
            {t.title}
          </h1>
          <p className="text-subtitle text-muted max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4">
        <div className="metro-container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="tile p-6 h-auto">
                <h3 className="text-subtitle font-medium mb-3 text-accent">
                  {language === 'ar' ? service.name_ar : service.name_en}
                </h3>
                
                <p className="text-body text-muted mb-6 line-clamp-3">
                  {language === 'ar' ? service.desc_ar : service.desc_en}
                </p>

                {/* Pricing Table */}
                <div className="space-y-4 mb-6">
                  <div className="bg-surface p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-accent" />
                        <span className="text-body font-medium">{t.pricing.team}</span>
                      </div>
                      <span className="text-accent font-bold">{service.base_price_team} YER</span>
                    </div>
                    <div className="flex items-center gap-2 text-caption text-muted">
                      <Clock size={12} />
                      <span>{service.est_minutes} {language === 'ar' ? 'دقيقة' : 'min'}</span>
                    </div>
                  </div>

                  <div className="bg-surface p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-lime" />
                        <span className="text-body font-medium">{t.pricing.solo}</span>
                      </div>
                      <span className="text-lime font-bold">{service.base_price_solo} YER</span>
                    </div>
                    <div className="flex items-center gap-2 text-caption text-muted">
                      <Clock size={12} />
                      <span>{Math.ceil(service.est_minutes * 1.3)} {language === 'ar' ? 'دقيقة' : 'min'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigateToPage('booking')}
                  className="w-full bg-accent text-white py-3 hover:opacity-90 transition-opacity"
                >
                  {t.cta.bookService}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="py-16 px-4 bg-surface">
        <div className="metro-container">
          <div className="text-center mb-12">
            <h2 className="text-title font-light mb-4">
              {t.addons.title}
            </h2>
            <p className="text-subtitle text-muted">
              {t.addons.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {addons.map((addon) => (
              <div key={addon.id} className="tile p-4 h-auto">
                <h3 className="text-body font-medium mb-2">
                  {language === 'ar' ? addon.name_ar : addon.name_en}
                </h3>
                <p className="text-caption text-muted mb-3 line-clamp-2">
                  {language === 'ar' ? addon.desc_ar : addon.desc_en}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-accent font-bold">{addon.price} YER</span>
                  <span className="text-caption text-muted">
                    +{addon.est_minutes} {language === 'ar' ? 'دق' : 'min'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services FAQ */}
      <section className="py-16 px-4">
        <div className="metro-container max-w-4xl mx-auto">
          <h2 className="text-title font-light text-center mb-12">
            {t.faq.title}
          </h2>
          
          <div className="space-y-4">
            {t.faq.questions.map((item, index) => (
              <div key={index} className="tile p-6">
                <h3 className="text-subtitle font-medium mb-3 text-accent">
                  {item.q}
                </h3>
                <p className="text-body text-muted">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-accent text-white">
        <div className="metro-container text-center">
          <h2 className="text-title font-light mb-6">
            {language === 'ar' ? 'جاهز للحجز؟' : 'Ready to Book?'}
          </h2>
          <p className="text-subtitle mb-8 opacity-90">
            {language === 'ar' 
              ? 'احجز موعدك الآن واستمتع بخدمة غسيل متميزة'
              : 'Book your appointment now and enjoy premium car wash service'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              onClick={() => navigateToPage('booking')}
              className="bg-white text-accent px-8 py-4 text-body font-medium hover:opacity-90 transition-opacity"
            >
              {t.cta.bookNow}
            </button>
            <a
              href="https://wa.me/967777123456"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green text-white px-8 py-4 text-body font-medium hover:opacity-90 transition-opacity"
            >
              {language === 'ar' ? 'أو تواصل عبر الواتساب' : 'Or Contact via WhatsApp'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
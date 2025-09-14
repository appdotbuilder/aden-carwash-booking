import { useState, useEffect } from 'react';
import { Filter, MapPin, Tag } from 'lucide-react';
import MetroHeader from './MetroHeader';
import { trpc } from '../utils/trpc';
import type { GalleryMedia } from '../../../server/src/schema';

interface GalleryPageProps {
  language: 'ar' | 'en';
  isRTL: boolean;
  navigateToPage: (page: string) => void;
}

const GalleryPage = ({ language, isRTL, navigateToPage }: GalleryPageProps) => {
  const [allMedia, setAllMedia] = useState<GalleryMedia[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<GalleryMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'service' | 'district'>('all');
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        // Load gallery data from server
        const galleryData = await trpc.getGalleryMedia.query({ visible_only: true, language });
        
        // Fallback gallery data for development
        const fallbackGallery: GalleryMedia[] = [
          {
            id: 1,
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
            alt_ar: 'قبل وبعد - غسيل سيارة سيدان',
            alt_en: 'Before and after - sedan car wash',
            tags: ['before-after', 'sedan'],
            service_filter: 'standard',
            district_filter: 'khormaksar',
            order: 1,
            visible: true,
            created_at: new Date()
          },
          {
            id: 2,
            url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop',
            alt_ar: 'تنظيف داخلي للسيارة',
            alt_en: 'Car interior cleaning',
            tags: ['interior', 'premium'],
            service_filter: 'premium',
            district_filter: 'crater',
            order: 2,
            visible: true,
            created_at: new Date()
          },
          {
            id: 3,
            url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
            alt_ar: 'غسيل سيارة دفع رباعي',
            alt_en: 'SUV car wash',
            tags: ['suv', 'exterior'],
            service_filter: 'standard',
            district_filter: 'mualla',
            order: 3,
            visible: true,
            created_at: new Date()
          },
          {
            id: 4,
            url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop',
            alt_ar: 'تنظيف محرك السيارة',
            alt_en: 'Engine cleaning',
            tags: ['engine', 'detailed'],
            service_filter: 'detailed',
            district_filter: 'tawahi',
            order: 4,
            visible: true,
            created_at: new Date()
          },
          {
            id: 5,
            url: 'https://images.unsplash.com/photo-1607048548266-7f4fb13c3f7e?w=800&h=600&fit=crop',
            alt_ar: 'غسيل بيك اب',
            alt_en: 'Pickup truck wash',
            tags: ['pickup', 'commercial'],
            service_filter: 'commercial',
            district_filter: 'khormaksar',
            order: 5,
            visible: true,
            created_at: new Date()
          },
          {
            id: 6,
            url: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=800&h=600&fit=crop',
            alt_ar: 'تلميع وإشعاع السيارة',
            alt_en: 'Car polishing and shine',
            tags: ['polishing', 'premium'],
            service_filter: 'premium',
            district_filter: 'crater',
            order: 6,
            visible: true,
            created_at: new Date()
          }
        ];

        const finalGallery = galleryData.length > 0 ? galleryData : fallbackGallery;
        setAllMedia(finalGallery);
        setFilteredMedia(finalGallery);

        // Extract unique services and districts
        const services = [...new Set(finalGallery.map(m => m.service_filter).filter(Boolean) as string[])];
        const districts = [...new Set(finalGallery.map(m => m.district_filter).filter(Boolean) as string[])];
        
        setAvailableServices(services);
        setAvailableDistricts(districts);

      } catch (error) {
        console.error('Failed to load gallery:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, [language]);

  // Filter media based on selected filters
  useEffect(() => {
    let filtered = allMedia;

    if (selectedFilter === 'service' && selectedValue) {
      filtered = allMedia.filter(media => media.service_filter === selectedValue);
    } else if (selectedFilter === 'district' && selectedValue) {
      filtered = allMedia.filter(media => media.district_filter === selectedValue);
    }

    setFilteredMedia(filtered);
  }, [allMedia, selectedFilter, selectedValue]);

  const text = {
    ar: {
      title: 'معرض الأعمال',
      subtitle: 'شاهد نتائج أعمالنا قبل وبعد',
      filters: {
        all: 'عرض الكل',
        service: 'حسب الخدمة',
        district: 'حسب المنطقة',
        selectService: 'اختر الخدمة',
        selectDistrict: 'اختر المنطقة'
      },
      services: {
        standard: 'غسيل عادي',
        premium: 'غسيل مميز',
        detailed: 'غسيل تفصيلي',
        commercial: 'غسيل تجاري'
      },
      districts: {
        khormaksar: 'خورمكسر',
        crater: 'كريتر',
        mualla: 'المعلا',
        tawahi: 'التواهي'
      },
      stats: {
        title: 'إنجازاتنا',
        cars: 'سيارة',
        clients: 'عميل راضي',
        districts: 'منطقة خدمة',
        years: 'سنوات خبرة'
      },
      cta: {
        bookNow: 'احجز الآن',
        viewMore: 'شاهد المزيد'
      }
    },
    en: {
      title: 'Gallery',
      subtitle: 'See our work results before and after',
      filters: {
        all: 'Show All',
        service: 'By Service',
        district: 'By District',
        selectService: 'Select Service',
        selectDistrict: 'Select District'
      },
      services: {
        standard: 'Standard Wash',
        premium: 'Premium Wash',
        detailed: 'Detailed Wash',
        commercial: 'Commercial Wash'
      },
      districts: {
        khormaksar: 'Khormaksar',
        crater: 'Crater',
        mualla: 'Al Mualla',
        tawahi: 'Al Tawahi'
      },
      stats: {
        title: 'Our Achievements',
        cars: 'Cars',
        clients: 'Happy Clients',
        districts: 'Service Areas',
        years: 'Years Experience'
      },
      cta: {
        bookNow: 'Book Now',
        viewMore: 'View More'
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

      {/* Stats Section */}
      <section className="py-12 px-4 bg-accent text-white">
        <div className="metro-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-display font-light mb-2">2500+</div>
              <div className="text-body">{t.stats.cars}</div>
            </div>
            <div>
              <div className="text-display font-light mb-2">1200+</div>
              <div className="text-body">{t.stats.clients}</div>
            </div>
            <div>
              <div className="text-display font-light mb-2">8</div>
              <div className="text-body">{t.stats.districts}</div>
            </div>
            <div>
              <div className="text-display font-light mb-2">5</div>
              <div className="text-body">{t.stats.years}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 px-4 bg-surface">
        <div className="metro-container">
          <div className="flex items-center gap-4 mb-6">
            <Filter size={24} className="text-accent" />
            <h2 className="text-subtitle font-medium">{language === 'ar' ? 'فلترة النتائج' : 'Filter Results'}</h2>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Filter Type Buttons */}
            <button
              onClick={() => {
                setSelectedFilter('all');
                setSelectedValue('');
              }}
              className={`px-4 py-2 transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-accent text-white'
                  : 'bg-card text-text border border-border hover:border-accent'
              }`}
            >
              {t.filters.all}
            </button>

            <button
              onClick={() => setSelectedFilter('service')}
              className={`px-4 py-2 transition-colors ${
                selectedFilter === 'service'
                  ? 'bg-accent text-white'
                  : 'bg-card text-text border border-border hover:border-accent'
              }`}
            >
              {t.filters.service}
            </button>

            <button
              onClick={() => setSelectedFilter('district')}
              className={`px-4 py-2 transition-colors ${
                selectedFilter === 'district'
                  ? 'bg-accent text-white'
                  : 'bg-card text-text border border-border hover:border-accent'
              }`}
            >
              {t.filters.district}
            </button>

            {/* Service Dropdown */}
            {selectedFilter === 'service' && (
              <select
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                className="px-4 py-2 bg-card border border-border text-text"
              >
                <option value="">{t.filters.selectService}</option>
                {availableServices.map(service => (
                  <option key={service} value={service}>
                    {t.services[service as keyof typeof t.services] || service}
                  </option>
                ))}
              </select>
            )}

            {/* District Dropdown */}
            {selectedFilter === 'district' && (
              <select
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                className="px-4 py-2 bg-card border border-border text-text"
              >
                <option value="">{t.filters.selectDistrict}</option>
                {availableDistricts.map(district => (
                  <option key={district} value={district}>
                    {t.districts[district as keyof typeof t.districts] || district}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16 px-4">
        <div className="metro-container">
          {filteredMedia.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-subtitle text-muted">
                {language === 'ar' ? 'لا توجد صور متطابقة مع الفلتر المحدد' : 'No images match the selected filter'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMedia.map((media) => (
                <div key={media.id} className="tile p-0 overflow-hidden group">
                  <div className="relative">
                    <img
                      src={media.url}
                      alt={language === 'ar' ? media.alt_ar || '' : media.alt_en || ''}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-end">
                      <div className="p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-body font-medium mb-2">
                          {language === 'ar' ? media.alt_ar : media.alt_en}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-caption">
                          {media.service_filter && (
                            <div className="flex items-center gap-1">
                              <Tag size={12} />
                              <span>
                                {t.services[media.service_filter as keyof typeof t.services] || media.service_filter}
                              </span>
                            </div>
                          )}
                          
                          {media.district_filter && (
                            <div className="flex items-center gap-1">
                              <MapPin size={12} />
                              <span>
                                {t.districts[media.district_filter as keyof typeof t.districts] || media.district_filter}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-lime to-green text-white">
        <div className="metro-container text-center">
          <h2 className="text-title font-light mb-6">
            {language === 'ar' ? 'سيارتك التالية؟' : 'Your Next Car?'}
          </h2>
          <p className="text-subtitle mb-8 opacity-90">
            {language === 'ar' 
              ? 'احجز موعدك الآن واحصل على نفس النتائج المميزة'
              : 'Book your appointment now and get the same amazing results'
            }
          </p>
          
          <button
            onClick={() => navigateToPage('booking')}
            className="bg-white text-lime px-8 py-4 text-body font-medium hover:opacity-90 transition-opacity"
          >
            {t.cta.bookNow}
          </button>
        </div>
      </section>
    </div>
  );
};

export default GalleryPage;
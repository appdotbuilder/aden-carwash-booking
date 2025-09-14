import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, Tag, HelpCircle } from 'lucide-react';
import MetroHeader from './MetroHeader';
import { trpc } from '../utils/trpc';
import type { FAQ } from '../../../server/src/schema';

interface FAQPageProps {
  language: 'ar' | 'en';
  isRTL: boolean;
  navigateToPage: (page: string) => void;
}

const FAQPage = ({ language, isRTL, navigateToPage }: FAQPageProps) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        // Load FAQ data from server
        const faqsData = await trpc.getFAQs.query({ visible_only: true, language });
        
        // Fallback FAQ data for development
        const fallbackFaqs: FAQ[] = [
          {
            id: 1,
            q_ar: 'كم من الوقت يستغرق غسيل السيارة؟',
            q_en: 'How long does car washing take?',
            a_ar: 'يعتمد على نوع الخدمة: الغسيل العادي 25-30 دقيقة، الغسيل المميز 35-45 دقيقة، والغسيل التفصيلي 60-90 دقيقة.',
            a_en: 'Depends on service type: Standard wash 25-30 minutes, Premium wash 35-45 minutes, and Detailed wash 60-90 minutes.',
            order: 1,
            tags: ['time', 'service'],
            visible: true,
            created_at: new Date()
          },
          {
            id: 2,
            q_ar: 'هل تأتون إلى موقعي أم أحتاج لإحضار السيارة؟',
            q_en: 'Do you come to my location or do I need to bring the car?',
            a_ar: 'نحن خدمة متنقلة، نأتي إليك في أي مكان داخل مناطق خدمتنا في عدن. لا تحتاج لتحريك سيارتك.',
            a_en: 'We are a mobile service, we come to you anywhere within our service areas in Aden. You don\'t need to move your car.',
            order: 2,
            tags: ['location', 'mobile'],
            visible: true,
            created_at: new Date()
          },
          {
            id: 3,
            q_ar: 'ما هي مناطق الخدمة المتاحة؟',
            q_en: 'What are the available service areas?',
            a_ar: 'نخدم جميع مناطق عدن الرئيسية: خورمكسر، كريتر، المعلا، التواهي، دار سعد، البريقة، الشيخ عثمان، والمنصورة.',
            a_en: 'We serve all major areas of Aden: Khormaksar, Crater, Al Mualla, Al Tawahi, Dar Saad, Al Buraiqa, Sheikh Othman, and Al Mansoura.',
            order: 3,
            tags: ['location', 'areas'],
            visible: true,
            created_at: new Date()
          },
          {
            id: 4,
            q_ar: 'هل تستخدمون الماء المحلى أم العادي؟',
            q_en: 'Do you use desalinated or regular water?',
            a_ar: 'نستخدم الماء المحلى والمفلتر لضمان عدم ترك أي بقع أو رواسب على السيارة، خاصة في المناخ الساحلي لعدن.',
            a_en: 'We use desalinated and filtered water to ensure no spots or deposits are left on the car, especially in Aden\'s coastal climate.',
            order: 4,
            tags: ['water', 'quality'],
            visible: true,
            created_at: new Date()
          },
          {
            id: 5,
            q_ar: 'ما الفرق بين الغسيل الجماعي والفردي؟',
            q_en: 'What\'s the difference between team and solo wash?',
            a_ar: 'الغسيل الجماعي يشمل 2-3 عمال لسرعة أكبر وجودة أعلى. الغسيل الفردي يشمل عامل واحد مختص بسعر أقل.',
            a_en: 'Team wash includes 2-3 workers for greater speed and higher quality. Solo wash includes one specialized worker at a lower price.',
            order: 5,
            tags: ['service', 'pricing'],
            visible: true,
            created_at: new Date()
          },
          {
            id: 6,
            q_ar: 'هل يمكنني إلغاء أو تعديل الحجز؟',
            q_en: 'Can I cancel or modify my booking?',
            a_ar: 'يمكنك الإلغاء أو التعديل حتى ساعتين قبل الموعد المحدد بدون رسوم. بعد ذلك قد تطبق رسوم إلغاء.',
            a_en: 'You can cancel or modify up to 2 hours before the scheduled time without fees. After that, cancellation fees may apply.',
            order: 6,
            tags: ['booking', 'policy'],
            visible: true,
            created_at: new Date()
          },
          {
            id: 7,
            q_ar: 'ما هي أسعاركم؟',
            q_en: 'What are your prices?',
            a_ar: 'الأسعار تختلف حسب نوع السيارة والخدمة. الغسيل العادي يبدأ من 3000 ريال للسيدان، والخدمات الإضافية لها أسعار منفصلة.',
            a_en: 'Prices vary by car type and service. Standard wash starts from 3000 YER for sedan, with additional services having separate prices.',
            order: 7,
            tags: ['pricing', 'service'],
            visible: true,
            created_at: new Date()
          },
          {
            id: 8,
            q_ar: 'هل تقدمون ضمان على الخدمة؟',
            q_en: 'Do you provide service guarantee?',
            a_ar: 'نعم، نضمن رضاك التام أو نعيد الغسيل مجاناً خلال 24 ساعة. كما نقدم ضمان ضد البقع لمدة 48 ساعة.',
            a_en: 'Yes, we guarantee your complete satisfaction or re-wash for free within 24 hours. We also provide spot guarantee for 48 hours.',
            order: 8,
            tags: ['guarantee', 'quality'],
            visible: true,
            created_at: new Date()
          },
          {
            id: 9,
            q_ar: 'هل تقدمون خدمات للشركات؟',
            q_en: 'Do you provide services for companies?',
            a_ar: 'نعم، لدينا باقات خاصة للشركات وأساطيل السيارات مع خصومات تصل إلى 30% وجدولة ثابتة.',
            a_en: 'Yes, we have special packages for companies and car fleets with discounts up to 30% and fixed scheduling.',
            order: 9,
            tags: ['business', 'fleet'],
            visible: true,
            created_at: new Date()
          },
          {
            id: 10,
            q_ar: 'كيف يمكنني الدفع؟',
            q_en: 'How can I pay?',
            a_ar: 'نقبل الدفع النقدي عند الخدمة، التحويل البنكي، أو الدفع الإلكتروني عبر التطبيقات المحلية.',
            a_en: 'We accept cash payment upon service, bank transfer, or electronic payment via local apps.',
            order: 10,
            tags: ['payment', 'methods'],
            visible: true,
            created_at: new Date()
          }
        ];

        const finalFaqs = faqsData.length > 0 ? faqsData : fallbackFaqs;
        setFaqs(finalFaqs);
        setFilteredFaqs(finalFaqs);

        // Extract unique tags
        const allTags = finalFaqs.flatMap(faq => faq.tags);
        const uniqueTags = [...new Set(allTags)];
        setAvailableTags(uniqueTags);

      } catch (error) {
        console.error('Failed to load FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFaqs();
  }, [language]);

  // Filter FAQs based on search and tag
  useEffect(() => {
    let filtered = faqs;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(faq => {
        const question = language === 'ar' ? faq.q_ar.toLowerCase() : faq.q_en.toLowerCase();
        const answer = language === 'ar' ? faq.a_ar.toLowerCase() : faq.a_en.toLowerCase();
        return question.includes(query) || answer.includes(query);
      });
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(faq => faq.tags.includes(selectedTag));
    }

    setFilteredFaqs(filtered);
  }, [faqs, searchQuery, selectedTag, language]);

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const text = {
    ar: {
      title: 'الأسئلة الشائعة',
      subtitle: 'إجابات على أكثر الأسئلة شيوعاً حول خدماتنا',
      search: {
        placeholder: 'ابحث في الأسئلة الشائعة...',
        noResults: 'لا توجد نتائج مطابقة لبحثك'
      },
      tags: {
        all: 'عرض الكل',
        time: 'الوقت',
        service: 'الخدمة',
        location: 'الموقع',
        mobile: 'متنقل',
        areas: 'المناطق',
        water: 'الماء',
        quality: 'الجودة',
        pricing: 'الأسعار',
        booking: 'الحجز',
        policy: 'السياسة',
        guarantee: 'الضمان',
        business: 'الشركات',
        fleet: 'الأساطيل',
        payment: 'الدفع',
        methods: 'الطرق'
      },
      contact: {
        title: 'لم تجد إجابة سؤالك؟',
        subtitle: 'تواصل معنا وسنكون سعداء لمساعدتك',
        whatsapp: 'تواصل عبر الواتساب',
        call: 'اتصل بنا'
      },
      stats: {
        totalFaqs: 'سؤال شائع',
        categories: 'فئة',
        responseTime: 'ساعة متوسط الرد'
      }
    },
    en: {
      title: 'Frequently Asked Questions',
      subtitle: 'Answers to the most common questions about our services',
      search: {
        placeholder: 'Search in FAQs...',
        noResults: 'No results match your search'
      },
      tags: {
        all: 'Show All',
        time: 'Time',
        service: 'Service',
        location: 'Location',
        mobile: 'Mobile',
        areas: 'Areas',
        water: 'Water',
        quality: 'Quality',
        pricing: 'Pricing',
        booking: 'Booking',
        policy: 'Policy',
        guarantee: 'Guarantee',
        business: 'Business',
        fleet: 'Fleet',
        payment: 'Payment',
        methods: 'Methods'
      },
      contact: {
        title: 'Didn\'t find your answer?',
        subtitle: 'Contact us and we\'ll be happy to help you',
        whatsapp: 'Contact via WhatsApp',
        call: 'Call Us'
      },
      stats: {
        totalFaqs: 'FAQs',
        categories: 'Categories',
        responseTime: 'Hrs Avg Response'
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
          <HelpCircle size={64} className="text-accent mx-auto mb-6" />
          <h1 className="text-display font-light mb-4">
            {t.title}
          </h1>
          <p className="text-subtitle text-muted max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 px-4 bg-accent text-white">
        <div className="metro-container">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-title font-light mb-2">{faqs.length}+</div>
              <div className="text-body">{t.stats.totalFaqs}</div>
            </div>
            <div>
              <div className="text-title font-light mb-2">{availableTags.length}</div>
              <div className="text-body">{t.stats.categories}</div>
            </div>
            <div>
              <div className="text-title font-light mb-2">2</div>
              <div className="text-body">{t.stats.responseTime}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 px-4 bg-surface">
        <div className="metro-container max-w-4xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search.placeholder}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border text-text focus:border-accent outline-none"
            />
          </div>

          {/* Tag Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag('')}
              className={`px-4 py-2 text-sm transition-colors ${
                !selectedTag
                  ? 'bg-accent text-white'
                  : 'bg-card text-text border border-border hover:border-accent'
              }`}
            >
              {t.tags.all}
            </button>

            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                  selectedTag === tag
                    ? 'bg-accent text-white'
                    : 'bg-card text-text border border-border hover:border-accent'
                }`}
              >
                <Tag size={14} />
                {t.tags[tag as keyof typeof t.tags] || tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16 px-4">
        <div className="metro-container max-w-4xl mx-auto">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16">
              <Search size={48} className="text-muted mx-auto mb-4" />
              <p className="text-subtitle text-muted">
                {t.search.noResults}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="tile overflow-hidden">
                  <button
                    onClick={() => toggleExpanded(faq.id)}
                    className="w-full p-6 text-left hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-subtitle font-medium pr-4">
                        {language === 'ar' ? faq.q_ar : faq.q_en}
                      </h3>
                      {expandedItems.includes(faq.id) ? (
                        <ChevronUp size={24} className="text-accent flex-shrink-0" />
                      ) : (
                        <ChevronDown size={24} className="text-accent flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {expandedItems.includes(faq.id) && (
                    <div className="px-6 pb-6">
                      <div className="border-t border-border pt-4">
                        <p className="text-body text-muted leading-relaxed">
                          {language === 'ar' ? faq.a_ar : faq.a_en}
                        </p>
                        
                        {faq.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {faq.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-surface text-muted text-caption border border-border"
                              >
                                {t.tags[tag as keyof typeof t.tags] || tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-lime to-teal text-white">
        <div className="metro-container text-center max-w-3xl mx-auto">
          <h2 className="text-title font-light mb-4">
            {t.contact.title}
          </h2>
          <p className="text-subtitle mb-8 opacity-90">
            {t.contact.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <a
              href="https://wa.me/967777123456"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-lime px-8 py-4 text-body font-medium hover:opacity-90 transition-opacity"
            >
              {t.contact.whatsapp}
            </a>
            <a
              href="tel:+967777123456"
              className="bg-green text-white px-8 py-4 text-body font-medium hover:opacity-90 transition-opacity"
            >
              {t.contact.call}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;
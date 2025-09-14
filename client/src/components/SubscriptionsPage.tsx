import { useState, useEffect } from 'react';
import { Check, Star } from 'lucide-react';
import MetroHeader from './MetroHeader';

import type { Plan } from '../../../server/src/schema';

interface SubscriptionsPageProps {
  language: 'ar' | 'en';
  isRTL: boolean;
  navigateToPage: (page: string) => void;
}

const SubscriptionsPage = ({ language, isRTL, navigateToPage }: SubscriptionsPageProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load subscription plans - fallback data for development
    const loadPlans = async () => {
      // TODO: Implement trpc.getPlans.query() when available
      const fallbackPlans: Plan[] = [
      {
        id: 1,
        code: 'lite',
        name_ar: 'باقة لايت',
        name_en: 'Lite Plan',
        desc_ar: 'الباقة الأساسية للاستخدام المنتظم',
        desc_en: 'Basic plan for regular use',
        price: 25000,
        benefits_ar: [
          '4 غسلات شهرياً',
          'خصم 15% على جميع الخدمات',
          'أولوية في الحجز',
          'دعم عبر الواتساب'
        ],
        benefits_en: [
          '4 washes per month',
          '15% discount on all services',
          'Priority booking',
          'WhatsApp support'
        ],
        visible: true,
        created_at: new Date()
      },
      {
        id: 2,
        code: 'plus',
        name_ar: 'باقة بلس',
        name_en: 'Plus Plan',
        desc_ar: 'الباقة المتقدمة مع مزايا إضافية',
        desc_en: 'Advanced plan with additional benefits',
        price: 45000,
        benefits_ar: [
          '8 غسلات شهرياً',
          'خصم 25% على جميع الخدمات',
          'أولوية عالية في الحجز',
          'خدمة التنظيف الداخلي مجاناً',
          'دعم على مدار الساعة',
          'غسلة طوارئ مجانية شهرياً'
        ],
        benefits_en: [
          '8 washes per month',
          '25% discount on all services',
          'High priority booking',
          'Free interior cleaning',
          '24/7 support',
          'Free emergency wash monthly'
        ],
        visible: true,
        created_at: new Date()
      }
    ];

      setPlans(fallbackPlans);
      setLoading(false);
    };
    
    loadPlans();
  }, []);

  const text = {
    ar: {
      title: 'باقات الاشتراك',
      subtitle: 'وفر أكثر مع باقاتنا الشهرية',
      popular: 'الأكثر شعبية',
      monthlyPrice: 'ريال يمني / شهرياً',
      features: 'المميزات',
      cta: {
        subscribe: 'اشترك الآن',
        contact: 'تواصل للاشتراك'
      },
      comparison: {
        title: 'مقارنة الباقات',
        feature: 'الخاصية',
        lite: 'لايت',
        plus: 'بلس',
        washes: 'عدد الغسلات',
        discount: 'نسبة الخصم',
        priority: 'أولوية الحجز',
        interior: 'تنظيف داخلي مجاني',
        support: 'الدعم الفني',
        emergency: 'غسلة طوارئ'
      },
      faq: {
        title: 'أسئلة شائعة عن الاشتراكات',
        questions: [
          {
            q: 'كيف يعمل نظام الاشتراك؟',
            a: 'تدفع مبلغاً شهرياً ثابتاً وتحصل على عدد محدد من الغسلات مع خصومات وخدمات إضافية.'
          },
          {
            q: 'هل يمكنني إلغاء الاشتراك في أي وقت؟',
            a: 'نعم، يمكنك إلغاء الاشتراك في أي وقت. سيستمر اشتراكك حتى نهاية الدورة المدفوعة.'
          },
          {
            q: 'ماذا يحدث للغسلات غير المستخدمة؟',
            a: 'الغسلات غير المستخدمة لا تنتقل للشهر التالي، لكن يمكنك استخدامها جميعاً خلال الشهر.'
          },
          {
            q: 'هل الخصم يشمل الخدمات الإضافية؟',
            a: 'نعم، الخصم يشمل جميع خدماتنا بما في ذلك الخدمات الإضافية والمنتجات الخاصة.'
          }
        ]
      }
    },
    en: {
      title: 'Subscription Plans',
      subtitle: 'Save more with our monthly packages',
      popular: 'Most Popular',
      monthlyPrice: 'YER / month',
      features: 'Features',
      cta: {
        subscribe: 'Subscribe Now',
        contact: 'Contact to Subscribe'
      },
      comparison: {
        title: 'Plans Comparison',
        feature: 'Feature',
        lite: 'Lite',
        plus: 'Plus',
        washes: 'Number of Washes',
        discount: 'Discount Percentage',
        priority: 'Booking Priority',
        interior: 'Free Interior Cleaning',
        support: 'Technical Support',
        emergency: 'Emergency Wash'
      },
      faq: {
        title: 'Subscription FAQ',
        questions: [
          {
            q: 'How does the subscription system work?',
            a: 'You pay a fixed monthly amount and get a specific number of washes with discounts and additional services.'
          },
          {
            q: 'Can I cancel my subscription at any time?',
            a: 'Yes, you can cancel your subscription at any time. Your subscription will continue until the end of the paid cycle.'
          },
          {
            q: 'What happens to unused washes?',
            a: 'Unused washes don\'t carry over to the next month, but you can use them all within the month.'
          },
          {
            q: 'Does the discount include additional services?',
            a: 'Yes, the discount includes all our services including add-ons and special products.'
          }
        ]
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

      {/* Plans Grid */}
      <section className="py-16 px-4">
        <div className="metro-container">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={plan.id} 
                className={`tile p-8 h-auto relative ${index === 1 ? 'border-accent scale-105' : ''}`}
              >
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-white px-4 py-1 text-caption">
                    {t.popular}
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-title font-medium mb-2 text-accent">
                    {language === 'ar' ? plan.name_ar : plan.name_en}
                  </h3>
                  <p className="text-body text-muted mb-4">
                    {language === 'ar' ? plan.desc_ar : plan.desc_en}
                  </p>
                  <div className="text-display font-light text-accent mb-2">
                    {plan.price.toLocaleString()}
                  </div>
                  <div className="text-caption text-muted">
                    {t.monthlyPrice}
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-subtitle font-medium mb-4 flex items-center gap-2">
                    <Star size={20} className="text-accent" />
                    {t.features}
                  </h4>
                  <ul className="space-y-3">
                    {(language === 'ar' ? plan.benefits_ar : plan.benefits_en).map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-start gap-3">
                        <Check size={16} className="text-green mt-1 flex-shrink-0" />
                        <span className="text-body">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="https://wa.me/967777123456"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3 text-center block font-medium hover:opacity-90 transition-opacity ${
                    index === 1 
                      ? 'bg-accent text-white' 
                      : 'bg-green text-white'
                  }`}
                >
                  {t.cta.contact}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Comparison */}
      <section className="py-16 px-4 bg-surface">
        <div className="metro-container">
          <h2 className="text-title font-light text-center mb-12">
            {t.comparison.title}
          </h2>

          <div className="max-w-4xl mx-auto">
            <div className="tile overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-body font-medium">
                        {t.comparison.feature}
                      </th>
                      <th className="text-center p-4 text-body font-medium text-accent">
                        {t.comparison.lite}
                      </th>
                      <th className="text-center p-4 text-body font-medium text-accent">
                        {t.comparison.plus}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-4 text-body">{t.comparison.washes}</td>
                      <td className="p-4 text-center">4</td>
                      <td className="p-4 text-center">8</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4 text-body">{t.comparison.discount}</td>
                      <td className="p-4 text-center">15%</td>
                      <td className="p-4 text-center">25%</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4 text-body">{t.comparison.priority}</td>
                      <td className="p-4 text-center">
                        <Check size={20} className="text-green mx-auto" />
                      </td>
                      <td className="p-4 text-center">
                        <Check size={20} className="text-green mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4 text-body">{t.comparison.interior}</td>
                      <td className="p-4 text-center">-</td>
                      <td className="p-4 text-center">
                        <Check size={20} className="text-green mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4 text-body">{t.comparison.support}</td>
                      <td className="p-4 text-center text-caption">
                        {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                      </td>
                      <td className="p-4 text-center text-caption">24/7</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-body">{t.comparison.emergency}</td>
                      <td className="p-4 text-center">-</td>
                      <td className="p-4 text-center">
                        <Check size={20} className="text-green mx-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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
      <section className="py-16 px-4 bg-gradient-to-r from-accent to-teal text-white">
        <div className="metro-container text-center">
          <h2 className="text-title font-light mb-6">
            {language === 'ar' ? 'ابدأ توفيرك اليوم' : 'Start Saving Today'}
          </h2>
          <p className="text-subtitle mb-8 opacity-90">
            {language === 'ar' 
              ? 'انضم لآلاف العملاء الذين يوفرون مع باقاتنا الشهرية'
              : 'Join thousands of customers who save with our monthly plans'
            }
          </p>
          
          <a
            href="https://wa.me/967777123456"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-accent px-8 py-4 text-body font-medium hover:opacity-90 transition-opacity inline-block"
          >
            {language === 'ar' ? 'تواصل معنا للاشتراك' : 'Contact Us to Subscribe'}
          </a>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionsPage;
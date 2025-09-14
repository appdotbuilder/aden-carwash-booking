import { useState } from 'react';
import { Building2, Users, Clock, Shield, CheckCircle, Download } from 'lucide-react';
import MetroHeader from './MetroHeader';
import { trpc } from '../utils/trpc';
import type { CreateFleetLeadInput } from '../../../server/src/schema';

interface BusinessPageProps {
  language: 'ar' | 'en';
  isRTL: boolean;
  navigateToPage: (page: string) => void;
}

const BusinessPage = ({ language, isRTL, navigateToPage }: BusinessPageProps) => {
  const [formData, setFormData] = useState<CreateFleetLeadInput>({
    company_name: '',
    contact_person: '',
    phone: '',
    status: 'new',
    notes: null
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const text = {
    ar: {
      hero: {
        title: 'حلول غسيل السيارات للشركات',
        subtitle: 'خدمات متخصصة لأساطيل الشركات والمؤسسات في عدن',
        cta: 'جرب 10 سيارات مجاناً'
      },
      benefits: {
        title: 'لماذا تختار خدماتنا للشركات؟',
        items: [
          {
            icon: Clock,
            title: 'توفير الوقت',
            desc: 'نأتي إليكم في مقر العمل، لا حاجة لتحريك السيارات'
          },
          {
            icon: Users,
            title: 'فريق متخصص',
            desc: 'فرق مدربة للتعامل مع أساطيل كبيرة بكفاءة عالية'
          },
          {
            icon: Shield,
            title: 'ضمان الجودة',
            desc: 'اتفاقيات خدمة مضمونة مع تقارير أداء شهرية'
          },
          {
            icon: Building2,
            title: 'أسعار تنافسية',
            desc: 'خصومات خاصة للأساطيل الكبيرة والعقود طويلة الأمد'
          }
        ]
      },
      services: {
        title: 'خدماتنا للشركات',
        regular: {
          title: 'الصيانة الدورية',
          desc: 'جدولة ثابتة لغسيل الأسطول',
          features: ['غسيل أسبوعي أو شهري', 'تنظيف داخلي وخارجي', 'تقارير حالة السيارات']
        },
        ondemand: {
          title: 'الخدمة عند الطلب',
          desc: 'خدمة فورية للمناسبات الخاصة',
          features: ['استجابة سريعة', 'خدمة 24/7', 'فرق متعددة متاحة']
        },
        premium: {
          title: 'الخدمة المميزة',
          desc: 'حلول شاملة للشركات الكبرى',
          features: ['مدير حساب مخصص', 'خصومات حتى 30%', 'خدمات إضافية مجانية']
        }
      },
      trial: {
        title: 'جرب خدماتنا مجاناً',
        subtitle: 'احصل على تجربة مجانية لغسيل 10 سيارات من أسطولك',
        form: {
          company: 'اسم الشركة',
          contact: 'اسم الشخص المسؤول',
          phone: 'رقم الهاتف',
          notes: 'ملاحظات إضافية (اختياري)',
          notesPlaceholder: 'حجم الأسطول، نوع السيارات، المواعيد المفضلة...',
          submit: 'طلب التجربة المجانية',
          submitting: 'جارٍ الإرسال...'
        },
        success: {
          title: 'تم إرسال طلبك بنجاح!',
          message: 'سيتواصل معك فريقنا خلال 24 ساعة لترتيب التجربة المجانية.'
        }
      },
      sla: {
        title: 'اتفاقية مستوى الخدمة',
        subtitle: 'تحميل نموذج اتفاقية الخدمة للشركات',
        download: 'تحميل ملف PDF',
        features: [
          'ضمانات الجودة والوقت',
          'معايير الأداء المطلوبة',
          'آليات التعامل مع الشكاوى',
          'شروط وأحكام الخدمة'
        ]
      },
      testimonials: {
        title: 'ماذا يقول عملاؤنا من الشركات',
        items: [
          {
            company: 'شركة عدن للنقل',
            contact: 'محمد أحمد - مدير الأسطول',
            text: 'خدمة ممتازة وموثوقة. وفرت علينا الكثير من الوقت والجهد في صيانة أسطولنا.'
          },
          {
            company: 'مجموعة الحكيمي التجارية',
            contact: 'سارة علي - منسقة العمليات',
            text: 'فريق محترف والتزام بالمواعيد. أسعارهم تنافسية جداً مقارنة بالسوق.'
          }
        ]
      }
    },
    en: {
      hero: {
        title: 'Corporate Car Wash Solutions',
        subtitle: 'Specialized services for company and institutional fleets in Aden',
        cta: 'Try 10 Cars Free'
      },
      benefits: {
        title: 'Why Choose Our Corporate Services?',
        items: [
          {
            icon: Clock,
            title: 'Time Saving',
            desc: 'We come to your workplace, no need to move vehicles'
          },
          {
            icon: Users,
            title: 'Specialized Team',
            desc: 'Trained teams to handle large fleets with high efficiency'
          },
          {
            icon: Shield,
            title: 'Quality Guarantee',
            desc: 'Guaranteed service agreements with monthly performance reports'
          },
          {
            icon: Building2,
            title: 'Competitive Pricing',
            desc: 'Special discounts for large fleets and long-term contracts'
          }
        ]
      },
      services: {
        title: 'Our Corporate Services',
        regular: {
          title: 'Regular Maintenance',
          desc: 'Fixed scheduling for fleet washing',
          features: ['Weekly or monthly washing', 'Interior and exterior cleaning', 'Vehicle condition reports']
        },
        ondemand: {
          title: 'On-Demand Service',
          desc: 'Immediate service for special occasions',
          features: ['Quick response', '24/7 service', 'Multiple teams available']
        },
        premium: {
          title: 'Premium Service',
          desc: 'Comprehensive solutions for major companies',
          features: ['Dedicated account manager', 'Discounts up to 30%', 'Free additional services']
        }
      },
      trial: {
        title: 'Try Our Services for Free',
        subtitle: 'Get a free trial for washing 10 cars from your fleet',
        form: {
          company: 'Company Name',
          contact: 'Contact Person',
          phone: 'Phone Number',
          notes: 'Additional Notes (Optional)',
          notesPlaceholder: 'Fleet size, vehicle types, preferred times...',
          submit: 'Request Free Trial',
          submitting: 'Submitting...'
        },
        success: {
          title: 'Your request has been sent successfully!',
          message: 'Our team will contact you within 24 hours to arrange the free trial.'
        }
      },
      sla: {
        title: 'Service Level Agreement',
        subtitle: 'Download sample service agreement for companies',
        download: 'Download PDF',
        features: [
          'Quality and time guarantees',
          'Required performance standards',
          'Complaint handling procedures',
          'Service terms and conditions'
        ]
      },
      testimonials: {
        title: 'What Our Corporate Clients Say',
        items: [
          {
            company: 'Aden Transport Company',
            contact: 'Mohammed Ahmed - Fleet Manager',
            text: 'Excellent and reliable service. Saved us a lot of time and effort in maintaining our fleet.'
          },
          {
            company: 'Al-Hakimi Commercial Group',
            contact: 'Sara Ali - Operations Coordinator',
            text: 'Professional team and punctual. Their prices are very competitive compared to the market.'
          }
        ]
      }
    }
  };

  const t = text[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await trpc.createFleetLead.mutate(formData);
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit fleet lead:', error);
      alert(language === 'ar' ? 'حدث خطأ، حاول مرة أخرى' : 'Error occurred, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <MetroHeader language={language} isRTL={isRTL} navigateToPage={navigateToPage} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-accent to-teal text-white py-20 px-4">
        <div className="metro-container text-center">
          <h1 className="text-display font-light mb-6">
            {t.hero.title}
          </h1>
          <p className="text-subtitle mb-8 opacity-90 max-w-3xl mx-auto">
            {t.hero.subtitle}
          </p>
          
          <a
            href="#trial"
            className="bg-white text-accent px-8 py-4 text-body font-medium hover:opacity-90 transition-opacity inline-block"
          >
            {t.hero.cta}
          </a>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="metro-container">
          <h2 className="text-title font-light text-center mb-12">
            {t.benefits.title}
          </h2>
          
          <div className="grid-tiles">
            {t.benefits.items.map((benefit, index) => (
              <div key={index} className="tile p-6 h-64 flex flex-col">
                <benefit.icon size={40} className="text-accent mb-4" />
                <h3 className="text-subtitle font-medium mb-3">
                  {benefit.title}
                </h3>
                <p className="text-body text-muted">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 bg-surface">
        <div className="metro-container">
          <h2 className="text-title font-light text-center mb-12">
            {t.services.title}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {Object.entries(t.services).filter(([key]) => key !== 'title').map(([key, service]) => {
              if (typeof service === 'string') return null;
              return (
              <div key={key} className="tile p-6 h-auto">
                <h3 className="text-subtitle font-medium mb-3 text-accent">
                  {service.title}
                </h3>
                <p className="text-body text-muted mb-6">
                  {service.desc}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-green flex-shrink-0" />
                      <span className="text-body">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* Free Trial Section */}
      <section id="trial" className="py-16 px-4">
        <div className="metro-container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-title font-light mb-4">
              {t.trial.title}
            </h2>
            <p className="text-subtitle text-muted">
              {t.trial.subtitle}
            </p>
          </div>

          <div className="tile p-8">
            {submitted ? (
              <div className="text-center">
                <CheckCircle size={64} className="text-green mx-auto mb-6" />
                <h3 className="text-title font-medium mb-4 text-green">
                  {t.trial.success.title}
                </h3>
                <p className="text-body text-muted">
                  {t.trial.success.message}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-body font-medium mb-2">
                    {t.trial.form.company} *
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ ...prev, company_name: e.target.value }))
                    }
                    className="w-full p-3 bg-card border border-border text-text"
                    required
                  />
                </div>

                <div>
                  <label className="block text-body font-medium mb-2">
                    {t.trial.form.contact} *
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ ...prev, contact_person: e.target.value }))
                    }
                    className="w-full p-3 bg-card border border-border text-text"
                    required
                  />
                </div>

                <div>
                  <label className="block text-body font-medium mb-2">
                    {t.trial.form.phone} *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="+967 777 123 456"
                    className="w-full p-3 bg-card border border-border text-text"
                    required
                  />
                </div>

                <div>
                  <label className="block text-body font-medium mb-2">
                    {t.trial.form.notes}
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData(prev => ({ ...prev, notes: e.target.value || null }))
                    }
                    placeholder={t.trial.form.notesPlaceholder}
                    rows={4}
                    className="w-full p-3 bg-card border border-border text-text resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-accent text-white py-4 text-body font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="loading-dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                      <span>{t.trial.form.submitting}</span>
                    </>
                  ) : (
                    t.trial.form.submit
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* SLA Section */}
      <section className="py-16 px-4 bg-surface">
        <div className="metro-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-title font-light mb-6">
                {t.sla.title}
              </h2>
              <p className="text-body text-muted mb-8">
                {t.sla.subtitle}
              </p>
              
              <ul className="space-y-3 mb-8">
                {t.sla.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-green flex-shrink-0" />
                    <span className="text-body">{feature}</span>
                  </li>
                ))}
              </ul>

              <button className="bg-red text-white px-6 py-3 text-body font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                <Download size={20} />
                {t.sla.download}
              </button>
            </div>
            
            <div className="tile p-8 text-center">
              <Building2 size={80} className="text-accent mx-auto mb-6" />
              <h3 className="text-subtitle font-medium mb-4">
                {language === 'ar' ? 'خدمة احترافية' : 'Professional Service'}
              </h3>
              <p className="text-body text-muted">
                {language === 'ar' 
                  ? 'نضمن لك أعلى معايير الجودة والالتزام بالمواعيد المحددة'
                  : 'We guarantee the highest quality standards and adherence to scheduled times'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="metro-container">
          <h2 className="text-title font-light text-center mb-12">
            {t.testimonials.title}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {t.testimonials.items.map((testimonial, index) => (
              <div key={index} className="tile p-6">
                <p className="text-body mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <div className="font-medium text-accent">
                    {testimonial.company}
                  </div>
                  <div className="text-caption text-muted">
                    {testimonial.contact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-accent text-white">
        <div className="metro-container text-center">
          <h2 className="text-title font-light mb-6">
            {language === 'ar' ? 'ابدأ مع حلولنا للشركات اليوم' : 'Start with Our Corporate Solutions Today'}
          </h2>
          <p className="text-subtitle mb-8 opacity-90">
            {language === 'ar' 
              ? 'انضم لعشرات الشركات التي تثق في خدماتنا المتخصصة'
              : 'Join dozens of companies that trust our specialized services'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <a
              href="#trial"
              className="bg-white text-accent px-8 py-4 text-body font-medium hover:opacity-90 transition-opacity"
            >
              {language === 'ar' ? 'احصل على تجربة مجانية' : 'Get Free Trial'}
            </a>
            <a
              href="https://wa.me/967777123456"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green text-white px-8 py-4 text-body font-medium hover:opacity-90 transition-opacity"
            >
              {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BusinessPage;
import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin, Calendar } from 'lucide-react';
import { trpc } from '../utils/trpc';
import type { Service, Addon, Zone, CreateBookingInput } from '../../../server/src/schema';

interface BookingWizardProps {
  language: 'ar' | 'en';
  isRTL: boolean;
  navigateToPage: (page: string) => void;
}

interface BookingState {
  step: number;
  service: Service | null;
  addons: Addon[];
  carType: 'sedan' | 'suv' | 'pickup';
  zone: Zone | null;
  addressText: string;
  geoPoint: { lat: number; lng: number } | null;
  scheduledWindow: { start: string; end: string } | null;
  customer: { name: string; phone: string };
  isSolo: boolean;
  priceTotal: number;
}

const BookingWizard = ({ language, isRTL, navigateToPage }: BookingWizardProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [booking, setBooking] = useState<BookingState>({
    step: 1,
    service: null,
    addons: [],
    carType: 'sedan',
    zone: null,
    addressText: '',
    geoPoint: null,
    scheduledWindow: null,
    customer: { name: '', phone: '' },
    isSolo: false,
    priceTotal: 0
  });

  const text = {
    ar: {
      title: 'حجز موعد جديد',
      steps: [
        'اختر الخدمة',
        'نوع السيارة',
        'الموقع',
        'الوقت',
        'التواصل',
        'التأكيد'
      ],
      service: {
        title: 'اختر الخدمة المطلوبة',
        addons: 'خدمات إضافية',
        teamPrice: 'سعر الفريق',
        soloPrice: 'سعر فردي',
        duration: 'المدة المتوقعة'
      },
      carType: {
        title: 'نوع السيارة',
        sedan: 'سيدان',
        suv: 'دفع رباعي',
        pickup: 'بيك اب'
      },
      location: {
        title: 'تحديد الموقع',
        zone: 'المنطقة',
        address: 'العنوان التفصيلي',
        addressPlaceholder: 'مثال: شارع الثورة، بالقرب من المستشفى...'
      },
      timing: {
        title: 'اختيار الوقت',
        selectTime: 'اختر الوقت المفضل'
      },
      contact: {
        title: 'معلومات التواصل',
        name: 'الاسم الكامل',
        phone: 'رقم الواتساب',
        phonePlaceholder: '+967 777 123 456'
      },
      confirm: {
        title: 'تأكيد الحجز',
        service: 'الخدمة',
        addons: 'الإضافات',
        carType: 'نوع السيارة',
        location: 'الموقع',
        time: 'الوقت',
        total: 'المجموع'
      },
      buttons: {
        next: 'التالي',
        back: 'السابق',
        confirm: 'تأكيد الحجز',
        home: 'العودة للرئيسية'
      }
    },
    en: {
      title: 'Book New Appointment',
      steps: [
        'Select Service',
        'Car Type',
        'Location',
        'Time',
        'Contact',
        'Confirm'
      ],
      service: {
        title: 'Select Required Service',
        addons: 'Additional Services',
        teamPrice: 'Team Price',
        soloPrice: 'Solo Price',
        duration: 'Estimated Duration'
      },
      carType: {
        title: 'Car Type',
        sedan: 'Sedan',
        suv: 'SUV',
        pickup: 'Pickup'
      },
      location: {
        title: 'Select Location',
        zone: 'Zone',
        address: 'Detailed Address',
        addressPlaceholder: 'Example: Revolution Street, near the hospital...'
      },
      timing: {
        title: 'Select Time',
        selectTime: 'Choose preferred time'
      },
      contact: {
        title: 'Contact Information',
        name: 'Full Name',
        phone: 'WhatsApp Number',
        phonePlaceholder: '+967 777 123 456'
      },
      confirm: {
        title: 'Confirm Booking',
        service: 'Service',
        addons: 'Add-ons',
        carType: 'Car Type',
        location: 'Location',
        time: 'Time',
        total: 'Total'
      },
      buttons: {
        next: 'Next',
        back: 'Back',
        confirm: 'Confirm Booking',
        home: 'Back to Home'
      }
    }
  };

  const t = text[language];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesData, addonsData, zonesData] = await Promise.all([
          trpc.getServices.query({ visible_only: true, language }),
          trpc.getAddons.query({ visible_only: true, language }),
          trpc.getZones.query()
        ]);

        setServices(servicesData);
        setAllAddons(addonsData);
        setZones(zonesData);
      } catch (error) {
        console.error('Failed to load booking data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [language]);

  // Calculate price when booking details change
  useEffect(() => {
    if (booking.service) {
      const calculatePrice = async () => {
        try {
          if (booking.service && booking.zone && booking.geoPoint) {
            const pricing = await trpc.calculatePricing.query({
              service_id: booking.service.id,
              addons: booking.addons.map(a => a.id),
              car_type: booking.carType,
              is_solo: booking.isSolo,
              zone_id: booking.zone.id,
              geo_point: booking.geoPoint
            });
            
            setBooking(prev => ({ ...prev, priceTotal: pricing.total_price }));
          }
        } catch (error) {
          console.error('Failed to calculate pricing:', error);
        }
      };

      calculatePrice();
    }
  }, [booking.service, booking.addons, booking.carType, booking.isSolo, booking.zone, booking.geoPoint]);

  const handleNext = () => {
    if (booking.step < 6) {
      setBooking(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const handleBack = () => {
    if (booking.step > 1) {
      setBooking(prev => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const handleSubmit = async () => {
    if (!booking.service || !booking.zone || !booking.geoPoint || !booking.scheduledWindow) {
      return;
    }

    setSubmitting(true);
    try {
      const bookingInput: CreateBookingInput = {
        customer: booking.customer,
        service_id: booking.service.id,
        addons: booking.addons.map(a => a.id),
        car_type: booking.carType,
        zone_id: booking.zone.id,
        address_text: booking.addressText,
        geo_point: booking.geoPoint,
        scheduled_window: booking.scheduledWindow,
        is_solo: booking.isSolo
      };

      const result = await trpc.createBooking.mutate(bookingInput);
      
      // Show success and navigate
      alert(`Booking created successfully! ID: ${result.booking_id}`);
      navigateToPage('home');
      
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (booking.step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-title font-light mb-6">{t.service.title}</h2>
            
            <div className="grid gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setBooking(prev => ({ ...prev, service }))}
                  className={`tile p-6 cursor-pointer ${booking.service?.id === service.id ? 'border-accent' : ''}`}
                >
                  <h3 className="text-subtitle font-medium mb-2">
                    {language === 'ar' ? service.name_ar : service.name_en}
                  </h3>
                  <p className="text-body text-muted mb-4">
                    {language === 'ar' ? service.desc_ar : service.desc_en}
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-accent font-medium">
                        {service.base_price_team} YER ({t.service.teamPrice})
                      </div>
                      <div className="text-muted text-caption">
                        {service.base_price_solo} YER ({t.service.soloPrice})
                      </div>
                    </div>
                    <div className="text-caption text-muted">
                      {service.est_minutes} {language === 'ar' ? 'دقيقة' : 'min'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {booking.service && allAddons.length > 0 && (
              <div className="mt-8">
                <h3 className="text-subtitle font-medium mb-4">{t.service.addons}</h3>
                <div className="grid gap-3">
                  {allAddons.map((addon) => (
                    <label
                      key={addon.id}
                      className="tile p-4 cursor-pointer flex items-center gap-4"
                    >
                      <input
                        type="checkbox"
                        checked={booking.addons.some(a => a.id === addon.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBooking(prev => ({ ...prev, addons: [...prev.addons, addon] }));
                          } else {
                            setBooking(prev => ({ 
                              ...prev, 
                              addons: prev.addons.filter(a => a.id !== addon.id) 
                            }));
                          }
                        }}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {language === 'ar' ? addon.name_ar : addon.name_en}
                        </div>
                        <div className="text-caption text-muted">
                          {addon.price} YER • {addon.est_minutes} {language === 'ar' ? 'دقيقة' : 'min'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-title font-light mb-6">{t.carType.title}</h2>
            
            <div className="grid gap-4">
              {(['sedan', 'suv', 'pickup'] as const).map((type) => (
                <div
                  key={type}
                  onClick={() => setBooking(prev => ({ ...prev, carType: type }))}
                  className={`tile p-6 cursor-pointer ${booking.carType === type ? 'border-accent' : ''}`}
                >
                  <h3 className="text-subtitle font-medium">
                    {t.carType[type]}
                  </h3>
                </div>
              ))}
            </div>

            <div className="tile p-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={booking.isSolo}
                  onChange={(e) => setBooking(prev => ({ ...prev, isSolo: e.target.checked }))}
                  className="w-5 h-5"
                />
                <span>
                  {language === 'ar' ? 'خدمة فردية (خصم خاص)' : 'Solo service (special discount)'}
                </span>
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-title font-light mb-6">{t.location.title}</h2>
            
            <div>
              <label className="block text-body font-medium mb-2">
                {t.location.zone}
              </label>
              <select
                value={booking.zone?.id || ''}
                onChange={(e) => {
                  const zone = zones.find(z => z.id === parseInt(e.target.value));
                  setBooking(prev => ({ ...prev, zone: zone || null }));
                }}
                className="w-full p-3 bg-card border border-border text-text"
              >
                <option value="">{language === 'ar' ? 'اختر المنطقة' : 'Select Zone'}</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {language === 'ar' ? zone.name_ar : zone.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-body font-medium mb-2">
                {t.location.address}
              </label>
              <textarea
                value={booking.addressText}
                onChange={(e) => setBooking(prev => ({ ...prev, addressText: e.target.value }))}
                placeholder={t.location.addressPlaceholder}
                rows={4}
                className="w-full p-3 bg-card border border-border text-text resize-none"
              />
            </div>

            {/* Location integration */}
            <div className="tile p-4">
              <div className="flex items-center gap-2 text-muted">
                <MapPin size={20} />
                <span>
                  {language === 'ar' ? 'سيتم تحديد الموقع بدقة لاحقاً' : 'Precise location will be determined later'}
                </span>
              </div>
              <button
                onClick={() => setBooking(prev => ({ 
                  ...prev, 
                  geoPoint: { lat: 12.8, lng: 45.0 } // Default coordinates for Aden
                }))}
                className="mt-3 bg-accent text-white px-4 py-2 text-sm"
              >
                {language === 'ar' ? 'تأكيد الموقع' : 'Confirm Location'}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-title font-light mb-6">{t.timing.title}</h2>
            
            {/* Simplified time slots - in real app, calculate based on availability */}
            <div className="grid gap-3">
              {['09:00-10:30', '11:00-12:30', '14:00-15:30', '16:00-17:30'].map((slot) => (
                <div
                  key={slot}
                  onClick={() => {
                    const [start, end] = slot.split('-');
                    const today = new Date().toISOString().split('T')[0];
                    setBooking(prev => ({
                      ...prev,
                      scheduledWindow: {
                        start: `${today}T${start}:00Z`,
                        end: `${today}T${end}:00Z`
                      }
                    }));
                  }}
                  className={`tile p-4 cursor-pointer ${
                    booking.scheduledWindow?.start.includes(slot.split('-')[0]) ? 'border-accent' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-accent" />
                    <span>{slot}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-title font-light mb-6">{t.contact.title}</h2>
            
            <div>
              <label className="block text-body font-medium mb-2">
                {t.contact.name}
              </label>
              <input
                type="text"
                value={booking.customer.name}
                onChange={(e) => setBooking(prev => ({
                  ...prev,
                  customer: { ...prev.customer, name: e.target.value }
                }))}
                className="w-full p-3 bg-card border border-border text-text"
                required
              />
            </div>

            <div>
              <label className="block text-body font-medium mb-2">
                {t.contact.phone}
              </label>
              <input
                type="tel"
                value={booking.customer.phone}
                onChange={(e) => setBooking(prev => ({
                  ...prev,
                  customer: { ...prev.customer, phone: e.target.value }
                }))}
                placeholder={t.contact.phonePlaceholder}
                className="w-full p-3 bg-card border border-border text-text"
                required
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-title font-light mb-6">{t.confirm.title}</h2>
            
            <div className="tile p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted">{t.confirm.service}:</span>
                <span>
                  {booking.service ? (language === 'ar' ? booking.service.name_ar : booking.service.name_en) : ''}
                </span>
              </div>
              
              {booking.addons.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">{t.confirm.addons}:</span>
                  <span>
                    {booking.addons.map(a => language === 'ar' ? a.name_ar : a.name_en).join(', ')}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted">{t.confirm.carType}:</span>
                <span>{t.carType[booking.carType]}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted">{t.confirm.location}:</span>
                <span>
                  {booking.zone ? (language === 'ar' ? booking.zone.name_ar : booking.zone.name_en) : ''}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted">{t.confirm.time}:</span>
                <span>
                  {booking.scheduledWindow ? new Date(booking.scheduledWindow.start).toLocaleTimeString() : ''}
                </span>
              </div>
              
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex justify-between text-title">
                  <span>{t.confirm.total}:</span>
                  <span className="text-accent">{booking.priceTotal} YER</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-surface border-b border-border p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateToPage('home')}
            className="p-2 hover:bg-card transition-colors"
          >
            <ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''} />
          </button>
          <h1 className="text-title font-light">{t.title}</h1>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-surface p-4">
        <div className="flex items-center justify-between mb-4">
          {t.steps.map((step, index) => (
            <div
              key={index}
              className={`flex-1 text-center ${index < t.steps.length - 1 ? 'border-r border-border' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm ${
                  booking.step > index + 1 
                    ? 'bg-green text-white' 
                    : booking.step === index + 1 
                    ? 'bg-accent text-white' 
                    : 'bg-card border border-border'
                }`}
              >
                {booking.step > index + 1 ? <Check size={16} /> : index + 1}
              </div>
              <div className={`text-caption ${booking.step === index + 1 ? 'text-accent' : 'text-muted'}`}>
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="metro-container py-8">
        {renderStep()}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4">
        <div className="flex gap-3">
          {booking.step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 bg-card text-text py-3 px-6 hover:bg-border transition-colors"
            >
              {t.buttons.back}
            </button>
          )}
          
          <button
            onClick={booking.step === 6 ? handleSubmit : handleNext}
            disabled={
              (booking.step === 1 && !booking.service) ||
              (booking.step === 3 && !booking.zone) ||
              (booking.step === 4 && !booking.scheduledWindow) ||
              (booking.step === 5 && (!booking.customer.name || !booking.customer.phone)) ||
              submitting
            }
            className="flex-1 bg-accent text-white py-3 px-6 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="loading-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            ) : (
              <>
                {booking.step === 6 ? t.buttons.confirm : t.buttons.next}
                {booking.step < 6 && <ArrowRight size={20} className={isRTL ? 'rotate-180' : ''} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;
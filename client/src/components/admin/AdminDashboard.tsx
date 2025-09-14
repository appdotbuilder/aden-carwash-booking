import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Car, 
  Users, 
  TrendingUp, 
  FileText, 
  Image, 
  BarChart3,
  Shield,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { trpc } from '../../utils/trpc';

interface AdminDashboardProps {
  language: 'ar' | 'en';
  isRTL: boolean;
  navigateToPage: (page: string) => void;
}

interface AdminOverview {
  today_bookings: number;
  pending_bookings: number;
  completed_bookings: number;
  revenue_today: number;
  avg_service_time: number;
  on_time_percentage: number;
}

const AdminDashboard = ({ language, isRTL, navigateToPage }: AdminDashboardProps) => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('overview');

  useEffect(() => {
    const loadOverview = async () => {
      try {
        // Load admin overview data
        const overviewData = await trpc.getAdminOverview.query();
        
        // Fallback overview data for development
        const fallbackOverview: AdminOverview = {
          today_bookings: 12,
          pending_bookings: 5,
          completed_bookings: 45,
          revenue_today: 185000,
          avg_service_time: 32,
          on_time_percentage: 94
        };

        setOverview(overviewData || fallbackOverview);
      } catch (error) {
        console.error('Failed to load admin overview:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const text = {
    ar: {
      title: 'لوحة التحكم الإدارية',
      sections: {
        overview: 'نظرة عامة',
        operations: 'العمليات',
        catalog: 'الكتالوج والأسعار',
        content: 'إدارة المحتوى',
        marketing: 'التسويق والشراكات',
        reports: 'التقارير والإحصائيات'
      },
      overview: {
        today: 'اليوم',
        bookings: 'الحجوزات',
        pending: 'قيد الانتظار',
        completed: 'مكتملة',
        revenue: 'الإيرادات',
        avgTime: 'متوسط وقت الخدمة',
        onTime: 'نسبة الالتزام بالوقت',
        minutes: 'دقيقة',
        yer: 'ريال يمني'
      },
      operations: {
        title: 'العمليات اليومية',
        createBooking: 'إنشاء حجز جديد',
        todayBookings: 'حجوزات اليوم',
        schedule: 'جدولة الفرق',
        quality: 'مراجعة الجودة'
      },
      catalog: {
        title: 'الكتالوج والأسعار',
        services: 'إدارة الخدمات',
        addons: 'الخدمات الإضافية',
        plans: 'باقات الاشتراك',
        pricing: 'قواعد التسعير'
      },
      content: {
        title: 'إدارة المحتوى',
        home: 'محتوى الصفحة الرئيسية',
        gallery: 'معرض الصور',
        faqs: 'الأسئلة الشائعة',
        seo: 'تحسين محركات البحث'
      },
      marketing: {
        title: 'التسويق والشراكات',
        coupons: 'الكوبونات والعروض',
        popups: 'النوافذ المنبثقة',
        fleet: 'عملاء الأساطيل',
        analytics: 'تحليلات التسويق'
      },
      reports: {
        title: 'التقارير والإحصائيات',
        performance: 'تقارير الأداء',
        financial: 'التقارير المالية',
        customer: 'إحصائيات العملاء',
        export: 'تصدير البيانات'
      }
    },
    en: {
      title: 'Admin Dashboard',
      sections: {
        overview: 'Overview',
        operations: 'Operations',
        catalog: 'Catalog & Pricing',
        content: 'Content Management',
        marketing: 'Marketing & Partnerships',
        reports: 'Reports & Analytics'
      },
      overview: {
        today: 'Today',
        bookings: 'Bookings',
        pending: 'Pending',
        completed: 'Completed',
        revenue: 'Revenue',
        avgTime: 'Avg Service Time',
        onTime: 'On-Time Rate',
        minutes: 'min',
        yer: 'YER'
      },
      operations: {
        title: 'Daily Operations',
        createBooking: 'Create New Booking',
        todayBookings: 'Today\'s Bookings',
        schedule: 'Team Scheduling',
        quality: 'Quality Review'
      },
      catalog: {
        title: 'Catalog & Pricing',
        services: 'Manage Services',
        addons: 'Additional Services',
        plans: 'Subscription Plans',
        pricing: 'Pricing Rules'
      },
      content: {
        title: 'Content Management',
        home: 'Home Page Content',
        gallery: 'Gallery Management',
        faqs: 'FAQs Management',
        seo: 'SEO Management'
      },
      marketing: {
        title: 'Marketing & Partnerships',
        coupons: 'Coupons & Offers',
        popups: 'Pop-up Management',
        fleet: 'Fleet Clients',
        analytics: 'Marketing Analytics'
      },
      reports: {
        title: 'Reports & Analytics',
        performance: 'Performance Reports',
        financial: 'Financial Reports',
        customer: 'Customer Analytics',
        export: 'Data Export'
      }
    }
  };

  const t = text[language];

  const menuItems = [
    {
      id: 'overview',
      icon: BarChart3,
      title: t.sections.overview,
      color: 'accent'
    },
    {
      id: 'operations',
      icon: Calendar,
      title: t.sections.operations,
      color: 'green'
    },
    {
      id: 'catalog',
      icon: Car,
      title: t.sections.catalog,
      color: 'orange'
    },
    {
      id: 'content',
      icon: FileText,
      title: t.sections.content,
      color: 'purple'
    },
    {
      id: 'marketing',
      icon: TrendingUp,
      title: t.sections.marketing,
      color: 'magenta'
    },
    {
      id: 'reports',
      icon: BarChart3,
      title: t.sections.reports,
      color: 'teal'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-title font-light mb-6">{t.sections.overview}</h2>
        
        {overview && (
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            {/* Today's Bookings */}
            <div className="tile p-6 bg-accent text-white">
              <div className="flex items-center justify-between mb-4">
                <Calendar size={32} />
                <span className="text-caption opacity-80">{t.overview.today}</span>
              </div>
              <div className="text-title font-light mb-1">{overview.today_bookings}</div>
              <div className="text-caption opacity-90">{t.overview.bookings}</div>
            </div>

            {/* Pending Bookings */}
            <div className="tile p-6 bg-orange text-white">
              <div className="flex items-center justify-between mb-4">
                <Clock size={32} />
                <AlertCircle size={20} className="opacity-80" />
              </div>
              <div className="text-title font-light mb-1">{overview.pending_bookings}</div>
              <div className="text-caption opacity-90">{t.overview.pending}</div>
            </div>

            {/* Completed Bookings */}
            <div className="tile p-6 bg-green text-white">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle size={32} />
                <span className="text-caption opacity-80">✓</span>
              </div>
              <div className="text-title font-light mb-1">{overview.completed_bookings}</div>
              <div className="text-caption opacity-90">{t.overview.completed}</div>
            </div>

            {/* Revenue */}
            <div className="tile p-6 bg-lime text-white">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp size={32} />
                <span className="text-caption opacity-80">💰</span>
              </div>
              <div className="text-title font-light mb-1">{overview.revenue_today.toLocaleString()}</div>
              <div className="text-caption opacity-90">{t.overview.yer}</div>
            </div>

            {/* Avg Service Time */}
            <div className="tile p-6 bg-purple text-white">
              <div className="flex items-center justify-between mb-4">
                <Clock size={32} />
                <span className="text-caption opacity-80">⏱️</span>
              </div>
              <div className="text-title font-light mb-1">{overview.avg_service_time}</div>
              <div className="text-caption opacity-90">{t.overview.minutes}</div>
            </div>

            {/* On-Time Percentage */}
            <div className="tile p-6 bg-teal text-white">
              <div className="flex items-center justify-between mb-4">
                <Shield size={32} />
                <span className="text-caption opacity-80">📊</span>
              </div>
              <div className="text-title font-light mb-1">{overview.on_time_percentage}%</div>
              <div className="text-caption opacity-90">{t.overview.onTime}</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-subtitle font-medium mb-4">
          {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'operations', title: t.operations.createBooking, icon: Calendar, color: 'green' },
            { id: 'operations', title: t.operations.todayBookings, icon: Users, color: 'accent' },
            { id: 'content', title: t.content.gallery, icon: Image, color: 'purple' },
            { id: 'marketing', title: t.marketing.coupons, icon: TrendingUp, color: 'magenta' }
          ].map((action, index) => (
            <button
              key={index}
              onClick={() => setActiveSection(action.id)}
              className={`tile p-4 hover:scale-105 transition-transform bg-${action.color} text-white`}
            >
              <action.icon size={24} className="mb-3" />
              <div className="text-body font-medium">{action.title}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'operations':
        return (
          <div className="space-y-6">
            <h2 className="text-title font-light">{t.operations.title}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="tile p-6">
                <h3 className="text-subtitle font-medium mb-4">{t.operations.createBooking}</h3>
                <p className="text-body text-muted mb-4">
                  {language === 'ar' 
                    ? 'إنشاء حجز جديد للعملاء مباشرة من لوحة التحكم'
                    : 'Create new bookings for customers directly from the dashboard'
                  }
                </p>
                <button className="bg-accent text-white px-4 py-2 hover:opacity-90">
                  {language === 'ar' ? 'إنشاء حجز' : 'Create Booking'}
                </button>
              </div>
              <div className="tile p-6">
                <h3 className="text-subtitle font-medium mb-4">{t.operations.todayBookings}</h3>
                <p className="text-body text-muted mb-4">
                  {language === 'ar' 
                    ? 'مراجعة وإدارة حجوزات اليوم'
                    : 'Review and manage today\'s bookings'
                  }
                </p>
                <button className="bg-green text-white px-4 py-2 hover:opacity-90">
                  {language === 'ar' ? 'عرض الحجوزات' : 'View Bookings'}
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-16">
            <div className="text-muted mb-4">
              {language === 'ar' ? 'القسم قيد التطوير' : 'Section under development'}
            </div>
            <button 
              onClick={() => setActiveSection('overview')}
              className="text-accent hover:opacity-80"
            >
              {language === 'ar' ? 'العودة للنظرة العامة' : 'Back to Overview'}
            </button>
          </div>
        );
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateToPage('home')}
              className="p-2 hover:bg-card transition-colors"
            >
              <ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''} />
            </button>
            <h1 className="text-title font-light">{t.title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-body text-muted">
              {language === 'ar' ? 'مرحباً، المشرف' : 'Welcome, Admin'}
            </span>
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-surface border-r border-border min-h-screen p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 transition-colors text-left ${
                  activeSection === item.id
                    ? `bg-${item.color} text-white`
                    : 'hover:bg-card text-text'
                }`}
              >
                <item.icon size={20} />
                <span className="text-body">{item.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
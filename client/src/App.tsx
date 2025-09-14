import { useState, useEffect } from 'react';
import './App.css';

// Components
import LandingPage from './components/LandingPage';
import BookingWizard from './components/BookingWizard';
import AdminDashboard from './components/admin/AdminDashboard';
import ServicesPage from './components/ServicesPage';
import SubscriptionsPage from './components/SubscriptionsPage';
import BusinessPage from './components/BusinessPage';
import GalleryPage from './components/GalleryPage';
import FAQPage from './components/FAQPage';

// Types
type Page = 'home' | 'services' | 'subscriptions' | 'business' | 'gallery' | 'faq' | 'booking' | 'admin';

interface AppState {
  currentPage: Page;
  language: 'ar' | 'en';
  isRTL: boolean;
}

function App() {
  // Check if URL contains admin for direct access
  const getInitialPage = (): Page => {
    if (typeof window !== 'undefined' && window.location.hash === '#admin') {
      return 'admin';
    }
    return 'home';
  };

  const [state, setState] = useState<AppState>({
    currentPage: getInitialPage(),
    language: 'ar',
    isRTL: true
  });

  // Set document direction based on language
  useEffect(() => {
    document.documentElement.dir = state.isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = state.language;
  }, [state.isRTL, state.language]);

  const navigateToPage = (page: Page) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  const toggleLanguage = () => {
    setState(prev => ({
      ...prev,
      language: prev.language === 'ar' ? 'en' : 'ar',
      isRTL: prev.language === 'en' // Will be 'ar' after toggle, so RTL should be true
    }));
  };

  const renderCurrentPage = () => {
    const commonProps = {
      language: state.language,
      isRTL: state.isRTL,
      navigateToPage: (page: string) => navigateToPage(page as Page)
    };

    switch (state.currentPage) {
      case 'home':
        return <LandingPage {...commonProps} />;
      case 'services':
        return <ServicesPage {...commonProps} />;
      case 'subscriptions':
        return <SubscriptionsPage {...commonProps} />;
      case 'business':
        return <BusinessPage {...commonProps} />;
      case 'gallery':
        return <GalleryPage {...commonProps} />;
      case 'faq':
        return <FAQPage {...commonProps} />;
      case 'booking':
        return <BookingWizard {...commonProps} />;
      case 'admin':
        return <AdminDashboard {...commonProps} />;
      default:
        return <LandingPage {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Language Toggle - Fixed Position */}
      <button
        onClick={toggleLanguage}
        className="fixed top-4 z-50 bg-card text-text px-3 py-1 text-sm border border-border hover:border-accent transition-colors"
        style={{ 
          right: state.isRTL ? 'auto' : '16px',
          left: state.isRTL ? '16px' : 'auto'
        }}
      >
        {state.language === 'ar' ? 'English' : 'العربية'}
      </button>

      {/* Main Content */}
      <main className="relative">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App;
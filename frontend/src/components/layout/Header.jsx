import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ title, onMenuClick }) => {
  const { i18n, t } = useTranslation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('pf_lang', lng);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-purple-50 px-4 lg:px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button className="lg:hidden text-gray-500" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <h1 className="text-lg lg:text-xl font-bold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="flex bg-purple-50 rounded-full p-1 text-xs font-semibold">
          <button
            onClick={() => changeLang('en')}
            className={`px-3 py-1.5 rounded-full transition-colors ${i18n.language === 'en' ? 'bg-primary-600 text-white' : 'text-primary-700'}`}
          >
            EN
          </button>
          <button
            onClick={() => changeLang('kn')}
            className={`px-3 py-1.5 rounded-full transition-colors ${i18n.language === 'kn' ? 'bg-primary-600 text-white' : 'text-primary-700'}`}
          >
            ಕನ್ನಡ
          </button>
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-purple-50">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
              <User size={16} />
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">{user?.name}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-cardHover border border-purple-50 py-1 z-40">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

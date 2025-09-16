import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="language-switcher">
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="language-select"
        aria-label={t('settings.selectLanguage')}
      >
        <option value="en">{t('settings.english')}</option>
        <option value="bn">{t('settings.bangla')}</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
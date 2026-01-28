import React from 'react';
import { useTranslation } from 'react-i18next';
import { LicenseRequestForm } from '../components/LicenseRequestForm';

const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 md:px-0">
      <div className="flex flex-col space-y-4 md:space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('home_title')}</h1>
          <p className="text-muted-foreground">
            {t('home_description')}
          </p>
        </div>
        <LicenseRequestForm />
      </div>
    </div>
  );
};

export default Home;
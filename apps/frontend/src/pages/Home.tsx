import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LicenseRequestForm } from '../components/LicenseRequestForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
];

const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [languageSelected, setLanguageSelected] = useState(false);

  useEffect(() => {
    // Set document direction based on current language
    const currentLang = languages.find(l => l.code === i18n.language.split('-')[0]);
    document.documentElement.dir = currentLang?.dir || 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const handleLanguageSelect = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLanguageSelected(true);
  };

  if (!languageSelected) {
    return (
      <div className="container mx-auto py-12 md:py-24 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Globe className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Select Language</CardTitle>
            <CardDescription>
              Choose your preferred language to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant="outline"
                className="h-14 text-lg font-medium justify-between px-6"
                onClick={() => handleLanguageSelect(lang.code)}
              >
                <span>{lang.name}</span>
                <span className="text-muted-foreground text-sm uppercase">{lang.code}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <div className="flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLanguageSelected(false)}
            className="text-muted-foreground"
          >
            <Globe className="h-4 w-4 mr-2" />
            {i18n.language === 'ar' ? 'تغيير اللغة' : 
             i18n.language === 'es' ? 'Cambiar idioma' :
             i18n.language === 'fr' ? 'Changer de langue' : 'Change Language'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
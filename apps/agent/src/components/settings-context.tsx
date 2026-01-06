'use client';

import React, { createContext, useContext, ReactNode } from 'react';

/**
 * Settings Context - Client-Side
 * يستقبل الإعدادات من الخادم ويوفرها للمكونات
 */

export interface SettingValue {
  ar: string | null;
  en: string | null;
  type?: string;
}

export interface SiteSettings {
  [key: string]: SettingValue;
}

interface SettingsContextType {
  settings: SiteSettings;
  getSetting: (key: string, lang?: 'ar' | 'en', fallback?: string) => string;
  getSettingBool: (key: string) => boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
  initialSettings: SiteSettings;
}

/**
 * Settings Provider
 * يستقبل الإعدادات من layout.tsx (Server Component)
 * ويوفرها لجميع المكونات الفرعية
 */
export function SettingsProvider({ children, initialSettings }: SettingsProviderProps) {
  // Helper function to get a setting value
  const getSetting = (key: string, lang: 'ar' | 'en' = 'ar', fallback: string = ''): string => {
    const setting = initialSettings[key];
    if (!setting) return fallback;
    
    const value = lang === 'ar' ? setting.ar : setting.en;
    return value || setting.ar || setting.en || fallback;
  };

  // Helper function to get a boolean setting
  const getSettingBool = (key: string): boolean => {
    const setting = initialSettings[key];
    if (!setting) return false;
    
    const value = setting.ar || setting.en;
    return value === 'true' || value === '1';
  };

  const contextValue: SettingsContextType = {
    settings: initialSettings,
    getSetting,
    getSettingBool,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook to use settings in client components
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
}

import type { CSSProperties } from 'react';

export interface BrandConfig {
  institutionName: string;
  moduleName: string;
  shortName: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  secondaryDark: string;
  logoText: string;
  logoLightPath?: string;
  logoDarkPath?: string;
}

export const brandConfig: BrandConfig = {
  institutionName: 'FASS Polytechnic',
  moduleName: 'Facilities Management',
  shortName: 'FASS Facilities',
  primary: '#000033',
  primaryDark: '#041e41',
  secondary: '#CC9900',
  secondaryDark: '#a67900',
  logoText: 'HP',
  logoLightPath: '/branding/logo-light.png',
  logoDarkPath: '/branding/logo-dark.png',
};

export function getBrandCssVariables(brand: BrandConfig = brandConfig) {
  return {
    '--brand-primary': brand.primary,
    '--brand-primary-dark': brand.primaryDark,
    '--brand-secondary': brand.secondary,
    '--brand-secondary-dark': brand.secondaryDark,
    '--brand-logo-text': `"${brand.logoText}"`,
  } as CSSProperties;
}

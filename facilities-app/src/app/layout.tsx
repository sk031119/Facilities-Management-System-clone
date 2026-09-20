import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { brandConfig, getBrandCssVariables } from '@/lib/brand';

export const metadata: Metadata = {
  title: `${brandConfig.moduleName} — ${brandConfig.institutionName}`,
  description: `Manage campus rooms, buildings, and facilities for ${brandConfig.institutionName}.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head />
      <body
        className="min-h-full flex flex-col transition-colors duration-300"
        style={getBrandCssVariables()}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

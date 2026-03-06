'use client';
import SearchDialog from '@/components/search';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { type ReactNode } from 'react';
import { provider } from '@/lib/i18n-ui';

export function Provider({ children, locale }: { children: ReactNode; locale: string }) {
  return (
    <RootProvider search={{ SearchDialog }} i18n={provider(locale)}>
      {children}
    </RootProvider>
  );
}

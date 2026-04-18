import { cookies } from 'next/headers';
import translations, { Locale, TranslationDict } from './translations';

export async function getTranslations(): Promise<TranslationDict> {
  const cookieStore = cookies();
  const localeCookie = cookieStore.get('deltux_pos_locale');
  
  // Default to Spanish if no cookie is set or if it's invalid
  const locale: Locale = localeCookie?.value === 'en' ? 'en' : 'es';
  
  return translations[locale];
}

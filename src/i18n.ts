import {getRequestConfig} from 'next-intl/server';

const locales = ['ko', 'en'];

export default getRequestConfig(async ({locale}) => {
  // Safe fallback to 'ko' if locale is undefined or not in the supported list
  const activeLocale = locale && locales.includes(locale) ? locale : 'ko';

  return {
    locale: activeLocale,
    messages: (await import(`../messages/${activeLocale}.json`)).default
  };
});

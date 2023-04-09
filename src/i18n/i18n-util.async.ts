// This file was auto-generated by 'typesafe-i18n'. Any manual changes will be overwritten.
/* eslint-disable */

import { initFormatters } from './formatters'
import type { Locales, Translations } from './i18n-types'
import { loadedFormatters, loadedLocales, locales } from './i18n-util'

const localeTranslationLoaders = {
	de: () => import('./de'),
	el: () => import('./el'),
	en: () => import('./en'),
	es: () => import('./es'),
	fr: () => import('./fr'),
	hi: () => import('./hi'),
	hr: () => import('./hr'),
	ja: () => import('./ja'),
	ko: () => import('./ko'),
	'pt-br': () => import('./pt-br'),
	'pt-pt': () => import('./pt-pt'),
	ru: () => import('./ru'),
	tr: () => import('./tr'),
	vi: () => import('./vi'),
	'zh-Hans': () => import('./zh-Hans'),
}

const updateDictionary = (locale: Locales, dictionary: Partial<Translations>): Translations =>
	loadedLocales[locale] = { ...loadedLocales[locale], ...dictionary }

export const importLocaleAsync = async (locale: Locales): Promise<Translations> =>
	(await localeTranslationLoaders[locale]()).default as unknown as Translations

export const loadLocaleAsync = async (locale: Locales): Promise<void> => {
	updateDictionary(locale, await importLocaleAsync(locale))
	loadFormatters(locale)
}

export const loadAllLocalesAsync = (): Promise<void[]> => Promise.all(locales.map(loadLocaleAsync))

export const loadFormatters = (locale: Locales): void =>
	void (loadedFormatters[locale] = initFormatters(locale))

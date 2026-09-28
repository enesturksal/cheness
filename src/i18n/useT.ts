import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { translate, type StringKey } from './strings';

export type T = (key: StringKey) => string;

export function useT(): T {
  const lang = useStore((s) => s.lang);
  return useCallback((key: StringKey) => translate(lang, key), [lang]);
}

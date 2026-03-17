'use client';
import { useState, useEffect } from 'react';

/**
 * Les emojis drapeaux (🇫🇷 etc.) s'affichent mal sur Windows (lettres à la place).
 * Retourne false sur Windows pour masquer les drapeaux, true ailleurs.
 */
export function useShowFlags() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(typeof navigator !== 'undefined' && !/Win/i.test(navigator.userAgent));
  }, []);

  return show;
}

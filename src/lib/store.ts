"use client";
import { atom } from 'jotai';

export type Breadcrumb = {
  label: string;
  href: string;
};

export const breadcrumbAtom = atom<{
  title: string;
  breadcrumbs: Breadcrumb[];
} | null>(null);

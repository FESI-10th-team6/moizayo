'use client';

import type { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface DropdownListProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
}

export const DropdownList = ({ isOpen, className, children, ...props }: DropdownListProps) => {
  if (!isOpen) return null;

  return (
    <div
      className={twMerge(
        'absolute z-50 mt-1 rounded border border-gray-200 bg-white shadow-sm',
        'max-h-[calc(100vh-20px)] max-w-[calc(100vw-20px)]',
        'overflow-auto',
        'right-0',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

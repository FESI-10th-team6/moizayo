'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

interface DropdownProps {
  children: (props: {
    isOpen: boolean;
    toggle: () => void;
    selectedValue?: string;
    onSelect: (value: string) => void;
  }) => ReactNode;
  defaultValue?: string;
}

export const Dropdown = ({ children, defaultValue }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | undefined>(defaultValue);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);
  const onSelect = (value: string) => {
    setSelectedValue(value);
    setIsOpen(false);
  };

  // 👉 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className="relative"
      ref={dropdownRef}
    >
      {children({ isOpen, toggle, selectedValue, onSelect })}
    </div>
  );
};

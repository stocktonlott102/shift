'use client';

import { useState } from 'react';

interface FAQItem {
  id: string;
  title: string;
  content: string;
}

interface AccordionFAQProps {
  items: FAQItem[];
}

export default function AccordionFAQ({ items }: AccordionFAQProps) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenItem((current) => (current === id ? null : id));
  };

  return (
    <div className="divide-y divide-gray-200 dark:divide-neutral-700">
      {items.map((item) => {
        const isOpen = openItem === item.id;
        return (
          <div key={item.id}>
            <button
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between py-4 text-left"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.title}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <p className="pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.content}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

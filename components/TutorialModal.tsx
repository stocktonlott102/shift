'use client';

import { useState } from 'react';

interface TutorialModalProps {
  onClose: () => void;
}

const slides = [
  {
    id: 'welcome',
    color: 'indigo',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Welcome to Shift',
    description: 'Shift is your all-in-one coaching management tool. This quick tour will show you the key features so you can hit the ground running.',
  },
  {
    id: 'calendar',
    color: 'indigo',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Calendar',
    description: 'Your main workspace. Schedule lessons, add time blocks, and get a clear view of your week at a glance.',
  },
  {
    id: 'clients',
    color: 'violet',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Clients',
    description: 'Build and manage your roster. Add clients, view their lesson history, and track their outstanding balance.',
  },
  {
    id: 'lesson-types',
    color: 'violet',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16M7 4v3m0 10v3m10-16v3m0 10v3" />
      </svg>
    ),
    title: 'Lesson Types',
    description: 'Define your services and rates. Create lesson types like "60-min Private" and pricing fills in automatically when you book.',
  },
  {
    id: 'financials',
    color: 'emerald',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Financials',
    description: 'Stay on top of payments. See your total pending balance and track which clients still owe you.',
  },
];

const iconBg: Record<string, string> = {
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
};

export default function TutorialModal({ onClose }: TutorialModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-full ${iconBg[slide.color]} flex items-center justify-center mb-6`}>
          {slide.icon}
        </div>

        {/* Text */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {slide.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8">
          {slide.description}
        </p>

        {/* Progress dots */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-200 ${
                i === currentSlide
                  ? 'w-4 h-2 bg-indigo-500'
                  : i < currentSlide
                  ? 'w-2 h-2 bg-indigo-300'
                  : 'w-2 h-2 bg-gray-200 dark:bg-neutral-600'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between w-full">
          {!isLastSlide ? (
            <button
              onClick={onClose}
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Skip
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={() => {
              if (isLastSlide) {
                onClose();
              } else {
                setCurrentSlide((s) => s + 1);
              }
            }}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isLastSlide ? 'Get Started' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

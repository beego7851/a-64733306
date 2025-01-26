import React from 'react';

interface ResponsiveFormLayoutProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  spacing?: 'tight' | 'normal' | 'loose';
}

const spacingClasses = {
  tight: 'gap-2 sm:gap-3',
  normal: 'gap-4 sm:gap-6',
  loose: 'gap-6 sm:gap-8',
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

export const ResponsiveFormLayout = ({
  children,
  columns = 1,
  spacing = 'normal',
}: ResponsiveFormLayoutProps) => {
  return (
    <div className={`grid ${columnClasses[columns]} ${spacingClasses[spacing]}`}>
      {children}
    </div>
  );
};
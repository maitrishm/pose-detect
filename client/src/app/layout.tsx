import React from 'react';
import './globals.css';

export const metadata = {
  title: 'BJJ Tracker',
  description: 'On-device BJJ pose detection and session tracking',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

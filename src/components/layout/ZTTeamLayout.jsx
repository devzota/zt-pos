/** ZTTeam Layout Container Component with iOS 17 Floating Navigation Spacing */
import React from 'react';
import { ZTTeamHeader } from './ZTTeamHeader';
import { ZTTeamBottomNav } from './ZTTeamBottomNav';

export function ZTTeamLayout({ children, ztteam_showNav = true }) {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container">
      {ztteam_showNav && <ZTTeamHeader />}
      <main className={`flex-grow px-3 py-2 ${ztteam_showNav ? 'mb-20' : ''}`}>
        {children}
      </main>
      {ztteam_showNav && <ZTTeamBottomNav />}
    </div>
  );
}

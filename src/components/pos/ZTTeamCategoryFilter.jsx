/** ZTTeam Category Filter Component Dynamic from Database */
import React from 'react';

export function ZTTeamCategoryFilter({ ztteam_categories, ztteam_activeCategory, ztteam_onSelectCategory }) {
  /** If no categories in DB, return null */
  if (!ztteam_categories || ztteam_categories.length <= 1) {
    return null;
  }

  return (
    <section className="mt-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x scrollbar-hide">
        {ztteam_categories.map((cat) => {
          const ztteam_isSelected = ztteam_activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => ztteam_onSelectCategory(cat.key)}
              className={`px-3 py-1 rounded-full font-label-md text-[11px] whitespace-nowrap snap-start transition-all cursor-pointer ${
                ztteam_isSelected
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                  : 'bg-[#F5E6D3] text-[#4B2C20] border border-outline-variant/40 hover:bg-surface-container-high'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

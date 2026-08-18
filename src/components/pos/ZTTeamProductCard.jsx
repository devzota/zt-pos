/** ZTTeam Product Item Component POS Horizontal List Row Layout */
import React from 'react';

export function ZTTeamProductCard({ ztteam_product, ztteam_onSellNow }) {
  const ztteam_formattedPriceLy = new Intl.NumberFormat('vi-VN').format(ztteam_product.price) + 'đ';
  const ztteam_formattedPriceChai = ztteam_product.priceChai > 0
    ? new Intl.NumberFormat('vi-VN').format(ztteam_product.priceChai) + 'đ'
    : null;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-2 shadow-xs border border-surface-container-high flex items-center justify-between gap-2 hover:border-primary/30 transition-all">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <img
          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-surface-container-high"
          src={ztteam_product.image}
          alt={ztteam_product.name}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-title-lg text-[14px] text-primary truncate font-bold leading-tight">
            {ztteam_product.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-body-md text-[12px] text-tertiary-container font-bold">
              {ztteam_formattedPriceLy} <span className="text-[10px] font-normal text-outline">/Ly</span>
            </span>
            {ztteam_formattedPriceChai && (
              <span className="font-body-md text-[11px] text-on-surface-variant font-medium">
                • {ztteam_formattedPriceChai} <span className="text-[10px] font-normal text-outline">/Chai</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => ztteam_onSellNow(ztteam_product)}
        className="h-8 px-3 bg-[#E07A5F] text-white rounded-lg font-label-md text-[12px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-0.5 cursor-pointer shrink-0"
      >
        <span className="material-symbols-outlined text-[16px]">add</span> Bán
      </button>
    </div>
  );
}

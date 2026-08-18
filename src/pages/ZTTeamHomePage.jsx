/** ZTTeam Home POS Page with compact List Layout & safe database seeding */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ztteam_db, ztteam_seedInitialData } from '../db/ztteam_database';
import { ZTTeamLayout } from '../components/layout/ZTTeamLayout';
import { ZTTeamRevenueBanner } from '../components/pos/ZTTeamRevenueBanner';
import { ZTTeamCategoryFilter } from '../components/pos/ZTTeamCategoryFilter';
import { ZTTeamProductCard } from '../components/pos/ZTTeamProductCard';
import { ztteam_useCart } from '../stores/ztteam_cartContext';

export function ZTTeamHomePage() {
  const navigate = useNavigate();
  const { setZtteam_activeProduct } = ztteam_useCart();
  const [ztteam_selectedCategory, setZtteam_selectedCategory] = useState('all');

  /** Safely seed initial data on component mount */
  useEffect(() => {
    ztteam_seedInitialData();
  }, []);

  /** Query Categories dynamically from Dexie IndexedDB */
  const ztteam_categories = useLiveQuery(async () => {
    return await ztteam_db.categories.toArray();
  }, []);

  /** Query Products from Dexie IndexedDB */
  const ztteam_products = useLiveQuery(async () => {
    if (ztteam_selectedCategory === 'all') {
      return await ztteam_db.products.toArray();
    }
    return await ztteam_db.products.where('category').equals(ztteam_selectedCategory).toArray();
  }, [ztteam_selectedCategory]);

  /** Handle clicking "Bán ngay" on a product card */
  const ztteam_handleSellNow = (product) => {
    setZtteam_activeProduct(product);
    navigate('/checkout');
  };

  return (
    <ZTTeamLayout>
      <div className="space-y-2">
        {/** Today Revenue Banner */}
        <ZTTeamRevenueBanner />

        {/** Category Selector (Dynamic from DB) */}
        {ztteam_categories && (
          <ZTTeamCategoryFilter
            ztteam_categories={ztteam_categories}
            ztteam_activeCategory={ztteam_selectedCategory}
            ztteam_onSelectCategory={setZtteam_selectedCategory}
          />
        )}

        {/** Products List (Horizontal List Rows) */}
        <section className="pt-1">
          <div className="flex justify-between items-center mb-1.5 px-0.5">
            <h3 className="font-title-lg text-[13px] text-primary font-bold">
              Danh sách thực đơn ({ztteam_products?.length || 0})
            </h3>
          </div>
          
          {!ztteam_products ? (
            <div className="text-center py-6 text-outline text-[12px]">Đang tải thực đơn...</div>
          ) : ztteam_products.length === 0 ? (
            <div className="text-center py-6 text-outline text-[12px]">Chưa có món nào trong thực đơn.</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {ztteam_products.map((product) => (
                <ZTTeamProductCard
                  key={product.id}
                  ztteam_product={product}
                  ztteam_onSellNow={ztteam_handleSellNow}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </ZTTeamLayout>
  );
}

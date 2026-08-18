/** ZTTeam Profile & Product Management Page with custom notifications */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ztteam_db, ztteam_seedInitialData } from '../db/ztteam_database';
import { ZTTeamLayout } from '../components/layout/ZTTeamLayout';
import { ztteam_useNotification } from '../stores/ztteam_notificationContext';

export function ZTTeamProfilePage() {
  const navigate = useNavigate();
  const { ztteam_showToast, ztteam_showConfirm } = ztteam_useNotification();

  /** Modal & Editing State */
  const [ztteam_showModal, setZtteam_showModal] = useState(false);
  const [ztteam_editingProduct, setZtteam_editingProduct] = useState(null);

  /** Form Field States */
  const [ztteam_productName, setZtteam_productName] = useState('');
  const [ztteam_priceLy, setZtteam_priceLy] = useState('');
  const [ztteam_priceChai, setZtteam_priceChai] = useState('');
  const [ztteam_productCategory, setZtteam_productCategory] = useState('coffee');

  /** Query Store Settings from Dexie IndexedDB */
  const ztteam_storeSettings = useLiveQuery(async () => {
    const name = await ztteam_db.settings.get('storeName');
    const owner = await ztteam_db.settings.get('storeOwner');
    const phone = await ztteam_db.settings.get('storePhone');
    return {
      name: name?.value || '',
      owner: owner?.value || '',
      phone: phone?.value || ''
    };
  }, []);

  /** Query Products and Categories from Dexie IndexedDB */
  const ztteam_products = useLiveQuery(async () => {
    await ztteam_seedInitialData();
    return await ztteam_db.products.toArray();
  }, []);

  const ztteam_categories = useLiveQuery(async () => {
    return await ztteam_db.categories.toArray();
  }, []);

  /** Open Add or Edit Modal */
  const ztteam_handleOpenModal = (product = null) => {
    if (product) {
      setZtteam_editingProduct(product);
      setZtteam_productName(product.name);
      setZtteam_priceLy(product.price || '');
      setZtteam_priceChai(product.priceChai || '');
      setZtteam_productCategory(product.category || 'coffee');
    } else {
      setZtteam_editingProduct(null);
      setZtteam_productName('');
      setZtteam_priceLy('');
      setZtteam_priceChai('');
      setZtteam_productCategory('coffee');
    }
    setZtteam_showModal(true);
  };

  /** Default image chooser based on category */
  const ztteam_getDefaultImage = (cat) => {
    if (cat === 'tea') return 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=600&auto=format&fit=crop';
    if (cat === 'pastry') return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop';
  };

  /** Save Product (Add new or Update existing) */
  const ztteam_handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!ztteam_productName || !ztteam_priceLy) return;

    const ztteam_productData = {
      name: ztteam_productName,
      price: Number(ztteam_priceLy),
      priceChai: Number(ztteam_priceChai) || 0,
      category: ztteam_productCategory,
      image: ztteam_editingProduct?.image || ztteam_getDefaultImage(ztteam_productCategory)
    };

    if (ztteam_editingProduct) {
      await ztteam_db.products.update(ztteam_editingProduct.id, ztteam_productData);
      ztteam_showToast(`Đã cập nhật món "${ztteam_productName}"!`);
    } else {
      await ztteam_db.products.add(ztteam_productData);
      ztteam_showToast(`Đã thêm món mới "${ztteam_productName}"!`);
    }

    setZtteam_showModal(false);
  };

  /** Delete Product with Custom Confirm Modal */
  const ztteam_handleDeleteProduct = (product) => {
    ztteam_showConfirm({
      title: 'Xóa món',
      message: `Bạn có chắc muốn xóa món "${product.name}" khỏi thực đơn?`,
      confirmText: 'Xóa món',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        await ztteam_db.products.delete(product.id);
        ztteam_showToast(`Đã xóa món "${product.name}"!`);
      }
    });
  };

  return (
    <ZTTeamLayout>
      <div className="space-y-md max-w-3xl mx-auto">
        {/** Dynamic Store Profile Card */}
        <section className="bg-surface-container-lowest rounded-xl p-md shadow-xs border border-surface-container-high flex justify-between items-center">
          <div>
            <h2 className="font-display-md text-[18px] text-primary font-bold">
              {ztteam_storeSettings?.name || 'Tên Quán (Chưa thiết lập)'}
            </h2>
            {(ztteam_storeSettings?.owner || ztteam_storeSettings?.phone) && (
              <p className="font-body-md text-on-surface-variant text-[12px] mt-0.5">
                {ztteam_storeSettings?.owner && `Chủ quán: ${ztteam_storeSettings.owner}`}
                {ztteam_storeSettings?.owner && ztteam_storeSettings?.phone && ' | '}
                {ztteam_storeSettings?.phone && `Hotline: ${ztteam_storeSettings.phone}`}
              </p>
            )}
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-[10px] font-semibold">
              Hoạt động Offline 100%
            </span>
          </div>

          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-primary hover:bg-surface-container rounded-lg border border-outline-variant/30 text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">settings</span> Cài đặt
          </button>
        </section>

        {/** Product Management Header */}
        <section className="space-y-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-title-lg text-[15px] text-primary font-bold">
              Quản lý Thực đơn ({ztteam_products?.length || 0})
            </h3>
            <button
              onClick={() => ztteam_handleOpenModal()}
              className="px-3 py-1.5 bg-primary text-on-primary rounded-lg font-label-md text-[12px] flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all cursor-pointer font-semibold shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span> Thêm món mới
            </button>
          </div>

          {/** Products List Table */}
          <div className="space-y-xs">
            {ztteam_products?.map((product) => {
              const ztteam_formattedPriceLy = new Intl.NumberFormat('vi-VN').format(product.price) + 'đ/Ly';
              const ztteam_formattedPriceChai = product.priceChai > 0
                ? new Intl.NumberFormat('vi-VN').format(product.priceChai) + 'đ/Chai'
                : 'Chưa hỗ trợ Chai';

              return (
                <div
                  key={product.id}
                  className="bg-surface-container-lowest rounded-lg p-2 shadow-xs border border-surface-container-high flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded-md object-cover"
                    />
                    <div>
                      <h4 className="font-title-lg text-[14px] text-primary font-bold">{product.name}</h4>
                      <p className="font-body-md text-[12px] text-tertiary-container font-semibold">
                        {ztteam_formattedPriceLy} • <span className="text-on-surface-variant text-[11px]">{ztteam_formattedPriceChai}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => ztteam_handleOpenModal(product)}
                      className="p-1.5 text-primary hover:bg-primary-container/20 rounded-full transition-colors cursor-pointer"
                      title="Sửa món"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => ztteam_handleDeleteProduct(product)}
                      className="p-1.5 text-error hover:bg-error-container/20 rounded-full transition-colors cursor-pointer"
                      title="Xóa món"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/** Add / Edit Product Modal */}
        {ztteam_showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md backdrop-blur-xs">
            <div className="bg-surface-container-lowest rounded-2xl p-lg max-w-md w-full shadow-lg border border-surface-container-high space-y-md">
              <div className="flex justify-between items-center">
                <h3 className="font-title-lg text-primary font-bold">
                  {ztteam_editingProduct ? 'Chỉnh sửa món' : 'Thêm sản phẩm mới'}
                </h3>
                <button
                  onClick={() => setZtteam_showModal(false)}
                  className="text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={ztteam_handleSaveProduct} className="space-y-sm">
                <div>
                  <label className="font-label-md text-[12px] text-on-surface-variant block mb-1">
                    Tên món *
                  </label>
                  <input
                    type="text"
                    required
                    value={ztteam_productName}
                    onChange={(e) => setZtteam_productName(e.target.value)}
                    className="w-full bg-surface-container border border-surface-container-high rounded-xl p-sm font-body-md text-on-surface outline-none focus:border-primary"
                    placeholder="Ví dụ: Cà phê Muối"
                  />
                </div>

                <div className="grid grid-cols-2 gap-sm">
                  <div>
                    <label className="font-label-md text-[12px] text-on-surface-variant block mb-1">
                      Giá 1 Ly (VNĐ) *
                    </label>
                    <input
                      type="number"
                      required
                      value={ztteam_priceLy}
                      onChange={(e) => setZtteam_priceLy(e.target.value)}
                      className="w-full bg-surface-container border border-surface-container-high rounded-xl p-sm font-body-md text-on-surface outline-none focus:border-primary"
                      placeholder="15000"
                    />
                  </div>

                  <div>
                    <label className="font-label-md text-[12px] text-on-surface-variant block mb-1">
                      Giá 1 Chai (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={ztteam_priceChai}
                      onChange={(e) => setZtteam_priceChai(e.target.value)}
                      className="w-full bg-surface-container border border-surface-container-high rounded-xl p-sm font-body-md text-on-surface outline-none focus:border-primary"
                      placeholder="30000"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-label-md text-[12px] text-on-surface-variant block mb-1">
                    Danh mục
                  </label>
                  <select
                    value={ztteam_productCategory}
                    onChange={(e) => setZtteam_productCategory(e.target.value)}
                    className="w-full bg-surface-container border border-surface-container-high rounded-xl p-sm font-body-md text-on-surface outline-none focus:border-primary"
                  >
                    {ztteam_categories?.filter(c => c.key !== 'all').map(cat => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-md flex gap-sm">
                  <button
                    type="button"
                    onClick={() => setZtteam_showModal(false)}
                    className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-title-lg text-[14px] cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-title-lg text-[14px] font-bold cursor-pointer hover:opacity-90"
                  >
                    Lưu món
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ZTTeamLayout>
  );
}

/** ZTTeam Settings & Category Management Page with custom Toast & Confirm Modal */
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ztteam_db, ztteam_seedInitialData } from '../db/ztteam_database';
import { ZTTeamLayout } from '../components/layout/ZTTeamLayout';
import { ztteam_useNotification } from '../stores/ztteam_notificationContext';

/** Helper to convert Vietnamese string to clean slug */
export function ztteam_slugify(str) {
  if (!str) return 'cat_' + Date.now();
  let slug = str.toLowerCase();
  slug = slug.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  slug = slug.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  slug = slug.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  slug = slug.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  slug = slug.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  slug = slug.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  slug = slug.replace(/đ/g, 'd');
  slug = slug.replace(/[^a-z0-9]/g, '_');
  slug = slug.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return slug || 'cat_' + Date.now();
}

export function ZTTeamSettingsPage() {
  const { ztteam_showToast, ztteam_showConfirm } = ztteam_useNotification();

  /** Category Form States */
  const [ztteam_showCategoryModal, setZtteam_showCategoryModal] = useState(false);
  const [ztteam_editingCategory, setZtteam_editingCategory] = useState(null);
  const [ztteam_catKey, setZtteam_catKey] = useState('');
  const [ztteam_catLabel, setZtteam_catLabel] = useState('');

  /** Store Info Settings States */
  const [ztteam_storeName, setZtteam_storeName] = useState('');
  const [ztteam_storeOwner, setZtteam_storeOwner] = useState('');
  const [ztteam_storePhone, setZtteam_storePhone] = useState('');

  /** Load Store Info from Dexie IndexedDB */
  useEffect(() => {
    async function ztteam_loadSettings() {
      const name = await ztteam_db.settings.get('storeName');
      const owner = await ztteam_db.settings.get('storeOwner');
      const phone = await ztteam_db.settings.get('storePhone');
      if (name) setZtteam_storeName(name.value || '');
      if (owner) setZtteam_storeOwner(owner.value || '');
      if (phone) setZtteam_storePhone(phone.value || '');
    }
    ztteam_loadSettings();
  }, []);

  /** Save Store Info */
  const ztteam_handleSaveStoreInfo = async (e) => {
    e.preventDefault();
    await ztteam_db.settings.put({ key: 'storeName', value: ztteam_storeName });
    await ztteam_db.settings.put({ key: 'storeOwner', value: ztteam_storeOwner });
    await ztteam_db.settings.put({ key: 'storePhone', value: ztteam_storePhone });
    ztteam_showToast('Đã lưu thông tin cửa hàng thành công!');
  };

  /** Query Categories from Dexie IndexedDB */
  const ztteam_categories = useLiveQuery(async () => {
    await ztteam_seedInitialData();
    return await ztteam_db.categories.toArray();
  }, []);

  /** Open Category Add/Edit Modal */
  const ztteam_handleOpenCatModal = (category = null) => {
    if (category) {
      setZtteam_editingCategory(category);
      setZtteam_catKey(category.key);
      setZtteam_catLabel(category.label);
    } else {
      setZtteam_editingCategory(null);
      setZtteam_catKey('');
      setZtteam_catLabel('');
    }
    setZtteam_showCategoryModal(true);
  };

  /** Save Category (Add or Edit) */
  const ztteam_handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!ztteam_catLabel) return;

    const ztteam_keySlug = ztteam_catKey || ztteam_slugify(ztteam_catLabel);

    if (ztteam_editingCategory) {
      await ztteam_db.categories.update(ztteam_editingCategory.id, {
        key: ztteam_keySlug,
        label: ztteam_catLabel
      });
      ztteam_showToast(`Đã sửa danh mục "${ztteam_catLabel}"!`);
    } else {
      await ztteam_db.categories.add({
        key: ztteam_keySlug,
        label: ztteam_catLabel
      });
      ztteam_showToast(`Đã thêm danh mục mới "${ztteam_catLabel}"!`);
    }

    setZtteam_showCategoryModal(false);
  };

  /** Delete Category with Custom Confirm Modal */
  const ztteam_handleDeleteCategory = (cat) => {
    ztteam_showConfirm({
      title: 'Xóa danh mục',
      message: `Bạn có chắc muốn xóa danh mục "${cat.label}"? các sản phẩm thuộc danh mục này sẽ giữ nguyên.`,
      confirmText: 'Xóa danh mục',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        await ztteam_db.categories.delete(cat.id);
        ztteam_showToast(`Đã xóa danh mục "${cat.label}"!`);
      }
    });
  };

  /** Reset Database with Custom Confirm Modal */
  const ztteam_handleResetDatabase = () => {
    ztteam_showConfirm({
      title: 'Khôi phục dữ liệu ban đầu',
      message: 'Hành động này sẽ làm sạch toàn bộ đơn hàng và thực đơn hiện tại để nạp lại dữ liệu ban đầu. Bạn có chắc chắn?',
      confirmText: 'Khôi phục dữ liệu',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: async () => {
        await ztteam_db.products.clear();
        await ztteam_db.orders.clear();
        await ztteam_db.categories.clear();
        await ztteam_db.settings.clear();
        await ztteam_seedInitialData();
        ztteam_showToast('Đã khôi phục dữ liệu mẫu ban đầu!');
      }
    });
  };

  return (
    <ZTTeamLayout ztteam_title="Cài đặt hệ thống">
      <div className="space-y-lg max-w-3xl mx-auto">
        {/** Store Information Section */}
        <section className="bg-surface-container-lowest rounded-xl p-md shadow-xs border border-surface-container-high space-y-md">
          <div className="flex justify-between items-center border-b border-surface-container-high pb-sm">
            <h2 className="font-title-lg text-primary font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-[22px]">store</span> Thông tin Cửa hàng
            </h2>
          </div>

          <form onSubmit={ztteam_handleSaveStoreInfo} className="space-y-sm">
            <div>
              <label className="font-label-md text-[12px] text-on-surface-variant block mb-1">
                Tên quán
              </label>
              <input
                type="text"
                value={ztteam_storeName}
                onChange={(e) => setZtteam_storeName(e.target.value)}
                placeholder="Nhập tên quán của bạn..."
                className="w-full bg-surface-container border border-surface-container-high rounded-xl p-sm font-body-md text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              <div>
                <label className="font-label-md text-[12px] text-on-surface-variant block mb-1">
                  Tên chủ quán
                </label>
                <input
                  type="text"
                  value={ztteam_storeOwner}
                  onChange={(e) => setZtteam_storeOwner(e.target.value)}
                  placeholder="Nhập tên chủ quán..."
                  className="w-full bg-surface-container border border-surface-container-high rounded-xl p-sm font-body-md text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-label-md text-[12px] text-on-surface-variant block mb-1">
                  Hotline
                </label>
                <input
                  type="text"
                  value={ztteam_storePhone}
                  onChange={(e) => setZtteam_storePhone(e.target.value)}
                  placeholder="Nhập số điện thoại..."
                  className="w-full bg-surface-container border border-surface-container-high rounded-xl p-sm font-body-md text-on-surface outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-md py-2 bg-primary text-on-primary rounded-xl font-title-lg text-[13px] font-bold cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-xs"
            >
              Lưu thông tin cửa hàng
            </button>
          </form>
        </section>

        {/** Category Management Section */}
        <section className="bg-surface-container-lowest rounded-xl p-md shadow-xs border border-surface-container-high space-y-md">
          <div className="flex justify-between items-center border-b border-surface-container-high pb-sm">
            <h2 className="font-title-lg text-primary font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-[22px]">category</span> Quản lý Danh mục ({ztteam_categories?.length || 0})
            </h2>
            <button
              onClick={() => ztteam_handleOpenCatModal()}
              className="px-md py-1.5 bg-primary text-on-primary rounded-lg font-label-md text-[12px] flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">add</span> Thêm danh mục
            </button>
          </div>

          <div className="space-y-xs">
            {ztteam_categories?.map((cat) => (
              <div
                key={cat.id}
                className="bg-surface-container rounded-lg p-sm flex justify-between items-center border border-outline-variant/20"
              >
                <div>
                  <span className="font-title-lg text-[15px] font-bold text-primary">{cat.label}</span>
                  <span className="text-[12px] text-outline ml-2">({cat.key})</span>
                </div>

                {cat.key !== 'all' && (
                  <div className="flex items-center gap-xs">
                    <button
                      onClick={() => ztteam_handleOpenCatModal(cat)}
                      className="p-1.5 text-primary hover:bg-primary-container/20 rounded-full transition-colors cursor-pointer"
                      title="Sửa danh mục"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => ztteam_handleDeleteCategory(cat)}
                      className="p-1.5 text-error hover:bg-error-container/20 rounded-full transition-colors cursor-pointer"
                      title="Xóa danh mục"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/** Database Operations Section */}
        <section className="bg-surface-container-lowest rounded-xl p-md shadow-xs border border-surface-container-high space-y-sm">
          <h2 className="font-title-lg text-error font-bold flex items-center gap-xs">
            <span className="material-symbols-outlined text-[22px]">database</span> Khôi phục Cơ sở dữ liệu
          </h2>
          <p className="font-body-md text-[13px] text-on-surface-variant">
            Nút bên dưới dùng để làm sạch dữ liệu hiện tại và tạo lại danh sách thực đơn ban đầu.
          </p>
          <button
            onClick={ztteam_handleResetDatabase}
            className="px-md py-2 bg-error text-on-error rounded-xl font-title-lg text-[13px] font-bold cursor-pointer hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span> Khôi phục dữ liệu mẫu ban đầu
          </button>
        </section>

        {/** Category Modal */}
        {ztteam_showCategoryModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md backdrop-blur-xs">
            <div className="bg-surface-container-lowest rounded-2xl p-lg max-w-md w-full shadow-lg border border-surface-container-high space-y-md">
              <div className="flex justify-between items-center">
                <h3 className="font-title-lg text-primary font-bold">
                  {ztteam_editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
                </h3>
                <button
                  onClick={() => setZtteam_showCategoryModal(false)}
                  className="text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={ztteam_handleSaveCategory} className="space-y-sm">
                <div>
                  <label className="font-label-md text-[12px] text-on-surface-variant block mb-1">
                    Tên danh mục *
                  </label>
                  <input
                    type="text"
                    required
                    value={ztteam_catLabel}
                    onChange={(e) => setZtteam_catLabel(e.target.value)}
                    className="w-full bg-surface-container border border-surface-container-high rounded-xl p-sm font-body-md text-on-surface outline-none focus:border-primary"
                    placeholder="Ví dụ: Đồ Ăn Sáng"
                  />
                </div>

                <div className="pt-md flex gap-sm">
                  <button
                    type="button"
                    onClick={() => setZtteam_showCategoryModal(false)}
                    className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-title-lg text-[14px] cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-title-lg text-[14px] font-bold cursor-pointer hover:opacity-90"
                  >
                    Lưu danh mục
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

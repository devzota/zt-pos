/** Dexie IndexedDB Database Instance for Offline-first Cafe POS App */
import Dexie from 'dexie';

/** Define Database Class with ZTTeam prefix */
export class ZTTeamDatabase extends Dexie {
  constructor() {
    super('ztteam_cafe_pos_db');
    
    /** Define Database Schema Tables */
    this.version(1).stores({
      products: '++id, name, price, category, isHot, tag, image',
      orders: '++id, createdAt, totalAmount, totalItems, status, items',
      categories: '++id, key, label',
      settings: 'key, value'
    });
  }
}

/** Export Database Instance */
export const ztteam_db = new ZTTeamDatabase();

/** Mutex lock flag to prevent parallel seed executions */
let ztteam_isSeeding = false;

/** Seed Initial Sample Data if Database is empty */
export async function ztteam_seedInitialData() {
  if (ztteam_isSeeding) return;
  
  try {
    ztteam_isSeeding = true;
    const ztteam_productCount = await ztteam_db.products.count();
    
    if (ztteam_productCount === 0) {
      /** Seed Categories */
      await ztteam_db.categories.clear();
      await ztteam_db.categories.bulkAdd([
        { key: 'all', label: 'Tất cả' },
        { key: 'coffee', label: 'Cà phê' }
      ]);

      /** Seed Products */
      await ztteam_db.products.clear();
      await ztteam_db.products.bulkAdd([
        {
          name: 'Cà phê Đen',
          price: 12000,
          priceChai: 27000,
          category: 'coffee',
          image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop'
        },
        {
          name: 'Cà phê Sữa',
          price: 13000,
          priceChai: 28000,
          category: 'coffee',
          image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop'
        },
        {
          name: 'Bạc Xỉu',
          price: 15000,
          priceChai: 30000,
          category: 'coffee',
          image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=600&auto=format&fit=crop'
        },
        {
          name: 'Sữa Sài Gòn',
          price: 15000,
          priceChai: 30000,
          category: 'coffee',
          image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=600&auto=format&fit=crop'
        },
        {
          name: 'Cà phê Muối',
          price: 17000,
          priceChai: 32000,
          category: 'coffee',
          image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop'
        }
      ]);

      /** Seed Store Settings */
      const ztteam_settingsCount = await ztteam_db.settings.count();
      if (ztteam_settingsCount === 0) {
        await ztteam_db.settings.bulkAdd([
          { key: 'storeName', value: '' },
          { key: 'storeOwner', value: '' },
          { key: 'storePhone', value: '' }
        ]);
      }
    }
  } finally {
    ztteam_isSeeding = false;
  }
}

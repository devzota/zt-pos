/** React Context for Cart State Management with ZTTeam rules */
import React, { createContext, useContext, useState } from 'react';

/** Create Cart Context */
const ZTTeamCartContext = createContext();

/** Cart Context Provider Component */
export function ZTTeamCartProvider({ children }) {
  /** Cart items state */
  const [ztteam_cartItems, setZtteam_cartItems] = useState([]);

  /** Selected item for quick sell modal / checkout page */
  const [ztteam_activeProduct, setZtteam_activeProduct] = useState(null);

  /** Add item to cart or set active checkout product */
  const ztteam_addToCart = (product, quantity = 1, packaging = 'Ly', note = '') => {
    setZtteam_cartItems((prev) => {
      const ztteam_existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.packaging === packaging && item.note === note
      );
      if (ztteam_existingIndex > -1) {
        const ztteam_newCart = [...prev];
        ztteam_newCart[ztteam_existingIndex].quantity += quantity;
        return ztteam_newCart;
      } else {
        return [
          ...prev,
          {
            id: Date.now(),
            productId: product.id,
            name: product.name,
            price: product.price + (packaging === 'Chai' ? 15000 : 0),
            basePrice: product.price,
            packaging: packaging,
            quantity: quantity,
            note: note,
            image: product.image,
            category: product.category
          }
        ];
      }
    });
  };

  /** Clear Cart */
  const ztteam_clearCart = () => {
    setZtteam_cartItems([]);
    setZtteam_activeProduct(null);
  };

  /** Remove specific item from cart */
  const ztteam_removeFromCart = (itemId) => {
    setZtteam_cartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  /** Update quantity of item in cart */
  const ztteam_updateQuantity = (itemId, delta) => {
    setZtteam_cartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const ztteam_newQty = item.quantity + delta;
            return ztteam_newQty > 0 ? { ...item, quantity: ztteam_newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  /** Calculate total items count */
  const ztteam_totalItemsCount = ztteam_cartItems.reduce((acc, item) => acc + item.quantity, 0);

  /** Calculate total cart price */
  const ztteam_totalCartPrice = ztteam_cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <ZTTeamCartContext.Provider
      value={{
        ztteam_cartItems,
        ztteam_activeProduct,
        setZtteam_activeProduct,
        ztteam_addToCart,
        ztteam_removeFromCart,
        ztteam_updateQuantity,
        ztteam_clearCart,
        ztteam_totalItemsCount,
        ztteam_totalCartPrice
      }}
    >
      {children}
    </ZTTeamCartContext.Provider>
  );
}

/** Custom hook to consume Cart Context */
export function ztteam_useCart() {
  const context = useContext(ZTTeamCartContext);
  if (!context) {
    throw new Error('ztteam_useCart must be used within ZTTeamCartProvider');
  }
  return context;
}

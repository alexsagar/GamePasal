import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();
const PENDING_CHECKOUT_STORAGE_KEY = 'gamepasal_pending_checkout_map';

const readPendingCheckoutMap = () => {
  try {
    const storedValue = localStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY);
    if (!storedValue) {
      return {};
    }

    const parsedValue = JSON.parse(storedValue);
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
  } catch (error) {
    console.error('Failed to read pending checkout map:', error);
    return {};
  }
};

const writePendingCheckoutMap = (pendingCheckoutMap) => {
  localStorage.setItem(
    PENDING_CHECKOUT_STORAGE_KEY,
    JSON.stringify(pendingCheckoutMap)
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [recommendationEvent, setRecommendationEvent] = useState(null);

  // Initialize cartId and load cart from backend (Redis) on component mount
  useEffect(() => {
    let currentCartId = localStorage.getItem('gamepasal_cart_id');
    if (!currentCartId) {
      currentCartId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      localStorage.setItem('gamepasal_cart_id', currentCartId);
    }
    setCartId(currentCartId);

    const fetchCart = async () => {
      try {
        setLoading(true);
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${baseUrl}/cart/${currentCartId}`);
        const data = await res.json();

        if (data.success && data.data && data.data.length > 0) {
          setCartItems(data.data);
        } else {
          // Fallback to old purely local storage cart if present, then sync it
          const savedCart = localStorage.getItem('gamepasal_cart');
          if (savedCart) {
            setCartItems(JSON.parse(savedCart));
          }
        }
      } catch (error) {
        console.error('Error loading cart from Redis:', error);
        // Fallback to local storage if API fails completely
        const savedCart = localStorage.getItem('gamepasal_cart');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      } finally {
        setLoading(false);
        setIsInitialLoad(false); // Important: Prevents overwriting valid Redis cart on mount
      }
    };

    fetchCart();
  }, []);

  // Save cart to backend (Redis) and localStorage whenever cartItems changes
  useEffect(() => {
    if (isInitialLoad) return; // Don't sync up the empty state immediately upon load

    // Backup locally
    localStorage.setItem('gamepasal_cart', JSON.stringify(cartItems));

    // Sync to backend
    if (cartId) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      fetch(`${baseUrl}/cart/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartId, items: cartItems }),
      }).catch(err => console.error('Failed to sync cart via API:', err));
    }
  }, [cartItems, isInitialLoad, cartId]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);

      if (existingItem) {
        return prevItems.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity }];
      }
    });

    if (product?._id) {
      setRecommendationEvent({
        productId: product._id,
        title: product.title,
        timestamp: Date.now()
      });
    }
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const savePendingCheckout = (orderId, items) => {
    if (!orderId || !Array.isArray(items) || items.length === 0) {
      return;
    }

    const normalizedItems = items
      .filter((item) => item?._id && Number(item.quantity) > 0)
      .map((item) => ({
        productId: item._id,
        quantity: Number(item.quantity)
      }));

    if (!normalizedItems.length) {
      return;
    }

    const pendingCheckoutMap = readPendingCheckoutMap();
    pendingCheckoutMap[orderId] = {
      items: normalizedItems,
      savedAt: new Date().toISOString()
    };
    writePendingCheckoutMap(pendingCheckoutMap);
  };

  const finalizePendingCheckout = (orderId) => {
    if (!orderId) {
      return;
    }

    const pendingCheckoutMap = readPendingCheckoutMap();
    const pendingOrder = pendingCheckoutMap[orderId];
    if (!pendingOrder?.items?.length) {
      return;
    }

    setCartItems((prevItems) => prevItems.reduce((nextItems, cartItem) => {
      const purchasedItem = pendingOrder.items.find(
        (item) => item.productId === cartItem._id
      );

      if (!purchasedItem) {
        nextItems.push(cartItem);
        return nextItems;
      }

      const remainingQuantity = Number(cartItem.quantity) - Number(purchasedItem.quantity);
      if (remainingQuantity > 0) {
        nextItems.push({
          ...cartItem,
          quantity: remainingQuantity
        });
      }

      return nextItems;
    }, []));

    delete pendingCheckoutMap[orderId];
    writePendingCheckoutMap(pendingCheckoutMap);
  };

  const discardPendingCheckout = (orderId) => {
    if (!orderId) {
      return;
    }

    const pendingCheckoutMap = readPendingCheckoutMap();
    if (!pendingCheckoutMap[orderId]) {
      return;
    }

    delete pendingCheckoutMap[orderId];
    writePendingCheckoutMap(pendingCheckoutMap);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.salePrice || item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const isInCart = (productId) => {
    return cartItems.some(item => item._id === productId);
  };

  const getCartItem = (productId) => {
    return cartItems.find(item => item._id === productId);
  };

  const clearRecommendationEvent = () => {
    setRecommendationEvent(null);
  };

  const value = {
    cartItems,
    loading,
    recommendationEvent,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    savePendingCheckout,
    finalizePendingCheckout,
    discardPendingCheckout,
    clearRecommendationEvent,
    getCartTotal,
    getCartItemsCount,
    isInCart,
    getCartItem
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

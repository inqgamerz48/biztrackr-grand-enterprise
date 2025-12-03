import { useEffect, useState, useRef } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { QrReader } from 'react-qr-reader';
import { Search, ShoppingCart, Save, RotateCcw, Barcode, Trash2, Plus, Minus, CreditCard, Scan } from 'lucide-react';

export default function SalesPage() {
    const [items, setItems] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [totalDiscount, setTotalDiscount] = useState(0);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);

    // New Features State
    const [heldCarts, setHeldCarts] = useState<any[]>([]);
    const [showRecallModal, setShowRecallModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products'); // For mobile view
    const barcodeBuffer = useRef('');
    const lastKeyTime = useRef(0);

    // Banking State
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    useEffect(() => {
        const fetchItems = async () => {
            const res = await api.get('/inventory/');
            setItems(res.data);
        };
        fetchItems();
        fetchAccounts();

        // Load held carts from local storage
        const savedCarts = localStorage.getItem('biztrackr_held_carts');
        if (savedCarts) {
            setHeldCarts(JSON.parse(savedCarts));
        }

        // Barcode Scanner Listener
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input field
            if ((e.target as HTMLElement).tagName === 'INPUT') return;

            const currentTime = Date.now();
            if (currentTime - lastKeyTime.current > 100) {
                barcodeBuffer.current = ''; // Reset buffer if too slow (manual typing)
            }
            lastKeyTime.current = currentTime;

            if (e.key === 'Enter') {
                if (barcodeBuffer.current) {
                    handleBarcodeScan(barcodeBuffer.current);
                    barcodeBuffer.current = '';
                }
            } else if (e.key.length === 1) {
                barcodeBuffer.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items]); // Re-bind if items change

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/banking/');
            setAccounts(res.data);
            if (res.data.length > 0) {
                setSelectedAccount(res.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    // We need items in the scanner handler, but useEffect closure might be stale. 
    // Better to search in the handler using the current items state.
    // However, since items don't change often, we can just depend on items in useEffect or use a ref for items.
    // Simpler approach: just search in the items state directly if we include it in dependency, 
    // but that re-adds listener on every item change. 
    // Let's use a ref for items to avoid re-binding listener.
    const itemsRef = useRef(items);
    useEffect(() => { itemsRef.current = items; }, [items]);

    const handleBarcodeScan = (code: string) => {
        const item = itemsRef.current.find(i => i.barcode === code || i.id.toString() === code);
        if (item) {
            addToCart(item);
            // Play success sound (optional)
            const audio = new Audio('/beep.mp3'); // Assuming we might have one, or just ignore
            // audio.play().catch(() => {}); 
            // Switch to cart tab on mobile if scanned
            // setActiveTab('cart'); 
        } else {
            console.log('Item not found for barcode:', code);
        }
    };

    const handleCameraScan = (result: any, error: any) => {
        if (result) {
            const code = result?.text;
            if (code) {
                handleBarcodeScan(code);
                // Optional: Close modal after successful scan or keep open for multiple
                // setShowScanModal(false); 
            }
        }
    };

    const addToCart = (item: any) => {
        if (item.quantity <= 0) {
            alert(`Item "${item.name}" is out of stock!`);
            return;
        }

        setCart(prevCart => {
            const existing = prevCart.find((c) => c.item_id === item.id);
            if (existing) {
                if (existing.quantity + 1 > item.quantity) {
                    alert(`Cannot add more. Only ${item.quantity} in stock.`);
                    return prevCart;
                }
                return prevCart.map((c) => c.item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
            } else {
                return [...prevCart, { item_id: item.id, name: item.name, price: item.selling_price, quantity: 1, discount: 0 }];
            }
        });
    };

    const updateQuantity = (itemId: number, delta: number) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        setCart(cart.map((c) => {
            if (c.item_id === itemId) {
                const newQty = c.quantity + delta;
                if (newQty > item.quantity) {
                    alert(`Cannot add more. Only ${item.quantity} in stock.`);
                    return c;
                }
                return { ...c, quantity: Math.max(1, newQty) };
            }
            return c;
        }));
    };

    const updateItemDiscount = (itemId: number, discount: number) => {
        setCart(cart.map((c) => c.item_id === itemId ? { ...c, discount: Math.max(0, discount) } : c));
    };

    const removeFromCart = (itemId: number) => {
        setCart(cart.filter((c) => c.item_id !== itemId));
    };

    const handleHoldCart = () => {
        if (cart.length === 0) return;
        const newHeldCart = {
            id: Date.now(),
            items: cart,
            date: new Date().toLocaleString(),
            total: cart.reduce((acc, curr) => acc + (curr.price * curr.quantity) - (curr.discount || 0), 0)
        };
        const updatedHeldCarts = [...heldCarts, newHeldCart];
        setHeldCarts(updatedHeldCarts);
        localStorage.setItem('biztrackr_held_carts', JSON.stringify(updatedHeldCarts));
        setCart([]);
        setTotalDiscount(0);
        alert('Cart placed on hold.');
    };

    const handleRecallCart = (heldCart: any) => {
        if (cart.length > 0) {
            if (!confirm('Current cart is not empty. Overwrite?')) return;
        }
        setCart(heldCart.items);
        // Remove from held carts
        const updatedHeldCarts = heldCarts.filter(c => c.id !== heldCart.id);
        setHeldCarts(updatedHeldCarts);
        localStorage.setItem('biztrackr_held_carts', JSON.stringify(updatedHeldCarts));
        setShowRecallModal(false);
    };

    const deleteHeldCart = (id: number) => {
        const updatedHeldCarts = heldCarts.filter(c => c.id !== id);
        setHeldCarts(updatedHeldCarts);
        localStorage.setItem('biztrackr_held_carts', JSON.stringify(updatedHeldCarts));
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setShowCheckoutModal(true);
    };

    const confirmCheckout = async () => {
        try {
            const payload = {
                items: cart.map((c) => ({ item_id: c.item_id, quantity: c.quantity, discount: c.discount || 0 })),
                payment_method: paymentMethod,
                discount: totalDiscount,
                account_id: selectedAccount ? parseInt(selectedAccount) : null
            };
            const res = await api.post('/sales/sales', payload);

            try {
                const pdfRes = await api.get(`/sales/sales/${res.data.id}/pdf`, { responseType: 'blob' });
                if (pdfRes.data.size > 0) {
                    const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `receipt_${res.data.invoice_number}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                }
            } catch (pdfError) {
                console.error('PDF download failed:', pdfError);
            }

            setShowCheckoutModal(false);
            alert(`Sale created! Invoice: ${res.data.invoice_number}`);
            setCart([]);
            setTotalDiscount(0);
        } catch (error: any) {
            console.error('Checkout failed:', error);
            alert(`Checkout failed: ${error.response?.data?.detail || error.message}`);
        }
    };

    const filteredItems = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.barcode?.includes(search));
    const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const itemDiscounts = cart.reduce((acc, curr) => acc + (curr.discount || 0), 0);
    const totalAmount = subtotal - itemDiscounts - totalDiscount;

    return (
        <DashboardLayout>
            <div className="flex flex-col h-[calc(100vh-100px)]">
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-4 bg-black border border-white/20 p-3 rounded shadow-none">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-white">POS Terminal</h1>
                        <span className="text-xs bg-white/10 text-white border border-white/20 px-2 py-1 rounded flex items-center gap-1">
                            <Barcode size={14} /> Ready to Scan
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowScanModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors border border-white"
                        >
                            <Scan size={18} />
                            <span className="hidden sm:inline">Camera Scan</span>
                        </button>
                        <button
                            onClick={() => setShowRecallModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors border border-white/20"
                        >
                            <RotateCcw size={18} />
                            <span className="hidden sm:inline">Recall ({heldCarts.length})</span>
                        </button>
                        <button
                            onClick={handleHoldCart}
                            disabled={cart.length === 0}
                            className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors disabled:opacity-50 border border-white/20"
                        >
                            <Save size={18} />
                            <span className="hidden sm:inline">Hold Cart</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Tabs */}
                <div className="lg:hidden flex mb-4 bg-black border border-white/20 rounded shadow-none overflow-hidden">
                    <button
                        className={`flex-1 py-3 text-center font-medium ${activeTab === 'products' ? 'bg-white/10 text-white border-b-2 border-white' : 'text-gray-400'}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Products
                    </button>
                    <button
                        className={`flex-1 py-3 text-center font-medium ${activeTab === 'cart' ? 'bg-white/10 text-white border-b-2 border-white' : 'text-gray-400'}`}
                        onClick={() => setActiveTab('cart')}
                    >
                        Cart ({cart.reduce((acc, i) => acc + i.quantity, 0)})
                    </button>
                </div>

                <div className="flex-1 flex gap-4 overflow-hidden relative">
                    {/* Product List */}
                    <div className={`flex-1 bg-black border border-white/20 p-4 rounded shadow-none flex flex-col ${activeTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name or barcode..."
                                className="w-full pl-10 pr-4 py-2 bg-black text-white border border-white/20 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="border border-white/20 rounded-lg p-3 hover:shadow-none cursor-pointer transition-all hover:border-white flex flex-col justify-between bg-white/5"
                                    onClick={() => addToCart(item)}
                                >
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-white line-clamp-2">{item.name}</h3>
                                            {item.quantity <= item.min_stock && (
                                                <span className="w-2 h-2 rounded-full bg-white" title="Low Stock"></span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">SKU: {item.barcode || 'N/A'}</p>
                                    </div>
                                    <div className="mt-3 flex justify-between items-end">
                                        <span className="text-lg font-bold text-white">₹{item.selling_price.toLocaleString('en-IN')}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${item.quantity > 0 ? 'bg-white/10 text-white border border-white/20' : 'bg-white/10 text-white border border-white/20'}`}>
                                            {item.quantity} in stock
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {filteredItems.length === 0 && (
                                <div className="col-span-full text-center py-10 text-gray-400">
                                    No items found. Try a different search.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart Section */}
                    <div className={`w-full lg:w-96 bg-black border border-white/20 p-4 rounded shadow-none flex flex-col ${activeTab === 'products' ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                                <ShoppingCart size={20} /> Current Order
                            </h2>
                            <button onClick={() => setCart([])} className="text-xs text-white hover:text-gray-300">
                                Clear Cart
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <ShoppingCart size={48} className="mb-2 opacity-20" />
                                    <p>Cart is empty</p>
                                    <p className="text-xs">Scan items or click to add</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.item_id} className="bg-white/5 p-3 rounded border border-white/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm text-white">{item.name}</p>
                                                <p className="text-xs text-gray-400">₹{item.price.toLocaleString('en-IN')}</p>
                                            </div>
                                            <button onClick={() => removeFromCart(item.item_id)} className="text-gray-400 hover:text-white">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center bg-black border border-white/20 rounded">
                                                <button
                                                    onClick={() => updateQuantity(item.item_id, -1)}
                                                    className="px-2 py-1 hover:bg-white/10 text-gray-300"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.item_id, 1)}
                                                    className="px-2 py-1 hover:bg-white/10 text-gray-300"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-white">
                                                    ₹{((item.price * item.quantity) - (item.discount || 0)).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Quick Discount Input */}
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-gray-400">Disc:</span>
                                            <input
                                                type="number"
                                                className="w-16 text-xs bg-black text-white border border-white/20 rounded px-1 py-0.5"
                                                placeholder="0"
                                                value={item.discount || ''}
                                                onChange={(e) => updateItemDiscount(item.item_id, parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 border-t border-white/10 pt-4 space-y-2 bg-white/5 -mx-4 -mb-4 p-4 rounded-b">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Subtotal</span>
                                <span className="text-gray-400">₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            {itemDiscounts > 0 && (
                                <div className="flex justify-between text-sm text-white">
                                    <span>Item Discounts</span>
                                    <span>- ₹{itemDiscounts.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Extra Discount</span>
                                <div className="flex items-center gap-1 bg-black border border-white/20 rounded px-2">
                                    <span className="text-gray-400">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={totalDiscount}
                                        onChange={(e) => setTotalDiscount(parseFloat(e.target.value) || 0)}
                                        className="w-16 text-right text-sm bg-black text-white outline-none py-1"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10">
                                <span>Total</span>
                                <span className="text-white">₹{Math.max(0, totalAmount).toLocaleString('en-IN')}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full bg-white text-black py-3 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-none border border-white"
                            >
                                <CreditCard size={20} /> Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recall Modal */}
            {showRecallModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-black border border-white/20 rounded-lg shadow-none w-full max-w-md">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white">Recall Held Cart</h2>
                            <button onClick={() => setShowRecallModal(false)} className="text-gray-400 hover:text-white">×</button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {heldCarts.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">No held carts found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {heldCarts.map((c) => (
                                        <div key={c.id} className="border border-white/20 rounded p-3 flex justify-between items-center hover:bg-white/5">
                                            <div>
                                                <p className="font-medium text-sm text-white">{c.date}</p>
                                                <p className="text-xs text-gray-400">{c.items.length} items • ₹{c.total.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRecallCart(c)}
                                                    className="px-3 py-1 bg-white/10 text-white rounded text-xs font-medium hover:bg-white/20 border border-white/20"
                                                >
                                                    Restore
                                                </button>
                                                <button
                                                    onClick={() => deleteHeldCart(c.id)}
                                                    className="p-1 text-white hover:text-gray-300"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-white/10 bg-white/5 rounded-b-lg">
                            <button
                                onClick={() => setShowRecallModal(false)}
                                className="w-full py-2 border border-white/20 rounded text-gray-300 hover:bg-white/10"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-black border border-white/20 rounded-lg shadow-none w-full max-w-lg">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6 text-white">Confirm Payment</h2>

                            <div className="bg-white/5 p-4 rounded-lg mb-6 border border-white/10">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-400">Items Total</span>
                                    <span className="font-medium text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between mb-2 text-white">
                                    <span>Discounts</span>
                                    <span>- ₹{(itemDiscounts + totalDiscount).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between text-xl font-bold">
                                    <span className="text-white">To Pay</span>
                                    <span className="text-white">₹{Math.max(0, totalAmount).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
                                <select
                                    className="w-full bg-black text-white border border-white/20 rounded px-3 py-2 focus:ring-white focus:border-white"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Credit">Credit (Pay Later)</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Deposit To Account (Optional)</label>
                                <select
                                    className="w-full bg-black text-white border border-white/20 rounded px-3 py-2 focus:ring-white focus:border-white"
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency} {acc.balance})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCheckoutModal(false)}
                                    className="flex-1 py-3 border border-white/20 rounded-lg text-gray-300 font-medium hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCheckout}
                                    className="flex-1 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200 shadow-none border border-white"
                                >
                                    Confirm Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner Modal */}
            {showScanModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                    <div className="bg-black border border-white/20 p-4 rounded-lg shadow-none w-full max-w-md relative">
                        <button
                            onClick={() => setShowScanModal(false)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-white z-10"
                        >
                            ×
                        </button>
                        <h2 className="text-lg font-bold mb-4 text-center text-white">Scan Item</h2>
                        <div className="aspect-square bg-black rounded overflow-hidden border border-white/20">
                            <QrReader
                                onResult={handleCameraScan}
                                constraints={{ facingMode: 'environment' }}
                                className="w-full h-full"
                            />
                        </div>
                        <p className="text-center text-sm text-gray-400 mt-4">Point camera at item barcode</p>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

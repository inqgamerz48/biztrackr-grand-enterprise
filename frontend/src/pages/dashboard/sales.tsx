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

    useEffect(() => {
        const fetchItems = async () => {
            const res = await api.get('/inventory/');
            setItems(res.data);
        };
        fetchItems();

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
    }, [items]); // Re-bind if items change (though handleBarcodeScan uses current items state if passed or we can use a ref)

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
        setCart(prevCart => {
            const existing = prevCart.find((c) => c.item_id === item.id);
            if (existing) {
                return prevCart.map((c) => c.item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
            } else {
                return [...prevCart, { item_id: item.id, name: item.name, price: item.selling_price, quantity: 1, discount: 0 }];
            }
        });
    };

    const updateQuantity = (itemId: number, delta: number) => {
        setCart(cart.map((c) => {
            if (c.item_id === itemId) {
                const newQty = Math.max(1, c.quantity + delta);
                return { ...c, quantity: newQty };
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
                payment_method: "Cash",
                discount: totalDiscount
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
                <div className="flex justify-between items-center mb-4 bg-white p-3 rounded shadow-sm">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-gray-800">POS Terminal</h1>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                            <Barcode size={14} /> Ready to Scan
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowScanModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            <Scan size={18} />
                            <span className="hidden sm:inline">Camera Scan</span>
                        </button>
                        <button
                            onClick={() => setShowRecallModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                        >
                            <RotateCcw size={18} />
                            <span className="hidden sm:inline">Recall ({heldCarts.length})</span>
                        </button>
                        <button
                            onClick={handleHoldCart}
                            disabled={cart.length === 0}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <Save size={18} />
                            <span className="hidden sm:inline">Hold Cart</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Tabs */}
                <div className="lg:hidden flex mb-4 bg-white rounded shadow-sm overflow-hidden">
                    <button
                        className={`flex-1 py-3 text-center font-medium ${activeTab === 'products' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Products
                    </button>
                    <button
                        className={`flex-1 py-3 text-center font-medium ${activeTab === 'cart' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('cart')}
                    >
                        Cart ({cart.reduce((acc, i) => acc + i.quantity, 0)})
                    </button>
                </div>

                <div className="flex-1 flex gap-4 overflow-hidden relative">
                    {/* Product List */}
                    <div className={`flex-1 bg-white p-4 rounded shadow flex flex-col ${activeTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name or barcode..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="border rounded-lg p-3 hover:shadow-md cursor-pointer transition-all hover:border-indigo-300 flex flex-col justify-between bg-gray-50"
                                    onClick={() => addToCart(item)}
                                >
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-gray-800 line-clamp-2">{item.name}</h3>
                                            {item.quantity <= item.min_stock && (
                                                <span className="w-2 h-2 rounded-full bg-red-500" title="Low Stock"></span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">SKU: {item.barcode || 'N/A'}</p>
                                    </div>
                                    <div className="mt-3 flex justify-between items-end">
                                        <span className="text-lg font-bold text-indigo-600">₹{item.selling_price.toLocaleString('en-IN')}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${item.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.quantity} in stock
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {filteredItems.length === 0 && (
                                <div className="col-span-full text-center py-10 text-gray-500">
                                    No items found. Try a different search.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart Section */}
                    <div className={`w-full lg:w-96 bg-white p-4 rounded shadow flex flex-col ${activeTab === 'products' ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="flex justify-between items-center mb-4 pb-2 border-b">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <ShoppingCart size={20} /> Current Order
                            </h2>
                            <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">
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
                                    <div key={item.item_id} className="bg-gray-50 p-3 rounded border">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{item.name}</p>
                                                <p className="text-xs text-gray-500">₹{item.price.toLocaleString('en-IN')}</p>
                                            </div>
                                            <button onClick={() => removeFromCart(item.item_id)} className="text-gray-400 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center bg-white border rounded">
                                                <button
                                                    onClick={() => updateQuantity(item.item_id, -1)}
                                                    className="px-2 py-1 hover:bg-gray-100 text-gray-600"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.item_id, 1)}
                                                    className="px-2 py-1 hover:bg-gray-100 text-gray-600"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-800">
                                                    ₹{((item.price * item.quantity) - (item.discount || 0)).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Quick Discount Input */}
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Disc:</span>
                                            <input
                                                type="number"
                                                className="w-16 text-xs border rounded px-1 py-0.5"
                                                placeholder="0"
                                                value={item.discount || ''}
                                                onChange={(e) => updateItemDiscount(item.item_id, parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 border-t pt-4 space-y-2 bg-gray-50 -mx-4 -mb-4 p-4 rounded-b">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span>₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            {itemDiscounts > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Item Discounts</span>
                                    <span>- ₹{itemDiscounts.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Extra Discount</span>
                                <div className="flex items-center gap-1 bg-white border rounded px-2">
                                    <span className="text-gray-400">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={totalDiscount}
                                        onChange={(e) => setTotalDiscount(parseFloat(e.target.value) || 0)}
                                        className="w-16 text-right text-sm outline-none py-1"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                                <span>Total</span>
                                <span className="text-indigo-600">₹{Math.max(0, totalAmount).toLocaleString('en-IN')}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                            >
                                <CreditCard size={20} /> Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recall Modal */}
            {showRecallModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-bold">Recall Held Cart</h2>
                            <button onClick={() => setShowRecallModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {heldCarts.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No held carts found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {heldCarts.map((c) => (
                                        <div key={c.id} className="border rounded p-3 flex justify-between items-center hover:bg-gray-50">
                                            <div>
                                                <p className="font-medium text-sm">{c.date}</p>
                                                <p className="text-xs text-gray-500">{c.items.length} items • ₹{c.total.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRecallCart(c)}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
                                                >
                                                    Restore
                                                </button>
                                                <button
                                                    onClick={() => deleteHeldCart(c.id)}
                                                    className="p-1 text-red-400 hover:text-red-600"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => setShowRecallModal(false)}
                                className="w-full py-2 border rounded text-gray-600 hover:bg-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6 text-gray-900">Confirm Payment</h2>

                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-600">Items Total</span>
                                    <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between mb-2 text-green-600">
                                    <span>Discounts</span>
                                    <span>- ₹{(itemDiscounts + totalDiscount).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between text-xl font-bold">
                                    <span>To Pay</span>
                                    <span className="text-indigo-600">₹{Math.max(0, totalAmount).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCheckoutModal(false)}
                                    className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCheckout}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200"
                                >
                                    Confirm Cash Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
    )
}

{/* Scanner Modal */ }
{
    showScanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-md relative">
                <button
                    onClick={() => setShowScanModal(false)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
                >
                    ×
                </button>
                <h2 className="text-lg font-bold mb-4 text-center">Scan Item</h2>
                <div className="aspect-square bg-black rounded overflow-hidden">
                    <QrReader
                        onResult={handleCameraScan}
                        constraints={{ facingMode: 'environment' }}
                        className="w-full h-full"
                    />
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">Point camera at item barcode</p>
            </div>
        </div>
    )
}
        </DashboardLayout >
    );
}

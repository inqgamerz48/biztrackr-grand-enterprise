import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';

export default function SalesPage() {
    const [items, setItems] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [totalDiscount, setTotalDiscount] = useState(0);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);


    useEffect(() => {
        const fetchItems = async () => {
            const res = await api.get('/inventory/');
            setItems(res.data);
        };
        fetchItems();
    }, []);

    const addToCart = (item: any) => {
        const existing = cart.find((c) => c.item_id === item.id);
        if (existing) {
            setCart(cart.map((c) => c.item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, { item_id: item.id, name: item.name, price: item.selling_price, quantity: 1, discount: 0 }]);
        }
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
            console.log('Sending sale payload:', payload);
            const res = await api.post('/sales/sales', payload);
            console.log('Sale created response:', res.data);

            try {
                // Download PDF receipt
                console.log('Requesting PDF...');
                const pdfRes = await api.get(`/sales/sales/${res.data.id}/pdf`, { responseType: 'blob' });
                console.log('PDF received, size:', pdfRes.data.size);

                if (pdfRes.data.size === 0) {
                    throw new Error('Received empty PDF');
                }

                // Create blob URL
                const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);

                // Create link and trigger download
                const link = document.createElement('a');
                link.href = url;
                const filename = `receipt_${res.data.invoice_number}.pdf`;
                link.setAttribute('download', filename);
                link.style.display = 'none';
                document.body.appendChild(link);

                console.log(`Triggering download for ${filename}`);
                link.click();

                // Cleanup with timeout to ensure download starts
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    console.log('Download link cleaned up');
                }, 100);

            } catch (pdfError) {
                console.error('PDF download failed:', pdfError);
                alert('Sale created successfully, but PDF receipt download failed. Please try downloading from history.');
            }

            setShowCheckoutModal(false);
            alert(`Sale created! Invoice: ${res.data.invoice_number}\nPDF receipt downloaded.`);
            setCart([]);
            setTotalDiscount(0);
        } catch (error: any) {
            console.error('Checkout failed:', error);
            alert(`Checkout failed: ${error.response?.data?.detail || error.message}`);
        }
    };

    const filteredItems = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const itemDiscounts = cart.reduce((acc, curr) => acc + (curr.discount || 0), 0);
    const totalAmount = subtotal - itemDiscounts - totalDiscount;

    return (
        <DashboardLayout>
            {/* Checkout Confirmation Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">Confirm Order</h2>

                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.item_id} className="flex justify-between items-start border-b pb-2">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {item.quantity} × ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            {item.discount > 0 && (
                                                <p className="text-sm text-green-600">Discount: - ₹{item.discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">₹{((item.price * item.quantity) - item.discount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-2 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {itemDiscounts > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Item Discounts:</span>
                                    <span>- ₹{itemDiscounts.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {totalDiscount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Total Discount:</span>
                                    <span>- ₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold pt-2 border-t">
                                <span>Grand Total:</span>
                                <span className="text-green-600">₹{Math.max(0, totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowCheckoutModal(false)}
                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmCheckout}
                                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-semibold"
                            >
                                Confirm & Pay
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex h-full gap-4" style={{ height: 'calc(100vh - 120px)' }}>
                {/* Product List */}
                <div className="flex-1 bg-white p-4 rounded shadow overflow-y-auto">
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full p-2 border rounded mb-4"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-4">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="border p-4 rounded hover:shadow-md cursor-pointer" onClick={() => addToCart(item)}>
                                <h3 className="font-bold">{item.name}</h3>
                                <p className="text-gray-500">₹{item.selling_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p className="text-xs text-gray-400">Stock: {item.quantity}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cart */}
                <div className="w-96 bg-white p-4 rounded shadow flex flex-col">
                    <h2 className="text-xl font-bold mb-4">Current Sale</h2>
                    <div className="flex-1 overflow-y-auto">
                        {cart.map((item) => (
                            <div key={item.item_id} className="border-b pb-3 mb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-gray-500">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                    <button onClick={() => removeFromCart(item.item_id)} className="text-red-500 text-xl">×</button>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <button
                                        onClick={() => updateQuantity(item.item_id, -1)}
                                        className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                                    >
                                        -
                                    </button>
                                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.item_id, 1)}
                                        className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                                    >
                                        +
                                    </button>
                                    <span className="text-sm text-gray-600 ml-2">
                                        = ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-600">Discount:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.discount || 0}
                                        onChange={(e) => updateItemDiscount(item.item_id, parseFloat(e.target.value) || 0)}
                                        className="w-24 px-2 py-1 border rounded text-sm"
                                        placeholder="0.00"
                                    />
                                    <span className="text-xs text-gray-600">₹</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {itemDiscounts > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Item Discounts:</span>
                                <span>- ₹{itemDiscounts.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                            <label className="text-gray-600">Total Discount:</label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={totalDiscount}
                                    onChange={(e) => setTotalDiscount(parseFloat(e.target.value) || 0)}
                                    className="w-24 px-2 py-1 border rounded text-sm"
                                    placeholder="0.00"
                                />
                                <span className="text-xs">₹</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-xl font-bold pt-2 border-t">
                            <span>Total:</span>
                            <span>₹{Math.max(0, totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                            className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Checkout
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

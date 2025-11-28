import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { ShoppingCart, Truck, CheckCircle, Clock } from 'lucide-react';

export default function PurchasesPage() {
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
    const [items, setItems] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [transportCharges, setTransportCharges] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [purchases, setPurchases] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
        fetchHistory();
    }, []);

    const fetchData = async () => {
        try {
            const [itemsRes, suppliersRes] = await Promise.all([
                api.get('/inventory/'),
                api.get('/crm/suppliers')
            ]);
            setItems(itemsRes.data);
            setSuppliers(suppliersRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/sales/purchases');
            setPurchases(res.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const addToCart = (item: any) => {
        const existing = cart.find((c) => c.item_id === item.id);
        if (existing) {
            setCart(cart.map((c) => c.item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, {
                item_id: item.id,
                name: item.name,
                price: item.purchase_price || item.selling_price || 0,
                quantity: 1
            }]);
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

    const updatePrice = (itemId: number, price: number) => {
        setCart(cart.map((c) => c.item_id === itemId ? { ...c, price: Math.max(0, price) } : c));
    };

    const removeFromCart = (itemId: number) => {
        setCart(cart.filter((c) => c.item_id !== itemId));
    };

    const handlePurchase = () => {
        if (!selectedSupplier) {
            alert('Please select a supplier');
            return;
        }
        if (cart.length === 0) {
            alert('Please add items to purchase');
            return;
        }
        setShowConfirmModal(true);
    };

    const confirmPurchase = async () => {
        try {
            const payload = {
                supplier_id: parseInt(selectedSupplier),
                invoice_number: `PUR-${Date.now()}`,
                items: cart.map((c) => ({ item_id: c.item_id, quantity: c.quantity, price: c.price })),
                transport_charges: transportCharges
            };
            const res = await api.post('/sales/purchases', payload);

            // Download PDF receipt
            try {
                const pdfRes = await api.get(`/sales/purchases/${res.data.id}/pdf`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `purchase_${res.data.invoice_number}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (pdfError) {
                console.error('PDF download failed:', pdfError);
            }

            setShowConfirmModal(false);
            alert(`Purchase Order Created! Status: Ordered.\nPlease go to 'Order History' to receive goods when they arrive.`);
            setCart([]);
            setTransportCharges(0);
            setSelectedSupplier('');
            fetchHistory(); // Refresh history
            setActiveTab('history'); // Switch to history tab
        } catch (error) {
            alert('Purchase failed');
        }
    };

    const handleReceiveClick = (purchaseId: number) => {
        setSelectedPurchaseId(purchaseId);
        setShowReceiveModal(true);
    };

    const confirmReceive = async () => {
        if (!selectedPurchaseId) return;
        try {
            await api.post(`/sales/purchases/${selectedPurchaseId}/receive`);
            alert('Goods Received! Inventory updated.');
            setShowReceiveModal(false);
            setSelectedPurchaseId(null);
            fetchHistory();
            fetchData(); // Refresh inventory items
        } catch (error) {
            alert('Failed to receive order');
        }
    };

    const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const totalAmount = subtotal + transportCharges;
    const filteredItems = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const selectedSupplierData = suppliers.find(s => s.id === parseInt(selectedSupplier));

    return (
        <DashboardLayout>
            {/* Receive Confirmation Modal */}
            {showReceiveModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Confirm Receipt</h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to mark this order as Received? This will update your inventory stock.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowReceiveModal(false)}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReceive}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold"
                            >
                                Confirm Receive
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Purchase Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">Confirm Purchase Order</h2>

                        {/* Supplier Info */}
                        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm font-semibold text-gray-700">Supplier:</p>
                            <p className="text-lg font-bold text-blue-700">{selectedSupplierData?.name}</p>
                        </div>

                        {/* Items */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-3">Items to Purchase</h3>
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.item_id} className="flex justify-between items-start border-b pb-2">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {item.quantity} × ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t pt-4 space-y-2 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {transportCharges > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Transport Charges:</span>
                                    <span>₹{transportCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold pt-2 border-t">
                                <span>Total Amount:</span>
                                <span className="text-blue-600">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmPurchase}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold"
                            >
                                Create PO
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-900">Purchase Management</h1>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 border-b">
                    <button
                        className={`py-2 px-4 font-medium ${activeTab === 'new' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('new')}
                    >
                        New Purchase Order
                    </button>
                    <button
                        className={`py-2 px-4 font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Order History
                    </button>
                </div>

                {activeTab === 'new' ? (
                    <>
                        {/* Supplier Selection */}
                        <div className="bg-white p-4 rounded shadow">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Supplier *</label>
                            <select
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 border rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.target.value)}
                            >
                                <option value="">Choose a supplier...</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-4" style={{ height: 'calc(100vh - 350px)' }}>
                            {/* Items List */}
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
                                        <div
                                            key={item.id}
                                            className="border p-4 rounded cursor-pointer hover:shadow-md hover:border-blue-400 transition"
                                            onClick={() => addToCart(item)}
                                        >
                                            <h3 className="font-bold text-gray-900">{item.name}</h3>
                                            <p className="text-sm text-gray-500">Current Stock: {item.quantity}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Price: ₹{(item.purchase_price || item.selling_price || 0).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Purchase Cart */}
                            <div className="w-96 bg-white p-4 rounded shadow flex flex-col">
                                <h2 className="text-xl font-bold mb-4">Draft Order</h2>
                                <div className="flex-1 overflow-y-auto">
                                    {cart.map((item) => (
                                        <div key={item.item_id} className="border-b pb-3 mb-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.name}</p>
                                                </div>
                                                <button onClick={() => removeFromCart(item.item_id)} className="text-red-500 text-xl">×</button>
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="text-xs text-gray-600 w-16">Quantity:</label>
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
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-gray-600 w-16">Price (₹):</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.price}
                                                    onChange={(e) => updatePrice(item.item_id, parseFloat(e.target.value) || 0)}
                                                    className="flex-1 px-2 py-1 border rounded text-sm"
                                                />
                                                <span className="text-sm text-gray-600">
                                                    = ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 border-t pt-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600 w-32">Transport Charges:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={transportCharges}
                                            onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
                                            className="flex-1 px-2 py-1 border rounded text-sm"
                                            placeholder="0.00"
                                        />
                                        <span className="text-xs">₹</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="flex justify-between text-xl font-bold pt-2 border-t">
                                        <span>Total:</span>
                                        <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <button
                                        onClick={handlePurchase}
                                        disabled={cart.length === 0 || !selectedSupplier}
                                        className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Create Purchase Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {purchases.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(p.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {p.invoice_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {p.supplier_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {p.items_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            ₹{p.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.status === 'Received' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {p.status || 'Ordered'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {p.status !== 'Received' && (
                                                <button
                                                    onClick={() => handleReceiveClick(p.id)}
                                                    className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                                                >
                                                    <Truck size={16} /> Receive
                                                </button>
                                            )}
                                            {p.status === 'Received' && (
                                                <span className="text-green-600 flex items-center gap-1">
                                                    <CheckCircle size={16} /> Done
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {purchases.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                            No purchase history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

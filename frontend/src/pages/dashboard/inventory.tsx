import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import DashboardLayout from '@/components/layout/dashboard-layout';
import QRCode from 'react-qr-code';
import { QrReader } from 'react-qr-reader';
import { Scan, QrCode } from 'lucide-react';

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);

    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
    const [selectedQRItem, setSelectedQRItem] = useState<any>(null);

    const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
    const [bulkImportResults, setBulkImportResults] = useState<any>(null);
    const [bulkImportLoading, setBulkImportLoading] = useState(false);

    // Forms
    const [newItem, setNewItem] = useState({ name: '', quantity: 0, selling_price: 0, purchase_price: 0, category_id: '', image_url: '', min_stock: 5, barcode: '' });
    const [editItem, setEditItem] = useState<any>(null);
    const [newCategory, setNewCategory] = useState({ name: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const fetchData = async () => {
        try {
            const [itemsRes, catsRes] = await Promise.all([
                api.get('/inventory/'),
                api.get('/inventory/categories')
            ]);
            setItems(itemsRes.data);
            setCategories(catsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await api.post('/inventory/upload-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (isEdit) {
                    setEditItem({ ...editItem, image_url: res.data.url });
                } else {
                    setNewItem({ ...newItem, image_url: res.data.url });
                }
            } catch (error) {
                alert('Image upload failed');
            }
        }
    };

    const handleScan = (result: any, error: any) => {
        if (result) {
            const code = result?.text;
            if (code) {
                // Check if item exists
                const item = items.find(i => i.barcode === code || i.id.toString() === code);
                if (item) {
                    // Highlight or filter item
                    alert(`Found item: ${item.name}`);
                    // Optional: Set search filter if we had one, or scroll to item
                } else {
                    // Ask to add new item
                    if (confirm(`Item with code ${code} not found. Add new item?`)) {
                        setNewItem({ ...newItem, barcode: code });
                        setShowScanModal(false);
                        setShowAddModal(true);
                    }
                }
            }
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...newItem,
                category_id: newItem.category_id ? parseInt(newItem.category_id) : null
            };
            await api.post('/inventory/', payload);
            setShowAddModal(false);
            setNewItem({ name: '', quantity: 0, selling_price: 0, purchase_price: 0, category_id: '', image_url: '', min_stock: 5, barcode: '' });
            fetchData();
        } catch (error) {
            alert('Failed to add item');
        }
    };

    const handleEditItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...editItem,
                category_id: editItem.category_id ? parseInt(editItem.category_id) : null
            };
            await api.put(`/inventory/${editItem.id}`, payload);
            setShowEditModal(false);
            setEditItem(null);
            fetchData();
        } catch (error) {
            alert('Failed to update item');
        }
    };

    const handleDeleteItem = async (id: number) => {
        setItemToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            try {
                console.log('Deleting item with ID:', itemToDelete);
                const response = await api.delete(`/inventory/${itemToDelete}`);
                console.log('Delete response:', response.data);
                setShowDeleteModal(false);
                setItemToDelete(null);
                await fetchData();
            } catch (error: any) {
                console.error('Delete error:', error);
                alert(`Failed to delete item: ${error.response?.data?.detail || error.message}`);
            }
        }
    };

    const openEditModal = (item: any) => {
        setEditItem({
            ...item,
            category_id: item.category_id ? item.category_id.toString() : ''
        });
        setShowEditModal(true);
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/inventory/categories', newCategory);
            setNewCategory({ name: '' });
            fetchData();
        } catch (error) {
            alert('Failed to add category');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        setCategoryToDelete(id);
        setShowDeleteCategoryModal(true);
    };

    const confirmDeleteCategory = async () => {
        if (categoryToDelete) {
            try {
                await api.delete(`/inventory/categories/${categoryToDelete}`);
                setShowDeleteCategoryModal(false);
                setCategoryToDelete(null);
                await fetchData();
            } catch (error) {
                alert('Failed to delete category');
            }
        }
    };

    const handleBulkImport = async () => {
        if (!bulkImportFile) {
            alert('Please select a file');
            return;
        }

        setBulkImportLoading(true);
        setBulkImportResults(null);

        try {
            const formData = new FormData();
            formData.append('file', bulkImportFile);

            const response = await api.post('/inventory/bulk-import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setBulkImportResults(response.data);
            setBulkImportFile(null);
            await fetchData(); // Refresh inventory list
        } catch (error: any) {
            alert(`Bulk import failed: ${error.response?.data?.detail || error.message}`);
        } finally {
            setBulkImportLoading(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = 'name,category,quantity,purchase_price,selling_price,min_stock\nLaptop Dell XPS 13,Electronics,10,65000,75000,5\nMouse Logitech,Electronics,50,300,500,10\nOffice Chair,Furniture,20,3500,5000,3';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
                <div className="space-x-2">
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
                    >
                        Manage Categories
                    </button>
                    <button
                        onClick={() => setShowScanModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Scan size={18} /> Scan
                    </button>
                    <button
                        onClick={() => setShowBulkImportModal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        Bulk Import
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        Add Item
                    </button>
                </div>
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold mb-4">Add New Item</h2>
                        <form onSubmit={handleAddItem}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Barcode (Optional)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                        value={newItem.barcode || ''}
                                        onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
                                        placeholder="Scan or enter code"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowScanModal(true)}
                                        className="mt-1 bg-gray-100 border border-gray-300 rounded px-3 hover:bg-gray-200"
                                        title="Scan Barcode"
                                    >
                                        <Scan size={18} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={newItem.category_id}
                                    onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
                                >
                                    <option value="">Select Category...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    onChange={(e) => handleImageUpload(e, false)}
                                />
                                {newItem.image_url && (
                                    <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${newItem.image_url}`} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded" />
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                <input
                                    type="number"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Min Stock Alert</label>
                                <input
                                    type="number"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={newItem.min_stock}
                                    onChange={(e) => setNewItem({ ...newItem, min_stock: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Purchase Price (₹)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={newItem.purchase_price}
                                    onChange={(e) => setNewItem({ ...newItem, purchase_price: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Selling Price (₹)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={newItem.selling_price}
                                    onChange={(e) => setNewItem({ ...newItem, selling_price: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {showEditModal && editItem && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold mb-4">Edit Item</h2>
                        <form onSubmit={handleEditItem}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={editItem.name}
                                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Barcode</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={editItem.barcode || ''}
                                    onChange={(e) => setEditItem({ ...editItem, barcode: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={editItem.category_id}
                                    onChange={(e) => setEditItem({ ...editItem, category_id: e.target.value })}
                                >
                                    <option value="">Select Category...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    onChange={(e) => handleImageUpload(e, true)}
                                />
                                {editItem.image_url && (
                                    <div className="mt-2 relative">
                                        <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${editItem.image_url}`} alt="Preview" className="h-20 w-20 object-cover rounded" />
                                        <button
                                            type="button"
                                            onClick={() => setEditItem({ ...editItem, image_url: '' })}
                                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                <input
                                    type="number"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={editItem.quantity}
                                    onChange={(e) => setEditItem({ ...editItem, quantity: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Min Stock Alert</label>
                                <input
                                    type="number"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={editItem.min_stock}
                                    onChange={(e) => setEditItem({ ...editItem, min_stock: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Purchase Price (₹)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={editItem.purchase_price}
                                    onChange={(e) => setEditItem({ ...editItem, purchase_price: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Selling Price (₹)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                    value={editItem.selling_price}
                                    onChange={(e) => setEditItem({ ...editItem, selling_price: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                                >
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-lg font-bold mb-4">Manage Categories</h2>
                        <form onSubmit={handleAddCategory} className="mb-4 flex gap-2">
                            <input
                                type="text"
                                placeholder="New Category Name"
                                required
                                className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ name: e.target.value })}
                            />
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add</button>
                        </form>
                        <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                            {categories.map((cat) => (
                                <li key={cat.id} className="py-2 flex justify-between items-center">
                                    <span>{cat.name}</span>
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-lg font-bold mb-4 text-gray-900">Confirm Delete</h2>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setItemToDelete(null);
                                }}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Category Confirmation Modal */}
            {showDeleteCategoryModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-lg font-bold mb-4 text-gray-900">Confirm Delete Category</h2>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this category? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowDeleteCategoryModal(false);
                                    setCategoryToDelete(null);
                                }}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteCategory}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scanner Modal */}
            {showScanModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-md relative">
                        <button
                            onClick={() => setShowScanModal(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
                        >
                            ×
                        </button>
                        <h2 className="text-lg font-bold mb-4 text-center">Scan Barcode/QR</h2>
                        <div className="aspect-square bg-black rounded overflow-hidden">
                            <QrReader
                                onResult={handleScan}
                                constraints={{ facingMode: 'environment' }}
                                className="w-full h-full"
                            />
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-4">Point camera at a barcode or QR code</p>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && selectedQRItem && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
                        <h2 className="text-lg font-bold mb-4">{selectedQRItem.name}</h2>
                        <div className="bg-white p-4 rounded border">
                            <QRCode value={selectedQRItem.barcode || selectedQRItem.id.toString()} size={200} />
                        </div>
                        <p className="mt-4 text-sm text-gray-500 font-mono">{selectedQRItem.barcode || `ID: ${selectedQRItem.id}`}</p>
                        <button
                            onClick={() => setShowQRModal(false)}
                            className="mt-6 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showBulkImportModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[500px] max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold mb-4 text-gray-900">Bulk Import Inventory</h2>

                        {!bulkImportResults ? (
                            <>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">Upload a CSV or XLSX file to import multiple items at once.</p>
                                    <button
                                        onClick={downloadTemplate}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 underline mb-4"
                                    >
                                        Download Template
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                                    <input
                                        type="file"
                                        accept=".csv,.xlsx"
                                        onChange={(e) => setBulkImportFile(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                    />
                                    {bulkImportFile && (
                                        <p className="mt-2 text-sm text-gray-600">Selected: {bulkImportFile.name}</p>
                                    )}
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                                    <p className="text-sm text-blue-800 font-medium mb-1">Required Columns:</p>
                                    <ul className="text-xs text-blue-700 list-disc list-inside">
                                        <li>name (required)</li>
                                        <li>quantity (required)</li>
                                        <li>selling_price (required)</li>
                                        <li>category (optional - will be created if doesn't exist)</li>
                                        <li>min_stock (optional - defaults to 5)</li>
                                    </ul>
                                </div>

                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={() => {
                                            setShowBulkImportModal(false);
                                            setBulkImportFile(null);
                                            setBulkImportResults(null);
                                        }}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                                        disabled={bulkImportLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleBulkImport}
                                        disabled={!bulkImportFile || bulkImportLoading}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {bulkImportLoading ? 'Importing...' : 'Import'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <div className="bg-green-50 border border-green-200 rounded p-4 mb-3">
                                        <h3 className="font-semibold text-green-800 mb-2">Import Successful!</h3>
                                        <p className="text-sm text-green-700">✅ Items created: {bulkImportResults.items_created}</p>
                                        <p className="text-sm text-green-700">✅ Categories created: {bulkImportResults.categories_created}</p>
                                        <p className="text-sm text-green-700">📊 Total rows processed: {bulkImportResults.total_rows}</p>
                                    </div>

                                    {bulkImportResults.errors && bulkImportResults.errors.length > 0 && (
                                        <div className="bg-red-50 border border-red-200 rounded p-4">
                                            <h3 className="font-semibold text-red-800 mb-2">Errors ({bulkImportResults.errors.length}):</h3>
                                            <div className="max-h-40 overflow-y-auto">
                                                {bulkImportResults.errors.map((err: any, idx: number) => (
                                                    <p key={idx} className="text-xs text-red-700 mb-1">
                                                        Row {err.row}: {err.error}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => {
                                            setShowBulkImportModal(false);
                                            setBulkImportFile(null);
                                            setBulkImportResults(null);
                                        }}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="mt-8 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Item
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.map((item) => {
                                        const category = categories.find(c => c.id === item.category_id);
                                        const isLowStock = item.quantity < item.min_stock;
                                        return (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {item.image_url ? (
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <img className="h-10 w-10 rounded-full object-cover" src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${item.image_url}`} alt="" />
                                                            </div>
                                                        ) : (
                                                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs">
                                                                No Img
                                                            </div>
                                                        )}
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                            {isLowStock && (
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                                    Low Stock
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {category?.name || '-'}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isLowStock ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    ₹{item.selling_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                    <button onClick={() => { setSelectedQRItem(item); setShowQRModal(true); }} className="text-gray-600 hover:text-gray-900"><QrCode size={18} /></button>
                                                    <button onClick={() => openEditModal(item)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

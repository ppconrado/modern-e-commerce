'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  User,
  ShoppingBag,
  Package,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  CreditCard,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Address {
  id: string;
  type: 'HOME' | 'SHIPPING' | 'BILLING';
  label: string;
  address: string;
  city: string;
  zipCode: string;
  phone?: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  OrderItem: Array<{
    id: string;
    quantity: number;
  }>;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
  });

  const [addressForm, setAddressForm] = useState({
    type: 'HOME' as 'HOME' | 'SHIPPING' | 'BILLING',
    label: '',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
    isDefault: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchProfile();
      fetchOrders();
      fetchAddresses();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfileData({
        fullName: data.user.fullName || '',
        email: data.user.email || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses');
      if (!response.ok) throw new Error('Failed to fetch addresses');
      const data = await response.json();
      setAddresses(data.addresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      setEditingProfile(false);
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    setSaving(true);
    try {
      const url = editingAddress
        ? `/api/user/addresses/${editingAddress}`
        : '/api/user/addresses';

      const method = editingAddress ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });

      if (!response.ok) throw new Error('Failed to save address');

      toast({
        title: editingAddress ? 'Address updated' : 'Address added',
        description: `Your address has been ${
          editingAddress ? 'updated' : 'added'
        } successfully.`,
      });

      setEditingAddress(null);
      setShowNewAddress(false);
      resetAddressForm();
      fetchAddresses();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save address.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete address');

      toast({
        title: 'Address deleted',
        description: 'Your address has been deleted successfully.',
      });
      fetchAddresses();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete address.',
        variant: 'destructive',
      });
    }
  };

  const startEditAddress = (address: Address) => {
    setAddressForm({
      type: address.type,
      label: address.label,
      address: address.address,
      city: address.city,
      zipCode: address.zipCode,
      phone: address.phone || '',
      isDefault: address.isDefault,
    });
    setEditingAddress(address.id);
  };

  const resetAddressForm = () => {
    setAddressForm({
      type: 'HOME',
      label: '',
      address: '',
      city: '',
      zipCode: '',
      phone: '',
      isDefault: false,
    });
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'HOME':
        return <Home className="h-4 w-4" />;
      case 'BILLING':
        return <CreditCard className="h-4 w-4" />;
      case 'SHIPPING':
        return <Package className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const recentOrders = orders.slice(0, 3);
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Account</h1>
        <p className="text-gray-600">
          Manage your profile, addresses and view your orders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Type</p>
                <p className="text-lg font-semibold capitalize">
                  {session?.user?.role?.toLowerCase() || 'Customer'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Profile Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            {!editingProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingProfile(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Full Name
              </label>
              {editingProfile ? (
                <Input
                  value={profileData.fullName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, fullName: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-lg">{profileData.fullName}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="mt-1 text-lg">{profileData.email}</p>
            </div>

            {editingProfile && (
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingProfile(false);
                    fetchProfile();
                  }}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      <span className="text-sm font-bold">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          order.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {order.OrderItem.length} item(s)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Addresses Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            My Addresses
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetAddressForm();
              setShowNewAddress(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </CardHeader>
        <CardContent>
          {/* New/Edit Address Form */}
          {(showNewAddress || editingAddress) && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">
                {editingAddress ? 'Edit Address' : 'New Address'}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={addressForm.type}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        type: e.target.value as 'HOME' | 'SHIPPING' | 'BILLING',
                      })
                    }
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="HOME">Home</option>
                    <option value="SHIPPING">Shipping</option>
                    <option value="BILLING">Billing</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Label</label>
                  <Input
                    value={addressForm.label}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, label: e.target.value })
                    }
                    placeholder="Home, Work, etc."
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Street Address</label>
                  <Input
                    value={addressForm.address}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        address: e.target.value,
                      })
                    }
                    placeholder="123 Main St"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    placeholder="New York"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">ZIP/Postal Code</label>
                  <Input
                    value={addressForm.zipCode}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        zipCode: e.target.value,
                      })
                    }
                    placeholder="01310-100 or 10001"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">
                    Phone (Optional)
                  </label>
                  <Input
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          isDefault: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Set as default</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSaveAddress}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? 'Saving...' : 'Save Address'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewAddress(false);
                    setEditingAddress(null);
                    resetAddressForm();
                  }}
                  disabled={saving}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Address List */}
          {addresses.length === 0 && !showNewAddress && !editingAddress ? (
            <p className="text-gray-500 text-center py-8">
              No addresses saved yet
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getAddressIcon(addr.type)}
                      <span className="font-medium">{addr.label}</span>
                    </div>
                    {addr.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <p>{addr.address}</p>
                    <p>
                      {addr.city}, {addr.zipCode}
                    </p>
                    {addr.phone && <p>{addr.phone}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditAddress(addr)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

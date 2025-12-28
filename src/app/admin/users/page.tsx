'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'SUPER_ADMIN'>(
    'ADMIN'
  );
  const [inviteLink, setInviteLink] = useState('');

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json() as Promise<User[]>;
    },
  });

  // Fetch invites
  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: async () => {
      const res = await fetch('/api/admin/invite');
      if (!res.ok) throw new Error('Failed to fetch invites');
      return res.json() as Promise<Invite[]>;
    },
  });

  // Create invite mutation
  const createInviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create invite');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Invite created!',
        description: 'Copy the link below to send to the new admin.',
      });
      setInviteLink(data.inviteLink);
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    createInviteMutation.mutate();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Copied!',
      description: 'Invite link copied to clipboard',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      {/* Create Invite Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Invite New Admin</h2>
        <form onSubmit={handleCreateInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as 'ADMIN' | 'SUPER_ADMIN')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <Button
            type="submit"
            disabled={createInviteMutation.isPending}
            className="w-full"
          >
            {createInviteMutation.isPending ? 'Creating...' : 'Create Invite'}
          </Button>
        </form>

        {inviteLink && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm font-medium mb-2">
              Invite Link (expires in 7 days):
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
              />
              <Button onClick={copyToClipboard} variant="outline">
                Copy
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              ⚠️ In production, this would be sent via email automatically.
            </p>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        {usersLoading ? (
          <p className="text-gray-500">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Full Name</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">{user.fullName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'ADMIN'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invites */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Invites</h2>
        {invitesLoading ? (
          <p className="text-gray-500">Loading invites...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Expires</th>
                </tr>
              </thead>
              <tbody>
                {invites?.map((invite) => {
                  const isExpired = new Date(invite.expiresAt) < new Date();
                  const isUsed = !!invite.usedAt;
                  return (
                    <tr key={invite.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{invite.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            invite.role === 'SUPER_ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {invite.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            isUsed
                              ? 'bg-green-100 text-green-800'
                              : isExpired
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {isUsed ? 'Used' : isExpired ? 'Expired' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {invites?.length === 0 && (
              <p className="text-gray-500 text-center py-4">No invites yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

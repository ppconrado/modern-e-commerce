"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MaintenancePage from './MaintenancePage';

export default function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const [maintenance, setMaintenance] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/public-settings');
        if (res.ok) {
          const settings = await res.json();
          setMaintenance(!!settings?.disableMaintenanceMode);
        }
      } catch {}
    }
    fetchSettings();
  }, []);

  const isAdminRoute = pathname && pathname.startsWith('/admin');
  const isLoginRoute = pathname && pathname.startsWith('/login');
  const isAdminUser = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  if (maintenance && !isAdminRoute && !isLoginRoute && !isAdminUser) {
    return <MaintenancePage />;
  }
  return <>{children}</>;
}

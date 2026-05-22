import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-h-screen px-4 pb-8 pt-20 lg:ml-72 lg:px-8 lg:pt-8">
        <Outlet />
      </main>
    </div>
  );
}

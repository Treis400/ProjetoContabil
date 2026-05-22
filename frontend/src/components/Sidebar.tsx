import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/processos', label: 'Processos' },
  { to: '/kanban', label: 'Kanban' },
  { to: '/documentos', label: 'Documentos' },
  { to: '/tributario', label: 'Tributario Anual' },
  { to: '/alertas', label: 'Alertas' },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 rounded-xl bg-slate-900 p-2 text-white shadow lg:hidden"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 transform border-r border-slate-200 bg-slate-950 px-6 py-8 text-slate-100 transition ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <Link to="/" className="mb-10 block">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">
            Escritorio
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Gestao Contabil</h1>
        </Link>

        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-sky-300">{user?.role}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 w-full rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400 hover:text-sky-300"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}

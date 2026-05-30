'use client';

import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/app/lib/actions';
import { useState } from 'react';

export default function LoginForm() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={dispatch} className="space-y-4">
      <div className="rounded-2xl bg-white shadow-xl shadow-slate-200/60 border border-slate-100 px-8 pb-8 pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bienvenido de vuelta
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4 animate-shake">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Error al iniciar sesión</p>
              <p className="text-xs text-red-500 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label
              className="mb-2 block text-xs font-semibold text-slate-700 uppercase tracking-wide"
              htmlFor="email"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                id="email"
                type="email"
                name="email"
                placeholder="tu@correo.com"
                required
                autoComplete="email"
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 peer-focus:text-indigo-500 transition-colors" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              className="mb-2 block text-xs font-semibold text-slate-700 uppercase tracking-wide"
              htmlFor="password"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="current-password"
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 peer-focus:text-indigo-500 transition-colors" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword
                  ? <EyeSlashIcon className="h-4 w-4" />
                  : <EyeIcon className="h-4 w-4" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <LoginButton />

        {/* Footer hint */}
        <p className="mt-4 text-center text-xs text-slate-400">
          ¿Problemas para ingresar? Contacta a tu administrador.
        </p>
      </div>
    </form>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button
      id="login-submit-btn"
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
    >
      {pending ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Iniciando sesión...</span>
        </>
      ) : (
        <>
          <span>Iniciar Sesión</span>
          <ArrowRightIcon className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

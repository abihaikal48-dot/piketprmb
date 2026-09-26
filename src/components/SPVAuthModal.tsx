import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, AlertCircle, X, Shield, ArrowRight } from 'lucide-react';

interface SPVAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PIN_STORAGE_KEY = 'piket_cihuy_spv_pin';
const DEFAULT_PIN = '1234';

export const getStoredSPVPin = (): string => {
  return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
};

export const setStoredSPVPin = (newPin: string): void => {
  localStorage.setItem(PIN_STORAGE_KEY, newPin);
};

export const SPVAuthModal: React.FC<SPVAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPin = getStoredSPVPin();

  const handleDigitClick = (digit: string) => {
    setError(false);
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin === currentPin) {
        setTimeout(() => {
          onSuccess();
          setPin('');
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setError(false);
    setPin(prev => prev.slice(0, -1));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === currentPin) {
      onSuccess();
      setPin('');
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length >= 4) {
      setStoredSPVPin(newPin.trim());
      setChangeSuccess(true);
      setTimeout(() => {
        setIsChangingPin(false);
        setChangeSuccess(false);
        setNewPin('');
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Akses Kepala Outlet</h3>
              <p className="text-[11px] text-emerald-700 font-semibold">Ummu Sallaamah • Hara Chicken</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isChangingPin ? (
          <div className="mt-4 space-y-4">
            <div className="text-center">
              <p className="text-xs text-slate-600 font-medium">
                Masukkan PIN untuk membuka dashboard & pengaturan:
              </p>

              {/* PIN Dots */}
              <div className="flex justify-center gap-3 my-4">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      pin.length > i
                        ? 'bg-slate-900 border-slate-900 scale-110'
                        : 'border-slate-300 bg-slate-100'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-red-600 font-medium flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  PIN salah, default adalah 1234
                </p>
              )}
            </div>

            {/* Standard input form */}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Ketik PIN (default: 1234)"
                  value={pin}
                  onChange={e => {
                    setError(false);
                    setPin(e.target.value);
                  }}
                  className="w-full text-center text-sm tracking-widest font-mono font-bold py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shrink-0"
                >
                  Buka
                </button>
              </div>
            </form>

            {/* Keypad for mobile touch */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigitClick(num)}
                  className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-base transition-colors border border-slate-200/80 active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="py-2.5 rounded-xl text-slate-500 font-semibold text-xs hover:bg-slate-100 transition-colors border border-slate-200/60"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-base transition-colors border border-slate-200/80 active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="py-2.5 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors border border-slate-200/60"
              >
                Hapus
              </button>
            </div>

            {/* Change PIN toggle */}
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsChangingPin(true)}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>Ganti PIN SPV</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveNewPin} className="mt-4 space-y-3">
            <p className="text-xs text-slate-600 font-medium">
              Masukkan PIN baru (minimal 4 angka):
            </p>
            <input
              type="text"
              maxLength={6}
              placeholder="Contoh: 5678"
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-sm tracking-widest font-mono font-bold py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              autoFocus
            />

            {changeSuccess && (
              <p className="text-xs text-emerald-600 text-center font-bold">
                PIN berhasil diperbarui!
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsChangingPin(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={newPin.length < 4}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
              >
                Simpan PIN
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

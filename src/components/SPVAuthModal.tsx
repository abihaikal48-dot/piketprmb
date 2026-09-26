import React, { useState } from 'react';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';
import { usePiket } from '../context/PiketContext';

interface SPVAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SPVAuthModal: React.FC<SPVAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [spvPin, setSpvPin] = useState<string>(() => {
    return localStorage.getItem('piket_cihuy_spv_pin') || '1234';
  });
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDigitClick = (digit: string) => {
    setError(false);
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin === spvPin) {
        setTimeout(() => {
          setPin('');
          onSuccess();
        }, 150);
      } else if (nextPin.length >= spvPin.length && nextPin !== spvPin) {
        setError(true);
        setTimeout(() => {
          setPin('');
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === spvPin) {
      setPin('');
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setPin(''), 600);
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length >= 4) {
      const pinValue = newPin.trim();
      setSpvPin(pinValue);
      localStorage.setItem('piket_cihuy_spv_pin', pinValue);
      setChangeSuccess(true);
      setTimeout(() => {
        setIsChangingPin(false);
        setChangeSuccess(false);
        setNewPin('');
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Portal Kepala Outlet</h3>
              <p className="text-xs text-zinc-500">Ummu Sallaamah · Hara Chicken</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isChangingPin ? (
          <div className="mt-4 space-y-4">
            <div className="text-center">
              <p className="text-xs text-zinc-500">
                Masukkan PIN otorisasi (default: 1234):
              </p>

              {/* PIN Dots */}
              <div className="flex justify-center gap-3 my-4">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      pin.length > i
                        ? 'bg-zinc-900 border-zinc-900 scale-110'
                        : 'border-zinc-300 bg-zinc-100'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-rose-600 font-medium flex items-center justify-center gap-1">
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
                  placeholder="Ketik PIN..."
                  value={pin}
                  onChange={e => {
                    setError(false);
                    setPin(e.target.value);
                  }}
                  className="w-full text-center text-sm tracking-widest font-mono font-medium py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:bg-white focus:outline-hidden focus:border-zinc-400"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer shadow-xs"
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
                  className="py-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-medium text-base transition-colors border border-zinc-200/70 active:scale-95 cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="py-2.5 rounded-xl text-zinc-500 font-medium text-xs hover:bg-zinc-100 transition-colors border border-zinc-200/60 cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="py-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-medium text-base transition-colors border border-zinc-200/70 active:scale-95 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="py-2.5 rounded-xl text-zinc-600 font-medium text-xs hover:bg-zinc-100 transition-colors border border-zinc-200/60 cursor-pointer"
              >
                Hapus
              </button>
            </div>

            {/* Change PIN toggle */}
            <div className="pt-2 text-center border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsChangingPin(true)}
                className="text-xs text-zinc-500 hover:text-zinc-800 font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                <span>Ubah PIN Akses</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveNewPin} className="mt-4 space-y-3.5">
            <p className="text-xs text-zinc-500">
              Masukkan PIN baru (minimal 4 digit):
            </p>
            <input
              type="text"
              maxLength={6}
              placeholder="Contoh: 5678"
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-sm tracking-widest font-mono font-medium py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-hidden focus:border-zinc-400"
              autoFocus
            />

            {changeSuccess && (
              <p className="text-xs text-emerald-600 text-center font-medium">
                PIN berhasil diperbarui!
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsChangingPin(false)}
                className="flex-1 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={newPin.length < 4}
                className="flex-1 py-2 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-xs"
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

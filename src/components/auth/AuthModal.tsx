import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Flame,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../firebase/AuthContext';
import { GymChuotLogo } from '../common/GymChuotLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { signInGoogle, signInApple, signInAnon, signInEmail, signUpEmail, user } = useAuth();

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEmailDisabledError, setIsEmailDisabledError] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSubmit = async () => {
    setErrorMsg(null);
    setIsEmailDisabledError(false);
    setIsLoading(true);
    try {
      await signInGoogle();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Cửa sổ đăng nhập đã được đóng.');
      } else {
        setErrorMsg(err?.message || 'Đăng nhập Google không thành công.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSubmit = async () => {
    setErrorMsg(null);
    setIsEmailDisabledError(false);
    setIsLoading(true);
    try {
      await signInApple();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Cửa sổ đăng nhập Apple đã được đóng.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setErrorMsg('Phương thức đăng nhập Apple hiện chưa được kích hoạt trong Firebase Console.');
      } else {
        setErrorMsg(err?.message || 'Đăng nhập Apple không thành công.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonSubmit = async () => {
    setErrorMsg(null);
    setIsEmailDisabledError(false);
    setIsLoading(true);
    try {
      await signInAnon();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        setErrorMsg('Chế độ khách (Anonymous Auth) chưa được bật trong Firebase Console.');
      } else {
        setErrorMsg(err?.message || 'Không thể khởi tạo phiên khách.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsEmailDisabledError(false);

    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu tối thiểu 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      if (tab === 'signin') {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password, displayName.trim() || 'Gymer Chuột');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setIsEmailDisabledError(true);
        setErrorMsg('Phương thức email/mật khẩu hiện chưa được kích hoạt trong Firebase Console.');
      } else if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setErrorMsg('Email hoặc mật khẩu không chính xác.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('Email này đã được đăng ký. Vui lòng chuyển sang mục đăng nhập.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Mật khẩu quá ngắn, vui lòng nhập tối thiểu 6 ký tự.');
      } else {
        setErrorMsg(err?.message || 'Có lỗi xảy ra trong quá trình xác thực.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-zinc-950/95 backdrop-blur-2xl border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 flex flex-col gap-5 relative text-zinc-100 shadow-2xl max-h-[90dvh] overflow-y-auto overscroll-y-contain scroll-touch pb-[max(24px,env(safe-area-inset-bottom,24px))] sm:pb-8 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1.5 rounded-full mx-auto sm:hidden -mt-1 bg-white/20 shrink-0" />

        <button
          onClick={onClose}
          aria-label="Đóng cửa sổ đăng nhập"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-200 ease-out active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          <X className="w-5 h-5 stroke-[1.75]" />
        </button>

        <div className="flex flex-col items-center text-center gap-2 pt-1 sm:pt-2">
          <GymChuotLogo size="lg" showText={false} />
          <h3 className="font-display font-bold tracking-tight text-xl text-zinc-100">
            {tab === 'signin' ? 'Đăng nhập Đi tập đê!' : 'Tạo tài khoản Đi tập đê!'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-[280px] leading-relaxed">
            Đồng bộ hồ sơ, dữ liệu tập luyện và kỷ lục cá nhân trực tiếp lên đám mây.
          </p>
        </div>

        {/* Tab Switcher (Apple Segmented Control) */}
        <div className="apple-segmented-control w-full">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setErrorMsg(null);
              setIsEmailDisabledError(false);
            }}
            className={`flex-1 min-h-[44px] py-2 text-xs sm:text-sm rounded-xl transition-all duration-200 ease-out active:scale-[0.98] ${
              tab === 'signin'
                ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMsg(null);
              setIsEmailDisabledError(false);
            }}
            className={`flex-1 min-h-[44px] py-2 text-xs sm:text-sm rounded-xl transition-all duration-200 ease-out active:scale-[0.98] ${
              tab === 'signup'
                ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            Đăng ký mới
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleGoogleSubmit}
            disabled={isLoading}
            className="apple-btn-secondary w-full min-h-[44px] py-2.5 px-4 text-zinc-100 font-medium text-sm flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>
              {user?.isAnonymous ? 'Liên kết tài khoản Google' : 'Đăng nhập nhanh với Google'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleAppleSubmit}
              disabled={isLoading}
              className="apple-btn-secondary min-h-[44px] py-2 px-3 text-zinc-100 font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span>Apple ID</span>
            </button>

            <button
              type="button"
              onClick={handleAnonSubmit}
              disabled={isLoading || Boolean(user?.isAnonymous)}
              className="apple-btn-secondary min-h-[44px] py-2 px-3 text-zinc-300 font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserIcon className="w-4 h-4 text-[#E4483C] stroke-[1.75] shrink-0" />
              <span>{user?.isAnonymous ? 'Đang dùng Khách' : 'Chế độ Khách'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs font-normal text-zinc-500">
            Hoặc tiếp tục bằng email
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          {tab === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 block font-medium">
                Tên hiển thị
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ví dụ: Long Aura, Tuấn Hùng..."
                  className="apple-input w-full min-h-[44px] px-4 py-2.5 pl-10 text-base"
                />
                <UserIcon className="w-4 h-4 text-zinc-400 stroke-[1.75] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 block font-medium">
              Địa chỉ email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lifter@ditapde.vn"
                className="apple-input w-full min-h-[44px] px-4 py-2.5 pl-10 text-base"
              />
              <Mail className="w-4 h-4 text-zinc-400 stroke-[1.75] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400 block font-medium">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="apple-input w-full min-h-[44px] px-4 py-2.5 pl-10 pr-11 text-base"
              />
              <Lock className="w-4 h-4 text-zinc-400 stroke-[1.75] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Hiện hoặc ẩn mật khẩu"
                className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/10 absolute right-1 top-1/2 -translate-y-1/2 rounded-xl transition-all duration-200 active:scale-[0.96]"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 stroke-[1.75]" />
                ) : (
                  <Eye className="w-4 h-4 stroke-[1.75]" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-zinc-100 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 stroke-[1.75] shrink-0 mt-0.5" />
              <div className="flex-1 flex flex-col gap-1">
                <p className="font-semibold text-rose-400">{errorMsg}</p>
                {isEmailDisabledError && (
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Hãy sử dụng nút <strong>"Đăng nhập nhanh với Google"</strong> ở trên hoặc bật phương thức Email/Password trong Firebase Console.
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="apple-btn-primary w-full min-h-[44px] py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Flame className="w-4 h-4 stroke-[1.75]" />
                <span>{tab === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-white/10 text-center">
          <p className="text-xs text-zinc-400">
            {tab === 'signin' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button
              type="button"
              onClick={() => {
                setTab(tab === 'signin' ? 'signup' : 'signin');
                setErrorMsg(null);
                setIsEmailDisabledError(false);
              }}
              className="px-2 text-[#E4483C] font-semibold hover:underline"
            >
              {tab === 'signin' ? 'Đăng ký ngay' : 'Đăng nhập tại đây'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

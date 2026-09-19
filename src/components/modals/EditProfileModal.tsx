import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User as UserIcon,
  Sparkles,
  Camera,
  Check,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  RefreshCw,
  Info,
  Shield,
  Lock,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: User | null;
  onSuccess?: (updatedUser: User) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSuccess,
}) => {
  const { currentUser, updateHunterProfile, resetUserPassword, users } = useAuth();

  const activeUser = targetUser
    ? users.find((u) => u.id === targetUser.id) || targetUser
    : currentUser;

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarSourceTab, setAvatarSourceTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // --- Password Change State ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeUser && isOpen) {
      setDisplayName(activeUser.displayName || '');
      setUsername(activeUser.username ? activeUser.username.replace(/^@+/, '') : '');
      setAvatarUrl(activeUser.avatarUrl || '');
      setBio(activeUser.bio || '');
      setErrorMsg(null);
      setUploadPreview(null);
      setAvatarSourceTab('upload');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg(null);
    }
  }, [activeUser, isOpen]);

  if (!isOpen || !activeUser) return null;

  const isSelf = currentUser.id === activeUser.id;
  const isAdmin = currentUser.role === 'ADMIN';
  const canChangePassword = isSelf || isAdmin;

  const handleFileProcess = (file: File) => {
    setErrorMsg(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      setErrorMsg(
        `Format file tidak didukung (${file.type || 'unknown'}). Gunakan file PNG, JPG, JPEG, WEBP, atau GIF.`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMsg(
        `Ukuran file terlalu besar (${sizeMb} MB). Maksimal ukuran file foto adalah 5 MB.`
      );
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 512;
          let w = img.width;
          let h = img.height;

          const minSide = Math.min(w, h);
          const sx = (w - minSide) / 2;
          const sy = (h - minSide) / 2;

          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxDim, maxDim);
            const optimizedUrl = canvas.toDataURL('image/jpeg', 0.9);
            setUploadPreview(optimizedUrl);
            setAvatarUrl(optimizedUrl);
          } else {
            setUploadPreview(result);
            setAvatarUrl(result);
          }
          setIsCompressing(false);
        };
        img.onerror = () => {
          setIsCompressing(false);
          setErrorMsg('Gagal memproses gambar. Pastikan file gambar tidak rusak.');
        };
        img.src = result;
      } else {
        setIsCompressing(false);
        setErrorMsg('Gagal membaca file gambar.');
      }
    };

    reader.onerror = () => {
      setIsCompressing(false);
      setErrorMsg('Terjadi kesalahan saat membaca file.');
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleResetAvatar = () => {
    setUploadPreview(null);
    setAvatarUrl(activeUser.avatarUrl || PRESET_AVATARS[0]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Nama tampilan (Display Name) tidak boleh kosong.');
      return;
    }

    const cleanUsername = username.trim().replace(/^@+/, '');
    if (!cleanUsername) {
      setErrorMsg('Nickname / Username (@handle) tidak boleh kosong.');
      return;
    }

    const usernameConflict = users.find(
      (u) => u.id !== activeUser.id && u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (usernameConflict) {
      setErrorMsg(`Username @${cleanUsername} sudah digunakan oleh Hunter lain.`);
      return;
    }

    if (!isAdmin && !isSelf) {
      setErrorMsg('Akses Ditolak: Anda hanya memiliki izin mengedit profil sendiri.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const finalAvatarUrl = avatarUrl.trim() || activeUser.avatarUrl || PRESET_AVATARS[0];

    const result = updateHunterProfile(activeUser.id, {
      displayName: displayName.trim(),
      username: cleanUsername.toLowerCase(),
      avatarUrl: finalAvatarUrl,
      bio: bio.trim(),
    });

    setIsSubmitting(false);

    if (result.success) {
      onSuccess?.({
        ...activeUser,
        displayName: displayName.trim(),
        username: cleanUsername.toLowerCase(),
        avatarUrl: finalAvatarUrl,
        bio: bio.trim(),
      });
      onClose();
    } else {
      setErrorMsg(result.error || 'Gagal memperbarui profil.');
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg(null);

    if (isSelf && !currentPassword) {
      setPasswordMsg({ text: 'Masukkan password saat ini untuk verifikasi.', isError: true });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ text: 'Password baru minimal 6 karakter.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Konfirmasi password tidak cocok.', isError: true });
      return;
    }

    setIsChangingPassword(true);
    const success = await resetUserPassword(activeUser.id, newPassword, currentPassword);
    setIsChangingPassword(false);

    if (success) {
      setPasswordMsg({ text: 'Password berhasil diperbarui!', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({
        text: isSelf ? 'Password saat ini salah, atau gagal mengubah password.' : 'Gagal mengubah password. Coba lagi.',
        isError: true,
      });
    }
  };

  const currentPreviewSrc =
    avatarUrl ||
    activeUser.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  return (
    <div
      id="edit-profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="edit-profile-container"
        onClick={(e) => e.stopPropagation()}
        className="card-theme bg-surface border-2 border-theme rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[92vh] flex flex-col"
      >
        <div className="px-5 sm:px-6 py-4 border-b border-theme flex items-center justify-between bg-surface-alt/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-theme leading-none">
                {isSelf ? 'Edit Profil Hunter' : `Edit Profil: ${activeUser.displayName}`}
              </h2>
              <p className="text-xs text-theme-muted mt-0.5">
                {isSelf
                  ? 'Unggah foto profil kustom, atur nama tampilan, dan bio operative Anda.'
                  : `Kelola foto dan informasi akun untuk @${activeUser.username}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-theme-muted/10 text-theme-muted hover:text-theme transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-surface-alt border border-theme space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-theme flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-orange-500" />
                <span>Foto Profil Hunter (Avatar)</span>
              </label>

              <div className="flex items-center bg-surface border border-theme rounded-xl p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setAvatarSourceTab('upload')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    avatarSourceTab === 'upload'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-theme-muted hover:text-theme'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarSourceTab('preset')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    avatarSourceTab === 'preset'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-theme-muted hover:text-theme'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Preset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarSourceTab('url')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    avatarSourceTab === 'url'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-theme-muted hover:text-theme'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>URL</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface p-3.5 rounded-xl border border-theme">
              <div className="relative shrink-0 flex flex-col items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-orange-500/30 shadow-lg bg-surface-alt relative group">
                  <img
                    src={currentPreviewSrc}
                    alt={displayName || 'Avatar Hunter'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_AVATARS[0];
                    }}
                  />
                  {isCompressing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-mono text-theme-muted mt-1.5">Rasio 1:1 Square</span>
              </div>

              <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-bold text-theme">
                    {uploadPreview ? 'Foto Kustom Terpilih (Siap Digunakan)' : 'Foto Profil Saat Ini'}
                  </h4>
                  <p className="text-[11px] text-theme-muted">
                    {uploadPreview
                      ? 'Foto Anda telah diproses dengan rasio persegi 1:1. Klik "Simpan Perubahan" di bawah untuk menerapkan.'
                      : 'Unggah foto pribadi dari galeri perangkat Anda atau pilih avatar preset.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  {avatarSourceTab === 'upload' && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadPreview ? 'Ganti Foto Lain' : 'Pilih File Gambar'}</span>
                    </button>
                  )}

                  {(uploadPreview || avatarUrl !== activeUser.avatarUrl) && (
                    <button
                      type="button"
                      onClick={handleResetAvatar}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-alt hover:bg-rose-500/10 text-theme-muted hover:text-rose-500 border border-theme text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Kembalikan ke foto awal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {avatarSourceTab === 'upload' && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                    dragActive
                      ? 'border-orange-500 bg-orange-500/10 scale-[1.01]'
                      : 'border-theme hover:border-orange-500/50 bg-surface/50 hover:bg-surface'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-1.5">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-theme">
                    Klik untuk memilih file foto atau seret (drag & drop) gambar ke sini
                  </p>
                  <p className="text-[10px] text-theme-muted mt-0.5">
                    Mendukung format PNG, JPG, JPEG, WEBP (Maksimal 5 MB)
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/20 text-[11px] text-theme-muted flex items-start gap-2">
                  <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-theme">Panduan Foto Profil:</span>
                    <p>
                      Gunakan rasio <strong>1:1 (Persegi)</strong> atau ukuran <strong>512 × 512 px</strong> untuk hasil avatar terbaik di leaderboard dan dashboard. Sistem akan otomatis memusatkan crop gambar Anda.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {avatarSourceTab === 'preset' && (
              <div className="space-y-2">
                <p className="text-[11px] text-theme-muted">
                  Pilih salah satu karakter operative Web Order bawaan sistem:
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PRESET_AVATARS.map((url, idx) => {
                    const isSelected = avatarUrl === url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(url);
                          setUploadPreview(null);
                        }}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'border-orange-500 ring-2 ring-orange-500/40 scale-105'
                            : 'border-theme hover:border-orange-500/50 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Preset ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {avatarSourceTab === 'url' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-theme">Link URL Foto Eksternal</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/foto-hunter.jpg"
                    value={avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value);
                      setUploadPreview(null);
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-surface border border-theme text-xs font-medium text-theme focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-2.5 py-1 rounded-xl bg-surface border border-theme text-xs text-theme-muted hover:text-theme"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-theme-muted">
                  Tempel URL gambar langsung berakhiran .png, .jpg, atau .webp dari hosting foto Anda.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-theme flex items-center justify-between">
              <span>Nama Tampilan Hunter (Display Name)</span>
              <span className="text-[10px] text-rose-500 font-bold">*Wajib Diisi</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Alex Vance, Ketut Hunter"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-bold text-theme focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-theme flex items-center justify-between">
              <span>Nickname / Username (@handle)</span>
              <span className="text-[10px] text-rose-500 font-bold">*Wajib Diisi</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-theme-muted text-xs select-none">
                @
              </span>
              <input
                type="text"
                required
                placeholder="speedrunner"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/^@+/, ''))}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-surface-alt border border-theme text-xs font-mono font-bold text-theme focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
            <p className="text-[10px] text-theme-muted">
              Nickname unik untuk identitas operative di HUD, leaderboard, dan profil hunter.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-theme flex items-center justify-between">
              <span>Bio & Slogan Operative</span>
              <span className="text-[10px] text-theme-muted">Opsional</span>
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Lead Hunter Bali Printing Center siap menaklukkan target omset harian! 🎯"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-alt border border-theme text-xs font-medium text-theme focus:ring-2 focus:ring-orange-500 focus:outline-hidden resize-none"
            />
          </div>

          {canChangePassword && (
            <div className="p-4 rounded-2xl bg-surface-alt border border-theme space-y-3">
              <label className="text-xs font-black text-theme flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-orange-500" />
                <span>Ganti Password</span>
              </label>

              {passwordMsg && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] font-medium flex items-center gap-2 ${
                    passwordMsg.isError
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500'
                      : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {passwordMsg.isError ? (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              {isSelf && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-theme-muted">Password Saat Ini</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Verifikasi identitas Anda"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface border border-theme text-xs font-medium text-theme focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-theme-muted">Password Baru</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface border border-theme text-xs font-medium text-theme focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-theme-muted">Konfirmasi Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface border border-theme text-xs font-medium text-theme focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isChangingPassword ? 'Menyimpan...' : 'Ubah Password'}</span>
              </button>
            </div>
          )}

          <div className="p-3 rounded-2xl bg-surface-alt/50 border border-theme flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-theme-muted" />
              <div>
                <div className="font-bold text-theme font-mono">
                  @{username.trim().replace(/^@+/, '') || activeUser.username}
                </div>
                <div className="text-[10px] text-theme-muted font-mono">ID: {activeUser.id}</div>
              </div>
            </div>
            <span
              className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                activeUser.role === 'ADMIN'
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                  : activeUser.role === 'VIEWER'
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              Role: {activeUser.role}
            </span>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-theme shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface-alt hover:bg-theme-muted/10 border border-theme text-xs font-bold text-theme transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
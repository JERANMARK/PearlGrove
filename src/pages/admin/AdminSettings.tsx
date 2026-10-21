import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  MessageCircle,
  Building,
  Phone,
  Mail,
  MapPin,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { logout } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Business Settings
  const [whatsappNumber, setWhatsappNumber] = useState('94715498142');
  const [businessName, setBusinessName] = useState('Pearl Grove');
  const [businessSubname, setBusinessSubname] = useState('MICROGREENS');
  const [contactPhone, setContactPhone] = useState('071 549 8142');
  const [contactEmail, setContactEmail] = useState('pearlgrovemicrogreens@gmail.com');
  const [location, setLocation] = useState('Upcot, Maskeliya, Sri Lanka');
  const [currencySymbol, setCurrencySymbol] = useState('Rs.');

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password strength calculation
  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Notifications
  const [businessFeedback, setBusinessFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await adminApi.getSettings();
        if (res.success && res.data) {
          const d = res.data;
          if (d.whatsapp_number) setWhatsappNumber(d.whatsapp_number);
          if (d.business_name) setBusinessName(d.business_name);
          if (d.business_subname) setBusinessSubname(d.business_subname);
          if (d.contact_phone) setContactPhone(d.contact_phone);
          if (d.contact_email) setContactEmail(d.contact_email);
          if (d.location) setLocation(d.location);
          if (d.currency_symbol) setCurrencySymbol(d.currency_symbol);
        }
      } catch (err: any) {
        // Retain initial defaults
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveBusinessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBusiness(true);
    setBusinessFeedback(null);

    const payload = {
      whatsapp_number: whatsappNumber.replace(/[^0-9]/g, ''),
      business_name: businessName.trim(),
      business_subname: businessSubname.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      location: location.trim(),
      currency_symbol: currencySymbol.trim(),
    };

    try {
      const res = await adminApi.updateSettings(payload);
      if (res.success) {
        setBusinessFeedback({
          type: 'success',
          text: 'Business configurations saved successfully.',
        });
      } else {
        setBusinessFeedback({
          type: 'error',
          text: res.error || 'Failed to save settings.',
        });
      }
    } catch (err: any) {
      setBusinessFeedback({
        type: 'error',
        text: err.message || 'Error communicating with server.',
      });
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    const passwordBytes = new TextEncoder().encode(newPassword).length;
    if (passwordBytes < 12 || passwordBytes > 72) {
      setPasswordFeedback({
        type: 'error',
        text: 'New password must be between 12 and 72 bytes.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        text: 'New passwords do not match.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await adminApi.updatePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setPasswordFeedback({
          type: 'success',
          text: 'Administrator password changed successfully.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await logout();
      } else {
        setPasswordFeedback({
          type: 'error',
          text: res.error || 'Failed to update password.',
        });
      }
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        text: err.message || 'Error updating password.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Store & Business Settings</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure WhatsApp ordering phone number, contact details, and account credentials
        </p>
      </div>

      {/* Business Details Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              WhatsApp Business & Store Information
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These details determine where customer WhatsApp orders and enquiry messages are routed
            </p>
          </div>
        </div>

        {businessFeedback && (
          <div
            className={`p-4 rounded-lg text-xs font-medium flex items-center gap-2 ${
              businessFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {businessFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{businessFeedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveBusinessSettings} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                WhatsApp Business Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. 94715498142"
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                />
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Include country code without + or spaces (e.g. 94715498142 for Sri Lanka)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Business Display Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Pearl Grove"
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
                <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sub-Brand / Tag
              </label>
              <input
                type="text"
                value={businessSubname}
                onChange={(e) => setBusinessSubname(e.target.value)}
                placeholder="MICROGREENS"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contact Phone (Display)
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="071 549 8142"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contact Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="pearlgrovemicrogreens@gmail.com"
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Farm / Nursery Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Upcot, Maskeliya, Sri Lanka"
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingBusiness}
              className="inline-flex items-center gap-2 py-2.5 px-6 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {savingBusiness ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Business Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Change */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-slate-700" />
            Admin Security & Password
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Safely update the administrator account password using bcrypt encryption
          </p>
        </div>

        {passwordFeedback && (
          <div
            className={`p-4 rounded-lg text-xs font-medium flex items-center gap-2 ${
              passwordFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {passwordFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{passwordFeedback.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Current Password *
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              New Password * (12–72 bytes)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              aria-label="New password"
              aria-describedby="password-strength"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-600">{passwordStrength.label}</span>
                </div>
                <p className="text-[10px] text-slate-500" id="password-strength">
                  Use 12+ characters with mix of letters, numbers, and symbols
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Confirm New Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 py-2.5 px-6 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Admin Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

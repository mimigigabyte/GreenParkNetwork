'use client';

import { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authApi } from '@/api/auth';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResetPasswordModal({ isOpen, onClose }: ResetPasswordModalProps) {
  const pathname = usePathname();
  const t = useTranslations('auth');
  
  // 检测当前语言
  const locale = pathname.startsWith('/en') ? 'en' : 'zh';
  
  const [step, setStep] = useState(1); // 1: 选择重置方式, 2: 验证身份, 3: 设置新密码
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);

  const resetForm = () => {
    setStep(1);
    setFormData({
      email: '',
      phone: '',
      code: '',
      newPassword: '',
      confirmPassword: ''
    });
    setCountdown(0);
    setLoading(false);
    setCodeLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const sendCode = async () => {
    const target = resetMethod === 'email' ? formData.email : formData.phone;
    if (!target) {
      alert(locale === 'en' 
        ? `Please enter ${resetMethod === 'email' ? 'email address' : 'phone number'}`
        : `请输入${resetMethod === 'email' ? '邮箱' : '手机号'}`);
      return;
    }

    setCodeLoading(true);

    try {
      const result = resetMethod === 'email' 
        ? await authApi.sendEmailCode({ email: formData.email, purpose: 'reset_password' })
        : await authApi.sendPhoneCode({ phone: formData.phone, purpose: 'reset_password' });

      if (result.success && 'data' in result && result.data) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        alert(result.data.message || (locale === 'en' ? 'Verification code sent' : '验证码已发送'));
        setStep(2);
      } else {
        alert('error' in result ? result.error : (locale === 'en' ? 'Send failed' : '发送失败'));
      }
    } catch (error) {
      console.error('发送验证码错误:', error);
      alert(locale === 'en' ? 'Send failed, please try again later' : '发送失败，请稍后重试');
    } finally {
      setCodeLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!formData.code) {
      alert(locale === 'en' ? 'Please enter verification code' : '请输入验证码');
      return;
    }

    try {
      const result = await authApi.verifyCode({
        code: formData.code,
        email: resetMethod === 'email' ? formData.email : undefined,
        phone: resetMethod === 'phone' ? formData.phone : undefined,
        purpose: 'reset_password'
      });

      if (result.success && 'data' in result && result.data?.valid) {
        setStep(3);
      } else {
        alert('data' in result && result.data?.message ? result.data.message : (locale === 'en' ? 'Invalid verification code' : '验证码错误'));
      }
    } catch (error) {
      console.error('验证码验证错误:', error);
      alert(locale === 'en' ? 'Verification failed, please try again later' : '验证失败，请稍后重试');
    }
  };

  const resetPassword = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      alert(locale === 'en' ? 'Please fill in complete password information' : '请填写完整的密码信息');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alert(locale === 'en' ? 'Passwords do not match' : '两次输入的密码不一致');
      return;
    }

    if (formData.newPassword.length < 6) {
      alert(locale === 'en' ? 'Password must be at least 6 characters' : '密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      // 直接调用密码重置API，不再验证验证码（已在步骤2验证过）
      const resetResponse = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetMethod === 'email' ? formData.email : undefined,
          phone: resetMethod === 'phone' ? formData.phone : undefined,
          newPassword: formData.newPassword
        }),
      });

      const result = await resetResponse.json();

      if (resetResponse.ok && result.success) {
        alert(locale === 'en' ? 'Password reset successful! Please log in again' : '密码重置成功！请重新登录');
        handleClose();
      } else {
        alert(result.error || (locale === 'en' ? 'Password reset failed' : '密码重置失败'));
      }
    } catch (error) {
      console.error('密码重置错误:', error);
      alert(locale === 'en' ? 'Reset failed, please try again later' : '重置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 relative">
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* 返回按钮 */}
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <ArrowLeft size={24} />
          </button>
        )}

        <div className="p-8">
          {/* 步骤 1: 选择重置方式 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{locale === 'en' ? 'Password Recovery' : '密码找回'}</h2>
                <p className="text-gray-600">{locale === 'en' ? 'Choose a method to recover your password' : '选择找回密码的方式'}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{locale === 'en' ? 'Reset Method' : '重置方式'}</label>
                  <select 
                    value={resetMethod}
                    onChange={(e) => setResetMethod(e.target.value as 'email' | 'phone')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none"
                  >
                    <option value="email">{locale === 'en' ? 'Email Reset' : '邮箱重置'}</option>
                    <option value="phone">{locale === 'en' ? 'Phone Reset' : '手机重置'}</option>
                  </select>
                </div>

                <div>
                  <input
                    type={resetMethod === 'email' ? 'email' : 'tel'}
                    placeholder={resetMethod === 'email' 
                      ? (locale === 'en' ? 'Please enter email address' : '请输入邮箱地址')
                      : (locale === 'en' ? 'Please enter phone number' : '请输入手机号')
                    }
                    value={resetMethod === 'email' ? formData.email : formData.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      [resetMethod]: e.target.value 
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none"
                    required
                  />
                </div>

                <button 
                  onClick={sendCode}
                  disabled={codeLoading}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    codeLoading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-[#00b899] text-white hover:bg-[#009a7a]'
                  }`}
                >
                  {codeLoading 
                    ? (locale === 'en' ? 'Sending...' : '发送中...') 
                    : (locale === 'en' ? 'Send Code' : '发送验证码')
                  }
                </button>
              </div>
            </div>
          )}

          {/* 步骤 2: 验证身份 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{locale === 'en' ? 'Verify Identity' : '验证身份'}</h2>
                <p className="text-gray-600">
                  {locale === 'en' 
                    ? `Verification code sent to your ${resetMethod === 'email' ? 'email' : 'phone'}`
                    : `验证码已发送至您的${resetMethod === 'email' ? '邮箱' : '手机'}`
                  }
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder={locale === 'en' ? 'Enter verification code' : '请输入验证码'}
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none"
                    required
                  />
                  <button
                    onClick={sendCode}
                    disabled={countdown > 0 || codeLoading}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                      countdown > 0 || codeLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-500 text-white hover:bg-gray-600'
                    }`}
                  >
                    {countdown > 0 
                      ? `${countdown}s` 
                      : codeLoading 
                        ? (locale === 'en' ? 'Sending' : '发送中') 
                        : (locale === 'en' ? 'Resend' : '重新发送')
                    }
                  </button>
                </div>

                <button 
                  onClick={verifyCode}
                  className="w-full py-3 px-6 bg-[#00b899] text-white rounded-lg font-medium hover:bg-[#009a7a] transition-colors"
                >
                  {locale === 'en' ? 'Verify' : '验证'}
                </button>
              </div>
            </div>
          )}

          {/* 步骤 3: 设置新密码 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{locale === 'en' ? 'Set New Password' : '设置新密码'}</h2>
                <p className="text-gray-600">{locale === 'en' ? 'Please set your new password' : '请设置您的新密码'}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="password"
                    placeholder={locale === 'en' ? 'New password (at least 6 characters)' : '新密码（至少6位）'}
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder={locale === 'en' ? 'Confirm new password' : '确认新密码'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none"
                    required
                  />
                </div>

                <button 
                  onClick={resetPassword}
                  disabled={loading}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    loading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-[#00b899] text-white hover:bg-[#009a7a]'
                  }`}
                >
                  {loading 
                    ? (locale === 'en' ? 'Resetting...' : '重置中...') 
                    : (locale === 'en' ? 'Reset Password' : '重置密码')
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
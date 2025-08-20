'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { emailVerificationApi } from '@/api/emailVerification';
import { useAuthContext } from './auth-provider';
import { supabase } from '@/lib/supabase';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const router = useRouter();
  const { checkUser } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPhoneRegister, setIsPhoneRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    verificationCode: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGetCode = async () => {
    const target = isPhoneRegister ? formData.phone : formData.email;
    if (!target) {
      alert(`请输入${isPhoneRegister ? '手机号' : '邮箱地址'}`);
      return;
    }

    setCodeLoading(true);

    try {
      let result;
      
      if (isPhoneRegister) {
        // 使用原有的手机验证码API
        result = await authApi.sendPhoneCode({
          phone: formData.phone,
          purpose: 'register'
        });
      } else {
        // 使用新的邮件验证码API
        result = await emailVerificationApi.sendCode({
          email: formData.email
        });
      }

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
        
        // 开发模式下显示验证码
        if ('devOTP' in result.data && result.data.devOTP) {
          alert(`验证码已发送！开发模式验证码：${result.data.devOTP}`);
        } else {
          alert(result.data.message || '验证码已发送');
        }
      } else {
        alert('error' in result ? result.error : '发送验证码失败');
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      alert('发送验证码失败，请稍后重试');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.verificationCode || !formData.password || !formData.confirmPassword) {
      alert('请填写完整信息');
      return;
    }

    if (!isPhoneRegister && !formData.email) {
      alert('请输入邮箱地址');
      return;
    }

    if (isPhoneRegister && !formData.phone) {
      alert('请输入手机号');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    
    if (formData.password.length < 6) {
      alert('密码长度至少6位');
      return;
    }

    try {
      setLoading(true);
      
      let result;
      
      if (isPhoneRegister) {
        // 使用原有的手机注册API
        result = await authApi.phoneRegister({
          phone: formData.phone,
          phoneCode: formData.verificationCode,
          password: formData.password
        });
      } else {
        // 使用新的邮件验证码注册API
        result = await emailVerificationApi.register({
          email: formData.email,
          code: formData.verificationCode,
          password: formData.password
        });
      }

      if (result.success && 'data' in result && result.data) {
        try {
          // 用户创建成功，现在使用客户端登录以建立正确的会话
          // 确保参数有效
          if (!formData.email || !formData.password) {
            alert('注册成功，但登录信息不完整，请手动登录');
            return;
          }
          
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: formData.email.trim(),
            password: formData.password
          });
          
          if (loginError) {
            console.error('自动登录失败:', loginError);
            alert('注册成功，但自动登录失败，请手动登录');
            return;
          }

          // 保存token（虽然Supabase会自动处理，但保持兼容性）
          if (loginData.session) {
            localStorage.setItem('access_token', loginData.session.access_token);
            localStorage.setItem('refresh_token', loginData.session.refresh_token);
          }

          // 更新认证状态
          await checkUser();

          console.log('注册并登录成功，跳转到企业信息完善页面');
          alert('注册成功！');
          
          // 跳转到企业信息完善页面
          router.push('/company-profile');
        } catch (loginError) {
          console.error('登录过程出错:', loginError);
          alert('注册成功，但登录失败，请手动登录');
        }
      } else {
        const errorMessage = 'error' in result ? result.error : '注册失败，请稍后重试';
        alert(errorMessage);
      }
      
    } catch (error) {
      console.error('注册失败:', error);
      alert('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full pb-8">
      {/* 标题 */}
      <div className="mb-8 mt-0">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">新用户注册</h2>
                 <div className="flex items-center justify-between text-sm text-gray-600">
           <div className="flex items-center">
             <span>已有账号？</span>
             <button 
               onClick={onSwitchToLogin}
               className="ml-1 text-[#00b899] hover:text-[#009a7a] transition-colors"
             >
               立即登录
             </button>
           </div>
                       <button 
              type="button"
              onClick={() => setIsPhoneRegister(!isPhoneRegister)}
              className="text-[#00b899] hover:text-[#009a7a] transition-colors"
            >
              {isPhoneRegister ? '切换至邮箱注册' : '切换至手机号注册'}
            </button>
         </div>
      </div>

      {/* 注册表单 */}
      <form onSubmit={handleSubmit} className="space-y-6">
                 {/* 邮箱地址/手机号码输入 */}
         <div className="space-y-2">
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isPhoneRegister ? "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" : "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"} />
               </svg>
             </div>
             <input
               type={isPhoneRegister ? "tel" : "email"}
               placeholder={isPhoneRegister ? "手机号码" : "邮箱地址"}
               value={isPhoneRegister ? formData.phone : formData.email}
               onChange={(e) => handleInputChange(isPhoneRegister ? 'phone' : 'email', e.target.value)}
               className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none transition-all"
               required
             />
           </div>
         </div>

                 {/* 验证码输入 */}
         <div className="space-y-2">
           <div className="flex border border-gray-300 rounded-lg overflow-hidden">
             {/* 验证码输入 */}
             <input
               type="text"
               placeholder={isPhoneRegister ? "手机验证码" : "邮箱验证码"}
               value={formData.verificationCode}
               onChange={(e) => handleInputChange('verificationCode', e.target.value)}
               className="flex-1 px-4 py-3 border-none outline-none text-gray-700 placeholder-gray-400"
               required
             />
                          {/* 获取验证码按钮 */}
              <button
                type="button"
                onClick={handleGetCode}
                disabled={codeLoading || countdown > 0}
                className={`px-4 py-3 text-sm font-medium transition-colors border-l border-gray-300 ${
                  codeLoading || countdown > 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
                }`}
              >
                {countdown > 0 ? `${countdown}s` : codeLoading ? '发送中...' : '获取验证码'}
              </button>
           </div>
         </div>

        {/* 密码输入 */}
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="密码"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none transition-all"
              required
            />
                         <button
               type="button"
               onClick={() => setShowPassword(!showPassword)}
               className="absolute inset-y-0 right-0 pr-3 flex items-center"
             >
               {showPassword ? (
                 <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
               ) : (
                 <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
               )}
             </button>
          </div>
        </div>

        {/* 确认密码输入 */}
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="确认密码"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none transition-all"
              required
            />
                         <button
               type="button"
               onClick={() => setShowConfirmPassword(!showConfirmPassword)}
               className="absolute inset-y-0 right-0 pr-3 flex items-center"
             >
               {showConfirmPassword ? (
                 <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
               ) : (
                 <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
               )}
             </button>
          </div>
        </div>

                 {/* 服务条款和隐私声明提示 */}
         <div className="text-center text-sm text-gray-600">
           <span>点击注册表明你已阅读并同意</span>
           <button 
             type="button"
             onClick={() => window.open('/terms-of-service', '_blank')}
             className="text-[#00b899] hover:text-[#009a7a] transition-colors underline mx-1"
           >
             《服务条款》
           </button>
           <span>和</span>
           <button 
             type="button"
             onClick={() => window.open('/privacy-policy', '_blank')}
             className="text-[#00b899] hover:text-[#009a7a] transition-colors underline mx-1"
           >
             《隐私声明》
           </button>
         </div>

         {/* 注册按钮 */}
         <div className="mt-6">
           <button
             type="submit"
             disabled={loading}
             className={`w-full py-3 px-6 rounded-lg font-medium text-base transition-colors ${
               loading 
                 ? 'bg-gray-400 cursor-not-allowed' 
                 : 'bg-[#00b899] hover:bg-[#009a7a]'
             } text-white`}
           >
             {loading ? '注册中...' : '注册'}
           </button>
         </div>


      </form>
    </div>
  );
} 
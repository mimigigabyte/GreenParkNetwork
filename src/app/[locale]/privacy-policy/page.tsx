"use client";

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: { locale: string };
}

export default function PrivacyPolicyLocalePage({ params }: PageProps) {
  const router = useRouter();
  const isEn = params.locale === 'en';

  const handleBack = () => {
    try {
      // Prefer history index check (Next.js manages idx)
      // @ts-ignore - idx is not typed on history.state
      const idx = typeof window !== 'undefined' && window.history?.state?.idx;
      const hasIdx = typeof idx === 'number' && idx > 0;
      const sameOriginReferrer = typeof document !== 'undefined'
        && document.referrer
        && (() => {
          try { return new URL(document.referrer).origin === window.location.origin; } catch { return false; }
        })();

      if (hasIdx || sameOriginReferrer) {
        router.back();
      } else {
        router.push(`/${params.locale}`);
      }
    } catch {
      router.push(`/${params.locale}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <a
              href={`/${params.locale}`}
              onClick={(e) => { e.preventDefault(); handleBack(); }}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mr-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              {isEn ? 'Back' : '返回'}
            </a>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEn ? 'Privacy Policy' : '隐私条款'}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-gray max-w-none">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {isEn
                ? 'National Economic Development Zone Green Low-Carbon Technology Promotion Platform — Privacy Policy'
                : '国家级经开区绿色低碳技术推广平台隐私条款'}
            </h2>

            <div className="space-y-6 text-gray-700">
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{isEn ? '1. Information We Collect' : '1. 信息收集'}</h3>
                {isEn ? (
                  <>
                    <p className="text-sm leading-relaxed">We collect information you provide when using our services, including but not limited to:</p>
                    <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
                      <li>Registration: name, phone number, email address</li>
                      <li>Usage data: login history, browsing history, search records</li>
                      <li>Technical data: device info, IP address, browser type</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">我们收集您在使用平台服务时主动提供的信息，包括但不限于：</p>
                    <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
                      <li>注册信息：姓名、手机号码、邮箱地址等</li>
                      <li>使用信息：登录记录、浏览历史、搜索记录等</li>
                      <li>技术信息：设备信息、IP地址、浏览器类型等</li>
                    </ul>
                  </>
                )}
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{isEn ? '2. How We Use Information' : '2. 信息使用'}</h3>
                {isEn ? (
                  <>
                    <p className="text-sm leading-relaxed">We use the collected information to:</p>
                    <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
                      <li>Provide and improve services</li>
                      <li>Personalize user experience</li>
                      <li>Offer technical support and customer service</li>
                      <li>Ensure security and risk control</li>
                      <li>Comply with laws and regulations</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">我们使用收集的信息用于以下目的：</p>
                    <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
                      <li>提供和改进平台服务</li>
                      <li>个性化用户体验</li>
                      <li>技术支持和客户服务</li>
                      <li>安全防护和风险控制</li>
                      <li>法律合规要求</li>
                    </ul>
                  </>
                )}
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{isEn ? '3. Information Sharing' : '3. 信息共享'}</h3>
                {isEn ? (
                  <>
                    <p className="text-sm leading-relaxed">We will not sell, rent, or trade your personal information to third parties unless:</p>
                    <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
                      <li>We obtain your explicit consent</li>
                      <li>Required by laws or regulations</li>
                      <li>Necessary to protect platform and users</li>
                      <li>Shared with authorized partners when necessary</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">我们承诺不会向第三方出售、出租或交易您的个人信息，除非：</p>
                    <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
                      <li>获得您的明确同意</li>
                      <li>法律法规要求</li>
                      <li>保护平台和用户的安全</li>
                      <li>与授权合作伙伴共享必要信息</li>
                    </ul>
                  </>
                )}
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{isEn ? '4. Data Security' : '4. 信息安全'}</h3>
                {isEn ? (
                  <>
                    <p className="text-sm leading-relaxed">We adopt industry-standard security measures to protect your data:</p>
                    <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
                      <li>Encrypted transmission and storage</li>
                      <li>Access control and authentication</li>
                      <li>Regular security audits and updates</li>
                      <li>Employee confidentiality training</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">我们采用行业标准的安全措施保护您的信息：</p>
                    <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
                      <li>数据加密传输和存储</li>
                      <li>访问控制和身份验证</li>
                      <li>定期安全审计和更新</li>
                      <li>员工保密培训</li>
                    </ul>
                  </>
                )}
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{isEn ? '5. Your Rights' : '5. 您的权利'}</h3>
                {isEn ? (
                  <>
                    <p className="text-sm leading-relaxed">You have the following rights regarding your personal information:</p>
                    <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
                      <li>Access and review your personal data</li>
                      <li>Correct or update inaccurate information</li>
                      <li>Delete your account and data</li>
                      <li>Withdraw consent and restrict processing</li>
                      <li>Data portability</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">您对个人信息享有以下权利：</p>
                    <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
                      <li>访问和查看您的个人信息</li>
                      <li>更正或更新不准确的信息</li>
                      <li>删除您的账户和相关信息</li>
                      <li>撤回同意和限制处理</li>
                      <li>数据可携带权</li>
                    </ul>
                  </>
                )}
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{isEn ? '6. Cookies' : '6. Cookie使用'}</h3>
                {isEn ? (
                  <>
                    <p className="text-sm leading-relaxed">We use cookies and similar technologies to enhance your experience:</p>
                    <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
                      <li>Remember login status</li>
                      <li>Personalized content</li>
                      <li>Usage analytics</li>
                      <li>Performance optimization</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">我们使用Cookie和类似技术来改善用户体验，包括：</p>
                    <ul className="list-disc list-inside text-sm leading-relaxed mt-2 space-y-1">
                      <li>记住您的登录状态</li>
                      <li>个性化内容推荐</li>
                      <li>分析网站使用情况</li>
                      <li>优化网站性能</li>
                    </ul>
                  </>
                )}
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{isEn ? '7. Children’s Privacy' : '7. 未成年人保护'}</h3>
                <p className="text-sm leading-relaxed">
                  {isEn
                    ? 'We pay special attention to the privacy of minors. If you are a minor, please use our services under the guidance of a guardian.'
                    : '我们特别关注未成年人的隐私保护。如果您是未成年人，请在监护人的指导下使用我们的服务。'}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{isEn ? '8. Policy Updates' : '8. 政策更新'}</h3>
                <p className="text-sm leading-relaxed">
                  {isEn
                    ? 'We may update this policy from time to time. We will notify you of material changes via platform announcements or email. Continued use constitutes acceptance.'
                    : '我们可能会不时更新本隐私条款。重大变更将通过平台公告或邮件通知您。继续使用服务即表示您同意更新后的条款。'}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{isEn ? '9. Contact Us' : '9. 联系我们'}</h3>
                {isEn ? (
                  <div className="mt-2 text-sm">
                    <p>Email: privacy@green-tech-platform.com</p>
                    <p>Hotline: 400-123-4567</p>
                    <p>Address: National Economic Development Zone Green Low-Carbon Technology Promotion Platform</p>
                  </div>
                ) : (
                  <div className="mt-2 text-sm">
                    <p>邮箱：privacy@green-tech-platform.com</p>
                    <p>电话：400-123-4567</p>
                    <p>地址：国家级经开区绿色低碳技术推广平台</p>
                  </div>
                )}
              </section>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {isEn ? 'Last updated: Dec 2024' : '最后更新时间：2024年12月'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  const locale = pathname.startsWith('/en') ? 'en' : 'zh';
  const t = useTranslations('footer');
  return (
    <footer className="bg-green-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Logo和标题 */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/images/logo/绿盟logo.png"
                alt="绿盟logo"
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div>
                <h3 className="text-lg font-bold">
                  {locale === 'en' 
                    ? 'National Economic Development Zone Green Low-Carbon Technology Promotion Platform'
                    : '国家级经开区绿色技术产品推广平台'}
                </h3>
                <p className="text-sm text-green-200">
                  {locale === 'en' 
                    ? 'Green Low-Carbon Technology Promotion Platform'
                    : 'National Economic Development Zone Green Low-Carbon Technology Promotion Platform'}
                </p>
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 联系地址 */}
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
{t('contactAddress')}
                </h4>
                <div className="space-y-2 text-sm text-green-200">
                  <p>{locale === 'en' ? '1 Jianguomenwai Avenue, Chaoyang District' : '北京市朝阳区建国门外大街1号'}</p>
                  <p>{locale === 'en' ? 'Beijing, China Tower A, 15th Floor' : '国贸大厦A座15层'}</p>
                </div>
              </div>

              {/* 电子邮箱 */}
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
{t('email')}
                </h4>
                <div className="space-y-2 text-sm text-green-200">
                  <p>info@green-tech-platform.com</p>
                  <p>service@green-tech-platform.com</p>
                  <p>support@green-tech-platform.com</p>
                </div>
              </div>

              {/* 平台热线 */}
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {t('hotline')}
                </h4>
                <div className="space-y-2 text-sm text-green-200">
                  <p>400-888-8888</p>
                  <p>010-88888888</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部链接和版权 */}
        <div className="mt-12 pt-8 border-t border-green-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
            {/* 友情链接 */}
            <div>
              <h5 className="font-semibold mb-3">{t('friendlyLinks')}:</h5>
              <div className="space-y-2 text-green-200">
                <a href="#" className="block hover:text-white transition-colors">
                  {locale === 'en' ? 'National Development and Reform Commission' : '国家发改委'}
                </a>
                <a href="#" className="block hover:text-white transition-colors">
                  {locale === 'en' ? 'Ministry of Ecology and Environment' : '生态环境部'}
                </a>
                <a href="#" className="block hover:text-white transition-colors">
                  {locale === 'en' ? 'Ministry of Science and Technology' : '科技部'}
                </a>
                <a href="#" className="block hover:text-white transition-colors">
                  {locale === 'en' ? 'Ministry of Industry and Information Technology' : '工信部'}
                </a>
              </div>
            </div>

            {/* 指导单位 */}
            <div>
              <h5 className="font-semibold mb-3">{t('guidanceUnits')}:</h5>
              <div className="space-y-2 text-green-200">
                <a href="#" className="block hover:text-white transition-colors">
                  {locale === 'en' ? 'National Development and Reform Commission' : '国家发改委'}
                </a>
                <a href="#" className="block hover:text-white transition-colors">
                  {locale === 'en' ? 'Ministry of Ecology and Environment' : '生态环境部'}
                </a>
              </div>
            </div>

                         {/* 主办单位 */}
             <div>
               <h5 className="font-semibold mb-3">{t('hostingUnits')}:</h5>
               <div className="space-y-2 text-green-200">
                 <a href="#" className="block hover:text-white transition-colors">
                   {locale === 'en' ? 'National Economic Development Zone Green Development Alliance' : '国家级经开区绿色发展联盟'}
                 </a>
               </div>
             </div>

                         {/* 版权信息 */}
             <div className="md:col-span-1">
               <div className="text-green-200 text-xs">
                 <p>© Copyright {locale === 'en' ? 'National Economic Development Zone Green Development Alliance' : '国家级经开区绿色发展联盟'}</p>
                 <p className="mt-1">{locale === 'en' ? 'ICP Registration No.: 京ICP备18024888号-13' : '京ICP备18024888号-13'}</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 
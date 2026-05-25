import { ArrowRight } from 'lucide-react';

const footerLinks = [
  {
    title: '产品',
    links: ['功能概览', '定价方案', '更新日志', 'API 文档'],
  },
  {
    title: '资源',
    links: ['帮助中心', '使用教程', '社区论坛', '博客'],
  },
  {
    title: '公司',
    links: ['关于我们', '加入团队', '联系我们', '品牌资源'],
  },
  {
    title: '法律',
    links: ['服务条款', '隐私政策', 'Cookie 政策', '安全合规'],
  },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#050505] border-t border-white/5">
      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-16 border-b border-white/5">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
              准备好提升你的效率了吗？
            </h2>
            <p className="text-[#8E8E93]">
              加入超过 10,000 个高效团队，开始使用 MOMENTA
            </p>
          </div>
          <button className="glow-button px-8 py-4 text-sm flex items-center gap-2 group shrink-0">
            免费开始使用
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16">
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-white mb-4">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-[#8E8E93] hover:text-white transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-16 mt-16 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-white">
              MOMENTA
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
          </div>

          <p className="text-xs text-[#8E8E93]">
            &copy; {new Date().getFullYear()} MOMENTA Inc. 保留所有权利。
          </p>

          <div className="flex items-center gap-4">
            {['X', 'GitHub', 'Discord'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-[#8E8E93] hover:text-white transition-colors"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

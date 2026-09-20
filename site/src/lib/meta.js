// 部署在自定义域名时由 CI 传入 VITE_SITE_ORIGIN=https://…；
// 未设置（如 GitHub Pages 子路径部署）则跳过 canonical / hreflang / og:url。
const SITE_ORIGIN = import.meta.env.VITE_SITE_ORIGIN ?? ''

function upsert(selector, create) {
  let node = document.head.querySelector(selector)
  if (!node) {
    node = create()
    document.head.append(node)
  }
  return node
}

function setMetaContent(attribute, key, value) {
  const selector = `meta[${attribute}="${key}"]`
  if (!value) {
    document.head.querySelector(selector)?.remove()
    return
  }
  const node = upsert(selector, () => {
    const meta = document.createElement('meta')
    meta.setAttribute(attribute, key)
    return meta
  })
  node.setAttribute('content', value)
}

function setLink(rel, href, hreflang) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`
  if (!href) {
    document.head.querySelector(selector)?.remove()
    return
  }
  const node = upsert(selector, () => {
    const link = document.createElement('link')
    link.setAttribute('rel', rel)
    if (hreflang) link.setAttribute('hreflang', hreflang)
    return link
  })
  node.setAttribute('href', href)
}

/**
 * SPA 换页时同步 title / description / canonical / hreflang。
 * 静态构建会把同样的值写进每条路由的 HTML 骨架，所以爬虫拿到的也是对的。
 */
export function setPageMeta({ alternate, canonical, description, lang, title }) {
  document.title = title
  document.documentElement.lang = lang

  const absolute = SITE_ORIGIN ? (sitePath) => `${SITE_ORIGIN}${sitePath}` : () => null

  setMetaContent('name', 'description', description)
  setMetaContent('property', 'og:title', title)
  setMetaContent('property', 'og:description', description)
  setMetaContent('property', 'og:url', canonical ? absolute(canonical) : null)

  setLink('canonical', canonical ? absolute(canonical) : null)

  if (canonical) {
    const isEnglish = canonical === '/en' || canonical.startsWith('/en/')
    setLink('alternate', absolute(canonical), isEnglish ? 'en' : 'zh-Hans')
    setLink('alternate', alternate ? absolute(alternate) : null, isEnglish ? 'zh-Hans' : 'en')
  }
}

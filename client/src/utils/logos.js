export const storeLogos = {
  okta: 'https://ik.imagekit.io/rxvi2ripqh/OPW.png?updatedAt=1782216119711',
  ratu: 'https://ik.imagekit.io/rxvi2ripqh/WhatsApp%20Image%202026-06-24%20at%2001.24.59%20(1).jpeg?updatedAt=1782240717214',
  king: 'https://ik.imagekit.io/rxvi2ripqh/WhatsApp%20Image%202026-06-24%20at%2001.24.59.jpeg?updatedAt=1782240717449'
};

export const marketplaceLogos = {
  shopee: 'https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/icon_favicon_1_32.9cd61b2e90c0f104.png',
  lazada: 'https://www.lazada.co.id/favicon.ico',
  tiktok: 'https://www.tiktok.com/favicon.ico',
  tokopedia: 'https://p16-images-comn-sg.tokopedia-static.net/tos-alisg-i-zr7vqa5nfb-sg/assets-tokopedia-lite/prod/icon144.png~tplv-zr7vqa5nfb-image.image'
};

export const getStoreLogo = (storeName) => {
  if (!storeName) return storeLogos.okta;
  const lowerName = storeName.toLowerCase();
  if (lowerName.includes('ratu')) return storeLogos.ratu;
  if (lowerName.includes('king')) return storeLogos.king;
  return storeLogos.okta;
};

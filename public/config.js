// Public configuration only. Never place tokens or passwords here.
window.config = {
  price: 14.90,
  currency: "BRL",
  projectsCount: 131,
  pagesCount: 191,
  checkoutUrl: "https://pay.cakto.com.br/vxese7h_1225823",
  supportEmail: "suportecriativo130@gmail.com",
  sellerName: "João Lucas Queiroz",
  ageRange: null, // Set only after validating the recommendation with the material.
  metaPixelId: "1309619167932261",
  assemblyGuarantee: false,
  supportResponseHours: 24,
  refundDays: 7,
  assemblyVideo: null, // { src, poster, captions }: real assembly footage + Portuguese .vtt.
  jotafy: {
    origin: "https://jotafy.joaolucasqueirozag.workers.dev",
    publicKey: "78594b3ef8fa8f290ccfb58db15346313f8a81f780f68094104a27c878c0e8ab"
  },
  categories: [
    { name: "Construções e objetos", count: 33, image: "casa", page: 6 },
    { name: "Animais e criaturas", count: 38, image: "animais", page: 40 },
    { name: "Dragões 3D", count: 10, image: "dragao", page: 79 },
    { name: "Dinossauros 3D", count: 10, image: "dinossauro", page: 91 },
    { name: "Relevos em camadas", count: 10, image: "camadas", page: 102 },
    { name: "Moldes vetoriais HD", count: 10, image: "vetorial", page: 114 },
    { name: "Esculturas de encaixe", count: 10, image: "encaixe", page: 125 },
    { name: "Projetos avançados", count: 10, image: "avancado", page: 135 }
  ]
};
// Compatibility for the already published thank-you page and existing tracking.
window.MUNDINHO_CONFIG = { ...window.config, seller: { name: window.config.sellerName } };

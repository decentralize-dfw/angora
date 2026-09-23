// Three r180 SMAAPass explicitly operates in linear-sRGB. OutputPass must be
// last: it performs tone mapping and the display color-space conversion once.
export function configurePostprocessing(composer,{beauty,ao,ssr=null,smaa,bloom,output,dither=null}) {
  // FAZ 7 İŞ 1: SSR (varsa) AO'dan hemen sonra, AA'dan önce - yansıma
  // beauty'nin parçası, kenar yumuşatmanın değil.
  for(const pass of [beauty,ao,ssr,smaa,bloom,output,dither])if(pass)composer.addPass(pass);
}

// Three r180 SMAAPass explicitly operates in linear-sRGB. OutputPass must be
// last: it performs tone mapping and the display color-space conversion once.
export function configurePostprocessing(composer,{beauty,ao,smaa,bloom,output,dither}) {
  for(const pass of [beauty,ao,smaa,bloom,output,dither])composer.addPass(pass);
}

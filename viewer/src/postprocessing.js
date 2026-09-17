export function configurePostprocessing(composer,{beauty,ao,smaa,bloom,output,dither}) {
  for(const pass of [beauty,ao,smaa,bloom,output,dither])composer.addPass(pass);
}

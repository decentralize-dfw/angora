(() => {
  'use strict';
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,motion=!!(window.gsap&&window.ScrollTrigger);
  const media=$('.cinema-media'),opening=$('.cinema-opening');
  const descriptions=[
    'The garden-facing living floor opens to a covered terrace and the private pool.',
    'Four levels, five bedrooms and four living spaces. A detached home with room for different generations.',
    'Balconies, terrace and a private pool connect the home to its own 900 m² garden.'
  ];
  opening.muted=true;if(!reduced)opening.play().catch(()=>{});
  if(motion&&!reduced)gsap.to('.cinema-veil',{opacity:0,duration:1.1,delay:.15,ease:'power2.inOut',onComplete:()=>$('.cinema-veil').hidden=true});
  else $('.cinema-veil').hidden=true;
  fetch('./assets/residence/films/manifest.json').then(r=>r.json()).then(manifest=>{
    const films=manifest.clips.map(clip=>window.AngoraVideo.create(`./assets/residence/films/${clip.id}/transition.mp4`,media,'cinema-film'));
    const backwards=manifest.clips.map(clip=>window.AngoraVideo.create(`./assets/residence/films/${clip.id}/reverse.mp4`,media,'cinema-film'));
    const scene=window.AngoraSteps.register($('.cinematic-story'),3,async(from,to)=>{
      if(from===to)return;
      const forward=to>from,index=forward?to-1:from-1,film=(forward?films:backwards)[index],clip=manifest.clips[index];
      opening.pause();opening.style.opacity='0';
      gsap.to('.hero-title,.hero-sides,.hero-bottom',{autoAlpha:0,duration:.22});
      gsap.to('.cinema-caption',{autoAlpha:0,y:12,duration:.18});gsap.to('.cinema-track',{autoAlpha:1,duration:.2});
      $('.hero').dataset.cameraHold='false';$('.hero').dataset.filmChapter=index;
      gsap.fromTo(media,{left:'4%',right:'4%',top:'5%',bottom:'5%'},{left:'0%',right:'0%',top:'0%',bottom:'0%',duration:1.2,ease:'power2.inOut'});
      await window.AngoraVideo.play(film,films.concat(backwards),1.65,reduced,progress=>{
        $$('[data-film-chapter]').forEach((b,i)=>{b.setAttribute('aria-current',String(i===index));b.querySelector('i').style.transform=`scaleX(${i<index?1:i===index?progress:0})`;});
      });
      const destination=Math.max(0,to-1);$('#cinema-title').textContent=manifest.clips[destination].title;$('#cinema-count').textContent=`0${destination+1} / 03`;$('#cinema-caption').textContent=descriptions[destination];
      $('.hero').dataset.cameraHold='true';$('.hero').dataset.filmProgress=String(to/3);
      gsap.to('.cinema-caption',{autoAlpha:1,y:0,duration:.38,ease:'power2.out'});
      $('#cinema-status').textContent=to===3?'Scroll to discover the residence':'Scroll once for the next scene';
    });
    $$('[data-film-chapter]').forEach(button=>button.addEventListener('click',()=>scene.go(Number(button.dataset.filmChapter)+1)));
    $('#cinema-status').textContent='Scroll once to begin';
  }).catch(error=>{console.error(error);$('.cinema-veil').hidden=true;});
  if(!motion||reduced)return;
  // Word windows belong to editorial statements, rather than every interface label.
  $$('.residence .display,.editorial h3,.life-lede h3').forEach(heading=>{
    const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{const f=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(word=>{if(!word.trim()){f.append(document.createTextNode(word));return;}const outer=document.createElement('span'),inner=document.createElement('span');outer.className='word-window';inner.textContent=word;outer.append(inner);f.append(outer);});node.replaceWith(f);});
    gsap.fromTo(heading.querySelectorAll('.word-window>span'),{yPercent:110},{yPercent:0,duration:1.15,stagger:.04,ease:'power3.out',scrollTrigger:{trigger:heading,start:'top 89%',once:true}});
  });
  $$('.editorial-image').forEach(frame=>{
    gsap.fromTo(frame,{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:1.4,ease:'power3.inOut',scrollTrigger:{trigger:frame,start:'top 85%',once:true}});
    gsap.fromTo(frame.querySelector('img'),{scale:1.055},{scale:1,ease:'none',scrollTrigger:{trigger:frame,start:'top bottom',end:'bottom top',scrub:1}});
  });
  gsap.fromTo('footer',{yPercent:-12},{yPercent:0,ease:'none',scrollTrigger:{trigger:'footer',start:'top bottom',end:'bottom bottom',scrub:1}});
  document.fonts?.ready.then(()=>ScrollTrigger.refresh());
})();

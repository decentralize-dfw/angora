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
  opening.muted=true;opening.playbackRate=3;opening.onended=()=>window.AngoraVideo.freeze(opening,[opening]);if(!reduced)opening.play().catch(()=>{});
  if(motion&&!reduced)gsap.to('.cinema-veil',{opacity:0,duration:1.1,delay:.15,ease:'power2.inOut',onComplete:()=>$('.cinema-veil').hidden=true});
  else $('.cinema-veil').hidden=true;
  fetch('./assets/residence/films/manifest.json').then(r=>r.json()).then(manifest=>{
    const films=manifest.clips.map(clip=>window.AngoraVideo.create(`./assets/residence/films/${clip.id}/transition.mp4`,media,'cinema-film'));
    const backwards=manifest.clips.map(clip=>window.AngoraVideo.create(`./assets/residence/films/${clip.id}/reverse.mp4`,media,'cinema-film'));
    const scene=window.AngoraSteps.register($('.cinematic-story'),3,async(from,to)=>{
      if(from===to)return;
      const step=Math.sign(to-from);
      for(let current=from;current!==to;current+=step){
        const next=current+step,index=step>0?next-1:current-1,film=(step>0?films:backwards)[index];
        gsap.to('.hero-title,.hero-sides,.hero-bottom',{autoAlpha:0,duration:.12});
        gsap.to('.cinema-caption',{autoAlpha:0,y:8,duration:.1});gsap.to('.cinema-track',{autoAlpha:1,duration:.12});
        $('.hero').dataset.cameraHold='false';$('.hero').dataset.filmChapter=index;
        gsap.to(media,{scale:1,duration:.25,ease:'power2.inOut'});
        await window.AngoraVideo.play(film,films.concat(backwards),.55,reduced,progress=>{
          $$('[data-film-chapter]').forEach((b,i)=>{b.setAttribute('aria-current',String(i===index));b.querySelector('i').style.transform=`scaleX(${i<index?1:i===index?progress:0})`;});
        },()=>{opening.pause();opening.style.opacity='0';});
        const destination=Math.max(0,next-1);$('#cinema-title').textContent=manifest.clips[destination].title;$('#cinema-count').textContent=`0${destination+1} / 03`;$('#cinema-caption').textContent=descriptions[destination];
        $('.hero').dataset.cameraHold=String(next>0);$('.hero').dataset.filmProgress=String(next/3);
        gsap.to('.cinema-caption',{autoAlpha:next>0?1:0,y:0,duration:.2,ease:'power2.out'});
        if(next===0){gsap.to('.hero-title,.hero-sides,.hero-bottom',{autoAlpha:1,duration:.3});gsap.to('.cinema-track',{autoAlpha:0,duration:.15});}
        $('#cinema-status').textContent=next===3?'Scroll to discover the residence':next===0?'Scroll once to begin':'Scroll once for the next scene';
      }
    },async direction=>{
      if(direction<0||reduced)return;
      await new Promise(resolve=>gsap.timeline({onComplete:resolve})
        .to('.cinema-caption,.cinema-track,.cinema-status',{autoAlpha:0,y:-18,duration:.28},0)
        .to('.hero',{backgroundColor:'#efede6',duration:.65},0)
        .to(media,{scale:.88,duration:.65,ease:'power3.inOut'},0));
    });
    $$('[data-film-chapter]').forEach(button=>button.addEventListener('click',()=>scene.go(Number(button.dataset.filmChapter)+1)));
    $('#cinema-status').textContent='Scroll once to begin';
  }).catch(error=>{console.error(error);$('.cinema-veil').hidden=true;});
  if(!motion||reduced)return;
  // Restore the framed hold when the visitor comes back from the next page.
  ScrollTrigger.create({trigger:'#home',start:'top top',end:'bottom top',onEnterBack:()=>{
    gsap.to(media,{scale:1,duration:.6,ease:'power2.inOut'});
    gsap.to('.hero',{backgroundColor:'#223e35',duration:.6});
    if($('.hero').dataset.cameraHold==='true')gsap.to('.cinema-caption,.cinema-track,.cinema-status',{autoAlpha:1,y:0,duration:.4});
  }});
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

  document.fonts?.ready.then(()=>ScrollTrigger.refresh());
})();

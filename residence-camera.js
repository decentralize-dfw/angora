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
  opening.muted=true;opening.pause();opening.playbackRate=3;opening.onended=()=>window.AngoraVideo.freeze(opening,[opening]);
  let intro;
  if(motion&&!reduced){intro=gsap.timeline().to('.cinema-veil',{opacity:0,duration:.85,ease:'power2.inOut',onStart:()=>opening.play().catch(()=>{}),onComplete:()=>$('.cinema-veil').hidden=true},.05).fromTo('.hero-title',{autoAlpha:0,y:14},{autoAlpha:1,y:0,duration:.7,ease:'power3.out'},.55);}
  else{$('.cinema-veil').hidden=true;window.AngoraVideo.still(opening,[opening]).catch(()=>{});}
  fetch('./assets/residence/films/manifest.json').then(r=>r.json()).then(manifest=>{
    const films=manifest.clips.map(clip=>window.AngoraVideo.create(`./assets/residence/films/${clip.id}/transition.mp4`,media,'cinema-film'));
    const backwards=manifest.clips.map(clip=>window.AngoraVideo.create(`./assets/residence/films/${clip.id}/reverse.mp4`,media,'cinema-film'));
    window.AngoraVideo.prime(films[0]);
    const scene=window.AngoraSteps.register($('.cinematic-story'),3,async(from,to)=>{
      if(from===to)return;
      intro?.kill();$('.cinema-veil').hidden=true;
      const step=Math.sign(to-from);
      for(let current=from;current!==to;current+=step){
        const next=current+step,index=step>0?next-1:current-1,film=(step>0?films:backwards)[index];
        if(films[next])window.AngoraVideo.prime(films[next]);if(backwards[next-1])window.AngoraVideo.prime(backwards[next-1]);
        gsap.to('.hero-title,.hero-sides,.hero-bottom',{autoAlpha:0,duration:.12});
        gsap.to('.cinema-caption',{autoAlpha:0,y:8,duration:.1});gsap.to('.cinema-track',{autoAlpha:1,duration:.12});
        $('.hero').dataset.cameraHold='false';$('.hero').dataset.filmChapter=index;
        $('#cinema-status').textContent='Camera in motion';
        gsap.set(media,{scale:1,clipPath:'inset(0% 0% 0% 0%)'});
        await window.AngoraVideo.play(film,films.concat(backwards),.55,reduced,progress=>{
          $$('[data-film-chapter]').forEach((b,i)=>{b.setAttribute('aria-current',String(i===index));b.querySelector('i').style.transform=`scaleX(${i<index?1:i===index?progress:0})`;});
        },()=>{opening.pause();opening.style.opacity='0';});
        const destination=Math.max(0,next-1);$('#cinema-title').textContent=manifest.clips[destination].title;$('#cinema-count').textContent=`0${destination+1} / 03`;$('#cinema-caption').textContent=descriptions[destination];
        $('.hero').dataset.cameraHold=String(next>0);$('.hero').dataset.filmProgress=String(next/3);
        gsap.to('.cinema-caption',{autoAlpha:next>0?1:0,y:0,duration:.2,ease:'power2.out'});
        if(next===0){await window.AngoraCinema.reset();}
        $('#cinema-status').textContent=next===3?'Scroll to discover the residence':next===0?'Scroll once to begin':'Scroll once for the next scene';
      }
    },async (direction,top)=>{
      if(direction<0||reduced)return;
      // Framing and the incoming editorial page share one movement and one clock.
      await Promise.all([window.AngoraScroll.travel(top,.68),new Promise(resolve=>gsap.timeline({onComplete:resolve})
        .to('.cinema-caption,.cinema-track,.cinema-status',{autoAlpha:0,y:-10,duration:.22},0)
        .to('.hero',{backgroundColor:'#efede6',duration:.68},0)
        .to(media,{clipPath:'inset(6% 6% 6% 6%)',duration:.68,ease:'power2.inOut'},0))]);return true;
    });
    window.AngoraCinema={reset:async()=>{intro?.kill();await window.AngoraVideo.still(opening,[opening,...films,...backwards]);scene.reset(0);opening.style.opacity='1';$('.hero').dataset.cameraHold='false';gsap.set(media,{scale:1,clipPath:'inset(0% 0% 0% 0%)'});gsap.set('.hero',{backgroundColor:'#223e35'});gsap.set('.hero-title,.hero-sides,.hero-bottom',{autoAlpha:1,y:0});gsap.set('.cinema-caption,.cinema-track',{autoAlpha:0});gsap.set('.cinema-status',{autoAlpha:1,y:0});$('#cinema-status').textContent='Scroll once to begin';}};
    $$('[data-film-chapter]').forEach(button=>button.addEventListener('click',()=>scene.go(Number(button.dataset.filmChapter)+1)));
    $('#cinema-status').textContent='Scroll once to begin';
  }).catch(error=>{console.error(error);$('.cinema-veil').hidden=true;});
  if(!motion||reduced)return;
  // Restore the framed hold when the visitor comes back from the next page.
  ScrollTrigger.create({trigger:'#home',start:'top top',end:'bottom top',onEnterBack:()=>{
    gsap.to(media,{clipPath:'inset(0% 0% 0% 0%)',duration:.3,ease:'power2.out'});
    gsap.to('.hero',{backgroundColor:'#223e35',duration:.3});
    if($('.hero').dataset.cameraHold==='true')gsap.to('.cinema-caption,.cinema-track,.cinema-status',{autoAlpha:1,y:0,duration:.25});
  }});
  // Word windows belong to editorial statements, rather than every interface label.
  $$('.residence .display,.editorial h3,.life-lede h3').forEach(heading=>{
    const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{const f=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(word=>{if(!word.trim()){f.append(document.createTextNode(word));return;}const outer=document.createElement('span'),inner=document.createElement('span');outer.className='word-window';inner.textContent=word;outer.append(inner);f.append(outer);});node.replaceWith(f);});
    gsap.fromTo(heading.querySelectorAll('.word-window>span'),{yPercent:105},{yPercent:0,duration:.7,stagger:.025,ease:'power3.out',scrollTrigger:{trigger:heading,start:'top 89%',once:true}});
  });
  $$('.editorial-image').forEach(frame=>{
    gsap.fromTo(frame,{clipPath:'inset(8% 0 8% 0)',opacity:.65},{clipPath:'inset(0% 0 0% 0)',opacity:1,duration:.75,ease:'power3.out',scrollTrigger:{trigger:frame,start:'top 88%',once:true}});
    gsap.fromTo(frame.querySelector('img'),{scale:1.03},{scale:1,ease:'none',scrollTrigger:{trigger:frame,start:'top bottom',end:'bottom top',scrub:.25}});
  });

  document.fonts?.ready.then(()=>ScrollTrigger.refresh());
})();

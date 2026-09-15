(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Pr="180",oi={ROTATE:0,DOLLY:1,PAN:2},ri={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Lu=0,Ul=1,Nu=2,nc=1,ic=2,Gn=3,Yn=0,Yt=1,Zt=2,Bt=0,Gi=1,Ol=2,Fl=3,kl=4,sc=5,_n=100,Bu=101,Uu=102,Ou=103,Fu=104,Ms=200,ku=201,zu=202,Hu=203,Ta=204,wa=205,Ca=206,Vu=207,Ra=208,Gu=209,Wu=210,Xu=211,Qu=212,Yu=213,ju=214,Da=0,Pa=1,Ia=2,Qi=3,vr=4,La=5,Na=6,Ba=7,rc=0,qu=1,Ku=2,li=0,Zu=1,Ju=2,$u=3,ac=4,ed=5,td=6,nd=7,zl="attached",id="detached",oc=300,Yi=301,ji=302,Ps=303,Ua=304,Ir=306,Fn=1e3,Ln=1001,xr=1002,Dt=1003,lc=1004,Ss=1005,Et=1006,ar=1007,Nn=1008,bn=1009,cc=1010,hc=1011,Is=1012,_o=1013,Ei=1014,Qt=1015,Ot=1016,yo=1017,Mo=1018,qi=1020,uc=35902,dc=35899,fc=1021,pc=1022,an=1023,Ls=1026,Ki=1027,So=1028,Eo=1029,mc=1030,bo=1031,To=1033,or=33776,lr=33777,cr=33778,hr=33779,Oa=35840,Fa=35841,ka=35842,za=35843,Ha=36196,Va=37492,Ga=37496,Wa=37808,Xa=37809,Qa=37810,Ya=37811,ja=37812,qa=37813,Ka=37814,Za=37815,Ja=37816,$a=37817,eo=37818,to=37819,no=37820,io=37821,so=36492,ro=36494,ao=36495,oo=36283,lo=36284,co=36285,ho=36286,sd=2200,rd=2201,ad=2202,Ns=2300,Bs=2301,_a=2302,Fi=2400,ki=2401,_r=2402,wo=2500,od=2501,ld=0,gc=1,uo=2,cd=3200,hd=3201,Co=0,ud=1,ii="",vt="srgb",Ft="srgb-linear",yr="linear",nt="srgb",Ni=7680,Hl=519,dd=512,fd=513,pd=514,Ac=515,md=516,gd=517,Ad=518,vd=519,fo=35044,Vl="300 es",Bn=2e3,Mr=2001;class hi{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const i=n[e];if(i!==void 0){const r=i.indexOf(t);r!==-1&&i.splice(r,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const i=n.slice(0);for(let r=0,a=i.length;r<a;r++)i[r].call(this,e);e.target=null}}}const Vt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let $c=1234567;const ur=Math.PI/180,Us=180/Math.PI;function On(){const s=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Vt[s&255]+Vt[s>>8&255]+Vt[s>>16&255]+Vt[s>>24&255]+"-"+Vt[e&255]+Vt[e>>8&255]+"-"+Vt[e>>16&15|64]+Vt[e>>24&255]+"-"+Vt[t&63|128]+Vt[t>>8&255]+"-"+Vt[t>>16&255]+Vt[t>>24&255]+Vt[n&255]+Vt[n>>8&255]+Vt[n>>16&255]+Vt[n>>24&255]).toLowerCase()}function We(s,e,t){return Math.max(e,Math.min(t,s))}function vc(s,e){return(s%e+e)%e}function kf(s,e,t,n,i){return n+(s-e)*(i-n)/(t-e)}function zf(s,e,t){return s!==e?(t-s)/(e-s):0}function dr(s,e,t){return(1-t)*s+t*e}function Hf(s,e,t,n){return dr(s,e,1-Math.exp(-t*n))}function Vf(s,e=1){return e-Math.abs(vc(s,e*2)-e)}function Gf(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*(3-2*s))}function Wf(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e),s*s*s*(s*(s*6-15)+10))}function Xf(s,e){return s+Math.floor(Math.random()*(e-s+1))}function Qf(s,e){return s+Math.random()*(e-s)}function Yf(s){return s*(.5-Math.random())}function jf(s){s!==void 0&&($c=s);let e=$c+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function qf(s){return s*ur}function Kf(s){return s*Us}function Zf(s){return(s&s-1)===0&&s!==0}function Jf(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function $f(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function ep(s,e,t,n,i){const r=Math.cos,a=Math.sin,o=r(t/2),c=a(t/2),l=r((e+n)/2),h=a((e+n)/2),u=r((e-n)/2),d=a((e-n)/2),f=r((n-e)/2),g=a((n-e)/2);switch(i){case"XYX":s.set(o*h,c*u,c*d,o*l);break;case"YZY":s.set(c*d,o*h,c*u,o*l);break;case"ZXZ":s.set(c*u,c*d,o*h,o*l);break;case"XZX":s.set(o*h,c*g,c*f,o*l);break;case"YXY":s.set(c*f,o*h,c*g,o*l);break;case"ZYZ":s.set(c*g,c*f,o*h,o*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function Pn(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function it(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("Invalid component type.")}}const Mt={DEG2RAD:ur,RAD2DEG:Us,generateUUID:On,clamp:We,euclideanModulo:vc,mapLinear:kf,inverseLerp:zf,lerp:dr,damp:Hf,pingpong:Vf,smoothstep:Gf,smootherstep:Wf,randInt:Xf,randFloat:Qf,randFloatSpread:Yf,seededRandom:jf,degToRad:qf,radToDeg:Kf,isPowerOfTwo:Zf,ceilPowerOfTwo:Jf,floorPowerOfTwo:$f,setQuaternionFromProperEuler:ep,normalize:it,denormalize:Pn};class we{constructor(e=0,t=0){we.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*i+e.x,this.y=r*i+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class on{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,a,o){let c=n[i+0],l=n[i+1],h=n[i+2],u=n[i+3];const d=r[a+0],f=r[a+1],g=r[a+2],A=r[a+3];if(o===0){e[t+0]=c,e[t+1]=l,e[t+2]=h,e[t+3]=u;return}if(o===1){e[t+0]=d,e[t+1]=f,e[t+2]=g,e[t+3]=A;return}if(u!==A||c!==d||l!==f||h!==g){let m=1-o;const p=c*d+l*f+h*g+u*A,E=p>=0?1:-1,w=1-p*p;if(w>Number.EPSILON){const M=Math.sqrt(w),y=Math.atan2(M,p*E);m=Math.sin(m*y)/M,o=Math.sin(o*y)/M}const v=o*E;if(c=c*m+d*v,l=l*m+f*v,h=h*m+g*v,u=u*m+A*v,m===1-o){const M=1/Math.sqrt(c*c+l*l+h*h+u*u);c*=M,l*=M,h*=M,u*=M}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,r,a){const o=n[i],c=n[i+1],l=n[i+2],h=n[i+3],u=r[a],d=r[a+1],f=r[a+2],g=r[a+3];return e[t]=o*g+h*u+c*f-l*d,e[t+1]=c*g+h*d+l*u-o*f,e[t+2]=l*g+h*f+o*d-c*u,e[t+3]=h*g-o*u-c*d-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,i=e._y,r=e._z,a=e._order,o=Math.cos,c=Math.sin,l=o(n/2),h=o(i/2),u=o(r/2),d=c(n/2),f=c(i/2),g=c(r/2);switch(a){case"XYZ":this._x=d*h*u+l*f*g,this._y=l*f*u-d*h*g,this._z=l*h*g+d*f*u,this._w=l*h*u-d*f*g;break;case"YXZ":this._x=d*h*u+l*f*g,this._y=l*f*u-d*h*g,this._z=l*h*g-d*f*u,this._w=l*h*u+d*f*g;break;case"ZXY":this._x=d*h*u-l*f*g,this._y=l*f*u+d*h*g,this._z=l*h*g+d*f*u,this._w=l*h*u-d*f*g;break;case"ZYX":this._x=d*h*u-l*f*g,this._y=l*f*u+d*h*g,this._z=l*h*g-d*f*u,this._w=l*h*u+d*f*g;break;case"YZX":this._x=d*h*u+l*f*g,this._y=l*f*u+d*h*g,this._z=l*h*g-d*f*u,this._w=l*h*u-d*f*g;break;case"XZY":this._x=d*h*u-l*f*g,this._y=l*f*u-d*h*g,this._z=l*h*g+d*f*u,this._w=l*h*u+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],i=t[4],r=t[8],a=t[1],o=t[5],c=t[9],l=t[2],h=t[6],u=t[10],d=n+o+u;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-c)*f,this._y=(r-l)*f,this._z=(a-i)*f}else if(n>o&&n>u){const f=2*Math.sqrt(1+n-o-u);this._w=(h-c)/f,this._x=.25*f,this._y=(i+a)/f,this._z=(r+l)/f}else if(o>u){const f=2*Math.sqrt(1+o-n-u);this._w=(r-l)/f,this._x=(i+a)/f,this._y=.25*f,this._z=(c+h)/f}else{const f=2*Math.sqrt(1+u-n-o);this._w=(a-i)/f,this._x=(r+l)/f,this._y=(c+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(We(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,i=e._y,r=e._z,a=e._w,o=t._x,c=t._y,l=t._z,h=t._w;return this._x=n*h+a*o+i*l-r*c,this._y=i*h+a*c+r*o-n*l,this._z=r*h+a*l+n*c-i*o,this._w=a*h-n*o-i*c-r*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,i=this._y,r=this._z,a=this._w;let o=a*e._w+n*e._x+i*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=i,this._z=r,this;const c=1-o*o;if(c<=Number.EPSILON){const f=1-t;return this._w=f*a+t*this._w,this._x=f*n+t*this._x,this._y=f*i+t*this._y,this._z=f*r+t*this._z,this.normalize(),this}const l=Math.sqrt(c),h=Math.atan2(l,o),u=Math.sin((1-t)*h)/l,d=Math.sin(t*h)/l;return this._w=a*u+this._w*d,this._x=n*u+this._x*d,this._y=i*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class I{constructor(e=0,t=0,n=0){I.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(eh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(eh.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,i=this.z,r=e.x,a=e.y,o=e.z,c=e.w,l=2*(a*i-o*n),h=2*(o*t-r*i),u=2*(r*n-a*t);return this.x=t+c*l+a*u-o*h,this.y=n+c*h+o*l-r*u,this.z=i+c*u+r*h-a*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,i=e.y,r=e.z,a=t.x,o=t.y,c=t.z;return this.x=i*c-r*o,this.y=r*a-n*c,this.z=n*o-i*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Go.copy(this).projectOnVector(e),this.sub(Go)}reflect(e){return this.sub(Go.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Go=new I,eh=new on;class Ve{constructor(e,t,n,i,r,a,o,c,l){Ve.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,c,l)}set(e,t,n,i,r,a,o,c,l){const h=this.elements;return h[0]=e,h[1]=i,h[2]=o,h[3]=t,h[4]=r,h[5]=c,h[6]=n,h[7]=a,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],h=n[4],u=n[7],d=n[2],f=n[5],g=n[8],A=i[0],m=i[3],p=i[6],E=i[1],w=i[4],v=i[7],M=i[2],y=i[5],T=i[8];return r[0]=a*A+o*E+c*M,r[3]=a*m+o*w+c*y,r[6]=a*p+o*v+c*T,r[1]=l*A+h*E+u*M,r[4]=l*m+h*w+u*y,r[7]=l*p+h*v+u*T,r[2]=d*A+f*E+g*M,r[5]=d*m+f*w+g*y,r[8]=d*p+f*v+g*T,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8];return t*a*h-t*o*l-n*r*h+n*o*c+i*r*l-i*a*c}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8],u=h*a-o*l,d=o*c-h*r,f=l*r-a*c,g=t*u+n*d+i*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const A=1/g;return e[0]=u*A,e[1]=(i*l-h*n)*A,e[2]=(o*n-i*a)*A,e[3]=d*A,e[4]=(h*t-i*c)*A,e[5]=(i*r-o*t)*A,e[6]=f*A,e[7]=(n*c-l*t)*A,e[8]=(a*t-n*r)*A,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,a,o){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*a+l*o)+a+e,-i*l,i*c,-i*(-l*a+c*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Wo.makeScale(e,t)),this}rotate(e){return this.premultiply(Wo.makeRotation(-e)),this}translate(e,t){return this.premultiply(Wo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Wo=new Ve;function xd(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function Sr(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function _d(){const s=Sr("canvas");return s.style.display="block",s}const th={};function Er(s){s in th||(th[s]=!0,console.warn(s))}function tp(s,e,t){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(e,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}const nh=new Ve().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ih=new Ve().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function np(){const s={enabled:!0,workingColorSpace:Ft,spaces:{},convert:function(i,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===nt&&(i.r=ci(i.r),i.g=ci(i.g),i.b=ci(i.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(i.applyMatrix3(this.spaces[r].toXYZ),i.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===nt&&(i.r=Ts(i.r),i.g=Ts(i.g),i.b=Ts(i.b))),i},workingToColorSpace:function(i,r){return this.convert(i,this.workingColorSpace,r)},colorSpaceToWorking:function(i,r){return this.convert(i,r,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===ii?yr:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,r=this.workingColorSpace){return i.fromArray(this.spaces[r].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,r,a){return i.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,r){return Er("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),s.workingToColorSpace(i,r)},toWorkingColorSpace:function(i,r){return Er("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),s.colorSpaceToWorking(i,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return s.define({[Ft]:{primaries:e,whitePoint:n,transfer:yr,toXYZ:nh,fromXYZ:ih,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:vt},outputColorSpaceConfig:{drawingBufferColorSpace:vt}},[vt]:{primaries:e,whitePoint:n,transfer:nt,toXYZ:nh,fromXYZ:ih,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:vt}}}),s}const qe=np();function ci(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function Ts(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}let os;class yd{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{os===void 0&&(os=Sr("canvas")),os.width=e.width,os.height=e.height;const i=os.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),n=os}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Sr("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let a=0;a<r.length;a++)r[a]=ci(r[a]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(ci(t[n]/255)*255):t[n]=ci(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let ip=0;class Ro{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:ip++}),this.uuid=On(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?r.push(Xo(i[a].image)):r.push(Xo(i[a]))}else r=Xo(i);n.url=r}return t||(e.images[this.uuid]=n),n}}function Xo(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?yd.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let sp=0;const Qo=new I;class wt extends hi{constructor(e=wt.DEFAULT_IMAGE,t=wt.DEFAULT_MAPPING,n=Ln,i=Ln,r=Et,a=Nn,o=an,c=bn,l=wt.DEFAULT_ANISOTROPY,h=ii){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:sp++}),this.uuid=On(),this.name="",this.source=new Ro(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new we(0,0),this.repeat=new we(1,1),this.center=new we(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ve,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(Qo).x}get height(){return this.source.getSize(Qo).y}get depth(){return this.source.getSize(Qo).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const i=this[t];if(i===void 0){console.warn(`THREE.Texture.setValues(): property '${t}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==oc)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Fn:e.x=e.x-Math.floor(e.x);break;case Ln:e.x=e.x<0?0:1;break;case xr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Fn:e.y=e.y-Math.floor(e.y);break;case Ln:e.y=e.y<0?0:1;break;case xr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}wt.DEFAULT_IMAGE=null;wt.DEFAULT_MAPPING=oc;wt.DEFAULT_ANISOTROPY=1;class Ze{constructor(e=0,t=0,n=0,i=1){Ze.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*i+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*i+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*i+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*i+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r;const c=e.elements,l=c[0],h=c[4],u=c[8],d=c[1],f=c[5],g=c[9],A=c[2],m=c[6],p=c[10];if(Math.abs(h-d)<.01&&Math.abs(u-A)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+A)<.1&&Math.abs(g+m)<.1&&Math.abs(l+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const w=(l+1)/2,v=(f+1)/2,M=(p+1)/2,y=(h+d)/4,T=(u+A)/4,C=(g+m)/4;return w>v&&w>M?w<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(w),i=y/n,r=T/n):v>M?v<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(v),n=y/i,r=C/i):M<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(M),n=T/r,i=C/r),this.set(n,i,r,t),this}let E=Math.sqrt((m-g)*(m-g)+(u-A)*(u-A)+(d-h)*(d-h));return Math.abs(E)<.001&&(E=1),this.x=(m-g)/E,this.y=(u-A)/E,this.z=(d-h)/E,this.w=Math.acos((l+f+p-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this.w=We(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this.w=We(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Md extends hi{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Et,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Ze(0,0,e,t),this.scissorTest=!1,this.viewport=new Ze(0,0,e,t);const i={width:e,height:t,depth:n.depth},r=new wt(i);this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){const t={minFilter:Et,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isArrayTexture=this.textures[i].image.depth>1;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const i=Object.assign({},e.textures[t].image);this.textures[t].source=new Ro(i)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class en extends Md{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class xc extends wt{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=Ln,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Sd extends wt{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=Ln,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ht{constructor(e=new I(1/0,1/0,1/0),t=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(wn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(wn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=wn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,wn):wn.fromBufferAttribute(r,a),wn.applyMatrix4(e.matrixWorld),this.expandByPoint(wn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),kr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),kr.copy(n.boundingBox)),kr.applyMatrix4(e.matrixWorld),this.union(kr)}const i=e.children;for(let r=0,a=i.length;r<a;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,wn),wn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Xs),zr.subVectors(this.max,Xs),ls.subVectors(e.a,Xs),cs.subVectors(e.b,Xs),hs.subVectors(e.c,Xs),di.subVectors(cs,ls),fi.subVectors(hs,cs),wi.subVectors(ls,hs);let t=[0,-di.z,di.y,0,-fi.z,fi.y,0,-wi.z,wi.y,di.z,0,-di.x,fi.z,0,-fi.x,wi.z,0,-wi.x,-di.y,di.x,0,-fi.y,fi.x,0,-wi.y,wi.x,0];return!Yo(t,ls,cs,hs,zr)||(t=[1,0,0,0,1,0,0,0,1],!Yo(t,ls,cs,hs,zr))?!1:(Hr.crossVectors(di,fi),t=[Hr.x,Hr.y,Hr.z],Yo(t,ls,cs,hs,zr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,wn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(wn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(qn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),qn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),qn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),qn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),qn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),qn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),qn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),qn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(qn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const qn=[new I,new I,new I,new I,new I,new I,new I,new I],wn=new I,kr=new Ht,ls=new I,cs=new I,hs=new I,di=new I,fi=new I,wi=new I,Xs=new I,zr=new I,Hr=new I,Ci=new I;function Yo(s,e,t,n,i){for(let r=0,a=s.length-3;r<=a;r+=3){Ci.fromArray(s,r);const o=i.x*Math.abs(Ci.x)+i.y*Math.abs(Ci.y)+i.z*Math.abs(Ci.z),c=e.dot(Ci),l=t.dot(Ci),h=n.dot(Ci);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>o)return!1}return!0}const rp=new Ht,Qs=new I,jo=new I;class zn{constructor(e=new I,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):rp.setFromPoints(e).getCenter(n);let i=0;for(let r=0,a=e.length;r<a;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Qs.subVectors(e,this.center);const t=Qs.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(Qs,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(jo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Qs.copy(e.center).add(jo)),this.expandByPoint(Qs.copy(e.center).sub(jo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}const Kn=new I,qo=new I,Vr=new I,pi=new I,Ko=new I,Gr=new I,Zo=new I;class ts{constructor(e=new I,t=new I(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Kn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Kn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Kn.copy(this.origin).addScaledVector(this.direction,t),Kn.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){qo.copy(e).add(t).multiplyScalar(.5),Vr.copy(t).sub(e).normalize(),pi.copy(this.origin).sub(qo);const r=e.distanceTo(t)*.5,a=-this.direction.dot(Vr),o=pi.dot(this.direction),c=-pi.dot(Vr),l=pi.lengthSq(),h=Math.abs(1-a*a);let u,d,f,g;if(h>0)if(u=a*c-o,d=a*o-c,g=r*h,u>=0)if(d>=-g)if(d<=g){const A=1/h;u*=A,d*=A,f=u*(u+a*d+2*o)+d*(a*u+d+2*c)+l}else d=r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*c)+l;else d=-r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*c)+l;else d<=-g?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-c),r),f=-u*u+d*(d+2*c)+l):d<=g?(u=0,d=Math.min(Math.max(-r,-c),r),f=d*(d+2*c)+l):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-c),r),f=-u*u+d*(d+2*c)+l);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(qo).addScaledVector(Vr,d),f}intersectSphere(e,t){Kn.subVectors(e.center,this.origin);const n=Kn.dot(this.direction),i=Kn.dot(Kn)-n*n,r=e.radius*e.radius;if(i>r)return null;const a=Math.sqrt(r-i),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,a,o,c;const l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return l>=0?(n=(e.min.x-d.x)*l,i=(e.max.x-d.x)*l):(n=(e.max.x-d.x)*l,i=(e.min.x-d.x)*l),h>=0?(r=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),n>a||r>i||((r>n||isNaN(n))&&(n=r),(a<i||isNaN(i))&&(i=a),u>=0?(o=(e.min.z-d.z)*u,c=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,c=(e.min.z-d.z)*u),n>c||o>i)||((o>n||n!==n)&&(n=o),(c<i||i!==i)&&(i=c),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,Kn)!==null}intersectTriangle(e,t,n,i,r){Ko.subVectors(t,e),Gr.subVectors(n,e),Zo.crossVectors(Ko,Gr);let a=this.direction.dot(Zo),o;if(a>0){if(i)return null;o=1}else if(a<0)o=-1,a=-a;else return null;pi.subVectors(this.origin,e);const c=o*this.direction.dot(Gr.crossVectors(pi,Gr));if(c<0)return null;const l=o*this.direction.dot(Ko.cross(pi));if(l<0||c+l>a)return null;const h=-o*pi.dot(Zo);return h<0?null:this.at(h/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Be{constructor(e,t,n,i,r,a,o,c,l,h,u,d,f,g,A,m){Be.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,c,l,h,u,d,f,g,A,m)}set(e,t,n,i,r,a,o,c,l,h,u,d,f,g,A,m){const p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=i,p[1]=r,p[5]=a,p[9]=o,p[13]=c,p[2]=l,p[6]=h,p[10]=u,p[14]=d,p[3]=f,p[7]=g,p[11]=A,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Be().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,i=1/us.setFromMatrixColumn(e,0).length(),r=1/us.setFromMatrixColumn(e,1).length(),a=1/us.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,i=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(i),l=Math.sin(i),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){const d=a*h,f=a*u,g=o*h,A=o*u;t[0]=c*h,t[4]=-c*u,t[8]=l,t[1]=f+g*l,t[5]=d-A*l,t[9]=-o*c,t[2]=A-d*l,t[6]=g+f*l,t[10]=a*c}else if(e.order==="YXZ"){const d=c*h,f=c*u,g=l*h,A=l*u;t[0]=d+A*o,t[4]=g*o-f,t[8]=a*l,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=f*o-g,t[6]=A+d*o,t[10]=a*c}else if(e.order==="ZXY"){const d=c*h,f=c*u,g=l*h,A=l*u;t[0]=d-A*o,t[4]=-a*u,t[8]=g+f*o,t[1]=f+g*o,t[5]=a*h,t[9]=A-d*o,t[2]=-a*l,t[6]=o,t[10]=a*c}else if(e.order==="ZYX"){const d=a*h,f=a*u,g=o*h,A=o*u;t[0]=c*h,t[4]=g*l-f,t[8]=d*l+A,t[1]=c*u,t[5]=A*l+d,t[9]=f*l-g,t[2]=-l,t[6]=o*c,t[10]=a*c}else if(e.order==="YZX"){const d=a*c,f=a*l,g=o*c,A=o*l;t[0]=c*h,t[4]=A-d*u,t[8]=g*u+f,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-l*h,t[6]=f*u+g,t[10]=d-A*u}else if(e.order==="XZY"){const d=a*c,f=a*l,g=o*c,A=o*l;t[0]=c*h,t[4]=-u,t[8]=l*h,t[1]=d*u+A,t[5]=a*h,t[9]=f*u-g,t[2]=g*u-f,t[6]=o*h,t[10]=A*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(ap,e,op)}lookAt(e,t,n){const i=this.elements;return hn.subVectors(e,t),hn.lengthSq()===0&&(hn.z=1),hn.normalize(),mi.crossVectors(n,hn),mi.lengthSq()===0&&(Math.abs(n.z)===1?hn.x+=1e-4:hn.z+=1e-4,hn.normalize(),mi.crossVectors(n,hn)),mi.normalize(),Wr.crossVectors(hn,mi),i[0]=mi.x,i[4]=Wr.x,i[8]=hn.x,i[1]=mi.y,i[5]=Wr.y,i[9]=hn.y,i[2]=mi.z,i[6]=Wr.z,i[10]=hn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],h=n[1],u=n[5],d=n[9],f=n[13],g=n[2],A=n[6],m=n[10],p=n[14],E=n[3],w=n[7],v=n[11],M=n[15],y=i[0],T=i[4],C=i[8],x=i[12],_=i[1],R=i[5],P=i[9],B=i[13],O=i[2],F=i[6],U=i[10],Y=i[14],V=i[3],Z=i[7],te=i[11],ce=i[15];return r[0]=a*y+o*_+c*O+l*V,r[4]=a*T+o*R+c*F+l*Z,r[8]=a*C+o*P+c*U+l*te,r[12]=a*x+o*B+c*Y+l*ce,r[1]=h*y+u*_+d*O+f*V,r[5]=h*T+u*R+d*F+f*Z,r[9]=h*C+u*P+d*U+f*te,r[13]=h*x+u*B+d*Y+f*ce,r[2]=g*y+A*_+m*O+p*V,r[6]=g*T+A*R+m*F+p*Z,r[10]=g*C+A*P+m*U+p*te,r[14]=g*x+A*B+m*Y+p*ce,r[3]=E*y+w*_+v*O+M*V,r[7]=E*T+w*R+v*F+M*Z,r[11]=E*C+w*P+v*U+M*te,r[15]=E*x+w*B+v*Y+M*ce,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],a=e[1],o=e[5],c=e[9],l=e[13],h=e[2],u=e[6],d=e[10],f=e[14],g=e[3],A=e[7],m=e[11],p=e[15];return g*(+r*c*u-i*l*u-r*o*d+n*l*d+i*o*f-n*c*f)+A*(+t*c*f-t*l*d+r*a*d-i*a*f+i*l*h-r*c*h)+m*(+t*l*u-t*o*f-r*a*u+n*a*f+r*o*h-n*l*h)+p*(-i*o*h-t*c*u+t*o*d+i*a*u-n*a*d+n*c*h)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],c=e[6],l=e[7],h=e[8],u=e[9],d=e[10],f=e[11],g=e[12],A=e[13],m=e[14],p=e[15],E=u*m*l-A*d*l+A*c*f-o*m*f-u*c*p+o*d*p,w=g*d*l-h*m*l-g*c*f+a*m*f+h*c*p-a*d*p,v=h*A*l-g*u*l+g*o*f-a*A*f-h*o*p+a*u*p,M=g*u*c-h*A*c-g*o*d+a*A*d+h*o*m-a*u*m,y=t*E+n*w+i*v+r*M;if(y===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const T=1/y;return e[0]=E*T,e[1]=(A*d*r-u*m*r-A*i*f+n*m*f+u*i*p-n*d*p)*T,e[2]=(o*m*r-A*c*r+A*i*l-n*m*l-o*i*p+n*c*p)*T,e[3]=(u*c*r-o*d*r-u*i*l+n*d*l+o*i*f-n*c*f)*T,e[4]=w*T,e[5]=(h*m*r-g*d*r+g*i*f-t*m*f-h*i*p+t*d*p)*T,e[6]=(g*c*r-a*m*r-g*i*l+t*m*l+a*i*p-t*c*p)*T,e[7]=(a*d*r-h*c*r+h*i*l-t*d*l-a*i*f+t*c*f)*T,e[8]=v*T,e[9]=(g*u*r-h*A*r-g*n*f+t*A*f+h*n*p-t*u*p)*T,e[10]=(a*A*r-g*o*r+g*n*l-t*A*l-a*n*p+t*o*p)*T,e[11]=(h*o*r-a*u*r-h*n*l+t*u*l+a*n*f-t*o*f)*T,e[12]=M*T,e[13]=(h*A*i-g*u*i+g*n*d-t*A*d-h*n*m+t*u*m)*T,e[14]=(g*o*i-a*A*i-g*n*c+t*A*c+a*n*m-t*o*m)*T,e[15]=(a*u*i-h*o*i+h*n*c-t*u*c-a*n*d+t*o*d)*T,this}scale(e){const t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),i=Math.sin(t),r=1-n,a=e.x,o=e.y,c=e.z,l=r*a,h=r*o;return this.set(l*a+n,l*o-i*c,l*c+i*o,0,l*o+i*c,h*o+n,h*c-i*a,0,l*c-i*o,h*c+i*a,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,a){return this.set(1,n,r,0,e,1,a,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){const i=this.elements,r=t._x,a=t._y,o=t._z,c=t._w,l=r+r,h=a+a,u=o+o,d=r*l,f=r*h,g=r*u,A=a*h,m=a*u,p=o*u,E=c*l,w=c*h,v=c*u,M=n.x,y=n.y,T=n.z;return i[0]=(1-(A+p))*M,i[1]=(f+v)*M,i[2]=(g-w)*M,i[3]=0,i[4]=(f-v)*y,i[5]=(1-(d+p))*y,i[6]=(m+E)*y,i[7]=0,i[8]=(g+w)*T,i[9]=(m-E)*T,i[10]=(1-(d+A))*T,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){const i=this.elements;let r=us.set(i[0],i[1],i[2]).length();const a=us.set(i[4],i[5],i[6]).length(),o=us.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),e.x=i[12],e.y=i[13],e.z=i[14],Cn.copy(this);const l=1/r,h=1/a,u=1/o;return Cn.elements[0]*=l,Cn.elements[1]*=l,Cn.elements[2]*=l,Cn.elements[4]*=h,Cn.elements[5]*=h,Cn.elements[6]*=h,Cn.elements[8]*=u,Cn.elements[9]*=u,Cn.elements[10]*=u,t.setFromRotationMatrix(Cn),n.x=r,n.y=a,n.z=o,this}makePerspective(e,t,n,i,r,a,o=Bn,c=!1){const l=this.elements,h=2*r/(t-e),u=2*r/(n-i),d=(t+e)/(t-e),f=(n+i)/(n-i);let g,A;if(c)g=r/(a-r),A=a*r/(a-r);else if(o===Bn)g=-(a+r)/(a-r),A=-2*a*r/(a-r);else if(o===Mr)g=-a/(a-r),A=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=u,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=A,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,i,r,a,o=Bn,c=!1){const l=this.elements,h=2/(t-e),u=2/(n-i),d=-(t+e)/(t-e),f=-(n+i)/(n-i);let g,A;if(c)g=1/(a-r),A=a/(a-r);else if(o===Bn)g=-2/(a-r),A=-(a+r)/(a-r);else if(o===Mr)g=-1/(a-r),A=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=0,l[12]=d,l[1]=0,l[5]=u,l[9]=0,l[13]=f,l[2]=0,l[6]=0,l[10]=g,l[14]=A,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const us=new I,Cn=new Be,ap=new I(0,0,0),op=new I(1,1,1),mi=new I,Wr=new I,hn=new I,sh=new Be,rh=new on;class kn{constructor(e=0,t=0,n=0,i=kn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const i=e.elements,r=i[0],a=i[4],o=i[8],c=i[1],l=i[5],h=i[9],u=i[2],d=i[6],f=i[10];switch(t){case"XYZ":this._y=Math.asin(We(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-We(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(We(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-We(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(We(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-We(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return sh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(sh,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return rh.setFromEuler(this),this.setFromQuaternion(rh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}kn.DEFAULT_ORDER="XYZ";class Do{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let lp=0;const ah=new I,ds=new on,Zn=new Be,Xr=new I,Ys=new I,cp=new I,hp=new on,oh=new I(1,0,0),lh=new I(0,1,0),ch=new I(0,0,1),hh={type:"added"},up={type:"removed"},fs={type:"childadded",child:null},Jo={type:"childremoved",child:null};class ft extends hi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:lp++}),this.uuid=On(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=ft.DEFAULT_UP.clone();const e=new I,t=new kn,n=new on,i=new I(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Be},normalMatrix:{value:new Ve}}),this.matrix=new Be,this.matrixWorld=new Be,this.matrixAutoUpdate=ft.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=ft.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Do,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ds.setFromAxisAngle(e,t),this.quaternion.multiply(ds),this}rotateOnWorldAxis(e,t){return ds.setFromAxisAngle(e,t),this.quaternion.premultiply(ds),this}rotateX(e){return this.rotateOnAxis(oh,e)}rotateY(e){return this.rotateOnAxis(lh,e)}rotateZ(e){return this.rotateOnAxis(ch,e)}translateOnAxis(e,t){return ah.copy(e).applyQuaternion(this.quaternion),this.position.add(ah.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(oh,e)}translateY(e){return this.translateOnAxis(lh,e)}translateZ(e){return this.translateOnAxis(ch,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Zn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Xr.copy(e):Xr.set(e,t,n);const i=this.parent;this.updateWorldMatrix(!0,!1),Ys.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Zn.lookAt(Ys,Xr,this.up):Zn.lookAt(Xr,Ys,this.up),this.quaternion.setFromRotationMatrix(Zn),i&&(Zn.extractRotation(i.matrixWorld),ds.setFromRotationMatrix(Zn),this.quaternion.premultiply(ds.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(hh),fs.child=e,this.dispatchEvent(fs),fs.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(up),Jo.child=e,this.dispatchEvent(Jo),Jo.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Zn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Zn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Zn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(hh),fs.child=e,this.dispatchEvent(fs),fs.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ys,e,cp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ys,hp,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(o=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){const u=c[l];r(e.shapes,u)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(e.materials,this.material[c]));i.material=o}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];i.animations.push(r(e.animations,c))}}if(t){const o=a(e.geometries),c=a(e.materials),l=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),f=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=i,n;function a(o){const c=[];for(const l in o){const h=o[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const i=e.children[n];this.add(i.clone())}return this}}ft.DEFAULT_UP=new I(0,1,0);ft.DEFAULT_MATRIX_AUTO_UPDATE=!0;ft.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Rn=new I,Jn=new I,$o=new I,$n=new I,ps=new I,ms=new I,uh=new I,el=new I,tl=new I,nl=new I,il=new Ze,sl=new Ze,rl=new Ze;class yn{constructor(e=new I,t=new I,n=new I){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Rn.subVectors(e,t),i.cross(Rn);const r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){Rn.subVectors(i,t),Jn.subVectors(n,t),$o.subVectors(e,t);const a=Rn.dot(Rn),o=Rn.dot(Jn),c=Rn.dot($o),l=Jn.dot(Jn),h=Jn.dot($o),u=a*l-o*o;if(u===0)return r.set(0,0,0),null;const d=1/u,f=(l*c-o*h)*d,g=(a*h-o*c)*d;return r.set(1-f-g,g,f)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,$n)===null?!1:$n.x>=0&&$n.y>=0&&$n.x+$n.y<=1}static getInterpolation(e,t,n,i,r,a,o,c){return this.getBarycoord(e,t,n,i,$n)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,$n.x),c.addScaledVector(a,$n.y),c.addScaledVector(o,$n.z),c)}static getInterpolatedAttribute(e,t,n,i,r,a){return il.setScalar(0),sl.setScalar(0),rl.setScalar(0),il.fromBufferAttribute(e,t),sl.fromBufferAttribute(e,n),rl.fromBufferAttribute(e,i),a.setScalar(0),a.addScaledVector(il,r.x),a.addScaledVector(sl,r.y),a.addScaledVector(rl,r.z),a}static isFrontFacing(e,t,n,i){return Rn.subVectors(n,t),Jn.subVectors(e,t),Rn.cross(Jn).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Rn.subVectors(this.c,this.b),Jn.subVectors(this.a,this.b),Rn.cross(Jn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return yn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return yn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,r){return yn.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return yn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return yn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,i=this.b,r=this.c;let a,o;ps.subVectors(i,n),ms.subVectors(r,n),el.subVectors(e,n);const c=ps.dot(el),l=ms.dot(el);if(c<=0&&l<=0)return t.copy(n);tl.subVectors(e,i);const h=ps.dot(tl),u=ms.dot(tl);if(h>=0&&u<=h)return t.copy(i);const d=c*u-h*l;if(d<=0&&c>=0&&h<=0)return a=c/(c-h),t.copy(n).addScaledVector(ps,a);nl.subVectors(e,r);const f=ps.dot(nl),g=ms.dot(nl);if(g>=0&&f<=g)return t.copy(r);const A=f*l-c*g;if(A<=0&&l>=0&&g<=0)return o=l/(l-g),t.copy(n).addScaledVector(ms,o);const m=h*g-f*u;if(m<=0&&u-h>=0&&f-g>=0)return uh.subVectors(r,i),o=(u-h)/(u-h+(f-g)),t.copy(i).addScaledVector(uh,o);const p=1/(m+A+d);return a=A*p,o=d*p,t.copy(n).addScaledVector(ps,a).addScaledVector(ms,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Ed={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},gi={h:0,s:0,l:0},Qr={h:0,s:0,l:0};function al(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+(e-s)*6*t:t<1/2?e:t<2/3?s+(e-s)*6*(2/3-t):s}class Ce{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=vt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,qe.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=qe.workingColorSpace){return this.r=e,this.g=t,this.b=n,qe.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=qe.workingColorSpace){if(e=vc(e,1),t=We(t,0,1),n=We(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=al(a,r,e+1/3),this.g=al(a,r,e),this.b=al(a,r,e-1/3)}return qe.colorSpaceToWorking(this,i),this}setStyle(e,t=vt){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=i[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=vt){const n=Ed[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=ci(e.r),this.g=ci(e.g),this.b=ci(e.b),this}copyLinearToSRGB(e){return this.r=Ts(e.r),this.g=Ts(e.g),this.b=Ts(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=vt){return qe.workingToColorSpace(Gt.copy(this),e),Math.round(We(Gt.r*255,0,255))*65536+Math.round(We(Gt.g*255,0,255))*256+Math.round(We(Gt.b*255,0,255))}getHexString(e=vt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=qe.workingColorSpace){qe.workingToColorSpace(Gt.copy(this),t);const n=Gt.r,i=Gt.g,r=Gt.b,a=Math.max(n,i,r),o=Math.min(n,i,r);let c,l;const h=(o+a)/2;if(o===a)c=0,l=0;else{const u=a-o;switch(l=h<=.5?u/(a+o):u/(2-a-o),a){case n:c=(i-r)/u+(i<r?6:0);break;case i:c=(r-n)/u+2;break;case r:c=(n-i)/u+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=qe.workingColorSpace){return qe.workingToColorSpace(Gt.copy(this),t),e.r=Gt.r,e.g=Gt.g,e.b=Gt.b,e}getStyle(e=vt){qe.workingToColorSpace(Gt.copy(this),e);const t=Gt.r,n=Gt.g,i=Gt.b;return e!==vt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(gi),this.setHSL(gi.h+e,gi.s+t,gi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(gi),e.getHSL(Qr);const n=dr(gi.h,Qr.h,t),i=dr(gi.s,Qr.s,t),r=dr(gi.l,Qr.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Gt=new Ce;Ce.NAMES=Ed;let dp=0;class Sn extends hi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:dp++}),this.uuid=On(),this.name="",this.type="Material",this.blending=Gi,this.side=Yn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ta,this.blendDst=wa,this.blendEquation=_n,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ce(0,0,0),this.blendAlpha=0,this.depthFunc=Qi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Hl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ni,this.stencilZFail=Ni,this.stencilZPass=Ni,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const i=this[t];if(i===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Gi&&(n.blending=this.blending),this.side!==Yn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Ta&&(n.blendSrc=this.blendSrc),this.blendDst!==wa&&(n.blendDst=this.blendDst),this.blendEquation!==_n&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Qi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Hl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ni&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ni&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ni&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){const a=[];for(const o in r){const c=r[o];delete c.metadata,a.push(c)}return a}if(t){const r=i(e.textures),a=i(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class Un extends Sn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ce(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new kn,this.combine=rc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const si=fp();function fp(){const s=new ArrayBuffer(4),e=new Float32Array(s),t=new Uint32Array(s),n=new Uint32Array(512),i=new Uint32Array(512);for(let c=0;c<256;++c){const l=c-127;l<-27?(n[c]=0,n[c|256]=32768,i[c]=24,i[c|256]=24):l<-14?(n[c]=1024>>-l-14,n[c|256]=1024>>-l-14|32768,i[c]=-l-1,i[c|256]=-l-1):l<=15?(n[c]=l+15<<10,n[c|256]=l+15<<10|32768,i[c]=13,i[c|256]=13):l<128?(n[c]=31744,n[c|256]=64512,i[c]=24,i[c|256]=24):(n[c]=31744,n[c|256]=64512,i[c]=13,i[c|256]=13)}const r=new Uint32Array(2048),a=new Uint32Array(64),o=new Uint32Array(64);for(let c=1;c<1024;++c){let l=c<<13,h=0;for(;(l&8388608)===0;)l<<=1,h-=8388608;l&=-8388609,h+=947912704,r[c]=l|h}for(let c=1024;c<2048;++c)r[c]=939524096+(c-1024<<13);for(let c=1;c<31;++c)a[c]=c<<23;a[31]=1199570944,a[32]=2147483648;for(let c=33;c<63;++c)a[c]=2147483648+(c-32<<23);a[63]=3347054592;for(let c=1;c<64;++c)c!==32&&(o[c]=1024);return{floatView:e,uint32View:t,baseTable:n,shiftTable:i,mantissaTable:r,exponentTable:a,offsetTable:o}}function pp(s){Math.abs(s)>65504&&console.warn("THREE.DataUtils.toHalfFloat(): Value out of range."),s=We(s,-65504,65504),si.floatView[0]=s;const e=si.uint32View[0],t=e>>23&511;return si.baseTable[t]+((e&8388607)>>si.shiftTable[t])}function mp(s){const e=s>>10;return si.uint32View[0]=si.mantissaTable[si.offsetTable[e]+(s&1023)]+si.exponentTable[e],si.floatView[0]}class tr{static toHalfFloat(e){return pp(e)}static fromHalfFloat(e){return mp(e)}}const Rt=new I,Yr=new we;let gp=0;class mt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:gp++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=fo,this.updateRanges=[],this.gpuType=Qt,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Yr.fromBufferAttribute(this,t),Yr.applyMatrix3(e),this.setXY(t,Yr.x,Yr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Rt.fromBufferAttribute(this,t),Rt.applyMatrix3(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Rt.fromBufferAttribute(this,t),Rt.applyMatrix4(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Rt.fromBufferAttribute(this,t),Rt.applyNormalMatrix(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Rt.fromBufferAttribute(this,t),Rt.transformDirection(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Pn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=it(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Pn(t,this.array)),t}setX(e,t){return this.normalized&&(t=it(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Pn(t,this.array)),t}setY(e,t){return this.normalized&&(t=it(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Pn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=it(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Pn(t,this.array)),t}setW(e,t){return this.normalized&&(t=it(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=it(t,this.array),n=it(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=it(t,this.array),n=it(n,this.array),i=it(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=it(t,this.array),n=it(n,this.array),i=it(i,this.array),r=it(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==fo&&(e.usage=this.usage),e}}class _c extends mt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class yc extends mt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class En extends mt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let Ap=0;const gn=new Be,ol=new ft,gs=new I,un=new Ht,js=new Ht,Nt=new I;class kt extends hi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ap++}),this.uuid=On(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(xd(e)?yc:_c)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Ve().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return gn.makeRotationFromQuaternion(e),this.applyMatrix4(gn),this}rotateX(e){return gn.makeRotationX(e),this.applyMatrix4(gn),this}rotateY(e){return gn.makeRotationY(e),this.applyMatrix4(gn),this}rotateZ(e){return gn.makeRotationZ(e),this.applyMatrix4(gn),this}translate(e,t,n){return gn.makeTranslation(e,t,n),this.applyMatrix4(gn),this}scale(e,t,n){return gn.makeScale(e,t,n),this.applyMatrix4(gn),this}lookAt(e){return ol.lookAt(e),ol.updateMatrix(),this.applyMatrix4(ol.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(gs).negate(),this.translate(gs.x,gs.y,gs.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let i=0,r=e.length;i<r;i++){const a=e[i];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new En(n,3))}else{const n=Math.min(e.length,t.count);for(let i=0;i<n;i++){const r=e[i];t.setXYZ(i,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ht);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){const r=t[n];un.setFromBufferAttribute(r),this.morphTargetsRelative?(Nt.addVectors(this.boundingBox.min,un.min),this.boundingBox.expandByPoint(Nt),Nt.addVectors(this.boundingBox.max,un.max),this.boundingBox.expandByPoint(Nt)):(this.boundingBox.expandByPoint(un.min),this.boundingBox.expandByPoint(un.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new zn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new I,1/0);return}if(e){const n=this.boundingSphere.center;if(un.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){const o=t[r];js.setFromBufferAttribute(o),this.morphTargetsRelative?(Nt.addVectors(un.min,js.min),un.expandByPoint(Nt),Nt.addVectors(un.max,js.max),un.expandByPoint(Nt)):(un.expandByPoint(js.min),un.expandByPoint(js.max))}un.getCenter(n);let i=0;for(let r=0,a=e.count;r<a;r++)Nt.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(Nt));if(t)for(let r=0,a=t.length;r<a;r++){const o=t[r],c=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)Nt.fromBufferAttribute(o,l),c&&(gs.fromBufferAttribute(e,l),Nt.add(gs)),i=Math.max(i,n.distanceToSquared(Nt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,i=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new mt(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],c=[];for(let C=0;C<n.count;C++)o[C]=new I,c[C]=new I;const l=new I,h=new I,u=new I,d=new we,f=new we,g=new we,A=new I,m=new I;function p(C,x,_){l.fromBufferAttribute(n,C),h.fromBufferAttribute(n,x),u.fromBufferAttribute(n,_),d.fromBufferAttribute(r,C),f.fromBufferAttribute(r,x),g.fromBufferAttribute(r,_),h.sub(l),u.sub(l),f.sub(d),g.sub(d);const R=1/(f.x*g.y-g.x*f.y);isFinite(R)&&(A.copy(h).multiplyScalar(g.y).addScaledVector(u,-f.y).multiplyScalar(R),m.copy(u).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(R),o[C].add(A),o[x].add(A),o[_].add(A),c[C].add(m),c[x].add(m),c[_].add(m))}let E=this.groups;E.length===0&&(E=[{start:0,count:e.count}]);for(let C=0,x=E.length;C<x;++C){const _=E[C],R=_.start,P=_.count;for(let B=R,O=R+P;B<O;B+=3)p(e.getX(B+0),e.getX(B+1),e.getX(B+2))}const w=new I,v=new I,M=new I,y=new I;function T(C){M.fromBufferAttribute(i,C),y.copy(M);const x=o[C];w.copy(x),w.sub(M.multiplyScalar(M.dot(x))).normalize(),v.crossVectors(y,x);const R=v.dot(c[C])<0?-1:1;a.setXYZW(C,w.x,w.y,w.z,R)}for(let C=0,x=E.length;C<x;++C){const _=E[C],R=_.start,P=_.count;for(let B=R,O=R+P;B<O;B+=3)T(e.getX(B+0)),T(e.getX(B+1)),T(e.getX(B+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new mt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const i=new I,r=new I,a=new I,o=new I,c=new I,l=new I,h=new I,u=new I;if(e)for(let d=0,f=e.count;d<f;d+=3){const g=e.getX(d+0),A=e.getX(d+1),m=e.getX(d+2);i.fromBufferAttribute(t,g),r.fromBufferAttribute(t,A),a.fromBufferAttribute(t,m),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),o.fromBufferAttribute(n,g),c.fromBufferAttribute(n,A),l.fromBufferAttribute(n,m),o.add(h),c.add(h),l.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(A,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let d=0,f=t.count;d<f;d+=3)i.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Nt.fromBufferAttribute(e,t),Nt.normalize(),e.setXYZ(t,Nt.x,Nt.y,Nt.z)}toNonIndexed(){function e(o,c){const l=o.array,h=o.itemSize,u=o.normalized,d=new l.constructor(c.length*h);let f=0,g=0;for(let A=0,m=c.length;A<m;A++){o.isInterleavedBufferAttribute?f=c[A]*o.data.stride+o.offset:f=c[A]*h;for(let p=0;p<h;p++)d[g++]=l[f++]}return new mt(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new kt,n=this.index.array,i=this.attributes;for(const o in i){const c=i[o],l=e(c,n);t.setAttribute(o,l)}const r=this.morphAttributes;for(const o in r){const c=[],l=r[o];for(let h=0,u=l.length;h<u;h++){const d=l[h],f=e(d,n);c.push(f)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const l=a[o];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const i={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],h=[];for(let u=0,d=l.length;u<d;u++){const f=l[u];h.push(f.toJSON(e.data))}h.length>0&&(i[c]=h,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const i=e.attributes;for(const l in i){const h=i[l];this.setAttribute(l,h.clone(t))}const r=e.morphAttributes;for(const l in r){const h=[],u=r[l];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let l=0,h=a.length;l<h;l++){const u=a[l];this.addGroup(u.start,u.count,u.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const dh=new Be,Ri=new ts,jr=new zn,fh=new I,qr=new I,Kr=new I,Zr=new I,ll=new I,Jr=new I,ph=new I,$r=new I;class Tt extends ft{constructor(e=new kt,t=new Un){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){const n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(i,e);const o=this.morphTargetInfluences;if(r&&o){Jr.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const h=o[c],u=r[c];h!==0&&(ll.fromBufferAttribute(u,e),a?Jr.addScaledVector(ll,h):Jr.addScaledVector(ll.sub(t),h))}t.add(Jr)}return t}raycast(e,t){const n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),jr.copy(n.boundingSphere),jr.applyMatrix4(r),Ri.copy(e.ray).recast(e.near),!(jr.containsPoint(Ri.origin)===!1&&(Ri.intersectSphere(jr,fh)===null||Ri.origin.distanceToSquared(fh)>(e.far-e.near)**2))&&(dh.copy(r).invert(),Ri.copy(e.ray).applyMatrix4(dh),!(n.boundingBox!==null&&Ri.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Ri)))}_computeIntersections(e,t,n){let i;const r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,A=d.length;g<A;g++){const m=d[g],p=a[m.materialIndex],E=Math.max(m.start,f.start),w=Math.min(o.count,Math.min(m.start+m.count,f.start+f.count));for(let v=E,M=w;v<M;v+=3){const y=o.getX(v),T=o.getX(v+1),C=o.getX(v+2);i=ea(this,p,e,n,l,h,u,y,T,C),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=m.materialIndex,t.push(i))}}else{const g=Math.max(0,f.start),A=Math.min(o.count,f.start+f.count);for(let m=g,p=A;m<p;m+=3){const E=o.getX(m),w=o.getX(m+1),v=o.getX(m+2);i=ea(this,a,e,n,l,h,u,E,w,v),i&&(i.faceIndex=Math.floor(m/3),t.push(i))}}else if(c!==void 0)if(Array.isArray(a))for(let g=0,A=d.length;g<A;g++){const m=d[g],p=a[m.materialIndex],E=Math.max(m.start,f.start),w=Math.min(c.count,Math.min(m.start+m.count,f.start+f.count));for(let v=E,M=w;v<M;v+=3){const y=v,T=v+1,C=v+2;i=ea(this,p,e,n,l,h,u,y,T,C),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=m.materialIndex,t.push(i))}}else{const g=Math.max(0,f.start),A=Math.min(c.count,f.start+f.count);for(let m=g,p=A;m<p;m+=3){const E=m,w=m+1,v=m+2;i=ea(this,a,e,n,l,h,u,E,w,v),i&&(i.faceIndex=Math.floor(m/3),t.push(i))}}}}function vp(s,e,t,n,i,r,a,o){let c;if(e.side===Yt?c=n.intersectTriangle(a,r,i,!0,o):c=n.intersectTriangle(i,r,a,e.side===Yn,o),c===null)return null;$r.copy(o),$r.applyMatrix4(s.matrixWorld);const l=t.ray.origin.distanceTo($r);return l<t.near||l>t.far?null:{distance:l,point:$r.clone(),object:s}}function ea(s,e,t,n,i,r,a,o,c,l){s.getVertexPosition(o,qr),s.getVertexPosition(c,Kr),s.getVertexPosition(l,Zr);const h=vp(s,e,t,n,qr,Kr,Zr,ph);if(h){const u=new I;yn.getBarycoord(ph,qr,Kr,Zr,u),i&&(h.uv=yn.getInterpolatedAttribute(i,o,c,l,u,new we)),r&&(h.uv1=yn.getInterpolatedAttribute(r,o,c,l,u,new we)),a&&(h.normal=yn.getInterpolatedAttribute(a,o,c,l,u,new I),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const d={a:o,b:c,c:l,normal:new I,materialIndex:0};yn.getNormal(qr,Kr,Zr,d.normal),h.face=d,h.barycoord=u}return h}class ns extends kt{constructor(e=1,t=1,n=1,i=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:a};const o=this;i=Math.floor(i),r=Math.floor(r),a=Math.floor(a);const c=[],l=[],h=[],u=[];let d=0,f=0;g("z","y","x",-1,-1,n,t,e,a,r,0),g("z","y","x",1,-1,n,t,-e,a,r,1),g("x","z","y",1,1,e,n,t,i,a,2),g("x","z","y",1,-1,e,n,-t,i,a,3),g("x","y","z",1,-1,e,t,n,i,r,4),g("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(c),this.setAttribute("position",new En(l,3)),this.setAttribute("normal",new En(h,3)),this.setAttribute("uv",new En(u,2));function g(A,m,p,E,w,v,M,y,T,C,x){const _=v/T,R=M/C,P=v/2,B=M/2,O=y/2,F=T+1,U=C+1;let Y=0,V=0;const Z=new I;for(let te=0;te<U;te++){const ce=te*R-B;for(let ge=0;ge<F;ge++){const ze=ge*_-P;Z[A]=ze*E,Z[m]=ce*w,Z[p]=O,l.push(Z.x,Z.y,Z.z),Z[A]=0,Z[m]=0,Z[p]=y>0?1:-1,h.push(Z.x,Z.y,Z.z),u.push(ge/T),u.push(1-te/C),Y+=1}}for(let te=0;te<C;te++)for(let ce=0;ce<T;ce++){const ge=d+ce+F*te,ze=d+ce+F*(te+1),Ke=d+(ce+1)+F*(te+1),Xe=d+(ce+1)+F*te;c.push(ge,ze,Xe),c.push(ze,Ke,Xe),V+=6}o.addGroup(f,V,x),f+=V,d+=Y}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ns(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function Os(s){const e={};for(const t in s){e[t]={};for(const n in s[t]){const i=s[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function Kt(s){const e={};for(let t=0;t<s.length;t++){const n=Os(s[t]);for(const i in n)e[i]=n[i]}return e}function xp(s){const e=[];for(let t=0;t<s.length;t++)e.push(s[t].clone());return e}function bd(s){const e=s.getRenderTarget();return e===null?s.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:qe.workingColorSpace}const Mn={clone:Os,merge:Kt};var _p=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,yp=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class St extends Sn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=_p,this.fragmentShader=yp,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Os(e.uniforms),this.uniformsGroups=xp(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const i in this.uniforms){const a=this.uniforms[i].value;a&&a.isTexture?t.uniforms[i]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[i]={type:"m4",value:a.toArray()}:t.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class Mc extends ft{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Be,this.projectionMatrix=new Be,this.projectionMatrixInverse=new Be,this.coordinateSystem=Bn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Ai=new I,mh=new we,gh=new we;class zt extends Mc{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Us*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(ur*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Us*2*Math.atan(Math.tan(ur*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Ai.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ai.x,Ai.y).multiplyScalar(-e/Ai.z),Ai.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Ai.x,Ai.y).multiplyScalar(-e/Ai.z)}getViewSize(e,t){return this.getViewBounds(e,mh,gh),t.subVectors(gh,mh)}setViewOffset(e,t,n,i,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(ur*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;r+=a.offsetX*i/c,t-=a.offsetY*n/l,i*=a.width/c,n*=a.height/l}const o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const As=-90,vs=1;class Sc extends ft{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new zt(As,vs,e,t);i.layers=this.layers,this.add(i);const r=new zt(As,vs,e,t);r.layers=this.layers,this.add(r);const a=new zt(As,vs,e,t);a.layers=this.layers,this.add(a);const o=new zt(As,vs,e,t);o.layers=this.layers,this.add(o);const c=new zt(As,vs,e,t);c.layers=this.layers,this.add(c);const l=new zt(As,vs,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,i,r,a,o,c]=t;for(const l of t)this.remove(l);if(e===Bn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===Mr)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,c,l,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const A=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,i),e.render(t,r),e.setRenderTarget(n,1,i),e.render(t,a),e.setRenderTarget(n,2,i),e.render(t,o),e.setRenderTarget(n,3,i),e.render(t,c),e.setRenderTarget(n,4,i),e.render(t,l),n.texture.generateMipmaps=A,e.setRenderTarget(n,5,i),e.render(t,h),e.setRenderTarget(u,d,f),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class Ec extends wt{constructor(e=[],t=Yi,n,i,r,a,o,c,l,h){super(e,t,n,i,r,a,o,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class bc extends en{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new Ec(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new ns(5,5,5),r=new St({name:"CubemapFromEquirect",uniforms:Os(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Yt,blending:Bt});r.uniforms.tEquirect.value=t;const a=new Tt(i,r),o=t.minFilter;return t.minFilter===Nn&&(t.minFilter=Et),new Sc(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){const r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,i);e.setRenderTarget(r)}}class $t extends ft{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Mp={type:"move"};class ya{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new $t,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new $t,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new $t,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,a=null;const o=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){a=!0;for(const A of e.hand.values()){const m=t.getJointPose(A,n),p=this._getHandJoint(l,A);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const h=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,g=.005;l.inputState.pinching&&d>f+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=f-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));o!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Mp)))}return o!==null&&(o.visible=i!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new $t;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class Po extends ft{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new kn,this.environmentIntensity=1,this.environmentRotation=new kn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}class Td{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=fo,this.updateRanges=[],this.version=0,this.uuid=On()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,r=this.stride;i<r;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=On()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=On()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const qt=new I;class Io{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)qt.fromBufferAttribute(this,t),qt.applyMatrix4(e),this.setXYZ(t,qt.x,qt.y,qt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)qt.fromBufferAttribute(this,t),qt.applyNormalMatrix(e),this.setXYZ(t,qt.x,qt.y,qt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)qt.fromBufferAttribute(this,t),qt.transformDirection(e),this.setXYZ(t,qt.x,qt.y,qt.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Pn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=it(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=it(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=it(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=it(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=it(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Pn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Pn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Pn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Pn(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=it(t,this.array),n=it(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=it(t,this.array),n=it(n,this.array),i=it(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=it(t,this.array),n=it(n,this.array),i=it(i,this.array),r=it(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=r,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return new mt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new Io(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}const Ah=new I,vh=new Ze,xh=new Ze,Sp=new I,_h=new Be,ta=new I,cl=new zn,yh=new Be,hl=new ts;class wd extends Tt{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=zl,this.bindMatrix=new Be,this.bindMatrixInverse=new Be,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Ht),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,ta),this.boundingBox.expandByPoint(ta)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new zn),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,ta),this.boundingSphere.expandByPoint(ta)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){const n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),cl.copy(this.boundingSphere),cl.applyMatrix4(i),e.ray.intersectsSphere(cl)!==!1&&(yh.copy(i).invert(),hl.copy(e.ray).applyMatrix4(yh),!(this.boundingBox!==null&&hl.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,hl)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new Ze,t=this.geometry.attributes.skinWeight;for(let n=0,i=t.count;n<i;n++){e.fromBufferAttribute(t,n);const r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===zl?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===id?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){const n=this.skeleton,i=this.geometry;vh.fromBufferAttribute(i.attributes.skinIndex,e),xh.fromBufferAttribute(i.attributes.skinWeight,e),Ah.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let r=0;r<4;r++){const a=xh.getComponent(r);if(a!==0){const o=vh.getComponent(r);_h.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),t.addScaledVector(Sp.copy(Ah).applyMatrix4(_h),a)}}return t.applyMatrix4(this.bindMatrixInverse)}}class Tc extends ft{constructor(){super(),this.isBone=!0,this.type="Bone"}}class ks extends wt{constructor(e=null,t=1,n=1,i,r,a,o,c,l=Dt,h=Dt,u,d){super(null,a,o,c,l,h,i,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Mh=new Be,Ep=new Be;class Lo{constructor(e=[],t=[]){this.uuid=On(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new Be)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const n=new Be;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const e=this.bones,t=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let r=0,a=e.length;r<a;r++){const o=e[r]?e[r].matrixWorld:Ep;Mh.multiplyMatrices(o,t[r]),Mh.toArray(n,r*16)}i!==null&&(i.needsUpdate=!0)}clone(){return new Lo(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const n=new ks(t,e,e,an,Qt);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){const i=this.bones[t];if(i.name===e)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,i=e.bones.length;n<i;n++){const r=e.bones[n];let a=t[r];a===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),a=new Tc),this.bones.push(a),this.boneInverses.push(new Be().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){const e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,n=this.boneInverses;for(let i=0,r=t.length;i<r;i++){const a=t[i];e.bones.push(a.uuid);const o=n[i];e.boneInverses.push(o.toArray())}return e}}class po extends mt{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const xs=new Be,Sh=new Be,na=[],Eh=new Ht,bp=new Be,qs=new Tt,Ks=new zn;class Cd extends Tt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new po(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,bp)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ht),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,xs),Eh.copy(e.boundingBox).applyMatrix4(xs),this.boundingBox.union(Eh)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new zn),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,xs),Ks.copy(e.boundingSphere).applyMatrix4(xs),this.boundingSphere.union(Ks)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=i[a+o]}raycast(e,t){const n=this.matrixWorld,i=this.count;if(qs.geometry=this.geometry,qs.material=this.material,qs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ks.copy(this.boundingSphere),Ks.applyMatrix4(n),e.ray.intersectsSphere(Ks)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,xs),Sh.multiplyMatrices(n,xs),qs.matrixWorld=Sh,qs.raycast(e,na);for(let a=0,o=na.length;a<o;a++){const c=na[a];c.instanceId=r,c.object=this,t.push(c)}na.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new po(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){const n=t.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new ks(new Float32Array(i*this.count),i,this.count,So,Qt));const r=this.morphTexture.source.data.data;let a=0;for(let l=0;l<n.length;l++)a+=n[l];const o=this.geometry.morphTargetsRelative?1:1-a,c=i*e;r[c]=o,r.set(n,c+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const ul=new I,Tp=new I,wp=new Ve;class xn{constructor(e=new I(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const i=ul.subVectors(n,t).cross(Tp.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(ul),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||wp.getNormalMatrix(e),i=this.coplanarPoint(ul).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Di=new zn,Cp=new we(.5,.5),ia=new I;class No{constructor(e=new xn,t=new xn,n=new xn,i=new xn,r=new xn,a=new xn){this.planes=[e,t,n,i,r,a]}set(e,t,n,i,r,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Bn,n=!1){const i=this.planes,r=e.elements,a=r[0],o=r[1],c=r[2],l=r[3],h=r[4],u=r[5],d=r[6],f=r[7],g=r[8],A=r[9],m=r[10],p=r[11],E=r[12],w=r[13],v=r[14],M=r[15];if(i[0].setComponents(l-a,f-h,p-g,M-E).normalize(),i[1].setComponents(l+a,f+h,p+g,M+E).normalize(),i[2].setComponents(l+o,f+u,p+A,M+w).normalize(),i[3].setComponents(l-o,f-u,p-A,M-w).normalize(),n)i[4].setComponents(c,d,m,v).normalize(),i[5].setComponents(l-c,f-d,p-m,M-v).normalize();else if(i[4].setComponents(l-c,f-d,p-m,M-v).normalize(),t===Bn)i[5].setComponents(l+c,f+d,p+m,M+v).normalize();else if(t===Mr)i[5].setComponents(c,d,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Di.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Di.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Di)}intersectsSprite(e){Di.center.set(0,0,0);const t=Cp.distanceTo(e.center);return Di.radius=.7071067811865476+t,Di.applyMatrix4(e.matrixWorld),this.intersectsSphere(Di)}intersectsSphere(e){const t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const i=t[n];if(ia.x=i.normal.x>0?e.max.x:e.min.x,ia.y=i.normal.y>0?e.max.y:e.min.y,ia.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(ia)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class zs extends Sn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ce(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const mo=new I,go=new I,bh=new Be,Zs=new ts,sa=new zn,dl=new I,Th=new I;class Lr extends ft{constructor(e=new kt,t=new zs){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let i=1,r=t.count;i<r;i++)mo.fromBufferAttribute(t,i-1),go.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=mo.distanceTo(go);e.setAttribute("lineDistance",new En(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const n=this.geometry,i=this.matrixWorld,r=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),sa.copy(n.boundingSphere),sa.applyMatrix4(i),sa.radius+=r,e.ray.intersectsSphere(sa)===!1)return;bh.copy(i).invert(),Zs.copy(e.ray).applyMatrix4(bh);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=this.isLineSegments?2:1,h=n.index,d=n.attributes.position;if(h!==null){const f=Math.max(0,a.start),g=Math.min(h.count,a.start+a.count);for(let A=f,m=g-1;A<m;A+=l){const p=h.getX(A),E=h.getX(A+1),w=ra(this,e,Zs,c,p,E,A);w&&t.push(w)}if(this.isLineLoop){const A=h.getX(g-1),m=h.getX(f),p=ra(this,e,Zs,c,A,m,g-1);p&&t.push(p)}}else{const f=Math.max(0,a.start),g=Math.min(d.count,a.start+a.count);for(let A=f,m=g-1;A<m;A+=l){const p=ra(this,e,Zs,c,A,A+1,A);p&&t.push(p)}if(this.isLineLoop){const A=ra(this,e,Zs,c,g-1,f,g-1);A&&t.push(A)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function ra(s,e,t,n,i,r,a){const o=s.geometry.attributes.position;if(mo.fromBufferAttribute(o,i),go.fromBufferAttribute(o,r),t.distanceSqToSegment(mo,go,dl,Th)>n)return;dl.applyMatrix4(s.matrixWorld);const l=e.ray.origin.distanceTo(dl);if(!(l<e.near||l>e.far))return{distance:l,point:Th.clone().applyMatrix4(s.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:s}}const wh=new I,Ch=new I;class wc extends Lr{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[];for(let i=0,r=t.count;i<r;i+=2)wh.fromBufferAttribute(t,i),Ch.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+wh.distanceTo(Ch);e.setAttribute("lineDistance",new En(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Rd extends Lr{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}}class Cc extends Sn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ce(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const Rh=new Be,Gl=new ts,aa=new zn,oa=new I;class Dd extends ft{constructor(e=new kt,t=new Cc){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const n=this.geometry,i=this.matrixWorld,r=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),aa.copy(n.boundingSphere),aa.applyMatrix4(i),aa.radius+=r,e.ray.intersectsSphere(aa)===!1)return;Rh.copy(i).invert(),Gl.copy(e.ray).applyMatrix4(Rh);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=n.index,u=n.attributes.position;if(l!==null){const d=Math.max(0,a.start),f=Math.min(l.count,a.start+a.count);for(let g=d,A=f;g<A;g++){const m=l.getX(g);oa.fromBufferAttribute(u,m),Dh(oa,m,c,i,e,t,this)}}else{const d=Math.max(0,a.start),f=Math.min(u.count,a.start+a.count);for(let g=d,A=f;g<A;g++)oa.fromBufferAttribute(u,g),Dh(oa,g,c,i,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){const o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function Dh(s,e,t,n,i,r,a){const o=Gl.distanceSqToPoint(s);if(o<t){const c=new I;Gl.closestPointToPoint(s,c),c.applyMatrix4(n);const l=i.ray.origin.distanceTo(c);if(l<i.near||l>i.far)return;r.push({distance:l,distanceToRay:Math.sqrt(o),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}class Bo extends wt{constructor(e,t,n=Ei,i,r,a,o=Dt,c=Dt,l,h=Ls,u=1){if(h!==Ls&&h!==Ki)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:e,height:t,depth:u};super(d,i,r,a,o,c,h,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ro(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class Rc extends wt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Hs extends kt{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};const r=e/2,a=t/2,o=Math.floor(n),c=Math.floor(i),l=o+1,h=c+1,u=e/o,d=t/c,f=[],g=[],A=[],m=[];for(let p=0;p<h;p++){const E=p*d-a;for(let w=0;w<l;w++){const v=w*u-r;g.push(v,-E,0),A.push(0,0,1),m.push(w/o),m.push(1-p/c)}}for(let p=0;p<c;p++)for(let E=0;E<o;E++){const w=E+l*p,v=E+l*(p+1),M=E+1+l*(p+1),y=E+1+l*p;f.push(w,v,y),f.push(v,M,y)}this.setIndex(f),this.setAttribute("position",new En(g,3)),this.setAttribute("normal",new En(A,3)),this.setAttribute("uv",new En(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Hs(e.width,e.height,e.widthSegments,e.heightSegments)}}class Nr extends Sn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ce(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ce(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Co,this.normalScale=new we(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new kn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Hn extends Nr{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new we(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return We(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Ce(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ce(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ce(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}class Pd extends Sn{constructor(e){super(),this.isMeshNormalMaterial=!0,this.type="MeshNormalMaterial",this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Co,this.normalScale=new we(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(e)}copy(e){return super.copy(e),this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this}}class Id extends Sn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=cd,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Ld extends Sn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class Nd extends zs{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}}function la(s,e){return!s||s.constructor===e?s:typeof e.BYTES_PER_ELEMENT=="number"?new e(s):Array.prototype.slice.call(s)}function Rp(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function Dp(s){function e(i,r){return s[i]-s[r]}const t=s.length,n=new Array(t);for(let i=0;i!==t;++i)n[i]=i;return n.sort(e),n}function Ph(s,e,t){const n=s.length,i=new s.constructor(n);for(let r=0,a=0;a!==n;++r){const o=t[r]*e;for(let c=0;c!==e;++c)i[a++]=s[o+c]}return i}function Bd(s,e,t,n){let i=1,r=s[0];for(;r!==void 0&&r[n]===void 0;)r=s[i++];if(r===void 0)return;let a=r[n];if(a!==void 0)if(Array.isArray(a))do a=r[n],a!==void 0&&(e.push(r.time),t.push(...a)),r=s[i++];while(r!==void 0);else if(a.toArray!==void 0)do a=r[n],a!==void 0&&(e.push(r.time),a.toArray(t,t.length)),r=s[i++];while(r!==void 0);else do a=r[n],a!==void 0&&(e.push(r.time),t.push(a)),r=s[i++];while(r!==void 0)}class Vs{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){const t=this.parameterPositions;let n=this._cachedIndex,i=t[n],r=t[n-1];e:{t:{let a;n:{i:if(!(e<i)){for(let o=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=t[++n],e<i)break t}a=t.length;break n}if(!(e>=r)){const o=t[1];e<o&&(n=2,r=o);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(i=r,r=t[--n-1],e>=r)break t}a=n,n=0;break n}break e}for(;n<a;){const o=n+a>>>1;e<t[o]?a=o:n=o+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let a=0;a!==i;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class Ud extends Vs{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Fi,endingEnd:Fi}}intervalChanged_(e,t,n){const i=this.parameterPositions;let r=e-2,a=e+1,o=i[r],c=i[a];if(o===void 0)switch(this.getSettings_().endingStart){case ki:r=e,o=2*t-n;break;case _r:r=i.length-2,o=t+i[r]-i[r+1];break;default:r=e,o=n}if(c===void 0)switch(this.getSettings_().endingEnd){case ki:a=e,c=2*n-t;break;case _r:a=1,c=n+i[1]-i[0];break;default:a=e-1,c=t}const l=(n-t)*.5,h=this.valueSize;this._weightPrev=l/(t-o),this._weightNext=l/(c-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,l=c-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,g=(n-t)/(i-t),A=g*g,m=A*g,p=-d*m+2*d*A-d*g,E=(1+d)*m+(-1.5-2*d)*A+(-.5+d)*g+1,w=(-1-f)*m+(1.5+f)*A+.5*g,v=f*m-f*A;for(let M=0;M!==o;++M)r[M]=p*a[h+M]+E*a[l+M]+w*a[c+M]+v*a[u+M];return r}}class Dc extends Vs{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=e*o,l=c-o,h=(n-t)/(i-t),u=1-h;for(let d=0;d!==o;++d)r[d]=a[l+d]*u+a[c+d]*h;return r}}class Od extends Vs{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}}class Tn{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=la(t,this.TimeBufferType),this.values=la(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){const t=e.constructor;let n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:la(e.times,Array),values:la(e.values,Array)};const i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Od(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Dc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Ud(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Ns:t=this.InterpolantFactoryMethodDiscrete;break;case Bs:t=this.InterpolantFactoryMethodLinear;break;case _a:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){const n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ns;case this.InterpolantFactoryMethodLinear:return Bs;case this.InterpolantFactoryMethodSmooth:return _a}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){const t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){const t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){const n=this.times,i=n.length;let r=0,a=i-1;for(;r!==i&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==i){r>=a&&(a=Math.max(a,1),r=a-1);const o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);const n=this.times,i=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){const c=n[o];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,c),e=!1;break}if(a!==null&&a>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,c,a),e=!1;break}a=c}if(i!==void 0&&Rp(i))for(let o=0,c=i.length;o!==c;++o){const l=i[o];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,l),e=!1;break}}return e}optimize(){const e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===_a,r=e.length-1;let a=1;for(let o=1;o<r;++o){let c=!1;const l=e[o],h=e[o+1];if(l!==h&&(o!==1||l!==e[0]))if(i)c=!0;else{const u=o*n,d=u-n,f=u+n;for(let g=0;g!==n;++g){const A=t[u+g];if(A!==t[d+g]||A!==t[f+g]){c=!0;break}}}if(c){if(o!==a){e[a]=e[o];const u=o*n,d=a*n;for(let f=0;f!==n;++f)t[d+f]=t[u+f]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,c=a*n,l=0;l!==n;++l)t[c+l]=t[o+l];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){const e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}}Tn.prototype.ValueTypeName="";Tn.prototype.TimeBufferType=Float32Array;Tn.prototype.ValueBufferType=Float32Array;Tn.prototype.DefaultInterpolation=Bs;class is extends Tn{constructor(e,t,n){super(e,t,n)}}is.prototype.ValueTypeName="bool";is.prototype.ValueBufferType=Array;is.prototype.DefaultInterpolation=Ns;is.prototype.InterpolantFactoryMethodLinear=void 0;is.prototype.InterpolantFactoryMethodSmooth=void 0;class Pc extends Tn{constructor(e,t,n,i){super(e,t,n,i)}}Pc.prototype.ValueTypeName="color";class Zi extends Tn{constructor(e,t,n,i){super(e,t,n,i)}}Zi.prototype.ValueTypeName="number";class Fd extends Vs{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=(n-t)/(i-t);let l=e*o;for(let h=l+o;l!==h;l+=4)on.slerpFlat(r,0,a,l-o,a,l,c);return r}}class Ji extends Tn{constructor(e,t,n,i){super(e,t,n,i)}InterpolantFactoryMethodLinear(e){return new Fd(this.times,this.values,this.getValueSize(),e)}}Ji.prototype.ValueTypeName="quaternion";Ji.prototype.InterpolantFactoryMethodSmooth=void 0;class ss extends Tn{constructor(e,t,n){super(e,t,n)}}ss.prototype.ValueTypeName="string";ss.prototype.ValueBufferType=Array;ss.prototype.DefaultInterpolation=Ns;ss.prototype.InterpolantFactoryMethodLinear=void 0;ss.prototype.InterpolantFactoryMethodSmooth=void 0;class $i extends Tn{constructor(e,t,n,i){super(e,t,n,i)}}$i.prototype.ValueTypeName="vector";class Ao{constructor(e="",t=-1,n=[],i=wo){this.name=e,this.tracks=n,this.duration=t,this.blendMode=i,this.uuid=On(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){const t=[],n=e.tracks,i=1/(e.fps||1);for(let a=0,o=n.length;a!==o;++a)t.push(Ip(n[a]).scale(i));const r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r.userData=JSON.parse(e.userData||"{}"),r}static toJSON(e){const t=[],n=e.tracks,i={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let r=0,a=n.length;r!==a;++r)t.push(Tn.toJSON(n[r]));return i}static CreateFromMorphTargetSequence(e,t,n,i){const r=t.length,a=[];for(let o=0;o<r;o++){let c=[],l=[];c.push((o+r-1)%r,o,(o+1)%r),l.push(0,1,0);const h=Dp(c);c=Ph(c,1,h),l=Ph(l,1,h),!i&&c[0]===0&&(c.push(r),l.push(l[0])),a.push(new Zi(".morphTargetInfluences["+t[o].name+"]",c,l).scale(1/n))}return new this(e,-1,a)}static findByName(e,t){let n=e;if(!Array.isArray(e)){const i=e;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===t)return n[i];return null}static CreateClipsFromMorphTargetSequences(e,t,n){const i={},r=/^([\w-]*?)([\d]+)$/;for(let o=0,c=e.length;o<c;o++){const l=e[o],h=l.name.match(r);if(h&&h.length>1){const u=h[1];let d=i[u];d||(i[u]=d=[]),d.push(l)}}const a=[];for(const o in i)a.push(this.CreateFromMorphTargetSequence(o,i[o],t,n));return a}static parseAnimation(e,t){if(console.warn("THREE.AnimationClip: parseAnimation() is deprecated and will be removed with r185"),!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;const n=function(u,d,f,g,A){if(f.length!==0){const m=[],p=[];Bd(f,m,p,g),m.length!==0&&A.push(new u(d,m,p))}},i=[],r=e.name||"default",a=e.fps||30,o=e.blendMode;let c=e.length||-1;const l=e.hierarchy||[];for(let u=0;u<l.length;u++){const d=l[u].keys;if(!(!d||d.length===0))if(d[0].morphTargets){const f={};let g;for(g=0;g<d.length;g++)if(d[g].morphTargets)for(let A=0;A<d[g].morphTargets.length;A++)f[d[g].morphTargets[A]]=-1;for(const A in f){const m=[],p=[];for(let E=0;E!==d[g].morphTargets.length;++E){const w=d[g];m.push(w.time),p.push(w.morphTarget===A?1:0)}i.push(new Zi(".morphTargetInfluence["+A+"]",m,p))}c=f.length*a}else{const f=".bones["+t[u].name+"]";n($i,f+".position",d,"pos",i),n(Ji,f+".quaternion",d,"rot",i),n($i,f+".scale",d,"scl",i)}}return i.length===0?null:new this(r,c,i,o)}resetDuration(){const e=this.tracks;let t=0;for(let n=0,i=e.length;n!==i;++n){const r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){const e=[];for(let n=0;n<this.tracks.length;n++)e.push(this.tracks[n].clone());const t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}}function Pp(s){switch(s.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Zi;case"vector":case"vector2":case"vector3":case"vector4":return $i;case"color":return Pc;case"quaternion":return Ji;case"bool":case"boolean":return is;case"string":return ss}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+s)}function Ip(s){if(s.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const e=Pp(s.type);if(s.times===void 0){const t=[],n=[];Bd(s.keys,t,n,"value"),s.times=t,s.values=n}return e.parse!==void 0?e.parse(s):new e(s.name,s.times,s.values,s.interpolation)}const Qn={enabled:!1,files:{},add:function(s,e){this.enabled!==!1&&(this.files[s]=e)},get:function(s){if(this.enabled!==!1)return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}};class kd{constructor(e,t,n){const i=this;let r=!1,a=0,o=0,c;const l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.abortController=new AbortController,this.itemStart=function(h){o++,r===!1&&i.onStart!==void 0&&i.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,i.onProgress!==void 0&&i.onProgress(h,a,o),a===o&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,u){return l.push(h,u),this},this.removeHandler=function(h){const u=l.indexOf(h);return u!==-1&&l.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=l.length;u<d;u+=2){const f=l[u],g=l[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}}const zd=new kd;class ui{constructor(e){this.manager=e!==void 0?e:zd,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){const n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}ui.DEFAULT_MATERIAL_NAME="__DEFAULT";const ei={};class Lp extends Error{constructor(e,t){super(e),this.response=t}}class Fs extends ui{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=Qn.get(`file:${e}`);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(ei[e]!==void 0){ei[e].push({onLoad:t,onProgress:n,onError:i});return}ei[e]=[],ei[e].push({onLoad:t,onProgress:n,onError:i});const a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,c=this.responseType;fetch(a).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;const h=ei[e],u=l.body.getReader(),d=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),f=d?parseInt(d):0,g=f!==0;let A=0;const m=new ReadableStream({start(p){E();function E(){u.read().then(({done:w,value:v})=>{if(w)p.close();else{A+=v.byteLength;const M=new ProgressEvent("progress",{lengthComputable:g,loaded:A,total:f});for(let y=0,T=h.length;y<T;y++){const C=h[y];C.onProgress&&C.onProgress(M)}p.enqueue(v),E()}},w=>{p.error(w)})}}});return new Response(m)}else throw new Lp(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return l.json();default:if(o==="")return l.text();{const u=/charset="?([^;"\s]*)"?/i.exec(o),d=u&&u[1]?u[1].toLowerCase():void 0,f=new TextDecoder(d);return l.arrayBuffer().then(g=>f.decode(g))}}}).then(l=>{Qn.add(`file:${e}`,l);const h=ei[e];delete ei[e];for(let u=0,d=h.length;u<d;u++){const f=h[u];f.onLoad&&f.onLoad(l)}}).catch(l=>{const h=ei[e];if(h===void 0)throw this.manager.itemError(e),l;delete ei[e];for(let u=0,d=h.length;u<d;u++){const f=h[u];f.onError&&f.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const _s=new WeakMap;class Hd extends ui{constructor(e){super(e)}load(e,t,n,i){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,a=Qn.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)r.manager.itemStart(e),setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0);else{let u=_s.get(a);u===void 0&&(u=[],_s.set(a,u)),u.push({onLoad:t,onError:i})}return a}const o=Sr("img");function c(){h(),t&&t(this);const u=_s.get(this)||[];for(let d=0;d<u.length;d++){const f=u[d];f.onLoad&&f.onLoad(this)}_s.delete(this),r.manager.itemEnd(e)}function l(u){h(),i&&i(u),Qn.remove(`image:${e}`);const d=_s.get(this)||[];for(let f=0;f<d.length;f++){const g=d[f];g.onError&&g.onError(u)}_s.delete(this),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){o.removeEventListener("load",c,!1),o.removeEventListener("error",l,!1)}return o.addEventListener("load",c,!1),o.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Qn.add(`image:${e}`,o),r.manager.itemStart(e),o.src=e,o}}class Vd extends ui{constructor(e){super(e)}load(e,t,n,i){const r=this,a=new ks,o=new Fs(this.manager);return o.setResponseType("arraybuffer"),o.setRequestHeader(this.requestHeader),o.setPath(this.path),o.setWithCredentials(r.withCredentials),o.load(e,function(c){let l;try{l=r.parse(c)}catch(h){if(i!==void 0)i(h);else{console.error(h);return}}l.image!==void 0?a.image=l.image:l.data!==void 0&&(a.image.width=l.width,a.image.height=l.height,a.image.data=l.data),a.wrapS=l.wrapS!==void 0?l.wrapS:Ln,a.wrapT=l.wrapT!==void 0?l.wrapT:Ln,a.magFilter=l.magFilter!==void 0?l.magFilter:Et,a.minFilter=l.minFilter!==void 0?l.minFilter:Et,a.anisotropy=l.anisotropy!==void 0?l.anisotropy:1,l.colorSpace!==void 0&&(a.colorSpace=l.colorSpace),l.flipY!==void 0&&(a.flipY=l.flipY),l.format!==void 0&&(a.format=l.format),l.type!==void 0&&(a.type=l.type),l.mipmaps!==void 0&&(a.mipmaps=l.mipmaps,a.minFilter=Nn),l.mipmapCount===1&&(a.minFilter=Et),l.generateMipmaps!==void 0&&(a.generateMipmaps=l.generateMipmaps),a.needsUpdate=!0,t&&t(a,l)},n,i),a}}class Gd extends ui{constructor(e){super(e)}load(e,t,n,i){const r=new wt,a=new Hd(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){r.image=o,r.needsUpdate=!0,t!==void 0&&t(r)},n,i),r}}class Br extends ft{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ce(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}}class Wd extends Br{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ft.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ce(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const fl=new Be,Ih=new I,Lh=new I;class Ic{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new we(512,512),this.mapType=bn,this.map=null,this.mapPass=null,this.matrix=new Be,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new No,this._frameExtents=new we(1,1),this._viewportCount=1,this._viewports=[new Ze(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;Ih.setFromMatrixPosition(e.matrixWorld),t.position.copy(Ih),Lh.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Lh),t.updateMatrixWorld(),fl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(fl,t.coordinateSystem,t.reversedDepth),t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(fl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class Np extends Ic{constructor(){super(new zt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){const t=this.camera,n=Us*2*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;(n!==t.fov||i!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=i,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class Lc extends Br{constructor(e,t,n=0,i=Math.PI/3,r=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(ft.DEFAULT_UP),this.updateMatrix(),this.target=new ft,this.distance=n,this.angle=i,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new Np}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}const Nh=new Be,Js=new I,pl=new I;class Bp extends Ic{constructor(){super(new zt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new we(4,2),this._viewportCount=6,this._viewports=[new Ze(2,1,1,1),new Ze(0,1,1,1),new Ze(3,1,1,1),new Ze(1,1,1,1),new Ze(3,0,1,1),new Ze(1,0,1,1)],this._cubeDirections=[new I(1,0,0),new I(-1,0,0),new I(0,0,1),new I(0,0,-1),new I(0,1,0),new I(0,-1,0)],this._cubeUps=[new I(0,1,0),new I(0,1,0),new I(0,1,0),new I(0,1,0),new I(0,0,1),new I(0,0,-1)]}updateMatrices(e,t=0){const n=this.camera,i=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Js.setFromMatrixPosition(e.matrixWorld),n.position.copy(Js),pl.copy(n.position),pl.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(pl),n.updateMatrixWorld(),i.makeTranslation(-Js.x,-Js.y,-Js.z),Nh.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Nh,n.coordinateSystem,n.reversedDepth)}}class Xd extends Br{constructor(e,t,n=0,i=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new Bp}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}}class Ur extends Mc{constructor(e=-1,t=1,n=1,i=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let r=n-e,a=n+e,o=i+t,c=i-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,a=r+l*this.view.width,o-=h*this.view.offsetY,c=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class Up extends Ic{constructor(){super(new Ur(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Nc extends Br{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ft.DEFAULT_UP),this.updateMatrix(),this.target=new ft,this.shadow=new Up}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class ws{static extractUrlBase(e){const t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}}const ml=new WeakMap;class Qd extends ui{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const r=this,a=Qn.get(`image-bitmap:${e}`);if(a!==void 0){if(r.manager.itemStart(e),a.then){a.then(l=>{if(ml.has(a)===!0)i&&i(ml.get(a)),r.manager.itemError(e),r.manager.itemEnd(e);else return t&&t(l),r.manager.itemEnd(e),l});return}return setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0),a}const o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader,o.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;const c=fetch(e,o).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(l){return Qn.add(`image-bitmap:${e}`,l),t&&t(l),r.manager.itemEnd(e),l}).catch(function(l){i&&i(l),ml.set(c,l),Qn.remove(`image-bitmap:${e}`),r.manager.itemError(e),r.manager.itemEnd(e)});Qn.add(`image-bitmap:${e}`,c),r.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}class Yd extends zt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class jd{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=performance.now();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}class qd{constructor(e,t,n){this.binding=e,this.valueSize=n;let i,r,a;switch(t){case"quaternion":i=this._slerp,r=this._slerpAdditive,a=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case"string":case"bool":i=this._select,r=this._select,a=this._setAdditiveIdentityOther,this.buffer=new Array(n*5);break;default:i=this._lerp,r=this._lerpAdditive,a=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=i,this._mixBufferRegionAdditive=r,this._setIdentity=a,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(e,t){const n=this.buffer,i=this.valueSize,r=e*i+i;let a=this.cumulativeWeight;if(a===0){for(let o=0;o!==i;++o)n[r+o]=n[o];a=t}else{a+=t;const o=t/a;this._mixBufferRegion(n,r,0,o,i)}this.cumulativeWeight=a}accumulateAdditive(e){const t=this.buffer,n=this.valueSize,i=n*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(t,i,0,e,n),this.cumulativeWeightAdditive+=e}apply(e){const t=this.valueSize,n=this.buffer,i=e*t+t,r=this.cumulativeWeight,a=this.cumulativeWeightAdditive,o=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,r<1){const c=t*this._origIndex;this._mixBufferRegion(n,i,c,1-r,t)}a>0&&this._mixBufferRegionAdditive(n,i,this._addIndex*t,1,t);for(let c=t,l=t+t;c!==l;++c)if(n[c]!==n[c+t]){o.setValue(n,i);break}}saveOriginalState(){const e=this.binding,t=this.buffer,n=this.valueSize,i=n*this._origIndex;e.getValue(t,i);for(let r=n,a=i;r!==a;++r)t[r]=t[i+r%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){const e=this.valueSize*3;this.binding.setValue(this.buffer,e)}_setAdditiveIdentityNumeric(){const e=this._addIndex*this.valueSize,t=e+this.valueSize;for(let n=e;n<t;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){const e=this._origIndex*this.valueSize,t=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[t+n]=this.buffer[e+n]}_select(e,t,n,i,r){if(i>=.5)for(let a=0;a!==r;++a)e[t+a]=e[n+a]}_slerp(e,t,n,i){on.slerpFlat(e,t,e,t,e,n,i)}_slerpAdditive(e,t,n,i,r){const a=this._workIndex*r;on.multiplyQuaternionsFlat(e,a,e,t,e,n),on.slerpFlat(e,t,e,t,e,a,i)}_lerp(e,t,n,i,r){const a=1-i;for(let o=0;o!==r;++o){const c=t+o;e[c]=e[c]*a+e[n+o]*i}}_lerpAdditive(e,t,n,i,r){for(let a=0;a!==r;++a){const o=t+a;e[o]=e[o]+e[n+a]*i}}}const Bc="\\[\\]\\.:\\/",Op=new RegExp("["+Bc+"]","g"),Uc="[^"+Bc+"]",Fp="[^"+Bc.replace("\\.","")+"]",kp=/((?:WC+[\/:])*)/.source.replace("WC",Uc),zp=/(WCOD+)?/.source.replace("WCOD",Fp),Hp=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Uc),Vp=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Uc),Gp=new RegExp("^"+kp+zp+Hp+Vp+"$"),Wp=["material","materials","bones","map"];class Xp{constructor(e,t,n){const i=n||$e.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();const n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){const n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(e,t)}bind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}}class $e{constructor(e,t,n){this.path=t,this.parsedPath=n||$e.parseTrackName(t),this.node=$e.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new $e.Composite(e,t,n):new $e(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Op,"")}static parseTrackName(e){const t=Gp.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);const n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){const r=n.nodeName.substring(i+1);Wp.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){const n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){const n=function(r){for(let a=0;a<r.length;a++){const o=r[a];if(o.name===t||o.uuid===t)return o;const c=n(o.children);if(c)return c}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){const n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node;const t=this.parsedPath,n=t.objectName,i=t.propertyName;let r=t.propertyIndex;if(e||(e=$e.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===l){l=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(l!==void 0){if(e[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}const a=e[i];if(a===void 0){const l=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+i+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(c=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}$e.Composite=Xp;$e.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};$e.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};$e.prototype.GetterByBindingType=[$e.prototype._getValue_direct,$e.prototype._getValue_array,$e.prototype._getValue_arrayElement,$e.prototype._getValue_toArray];$e.prototype.SetterByBindingTypeAndVersioning=[[$e.prototype._setValue_direct,$e.prototype._setValue_direct_setNeedsUpdate,$e.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[$e.prototype._setValue_array,$e.prototype._setValue_array_setNeedsUpdate,$e.prototype._setValue_array_setMatrixWorldNeedsUpdate],[$e.prototype._setValue_arrayElement,$e.prototype._setValue_arrayElement_setNeedsUpdate,$e.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[$e.prototype._setValue_fromArray,$e.prototype._setValue_fromArray_setNeedsUpdate,$e.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class Kd{constructor(e,t,n=null,i=t.blendMode){this._mixer=e,this._clip=t,this._localRoot=n,this.blendMode=i;const r=t.tracks,a=r.length,o=new Array(a),c={endingStart:Fi,endingEnd:Fi};for(let l=0;l!==a;++l){const h=r[l].createInterpolant(null);o[l]=h,h.settings=c}this._interpolantSettings=c,this._interpolants=o,this._propertyBindings=new Array(a),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._weightInterpolant=null,this.loop=rd,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(e){return this._startTime=e,this}setLoop(e,t){return this.loop=e,this.repetitions=t,this}setEffectiveWeight(e){return this.weight=e,this._effectiveWeight=this.enabled?e:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(e){return this._scheduleFading(e,0,1)}fadeOut(e){return this._scheduleFading(e,1,0)}crossFadeFrom(e,t,n=!1){if(e.fadeOut(t),this.fadeIn(t),n===!0){const i=this._clip.duration,r=e._clip.duration,a=r/i,o=i/r;e.warp(1,a,t),this.warp(o,1,t)}return this}crossFadeTo(e,t,n=!1){return e.crossFadeFrom(this,t,n)}stopFading(){const e=this._weightInterpolant;return e!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this}setEffectiveTimeScale(e){return this.timeScale=e,this._effectiveTimeScale=this.paused?0:e,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(e){return this.timeScale=this._clip.duration/e,this.stopWarping()}syncWith(e){return this.time=e.time,this.timeScale=e.timeScale,this.stopWarping()}halt(e){return this.warp(this._effectiveTimeScale,0,e)}warp(e,t,n){const i=this._mixer,r=i.time,a=this.timeScale;let o=this._timeScaleInterpolant;o===null&&(o=i._lendControlInterpolant(),this._timeScaleInterpolant=o);const c=o.parameterPositions,l=o.sampleValues;return c[0]=r,c[1]=r+n,l[0]=e/a,l[1]=t/a,this}stopWarping(){const e=this._timeScaleInterpolant;return e!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(e,t,n,i){if(!this.enabled){this._updateWeight(e);return}const r=this._startTime;if(r!==null){const c=(e-r)*n;c<0||n===0?t=0:(this._startTime=null,t=n*c)}t*=this._updateTimeScale(e);const a=this._updateTime(t),o=this._updateWeight(e);if(o>0){const c=this._interpolants,l=this._propertyBindings;switch(this.blendMode){case od:for(let h=0,u=c.length;h!==u;++h)c[h].evaluate(a),l[h].accumulateAdditive(o);break;case wo:default:for(let h=0,u=c.length;h!==u;++h)c[h].evaluate(a),l[h].accumulate(i,o)}}}_updateWeight(e){let t=0;if(this.enabled){t=this.weight;const n=this._weightInterpolant;if(n!==null){const i=n.evaluate(e)[0];t*=i,e>n.parameterPositions[1]&&(this.stopFading(),i===0&&(this.enabled=!1))}}return this._effectiveWeight=t,t}_updateTimeScale(e){let t=0;if(!this.paused){t=this.timeScale;const n=this._timeScaleInterpolant;if(n!==null){const i=n.evaluate(e)[0];t*=i,e>n.parameterPositions[1]&&(this.stopWarping(),t===0?this.paused=!0:this.timeScale=t)}}return this._effectiveTimeScale=t,t}_updateTime(e){const t=this._clip.duration,n=this.loop;let i=this.time+e,r=this._loopCount;const a=n===ad;if(e===0)return r===-1?i:a&&(r&1)===1?t-i:i;if(n===sd){r===-1&&(this._loopCount=0,this._setEndings(!0,!0,!1));e:{if(i>=t)i=t;else if(i<0)i=0;else{this.time=i;break e}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:e<0?-1:1})}}else{if(r===-1&&(e>=0?(r=0,this._setEndings(!0,this.repetitions===0,a)):this._setEndings(this.repetitions===0,!0,a)),i>=t||i<0){const o=Math.floor(i/t);i-=t*o,r+=Math.abs(o);const c=this.repetitions-r;if(c<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,i=e>0?t:0,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:e>0?1:-1});else{if(c===1){const l=e<0;this._setEndings(l,!l,a)}else this._setEndings(!1,!1,a);this._loopCount=r,this.time=i,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:o})}}else this.time=i;if(a&&(r&1)===1)return t-i}return i}_setEndings(e,t,n){const i=this._interpolantSettings;n?(i.endingStart=ki,i.endingEnd=ki):(e?i.endingStart=this.zeroSlopeAtStart?ki:Fi:i.endingStart=_r,t?i.endingEnd=this.zeroSlopeAtEnd?ki:Fi:i.endingEnd=_r)}_scheduleFading(e,t,n){const i=this._mixer,r=i.time;let a=this._weightInterpolant;a===null&&(a=i._lendControlInterpolant(),this._weightInterpolant=a);const o=a.parameterPositions,c=a.sampleValues;return o[0]=r,c[0]=t,o[1]=r+e,c[1]=n,this}}const Qp=new Float32Array(1);class Zd extends hi{constructor(e){super(),this._root=e,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1}_bindAction(e,t){const n=e._localRoot||this._root,i=e._clip.tracks,r=i.length,a=e._propertyBindings,o=e._interpolants,c=n.uuid,l=this._bindingsByRootAndName;let h=l[c];h===void 0&&(h={},l[c]=h);for(let u=0;u!==r;++u){const d=i[u],f=d.name;let g=h[f];if(g!==void 0)++g.referenceCount,a[u]=g;else{if(g=a[u],g!==void 0){g._cacheIndex===null&&(++g.referenceCount,this._addInactiveBinding(g,c,f));continue}const A=t&&t._propertyBindings[u].binding.parsedPath;g=new qd($e.create(n,f,A),d.ValueTypeName,d.getValueSize()),++g.referenceCount,this._addInactiveBinding(g,c,f),a[u]=g}o[u].resultBuffer=g.buffer}}_activateAction(e){if(!this._isActiveAction(e)){if(e._cacheIndex===null){const n=(e._localRoot||this._root).uuid,i=e._clip.uuid,r=this._actionsByClip[i];this._bindAction(e,r&&r.knownActions[0]),this._addInactiveAction(e,i,n)}const t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){const r=t[n];r.useCount++===0&&(this._lendBinding(r),r.saveOriginalState())}this._lendAction(e)}}_deactivateAction(e){if(this._isActiveAction(e)){const t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){const r=t[n];--r.useCount===0&&(r.restoreOriginalState(),this._takeBackBinding(r))}this._takeBackAction(e)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;const e=this;this.stats={actions:{get total(){return e._actions.length},get inUse(){return e._nActiveActions}},bindings:{get total(){return e._bindings.length},get inUse(){return e._nActiveBindings}},controlInterpolants:{get total(){return e._controlInterpolants.length},get inUse(){return e._nActiveControlInterpolants}}}}_isActiveAction(e){const t=e._cacheIndex;return t!==null&&t<this._nActiveActions}_addInactiveAction(e,t,n){const i=this._actions,r=this._actionsByClip;let a=r[t];if(a===void 0)a={knownActions:[e],actionByRoot:{}},e._byClipCacheIndex=0,r[t]=a;else{const o=a.knownActions;e._byClipCacheIndex=o.length,o.push(e)}e._cacheIndex=i.length,i.push(e),a.actionByRoot[n]=e}_removeInactiveAction(e){const t=this._actions,n=t[t.length-1],i=e._cacheIndex;n._cacheIndex=i,t[i]=n,t.pop(),e._cacheIndex=null;const r=e._clip.uuid,a=this._actionsByClip,o=a[r],c=o.knownActions,l=c[c.length-1],h=e._byClipCacheIndex;l._byClipCacheIndex=h,c[h]=l,c.pop(),e._byClipCacheIndex=null;const u=o.actionByRoot,d=(e._localRoot||this._root).uuid;delete u[d],c.length===0&&delete a[r],this._removeInactiveBindingsForAction(e)}_removeInactiveBindingsForAction(e){const t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){const r=t[n];--r.referenceCount===0&&this._removeInactiveBinding(r)}}_lendAction(e){const t=this._actions,n=e._cacheIndex,i=this._nActiveActions++,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_takeBackAction(e){const t=this._actions,n=e._cacheIndex,i=--this._nActiveActions,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_addInactiveBinding(e,t,n){const i=this._bindingsByRootAndName,r=this._bindings;let a=i[t];a===void 0&&(a={},i[t]=a),a[n]=e,e._cacheIndex=r.length,r.push(e)}_removeInactiveBinding(e){const t=this._bindings,n=e.binding,i=n.rootNode.uuid,r=n.path,a=this._bindingsByRootAndName,o=a[i],c=t[t.length-1],l=e._cacheIndex;c._cacheIndex=l,t[l]=c,t.pop(),delete o[r],Object.keys(o).length===0&&delete a[i]}_lendBinding(e){const t=this._bindings,n=e._cacheIndex,i=this._nActiveBindings++,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_takeBackBinding(e){const t=this._bindings,n=e._cacheIndex,i=--this._nActiveBindings,r=t[i];e._cacheIndex=i,t[i]=e,r._cacheIndex=n,t[n]=r}_lendControlInterpolant(){const e=this._controlInterpolants,t=this._nActiveControlInterpolants++;let n=e[t];return n===void 0&&(n=new Dc(new Float32Array(2),new Float32Array(2),1,Qp),n.__cacheIndex=t,e[t]=n),n}_takeBackControlInterpolant(e){const t=this._controlInterpolants,n=e.__cacheIndex,i=--this._nActiveControlInterpolants,r=t[i];e.__cacheIndex=i,t[i]=e,r.__cacheIndex=n,t[n]=r}clipAction(e,t,n){const i=t||this._root,r=i.uuid;let a=typeof e=="string"?Ao.findByName(i,e):e;const o=a!==null?a.uuid:e,c=this._actionsByClip[o];let l=null;if(n===void 0&&(a!==null?n=a.blendMode:n=wo),c!==void 0){const u=c.actionByRoot[r];if(u!==void 0&&u.blendMode===n)return u;l=c.knownActions[0],a===null&&(a=l._clip)}if(a===null)return null;const h=new Kd(this,a,t,n);return this._bindAction(h,l),this._addInactiveAction(h,o,r),h}existingAction(e,t){const n=t||this._root,i=n.uuid,r=typeof e=="string"?Ao.findByName(n,e):e,a=r?r.uuid:e,o=this._actionsByClip[a];return o!==void 0&&o.actionByRoot[i]||null}stopAllAction(){const e=this._actions,t=this._nActiveActions;for(let n=t-1;n>=0;--n)e[n].stop();return this}update(e){e*=this.timeScale;const t=this._actions,n=this._nActiveActions,i=this.time+=e,r=Math.sign(e),a=this._accuIndex^=1;for(let l=0;l!==n;++l)t[l]._update(i,e,r,a);const o=this._bindings,c=this._nActiveBindings;for(let l=0;l!==c;++l)o[l].apply(a);return this}setTime(e){this.time=0;for(let t=0;t<this._actions.length;t++)this._actions[t].time=0;return this.update(e)}getRoot(){return this._root}uncacheClip(e){const t=this._actions,n=e.uuid,i=this._actionsByClip,r=i[n];if(r!==void 0){const a=r.knownActions;for(let o=0,c=a.length;o!==c;++o){const l=a[o];this._deactivateAction(l);const h=l._cacheIndex,u=t[t.length-1];l._cacheIndex=null,l._byClipCacheIndex=null,u._cacheIndex=h,t[h]=u,t.pop(),this._removeInactiveBindingsForAction(l)}delete i[n]}}uncacheRoot(e){const t=e.uuid,n=this._actionsByClip;for(const a in n){const o=n[a].actionByRoot,c=o[t];c!==void 0&&(this._deactivateAction(c),this._removeInactiveAction(c))}const i=this._bindingsByRootAndName,r=i[t];if(r!==void 0)for(const a in r){const o=r[a];o.restoreOriginalState(),this._removeInactiveBinding(o)}}uncacheAction(e,t){const n=this.existingAction(e,t);n!==null&&(this._deactivateAction(n),this._removeInactiveAction(n))}}const Bh=new Be;class Oc{constructor(e,t,n=0,i=1/0){this.ray=new ts(e,t),this.near=n,this.far=i,this.camera=null,this.layers=new Do,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Bh.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Bh),this}intersectObject(e,t=!0,n=[]){return Wl(e,this,n,t),n.sort(Uh),n}intersectObjects(e,t=!0,n=[]){for(let i=0,r=e.length;i<r;i++)Wl(e[i],this,n,t);return n.sort(Uh),n}}function Uh(s,e){return s.distance-e.distance}function Wl(s,e,t,n){let i=!0;if(s.layers.test(e.layers)&&s.raycast(e,t)===!1&&(i=!1),i===!0&&n===!0){const r=s.children;for(let a=0,o=r.length;a<o;a++)Wl(r[a],e,t,!0)}}class br{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=We(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(We(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class Jd extends hi{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){if(e===void 0){console.warn("THREE.Controls: connect() now requires an element.");return}this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}}function Oh(s,e,t,n){const i=Yp(n);switch(t){case fc:return s*e;case So:return s*e/i.components*i.byteLength;case Eo:return s*e/i.components*i.byteLength;case mc:return s*e*2/i.components*i.byteLength;case bo:return s*e*2/i.components*i.byteLength;case pc:return s*e*3/i.components*i.byteLength;case an:return s*e*4/i.components*i.byteLength;case To:return s*e*4/i.components*i.byteLength;case or:case lr:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case cr:case hr:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Fa:case za:return Math.max(s,16)*Math.max(e,8)/4;case Oa:case ka:return Math.max(s,8)*Math.max(e,8)/2;case Ha:case Va:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*8;case Ga:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Wa:return Math.floor((s+3)/4)*Math.floor((e+3)/4)*16;case Xa:return Math.floor((s+4)/5)*Math.floor((e+3)/4)*16;case Qa:return Math.floor((s+4)/5)*Math.floor((e+4)/5)*16;case Ya:return Math.floor((s+5)/6)*Math.floor((e+4)/5)*16;case ja:return Math.floor((s+5)/6)*Math.floor((e+5)/6)*16;case qa:return Math.floor((s+7)/8)*Math.floor((e+4)/5)*16;case Ka:return Math.floor((s+7)/8)*Math.floor((e+5)/6)*16;case Za:return Math.floor((s+7)/8)*Math.floor((e+7)/8)*16;case Ja:return Math.floor((s+9)/10)*Math.floor((e+4)/5)*16;case $a:return Math.floor((s+9)/10)*Math.floor((e+5)/6)*16;case eo:return Math.floor((s+9)/10)*Math.floor((e+7)/8)*16;case to:return Math.floor((s+9)/10)*Math.floor((e+9)/10)*16;case no:return Math.floor((s+11)/12)*Math.floor((e+9)/10)*16;case io:return Math.floor((s+11)/12)*Math.floor((e+11)/12)*16;case so:case ro:case ao:return Math.ceil(s/4)*Math.ceil(e/4)*16;case oo:case lo:return Math.ceil(s/4)*Math.ceil(e/4)*8;case co:case ho:return Math.ceil(s/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Yp(s){switch(s){case bn:case cc:return{byteLength:1,components:1};case Is:case hc:case Ot:return{byteLength:2,components:1};case yo:case Mo:return{byteLength:2,components:4};case Ei:case _o:case Qt:return{byteLength:4,components:1};case uc:case dc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${s}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Pr}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Pr);/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function $d(){let s=null,e=!1,t=null,n=null;function i(r,a){t(r,a),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function jp(s){const e=new WeakMap;function t(o,c){const l=o.array,h=o.usage,u=l.byteLength,d=s.createBuffer();s.bindBuffer(c,d),s.bufferData(c,l,h),o.onUploadCallback();let f;if(l instanceof Float32Array)f=s.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)f=s.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?f=s.HALF_FLOAT:f=s.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=s.SHORT;else if(l instanceof Uint32Array)f=s.UNSIGNED_INT;else if(l instanceof Int32Array)f=s.INT;else if(l instanceof Int8Array)f=s.BYTE;else if(l instanceof Uint8Array)f=s.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,c,l){const h=c.array,u=c.updateRanges;if(s.bindBuffer(l,o),u.length===0)s.bufferSubData(l,0,h);else{u.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<u.length;f++){const g=u[d],A=u[f];A.start<=g.start+g.count+1?g.count=Math.max(g.count,A.start+A.count-g.start):(++d,u[d]=A)}u.length=d+1;for(let f=0,g=u.length;f<g;f++){const A=u[f];s.bufferSubData(l,A.start*h.BYTES_PER_ELEMENT,h,A.start,A.count)}c.clearUpdateRanges()}c.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=e.get(o);c&&(s.deleteBuffer(c.buffer),e.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=e.get(o);if(l===void 0)e.set(o,t(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:i,remove:r,update:a}}var qp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Kp=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Zp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Jp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,$p=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,em=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,tm=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,nm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,im=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,sm=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,rm=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,am=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,om=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,lm=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,cm=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,hm=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,um=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,dm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,fm=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,pm=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,mm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,gm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Am=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,vm=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,xm=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,_m=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,ym=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Mm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Sm=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Em=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,bm="gl_FragColor = linearToOutputTexel( gl_FragColor );",Tm=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,wm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Cm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Rm=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Dm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Pm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Im=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Lm=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Nm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Bm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Um=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Om=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Fm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,km=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,zm=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Hm=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Vm=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Gm=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Wm=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Xm=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Qm=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Ym=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,jm=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,qm=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Km=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Zm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Jm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,$m=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,eg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,tg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,ng=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,ig=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,sg=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,rg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,ag=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,og=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,lg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,cg=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,hg=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,ug=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,dg=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,fg=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,pg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,mg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,gg=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Ag=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,vg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,xg=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,_g=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,yg=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Mg=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Sg=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Eg=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,bg=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Tg=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,wg=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Cg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Rg=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Dg=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Pg=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Ig=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Lg=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Ng=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Bg=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Ug=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Og=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Fg=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,kg=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,zg=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Hg=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Vg=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Gg=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Wg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Xg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Qg=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Yg=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const jg=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,qg=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Kg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Zg=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Jg=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,$g=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,eA=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,tA=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,nA=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,iA=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,sA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,rA=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,aA=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,oA=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,lA=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,cA=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hA=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,uA=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,dA=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,fA=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pA=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,mA=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,gA=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,AA=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vA=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,xA=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_A=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,yA=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,MA=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,SA=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,EA=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,bA=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,TA=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,wA=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ge={alphahash_fragment:qp,alphahash_pars_fragment:Kp,alphamap_fragment:Zp,alphamap_pars_fragment:Jp,alphatest_fragment:$p,alphatest_pars_fragment:em,aomap_fragment:tm,aomap_pars_fragment:nm,batching_pars_vertex:im,batching_vertex:sm,begin_vertex:rm,beginnormal_vertex:am,bsdfs:om,iridescence_fragment:lm,bumpmap_pars_fragment:cm,clipping_planes_fragment:hm,clipping_planes_pars_fragment:um,clipping_planes_pars_vertex:dm,clipping_planes_vertex:fm,color_fragment:pm,color_pars_fragment:mm,color_pars_vertex:gm,color_vertex:Am,common:vm,cube_uv_reflection_fragment:xm,defaultnormal_vertex:_m,displacementmap_pars_vertex:ym,displacementmap_vertex:Mm,emissivemap_fragment:Sm,emissivemap_pars_fragment:Em,colorspace_fragment:bm,colorspace_pars_fragment:Tm,envmap_fragment:wm,envmap_common_pars_fragment:Cm,envmap_pars_fragment:Rm,envmap_pars_vertex:Dm,envmap_physical_pars_fragment:Hm,envmap_vertex:Pm,fog_vertex:Im,fog_pars_vertex:Lm,fog_fragment:Nm,fog_pars_fragment:Bm,gradientmap_pars_fragment:Um,lightmap_pars_fragment:Om,lights_lambert_fragment:Fm,lights_lambert_pars_fragment:km,lights_pars_begin:zm,lights_toon_fragment:Vm,lights_toon_pars_fragment:Gm,lights_phong_fragment:Wm,lights_phong_pars_fragment:Xm,lights_physical_fragment:Qm,lights_physical_pars_fragment:Ym,lights_fragment_begin:jm,lights_fragment_maps:qm,lights_fragment_end:Km,logdepthbuf_fragment:Zm,logdepthbuf_pars_fragment:Jm,logdepthbuf_pars_vertex:$m,logdepthbuf_vertex:eg,map_fragment:tg,map_pars_fragment:ng,map_particle_fragment:ig,map_particle_pars_fragment:sg,metalnessmap_fragment:rg,metalnessmap_pars_fragment:ag,morphinstance_vertex:og,morphcolor_vertex:lg,morphnormal_vertex:cg,morphtarget_pars_vertex:hg,morphtarget_vertex:ug,normal_fragment_begin:dg,normal_fragment_maps:fg,normal_pars_fragment:pg,normal_pars_vertex:mg,normal_vertex:gg,normalmap_pars_fragment:Ag,clearcoat_normal_fragment_begin:vg,clearcoat_normal_fragment_maps:xg,clearcoat_pars_fragment:_g,iridescence_pars_fragment:yg,opaque_fragment:Mg,packing:Sg,premultiplied_alpha_fragment:Eg,project_vertex:bg,dithering_fragment:Tg,dithering_pars_fragment:wg,roughnessmap_fragment:Cg,roughnessmap_pars_fragment:Rg,shadowmap_pars_fragment:Dg,shadowmap_pars_vertex:Pg,shadowmap_vertex:Ig,shadowmask_pars_fragment:Lg,skinbase_vertex:Ng,skinning_pars_vertex:Bg,skinning_vertex:Ug,skinnormal_vertex:Og,specularmap_fragment:Fg,specularmap_pars_fragment:kg,tonemapping_fragment:zg,tonemapping_pars_fragment:Hg,transmission_fragment:Vg,transmission_pars_fragment:Gg,uv_pars_fragment:Wg,uv_pars_vertex:Xg,uv_vertex:Qg,worldpos_vertex:Yg,background_vert:jg,background_frag:qg,backgroundCube_vert:Kg,backgroundCube_frag:Zg,cube_vert:Jg,cube_frag:$g,depth_vert:eA,depth_frag:tA,distanceRGBA_vert:nA,distanceRGBA_frag:iA,equirect_vert:sA,equirect_frag:rA,linedashed_vert:aA,linedashed_frag:oA,meshbasic_vert:lA,meshbasic_frag:cA,meshlambert_vert:hA,meshlambert_frag:uA,meshmatcap_vert:dA,meshmatcap_frag:fA,meshnormal_vert:pA,meshnormal_frag:mA,meshphong_vert:gA,meshphong_frag:AA,meshphysical_vert:vA,meshphysical_frag:xA,meshtoon_vert:_A,meshtoon_frag:yA,points_vert:MA,points_frag:SA,shadow_vert:EA,shadow_frag:bA,sprite_vert:TA,sprite_frag:wA},he={common:{diffuse:{value:new Ce(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ve},alphaMap:{value:null},alphaMapTransform:{value:new Ve},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ve}},envmap:{envMap:{value:null},envMapRotation:{value:new Ve},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ve}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ve}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ve},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ve},normalScale:{value:new we(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ve},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ve}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ve}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ve}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ce(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ce(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ve},alphaTest:{value:0},uvTransform:{value:new Ve}},sprite:{diffuse:{value:new Ce(16777215)},opacity:{value:1},center:{value:new we(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ve},alphaMap:{value:null},alphaMapTransform:{value:new Ve},alphaTest:{value:0}}},Dn={basic:{uniforms:Kt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.fog]),vertexShader:Ge.meshbasic_vert,fragmentShader:Ge.meshbasic_frag},lambert:{uniforms:Kt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Ce(0)}}]),vertexShader:Ge.meshlambert_vert,fragmentShader:Ge.meshlambert_frag},phong:{uniforms:Kt([he.common,he.specularmap,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.fog,he.lights,{emissive:{value:new Ce(0)},specular:{value:new Ce(1118481)},shininess:{value:30}}]),vertexShader:Ge.meshphong_vert,fragmentShader:Ge.meshphong_frag},standard:{uniforms:Kt([he.common,he.envmap,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.roughnessmap,he.metalnessmap,he.fog,he.lights,{emissive:{value:new Ce(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ge.meshphysical_vert,fragmentShader:Ge.meshphysical_frag},toon:{uniforms:Kt([he.common,he.aomap,he.lightmap,he.emissivemap,he.bumpmap,he.normalmap,he.displacementmap,he.gradientmap,he.fog,he.lights,{emissive:{value:new Ce(0)}}]),vertexShader:Ge.meshtoon_vert,fragmentShader:Ge.meshtoon_frag},matcap:{uniforms:Kt([he.common,he.bumpmap,he.normalmap,he.displacementmap,he.fog,{matcap:{value:null}}]),vertexShader:Ge.meshmatcap_vert,fragmentShader:Ge.meshmatcap_frag},points:{uniforms:Kt([he.points,he.fog]),vertexShader:Ge.points_vert,fragmentShader:Ge.points_frag},dashed:{uniforms:Kt([he.common,he.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ge.linedashed_vert,fragmentShader:Ge.linedashed_frag},depth:{uniforms:Kt([he.common,he.displacementmap]),vertexShader:Ge.depth_vert,fragmentShader:Ge.depth_frag},normal:{uniforms:Kt([he.common,he.bumpmap,he.normalmap,he.displacementmap,{opacity:{value:1}}]),vertexShader:Ge.meshnormal_vert,fragmentShader:Ge.meshnormal_frag},sprite:{uniforms:Kt([he.sprite,he.fog]),vertexShader:Ge.sprite_vert,fragmentShader:Ge.sprite_frag},background:{uniforms:{uvTransform:{value:new Ve},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ge.background_vert,fragmentShader:Ge.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ve}},vertexShader:Ge.backgroundCube_vert,fragmentShader:Ge.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ge.cube_vert,fragmentShader:Ge.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ge.equirect_vert,fragmentShader:Ge.equirect_frag},distanceRGBA:{uniforms:Kt([he.common,he.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ge.distanceRGBA_vert,fragmentShader:Ge.distanceRGBA_frag},shadow:{uniforms:Kt([he.lights,he.fog,{color:{value:new Ce(0)},opacity:{value:1}}]),vertexShader:Ge.shadow_vert,fragmentShader:Ge.shadow_frag}};Dn.physical={uniforms:Kt([Dn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ve},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ve},clearcoatNormalScale:{value:new we(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ve},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ve},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ve},sheen:{value:0},sheenColor:{value:new Ce(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ve},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ve},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ve},transmissionSamplerSize:{value:new we},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ve},attenuationDistance:{value:0},attenuationColor:{value:new Ce(0)},specularColor:{value:new Ce(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ve},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ve},anisotropyVector:{value:new we},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ve}}]),vertexShader:Ge.meshphysical_vert,fragmentShader:Ge.meshphysical_frag};const ca={r:0,b:0,g:0},Pi=new kn,CA=new Be;function RA(s,e,t,n,i,r,a){const o=new Ce(0);let c=r===!0?0:1,l,h,u=null,d=0,f=null;function g(w){let v=w.isScene===!0?w.background:null;return v&&v.isTexture&&(v=(w.backgroundBlurriness>0?t:e).get(v)),v}function A(w){let v=!1;const M=g(w);M===null?p(o,c):M&&M.isColor&&(p(M,1),v=!0);const y=s.xr.getEnvironmentBlendMode();y==="additive"?n.buffers.color.setClear(0,0,0,1,a):y==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(s.autoClear||v)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function m(w,v){const M=g(v);M&&(M.isCubeTexture||M.mapping===Ir)?(h===void 0&&(h=new Tt(new ns(1,1,1),new St({name:"BackgroundCubeMaterial",uniforms:Os(Dn.backgroundCube.uniforms),vertexShader:Dn.backgroundCube.vertexShader,fragmentShader:Dn.backgroundCube.fragmentShader,side:Yt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(y,T,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),Pi.copy(v.backgroundRotation),Pi.x*=-1,Pi.y*=-1,Pi.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(Pi.y*=-1,Pi.z*=-1),h.material.uniforms.envMap.value=M,h.material.uniforms.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(CA.makeRotationFromEuler(Pi)),h.material.toneMapped=qe.getTransfer(M.colorSpace)!==nt,(u!==M||d!==M.version||f!==s.toneMapping)&&(h.material.needsUpdate=!0,u=M,d=M.version,f=s.toneMapping),h.layers.enableAll(),w.unshift(h,h.geometry,h.material,0,0,null)):M&&M.isTexture&&(l===void 0&&(l=new Tt(new Hs(2,2),new St({name:"BackgroundMaterial",uniforms:Os(Dn.background.uniforms),vertexShader:Dn.background.vertexShader,fragmentShader:Dn.background.fragmentShader,side:Yn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=M,l.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,l.material.toneMapped=qe.getTransfer(M.colorSpace)!==nt,M.matrixAutoUpdate===!0&&M.updateMatrix(),l.material.uniforms.uvTransform.value.copy(M.matrix),(u!==M||d!==M.version||f!==s.toneMapping)&&(l.material.needsUpdate=!0,u=M,d=M.version,f=s.toneMapping),l.layers.enableAll(),w.unshift(l,l.geometry,l.material,0,0,null))}function p(w,v){w.getRGB(ca,bd(s)),n.buffers.color.setClear(ca.r,ca.g,ca.b,v,a)}function E(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return o},setClearColor:function(w,v=1){o.set(w),c=v,p(o,c)},getClearAlpha:function(){return c},setClearAlpha:function(w){c=w,p(o,c)},render:A,addToRenderList:m,dispose:E}}function DA(s,e){const t=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=d(null);let r=i,a=!1;function o(_,R,P,B,O){let F=!1;const U=u(B,P,R);r!==U&&(r=U,l(r.object)),F=f(_,B,P,O),F&&g(_,B,P,O),O!==null&&e.update(O,s.ELEMENT_ARRAY_BUFFER),(F||a)&&(a=!1,v(_,R,P,B),O!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,e.get(O).buffer))}function c(){return s.createVertexArray()}function l(_){return s.bindVertexArray(_)}function h(_){return s.deleteVertexArray(_)}function u(_,R,P){const B=P.wireframe===!0;let O=n[_.id];O===void 0&&(O={},n[_.id]=O);let F=O[R.id];F===void 0&&(F={},O[R.id]=F);let U=F[B];return U===void 0&&(U=d(c()),F[B]=U),U}function d(_){const R=[],P=[],B=[];for(let O=0;O<t;O++)R[O]=0,P[O]=0,B[O]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:R,enabledAttributes:P,attributeDivisors:B,object:_,attributes:{},index:null}}function f(_,R,P,B){const O=r.attributes,F=R.attributes;let U=0;const Y=P.getAttributes();for(const V in Y)if(Y[V].location>=0){const te=O[V];let ce=F[V];if(ce===void 0&&(V==="instanceMatrix"&&_.instanceMatrix&&(ce=_.instanceMatrix),V==="instanceColor"&&_.instanceColor&&(ce=_.instanceColor)),te===void 0||te.attribute!==ce||ce&&te.data!==ce.data)return!0;U++}return r.attributesNum!==U||r.index!==B}function g(_,R,P,B){const O={},F=R.attributes;let U=0;const Y=P.getAttributes();for(const V in Y)if(Y[V].location>=0){let te=F[V];te===void 0&&(V==="instanceMatrix"&&_.instanceMatrix&&(te=_.instanceMatrix),V==="instanceColor"&&_.instanceColor&&(te=_.instanceColor));const ce={};ce.attribute=te,te&&te.data&&(ce.data=te.data),O[V]=ce,U++}r.attributes=O,r.attributesNum=U,r.index=B}function A(){const _=r.newAttributes;for(let R=0,P=_.length;R<P;R++)_[R]=0}function m(_){p(_,0)}function p(_,R){const P=r.newAttributes,B=r.enabledAttributes,O=r.attributeDivisors;P[_]=1,B[_]===0&&(s.enableVertexAttribArray(_),B[_]=1),O[_]!==R&&(s.vertexAttribDivisor(_,R),O[_]=R)}function E(){const _=r.newAttributes,R=r.enabledAttributes;for(let P=0,B=R.length;P<B;P++)R[P]!==_[P]&&(s.disableVertexAttribArray(P),R[P]=0)}function w(_,R,P,B,O,F,U){U===!0?s.vertexAttribIPointer(_,R,P,O,F):s.vertexAttribPointer(_,R,P,B,O,F)}function v(_,R,P,B){A();const O=B.attributes,F=P.getAttributes(),U=R.defaultAttributeValues;for(const Y in F){const V=F[Y];if(V.location>=0){let Z=O[Y];if(Z===void 0&&(Y==="instanceMatrix"&&_.instanceMatrix&&(Z=_.instanceMatrix),Y==="instanceColor"&&_.instanceColor&&(Z=_.instanceColor)),Z!==void 0){const te=Z.normalized,ce=Z.itemSize,ge=e.get(Z);if(ge===void 0)continue;const ze=ge.buffer,Ke=ge.type,Xe=ge.bytesPerElement,j=Ke===s.INT||Ke===s.UNSIGNED_INT||Z.gpuType===_o;if(Z.isInterleavedBufferAttribute){const q=Z.data,le=q.stride,Te=Z.offset;if(q.isInstancedInterleavedBuffer){for(let fe=0;fe<V.locationSize;fe++)p(V.location+fe,q.meshPerAttribute);_.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=q.meshPerAttribute*q.count)}else for(let fe=0;fe<V.locationSize;fe++)m(V.location+fe);s.bindBuffer(s.ARRAY_BUFFER,ze);for(let fe=0;fe<V.locationSize;fe++)w(V.location+fe,ce/V.locationSize,Ke,te,le*Xe,(Te+ce/V.locationSize*fe)*Xe,j)}else{if(Z.isInstancedBufferAttribute){for(let q=0;q<V.locationSize;q++)p(V.location+q,Z.meshPerAttribute);_.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let q=0;q<V.locationSize;q++)m(V.location+q);s.bindBuffer(s.ARRAY_BUFFER,ze);for(let q=0;q<V.locationSize;q++)w(V.location+q,ce/V.locationSize,Ke,te,ce*Xe,ce/V.locationSize*q*Xe,j)}}else if(U!==void 0){const te=U[Y];if(te!==void 0)switch(te.length){case 2:s.vertexAttrib2fv(V.location,te);break;case 3:s.vertexAttrib3fv(V.location,te);break;case 4:s.vertexAttrib4fv(V.location,te);break;default:s.vertexAttrib1fv(V.location,te)}}}}E()}function M(){C();for(const _ in n){const R=n[_];for(const P in R){const B=R[P];for(const O in B)h(B[O].object),delete B[O];delete R[P]}delete n[_]}}function y(_){if(n[_.id]===void 0)return;const R=n[_.id];for(const P in R){const B=R[P];for(const O in B)h(B[O].object),delete B[O];delete R[P]}delete n[_.id]}function T(_){for(const R in n){const P=n[R];if(P[_.id]===void 0)continue;const B=P[_.id];for(const O in B)h(B[O].object),delete B[O];delete P[_.id]}}function C(){x(),a=!0,r!==i&&(r=i,l(r.object))}function x(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:C,resetDefaultState:x,dispose:M,releaseStatesOfGeometry:y,releaseStatesOfProgram:T,initAttributes:A,enableAttribute:m,disableUnusedAttributes:E}}function PA(s,e,t){let n;function i(l){n=l}function r(l,h){s.drawArrays(n,l,h),t.update(h,n,1)}function a(l,h,u){u!==0&&(s.drawArraysInstanced(n,l,h,u),t.update(h,n,u))}function o(l,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,h,0,u);let f=0;for(let g=0;g<u;g++)f+=h[g];t.update(f,n,1)}function c(l,h,u,d){if(u===0)return;const f=e.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<l.length;g++)a(l[g],h[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(n,l,0,h,0,d,0,u);let g=0;for(let A=0;A<u;A++)g+=h[A]*d[A];t.update(g,n,1)}}this.setMode=i,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=c}function IA(s,e,t,n){let i;function r(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){const T=e.get("EXT_texture_filter_anisotropic");i=s.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(T){return!(T!==an&&n.convert(T)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(T){const C=T===Ot&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(T!==bn&&n.convert(T)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==Qt&&!C)}function c(T){if(T==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp";const h=c(l);h!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);const u=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),f=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),g=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),A=s.getParameter(s.MAX_TEXTURE_SIZE),m=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),p=s.getParameter(s.MAX_VERTEX_ATTRIBS),E=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),w=s.getParameter(s.MAX_VARYING_VECTORS),v=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),M=g>0,y=s.getParameter(s.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:A,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:E,maxVaryings:w,maxFragmentUniforms:v,vertexTextures:M,maxSamples:y}}function LA(s){const e=this;let t=null,n=0,i=!1,r=!1;const a=new xn,o=new Ve,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){const f=u.length!==0||d||n!==0||i;return i=d,n=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,f){const g=u.clippingPlanes,A=u.clipIntersection,m=u.clipShadows,p=s.get(u);if(!i||g===null||g.length===0||r&&!m)r?h(null):l();else{const E=r?0:n,w=E*4;let v=p.clippingState||null;c.value=v,v=h(g,d,w,f);for(let M=0;M!==w;++M)v[M]=t[M];p.clippingState=v,this.numIntersection=A?this.numPlanes:0,this.numPlanes+=E}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,d,f,g){const A=u!==null?u.length:0;let m=null;if(A!==0){if(m=c.value,g!==!0||m===null){const p=f+A*4,E=d.matrixWorldInverse;o.getNormalMatrix(E),(m===null||m.length<p)&&(m=new Float32Array(p));for(let w=0,v=f;w!==A;++w,v+=4)a.copy(u[w]).applyMatrix4(E,o),a.normal.toArray(m,v),m[v+3]=a.constant}c.value=m,c.needsUpdate=!0}return e.numPlanes=A,e.numIntersection=0,m}}function NA(s){let e=new WeakMap;function t(a,o){return o===Ps?a.mapping=Yi:o===Ua&&(a.mapping=ji),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===Ps||o===Ua)if(e.has(a)){const c=e.get(a).texture;return t(c,a.mapping)}else{const c=a.image;if(c&&c.height>0){const l=new bc(c.height);return l.fromEquirectangularTexture(s,a),e.set(a,l),a.addEventListener("dispose",i),t(l.texture,a.mapping)}else return null}}return a}function i(a){const o=a.target;o.removeEventListener("dispose",i);const c=e.get(o);c!==void 0&&(e.delete(o),c.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}const Es=4,Fh=[.125,.215,.35,.446,.526,.582],Ui=20,gl=new Ur,kh=new Ce;let Al=null,vl=0,xl=0,_l=!1;const Bi=(1+Math.sqrt(5))/2,ys=1/Bi,zh=[new I(-Bi,ys,0),new I(Bi,ys,0),new I(-ys,0,Bi),new I(ys,0,Bi),new I(0,Bi,-ys),new I(0,Bi,ys),new I(-1,1,-1),new I(1,1,-1),new I(-1,1,1),new I(1,1,1)],BA=new I;class vo{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100,r={}){const{size:a=256,position:o=BA}=r;Al=this._renderer.getRenderTarget(),vl=this._renderer.getActiveCubeFace(),xl=this._renderer.getActiveMipmapLevel(),_l=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,n,i,c,o),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Gh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Vh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Al,vl,xl),this._renderer.xr.enabled=_l,e.scissorTest=!1,ha(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Yi||e.mapping===ji?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Al=this._renderer.getRenderTarget(),vl=this._renderer.getActiveCubeFace(),xl=this._renderer.getActiveMipmapLevel(),_l=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Et,minFilter:Et,generateMipmaps:!1,type:Ot,format:an,colorSpace:Ft,depthBuffer:!1},i=Hh(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Hh(e,t,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=UA(r)),this._blurMaterial=OA(r,e,t)}return i}_compileMaterial(e){const t=new Tt(this._lodPlanes[0],e);this._renderer.compile(t,gl)}_sceneToCubeUV(e,t,n,i,r){const c=new zt(90,1,t,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,f=u.toneMapping;u.getClearColor(kh),u.toneMapping=li,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(i),u.clearDepth(),u.setRenderTarget(null));const A=new Un({name:"PMREM.Background",side:Yt,depthWrite:!1,depthTest:!1}),m=new Tt(new ns,A);let p=!1;const E=e.background;E?E.isColor&&(A.color.copy(E),e.background=null,p=!0):(A.color.copy(kh),p=!0);for(let w=0;w<6;w++){const v=w%3;v===0?(c.up.set(0,l[w],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+h[w],r.y,r.z)):v===1?(c.up.set(0,0,l[w]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+h[w],r.z)):(c.up.set(0,l[w],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+h[w]));const M=this._cubeSize;ha(i,v*M,w>2?M:0,M,M),u.setRenderTarget(i),p&&u.render(m,c),u.render(e,c)}m.geometry.dispose(),m.material.dispose(),u.toneMapping=f,u.autoClear=d,e.background=E}_textureToCubeUV(e,t){const n=this._renderer,i=e.mapping===Yi||e.mapping===ji;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Gh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Vh());const r=i?this._cubemapMaterial:this._equirectMaterial,a=new Tt(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=e;const c=this._cubeSize;ha(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(a,gl)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const i=this._lodPlanes.length;for(let r=1;r<i;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=zh[(i-r-1)%zh.length];this._blur(e,r-1,r,a,o)}t.autoClear=n}_blur(e,t,n,i,r){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,i,"latitudinal",r),this._halfBlur(a,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,a,o){const c=this._renderer,l=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,u=new Tt(this._lodPlanes[i],l),d=l.uniforms,f=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*Ui-1),A=r/g,m=isFinite(r)?1+Math.floor(h*A):Ui;m>Ui&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Ui}`);const p=[];let E=0;for(let T=0;T<Ui;++T){const C=T/A,x=Math.exp(-C*C/2);p.push(x),T===0?E+=x:T<m&&(E+=2*x)}for(let T=0;T<p.length;T++)p[T]=p[T]/E;d.envMap.value=e.texture,d.samples.value=m,d.weights.value=p,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:w}=this;d.dTheta.value=g,d.mipInt.value=w-n;const v=this._sizeLods[i],M=3*v*(i>w-Es?i-w+Es:0),y=4*(this._cubeSize-v);ha(t,M,y,3*v,2*v),c.setRenderTarget(t),c.render(u,gl)}}function UA(s){const e=[],t=[],n=[];let i=s;const r=s-Es+1+Fh.length;for(let a=0;a<r;a++){const o=Math.pow(2,i);t.push(o);let c=1/o;a>s-Es?c=Fh[a-s+Es-1]:a===0&&(c=0),n.push(c);const l=1/(o-2),h=-l,u=1+l,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,g=6,A=3,m=2,p=1,E=new Float32Array(A*g*f),w=new Float32Array(m*g*f),v=new Float32Array(p*g*f);for(let y=0;y<f;y++){const T=y%3*2/3-1,C=y>2?0:-1,x=[T,C,0,T+2/3,C,0,T+2/3,C+1,0,T,C,0,T+2/3,C+1,0,T,C+1,0];E.set(x,A*g*y),w.set(d,m*g*y);const _=[y,y,y,y,y,y];v.set(_,p*g*y)}const M=new kt;M.setAttribute("position",new mt(E,A)),M.setAttribute("uv",new mt(w,m)),M.setAttribute("faceIndex",new mt(v,p)),e.push(M),i>Es&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Hh(s,e,t){const n=new en(s,e,t);return n.texture.mapping=Ir,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ha(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function OA(s,e,t){const n=new Float32Array(Ui),i=new I(0,1,0);return new St({name:"SphericalGaussianBlur",defines:{n:Ui,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Fc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Bt,depthTest:!1,depthWrite:!1})}function Vh(){return new St({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Fc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Bt,depthTest:!1,depthWrite:!1})}function Gh(){return new St({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Fc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Bt,depthTest:!1,depthWrite:!1})}function Fc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function FA(s){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){const c=o.mapping,l=c===Ps||c===Ua,h=c===Yi||c===ji;if(l||h){let u=e.get(o);const d=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return t===null&&(t=new vo(s)),u=l?t.fromEquirectangular(o,u):t.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),u.texture;if(u!==void 0)return u.texture;{const f=o.image;return l&&f&&f.height>0||h&&f&&i(f)?(t===null&&(t=new vo(s)),u=l?t.fromEquirectangular(o):t.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),o.addEventListener("dispose",r),u.texture):null}}}return o}function i(o){let c=0;const l=6;for(let h=0;h<l;h++)o[h]!==void 0&&c++;return c===l}function r(o){const c=o.target;c.removeEventListener("dispose",r);const l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function kA(s){const e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const i=t(n);return i===null&&Er("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function zA(s,e,t,n){const i={},r=new WeakMap;function a(u){const d=u.target;d.index!==null&&e.remove(d.index);for(const g in d.attributes)e.remove(d.attributes[g]);d.removeEventListener("dispose",a),delete i[d.id];const f=r.get(d);f&&(e.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(u,d){return i[d.id]===!0||(d.addEventListener("dispose",a),i[d.id]=!0,t.memory.geometries++),d}function c(u){const d=u.attributes;for(const f in d)e.update(d[f],s.ARRAY_BUFFER)}function l(u){const d=[],f=u.index,g=u.attributes.position;let A=0;if(f!==null){const E=f.array;A=f.version;for(let w=0,v=E.length;w<v;w+=3){const M=E[w+0],y=E[w+1],T=E[w+2];d.push(M,y,y,T,T,M)}}else if(g!==void 0){const E=g.array;A=g.version;for(let w=0,v=E.length/3-1;w<v;w+=3){const M=w+0,y=w+1,T=w+2;d.push(M,y,y,T,T,M)}}else return;const m=new(xd(d)?yc:_c)(d,1);m.version=A;const p=r.get(u);p&&e.remove(p),r.set(u,m)}function h(u){const d=r.get(u);if(d){const f=u.index;f!==null&&d.version<f.version&&l(u)}else l(u);return r.get(u)}return{get:o,update:c,getWireframeAttribute:h}}function HA(s,e,t){let n;function i(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function c(d,f){s.drawElements(n,f,r,d*a),t.update(f,n,1)}function l(d,f,g){g!==0&&(s.drawElementsInstanced(n,f,r,d*a,g),t.update(f,n,g))}function h(d,f,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,g);let m=0;for(let p=0;p<g;p++)m+=f[p];t.update(m,n,1)}function u(d,f,g,A){if(g===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<d.length;p++)l(d[p]/a,f[p],A[p]);else{m.multiDrawElementsInstancedWEBGL(n,f,0,r,d,0,A,0,g);let p=0;for(let E=0;E<g;E++)p+=f[E]*A[E];t.update(p,n,1)}}this.setMode=i,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function VA(s){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case s.TRIANGLES:t.triangles+=o*(r/3);break;case s.LINES:t.lines+=o*(r/2);break;case s.LINE_STRIP:t.lines+=o*(r-1);break;case s.LINE_LOOP:t.lines+=o*r;break;case s.POINTS:t.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function GA(s,e,t){const n=new WeakMap,i=new Ze;function r(a,o,c){const l=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0;let d=n.get(o);if(d===void 0||d.count!==u){let x=function(){T.dispose(),n.delete(o),o.removeEventListener("dispose",x)};d!==void 0&&d.texture.dispose();const f=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,A=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],E=o.morphAttributes.color||[];let w=0;f===!0&&(w=1),g===!0&&(w=2),A===!0&&(w=3);let v=o.attributes.position.count*w,M=1;v>e.maxTextureSize&&(M=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);const y=new Float32Array(v*M*4*u),T=new xc(y,v,M,u);T.type=Qt,T.needsUpdate=!0;const C=w*4;for(let _=0;_<u;_++){const R=m[_],P=p[_],B=E[_],O=v*M*4*_;for(let F=0;F<R.count;F++){const U=F*C;f===!0&&(i.fromBufferAttribute(R,F),y[O+U+0]=i.x,y[O+U+1]=i.y,y[O+U+2]=i.z,y[O+U+3]=0),g===!0&&(i.fromBufferAttribute(P,F),y[O+U+4]=i.x,y[O+U+5]=i.y,y[O+U+6]=i.z,y[O+U+7]=0),A===!0&&(i.fromBufferAttribute(B,F),y[O+U+8]=i.x,y[O+U+9]=i.y,y[O+U+10]=i.z,y[O+U+11]=B.itemSize===4?i.w:1)}}d={count:u,texture:T,size:new we(v,M)},n.set(o,d),o.addEventListener("dispose",x)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(s,"morphTexture",a.morphTexture,t);else{let f=0;for(let A=0;A<l.length;A++)f+=l[A];const g=o.morphTargetsRelative?1:1-f;c.getUniforms().setValue(s,"morphTargetBaseInfluence",g),c.getUniforms().setValue(s,"morphTargetInfluences",l)}c.getUniforms().setValue(s,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(s,"morphTargetsTextureSize",d.size)}return{update:r}}function WA(s,e,t,n){let i=new WeakMap;function r(c){const l=n.render.frame,h=c.geometry,u=e.get(c,h);if(i.get(u)!==l&&(e.update(u),i.set(u,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",o)===!1&&c.addEventListener("dispose",o),i.get(c)!==l&&(t.update(c.instanceMatrix,s.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,s.ARRAY_BUFFER),i.set(c,l))),c.isSkinnedMesh){const d=c.skeleton;i.get(d)!==l&&(d.update(),i.set(d,l))}return u}function a(){i=new WeakMap}function o(c){const l=c.target;l.removeEventListener("dispose",o),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:r,dispose:a}}const ef=new wt,Wh=new Bo(1,1),tf=new xc,nf=new Sd,sf=new Ec,Xh=[],Qh=[],Yh=new Float32Array(16),jh=new Float32Array(9),qh=new Float32Array(4);function Gs(s,e,t){const n=s[0];if(n<=0||n>0)return s;const i=e*t;let r=Xh[i];if(r===void 0&&(r=new Float32Array(i),Xh[i]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,s[a].toArray(r,o)}return r}function It(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function Lt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function Uo(s,e){let t=Qh[e];t===void 0&&(t=new Int32Array(e),Qh[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function XA(s,e){const t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function QA(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;s.uniform2fv(this.addr,e),Lt(t,e)}}function YA(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(It(t,e))return;s.uniform3fv(this.addr,e),Lt(t,e)}}function jA(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;s.uniform4fv(this.addr,e),Lt(t,e)}}function qA(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(It(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),Lt(t,e)}else{if(It(t,n))return;qh.set(n),s.uniformMatrix2fv(this.addr,!1,qh),Lt(t,n)}}function KA(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(It(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),Lt(t,e)}else{if(It(t,n))return;jh.set(n),s.uniformMatrix3fv(this.addr,!1,jh),Lt(t,n)}}function ZA(s,e){const t=this.cache,n=e.elements;if(n===void 0){if(It(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),Lt(t,e)}else{if(It(t,n))return;Yh.set(n),s.uniformMatrix4fv(this.addr,!1,Yh),Lt(t,n)}}function JA(s,e){const t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function $A(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;s.uniform2iv(this.addr,e),Lt(t,e)}}function e0(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(It(t,e))return;s.uniform3iv(this.addr,e),Lt(t,e)}}function t0(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;s.uniform4iv(this.addr,e),Lt(t,e)}}function n0(s,e){const t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function i0(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;s.uniform2uiv(this.addr,e),Lt(t,e)}}function s0(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(It(t,e))return;s.uniform3uiv(this.addr,e),Lt(t,e)}}function r0(s,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;s.uniform4uiv(this.addr,e),Lt(t,e)}}function a0(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?(Wh.compareFunction=Ac,r=Wh):r=ef,t.setTexture2D(e||r,i)}function o0(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||nf,i)}function l0(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||sf,i)}function c0(s,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||tf,i)}function h0(s){switch(s){case 5126:return XA;case 35664:return QA;case 35665:return YA;case 35666:return jA;case 35674:return qA;case 35675:return KA;case 35676:return ZA;case 5124:case 35670:return JA;case 35667:case 35671:return $A;case 35668:case 35672:return e0;case 35669:case 35673:return t0;case 5125:return n0;case 36294:return i0;case 36295:return s0;case 36296:return r0;case 35678:case 36198:case 36298:case 36306:case 35682:return a0;case 35679:case 36299:case 36307:return o0;case 35680:case 36300:case 36308:case 36293:return l0;case 36289:case 36303:case 36311:case 36292:return c0}}function u0(s,e){s.uniform1fv(this.addr,e)}function d0(s,e){const t=Gs(e,this.size,2);s.uniform2fv(this.addr,t)}function f0(s,e){const t=Gs(e,this.size,3);s.uniform3fv(this.addr,t)}function p0(s,e){const t=Gs(e,this.size,4);s.uniform4fv(this.addr,t)}function m0(s,e){const t=Gs(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function g0(s,e){const t=Gs(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function A0(s,e){const t=Gs(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function v0(s,e){s.uniform1iv(this.addr,e)}function x0(s,e){s.uniform2iv(this.addr,e)}function _0(s,e){s.uniform3iv(this.addr,e)}function y0(s,e){s.uniform4iv(this.addr,e)}function M0(s,e){s.uniform1uiv(this.addr,e)}function S0(s,e){s.uniform2uiv(this.addr,e)}function E0(s,e){s.uniform3uiv(this.addr,e)}function b0(s,e){s.uniform4uiv(this.addr,e)}function T0(s,e,t){const n=this.cache,i=e.length,r=Uo(t,i);It(n,r)||(s.uniform1iv(this.addr,r),Lt(n,r));for(let a=0;a!==i;++a)t.setTexture2D(e[a]||ef,r[a])}function w0(s,e,t){const n=this.cache,i=e.length,r=Uo(t,i);It(n,r)||(s.uniform1iv(this.addr,r),Lt(n,r));for(let a=0;a!==i;++a)t.setTexture3D(e[a]||nf,r[a])}function C0(s,e,t){const n=this.cache,i=e.length,r=Uo(t,i);It(n,r)||(s.uniform1iv(this.addr,r),Lt(n,r));for(let a=0;a!==i;++a)t.setTextureCube(e[a]||sf,r[a])}function R0(s,e,t){const n=this.cache,i=e.length,r=Uo(t,i);It(n,r)||(s.uniform1iv(this.addr,r),Lt(n,r));for(let a=0;a!==i;++a)t.setTexture2DArray(e[a]||tf,r[a])}function D0(s){switch(s){case 5126:return u0;case 35664:return d0;case 35665:return f0;case 35666:return p0;case 35674:return m0;case 35675:return g0;case 35676:return A0;case 5124:case 35670:return v0;case 35667:case 35671:return x0;case 35668:case 35672:return _0;case 35669:case 35673:return y0;case 5125:return M0;case 36294:return S0;case 36295:return E0;case 36296:return b0;case 35678:case 36198:case 36298:case 36306:case 35682:return T0;case 35679:case 36299:case 36307:return w0;case 35680:case 36300:case 36308:case 36293:return C0;case 36289:case 36303:case 36311:case 36292:return R0}}class P0{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=h0(t.type)}}class I0{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=D0(t.type)}}class L0{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const i=this.seq;for(let r=0,a=i.length;r!==a;++r){const o=i[r];o.setValue(e,t[o.id],n)}}}const yl=/(\w+)(\])?(\[|\.)?/g;function Kh(s,e){s.seq.push(e),s.map[e.id]=e}function N0(s,e,t){const n=s.name,i=n.length;for(yl.lastIndex=0;;){const r=yl.exec(n),a=yl.lastIndex;let o=r[1];const c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===i){Kh(t,l===void 0?new P0(o,s,e):new I0(o,s,e));break}else{let u=t.map[o];u===void 0&&(u=new L0(o),Kh(t,u)),t=u}}}class Ma{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){const r=e.getActiveUniform(t,i),a=e.getUniformLocation(t,r.name);N0(r,a,this)}}setValue(e,t,n,i){const r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){const i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,a=t.length;r!==a;++r){const o=t[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,i)}}static seqWithValue(e,t){const n=[];for(let i=0,r=e.length;i!==r;++i){const a=e[i];a.id in t&&n.push(a)}return n}}function Zh(s,e,t){const n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}const B0=37297;let U0=0;function O0(s,e){const t=s.split(`
`),n=[],i=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=i;a<r;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const Jh=new Ve;function F0(s){qe._getMatrix(Jh,qe.workingColorSpace,s);const e=`mat3( ${Jh.elements.map(t=>t.toFixed(4))} )`;switch(qe.getTransfer(s)){case yr:return[e,"LinearTransferOETF"];case nt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",s),[e,"LinearTransferOETF"]}}function $h(s,e,t){const n=s.getShaderParameter(e,s.COMPILE_STATUS),r=(s.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+O0(s.getShaderSource(e),o)}else return r}function k0(s,e){const t=F0(e);return[`vec4 ${s}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function z0(s,e){let t;switch(e){case Zu:t="Linear";break;case Ju:t="Reinhard";break;case $u:t="Cineon";break;case ac:t="ACESFilmic";break;case td:t="AgX";break;case nd:t="Neutral";break;case ed:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const ua=new I;function H0(){qe.getLuminanceCoefficients(ua);const s=ua.x.toFixed(4),e=ua.y.toFixed(4),t=ua.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function V0(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(nr).join(`
`)}function G0(s){const e=[];for(const t in s){const n=s[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function W0(s,e){const t={},n=s.getProgramParameter(e,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const r=s.getActiveAttrib(e,i),a=r.name;let o=1;r.type===s.FLOAT_MAT2&&(o=2),r.type===s.FLOAT_MAT3&&(o=3),r.type===s.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:s.getAttribLocation(e,a),locationSize:o}}return t}function nr(s){return s!==""}function eu(s,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function tu(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const X0=/^[ \t]*#include +<([\w\d./]+)>/gm;function Xl(s){return s.replace(X0,Y0)}const Q0=new Map;function Y0(s,e){let t=Ge[e];if(t===void 0){const n=Q0.get(e);if(n!==void 0)t=Ge[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return Xl(t)}const j0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function nu(s){return s.replace(j0,q0)}function q0(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function iu(s){let e=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function K0(s){let e="SHADOWMAP_TYPE_BASIC";return s.shadowMapType===nc?e="SHADOWMAP_TYPE_PCF":s.shadowMapType===ic?e="SHADOWMAP_TYPE_PCF_SOFT":s.shadowMapType===Gn&&(e="SHADOWMAP_TYPE_VSM"),e}function Z0(s){let e="ENVMAP_TYPE_CUBE";if(s.envMap)switch(s.envMapMode){case Yi:case ji:e="ENVMAP_TYPE_CUBE";break;case Ir:e="ENVMAP_TYPE_CUBE_UV";break}return e}function J0(s){let e="ENVMAP_MODE_REFLECTION";if(s.envMap)switch(s.envMapMode){case ji:e="ENVMAP_MODE_REFRACTION";break}return e}function $0(s){let e="ENVMAP_BLENDING_NONE";if(s.envMap)switch(s.combine){case rc:e="ENVMAP_BLENDING_MULTIPLY";break;case qu:e="ENVMAP_BLENDING_MIX";break;case Ku:e="ENVMAP_BLENDING_ADD";break}return e}function ev(s){const e=s.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function tv(s,e,t,n){const i=s.getContext(),r=t.defines;let a=t.vertexShader,o=t.fragmentShader;const c=K0(t),l=Z0(t),h=J0(t),u=$0(t),d=ev(t),f=V0(t),g=G0(r),A=i.createProgram();let m,p,E=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(nr).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(nr).join(`
`),p.length>0&&(p+=`
`)):(m=[iu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(nr).join(`
`),p=[iu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==li?"#define TONE_MAPPING":"",t.toneMapping!==li?Ge.tonemapping_pars_fragment:"",t.toneMapping!==li?z0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ge.colorspace_pars_fragment,k0("linearToOutputTexel",t.outputColorSpace),H0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(nr).join(`
`)),a=Xl(a),a=eu(a,t),a=tu(a,t),o=Xl(o),o=eu(o,t),o=tu(o,t),a=nu(a),o=nu(o),t.isRawShaderMaterial!==!0&&(E=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===Vl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Vl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const w=E+m+a,v=E+p+o,M=Zh(i,i.VERTEX_SHADER,w),y=Zh(i,i.FRAGMENT_SHADER,v);i.attachShader(A,M),i.attachShader(A,y),t.index0AttributeName!==void 0?i.bindAttribLocation(A,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(A,0,"position"),i.linkProgram(A);function T(R){if(s.debug.checkShaderErrors){const P=i.getProgramInfoLog(A)||"",B=i.getShaderInfoLog(M)||"",O=i.getShaderInfoLog(y)||"",F=P.trim(),U=B.trim(),Y=O.trim();let V=!0,Z=!0;if(i.getProgramParameter(A,i.LINK_STATUS)===!1)if(V=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,A,M,y);else{const te=$h(i,M,"vertex"),ce=$h(i,y,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(A,i.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+F+`
`+te+`
`+ce)}else F!==""?console.warn("THREE.WebGLProgram: Program Info Log:",F):(U===""||Y==="")&&(Z=!1);Z&&(R.diagnostics={runnable:V,programLog:F,vertexShader:{log:U,prefix:m},fragmentShader:{log:Y,prefix:p}})}i.deleteShader(M),i.deleteShader(y),C=new Ma(i,A),x=W0(i,A)}let C;this.getUniforms=function(){return C===void 0&&T(this),C};let x;this.getAttributes=function(){return x===void 0&&T(this),x};let _=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=i.getProgramParameter(A,B0)),_},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(A),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=U0++,this.cacheKey=e,this.usedTimes=1,this.program=A,this.vertexShader=M,this.fragmentShader=y,this}let nv=0;class iv{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(i)===!1&&(a.add(i),i.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new sv(e),t.set(e,n)),n}}class sv{constructor(e){this.id=nv++,this.code=e,this.usedTimes=0}}function rv(s,e,t,n,i,r,a){const o=new Do,c=new iv,l=new Set,h=[],u=i.logarithmicDepthBuffer,d=i.vertexTextures;let f=i.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function A(x){return l.add(x),x===0?"uv":`uv${x}`}function m(x,_,R,P,B){const O=P.fog,F=B.geometry,U=x.isMeshStandardMaterial?P.environment:null,Y=(x.isMeshStandardMaterial?t:e).get(x.envMap||U),V=Y&&Y.mapping===Ir?Y.image.height:null,Z=g[x.type];x.precision!==null&&(f=i.getMaxPrecision(x.precision),f!==x.precision&&console.warn("THREE.WebGLProgram.getParameters:",x.precision,"not supported, using",f,"instead."));const te=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,ce=te!==void 0?te.length:0;let ge=0;F.morphAttributes.position!==void 0&&(ge=1),F.morphAttributes.normal!==void 0&&(ge=2),F.morphAttributes.color!==void 0&&(ge=3);let ze,Ke,Xe,j;if(Z){const et=Dn[Z];ze=et.vertexShader,Ke=et.fragmentShader}else ze=x.vertexShader,Ke=x.fragmentShader,c.update(x),Xe=c.getVertexShaderID(x),j=c.getFragmentShaderID(x);const q=s.getRenderTarget(),le=s.state.buffers.depth.getReversed(),Te=B.isInstancedMesh===!0,fe=B.isBatchedMesh===!0,Qe=!!x.map,Ct=!!x.matcap,L=!!Y,st=!!x.aoMap,Fe=!!x.lightMap,De=!!x.bumpMap,Ae=!!x.normalMap,rt=!!x.displacementMap,ve=!!x.emissiveMap,ke=!!x.metalnessMap,xt=!!x.roughnessMap,ut=x.anisotropy>0,D=x.clearcoat>0,S=x.dispersion>0,H=x.iridescence>0,Q=x.sheen>0,$=x.transmission>0,X=ut&&!!x.anisotropyMap,_e=D&&!!x.clearcoatMap,re=D&&!!x.clearcoatNormalMap,me=D&&!!x.clearcoatRoughnessMap,Ee=H&&!!x.iridescenceMap,ie=H&&!!x.iridescenceThicknessMap,ue=Q&&!!x.sheenColorMap,Ie=Q&&!!x.sheenRoughnessMap,be=!!x.specularMap,oe=!!x.specularColorMap,Ue=!!x.specularIntensityMap,N=$&&!!x.transmissionMap,ee=$&&!!x.thicknessMap,ae=!!x.gradientMap,xe=!!x.alphaMap,ne=x.alphaTest>0,K=!!x.alphaHash,Me=!!x.extensions;let He=li;x.toneMapped&&(q===null||q.isXRRenderTarget===!0)&&(He=s.toneMapping);const ht={shaderID:Z,shaderType:x.type,shaderName:x.name,vertexShader:ze,fragmentShader:Ke,defines:x.defines,customVertexShaderID:Xe,customFragmentShaderID:j,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:f,batching:fe,batchingColor:fe&&B._colorsTexture!==null,instancing:Te,instancingColor:Te&&B.instanceColor!==null,instancingMorph:Te&&B.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:q===null?s.outputColorSpace:q.isXRRenderTarget===!0?q.texture.colorSpace:Ft,alphaToCoverage:!!x.alphaToCoverage,map:Qe,matcap:Ct,envMap:L,envMapMode:L&&Y.mapping,envMapCubeUVHeight:V,aoMap:st,lightMap:Fe,bumpMap:De,normalMap:Ae,displacementMap:d&&rt,emissiveMap:ve,normalMapObjectSpace:Ae&&x.normalMapType===ud,normalMapTangentSpace:Ae&&x.normalMapType===Co,metalnessMap:ke,roughnessMap:xt,anisotropy:ut,anisotropyMap:X,clearcoat:D,clearcoatMap:_e,clearcoatNormalMap:re,clearcoatRoughnessMap:me,dispersion:S,iridescence:H,iridescenceMap:Ee,iridescenceThicknessMap:ie,sheen:Q,sheenColorMap:ue,sheenRoughnessMap:Ie,specularMap:be,specularColorMap:oe,specularIntensityMap:Ue,transmission:$,transmissionMap:N,thicknessMap:ee,gradientMap:ae,opaque:x.transparent===!1&&x.blending===Gi&&x.alphaToCoverage===!1,alphaMap:xe,alphaTest:ne,alphaHash:K,combine:x.combine,mapUv:Qe&&A(x.map.channel),aoMapUv:st&&A(x.aoMap.channel),lightMapUv:Fe&&A(x.lightMap.channel),bumpMapUv:De&&A(x.bumpMap.channel),normalMapUv:Ae&&A(x.normalMap.channel),displacementMapUv:rt&&A(x.displacementMap.channel),emissiveMapUv:ve&&A(x.emissiveMap.channel),metalnessMapUv:ke&&A(x.metalnessMap.channel),roughnessMapUv:xt&&A(x.roughnessMap.channel),anisotropyMapUv:X&&A(x.anisotropyMap.channel),clearcoatMapUv:_e&&A(x.clearcoatMap.channel),clearcoatNormalMapUv:re&&A(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:me&&A(x.clearcoatRoughnessMap.channel),iridescenceMapUv:Ee&&A(x.iridescenceMap.channel),iridescenceThicknessMapUv:ie&&A(x.iridescenceThicknessMap.channel),sheenColorMapUv:ue&&A(x.sheenColorMap.channel),sheenRoughnessMapUv:Ie&&A(x.sheenRoughnessMap.channel),specularMapUv:be&&A(x.specularMap.channel),specularColorMapUv:oe&&A(x.specularColorMap.channel),specularIntensityMapUv:Ue&&A(x.specularIntensityMap.channel),transmissionMapUv:N&&A(x.transmissionMap.channel),thicknessMapUv:ee&&A(x.thicknessMap.channel),alphaMapUv:xe&&A(x.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(Ae||ut),vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:B.isPoints===!0&&!!F.attributes.uv&&(Qe||xe),fog:!!O,useFog:x.fog===!0,fogExp2:!!O&&O.isFogExp2,flatShading:x.flatShading===!0&&x.wireframe===!1,sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:le,skinning:B.isSkinnedMesh===!0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:ce,morphTextureStride:ge,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:x.dithering,shadowMapEnabled:s.shadowMap.enabled&&R.length>0,shadowMapType:s.shadowMap.type,toneMapping:He,decodeVideoTexture:Qe&&x.map.isVideoTexture===!0&&qe.getTransfer(x.map.colorSpace)===nt,decodeVideoTextureEmissive:ve&&x.emissiveMap.isVideoTexture===!0&&qe.getTransfer(x.emissiveMap.colorSpace)===nt,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===Zt,flipSided:x.side===Yt,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:Me&&x.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Me&&x.extensions.multiDraw===!0||fe)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return ht.vertexUv1s=l.has(1),ht.vertexUv2s=l.has(2),ht.vertexUv3s=l.has(3),l.clear(),ht}function p(x){const _=[];if(x.shaderID?_.push(x.shaderID):(_.push(x.customVertexShaderID),_.push(x.customFragmentShaderID)),x.defines!==void 0)for(const R in x.defines)_.push(R),_.push(x.defines[R]);return x.isRawShaderMaterial===!1&&(E(_,x),w(_,x),_.push(s.outputColorSpace)),_.push(x.customProgramCacheKey),_.join()}function E(x,_){x.push(_.precision),x.push(_.outputColorSpace),x.push(_.envMapMode),x.push(_.envMapCubeUVHeight),x.push(_.mapUv),x.push(_.alphaMapUv),x.push(_.lightMapUv),x.push(_.aoMapUv),x.push(_.bumpMapUv),x.push(_.normalMapUv),x.push(_.displacementMapUv),x.push(_.emissiveMapUv),x.push(_.metalnessMapUv),x.push(_.roughnessMapUv),x.push(_.anisotropyMapUv),x.push(_.clearcoatMapUv),x.push(_.clearcoatNormalMapUv),x.push(_.clearcoatRoughnessMapUv),x.push(_.iridescenceMapUv),x.push(_.iridescenceThicknessMapUv),x.push(_.sheenColorMapUv),x.push(_.sheenRoughnessMapUv),x.push(_.specularMapUv),x.push(_.specularColorMapUv),x.push(_.specularIntensityMapUv),x.push(_.transmissionMapUv),x.push(_.thicknessMapUv),x.push(_.combine),x.push(_.fogExp2),x.push(_.sizeAttenuation),x.push(_.morphTargetsCount),x.push(_.morphAttributeCount),x.push(_.numDirLights),x.push(_.numPointLights),x.push(_.numSpotLights),x.push(_.numSpotLightMaps),x.push(_.numHemiLights),x.push(_.numRectAreaLights),x.push(_.numDirLightShadows),x.push(_.numPointLightShadows),x.push(_.numSpotLightShadows),x.push(_.numSpotLightShadowsWithMaps),x.push(_.numLightProbes),x.push(_.shadowMapType),x.push(_.toneMapping),x.push(_.numClippingPlanes),x.push(_.numClipIntersection),x.push(_.depthPacking)}function w(x,_){o.disableAll(),_.supportsVertexTextures&&o.enable(0),_.instancing&&o.enable(1),_.instancingColor&&o.enable(2),_.instancingMorph&&o.enable(3),_.matcap&&o.enable(4),_.envMap&&o.enable(5),_.normalMapObjectSpace&&o.enable(6),_.normalMapTangentSpace&&o.enable(7),_.clearcoat&&o.enable(8),_.iridescence&&o.enable(9),_.alphaTest&&o.enable(10),_.vertexColors&&o.enable(11),_.vertexAlphas&&o.enable(12),_.vertexUv1s&&o.enable(13),_.vertexUv2s&&o.enable(14),_.vertexUv3s&&o.enable(15),_.vertexTangents&&o.enable(16),_.anisotropy&&o.enable(17),_.alphaHash&&o.enable(18),_.batching&&o.enable(19),_.dispersion&&o.enable(20),_.batchingColor&&o.enable(21),_.gradientMap&&o.enable(22),x.push(o.mask),o.disableAll(),_.fog&&o.enable(0),_.useFog&&o.enable(1),_.flatShading&&o.enable(2),_.logarithmicDepthBuffer&&o.enable(3),_.reversedDepthBuffer&&o.enable(4),_.skinning&&o.enable(5),_.morphTargets&&o.enable(6),_.morphNormals&&o.enable(7),_.morphColors&&o.enable(8),_.premultipliedAlpha&&o.enable(9),_.shadowMapEnabled&&o.enable(10),_.doubleSided&&o.enable(11),_.flipSided&&o.enable(12),_.useDepthPacking&&o.enable(13),_.dithering&&o.enable(14),_.transmission&&o.enable(15),_.sheen&&o.enable(16),_.opaque&&o.enable(17),_.pointsUvs&&o.enable(18),_.decodeVideoTexture&&o.enable(19),_.decodeVideoTextureEmissive&&o.enable(20),_.alphaToCoverage&&o.enable(21),x.push(o.mask)}function v(x){const _=g[x.type];let R;if(_){const P=Dn[_];R=Mn.clone(P.uniforms)}else R=x.uniforms;return R}function M(x,_){let R;for(let P=0,B=h.length;P<B;P++){const O=h[P];if(O.cacheKey===_){R=O,++R.usedTimes;break}}return R===void 0&&(R=new tv(s,_,x,r),h.push(R)),R}function y(x){if(--x.usedTimes===0){const _=h.indexOf(x);h[_]=h[h.length-1],h.pop(),x.destroy()}}function T(x){c.remove(x)}function C(){c.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:v,acquireProgram:M,releaseProgram:y,releaseShaderCache:T,programs:h,dispose:C}}function av(){let s=new WeakMap;function e(a){return s.has(a)}function t(a){let o=s.get(a);return o===void 0&&(o={},s.set(a,o)),o}function n(a){s.delete(a)}function i(a,o,c){s.get(a)[o]=c}function r(){s=new WeakMap}return{has:e,get:t,remove:n,update:i,dispose:r}}function ov(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function su(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function ru(){const s=[];let e=0;const t=[],n=[],i=[];function r(){e=0,t.length=0,n.length=0,i.length=0}function a(u,d,f,g,A,m){let p=s[e];return p===void 0?(p={id:u.id,object:u,geometry:d,material:f,groupOrder:g,renderOrder:u.renderOrder,z:A,group:m},s[e]=p):(p.id=u.id,p.object=u,p.geometry=d,p.material=f,p.groupOrder=g,p.renderOrder=u.renderOrder,p.z=A,p.group=m),e++,p}function o(u,d,f,g,A,m){const p=a(u,d,f,g,A,m);f.transmission>0?n.push(p):f.transparent===!0?i.push(p):t.push(p)}function c(u,d,f,g,A,m){const p=a(u,d,f,g,A,m);f.transmission>0?n.unshift(p):f.transparent===!0?i.unshift(p):t.unshift(p)}function l(u,d){t.length>1&&t.sort(u||ov),n.length>1&&n.sort(d||su),i.length>1&&i.sort(d||su)}function h(){for(let u=e,d=s.length;u<d;u++){const f=s[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:n,transparent:i,init:r,push:o,unshift:c,finish:h,sort:l}}function lv(){let s=new WeakMap;function e(n,i){const r=s.get(n);let a;return r===void 0?(a=new ru,s.set(n,[a])):i>=r.length?(a=new ru,r.push(a)):a=r[i],a}function t(){s=new WeakMap}return{get:e,dispose:t}}function cv(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new I,color:new Ce};break;case"SpotLight":t={position:new I,direction:new I,color:new Ce,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new I,color:new Ce,distance:0,decay:0};break;case"HemisphereLight":t={direction:new I,skyColor:new Ce,groundColor:new Ce};break;case"RectAreaLight":t={color:new Ce,position:new I,halfWidth:new I,halfHeight:new I};break}return s[e.id]=t,t}}}function hv(){const s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new we};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new we};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new we,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[e.id]=t,t}}}let uv=0;function dv(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function fv(s){const e=new cv,t=hv(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new I);const i=new I,r=new Be,a=new Be;function o(l){let h=0,u=0,d=0;for(let x=0;x<9;x++)n.probe[x].set(0,0,0);let f=0,g=0,A=0,m=0,p=0,E=0,w=0,v=0,M=0,y=0,T=0;l.sort(dv);for(let x=0,_=l.length;x<_;x++){const R=l[x],P=R.color,B=R.intensity,O=R.distance,F=R.shadow&&R.shadow.map?R.shadow.map.texture:null;if(R.isAmbientLight)h+=P.r*B,u+=P.g*B,d+=P.b*B;else if(R.isLightProbe){for(let U=0;U<9;U++)n.probe[U].addScaledVector(R.sh.coefficients[U],B);T++}else if(R.isDirectionalLight){const U=e.get(R);if(U.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){const Y=R.shadow,V=t.get(R);V.shadowIntensity=Y.intensity,V.shadowBias=Y.bias,V.shadowNormalBias=Y.normalBias,V.shadowRadius=Y.radius,V.shadowMapSize=Y.mapSize,n.directionalShadow[f]=V,n.directionalShadowMap[f]=F,n.directionalShadowMatrix[f]=R.shadow.matrix,E++}n.directional[f]=U,f++}else if(R.isSpotLight){const U=e.get(R);U.position.setFromMatrixPosition(R.matrixWorld),U.color.copy(P).multiplyScalar(B),U.distance=O,U.coneCos=Math.cos(R.angle),U.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),U.decay=R.decay,n.spot[A]=U;const Y=R.shadow;if(R.map&&(n.spotLightMap[M]=R.map,M++,Y.updateMatrices(R),R.castShadow&&y++),n.spotLightMatrix[A]=Y.matrix,R.castShadow){const V=t.get(R);V.shadowIntensity=Y.intensity,V.shadowBias=Y.bias,V.shadowNormalBias=Y.normalBias,V.shadowRadius=Y.radius,V.shadowMapSize=Y.mapSize,n.spotShadow[A]=V,n.spotShadowMap[A]=F,v++}A++}else if(R.isRectAreaLight){const U=e.get(R);U.color.copy(P).multiplyScalar(B),U.halfWidth.set(R.width*.5,0,0),U.halfHeight.set(0,R.height*.5,0),n.rectArea[m]=U,m++}else if(R.isPointLight){const U=e.get(R);if(U.color.copy(R.color).multiplyScalar(R.intensity),U.distance=R.distance,U.decay=R.decay,R.castShadow){const Y=R.shadow,V=t.get(R);V.shadowIntensity=Y.intensity,V.shadowBias=Y.bias,V.shadowNormalBias=Y.normalBias,V.shadowRadius=Y.radius,V.shadowMapSize=Y.mapSize,V.shadowCameraNear=Y.camera.near,V.shadowCameraFar=Y.camera.far,n.pointShadow[g]=V,n.pointShadowMap[g]=F,n.pointShadowMatrix[g]=R.shadow.matrix,w++}n.point[g]=U,g++}else if(R.isHemisphereLight){const U=e.get(R);U.skyColor.copy(R.color).multiplyScalar(B),U.groundColor.copy(R.groundColor).multiplyScalar(B),n.hemi[p]=U,p++}}m>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=he.LTC_FLOAT_1,n.rectAreaLTC2=he.LTC_FLOAT_2):(n.rectAreaLTC1=he.LTC_HALF_1,n.rectAreaLTC2=he.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;const C=n.hash;(C.directionalLength!==f||C.pointLength!==g||C.spotLength!==A||C.rectAreaLength!==m||C.hemiLength!==p||C.numDirectionalShadows!==E||C.numPointShadows!==w||C.numSpotShadows!==v||C.numSpotMaps!==M||C.numLightProbes!==T)&&(n.directional.length=f,n.spot.length=A,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=E,n.directionalShadowMap.length=E,n.pointShadow.length=w,n.pointShadowMap.length=w,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=E,n.pointShadowMatrix.length=w,n.spotLightMatrix.length=v+M-y,n.spotLightMap.length=M,n.numSpotLightShadowsWithMaps=y,n.numLightProbes=T,C.directionalLength=f,C.pointLength=g,C.spotLength=A,C.rectAreaLength=m,C.hemiLength=p,C.numDirectionalShadows=E,C.numPointShadows=w,C.numSpotShadows=v,C.numSpotMaps=M,C.numLightProbes=T,n.version=uv++)}function c(l,h){let u=0,d=0,f=0,g=0,A=0;const m=h.matrixWorldInverse;for(let p=0,E=l.length;p<E;p++){const w=l[p];if(w.isDirectionalLight){const v=n.directional[u];v.direction.setFromMatrixPosition(w.matrixWorld),i.setFromMatrixPosition(w.target.matrixWorld),v.direction.sub(i),v.direction.transformDirection(m),u++}else if(w.isSpotLight){const v=n.spot[f];v.position.setFromMatrixPosition(w.matrixWorld),v.position.applyMatrix4(m),v.direction.setFromMatrixPosition(w.matrixWorld),i.setFromMatrixPosition(w.target.matrixWorld),v.direction.sub(i),v.direction.transformDirection(m),f++}else if(w.isRectAreaLight){const v=n.rectArea[g];v.position.setFromMatrixPosition(w.matrixWorld),v.position.applyMatrix4(m),a.identity(),r.copy(w.matrixWorld),r.premultiply(m),a.extractRotation(r),v.halfWidth.set(w.width*.5,0,0),v.halfHeight.set(0,w.height*.5,0),v.halfWidth.applyMatrix4(a),v.halfHeight.applyMatrix4(a),g++}else if(w.isPointLight){const v=n.point[d];v.position.setFromMatrixPosition(w.matrixWorld),v.position.applyMatrix4(m),d++}else if(w.isHemisphereLight){const v=n.hemi[A];v.direction.setFromMatrixPosition(w.matrixWorld),v.direction.transformDirection(m),A++}}}return{setup:o,setupView:c,state:n}}function au(s){const e=new fv(s),t=[],n=[];function i(h){l.camera=h,t.length=0,n.length=0}function r(h){t.push(h)}function a(h){n.push(h)}function o(){e.setup(t)}function c(h){e.setupView(t,h)}const l={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:i,state:l,setupLights:o,setupLightsView:c,pushLight:r,pushShadow:a}}function pv(s){let e=new WeakMap;function t(i,r=0){const a=e.get(i);let o;return a===void 0?(o=new au(s),e.set(i,[o])):r>=a.length?(o=new au(s),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const mv=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,gv=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Av(s,e,t){let n=new No;const i=new we,r=new we,a=new Ze,o=new Id({depthPacking:hd}),c=new Ld,l={},h=t.maxTextureSize,u={[Yn]:Yt,[Yt]:Yn,[Zt]:Zt},d=new St({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new we},radius:{value:4}},vertexShader:mv,fragmentShader:gv}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const g=new kt;g.setAttribute("position",new mt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const A=new Tt(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=nc;let p=this.type;this.render=function(y,T,C){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||y.length===0)return;const x=s.getRenderTarget(),_=s.getActiveCubeFace(),R=s.getActiveMipmapLevel(),P=s.state;P.setBlending(Bt),P.buffers.depth.getReversed()===!0?P.buffers.color.setClear(0,0,0,0):P.buffers.color.setClear(1,1,1,1),P.buffers.depth.setTest(!0),P.setScissorTest(!1);const B=p!==Gn&&this.type===Gn,O=p===Gn&&this.type!==Gn;for(let F=0,U=y.length;F<U;F++){const Y=y[F],V=Y.shadow;if(V===void 0){console.warn("THREE.WebGLShadowMap:",Y,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;i.copy(V.mapSize);const Z=V.getFrameExtents();if(i.multiply(Z),r.copy(V.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/Z.x),i.x=r.x*Z.x,V.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/Z.y),i.y=r.y*Z.y,V.mapSize.y=r.y)),V.map===null||B===!0||O===!0){const ce=this.type!==Gn?{minFilter:Dt,magFilter:Dt}:{};V.map!==null&&V.map.dispose(),V.map=new en(i.x,i.y,ce),V.map.texture.name=Y.name+".shadowMap",V.camera.updateProjectionMatrix()}s.setRenderTarget(V.map),s.clear();const te=V.getViewportCount();for(let ce=0;ce<te;ce++){const ge=V.getViewport(ce);a.set(r.x*ge.x,r.y*ge.y,r.x*ge.z,r.y*ge.w),P.viewport(a),V.updateMatrices(Y,ce),n=V.getFrustum(),v(T,C,V.camera,Y,this.type)}V.isPointLightShadow!==!0&&this.type===Gn&&E(V,C),V.needsUpdate=!1}p=this.type,m.needsUpdate=!1,s.setRenderTarget(x,_,R)};function E(y,T){const C=e.update(A);d.defines.VSM_SAMPLES!==y.blurSamples&&(d.defines.VSM_SAMPLES=y.blurSamples,f.defines.VSM_SAMPLES=y.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),y.mapPass===null&&(y.mapPass=new en(i.x,i.y)),d.uniforms.shadow_pass.value=y.map.texture,d.uniforms.resolution.value=y.mapSize,d.uniforms.radius.value=y.radius,s.setRenderTarget(y.mapPass),s.clear(),s.renderBufferDirect(T,null,C,d,A,null),f.uniforms.shadow_pass.value=y.mapPass.texture,f.uniforms.resolution.value=y.mapSize,f.uniforms.radius.value=y.radius,s.setRenderTarget(y.map),s.clear(),s.renderBufferDirect(T,null,C,f,A,null)}function w(y,T,C,x){let _=null;const R=C.isPointLight===!0?y.customDistanceMaterial:y.customDepthMaterial;if(R!==void 0)_=R;else if(_=C.isPointLight===!0?c:o,s.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0||T.alphaToCoverage===!0){const P=_.uuid,B=T.uuid;let O=l[P];O===void 0&&(O={},l[P]=O);let F=O[B];F===void 0&&(F=_.clone(),O[B]=F,T.addEventListener("dispose",M)),_=F}if(_.visible=T.visible,_.wireframe=T.wireframe,x===Gn?_.side=T.shadowSide!==null?T.shadowSide:T.side:_.side=T.shadowSide!==null?T.shadowSide:u[T.side],_.alphaMap=T.alphaMap,_.alphaTest=T.alphaToCoverage===!0?.5:T.alphaTest,_.map=T.map,_.clipShadows=T.clipShadows,_.clippingPlanes=T.clippingPlanes,_.clipIntersection=T.clipIntersection,_.displacementMap=T.displacementMap,_.displacementScale=T.displacementScale,_.displacementBias=T.displacementBias,_.wireframeLinewidth=T.wireframeLinewidth,_.linewidth=T.linewidth,C.isPointLight===!0&&_.isMeshDistanceMaterial===!0){const P=s.properties.get(_);P.light=C}return _}function v(y,T,C,x,_){if(y.visible===!1)return;if(y.layers.test(T.layers)&&(y.isMesh||y.isLine||y.isPoints)&&(y.castShadow||y.receiveShadow&&_===Gn)&&(!y.frustumCulled||n.intersectsObject(y))){y.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,y.matrixWorld);const B=e.update(y),O=y.material;if(Array.isArray(O)){const F=B.groups;for(let U=0,Y=F.length;U<Y;U++){const V=F[U],Z=O[V.materialIndex];if(Z&&Z.visible){const te=w(y,Z,x,_);y.onBeforeShadow(s,y,T,C,B,te,V),s.renderBufferDirect(C,null,B,te,y,V),y.onAfterShadow(s,y,T,C,B,te,V)}}}else if(O.visible){const F=w(y,O,x,_);y.onBeforeShadow(s,y,T,C,B,F,null),s.renderBufferDirect(C,null,B,F,y,null),y.onAfterShadow(s,y,T,C,B,F,null)}}const P=y.children;for(let B=0,O=P.length;B<O;B++)v(P[B],T,C,x,_)}function M(y){y.target.removeEventListener("dispose",M);for(const C in l){const x=l[C],_=y.target.uuid;_ in x&&(x[_].dispose(),delete x[_])}}}const vv={[Da]:Pa,[Ia]:Na,[vr]:Ba,[Qi]:La,[Pa]:Da,[Na]:Ia,[Ba]:vr,[La]:Qi};function xv(s,e){function t(){let N=!1;const ee=new Ze;let ae=null;const xe=new Ze(0,0,0,0);return{setMask:function(ne){ae!==ne&&!N&&(s.colorMask(ne,ne,ne,ne),ae=ne)},setLocked:function(ne){N=ne},setClear:function(ne,K,Me,He,ht){ht===!0&&(ne*=He,K*=He,Me*=He),ee.set(ne,K,Me,He),xe.equals(ee)===!1&&(s.clearColor(ne,K,Me,He),xe.copy(ee))},reset:function(){N=!1,ae=null,xe.set(-1,0,0,0)}}}function n(){let N=!1,ee=!1,ae=null,xe=null,ne=null;return{setReversed:function(K){if(ee!==K){const Me=e.get("EXT_clip_control");K?Me.clipControlEXT(Me.LOWER_LEFT_EXT,Me.ZERO_TO_ONE_EXT):Me.clipControlEXT(Me.LOWER_LEFT_EXT,Me.NEGATIVE_ONE_TO_ONE_EXT),ee=K;const He=ne;ne=null,this.setClear(He)}},getReversed:function(){return ee},setTest:function(K){K?q(s.DEPTH_TEST):le(s.DEPTH_TEST)},setMask:function(K){ae!==K&&!N&&(s.depthMask(K),ae=K)},setFunc:function(K){if(ee&&(K=vv[K]),xe!==K){switch(K){case Da:s.depthFunc(s.NEVER);break;case Pa:s.depthFunc(s.ALWAYS);break;case Ia:s.depthFunc(s.LESS);break;case Qi:s.depthFunc(s.LEQUAL);break;case vr:s.depthFunc(s.EQUAL);break;case La:s.depthFunc(s.GEQUAL);break;case Na:s.depthFunc(s.GREATER);break;case Ba:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}xe=K}},setLocked:function(K){N=K},setClear:function(K){ne!==K&&(ee&&(K=1-K),s.clearDepth(K),ne=K)},reset:function(){N=!1,ae=null,xe=null,ne=null,ee=!1}}}function i(){let N=!1,ee=null,ae=null,xe=null,ne=null,K=null,Me=null,He=null,ht=null;return{setTest:function(et){N||(et?q(s.STENCIL_TEST):le(s.STENCIL_TEST))},setMask:function(et){ee!==et&&!N&&(s.stencilMask(et),ee=et)},setFunc:function(et,jn,Vn){(ae!==et||xe!==jn||ne!==Vn)&&(s.stencilFunc(et,jn,Vn),ae=et,xe=jn,ne=Vn)},setOp:function(et,jn,Vn){(K!==et||Me!==jn||He!==Vn)&&(s.stencilOp(et,jn,Vn),K=et,Me=jn,He=Vn)},setLocked:function(et){N=et},setClear:function(et){ht!==et&&(s.clearStencil(et),ht=et)},reset:function(){N=!1,ee=null,ae=null,xe=null,ne=null,K=null,Me=null,He=null,ht=null}}}const r=new t,a=new n,o=new i,c=new WeakMap,l=new WeakMap;let h={},u={},d=new WeakMap,f=[],g=null,A=!1,m=null,p=null,E=null,w=null,v=null,M=null,y=null,T=new Ce(0,0,0),C=0,x=!1,_=null,R=null,P=null,B=null,O=null;const F=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let U=!1,Y=0;const V=s.getParameter(s.VERSION);V.indexOf("WebGL")!==-1?(Y=parseFloat(/^WebGL (\d)/.exec(V)[1]),U=Y>=1):V.indexOf("OpenGL ES")!==-1&&(Y=parseFloat(/^OpenGL ES (\d)/.exec(V)[1]),U=Y>=2);let Z=null,te={};const ce=s.getParameter(s.SCISSOR_BOX),ge=s.getParameter(s.VIEWPORT),ze=new Ze().fromArray(ce),Ke=new Ze().fromArray(ge);function Xe(N,ee,ae,xe){const ne=new Uint8Array(4),K=s.createTexture();s.bindTexture(N,K),s.texParameteri(N,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(N,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Me=0;Me<ae;Me++)N===s.TEXTURE_3D||N===s.TEXTURE_2D_ARRAY?s.texImage3D(ee,0,s.RGBA,1,1,xe,0,s.RGBA,s.UNSIGNED_BYTE,ne):s.texImage2D(ee+Me,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,ne);return K}const j={};j[s.TEXTURE_2D]=Xe(s.TEXTURE_2D,s.TEXTURE_2D,1),j[s.TEXTURE_CUBE_MAP]=Xe(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),j[s.TEXTURE_2D_ARRAY]=Xe(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),j[s.TEXTURE_3D]=Xe(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),q(s.DEPTH_TEST),a.setFunc(Qi),De(!1),Ae(Ul),q(s.CULL_FACE),st(Bt);function q(N){h[N]!==!0&&(s.enable(N),h[N]=!0)}function le(N){h[N]!==!1&&(s.disable(N),h[N]=!1)}function Te(N,ee){return u[N]!==ee?(s.bindFramebuffer(N,ee),u[N]=ee,N===s.DRAW_FRAMEBUFFER&&(u[s.FRAMEBUFFER]=ee),N===s.FRAMEBUFFER&&(u[s.DRAW_FRAMEBUFFER]=ee),!0):!1}function fe(N,ee){let ae=f,xe=!1;if(N){ae=d.get(ee),ae===void 0&&(ae=[],d.set(ee,ae));const ne=N.textures;if(ae.length!==ne.length||ae[0]!==s.COLOR_ATTACHMENT0){for(let K=0,Me=ne.length;K<Me;K++)ae[K]=s.COLOR_ATTACHMENT0+K;ae.length=ne.length,xe=!0}}else ae[0]!==s.BACK&&(ae[0]=s.BACK,xe=!0);xe&&s.drawBuffers(ae)}function Qe(N){return g!==N?(s.useProgram(N),g=N,!0):!1}const Ct={[_n]:s.FUNC_ADD,[Bu]:s.FUNC_SUBTRACT,[Uu]:s.FUNC_REVERSE_SUBTRACT};Ct[Ou]=s.MIN,Ct[Fu]=s.MAX;const L={[Ms]:s.ZERO,[ku]:s.ONE,[zu]:s.SRC_COLOR,[Ta]:s.SRC_ALPHA,[Wu]:s.SRC_ALPHA_SATURATE,[Ra]:s.DST_COLOR,[Ca]:s.DST_ALPHA,[Hu]:s.ONE_MINUS_SRC_COLOR,[wa]:s.ONE_MINUS_SRC_ALPHA,[Gu]:s.ONE_MINUS_DST_COLOR,[Vu]:s.ONE_MINUS_DST_ALPHA,[Xu]:s.CONSTANT_COLOR,[Qu]:s.ONE_MINUS_CONSTANT_COLOR,[Yu]:s.CONSTANT_ALPHA,[ju]:s.ONE_MINUS_CONSTANT_ALPHA};function st(N,ee,ae,xe,ne,K,Me,He,ht,et){if(N===Bt){A===!0&&(le(s.BLEND),A=!1);return}if(A===!1&&(q(s.BLEND),A=!0),N!==sc){if(N!==m||et!==x){if((p!==_n||v!==_n)&&(s.blendEquation(s.FUNC_ADD),p=_n,v=_n),et)switch(N){case Gi:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Ol:s.blendFunc(s.ONE,s.ONE);break;case Fl:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case kl:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}else switch(N){case Gi:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Ol:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case Fl:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case kl:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}E=null,w=null,M=null,y=null,T.set(0,0,0),C=0,m=N,x=et}return}ne=ne||ee,K=K||ae,Me=Me||xe,(ee!==p||ne!==v)&&(s.blendEquationSeparate(Ct[ee],Ct[ne]),p=ee,v=ne),(ae!==E||xe!==w||K!==M||Me!==y)&&(s.blendFuncSeparate(L[ae],L[xe],L[K],L[Me]),E=ae,w=xe,M=K,y=Me),(He.equals(T)===!1||ht!==C)&&(s.blendColor(He.r,He.g,He.b,ht),T.copy(He),C=ht),m=N,x=!1}function Fe(N,ee){N.side===Zt?le(s.CULL_FACE):q(s.CULL_FACE);let ae=N.side===Yt;ee&&(ae=!ae),De(ae),N.blending===Gi&&N.transparent===!1?st(Bt):st(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),a.setFunc(N.depthFunc),a.setTest(N.depthTest),a.setMask(N.depthWrite),r.setMask(N.colorWrite);const xe=N.stencilWrite;o.setTest(xe),xe&&(o.setMask(N.stencilWriteMask),o.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),o.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),ve(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?q(s.SAMPLE_ALPHA_TO_COVERAGE):le(s.SAMPLE_ALPHA_TO_COVERAGE)}function De(N){_!==N&&(N?s.frontFace(s.CW):s.frontFace(s.CCW),_=N)}function Ae(N){N!==Lu?(q(s.CULL_FACE),N!==R&&(N===Ul?s.cullFace(s.BACK):N===Nu?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):le(s.CULL_FACE),R=N}function rt(N){N!==P&&(U&&s.lineWidth(N),P=N)}function ve(N,ee,ae){N?(q(s.POLYGON_OFFSET_FILL),(B!==ee||O!==ae)&&(s.polygonOffset(ee,ae),B=ee,O=ae)):le(s.POLYGON_OFFSET_FILL)}function ke(N){N?q(s.SCISSOR_TEST):le(s.SCISSOR_TEST)}function xt(N){N===void 0&&(N=s.TEXTURE0+F-1),Z!==N&&(s.activeTexture(N),Z=N)}function ut(N,ee,ae){ae===void 0&&(Z===null?ae=s.TEXTURE0+F-1:ae=Z);let xe=te[ae];xe===void 0&&(xe={type:void 0,texture:void 0},te[ae]=xe),(xe.type!==N||xe.texture!==ee)&&(Z!==ae&&(s.activeTexture(ae),Z=ae),s.bindTexture(N,ee||j[N]),xe.type=N,xe.texture=ee)}function D(){const N=te[Z];N!==void 0&&N.type!==void 0&&(s.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function S(){try{s.compressedTexImage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function H(){try{s.compressedTexImage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Q(){try{s.texSubImage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function $(){try{s.texSubImage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function X(){try{s.compressedTexSubImage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function _e(){try{s.compressedTexSubImage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function re(){try{s.texStorage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function me(){try{s.texStorage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Ee(){try{s.texImage2D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function ie(){try{s.texImage3D(...arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function ue(N){ze.equals(N)===!1&&(s.scissor(N.x,N.y,N.z,N.w),ze.copy(N))}function Ie(N){Ke.equals(N)===!1&&(s.viewport(N.x,N.y,N.z,N.w),Ke.copy(N))}function be(N,ee){let ae=l.get(ee);ae===void 0&&(ae=new WeakMap,l.set(ee,ae));let xe=ae.get(N);xe===void 0&&(xe=s.getUniformBlockIndex(ee,N.name),ae.set(N,xe))}function oe(N,ee){const xe=l.get(ee).get(N);c.get(ee)!==xe&&(s.uniformBlockBinding(ee,xe,N.__bindingPointIndex),c.set(ee,xe))}function Ue(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),a.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),h={},Z=null,te={},u={},d=new WeakMap,f=[],g=null,A=!1,m=null,p=null,E=null,w=null,v=null,M=null,y=null,T=new Ce(0,0,0),C=0,x=!1,_=null,R=null,P=null,B=null,O=null,ze.set(0,0,s.canvas.width,s.canvas.height),Ke.set(0,0,s.canvas.width,s.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:q,disable:le,bindFramebuffer:Te,drawBuffers:fe,useProgram:Qe,setBlending:st,setMaterial:Fe,setFlipSided:De,setCullFace:Ae,setLineWidth:rt,setPolygonOffset:ve,setScissorTest:ke,activeTexture:xt,bindTexture:ut,unbindTexture:D,compressedTexImage2D:S,compressedTexImage3D:H,texImage2D:Ee,texImage3D:ie,updateUBOMapping:be,uniformBlockBinding:oe,texStorage2D:re,texStorage3D:me,texSubImage2D:Q,texSubImage3D:$,compressedTexSubImage2D:X,compressedTexSubImage3D:_e,scissor:ue,viewport:Ie,reset:Ue}}function _v(s,e,t,n,i,r,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new we,h=new WeakMap;let u;const d=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(D,S){return f?new OffscreenCanvas(D,S):Sr("canvas")}function A(D,S,H){let Q=1;const $=ut(D);if(($.width>H||$.height>H)&&(Q=H/Math.max($.width,$.height)),Q<1)if(typeof HTMLImageElement<"u"&&D instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&D instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&D instanceof ImageBitmap||typeof VideoFrame<"u"&&D instanceof VideoFrame){const X=Math.floor(Q*$.width),_e=Math.floor(Q*$.height);u===void 0&&(u=g(X,_e));const re=S?g(X,_e):u;return re.width=X,re.height=_e,re.getContext("2d").drawImage(D,0,0,X,_e),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+$.width+"x"+$.height+") to ("+X+"x"+_e+")."),re}else return"data"in D&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+$.width+"x"+$.height+")."),D;return D}function m(D){return D.generateMipmaps}function p(D){s.generateMipmap(D)}function E(D){return D.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:D.isWebGL3DRenderTarget?s.TEXTURE_3D:D.isWebGLArrayRenderTarget||D.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function w(D,S,H,Q,$=!1){if(D!==null){if(s[D]!==void 0)return s[D];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+D+"'")}let X=S;if(S===s.RED&&(H===s.FLOAT&&(X=s.R32F),H===s.HALF_FLOAT&&(X=s.R16F),H===s.UNSIGNED_BYTE&&(X=s.R8)),S===s.RED_INTEGER&&(H===s.UNSIGNED_BYTE&&(X=s.R8UI),H===s.UNSIGNED_SHORT&&(X=s.R16UI),H===s.UNSIGNED_INT&&(X=s.R32UI),H===s.BYTE&&(X=s.R8I),H===s.SHORT&&(X=s.R16I),H===s.INT&&(X=s.R32I)),S===s.RG&&(H===s.FLOAT&&(X=s.RG32F),H===s.HALF_FLOAT&&(X=s.RG16F),H===s.UNSIGNED_BYTE&&(X=s.RG8)),S===s.RG_INTEGER&&(H===s.UNSIGNED_BYTE&&(X=s.RG8UI),H===s.UNSIGNED_SHORT&&(X=s.RG16UI),H===s.UNSIGNED_INT&&(X=s.RG32UI),H===s.BYTE&&(X=s.RG8I),H===s.SHORT&&(X=s.RG16I),H===s.INT&&(X=s.RG32I)),S===s.RGB_INTEGER&&(H===s.UNSIGNED_BYTE&&(X=s.RGB8UI),H===s.UNSIGNED_SHORT&&(X=s.RGB16UI),H===s.UNSIGNED_INT&&(X=s.RGB32UI),H===s.BYTE&&(X=s.RGB8I),H===s.SHORT&&(X=s.RGB16I),H===s.INT&&(X=s.RGB32I)),S===s.RGBA_INTEGER&&(H===s.UNSIGNED_BYTE&&(X=s.RGBA8UI),H===s.UNSIGNED_SHORT&&(X=s.RGBA16UI),H===s.UNSIGNED_INT&&(X=s.RGBA32UI),H===s.BYTE&&(X=s.RGBA8I),H===s.SHORT&&(X=s.RGBA16I),H===s.INT&&(X=s.RGBA32I)),S===s.RGB&&(H===s.UNSIGNED_INT_5_9_9_9_REV&&(X=s.RGB9_E5),H===s.UNSIGNED_INT_10F_11F_11F_REV&&(X=s.R11F_G11F_B10F)),S===s.RGBA){const _e=$?yr:qe.getTransfer(Q);H===s.FLOAT&&(X=s.RGBA32F),H===s.HALF_FLOAT&&(X=s.RGBA16F),H===s.UNSIGNED_BYTE&&(X=_e===nt?s.SRGB8_ALPHA8:s.RGBA8),H===s.UNSIGNED_SHORT_4_4_4_4&&(X=s.RGBA4),H===s.UNSIGNED_SHORT_5_5_5_1&&(X=s.RGB5_A1)}return(X===s.R16F||X===s.R32F||X===s.RG16F||X===s.RG32F||X===s.RGBA16F||X===s.RGBA32F)&&e.get("EXT_color_buffer_float"),X}function v(D,S){let H;return D?S===null||S===Ei||S===qi?H=s.DEPTH24_STENCIL8:S===Qt?H=s.DEPTH32F_STENCIL8:S===Is&&(H=s.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===Ei||S===qi?H=s.DEPTH_COMPONENT24:S===Qt?H=s.DEPTH_COMPONENT32F:S===Is&&(H=s.DEPTH_COMPONENT16),H}function M(D,S){return m(D)===!0||D.isFramebufferTexture&&D.minFilter!==Dt&&D.minFilter!==Et?Math.log2(Math.max(S.width,S.height))+1:D.mipmaps!==void 0&&D.mipmaps.length>0?D.mipmaps.length:D.isCompressedTexture&&Array.isArray(D.image)?S.mipmaps.length:1}function y(D){const S=D.target;S.removeEventListener("dispose",y),C(S),S.isVideoTexture&&h.delete(S)}function T(D){const S=D.target;S.removeEventListener("dispose",T),_(S)}function C(D){const S=n.get(D);if(S.__webglInit===void 0)return;const H=D.source,Q=d.get(H);if(Q){const $=Q[S.__cacheKey];$.usedTimes--,$.usedTimes===0&&x(D),Object.keys(Q).length===0&&d.delete(H)}n.remove(D)}function x(D){const S=n.get(D);s.deleteTexture(S.__webglTexture);const H=D.source,Q=d.get(H);delete Q[S.__cacheKey],a.memory.textures--}function _(D){const S=n.get(D);if(D.depthTexture&&(D.depthTexture.dispose(),n.remove(D.depthTexture)),D.isWebGLCubeRenderTarget)for(let Q=0;Q<6;Q++){if(Array.isArray(S.__webglFramebuffer[Q]))for(let $=0;$<S.__webglFramebuffer[Q].length;$++)s.deleteFramebuffer(S.__webglFramebuffer[Q][$]);else s.deleteFramebuffer(S.__webglFramebuffer[Q]);S.__webglDepthbuffer&&s.deleteRenderbuffer(S.__webglDepthbuffer[Q])}else{if(Array.isArray(S.__webglFramebuffer))for(let Q=0;Q<S.__webglFramebuffer.length;Q++)s.deleteFramebuffer(S.__webglFramebuffer[Q]);else s.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&s.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&s.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let Q=0;Q<S.__webglColorRenderbuffer.length;Q++)S.__webglColorRenderbuffer[Q]&&s.deleteRenderbuffer(S.__webglColorRenderbuffer[Q]);S.__webglDepthRenderbuffer&&s.deleteRenderbuffer(S.__webglDepthRenderbuffer)}const H=D.textures;for(let Q=0,$=H.length;Q<$;Q++){const X=n.get(H[Q]);X.__webglTexture&&(s.deleteTexture(X.__webglTexture),a.memory.textures--),n.remove(H[Q])}n.remove(D)}let R=0;function P(){R=0}function B(){const D=R;return D>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+D+" texture units while this GPU supports only "+i.maxTextures),R+=1,D}function O(D){const S=[];return S.push(D.wrapS),S.push(D.wrapT),S.push(D.wrapR||0),S.push(D.magFilter),S.push(D.minFilter),S.push(D.anisotropy),S.push(D.internalFormat),S.push(D.format),S.push(D.type),S.push(D.generateMipmaps),S.push(D.premultiplyAlpha),S.push(D.flipY),S.push(D.unpackAlignment),S.push(D.colorSpace),S.join()}function F(D,S){const H=n.get(D);if(D.isVideoTexture&&ke(D),D.isRenderTargetTexture===!1&&D.isExternalTexture!==!0&&D.version>0&&H.__version!==D.version){const Q=D.image;if(Q===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Q.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{j(H,D,S);return}}else D.isExternalTexture&&(H.__webglTexture=D.sourceTexture?D.sourceTexture:null);t.bindTexture(s.TEXTURE_2D,H.__webglTexture,s.TEXTURE0+S)}function U(D,S){const H=n.get(D);if(D.isRenderTargetTexture===!1&&D.version>0&&H.__version!==D.version){j(H,D,S);return}t.bindTexture(s.TEXTURE_2D_ARRAY,H.__webglTexture,s.TEXTURE0+S)}function Y(D,S){const H=n.get(D);if(D.isRenderTargetTexture===!1&&D.version>0&&H.__version!==D.version){j(H,D,S);return}t.bindTexture(s.TEXTURE_3D,H.__webglTexture,s.TEXTURE0+S)}function V(D,S){const H=n.get(D);if(D.version>0&&H.__version!==D.version){q(H,D,S);return}t.bindTexture(s.TEXTURE_CUBE_MAP,H.__webglTexture,s.TEXTURE0+S)}const Z={[Fn]:s.REPEAT,[Ln]:s.CLAMP_TO_EDGE,[xr]:s.MIRRORED_REPEAT},te={[Dt]:s.NEAREST,[lc]:s.NEAREST_MIPMAP_NEAREST,[Ss]:s.NEAREST_MIPMAP_LINEAR,[Et]:s.LINEAR,[ar]:s.LINEAR_MIPMAP_NEAREST,[Nn]:s.LINEAR_MIPMAP_LINEAR},ce={[dd]:s.NEVER,[vd]:s.ALWAYS,[fd]:s.LESS,[Ac]:s.LEQUAL,[pd]:s.EQUAL,[Ad]:s.GEQUAL,[md]:s.GREATER,[gd]:s.NOTEQUAL};function ge(D,S){if(S.type===Qt&&e.has("OES_texture_float_linear")===!1&&(S.magFilter===Et||S.magFilter===ar||S.magFilter===Ss||S.magFilter===Nn||S.minFilter===Et||S.minFilter===ar||S.minFilter===Ss||S.minFilter===Nn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(D,s.TEXTURE_WRAP_S,Z[S.wrapS]),s.texParameteri(D,s.TEXTURE_WRAP_T,Z[S.wrapT]),(D===s.TEXTURE_3D||D===s.TEXTURE_2D_ARRAY)&&s.texParameteri(D,s.TEXTURE_WRAP_R,Z[S.wrapR]),s.texParameteri(D,s.TEXTURE_MAG_FILTER,te[S.magFilter]),s.texParameteri(D,s.TEXTURE_MIN_FILTER,te[S.minFilter]),S.compareFunction&&(s.texParameteri(D,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(D,s.TEXTURE_COMPARE_FUNC,ce[S.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===Dt||S.minFilter!==Ss&&S.minFilter!==Nn||S.type===Qt&&e.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||n.get(S).__currentAnisotropy){const H=e.get("EXT_texture_filter_anisotropic");s.texParameterf(D,H.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,i.getMaxAnisotropy())),n.get(S).__currentAnisotropy=S.anisotropy}}}function ze(D,S){let H=!1;D.__webglInit===void 0&&(D.__webglInit=!0,S.addEventListener("dispose",y));const Q=S.source;let $=d.get(Q);$===void 0&&($={},d.set(Q,$));const X=O(S);if(X!==D.__cacheKey){$[X]===void 0&&($[X]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,H=!0),$[X].usedTimes++;const _e=$[D.__cacheKey];_e!==void 0&&($[D.__cacheKey].usedTimes--,_e.usedTimes===0&&x(S)),D.__cacheKey=X,D.__webglTexture=$[X].texture}return H}function Ke(D,S,H){return Math.floor(Math.floor(D/H)/S)}function Xe(D,S,H,Q){const X=D.updateRanges;if(X.length===0)t.texSubImage2D(s.TEXTURE_2D,0,0,0,S.width,S.height,H,Q,S.data);else{X.sort((ie,ue)=>ie.start-ue.start);let _e=0;for(let ie=1;ie<X.length;ie++){const ue=X[_e],Ie=X[ie],be=ue.start+ue.count,oe=Ke(Ie.start,S.width,4),Ue=Ke(ue.start,S.width,4);Ie.start<=be+1&&oe===Ue&&Ke(Ie.start+Ie.count-1,S.width,4)===oe?ue.count=Math.max(ue.count,Ie.start+Ie.count-ue.start):(++_e,X[_e]=Ie)}X.length=_e+1;const re=s.getParameter(s.UNPACK_ROW_LENGTH),me=s.getParameter(s.UNPACK_SKIP_PIXELS),Ee=s.getParameter(s.UNPACK_SKIP_ROWS);s.pixelStorei(s.UNPACK_ROW_LENGTH,S.width);for(let ie=0,ue=X.length;ie<ue;ie++){const Ie=X[ie],be=Math.floor(Ie.start/4),oe=Math.ceil(Ie.count/4),Ue=be%S.width,N=Math.floor(be/S.width),ee=oe,ae=1;s.pixelStorei(s.UNPACK_SKIP_PIXELS,Ue),s.pixelStorei(s.UNPACK_SKIP_ROWS,N),t.texSubImage2D(s.TEXTURE_2D,0,Ue,N,ee,ae,H,Q,S.data)}D.clearUpdateRanges(),s.pixelStorei(s.UNPACK_ROW_LENGTH,re),s.pixelStorei(s.UNPACK_SKIP_PIXELS,me),s.pixelStorei(s.UNPACK_SKIP_ROWS,Ee)}}function j(D,S,H){let Q=s.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(Q=s.TEXTURE_2D_ARRAY),S.isData3DTexture&&(Q=s.TEXTURE_3D);const $=ze(D,S),X=S.source;t.bindTexture(Q,D.__webglTexture,s.TEXTURE0+H);const _e=n.get(X);if(X.version!==_e.__version||$===!0){t.activeTexture(s.TEXTURE0+H);const re=qe.getPrimaries(qe.workingColorSpace),me=S.colorSpace===ii?null:qe.getPrimaries(S.colorSpace),Ee=S.colorSpace===ii||re===me?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,S.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,S.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ee);let ie=A(S.image,!1,i.maxTextureSize);ie=xt(S,ie);const ue=r.convert(S.format,S.colorSpace),Ie=r.convert(S.type);let be=w(S.internalFormat,ue,Ie,S.colorSpace,S.isVideoTexture);ge(Q,S);let oe;const Ue=S.mipmaps,N=S.isVideoTexture!==!0,ee=_e.__version===void 0||$===!0,ae=X.dataReady,xe=M(S,ie);if(S.isDepthTexture)be=v(S.format===Ki,S.type),ee&&(N?t.texStorage2D(s.TEXTURE_2D,1,be,ie.width,ie.height):t.texImage2D(s.TEXTURE_2D,0,be,ie.width,ie.height,0,ue,Ie,null));else if(S.isDataTexture)if(Ue.length>0){N&&ee&&t.texStorage2D(s.TEXTURE_2D,xe,be,Ue[0].width,Ue[0].height);for(let ne=0,K=Ue.length;ne<K;ne++)oe=Ue[ne],N?ae&&t.texSubImage2D(s.TEXTURE_2D,ne,0,0,oe.width,oe.height,ue,Ie,oe.data):t.texImage2D(s.TEXTURE_2D,ne,be,oe.width,oe.height,0,ue,Ie,oe.data);S.generateMipmaps=!1}else N?(ee&&t.texStorage2D(s.TEXTURE_2D,xe,be,ie.width,ie.height),ae&&Xe(S,ie,ue,Ie)):t.texImage2D(s.TEXTURE_2D,0,be,ie.width,ie.height,0,ue,Ie,ie.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){N&&ee&&t.texStorage3D(s.TEXTURE_2D_ARRAY,xe,be,Ue[0].width,Ue[0].height,ie.depth);for(let ne=0,K=Ue.length;ne<K;ne++)if(oe=Ue[ne],S.format!==an)if(ue!==null)if(N){if(ae)if(S.layerUpdates.size>0){const Me=Oh(oe.width,oe.height,S.format,S.type);for(const He of S.layerUpdates){const ht=oe.data.subarray(He*Me/oe.data.BYTES_PER_ELEMENT,(He+1)*Me/oe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,ne,0,0,He,oe.width,oe.height,1,ue,ht)}S.clearLayerUpdates()}else t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,ne,0,0,0,oe.width,oe.height,ie.depth,ue,oe.data)}else t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,ne,be,oe.width,oe.height,ie.depth,0,oe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else N?ae&&t.texSubImage3D(s.TEXTURE_2D_ARRAY,ne,0,0,0,oe.width,oe.height,ie.depth,ue,Ie,oe.data):t.texImage3D(s.TEXTURE_2D_ARRAY,ne,be,oe.width,oe.height,ie.depth,0,ue,Ie,oe.data)}else{N&&ee&&t.texStorage2D(s.TEXTURE_2D,xe,be,Ue[0].width,Ue[0].height);for(let ne=0,K=Ue.length;ne<K;ne++)oe=Ue[ne],S.format!==an?ue!==null?N?ae&&t.compressedTexSubImage2D(s.TEXTURE_2D,ne,0,0,oe.width,oe.height,ue,oe.data):t.compressedTexImage2D(s.TEXTURE_2D,ne,be,oe.width,oe.height,0,oe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):N?ae&&t.texSubImage2D(s.TEXTURE_2D,ne,0,0,oe.width,oe.height,ue,Ie,oe.data):t.texImage2D(s.TEXTURE_2D,ne,be,oe.width,oe.height,0,ue,Ie,oe.data)}else if(S.isDataArrayTexture)if(N){if(ee&&t.texStorage3D(s.TEXTURE_2D_ARRAY,xe,be,ie.width,ie.height,ie.depth),ae)if(S.layerUpdates.size>0){const ne=Oh(ie.width,ie.height,S.format,S.type);for(const K of S.layerUpdates){const Me=ie.data.subarray(K*ne/ie.data.BYTES_PER_ELEMENT,(K+1)*ne/ie.data.BYTES_PER_ELEMENT);t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,K,ie.width,ie.height,1,ue,Ie,Me)}S.clearLayerUpdates()}else t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,ie.width,ie.height,ie.depth,ue,Ie,ie.data)}else t.texImage3D(s.TEXTURE_2D_ARRAY,0,be,ie.width,ie.height,ie.depth,0,ue,Ie,ie.data);else if(S.isData3DTexture)N?(ee&&t.texStorage3D(s.TEXTURE_3D,xe,be,ie.width,ie.height,ie.depth),ae&&t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,ie.width,ie.height,ie.depth,ue,Ie,ie.data)):t.texImage3D(s.TEXTURE_3D,0,be,ie.width,ie.height,ie.depth,0,ue,Ie,ie.data);else if(S.isFramebufferTexture){if(ee)if(N)t.texStorage2D(s.TEXTURE_2D,xe,be,ie.width,ie.height);else{let ne=ie.width,K=ie.height;for(let Me=0;Me<xe;Me++)t.texImage2D(s.TEXTURE_2D,Me,be,ne,K,0,ue,Ie,null),ne>>=1,K>>=1}}else if(Ue.length>0){if(N&&ee){const ne=ut(Ue[0]);t.texStorage2D(s.TEXTURE_2D,xe,be,ne.width,ne.height)}for(let ne=0,K=Ue.length;ne<K;ne++)oe=Ue[ne],N?ae&&t.texSubImage2D(s.TEXTURE_2D,ne,0,0,ue,Ie,oe):t.texImage2D(s.TEXTURE_2D,ne,be,ue,Ie,oe);S.generateMipmaps=!1}else if(N){if(ee){const ne=ut(ie);t.texStorage2D(s.TEXTURE_2D,xe,be,ne.width,ne.height)}ae&&t.texSubImage2D(s.TEXTURE_2D,0,0,0,ue,Ie,ie)}else t.texImage2D(s.TEXTURE_2D,0,be,ue,Ie,ie);m(S)&&p(Q),_e.__version=X.version,S.onUpdate&&S.onUpdate(S)}D.__version=S.version}function q(D,S,H){if(S.image.length!==6)return;const Q=ze(D,S),$=S.source;t.bindTexture(s.TEXTURE_CUBE_MAP,D.__webglTexture,s.TEXTURE0+H);const X=n.get($);if($.version!==X.__version||Q===!0){t.activeTexture(s.TEXTURE0+H);const _e=qe.getPrimaries(qe.workingColorSpace),re=S.colorSpace===ii?null:qe.getPrimaries(S.colorSpace),me=S.colorSpace===ii||_e===re?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,S.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,S.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,me);const Ee=S.isCompressedTexture||S.image[0].isCompressedTexture,ie=S.image[0]&&S.image[0].isDataTexture,ue=[];for(let K=0;K<6;K++)!Ee&&!ie?ue[K]=A(S.image[K],!0,i.maxCubemapSize):ue[K]=ie?S.image[K].image:S.image[K],ue[K]=xt(S,ue[K]);const Ie=ue[0],be=r.convert(S.format,S.colorSpace),oe=r.convert(S.type),Ue=w(S.internalFormat,be,oe,S.colorSpace),N=S.isVideoTexture!==!0,ee=X.__version===void 0||Q===!0,ae=$.dataReady;let xe=M(S,Ie);ge(s.TEXTURE_CUBE_MAP,S);let ne;if(Ee){N&&ee&&t.texStorage2D(s.TEXTURE_CUBE_MAP,xe,Ue,Ie.width,Ie.height);for(let K=0;K<6;K++){ne=ue[K].mipmaps;for(let Me=0;Me<ne.length;Me++){const He=ne[Me];S.format!==an?be!==null?N?ae&&t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,Me,0,0,He.width,He.height,be,He.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,Me,Ue,He.width,He.height,0,He.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):N?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,Me,0,0,He.width,He.height,be,oe,He.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,Me,Ue,He.width,He.height,0,be,oe,He.data)}}}else{if(ne=S.mipmaps,N&&ee){ne.length>0&&xe++;const K=ut(ue[0]);t.texStorage2D(s.TEXTURE_CUBE_MAP,xe,Ue,K.width,K.height)}for(let K=0;K<6;K++)if(ie){N?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,ue[K].width,ue[K].height,be,oe,ue[K].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ue,ue[K].width,ue[K].height,0,be,oe,ue[K].data);for(let Me=0;Me<ne.length;Me++){const ht=ne[Me].image[K].image;N?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,Me+1,0,0,ht.width,ht.height,be,oe,ht.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,Me+1,Ue,ht.width,ht.height,0,be,oe,ht.data)}}else{N?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,be,oe,ue[K]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Ue,be,oe,ue[K]);for(let Me=0;Me<ne.length;Me++){const He=ne[Me];N?ae&&t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,Me+1,0,0,be,oe,He.image[K]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+K,Me+1,Ue,be,oe,He.image[K])}}}m(S)&&p(s.TEXTURE_CUBE_MAP),X.__version=$.version,S.onUpdate&&S.onUpdate(S)}D.__version=S.version}function le(D,S,H,Q,$,X){const _e=r.convert(H.format,H.colorSpace),re=r.convert(H.type),me=w(H.internalFormat,_e,re,H.colorSpace),Ee=n.get(S),ie=n.get(H);if(ie.__renderTarget=S,!Ee.__hasExternalTextures){const ue=Math.max(1,S.width>>X),Ie=Math.max(1,S.height>>X);$===s.TEXTURE_3D||$===s.TEXTURE_2D_ARRAY?t.texImage3D($,X,me,ue,Ie,S.depth,0,_e,re,null):t.texImage2D($,X,me,ue,Ie,0,_e,re,null)}t.bindFramebuffer(s.FRAMEBUFFER,D),ve(S)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,Q,$,ie.__webglTexture,0,rt(S)):($===s.TEXTURE_2D||$>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&$<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,Q,$,ie.__webglTexture,X),t.bindFramebuffer(s.FRAMEBUFFER,null)}function Te(D,S,H){if(s.bindRenderbuffer(s.RENDERBUFFER,D),S.depthBuffer){const Q=S.depthTexture,$=Q&&Q.isDepthTexture?Q.type:null,X=v(S.stencilBuffer,$),_e=S.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,re=rt(S);ve(S)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,re,X,S.width,S.height):H?s.renderbufferStorageMultisample(s.RENDERBUFFER,re,X,S.width,S.height):s.renderbufferStorage(s.RENDERBUFFER,X,S.width,S.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,_e,s.RENDERBUFFER,D)}else{const Q=S.textures;for(let $=0;$<Q.length;$++){const X=Q[$],_e=r.convert(X.format,X.colorSpace),re=r.convert(X.type),me=w(X.internalFormat,_e,re,X.colorSpace),Ee=rt(S);H&&ve(S)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,Ee,me,S.width,S.height):ve(S)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Ee,me,S.width,S.height):s.renderbufferStorage(s.RENDERBUFFER,me,S.width,S.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function fe(D,S){if(S&&S.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(s.FRAMEBUFFER,D),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Q=n.get(S.depthTexture);Q.__renderTarget=S,(!Q.__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),F(S.depthTexture,0);const $=Q.__webglTexture,X=rt(S);if(S.depthTexture.format===Ls)ve(S)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,$,0,X):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,$,0);else if(S.depthTexture.format===Ki)ve(S)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,$,0,X):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,$,0);else throw new Error("Unknown depthTexture format")}function Qe(D){const S=n.get(D),H=D.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==D.depthTexture){const Q=D.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),Q){const $=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,Q.removeEventListener("dispose",$)};Q.addEventListener("dispose",$),S.__depthDisposeCallback=$}S.__boundDepthTexture=Q}if(D.depthTexture&&!S.__autoAllocateDepthBuffer){if(H)throw new Error("target.depthTexture not supported in Cube render targets");const Q=D.texture.mipmaps;Q&&Q.length>0?fe(S.__webglFramebuffer[0],D):fe(S.__webglFramebuffer,D)}else if(H){S.__webglDepthbuffer=[];for(let Q=0;Q<6;Q++)if(t.bindFramebuffer(s.FRAMEBUFFER,S.__webglFramebuffer[Q]),S.__webglDepthbuffer[Q]===void 0)S.__webglDepthbuffer[Q]=s.createRenderbuffer(),Te(S.__webglDepthbuffer[Q],D,!1);else{const $=D.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,X=S.__webglDepthbuffer[Q];s.bindRenderbuffer(s.RENDERBUFFER,X),s.framebufferRenderbuffer(s.FRAMEBUFFER,$,s.RENDERBUFFER,X)}}else{const Q=D.texture.mipmaps;if(Q&&Q.length>0?t.bindFramebuffer(s.FRAMEBUFFER,S.__webglFramebuffer[0]):t.bindFramebuffer(s.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=s.createRenderbuffer(),Te(S.__webglDepthbuffer,D,!1);else{const $=D.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,X=S.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,X),s.framebufferRenderbuffer(s.FRAMEBUFFER,$,s.RENDERBUFFER,X)}}t.bindFramebuffer(s.FRAMEBUFFER,null)}function Ct(D,S,H){const Q=n.get(D);S!==void 0&&le(Q.__webglFramebuffer,D,D.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),H!==void 0&&Qe(D)}function L(D){const S=D.texture,H=n.get(D),Q=n.get(S);D.addEventListener("dispose",T);const $=D.textures,X=D.isWebGLCubeRenderTarget===!0,_e=$.length>1;if(_e||(Q.__webglTexture===void 0&&(Q.__webglTexture=s.createTexture()),Q.__version=S.version,a.memory.textures++),X){H.__webglFramebuffer=[];for(let re=0;re<6;re++)if(S.mipmaps&&S.mipmaps.length>0){H.__webglFramebuffer[re]=[];for(let me=0;me<S.mipmaps.length;me++)H.__webglFramebuffer[re][me]=s.createFramebuffer()}else H.__webglFramebuffer[re]=s.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){H.__webglFramebuffer=[];for(let re=0;re<S.mipmaps.length;re++)H.__webglFramebuffer[re]=s.createFramebuffer()}else H.__webglFramebuffer=s.createFramebuffer();if(_e)for(let re=0,me=$.length;re<me;re++){const Ee=n.get($[re]);Ee.__webglTexture===void 0&&(Ee.__webglTexture=s.createTexture(),a.memory.textures++)}if(D.samples>0&&ve(D)===!1){H.__webglMultisampledFramebuffer=s.createFramebuffer(),H.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let re=0;re<$.length;re++){const me=$[re];H.__webglColorRenderbuffer[re]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,H.__webglColorRenderbuffer[re]);const Ee=r.convert(me.format,me.colorSpace),ie=r.convert(me.type),ue=w(me.internalFormat,Ee,ie,me.colorSpace,D.isXRRenderTarget===!0),Ie=rt(D);s.renderbufferStorageMultisample(s.RENDERBUFFER,Ie,ue,D.width,D.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+re,s.RENDERBUFFER,H.__webglColorRenderbuffer[re])}s.bindRenderbuffer(s.RENDERBUFFER,null),D.depthBuffer&&(H.__webglDepthRenderbuffer=s.createRenderbuffer(),Te(H.__webglDepthRenderbuffer,D,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(X){t.bindTexture(s.TEXTURE_CUBE_MAP,Q.__webglTexture),ge(s.TEXTURE_CUBE_MAP,S);for(let re=0;re<6;re++)if(S.mipmaps&&S.mipmaps.length>0)for(let me=0;me<S.mipmaps.length;me++)le(H.__webglFramebuffer[re][me],D,S,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+re,me);else le(H.__webglFramebuffer[re],D,S,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+re,0);m(S)&&p(s.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(_e){for(let re=0,me=$.length;re<me;re++){const Ee=$[re],ie=n.get(Ee);let ue=s.TEXTURE_2D;(D.isWebGL3DRenderTarget||D.isWebGLArrayRenderTarget)&&(ue=D.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(ue,ie.__webglTexture),ge(ue,Ee),le(H.__webglFramebuffer,D,Ee,s.COLOR_ATTACHMENT0+re,ue,0),m(Ee)&&p(ue)}t.unbindTexture()}else{let re=s.TEXTURE_2D;if((D.isWebGL3DRenderTarget||D.isWebGLArrayRenderTarget)&&(re=D.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),t.bindTexture(re,Q.__webglTexture),ge(re,S),S.mipmaps&&S.mipmaps.length>0)for(let me=0;me<S.mipmaps.length;me++)le(H.__webglFramebuffer[me],D,S,s.COLOR_ATTACHMENT0,re,me);else le(H.__webglFramebuffer,D,S,s.COLOR_ATTACHMENT0,re,0);m(S)&&p(re),t.unbindTexture()}D.depthBuffer&&Qe(D)}function st(D){const S=D.textures;for(let H=0,Q=S.length;H<Q;H++){const $=S[H];if(m($)){const X=E(D),_e=n.get($).__webglTexture;t.bindTexture(X,_e),p(X),t.unbindTexture()}}}const Fe=[],De=[];function Ae(D){if(D.samples>0){if(ve(D)===!1){const S=D.textures,H=D.width,Q=D.height;let $=s.COLOR_BUFFER_BIT;const X=D.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,_e=n.get(D),re=S.length>1;if(re)for(let Ee=0;Ee<S.length;Ee++)t.bindFramebuffer(s.FRAMEBUFFER,_e.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+Ee,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,_e.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+Ee,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,_e.__webglMultisampledFramebuffer);const me=D.texture.mipmaps;me&&me.length>0?t.bindFramebuffer(s.DRAW_FRAMEBUFFER,_e.__webglFramebuffer[0]):t.bindFramebuffer(s.DRAW_FRAMEBUFFER,_e.__webglFramebuffer);for(let Ee=0;Ee<S.length;Ee++){if(D.resolveDepthBuffer&&(D.depthBuffer&&($|=s.DEPTH_BUFFER_BIT),D.stencilBuffer&&D.resolveStencilBuffer&&($|=s.STENCIL_BUFFER_BIT)),re){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,_e.__webglColorRenderbuffer[Ee]);const ie=n.get(S[Ee]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,ie,0)}s.blitFramebuffer(0,0,H,Q,0,0,H,Q,$,s.NEAREST),c===!0&&(Fe.length=0,De.length=0,Fe.push(s.COLOR_ATTACHMENT0+Ee),D.depthBuffer&&D.resolveDepthBuffer===!1&&(Fe.push(X),De.push(X),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,De)),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,Fe))}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),re)for(let Ee=0;Ee<S.length;Ee++){t.bindFramebuffer(s.FRAMEBUFFER,_e.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+Ee,s.RENDERBUFFER,_e.__webglColorRenderbuffer[Ee]);const ie=n.get(S[Ee]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,_e.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+Ee,s.TEXTURE_2D,ie,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,_e.__webglMultisampledFramebuffer)}else if(D.depthBuffer&&D.resolveDepthBuffer===!1&&c){const S=D.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[S])}}}function rt(D){return Math.min(i.maxSamples,D.samples)}function ve(D){const S=n.get(D);return D.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function ke(D){const S=a.render.frame;h.get(D)!==S&&(h.set(D,S),D.update())}function xt(D,S){const H=D.colorSpace,Q=D.format,$=D.type;return D.isCompressedTexture===!0||D.isVideoTexture===!0||H!==Ft&&H!==ii&&(qe.getTransfer(H)===nt?(Q!==an||$!==bn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",H)),S}function ut(D){return typeof HTMLImageElement<"u"&&D instanceof HTMLImageElement?(l.width=D.naturalWidth||D.width,l.height=D.naturalHeight||D.height):typeof VideoFrame<"u"&&D instanceof VideoFrame?(l.width=D.displayWidth,l.height=D.displayHeight):(l.width=D.width,l.height=D.height),l}this.allocateTextureUnit=B,this.resetTextureUnits=P,this.setTexture2D=F,this.setTexture2DArray=U,this.setTexture3D=Y,this.setTextureCube=V,this.rebindTextures=Ct,this.setupRenderTarget=L,this.updateRenderTargetMipmap=st,this.updateMultisampleRenderTarget=Ae,this.setupDepthRenderbuffer=Qe,this.setupFrameBufferTexture=le,this.useMultisampledRTT=ve}function rf(s,e){function t(n,i=ii){let r;const a=qe.getTransfer(i);if(n===bn)return s.UNSIGNED_BYTE;if(n===yo)return s.UNSIGNED_SHORT_4_4_4_4;if(n===Mo)return s.UNSIGNED_SHORT_5_5_5_1;if(n===uc)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===dc)return s.UNSIGNED_INT_10F_11F_11F_REV;if(n===cc)return s.BYTE;if(n===hc)return s.SHORT;if(n===Is)return s.UNSIGNED_SHORT;if(n===_o)return s.INT;if(n===Ei)return s.UNSIGNED_INT;if(n===Qt)return s.FLOAT;if(n===Ot)return s.HALF_FLOAT;if(n===fc)return s.ALPHA;if(n===pc)return s.RGB;if(n===an)return s.RGBA;if(n===Ls)return s.DEPTH_COMPONENT;if(n===Ki)return s.DEPTH_STENCIL;if(n===So)return s.RED;if(n===Eo)return s.RED_INTEGER;if(n===mc)return s.RG;if(n===bo)return s.RG_INTEGER;if(n===To)return s.RGBA_INTEGER;if(n===or||n===lr||n===cr||n===hr)if(a===nt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===or)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===lr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===cr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===or)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===lr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===cr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===hr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Oa||n===Fa||n===ka||n===za)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Oa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Fa)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ka)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===za)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ha||n===Va||n===Ga)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ha||n===Va)return a===nt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ga)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Wa||n===Xa||n===Qa||n===Ya||n===ja||n===qa||n===Ka||n===Za||n===Ja||n===$a||n===eo||n===to||n===no||n===io)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Wa)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Xa)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Qa)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Ya)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===ja)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===qa)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ka)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Za)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ja)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===$a)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===eo)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===to)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===no)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===io)return a===nt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===so||n===ro||n===ao)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===so)return a===nt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ro)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===ao)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===oo||n===lo||n===co||n===ho)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===oo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===lo)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===co)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ho)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===qi?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:t}}const yv=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Mv=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Sv{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new Rc(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new St({vertexShader:yv,fragmentShader:Mv,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Tt(new Hs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Ev extends hi{constructor(e,t){super();const n=this;let i=null,r=1,a=null,o="local-floor",c=1,l=null,h=null,u=null,d=null,f=null,g=null;const A=typeof XRWebGLBinding<"u",m=new Sv,p={},E=t.getContextAttributes();let w=null,v=null;const M=[],y=[],T=new we;let C=null;const x=new zt;x.viewport=new Ze;const _=new zt;_.viewport=new Ze;const R=[x,_],P=new Yd;let B=null,O=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let q=M[j];return q===void 0&&(q=new ya,M[j]=q),q.getTargetRaySpace()},this.getControllerGrip=function(j){let q=M[j];return q===void 0&&(q=new ya,M[j]=q),q.getGripSpace()},this.getHand=function(j){let q=M[j];return q===void 0&&(q=new ya,M[j]=q),q.getHandSpace()};function F(j){const q=y.indexOf(j.inputSource);if(q===-1)return;const le=M[q];le!==void 0&&(le.update(j.inputSource,j.frame,l||a),le.dispatchEvent({type:j.type,data:j.inputSource}))}function U(){i.removeEventListener("select",F),i.removeEventListener("selectstart",F),i.removeEventListener("selectend",F),i.removeEventListener("squeeze",F),i.removeEventListener("squeezestart",F),i.removeEventListener("squeezeend",F),i.removeEventListener("end",U),i.removeEventListener("inputsourceschange",Y);for(let j=0;j<M.length;j++){const q=y[j];q!==null&&(y[j]=null,M[j].disconnect(q))}B=null,O=null,m.reset();for(const j in p)delete p[j];e.setRenderTarget(w),f=null,d=null,u=null,i=null,v=null,Xe.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(T.width,T.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){r=j,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){o=j,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(j){l=j},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u===null&&A&&(u=new XRWebGLBinding(i,t)),u},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(j){if(i=j,i!==null){if(w=e.getRenderTarget(),i.addEventListener("select",F),i.addEventListener("selectstart",F),i.addEventListener("selectend",F),i.addEventListener("squeeze",F),i.addEventListener("squeezestart",F),i.addEventListener("squeezeend",F),i.addEventListener("end",U),i.addEventListener("inputsourceschange",Y),E.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(T),A&&"createProjectionLayer"in XRWebGLBinding.prototype){let le=null,Te=null,fe=null;E.depth&&(fe=E.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,le=E.stencil?Ki:Ls,Te=E.stencil?qi:Ei);const Qe={colorFormat:t.RGBA8,depthFormat:fe,scaleFactor:r};u=this.getBinding(),d=u.createProjectionLayer(Qe),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),v=new en(d.textureWidth,d.textureHeight,{format:an,type:bn,depthTexture:new Bo(d.textureWidth,d.textureHeight,Te,void 0,void 0,void 0,void 0,void 0,void 0,le),stencilBuffer:E.stencil,colorSpace:e.outputColorSpace,samples:E.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{const le={antialias:E.antialias,alpha:!0,depth:E.depth,stencil:E.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(i,t,le),i.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),v=new en(f.framebufferWidth,f.framebufferHeight,{format:an,type:bn,colorSpace:e.outputColorSpace,stencilBuffer:E.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await i.requestReferenceSpace(o),Xe.setContext(i),Xe.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function Y(j){for(let q=0;q<j.removed.length;q++){const le=j.removed[q],Te=y.indexOf(le);Te>=0&&(y[Te]=null,M[Te].disconnect(le))}for(let q=0;q<j.added.length;q++){const le=j.added[q];let Te=y.indexOf(le);if(Te===-1){for(let Qe=0;Qe<M.length;Qe++)if(Qe>=y.length){y.push(le),Te=Qe;break}else if(y[Qe]===null){y[Qe]=le,Te=Qe;break}if(Te===-1)break}const fe=M[Te];fe&&fe.connect(le)}}const V=new I,Z=new I;function te(j,q,le){V.setFromMatrixPosition(q.matrixWorld),Z.setFromMatrixPosition(le.matrixWorld);const Te=V.distanceTo(Z),fe=q.projectionMatrix.elements,Qe=le.projectionMatrix.elements,Ct=fe[14]/(fe[10]-1),L=fe[14]/(fe[10]+1),st=(fe[9]+1)/fe[5],Fe=(fe[9]-1)/fe[5],De=(fe[8]-1)/fe[0],Ae=(Qe[8]+1)/Qe[0],rt=Ct*De,ve=Ct*Ae,ke=Te/(-De+Ae),xt=ke*-De;if(q.matrixWorld.decompose(j.position,j.quaternion,j.scale),j.translateX(xt),j.translateZ(ke),j.matrixWorld.compose(j.position,j.quaternion,j.scale),j.matrixWorldInverse.copy(j.matrixWorld).invert(),fe[10]===-1)j.projectionMatrix.copy(q.projectionMatrix),j.projectionMatrixInverse.copy(q.projectionMatrixInverse);else{const ut=Ct+ke,D=L+ke,S=rt-xt,H=ve+(Te-xt),Q=st*L/D*ut,$=Fe*L/D*ut;j.projectionMatrix.makePerspective(S,H,Q,$,ut,D),j.projectionMatrixInverse.copy(j.projectionMatrix).invert()}}function ce(j,q){q===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(q.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(i===null)return;let q=j.near,le=j.far;m.texture!==null&&(m.depthNear>0&&(q=m.depthNear),m.depthFar>0&&(le=m.depthFar)),P.near=_.near=x.near=q,P.far=_.far=x.far=le,(B!==P.near||O!==P.far)&&(i.updateRenderState({depthNear:P.near,depthFar:P.far}),B=P.near,O=P.far),P.layers.mask=j.layers.mask|6,x.layers.mask=P.layers.mask&3,_.layers.mask=P.layers.mask&5;const Te=j.parent,fe=P.cameras;ce(P,Te);for(let Qe=0;Qe<fe.length;Qe++)ce(fe[Qe],Te);fe.length===2?te(P,x,_):P.projectionMatrix.copy(x.projectionMatrix),ge(j,P,Te)};function ge(j,q,le){le===null?j.matrix.copy(q.matrixWorld):(j.matrix.copy(le.matrixWorld),j.matrix.invert(),j.matrix.multiply(q.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(q.projectionMatrix),j.projectionMatrixInverse.copy(q.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=Us*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return P},this.getFoveation=function(){if(!(d===null&&f===null))return c},this.setFoveation=function(j){c=j,d!==null&&(d.fixedFoveation=j),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=j)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(P)},this.getCameraTexture=function(j){return p[j]};let ze=null;function Ke(j,q){if(h=q.getViewerPose(l||a),g=q,h!==null){const le=h.views;f!==null&&(e.setRenderTargetFramebuffer(v,f.framebuffer),e.setRenderTarget(v));let Te=!1;le.length!==P.cameras.length&&(P.cameras.length=0,Te=!0);for(let L=0;L<le.length;L++){const st=le[L];let Fe=null;if(f!==null)Fe=f.getViewport(st);else{const Ae=u.getViewSubImage(d,st);Fe=Ae.viewport,L===0&&(e.setRenderTargetTextures(v,Ae.colorTexture,Ae.depthStencilTexture),e.setRenderTarget(v))}let De=R[L];De===void 0&&(De=new zt,De.layers.enable(L),De.viewport=new Ze,R[L]=De),De.matrix.fromArray(st.transform.matrix),De.matrix.decompose(De.position,De.quaternion,De.scale),De.projectionMatrix.fromArray(st.projectionMatrix),De.projectionMatrixInverse.copy(De.projectionMatrix).invert(),De.viewport.set(Fe.x,Fe.y,Fe.width,Fe.height),L===0&&(P.matrix.copy(De.matrix),P.matrix.decompose(P.position,P.quaternion,P.scale)),Te===!0&&P.cameras.push(De)}const fe=i.enabledFeatures;if(fe&&fe.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&A){u=n.getBinding();const L=u.getDepthInformation(le[0]);L&&L.isValid&&L.texture&&m.init(L,i.renderState)}if(fe&&fe.includes("camera-access")&&A){e.state.unbindTexture(),u=n.getBinding();for(let L=0;L<le.length;L++){const st=le[L].camera;if(st){let Fe=p[st];Fe||(Fe=new Rc,p[st]=Fe);const De=u.getCameraImage(st);Fe.sourceTexture=De}}}}for(let le=0;le<M.length;le++){const Te=y[le],fe=M[le];Te!==null&&fe!==void 0&&fe.update(Te,q,l||a)}ze&&ze(j,q),q.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:q}),g=null}const Xe=new $d;Xe.setAnimationLoop(Ke),this.setAnimationLoop=function(j){ze=j},this.dispose=function(){}}}const Ii=new kn,bv=new Be;function Tv(s,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,bd(s)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function i(m,p,E,w,v){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(m,p):p.isMeshToonMaterial?(r(m,p),u(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p)):p.isMeshStandardMaterial?(r(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,v)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),A(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?c(m,p,E,w):p.isSpriteMaterial?l(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Yt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Yt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const E=e.get(p),w=E.envMap,v=E.envMapRotation;w&&(m.envMap.value=w,Ii.copy(v),Ii.x*=-1,Ii.y*=-1,Ii.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(Ii.y*=-1,Ii.z*=-1),m.envMapRotation.value.setFromMatrix4(bv.makeRotationFromEuler(Ii)),m.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function c(m,p,E,w){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*E,m.scale.value=w*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function l(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,E){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Yt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=E.texture,m.transmissionSamplerSize.value.set(E.width,E.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function A(m,p){const E=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(E.matrixWorld),m.nearDistance.value=E.shadow.camera.near,m.farDistance.value=E.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function wv(s,e,t,n){let i={},r={},a=[];const o=s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS);function c(E,w){const v=w.program;n.uniformBlockBinding(E,v)}function l(E,w){let v=i[E.id];v===void 0&&(g(E),v=h(E),i[E.id]=v,E.addEventListener("dispose",m));const M=w.program;n.updateUBOMapping(E,M);const y=e.render.frame;r[E.id]!==y&&(d(E),r[E.id]=y)}function h(E){const w=u();E.__bindingPointIndex=w;const v=s.createBuffer(),M=E.__size,y=E.usage;return s.bindBuffer(s.UNIFORM_BUFFER,v),s.bufferData(s.UNIFORM_BUFFER,M,y),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,w,v),v}function u(){for(let E=0;E<o;E++)if(a.indexOf(E)===-1)return a.push(E),E;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(E){const w=i[E.id],v=E.uniforms,M=E.__cache;s.bindBuffer(s.UNIFORM_BUFFER,w);for(let y=0,T=v.length;y<T;y++){const C=Array.isArray(v[y])?v[y]:[v[y]];for(let x=0,_=C.length;x<_;x++){const R=C[x];if(f(R,y,x,M)===!0){const P=R.__offset,B=Array.isArray(R.value)?R.value:[R.value];let O=0;for(let F=0;F<B.length;F++){const U=B[F],Y=A(U);typeof U=="number"||typeof U=="boolean"?(R.__data[0]=U,s.bufferSubData(s.UNIFORM_BUFFER,P+O,R.__data)):U.isMatrix3?(R.__data[0]=U.elements[0],R.__data[1]=U.elements[1],R.__data[2]=U.elements[2],R.__data[3]=0,R.__data[4]=U.elements[3],R.__data[5]=U.elements[4],R.__data[6]=U.elements[5],R.__data[7]=0,R.__data[8]=U.elements[6],R.__data[9]=U.elements[7],R.__data[10]=U.elements[8],R.__data[11]=0):(U.toArray(R.__data,O),O+=Y.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,P,R.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)}function f(E,w,v,M){const y=E.value,T=w+"_"+v;if(M[T]===void 0)return typeof y=="number"||typeof y=="boolean"?M[T]=y:M[T]=y.clone(),!0;{const C=M[T];if(typeof y=="number"||typeof y=="boolean"){if(C!==y)return M[T]=y,!0}else if(C.equals(y)===!1)return C.copy(y),!0}return!1}function g(E){const w=E.uniforms;let v=0;const M=16;for(let T=0,C=w.length;T<C;T++){const x=Array.isArray(w[T])?w[T]:[w[T]];for(let _=0,R=x.length;_<R;_++){const P=x[_],B=Array.isArray(P.value)?P.value:[P.value];for(let O=0,F=B.length;O<F;O++){const U=B[O],Y=A(U),V=v%M,Z=V%Y.boundary,te=V+Z;v+=Z,te!==0&&M-te<Y.storage&&(v+=M-te),P.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),P.__offset=v,v+=Y.storage}}}const y=v%M;return y>0&&(v+=M-y),E.__size=v,E.__cache={},this}function A(E){const w={boundary:0,storage:0};return typeof E=="number"||typeof E=="boolean"?(w.boundary=4,w.storage=4):E.isVector2?(w.boundary=8,w.storage=8):E.isVector3||E.isColor?(w.boundary=16,w.storage=12):E.isVector4?(w.boundary=16,w.storage=16):E.isMatrix3?(w.boundary=48,w.storage=48):E.isMatrix4?(w.boundary=64,w.storage=64):E.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",E),w}function m(E){const w=E.target;w.removeEventListener("dispose",m);const v=a.indexOf(w.__bindingPointIndex);a.splice(v,1),s.deleteBuffer(i[w.id]),delete i[w.id],delete r[w.id]}function p(){for(const E in i)s.deleteBuffer(i[E]);a=[],i={},r={}}return{bind:c,update:l,dispose:p}}class af{constructor(e={}){const{canvas:t=_d(),context:n=null,depth:i=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=a;const g=new Uint32Array(4),A=new Int32Array(4);let m=null,p=null;const E=[],w=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=li,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const v=this;let M=!1;this._outputColorSpace=vt;let y=0,T=0,C=null,x=-1,_=null;const R=new Ze,P=new Ze;let B=null;const O=new Ce(0);let F=0,U=t.width,Y=t.height,V=1,Z=null,te=null;const ce=new Ze(0,0,U,Y),ge=new Ze(0,0,U,Y);let ze=!1;const Ke=new No;let Xe=!1,j=!1;const q=new Be,le=new I,Te=new Ze,fe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Qe=!1;function Ct(){return C===null?V:1}let L=n;function st(b,k){return t.getContext(b,k)}try{const b={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Pr}`),t.addEventListener("webglcontextlost",ae,!1),t.addEventListener("webglcontextrestored",xe,!1),t.addEventListener("webglcontextcreationerror",ne,!1),L===null){const k="webgl2";if(L=st(k,b),L===null)throw st(k)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(b){throw console.error("THREE.WebGLRenderer: "+b.message),b}let Fe,De,Ae,rt,ve,ke,xt,ut,D,S,H,Q,$,X,_e,re,me,Ee,ie,ue,Ie,be,oe,Ue;function N(){Fe=new kA(L),Fe.init(),be=new rf(L,Fe),De=new IA(L,Fe,e,be),Ae=new xv(L,Fe),De.reversedDepthBuffer&&d&&Ae.buffers.depth.setReversed(!0),rt=new VA(L),ve=new av,ke=new _v(L,Fe,Ae,ve,De,be,rt),xt=new NA(v),ut=new FA(v),D=new jp(L),oe=new DA(L,D),S=new zA(L,D,rt,oe),H=new WA(L,S,D,rt),ie=new GA(L,De,ke),re=new LA(ve),Q=new rv(v,xt,ut,Fe,De,oe,re),$=new Tv(v,ve),X=new lv,_e=new pv(Fe),Ee=new RA(v,xt,ut,Ae,H,f,c),me=new Av(v,H,De),Ue=new wv(L,rt,De,Ae),ue=new PA(L,Fe,rt),Ie=new HA(L,Fe,rt),rt.programs=Q.programs,v.capabilities=De,v.extensions=Fe,v.properties=ve,v.renderLists=X,v.shadowMap=me,v.state=Ae,v.info=rt}N();const ee=new Ev(v,L);this.xr=ee,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){const b=Fe.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){const b=Fe.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return V},this.setPixelRatio=function(b){b!==void 0&&(V=b,this.setSize(U,Y,!1))},this.getSize=function(b){return b.set(U,Y)},this.setSize=function(b,k,G=!0){if(ee.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}U=b,Y=k,t.width=Math.floor(b*V),t.height=Math.floor(k*V),G===!0&&(t.style.width=b+"px",t.style.height=k+"px"),this.setViewport(0,0,b,k)},this.getDrawingBufferSize=function(b){return b.set(U*V,Y*V).floor()},this.setDrawingBufferSize=function(b,k,G){U=b,Y=k,V=G,t.width=Math.floor(b*G),t.height=Math.floor(k*G),this.setViewport(0,0,b,k)},this.getCurrentViewport=function(b){return b.copy(R)},this.getViewport=function(b){return b.copy(ce)},this.setViewport=function(b,k,G,W){b.isVector4?ce.set(b.x,b.y,b.z,b.w):ce.set(b,k,G,W),Ae.viewport(R.copy(ce).multiplyScalar(V).round())},this.getScissor=function(b){return b.copy(ge)},this.setScissor=function(b,k,G,W){b.isVector4?ge.set(b.x,b.y,b.z,b.w):ge.set(b,k,G,W),Ae.scissor(P.copy(ge).multiplyScalar(V).round())},this.getScissorTest=function(){return ze},this.setScissorTest=function(b){Ae.setScissorTest(ze=b)},this.setOpaqueSort=function(b){Z=b},this.setTransparentSort=function(b){te=b},this.getClearColor=function(b){return b.copy(Ee.getClearColor())},this.setClearColor=function(){Ee.setClearColor(...arguments)},this.getClearAlpha=function(){return Ee.getClearAlpha()},this.setClearAlpha=function(){Ee.setClearAlpha(...arguments)},this.clear=function(b=!0,k=!0,G=!0){let W=0;if(b){let z=!1;if(C!==null){const se=C.texture.format;z=se===To||se===bo||se===Eo}if(z){const se=C.texture.type,de=se===bn||se===Ei||se===Is||se===qi||se===yo||se===Mo,ye=Ee.getClearColor(),pe=Ee.getClearAlpha(),Le=ye.r,Oe=ye.g,Re=ye.b;de?(g[0]=Le,g[1]=Oe,g[2]=Re,g[3]=pe,L.clearBufferuiv(L.COLOR,0,g)):(A[0]=Le,A[1]=Oe,A[2]=Re,A[3]=pe,L.clearBufferiv(L.COLOR,0,A))}else W|=L.COLOR_BUFFER_BIT}k&&(W|=L.DEPTH_BUFFER_BIT),G&&(W|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),L.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ae,!1),t.removeEventListener("webglcontextrestored",xe,!1),t.removeEventListener("webglcontextcreationerror",ne,!1),Ee.dispose(),X.dispose(),_e.dispose(),ve.dispose(),xt.dispose(),ut.dispose(),H.dispose(),oe.dispose(),Ue.dispose(),Q.dispose(),ee.dispose(),ee.removeEventListener("sessionstart",Vn),ee.removeEventListener("sessionend",Yc),bi.stop()};function ae(b){b.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),M=!0}function xe(){console.log("THREE.WebGLRenderer: Context Restored."),M=!1;const b=rt.autoReset,k=me.enabled,G=me.autoUpdate,W=me.needsUpdate,z=me.type;N(),rt.autoReset=b,me.enabled=k,me.autoUpdate=G,me.needsUpdate=W,me.type=z}function ne(b){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function K(b){const k=b.target;k.removeEventListener("dispose",K),Me(k)}function Me(b){He(b),ve.remove(b)}function He(b){const k=ve.get(b).programs;k!==void 0&&(k.forEach(function(G){Q.releaseProgram(G)}),b.isShaderMaterial&&Q.releaseShaderCache(b))}this.renderBufferDirect=function(b,k,G,W,z,se){k===null&&(k=fe);const de=z.isMesh&&z.matrixWorld.determinant()<0,ye=Lf(b,k,G,W,z);Ae.setMaterial(W,de);let pe=G.index,Le=1;if(W.wireframe===!0){if(pe=S.getWireframeAttribute(G),pe===void 0)return;Le=2}const Oe=G.drawRange,Re=G.attributes.position;let je=Oe.start*Le,at=(Oe.start+Oe.count)*Le;se!==null&&(je=Math.max(je,se.start*Le),at=Math.min(at,(se.start+se.count)*Le)),pe!==null?(je=Math.max(je,0),at=Math.min(at,pe.count)):Re!=null&&(je=Math.max(je,0),at=Math.min(at,Re.count));const _t=at-je;if(_t<0||_t===1/0)return;oe.setup(z,W,ye,G,pe);let dt,lt=ue;if(pe!==null&&(dt=D.get(pe),lt=Ie,lt.setIndex(dt)),z.isMesh)W.wireframe===!0?(Ae.setLineWidth(W.wireframeLinewidth*Ct()),lt.setMode(L.LINES)):lt.setMode(L.TRIANGLES);else if(z.isLine){let Pe=W.linewidth;Pe===void 0&&(Pe=1),Ae.setLineWidth(Pe*Ct()),z.isLineSegments?lt.setMode(L.LINES):z.isLineLoop?lt.setMode(L.LINE_LOOP):lt.setMode(L.LINE_STRIP)}else z.isPoints?lt.setMode(L.POINTS):z.isSprite&&lt.setMode(L.TRIANGLES);if(z.isBatchedMesh)if(z._multiDrawInstances!==null)Er("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),lt.renderMultiDrawInstances(z._multiDrawStarts,z._multiDrawCounts,z._multiDrawCount,z._multiDrawInstances);else if(Fe.get("WEBGL_multi_draw"))lt.renderMultiDraw(z._multiDrawStarts,z._multiDrawCounts,z._multiDrawCount);else{const Pe=z._multiDrawStarts,gt=z._multiDrawCounts,Je=z._multiDrawCount,ln=pe?D.get(pe).bytesPerElement:1,as=ve.get(W).currentProgram.getUniforms();for(let cn=0;cn<Je;cn++)as.setValue(L,"_gl_DrawID",cn),lt.render(Pe[cn]/ln,gt[cn])}else if(z.isInstancedMesh)lt.renderInstances(je,_t,z.count);else if(G.isInstancedBufferGeometry){const Pe=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,gt=Math.min(G.instanceCount,Pe);lt.renderInstances(je,_t,gt)}else lt.render(je,_t)};function ht(b,k,G){b.transparent===!0&&b.side===Zt&&b.forceSinglePass===!1?(b.side=Yt,b.needsUpdate=!0,Fr(b,k,G),b.side=Yn,b.needsUpdate=!0,Fr(b,k,G),b.side=Zt):Fr(b,k,G)}this.compile=function(b,k,G=null){G===null&&(G=b),p=_e.get(G),p.init(k),w.push(p),G.traverseVisible(function(z){z.isLight&&z.layers.test(k.layers)&&(p.pushLight(z),z.castShadow&&p.pushShadow(z))}),b!==G&&b.traverseVisible(function(z){z.isLight&&z.layers.test(k.layers)&&(p.pushLight(z),z.castShadow&&p.pushShadow(z))}),p.setupLights();const W=new Set;return b.traverse(function(z){if(!(z.isMesh||z.isPoints||z.isLine||z.isSprite))return;const se=z.material;if(se)if(Array.isArray(se))for(let de=0;de<se.length;de++){const ye=se[de];ht(ye,G,z),W.add(ye)}else ht(se,G,z),W.add(se)}),p=w.pop(),W},this.compileAsync=function(b,k,G=null){const W=this.compile(b,k,G);return new Promise(z=>{function se(){if(W.forEach(function(de){ve.get(de).currentProgram.isReady()&&W.delete(de)}),W.size===0){z(b);return}setTimeout(se,10)}Fe.get("KHR_parallel_shader_compile")!==null?se():setTimeout(se,10)})};let et=null;function jn(b){et&&et(b)}function Vn(){bi.stop()}function Yc(){bi.start()}const bi=new $d;bi.setAnimationLoop(jn),typeof self<"u"&&bi.setContext(self),this.setAnimationLoop=function(b){et=b,ee.setAnimationLoop(b),b===null?bi.stop():bi.start()},ee.addEventListener("sessionstart",Vn),ee.addEventListener("sessionend",Yc),this.render=function(b,k){if(k!==void 0&&k.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(M===!0)return;if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),k.parent===null&&k.matrixWorldAutoUpdate===!0&&k.updateMatrixWorld(),ee.enabled===!0&&ee.isPresenting===!0&&(ee.cameraAutoUpdate===!0&&ee.updateCamera(k),k=ee.getCamera()),b.isScene===!0&&b.onBeforeRender(v,b,k,C),p=_e.get(b,w.length),p.init(k),w.push(p),q.multiplyMatrices(k.projectionMatrix,k.matrixWorldInverse),Ke.setFromProjectionMatrix(q,Bn,k.reversedDepth),j=this.localClippingEnabled,Xe=re.init(this.clippingPlanes,j),m=X.get(b,E.length),m.init(),E.push(m),ee.enabled===!0&&ee.isPresenting===!0){const se=v.xr.getDepthSensingMesh();se!==null&&Ho(se,k,-1/0,v.sortObjects)}Ho(b,k,0,v.sortObjects),m.finish(),v.sortObjects===!0&&m.sort(Z,te),Qe=ee.enabled===!1||ee.isPresenting===!1||ee.hasDepthSensing()===!1,Qe&&Ee.addToRenderList(m,b),this.info.render.frame++,Xe===!0&&re.beginShadows();const G=p.state.shadowsArray;me.render(G,b,k),Xe===!0&&re.endShadows(),this.info.autoReset===!0&&this.info.reset();const W=m.opaque,z=m.transmissive;if(p.setupLights(),k.isArrayCamera){const se=k.cameras;if(z.length>0)for(let de=0,ye=se.length;de<ye;de++){const pe=se[de];qc(W,z,b,pe)}Qe&&Ee.render(b);for(let de=0,ye=se.length;de<ye;de++){const pe=se[de];jc(m,b,pe,pe.viewport)}}else z.length>0&&qc(W,z,b,k),Qe&&Ee.render(b),jc(m,b,k);C!==null&&T===0&&(ke.updateMultisampleRenderTarget(C),ke.updateRenderTargetMipmap(C)),b.isScene===!0&&b.onAfterRender(v,b,k),oe.resetDefaultState(),x=-1,_=null,w.pop(),w.length>0?(p=w[w.length-1],Xe===!0&&re.setGlobalState(v.clippingPlanes,p.state.camera)):p=null,E.pop(),E.length>0?m=E[E.length-1]:m=null};function Ho(b,k,G,W){if(b.visible===!1)return;if(b.layers.test(k.layers)){if(b.isGroup)G=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(k);else if(b.isLight)p.pushLight(b),b.castShadow&&p.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||Ke.intersectsSprite(b)){W&&Te.setFromMatrixPosition(b.matrixWorld).applyMatrix4(q);const de=H.update(b),ye=b.material;ye.visible&&m.push(b,de,ye,G,Te.z,null)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||Ke.intersectsObject(b))){const de=H.update(b),ye=b.material;if(W&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Te.copy(b.boundingSphere.center)):(de.boundingSphere===null&&de.computeBoundingSphere(),Te.copy(de.boundingSphere.center)),Te.applyMatrix4(b.matrixWorld).applyMatrix4(q)),Array.isArray(ye)){const pe=de.groups;for(let Le=0,Oe=pe.length;Le<Oe;Le++){const Re=pe[Le],je=ye[Re.materialIndex];je&&je.visible&&m.push(b,de,je,G,Te.z,Re)}}else ye.visible&&m.push(b,de,ye,G,Te.z,null)}}const se=b.children;for(let de=0,ye=se.length;de<ye;de++)Ho(se[de],k,G,W)}function jc(b,k,G,W){const z=b.opaque,se=b.transmissive,de=b.transparent;p.setupLightsView(G),Xe===!0&&re.setGlobalState(v.clippingPlanes,G),W&&Ae.viewport(R.copy(W)),z.length>0&&Or(z,k,G),se.length>0&&Or(se,k,G),de.length>0&&Or(de,k,G),Ae.buffers.depth.setTest(!0),Ae.buffers.depth.setMask(!0),Ae.buffers.color.setMask(!0),Ae.setPolygonOffset(!1)}function qc(b,k,G,W){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[W.id]===void 0&&(p.state.transmissionRenderTarget[W.id]=new en(1,1,{generateMipmaps:!0,type:Fe.has("EXT_color_buffer_half_float")||Fe.has("EXT_color_buffer_float")?Ot:bn,minFilter:Nn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:qe.workingColorSpace}));const se=p.state.transmissionRenderTarget[W.id],de=W.viewport||R;se.setSize(de.z*v.transmissionResolutionScale,de.w*v.transmissionResolutionScale);const ye=v.getRenderTarget(),pe=v.getActiveCubeFace(),Le=v.getActiveMipmapLevel();v.setRenderTarget(se),v.getClearColor(O),F=v.getClearAlpha(),F<1&&v.setClearColor(16777215,.5),v.clear(),Qe&&Ee.render(G);const Oe=v.toneMapping;v.toneMapping=li;const Re=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),p.setupLightsView(W),Xe===!0&&re.setGlobalState(v.clippingPlanes,W),Or(b,G,W),ke.updateMultisampleRenderTarget(se),ke.updateRenderTargetMipmap(se),Fe.has("WEBGL_multisampled_render_to_texture")===!1){let je=!1;for(let at=0,_t=k.length;at<_t;at++){const dt=k[at],lt=dt.object,Pe=dt.geometry,gt=dt.material,Je=dt.group;if(gt.side===Zt&&lt.layers.test(W.layers)){const ln=gt.side;gt.side=Yt,gt.needsUpdate=!0,Kc(lt,G,W,Pe,gt,Je),gt.side=ln,gt.needsUpdate=!0,je=!0}}je===!0&&(ke.updateMultisampleRenderTarget(se),ke.updateRenderTargetMipmap(se))}v.setRenderTarget(ye,pe,Le),v.setClearColor(O,F),Re!==void 0&&(W.viewport=Re),v.toneMapping=Oe}function Or(b,k,G){const W=k.isScene===!0?k.overrideMaterial:null;for(let z=0,se=b.length;z<se;z++){const de=b[z],ye=de.object,pe=de.geometry,Le=de.group;let Oe=de.material;Oe.allowOverride===!0&&W!==null&&(Oe=W),ye.layers.test(G.layers)&&Kc(ye,k,G,pe,Oe,Le)}}function Kc(b,k,G,W,z,se){b.onBeforeRender(v,k,G,W,z,se),b.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),z.onBeforeRender(v,k,G,W,b,se),z.transparent===!0&&z.side===Zt&&z.forceSinglePass===!1?(z.side=Yt,z.needsUpdate=!0,v.renderBufferDirect(G,k,W,z,b,se),z.side=Yn,z.needsUpdate=!0,v.renderBufferDirect(G,k,W,z,b,se),z.side=Zt):v.renderBufferDirect(G,k,W,z,b,se),b.onAfterRender(v,k,G,W,z,se)}function Fr(b,k,G){k.isScene!==!0&&(k=fe);const W=ve.get(b),z=p.state.lights,se=p.state.shadowsArray,de=z.state.version,ye=Q.getParameters(b,z.state,se,k,G),pe=Q.getProgramCacheKey(ye);let Le=W.programs;W.environment=b.isMeshStandardMaterial?k.environment:null,W.fog=k.fog,W.envMap=(b.isMeshStandardMaterial?ut:xt).get(b.envMap||W.environment),W.envMapRotation=W.environment!==null&&b.envMap===null?k.environmentRotation:b.envMapRotation,Le===void 0&&(b.addEventListener("dispose",K),Le=new Map,W.programs=Le);let Oe=Le.get(pe);if(Oe!==void 0){if(W.currentProgram===Oe&&W.lightsStateVersion===de)return Jc(b,ye),Oe}else ye.uniforms=Q.getUniforms(b),b.onBeforeCompile(ye,v),Oe=Q.acquireProgram(ye,pe),Le.set(pe,Oe),W.uniforms=ye.uniforms;const Re=W.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(Re.clippingPlanes=re.uniform),Jc(b,ye),W.needsLights=Bf(b),W.lightsStateVersion=de,W.needsLights&&(Re.ambientLightColor.value=z.state.ambient,Re.lightProbe.value=z.state.probe,Re.directionalLights.value=z.state.directional,Re.directionalLightShadows.value=z.state.directionalShadow,Re.spotLights.value=z.state.spot,Re.spotLightShadows.value=z.state.spotShadow,Re.rectAreaLights.value=z.state.rectArea,Re.ltc_1.value=z.state.rectAreaLTC1,Re.ltc_2.value=z.state.rectAreaLTC2,Re.pointLights.value=z.state.point,Re.pointLightShadows.value=z.state.pointShadow,Re.hemisphereLights.value=z.state.hemi,Re.directionalShadowMap.value=z.state.directionalShadowMap,Re.directionalShadowMatrix.value=z.state.directionalShadowMatrix,Re.spotShadowMap.value=z.state.spotShadowMap,Re.spotLightMatrix.value=z.state.spotLightMatrix,Re.spotLightMap.value=z.state.spotLightMap,Re.pointShadowMap.value=z.state.pointShadowMap,Re.pointShadowMatrix.value=z.state.pointShadowMatrix),W.currentProgram=Oe,W.uniformsList=null,Oe}function Zc(b){if(b.uniformsList===null){const k=b.currentProgram.getUniforms();b.uniformsList=Ma.seqWithValue(k.seq,b.uniforms)}return b.uniformsList}function Jc(b,k){const G=ve.get(b);G.outputColorSpace=k.outputColorSpace,G.batching=k.batching,G.batchingColor=k.batchingColor,G.instancing=k.instancing,G.instancingColor=k.instancingColor,G.instancingMorph=k.instancingMorph,G.skinning=k.skinning,G.morphTargets=k.morphTargets,G.morphNormals=k.morphNormals,G.morphColors=k.morphColors,G.morphTargetsCount=k.morphTargetsCount,G.numClippingPlanes=k.numClippingPlanes,G.numIntersection=k.numClipIntersection,G.vertexAlphas=k.vertexAlphas,G.vertexTangents=k.vertexTangents,G.toneMapping=k.toneMapping}function Lf(b,k,G,W,z){k.isScene!==!0&&(k=fe),ke.resetTextureUnits();const se=k.fog,de=W.isMeshStandardMaterial?k.environment:null,ye=C===null?v.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:Ft,pe=(W.isMeshStandardMaterial?ut:xt).get(W.envMap||de),Le=W.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Oe=!!G.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),Re=!!G.morphAttributes.position,je=!!G.morphAttributes.normal,at=!!G.morphAttributes.color;let _t=li;W.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(_t=v.toneMapping);const dt=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,lt=dt!==void 0?dt.length:0,Pe=ve.get(W),gt=p.state.lights;if(Xe===!0&&(j===!0||b!==_)){const jt=b===_&&W.id===x;re.setState(W,b,jt)}let Je=!1;W.version===Pe.__version?(Pe.needsLights&&Pe.lightsStateVersion!==gt.state.version||Pe.outputColorSpace!==ye||z.isBatchedMesh&&Pe.batching===!1||!z.isBatchedMesh&&Pe.batching===!0||z.isBatchedMesh&&Pe.batchingColor===!0&&z.colorTexture===null||z.isBatchedMesh&&Pe.batchingColor===!1&&z.colorTexture!==null||z.isInstancedMesh&&Pe.instancing===!1||!z.isInstancedMesh&&Pe.instancing===!0||z.isSkinnedMesh&&Pe.skinning===!1||!z.isSkinnedMesh&&Pe.skinning===!0||z.isInstancedMesh&&Pe.instancingColor===!0&&z.instanceColor===null||z.isInstancedMesh&&Pe.instancingColor===!1&&z.instanceColor!==null||z.isInstancedMesh&&Pe.instancingMorph===!0&&z.morphTexture===null||z.isInstancedMesh&&Pe.instancingMorph===!1&&z.morphTexture!==null||Pe.envMap!==pe||W.fog===!0&&Pe.fog!==se||Pe.numClippingPlanes!==void 0&&(Pe.numClippingPlanes!==re.numPlanes||Pe.numIntersection!==re.numIntersection)||Pe.vertexAlphas!==Le||Pe.vertexTangents!==Oe||Pe.morphTargets!==Re||Pe.morphNormals!==je||Pe.morphColors!==at||Pe.toneMapping!==_t||Pe.morphTargetsCount!==lt)&&(Je=!0):(Je=!0,Pe.__version=W.version);let ln=Pe.currentProgram;Je===!0&&(ln=Fr(W,k,z));let as=!1,cn=!1,Ws=!1;const At=ln.getUniforms(),pn=Pe.uniforms;if(Ae.useProgram(ln.program)&&(as=!0,cn=!0,Ws=!0),W.id!==x&&(x=W.id,cn=!0),as||_!==b){Ae.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),At.setValue(L,"projectionMatrix",b.projectionMatrix),At.setValue(L,"viewMatrix",b.matrixWorldInverse);const tn=At.map.cameraPosition;tn!==void 0&&tn.setValue(L,le.setFromMatrixPosition(b.matrixWorld)),De.logarithmicDepthBuffer&&At.setValue(L,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&At.setValue(L,"isOrthographic",b.isOrthographicCamera===!0),_!==b&&(_=b,cn=!0,Ws=!0)}if(z.isSkinnedMesh){At.setOptional(L,z,"bindMatrix"),At.setOptional(L,z,"bindMatrixInverse");const jt=z.skeleton;jt&&(jt.boneTexture===null&&jt.computeBoneTexture(),At.setValue(L,"boneTexture",jt.boneTexture,ke))}z.isBatchedMesh&&(At.setOptional(L,z,"batchingTexture"),At.setValue(L,"batchingTexture",z._matricesTexture,ke),At.setOptional(L,z,"batchingIdTexture"),At.setValue(L,"batchingIdTexture",z._indirectTexture,ke),At.setOptional(L,z,"batchingColorTexture"),z._colorsTexture!==null&&At.setValue(L,"batchingColorTexture",z._colorsTexture,ke));const mn=G.morphAttributes;if((mn.position!==void 0||mn.normal!==void 0||mn.color!==void 0)&&ie.update(z,G,ln),(cn||Pe.receiveShadow!==z.receiveShadow)&&(Pe.receiveShadow=z.receiveShadow,At.setValue(L,"receiveShadow",z.receiveShadow)),W.isMeshGouraudMaterial&&W.envMap!==null&&(pn.envMap.value=pe,pn.flipEnvMap.value=pe.isCubeTexture&&pe.isRenderTargetTexture===!1?-1:1),W.isMeshStandardMaterial&&W.envMap===null&&k.environment!==null&&(pn.envMapIntensity.value=k.environmentIntensity),cn&&(At.setValue(L,"toneMappingExposure",v.toneMappingExposure),Pe.needsLights&&Nf(pn,Ws),se&&W.fog===!0&&$.refreshFogUniforms(pn,se),$.refreshMaterialUniforms(pn,W,V,Y,p.state.transmissionRenderTarget[b.id]),Ma.upload(L,Zc(Pe),pn,ke)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(Ma.upload(L,Zc(Pe),pn,ke),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&At.setValue(L,"center",z.center),At.setValue(L,"modelViewMatrix",z.modelViewMatrix),At.setValue(L,"normalMatrix",z.normalMatrix),At.setValue(L,"modelMatrix",z.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){const jt=W.uniformsGroups;for(let tn=0,Vo=jt.length;tn<Vo;tn++){const Ti=jt[tn];Ue.update(Ti,ln),Ue.bind(Ti,ln)}}return ln}function Nf(b,k){b.ambientLightColor.needsUpdate=k,b.lightProbe.needsUpdate=k,b.directionalLights.needsUpdate=k,b.directionalLightShadows.needsUpdate=k,b.pointLights.needsUpdate=k,b.pointLightShadows.needsUpdate=k,b.spotLights.needsUpdate=k,b.spotLightShadows.needsUpdate=k,b.rectAreaLights.needsUpdate=k,b.hemisphereLights.needsUpdate=k}function Bf(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return y},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(b,k,G){const W=ve.get(b);W.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,W.__autoAllocateDepthBuffer===!1&&(W.__useRenderToTexture=!1),ve.get(b.texture).__webglTexture=k,ve.get(b.depthTexture).__webglTexture=W.__autoAllocateDepthBuffer?void 0:G,W.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,k){const G=ve.get(b);G.__webglFramebuffer=k,G.__useDefaultFramebuffer=k===void 0};const Uf=L.createFramebuffer();this.setRenderTarget=function(b,k=0,G=0){C=b,y=k,T=G;let W=!0,z=null,se=!1,de=!1;if(b){const pe=ve.get(b);if(pe.__useDefaultFramebuffer!==void 0)Ae.bindFramebuffer(L.FRAMEBUFFER,null),W=!1;else if(pe.__webglFramebuffer===void 0)ke.setupRenderTarget(b);else if(pe.__hasExternalTextures)ke.rebindTextures(b,ve.get(b.texture).__webglTexture,ve.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){const Re=b.depthTexture;if(pe.__boundDepthTexture!==Re){if(Re!==null&&ve.has(Re)&&(b.width!==Re.image.width||b.height!==Re.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");ke.setupDepthRenderbuffer(b)}}const Le=b.texture;(Le.isData3DTexture||Le.isDataArrayTexture||Le.isCompressedArrayTexture)&&(de=!0);const Oe=ve.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Oe[k])?z=Oe[k][G]:z=Oe[k],se=!0):b.samples>0&&ke.useMultisampledRTT(b)===!1?z=ve.get(b).__webglMultisampledFramebuffer:Array.isArray(Oe)?z=Oe[G]:z=Oe,R.copy(b.viewport),P.copy(b.scissor),B=b.scissorTest}else R.copy(ce).multiplyScalar(V).floor(),P.copy(ge).multiplyScalar(V).floor(),B=ze;if(G!==0&&(z=Uf),Ae.bindFramebuffer(L.FRAMEBUFFER,z)&&W&&Ae.drawBuffers(b,z),Ae.viewport(R),Ae.scissor(P),Ae.setScissorTest(B),se){const pe=ve.get(b.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+k,pe.__webglTexture,G)}else if(de){const pe=k;for(let Le=0;Le<b.textures.length;Le++){const Oe=ve.get(b.textures[Le]);L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0+Le,Oe.__webglTexture,G,pe)}}else if(b!==null&&G!==0){const pe=ve.get(b.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,pe.__webglTexture,G)}x=-1},this.readRenderTargetPixels=function(b,k,G,W,z,se,de,ye=0){if(!(b&&b.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let pe=ve.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&de!==void 0&&(pe=pe[de]),pe){Ae.bindFramebuffer(L.FRAMEBUFFER,pe);try{const Le=b.textures[ye],Oe=Le.format,Re=Le.type;if(!De.textureFormatReadable(Oe)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!De.textureTypeReadable(Re)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}k>=0&&k<=b.width-W&&G>=0&&G<=b.height-z&&(b.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+ye),L.readPixels(k,G,W,z,be.convert(Oe),be.convert(Re),se))}finally{const Le=C!==null?ve.get(C).__webglFramebuffer:null;Ae.bindFramebuffer(L.FRAMEBUFFER,Le)}}},this.readRenderTargetPixelsAsync=async function(b,k,G,W,z,se,de,ye=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let pe=ve.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&de!==void 0&&(pe=pe[de]),pe)if(k>=0&&k<=b.width-W&&G>=0&&G<=b.height-z){Ae.bindFramebuffer(L.FRAMEBUFFER,pe);const Le=b.textures[ye],Oe=Le.format,Re=Le.type;if(!De.textureFormatReadable(Oe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!De.textureTypeReadable(Re))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const je=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,je),L.bufferData(L.PIXEL_PACK_BUFFER,se.byteLength,L.STREAM_READ),b.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+ye),L.readPixels(k,G,W,z,be.convert(Oe),be.convert(Re),0);const at=C!==null?ve.get(C).__webglFramebuffer:null;Ae.bindFramebuffer(L.FRAMEBUFFER,at);const _t=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await tp(L,_t,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,je),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,se),L.deleteBuffer(je),L.deleteSync(_t),se}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,k=null,G=0){const W=Math.pow(2,-G),z=Math.floor(b.image.width*W),se=Math.floor(b.image.height*W),de=k!==null?k.x:0,ye=k!==null?k.y:0;ke.setTexture2D(b,0),L.copyTexSubImage2D(L.TEXTURE_2D,G,0,0,de,ye,z,se),Ae.unbindTexture()};const Of=L.createFramebuffer(),Ff=L.createFramebuffer();this.copyTextureToTexture=function(b,k,G=null,W=null,z=0,se=null){se===null&&(z!==0?(Er("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),se=z,z=0):se=0);let de,ye,pe,Le,Oe,Re,je,at,_t;const dt=b.isCompressedTexture?b.mipmaps[se]:b.image;if(G!==null)de=G.max.x-G.min.x,ye=G.max.y-G.min.y,pe=G.isBox3?G.max.z-G.min.z:1,Le=G.min.x,Oe=G.min.y,Re=G.isBox3?G.min.z:0;else{const mn=Math.pow(2,-z);de=Math.floor(dt.width*mn),ye=Math.floor(dt.height*mn),b.isDataArrayTexture?pe=dt.depth:b.isData3DTexture?pe=Math.floor(dt.depth*mn):pe=1,Le=0,Oe=0,Re=0}W!==null?(je=W.x,at=W.y,_t=W.z):(je=0,at=0,_t=0);const lt=be.convert(k.format),Pe=be.convert(k.type);let gt;k.isData3DTexture?(ke.setTexture3D(k,0),gt=L.TEXTURE_3D):k.isDataArrayTexture||k.isCompressedArrayTexture?(ke.setTexture2DArray(k,0),gt=L.TEXTURE_2D_ARRAY):(ke.setTexture2D(k,0),gt=L.TEXTURE_2D),L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,k.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,k.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,k.unpackAlignment);const Je=L.getParameter(L.UNPACK_ROW_LENGTH),ln=L.getParameter(L.UNPACK_IMAGE_HEIGHT),as=L.getParameter(L.UNPACK_SKIP_PIXELS),cn=L.getParameter(L.UNPACK_SKIP_ROWS),Ws=L.getParameter(L.UNPACK_SKIP_IMAGES);L.pixelStorei(L.UNPACK_ROW_LENGTH,dt.width),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,dt.height),L.pixelStorei(L.UNPACK_SKIP_PIXELS,Le),L.pixelStorei(L.UNPACK_SKIP_ROWS,Oe),L.pixelStorei(L.UNPACK_SKIP_IMAGES,Re);const At=b.isDataArrayTexture||b.isData3DTexture,pn=k.isDataArrayTexture||k.isData3DTexture;if(b.isDepthTexture){const mn=ve.get(b),jt=ve.get(k),tn=ve.get(mn.__renderTarget),Vo=ve.get(jt.__renderTarget);Ae.bindFramebuffer(L.READ_FRAMEBUFFER,tn.__webglFramebuffer),Ae.bindFramebuffer(L.DRAW_FRAMEBUFFER,Vo.__webglFramebuffer);for(let Ti=0;Ti<pe;Ti++)At&&(L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,ve.get(b).__webglTexture,z,Re+Ti),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,ve.get(k).__webglTexture,se,_t+Ti)),L.blitFramebuffer(Le,Oe,de,ye,je,at,de,ye,L.DEPTH_BUFFER_BIT,L.NEAREST);Ae.bindFramebuffer(L.READ_FRAMEBUFFER,null),Ae.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(z!==0||b.isRenderTargetTexture||ve.has(b)){const mn=ve.get(b),jt=ve.get(k);Ae.bindFramebuffer(L.READ_FRAMEBUFFER,Of),Ae.bindFramebuffer(L.DRAW_FRAMEBUFFER,Ff);for(let tn=0;tn<pe;tn++)At?L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,mn.__webglTexture,z,Re+tn):L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,mn.__webglTexture,z),pn?L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,jt.__webglTexture,se,_t+tn):L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,jt.__webglTexture,se),z!==0?L.blitFramebuffer(Le,Oe,de,ye,je,at,de,ye,L.COLOR_BUFFER_BIT,L.NEAREST):pn?L.copyTexSubImage3D(gt,se,je,at,_t+tn,Le,Oe,de,ye):L.copyTexSubImage2D(gt,se,je,at,Le,Oe,de,ye);Ae.bindFramebuffer(L.READ_FRAMEBUFFER,null),Ae.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else pn?b.isDataTexture||b.isData3DTexture?L.texSubImage3D(gt,se,je,at,_t,de,ye,pe,lt,Pe,dt.data):k.isCompressedArrayTexture?L.compressedTexSubImage3D(gt,se,je,at,_t,de,ye,pe,lt,dt.data):L.texSubImage3D(gt,se,je,at,_t,de,ye,pe,lt,Pe,dt):b.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,se,je,at,de,ye,lt,Pe,dt.data):b.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,se,je,at,dt.width,dt.height,lt,dt.data):L.texSubImage2D(L.TEXTURE_2D,se,je,at,de,ye,lt,Pe,dt);L.pixelStorei(L.UNPACK_ROW_LENGTH,Je),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,ln),L.pixelStorei(L.UNPACK_SKIP_PIXELS,as),L.pixelStorei(L.UNPACK_SKIP_ROWS,cn),L.pixelStorei(L.UNPACK_SKIP_IMAGES,Ws),se===0&&k.generateMipmaps&&L.generateMipmap(gt),Ae.unbindTexture()},this.initRenderTarget=function(b){ve.get(b).__webglFramebuffer===void 0&&ke.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?ke.setTextureCube(b,0):b.isData3DTexture?ke.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?ke.setTexture2DArray(b,0):ke.setTexture2D(b,0),Ae.unbindTexture()},this.resetState=function(){y=0,T=0,C=null,Ae.reset(),oe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Bn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=qe._getDrawingBufferColorSpace(e),t.unpackColorSpace=qe._getUnpackColorSpace()}}const Cv=Object.freeze(Object.defineProperty({__proto__:null,ACESFilmicToneMapping:ac,AddEquation:_n,AddOperation:Ku,AdditiveAnimationBlendMode:od,AdditiveBlending:Ol,AgXToneMapping:td,AlphaFormat:fc,AlwaysCompare:vd,AlwaysDepth:Pa,AlwaysStencilFunc:Hl,AnimationAction:Kd,AnimationClip:Ao,AnimationMixer:Zd,ArrayCamera:Yd,AttachedBindMode:zl,BackSide:Yt,BasicDepthPacking:cd,Bone:Tc,BooleanKeyframeTrack:is,Box3:Ht,BoxGeometry:ns,BufferAttribute:mt,BufferGeometry:kt,ByteType:cc,Cache:Qn,Camera:Mc,CineonToneMapping:$u,ClampToEdgeWrapping:Ln,Clock:jd,Color:Ce,ColorKeyframeTrack:Pc,ColorManagement:qe,ConstantAlphaFactor:Yu,ConstantColorFactor:Xu,Controls:Jd,CubeCamera:Sc,CubeReflectionMapping:Yi,CubeRefractionMapping:ji,CubeTexture:Ec,CubeUVReflectionMapping:Ir,CubicInterpolant:Ud,CullFaceBack:Ul,CullFaceFront:Nu,CullFaceNone:Lu,CustomBlending:sc,CustomToneMapping:ed,Data3DTexture:Sd,DataArrayTexture:xc,DataTexture:ks,DataTextureLoader:Vd,DataUtils:tr,DefaultLoadingManager:zd,DepthFormat:Ls,DepthStencilFormat:Ki,DepthTexture:Bo,DetachedBindMode:id,DirectionalLight:Nc,DiscreteInterpolant:Od,DoubleSide:Zt,DstAlphaFactor:Ca,DstColorFactor:Ra,EqualCompare:pd,EqualDepth:vr,EquirectangularReflectionMapping:Ps,EquirectangularRefractionMapping:Ua,Euler:kn,EventDispatcher:hi,ExternalTexture:Rc,FileLoader:Fs,Float32BufferAttribute:En,FloatType:Qt,FrontSide:Yn,Frustum:No,GLSL3:Vl,GreaterCompare:md,GreaterDepth:Na,GreaterEqualCompare:Ad,GreaterEqualDepth:La,Group:$t,HalfFloatType:Ot,HemisphereLight:Wd,ImageBitmapLoader:Qd,ImageLoader:Hd,ImageUtils:yd,InstancedBufferAttribute:po,InstancedMesh:Cd,IntType:_o,InterleavedBuffer:Td,InterleavedBufferAttribute:Io,Interpolant:Vs,InterpolateDiscrete:Ns,InterpolateLinear:Bs,InterpolateSmooth:_a,KeepStencilOp:Ni,KeyframeTrack:Tn,Layers:Do,LessCompare:fd,LessDepth:Ia,LessEqualCompare:Ac,LessEqualDepth:Qi,Light:Br,Line:Lr,LineBasicMaterial:zs,LineDashedMaterial:Nd,LineLoop:Rd,LineSegments:wc,LinearFilter:Et,LinearInterpolant:Dc,LinearMipmapLinearFilter:Nn,LinearMipmapNearestFilter:ar,LinearSRGBColorSpace:Ft,LinearToneMapping:Zu,LinearTransfer:yr,Loader:ui,LoaderUtils:ws,LoadingManager:kd,LoopOnce:sd,LoopPingPong:ad,LoopRepeat:rd,MOUSE:oi,Material:Sn,MathUtils:Mt,Matrix3:Ve,Matrix4:Be,MaxEquation:Fu,Mesh:Tt,MeshBasicMaterial:Un,MeshDepthMaterial:Id,MeshDistanceMaterial:Ld,MeshNormalMaterial:Pd,MeshPhysicalMaterial:Hn,MeshStandardMaterial:Nr,MinEquation:Ou,MirroredRepeatWrapping:xr,MixOperation:qu,MultiplyBlending:kl,MultiplyOperation:rc,NearestFilter:Dt,NearestMipmapLinearFilter:Ss,NearestMipmapNearestFilter:lc,NeutralToneMapping:nd,NeverCompare:dd,NeverDepth:Da,NoBlending:Bt,NoColorSpace:ii,NoToneMapping:li,NormalAnimationBlendMode:wo,NormalBlending:Gi,NotEqualCompare:gd,NotEqualDepth:Ba,NumberKeyframeTrack:Zi,Object3D:ft,ObjectSpaceNormalMap:ud,OneFactor:ku,OneMinusConstantAlphaFactor:ju,OneMinusConstantColorFactor:Qu,OneMinusDstAlphaFactor:Vu,OneMinusDstColorFactor:Gu,OneMinusSrcAlphaFactor:wa,OneMinusSrcColorFactor:Hu,OrthographicCamera:Ur,PCFShadowMap:nc,PCFSoftShadowMap:ic,PMREMGenerator:vo,PerspectiveCamera:zt,Plane:xn,PlaneGeometry:Hs,PointLight:Xd,Points:Dd,PointsMaterial:Cc,PropertyBinding:$e,PropertyMixer:qd,Quaternion:on,QuaternionKeyframeTrack:Ji,QuaternionLinearInterpolant:Fd,RED_GREEN_RGTC2_Format:co,RED_RGTC1_Format:oo,REVISION:Pr,RGBADepthPacking:hd,RGBAFormat:an,RGBAIntegerFormat:To,RGBA_ASTC_10x10_Format:to,RGBA_ASTC_10x5_Format:Ja,RGBA_ASTC_10x6_Format:$a,RGBA_ASTC_10x8_Format:eo,RGBA_ASTC_12x10_Format:no,RGBA_ASTC_12x12_Format:io,RGBA_ASTC_4x4_Format:Wa,RGBA_ASTC_5x4_Format:Xa,RGBA_ASTC_5x5_Format:Qa,RGBA_ASTC_6x5_Format:Ya,RGBA_ASTC_6x6_Format:ja,RGBA_ASTC_8x5_Format:qa,RGBA_ASTC_8x6_Format:Ka,RGBA_ASTC_8x8_Format:Za,RGBA_BPTC_Format:so,RGBA_ETC2_EAC_Format:Ga,RGBA_PVRTC_2BPPV1_Format:za,RGBA_PVRTC_4BPPV1_Format:ka,RGBA_S3TC_DXT1_Format:lr,RGBA_S3TC_DXT3_Format:cr,RGBA_S3TC_DXT5_Format:hr,RGBFormat:pc,RGB_BPTC_SIGNED_Format:ro,RGB_BPTC_UNSIGNED_Format:ao,RGB_ETC1_Format:Ha,RGB_ETC2_Format:Va,RGB_PVRTC_2BPPV1_Format:Fa,RGB_PVRTC_4BPPV1_Format:Oa,RGB_S3TC_DXT1_Format:or,RGFormat:mc,RGIntegerFormat:bo,Ray:ts,Raycaster:Oc,RedFormat:So,RedIntegerFormat:Eo,ReinhardToneMapping:Ju,RenderTarget:Md,RepeatWrapping:Fn,ReverseSubtractEquation:Uu,SIGNED_RED_GREEN_RGTC2_Format:ho,SIGNED_RED_RGTC1_Format:lo,SRGBColorSpace:vt,SRGBTransfer:nt,Scene:Po,ShaderChunk:Ge,ShaderLib:Dn,ShaderMaterial:St,ShortType:hc,Skeleton:Lo,SkinnedMesh:wd,Source:Ro,Sphere:zn,Spherical:br,SpotLight:Lc,SrcAlphaFactor:Ta,SrcAlphaSaturateFactor:Wu,SrcColorFactor:zu,StaticDrawUsage:fo,StringKeyframeTrack:ss,SubtractEquation:Bu,SubtractiveBlending:Fl,TOUCH:ri,TangentSpaceNormalMap:Co,Texture:wt,TextureLoader:Gd,Triangle:yn,TriangleFanDrawMode:uo,TriangleStripDrawMode:gc,TrianglesDrawMode:ld,UVMapping:oc,Uint16BufferAttribute:_c,Uint32BufferAttribute:yc,UniformsLib:he,UniformsUtils:Mn,UnsignedByteType:bn,UnsignedInt101111Type:dc,UnsignedInt248Type:qi,UnsignedInt5999Type:uc,UnsignedIntType:Ei,UnsignedShort4444Type:yo,UnsignedShort5551Type:Mo,UnsignedShortType:Is,VSMShadowMap:Gn,Vector2:we,Vector3:I,Vector4:Ze,VectorKeyframeTrack:$i,WebGLCoordinateSystem:Bn,WebGLCubeRenderTarget:bc,WebGLRenderTarget:en,WebGLRenderer:af,WebGLUtils:rf,WebGPUCoordinateSystem:Mr,WebXRController:ya,WrapAroundEnding:_r,ZeroCurvatureEnding:Fi,ZeroFactor:Ms,ZeroSlopeEnding:ki,createCanvasElement:_d},Symbol.toStringTag,{value:"Module"})),ou={type:"change"},kc={type:"start"},of={type:"end"},da=new ts,lu=new xn,Rv=Math.cos(70*Mt.DEG2RAD),Pt=new I,nn=2*Math.PI,ot={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Ml=1e-6;class Dv extends Jd{constructor(e,t=null){super(e,t),this.state=ot.NONE,this.target=new I,this.cursor=new I,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:oi.ROTATE,MIDDLE:oi.DOLLY,RIGHT:oi.PAN},this.touches={ONE:ri.ROTATE,TWO:ri.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new I,this._lastQuaternion=new on,this._lastTargetPosition=new I,this._quat=new on().setFromUnitVectors(e.up,new I(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new br,this._sphericalDelta=new br,this._scale=1,this._panOffset=new I,this._rotateStart=new we,this._rotateEnd=new we,this._rotateDelta=new we,this._panStart=new we,this._panEnd=new we,this._panDelta=new we,this._dollyStart=new we,this._dollyEnd=new we,this._dollyDelta=new we,this._dollyDirection=new I,this._mouse=new we,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Iv.bind(this),this._onPointerDown=Pv.bind(this),this._onPointerUp=Lv.bind(this),this._onContextMenu=zv.bind(this),this._onMouseWheel=Uv.bind(this),this._onKeyDown=Ov.bind(this),this._onTouchStart=Fv.bind(this),this._onTouchMove=kv.bind(this),this._onMouseDown=Nv.bind(this),this._onMouseMove=Bv.bind(this),this._interceptControlDown=Hv.bind(this),this._interceptControlUp=Vv.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(ou),this.update(),this.state=ot.NONE}update(e=null){const t=this.object.position;Pt.copy(t).sub(this.target),Pt.applyQuaternion(this._quat),this._spherical.setFromVector3(Pt),this.autoRotate&&this.state===ot.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,i=this.maxAzimuthAngle;isFinite(n)&&isFinite(i)&&(n<-Math.PI?n+=nn:n>Math.PI&&(n-=nn),i<-Math.PI?i+=nn:i>Math.PI&&(i-=nn),n<=i?this._spherical.theta=Math.max(n,Math.min(i,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+i)/2?Math.max(n,this._spherical.theta):Math.min(i,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(Pt.setFromSpherical(this._spherical),Pt.applyQuaternion(this._quatInverse),t.copy(this.target).add(Pt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){const o=Pt.length();a=this._clampDistance(o*this._scale);const c=o-a;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),r=!!c}else if(this.object.isOrthographicCamera){const o=new I(this._mouse.x,this._mouse.y,0);o.unproject(this.object);const c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=c!==this.object.zoom;const l=new I(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(o),this.object.updateMatrixWorld(),a=Pt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(da.origin.copy(this.object.position),da.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(da.direction))<Rv?this.object.lookAt(this.target):(lu.setFromNormalAndCoplanarPoint(this.object.up,this.target),da.intersectPlane(lu,this.target))))}else if(this.object.isOrthographicCamera){const a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Ml||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Ml||this._lastTargetPosition.distanceToSquared(this.target)>Ml?(this.dispatchEvent(ou),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?nn/60*this.autoRotateSpeed*e:nn/60/60*this.autoRotateSpeed}_getZoomScale(e){const t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Pt.setFromMatrixColumn(t,0),Pt.multiplyScalar(-e),this._panOffset.add(Pt)}_panUp(e,t){this.screenSpacePanning===!0?Pt.setFromMatrixColumn(t,1):(Pt.setFromMatrixColumn(t,0),Pt.crossVectors(this.object.up,Pt)),Pt.multiplyScalar(e),this._panOffset.add(Pt)}_pan(e,t){const n=this.domElement;if(this.object.isPerspectiveCamera){const i=this.object.position;Pt.copy(i).sub(this.target);let r=Pt.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const n=this.domElement.getBoundingClientRect(),i=e-n.left,r=t-n.top,a=n.width,o=n.height;this._mouse.x=i/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const t=this.domElement;this._rotateLeft(nn*this._rotateDelta.x/t.clientHeight),this._rotateUp(nn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(nn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-nn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(nn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-nn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);this._rotateStart.set(n,i)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);this._panStart.set(n,i)}}_handleTouchStartDolly(e){const t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{const n=this._getSecondPointerPosition(e),i=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateEnd.set(i,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const t=this.domElement;this._rotateLeft(nn*this._rotateDelta.x/t.clientHeight),this._rotateUp(nn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),i=.5*(e.pageY+t.y);this._panEnd.set(n,i)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){const t=this._getSecondPointerPosition(e),n=e.pageX-t.x,i=e.pageY-t.y,r=Math.sqrt(n*n+i*i);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new we,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){const t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){const t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}}function Pv(s){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(s.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(s)&&(this._addPointer(s),s.pointerType==="touch"?this._onTouchStart(s):this._onMouseDown(s)))}function Iv(s){this.enabled!==!1&&(s.pointerType==="touch"?this._onTouchMove(s):this._onMouseMove(s))}function Lv(s){switch(this._removePointer(s),this._pointers.length){case 0:this.domElement.releasePointerCapture(s.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(of),this.state=ot.NONE;break;case 1:const e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function Nv(s){let e;switch(s.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case oi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(s),this.state=ot.DOLLY;break;case oi.ROTATE:if(s.ctrlKey||s.metaKey||s.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(s),this.state=ot.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(s),this.state=ot.ROTATE}break;case oi.PAN:if(s.ctrlKey||s.metaKey||s.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(s),this.state=ot.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(s),this.state=ot.PAN}break;default:this.state=ot.NONE}this.state!==ot.NONE&&this.dispatchEvent(kc)}function Bv(s){switch(this.state){case ot.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(s);break;case ot.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(s);break;case ot.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(s);break}}function Uv(s){this.enabled===!1||this.enableZoom===!1||this.state!==ot.NONE||(s.preventDefault(),this.dispatchEvent(kc),this._handleMouseWheel(this._customWheelEvent(s)),this.dispatchEvent(of))}function Ov(s){this.enabled!==!1&&this._handleKeyDown(s)}function Fv(s){switch(this._trackPointer(s),this._pointers.length){case 1:switch(this.touches.ONE){case ri.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(s),this.state=ot.TOUCH_ROTATE;break;case ri.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(s),this.state=ot.TOUCH_PAN;break;default:this.state=ot.NONE}break;case 2:switch(this.touches.TWO){case ri.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(s),this.state=ot.TOUCH_DOLLY_PAN;break;case ri.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(s),this.state=ot.TOUCH_DOLLY_ROTATE;break;default:this.state=ot.NONE}break;default:this.state=ot.NONE}this.state!==ot.NONE&&this.dispatchEvent(kc)}function kv(s){switch(this._trackPointer(s),this.state){case ot.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(s),this.update();break;case ot.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(s),this.update();break;case ot.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(s),this.update();break;case ot.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(s),this.update();break;default:this.state=ot.NONE}}function zv(s){this.enabled!==!1&&s.preventDefault()}function Hv(s){s.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Vv(s){s.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function cu(s,e){if(e===ld)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),s;if(e===uo||e===gc){let t=s.getIndex();if(t===null){const a=[],o=s.getAttribute("position");if(o!==void 0){for(let c=0;c<o.count;c++)a.push(c);s.setIndex(a),t=s.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),s}const n=t.count-2,i=[];if(e===uo)for(let a=1;a<=n;a++)i.push(t.getX(0)),i.push(t.getX(a)),i.push(t.getX(a+1));else for(let a=0;a<n;a++)a%2===0?(i.push(t.getX(a)),i.push(t.getX(a+1)),i.push(t.getX(a+2))):(i.push(t.getX(a+2)),i.push(t.getX(a+1)),i.push(t.getX(a)));i.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const r=s.clone();return r.setIndex(i),r.clearGroups(),r}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),s}class Gv extends ui{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new jv(t)}),this.register(function(t){return new qv(t)}),this.register(function(t){return new sx(t)}),this.register(function(t){return new rx(t)}),this.register(function(t){return new ax(t)}),this.register(function(t){return new Zv(t)}),this.register(function(t){return new Jv(t)}),this.register(function(t){return new $v(t)}),this.register(function(t){return new ex(t)}),this.register(function(t){return new Yv(t)}),this.register(function(t){return new tx(t)}),this.register(function(t){return new Kv(t)}),this.register(function(t){return new ix(t)}),this.register(function(t){return new nx(t)}),this.register(function(t){return new Xv(t)}),this.register(function(t){return new ox(t)}),this.register(function(t){return new lx(t)})}load(e,t,n,i){const r=this;let a;if(this.resourcePath!=="")a=this.resourcePath;else if(this.path!==""){const l=ws.extractUrlBase(e);a=ws.resolveURL(l,this.path)}else a=ws.extractUrlBase(e);this.manager.itemStart(e);const o=function(l){i?i(l):console.error(l),r.manager.itemError(e),r.manager.itemEnd(e)},c=new Fs(this.manager);c.setPath(this.path),c.setResponseType("arraybuffer"),c.setRequestHeader(this.requestHeader),c.setWithCredentials(this.withCredentials),c.load(e,function(l){try{r.parse(l,a,function(h){t(h),r.manager.itemEnd(e)},o)}catch(h){o(h)}},n,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,i){let r;const a={},o={},c=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(c.decode(new Uint8Array(e,0,4))===lf){try{a[Ye.KHR_BINARY_GLTF]=new cx(e)}catch(u){i&&i(u);return}r=JSON.parse(a[Ye.KHR_BINARY_GLTF].content)}else r=JSON.parse(c.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){i&&i(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const l=new Mx(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){const u=this.pluginCallbacks[h](l);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[u.name]=u,a[u.name]=!0}if(r.extensionsUsed)for(let h=0;h<r.extensionsUsed.length;++h){const u=r.extensionsUsed[h],d=r.extensionsRequired||[];switch(u){case Ye.KHR_MATERIALS_UNLIT:a[u]=new Qv;break;case Ye.KHR_DRACO_MESH_COMPRESSION:a[u]=new hx(r,this.dracoLoader);break;case Ye.KHR_TEXTURE_TRANSFORM:a[u]=new ux;break;case Ye.KHR_MESH_QUANTIZATION:a[u]=new dx;break;default:d.indexOf(u)>=0&&o[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}l.setExtensions(a),l.setPlugins(o),l.parse(n,i)}parseAsync(e,t){const n=this;return new Promise(function(i,r){n.parse(e,t,i,r)})}}function Wv(){let s={};return{get:function(e){return s[e]},add:function(e,t){s[e]=t},remove:function(e){delete s[e]},removeAll:function(){s={}}}}const Ye={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class Xv{constructor(e){this.parser=e,this.name=Ye.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let n=0,i=t.length;n<i;n++){const r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){const t=this.parser,n="light:"+e;let i=t.cache.get(n);if(i)return i;const r=t.json,c=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e];let l;const h=new Ce(16777215);c.color!==void 0&&h.setRGB(c.color[0],c.color[1],c.color[2],Ft);const u=c.range!==void 0?c.range:0;switch(c.type){case"directional":l=new Nc(h),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new Xd(h),l.distance=u;break;case"spot":l=new Lc(h),l.distance=u,c.spot=c.spot||{},c.spot.innerConeAngle=c.spot.innerConeAngle!==void 0?c.spot.innerConeAngle:0,c.spot.outerConeAngle=c.spot.outerConeAngle!==void 0?c.spot.outerConeAngle:Math.PI/4,l.angle=c.spot.outerConeAngle,l.penumbra=1-c.spot.innerConeAngle/c.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+c.type)}return l.position.set(0,0,0),Wn(l,c),c.intensity!==void 0&&(l.intensity=c.intensity),l.name=t.createUniqueName(c.name||"light_"+e),i=Promise.resolve(l),t.cache.add(n,i),i}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,n=this.parser,r=n.json.nodes[e],o=(r.extensions&&r.extensions[this.name]||{}).light;return o===void 0?null:this._loadLight(o).then(function(c){return n._getNodeRef(t.cache,o,c)})}}class Qv{constructor(){this.name=Ye.KHR_MATERIALS_UNLIT}getMaterialType(){return Un}extendParams(e,t,n){const i=[];e.color=new Ce(1,1,1),e.opacity=1;const r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){const a=r.baseColorFactor;e.color.setRGB(a[0],a[1],a[2],Ft),e.opacity=a[3]}r.baseColorTexture!==void 0&&i.push(n.assignTexture(e,"map",r.baseColorTexture,vt))}return Promise.all(i)}}class Yv{constructor(e){this.parser=e,this.name=Ye.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=i.extensions[this.name].emissiveStrength;return r!==void 0&&(t.emissiveIntensity=r),Promise.resolve()}}class jv{constructor(e){this.parser=e,this.name=Ye.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Hn}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];if(a.clearcoatFactor!==void 0&&(t.clearcoat=a.clearcoatFactor),a.clearcoatTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatMap",a.clearcoatTexture)),a.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=a.clearcoatRoughnessFactor),a.clearcoatRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatRoughnessMap",a.clearcoatRoughnessTexture)),a.clearcoatNormalTexture!==void 0&&(r.push(n.assignTexture(t,"clearcoatNormalMap",a.clearcoatNormalTexture)),a.clearcoatNormalTexture.scale!==void 0)){const o=a.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new we(o,o)}return Promise.all(r)}}class qv{constructor(e){this.parser=e,this.name=Ye.KHR_MATERIALS_DISPERSION}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Hn}extendMaterialParams(e,t){const i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=i.extensions[this.name];return t.dispersion=r.dispersion!==void 0?r.dispersion:0,Promise.resolve()}}class Kv{constructor(e){this.parser=e,this.name=Ye.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Hn}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];return a.iridescenceFactor!==void 0&&(t.iridescence=a.iridescenceFactor),a.iridescenceTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceMap",a.iridescenceTexture)),a.iridescenceIor!==void 0&&(t.iridescenceIOR=a.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),a.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=a.iridescenceThicknessMinimum),a.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=a.iridescenceThicknessMaximum),a.iridescenceThicknessTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceThicknessMap",a.iridescenceThicknessTexture)),Promise.all(r)}}class Zv{constructor(e){this.parser=e,this.name=Ye.KHR_MATERIALS_SHEEN}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Hn}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[];t.sheenColor=new Ce(0,0,0),t.sheenRoughness=0,t.sheen=1;const a=i.extensions[this.name];if(a.sheenColorFactor!==void 0){const o=a.sheenColorFactor;t.sheenColor.setRGB(o[0],o[1],o[2],Ft)}return a.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=a.sheenRoughnessFactor),a.sheenColorTexture!==void 0&&r.push(n.assignTexture(t,"sheenColorMap",a.sheenColorTexture,vt)),a.sheenRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"sheenRoughnessMap",a.sheenRoughnessTexture)),Promise.all(r)}}class Jv{constructor(e){this.parser=e,this.name=Ye.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Hn}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];return a.transmissionFactor!==void 0&&(t.transmission=a.transmissionFactor),a.transmissionTexture!==void 0&&r.push(n.assignTexture(t,"transmissionMap",a.transmissionTexture)),Promise.all(r)}}class $v{constructor(e){this.parser=e,this.name=Ye.KHR_MATERIALS_VOLUME}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Hn}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];t.thickness=a.thicknessFactor!==void 0?a.thicknessFactor:0,a.thicknessTexture!==void 0&&r.push(n.assignTexture(t,"thicknessMap",a.thicknessTexture)),t.attenuationDistance=a.attenuationDistance||1/0;const o=a.attenuationColor||[1,1,1];return t.attenuationColor=new Ce().setRGB(o[0],o[1],o[2],Ft),Promise.all(r)}}class ex{constructor(e){this.parser=e,this.name=Ye.KHR_MATERIALS_IOR}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Hn}extendMaterialParams(e,t){const i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=i.extensions[this.name];return t.ior=r.ior!==void 0?r.ior:1.5,Promise.resolve()}}class tx{constructor(e){this.parser=e,this.name=Ye.KHR_MATERIALS_SPECULAR}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Hn}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];t.specularIntensity=a.specularFactor!==void 0?a.specularFactor:1,a.specularTexture!==void 0&&r.push(n.assignTexture(t,"specularIntensityMap",a.specularTexture));const o=a.specularColorFactor||[1,1,1];return t.specularColor=new Ce().setRGB(o[0],o[1],o[2],Ft),a.specularColorTexture!==void 0&&r.push(n.assignTexture(t,"specularColorMap",a.specularColorTexture,vt)),Promise.all(r)}}class nx{constructor(e){this.parser=e,this.name=Ye.EXT_MATERIALS_BUMP}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Hn}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];return t.bumpScale=a.bumpFactor!==void 0?a.bumpFactor:1,a.bumpTexture!==void 0&&r.push(n.assignTexture(t,"bumpMap",a.bumpTexture)),Promise.all(r)}}class ix{constructor(e){this.parser=e,this.name=Ye.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:Hn}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const r=[],a=i.extensions[this.name];return a.anisotropyStrength!==void 0&&(t.anisotropy=a.anisotropyStrength),a.anisotropyRotation!==void 0&&(t.anisotropyRotation=a.anisotropyRotation),a.anisotropyTexture!==void 0&&r.push(n.assignTexture(t,"anisotropyMap",a.anisotropyTexture)),Promise.all(r)}}class sx{constructor(e){this.parser=e,this.name=Ye.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,n=t.json,i=n.textures[e];if(!i.extensions||!i.extensions[this.name])return null;const r=i.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,a)}}class rx{constructor(e){this.parser=e,this.name=Ye.EXT_TEXTURE_WEBP}loadTexture(e){const t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;const a=r.extensions[t],o=i.images[a.source];let c=n.textureLoader;if(o.uri){const l=n.options.manager.getHandler(o.uri);l!==null&&(c=l)}return n.loadTextureImage(e,a.source,c)}}class ax{constructor(e){this.parser=e,this.name=Ye.EXT_TEXTURE_AVIF}loadTexture(e){const t=this.name,n=this.parser,i=n.json,r=i.textures[e];if(!r.extensions||!r.extensions[t])return null;const a=r.extensions[t],o=i.images[a.source];let c=n.textureLoader;if(o.uri){const l=n.options.manager.getHandler(o.uri);l!==null&&(c=l)}return n.loadTextureImage(e,a.source,c)}}class ox{constructor(e){this.name=Ye.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){const t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){const i=n.extensions[this.name],r=this.parser.getDependency("buffer",i.buffer),a=this.parser.options.meshoptDecoder;if(!a||!a.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(o){const c=i.byteOffset||0,l=i.byteLength||0,h=i.count,u=i.byteStride,d=new Uint8Array(o,c,l);return a.decodeGltfBufferAsync?a.decodeGltfBufferAsync(h,u,d,i.mode,i.filter).then(function(f){return f.buffer}):a.ready.then(function(){const f=new ArrayBuffer(h*u);return a.decodeGltfBuffer(new Uint8Array(f),h,u,d,i.mode,i.filter),f})})}else return null}}class lx{constructor(e){this.name=Ye.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;const i=t.meshes[n.mesh];for(const l of i.primitives)if(l.mode!==An.TRIANGLES&&l.mode!==An.TRIANGLE_STRIP&&l.mode!==An.TRIANGLE_FAN&&l.mode!==void 0)return null;const a=n.extensions[this.name].attributes,o=[],c={};for(const l in a)o.push(this.parser.getDependency("accessor",a[l]).then(h=>(c[l]=h,c[l])));return o.length<1?null:(o.push(this.parser.createNodeMesh(e)),Promise.all(o).then(l=>{const h=l.pop(),u=h.isGroup?h.children:[h],d=l[0].count,f=[];for(const g of u){const A=new Be,m=new I,p=new on,E=new I(1,1,1),w=new Cd(g.geometry,g.material,d);for(let v=0;v<d;v++)c.TRANSLATION&&m.fromBufferAttribute(c.TRANSLATION,v),c.ROTATION&&p.fromBufferAttribute(c.ROTATION,v),c.SCALE&&E.fromBufferAttribute(c.SCALE,v),w.setMatrixAt(v,A.compose(m,p,E));for(const v in c)if(v==="_COLOR_0"){const M=c[v];w.instanceColor=new po(M.array,M.itemSize,M.normalized)}else v!=="TRANSLATION"&&v!=="ROTATION"&&v!=="SCALE"&&g.geometry.setAttribute(v,c[v]);ft.prototype.copy.call(w,g),this.parser.assignFinalMaterial(w),f.push(w)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}}const lf="glTF",$s=12,hu={JSON:1313821514,BIN:5130562};class cx{constructor(e){this.name=Ye.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,$s),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==lf)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const i=this.header.length-$s,r=new DataView(e,$s);let a=0;for(;a<i;){const o=r.getUint32(a,!0);a+=4;const c=r.getUint32(a,!0);if(a+=4,c===hu.JSON){const l=new Uint8Array(e,$s+a,o);this.content=n.decode(l)}else if(c===hu.BIN){const l=$s+a;this.body=e.slice(l,l+o)}a+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class hx{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Ye.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const n=this.json,i=this.dracoLoader,r=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},c={},l={};for(const h in a){const u=Ql[h]||h.toLowerCase();o[u]=a[h]}for(const h in e.attributes){const u=Ql[h]||h.toLowerCase();if(a[h]!==void 0){const d=n.accessors[e.attributes[h]],f=Cs[d.componentType];l[u]=f.name,c[u]=d.normalized===!0}}return t.getDependency("bufferView",r).then(function(h){return new Promise(function(u,d){i.decodeDracoFile(h,function(f){for(const g in f.attributes){const A=f.attributes[g],m=c[g];m!==void 0&&(A.normalized=m)}u(f)},o,l,Ft,d)})})}}class ux{constructor(){this.name=Ye.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}}class dx{constructor(){this.name=Ye.KHR_MESH_QUANTIZATION}}class cf extends Vs{constructor(e,t,n,i){super(e,t,n,i)}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i*3+i;for(let a=0;a!==i;a++)t[a]=n[r+a];return t}interpolate_(e,t,n,i){const r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=o*2,l=o*3,h=i-t,u=(n-t)/h,d=u*u,f=d*u,g=e*l,A=g-l,m=-2*f+3*d,p=f-d,E=1-m,w=p-d+u;for(let v=0;v!==o;v++){const M=a[A+v+o],y=a[A+v+c]*h,T=a[g+v+o],C=a[g+v]*h;r[v]=E*M+w*y+m*T+p*C}return r}}const fx=new on;class px extends cf{interpolate_(e,t,n,i){const r=super.interpolate_(e,t,n,i);return fx.fromArray(r).normalize().toArray(r),r}}const An={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},Cs={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},uu={9728:Dt,9729:Et,9984:lc,9985:ar,9986:Ss,9987:Nn},du={33071:Ln,33648:xr,10497:Fn},Sl={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Ql={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},vi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},mx={CUBICSPLINE:void 0,LINEAR:Bs,STEP:Ns},El={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function gx(s){return s.DefaultMaterial===void 0&&(s.DefaultMaterial=new Nr({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Yn})),s.DefaultMaterial}function Li(s,e,t){for(const n in t.extensions)s[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function Wn(s,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(s.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Ax(s,e,t){let n=!1,i=!1,r=!1;for(let l=0,h=e.length;l<h;l++){const u=e[l];if(u.POSITION!==void 0&&(n=!0),u.NORMAL!==void 0&&(i=!0),u.COLOR_0!==void 0&&(r=!0),n&&i&&r)break}if(!n&&!i&&!r)return Promise.resolve(s);const a=[],o=[],c=[];for(let l=0,h=e.length;l<h;l++){const u=e[l];if(n){const d=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):s.attributes.position;a.push(d)}if(i){const d=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):s.attributes.normal;o.push(d)}if(r){const d=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):s.attributes.color;c.push(d)}}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(c)]).then(function(l){const h=l[0],u=l[1],d=l[2];return n&&(s.morphAttributes.position=h),i&&(s.morphAttributes.normal=u),r&&(s.morphAttributes.color=d),s.morphTargetsRelative=!0,s})}function vx(s,e){if(s.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)s.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(s.morphTargetInfluences.length===t.length){s.morphTargetDictionary={};for(let n=0,i=t.length;n<i;n++)s.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function xx(s){let e;const t=s.extensions&&s.extensions[Ye.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+bl(t.attributes):e=s.indices+":"+bl(s.attributes)+":"+s.mode,s.targets!==void 0)for(let n=0,i=s.targets.length;n<i;n++)e+=":"+bl(s.targets[n]);return e}function bl(s){let e="";const t=Object.keys(s).sort();for(let n=0,i=t.length;n<i;n++)e+=t[n]+":"+s[t[n]]+";";return e}function Yl(s){switch(s){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function _x(s){return s.search(/\.jpe?g($|\?)/i)>0||s.search(/^data\:image\/jpeg/)===0?"image/jpeg":s.search(/\.webp($|\?)/i)>0||s.search(/^data\:image\/webp/)===0?"image/webp":s.search(/\.ktx2($|\?)/i)>0||s.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}const yx=new Be;class Mx{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new Wv,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,r=!1,a=-1;if(typeof navigator<"u"){const o=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(o)===!0;const c=o.match(/Version\/(\d+)/);i=n&&c?parseInt(c[1],10):-1,r=o.indexOf("Firefox")>-1,a=r?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&i<17||r&&a<98?this.textureLoader=new Gd(this.options.manager):this.textureLoader=new Qd(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Fs(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const n=this,i=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(a){return a._markDefs&&a._markDefs()}),Promise.all(this._invokeAll(function(a){return a.beforeRoot&&a.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(a){const o={scene:a[0][i.scene||0],scenes:a[0],animations:a[1],cameras:a[2],asset:i.asset,parser:n,userData:{}};return Li(r,o,i),Wn(o,i),Promise.all(n._invokeAll(function(c){return c.afterRoot&&c.afterRoot(o)})).then(function(){for(const c of o.scenes)c.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let i=0,r=t.length;i<r;i++){const a=t[i].joints;for(let o=0,c=a.length;o<c;o++)e[a[o]].isBone=!0}for(let i=0,r=e.length;i<r;i++){const a=e[i];a.mesh!==void 0&&(this._addNodeRef(this.meshCache,a.mesh),a.skin!==void 0&&(n[a.mesh].isSkinnedMesh=!0)),a.camera!==void 0&&this._addNodeRef(this.cameraCache,a.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;const i=n.clone(),r=(a,o)=>{const c=this.associations.get(a);c!=null&&this.associations.set(o,c);for(const[l,h]of a.children.entries())r(h,o.children[l])};return r(n,i),i.name+="_instance_"+e.uses[t]++,i}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){const i=e(t[n]);if(i)return i}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const n=[];for(let i=0;i<t.length;i++){const r=e(t[i]);r&&n.push(r)}return n}getDependency(e,t){const n=e+":"+t;let i=this.cache.get(n);if(!i){switch(e){case"scene":i=this.loadScene(t);break;case"node":i=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":i=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":i=this.loadAccessor(t);break;case"bufferView":i=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":i=this.loadBuffer(t);break;case"material":i=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":i=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":i=this.loadSkin(t);break;case"animation":i=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":i=this.loadCamera(t);break;default:if(i=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!i)throw new Error("Unknown type: "+e);break}this.cache.add(n,i)}return i}getDependencies(e){let t=this.cache.get(e);if(!t){const n=this,i=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(i.map(function(r,a){return n.getDependency(e,a)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[Ye.KHR_BINARY_GLTF].body);const i=this.options;return new Promise(function(r,a){n.load(ws.resolveURL(t.uri,i.path),r,void 0,function(){a(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){const i=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+i)})}loadAccessor(e){const t=this,n=this.json,i=this.json.accessors[e];if(i.bufferView===void 0&&i.sparse===void 0){const a=Sl[i.type],o=Cs[i.componentType],c=i.normalized===!0,l=new o(i.count*a);return Promise.resolve(new mt(l,a,c))}const r=[];return i.bufferView!==void 0?r.push(this.getDependency("bufferView",i.bufferView)):r.push(null),i.sparse!==void 0&&(r.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",i.sparse.values.bufferView))),Promise.all(r).then(function(a){const o=a[0],c=Sl[i.type],l=Cs[i.componentType],h=l.BYTES_PER_ELEMENT,u=h*c,d=i.byteOffset||0,f=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,g=i.normalized===!0;let A,m;if(f&&f!==u){const p=Math.floor(d/f),E="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+p+":"+i.count;let w=t.cache.get(E);w||(A=new l(o,p*f,i.count*f/h),w=new Td(A,f/h),t.cache.add(E,w)),m=new Io(w,c,d%f/h,g)}else o===null?A=new l(i.count*c):A=new l(o,d,i.count*c),m=new mt(A,c,g);if(i.sparse!==void 0){const p=Sl.SCALAR,E=Cs[i.sparse.indices.componentType],w=i.sparse.indices.byteOffset||0,v=i.sparse.values.byteOffset||0,M=new E(a[1],w,i.sparse.count*p),y=new l(a[2],v,i.sparse.count*c);o!==null&&(m=new mt(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let T=0,C=M.length;T<C;T++){const x=M[T];if(m.setX(x,y[T*c]),c>=2&&m.setY(x,y[T*c+1]),c>=3&&m.setZ(x,y[T*c+2]),c>=4&&m.setW(x,y[T*c+3]),c>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=g}return m})}loadTexture(e){const t=this.json,n=this.options,r=t.textures[e].source,a=t.images[r];let o=this.textureLoader;if(a.uri){const c=n.manager.getHandler(a.uri);c!==null&&(o=c)}return this.loadTextureImage(e,r,o)}loadTextureImage(e,t,n){const i=this,r=this.json,a=r.textures[e],o=r.images[t],c=(o.uri||o.bufferView)+":"+a.sampler;if(this.textureCache[c])return this.textureCache[c];const l=this.loadImageSource(t,n).then(function(h){h.flipY=!1,h.name=a.name||o.name||"",h.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(h.name=o.uri);const d=(r.samplers||{})[a.sampler]||{};return h.magFilter=uu[d.magFilter]||Et,h.minFilter=uu[d.minFilter]||Nn,h.wrapS=du[d.wrapS]||Fn,h.wrapT=du[d.wrapT]||Fn,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==Dt&&h.minFilter!==Et,i.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[c]=l,l}loadImageSource(e,t){const n=this,i=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());const a=i.images[e],o=self.URL||self.webkitURL;let c=a.uri||"",l=!1;if(a.bufferView!==void 0)c=n.getDependency("bufferView",a.bufferView).then(function(u){l=!0;const d=new Blob([u],{type:a.mimeType});return c=o.createObjectURL(d),c});else if(a.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");const h=Promise.resolve(c).then(function(u){return new Promise(function(d,f){let g=d;t.isImageBitmapLoader===!0&&(g=function(A){const m=new wt(A);m.needsUpdate=!0,d(m)}),t.load(ws.resolveURL(u,r.path),g,void 0,f)})}).then(function(u){return l===!0&&o.revokeObjectURL(c),Wn(u,a),u.userData.mimeType=a.mimeType||_x(a.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",c),u});return this.sourceCache[e]=h,h}assignTexture(e,t,n,i){const r=this;return this.getDependency("texture",n.index).then(function(a){if(!a)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(a=a.clone(),a.channel=n.texCoord),r.extensions[Ye.KHR_TEXTURE_TRANSFORM]){const o=n.extensions!==void 0?n.extensions[Ye.KHR_TEXTURE_TRANSFORM]:void 0;if(o){const c=r.associations.get(a);a=r.extensions[Ye.KHR_TEXTURE_TRANSFORM].extendTexture(a,o),r.associations.set(a,c)}}return i!==void 0&&(a.colorSpace=i),e[t]=a,a})}assignFinalMaterial(e){const t=e.geometry;let n=e.material;const i=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){const o="PointsMaterial:"+n.uuid;let c=this.cache.get(o);c||(c=new Cc,Sn.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,c.sizeAttenuation=!1,this.cache.add(o,c)),n=c}else if(e.isLine){const o="LineBasicMaterial:"+n.uuid;let c=this.cache.get(o);c||(c=new zs,Sn.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,this.cache.add(o,c)),n=c}if(i||r||a){let o="ClonedMaterial:"+n.uuid+":";i&&(o+="derivative-tangents:"),r&&(o+="vertex-colors:"),a&&(o+="flat-shading:");let c=this.cache.get(o);c||(c=n.clone(),r&&(c.vertexColors=!0),a&&(c.flatShading=!0),i&&(c.normalScale&&(c.normalScale.y*=-1),c.clearcoatNormalScale&&(c.clearcoatNormalScale.y*=-1)),this.cache.add(o,c),this.associations.set(c,this.associations.get(n))),n=c}e.material=n}getMaterialType(){return Nr}loadMaterial(e){const t=this,n=this.json,i=this.extensions,r=n.materials[e];let a;const o={},c=r.extensions||{},l=[];if(c[Ye.KHR_MATERIALS_UNLIT]){const u=i[Ye.KHR_MATERIALS_UNLIT];a=u.getMaterialType(),l.push(u.extendParams(o,r,t))}else{const u=r.pbrMetallicRoughness||{};if(o.color=new Ce(1,1,1),o.opacity=1,Array.isArray(u.baseColorFactor)){const d=u.baseColorFactor;o.color.setRGB(d[0],d[1],d[2],Ft),o.opacity=d[3]}u.baseColorTexture!==void 0&&l.push(t.assignTexture(o,"map",u.baseColorTexture,vt)),o.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,o.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(l.push(t.assignTexture(o,"metalnessMap",u.metallicRoughnessTexture)),l.push(t.assignTexture(o,"roughnessMap",u.metallicRoughnessTexture))),a=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),l.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,o)})))}r.doubleSided===!0&&(o.side=Zt);const h=r.alphaMode||El.OPAQUE;if(h===El.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,h===El.MASK&&(o.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&a!==Un&&(l.push(t.assignTexture(o,"normalMap",r.normalTexture)),o.normalScale=new we(1,1),r.normalTexture.scale!==void 0)){const u=r.normalTexture.scale;o.normalScale.set(u,u)}if(r.occlusionTexture!==void 0&&a!==Un&&(l.push(t.assignTexture(o,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&a!==Un){const u=r.emissiveFactor;o.emissive=new Ce().setRGB(u[0],u[1],u[2],Ft)}return r.emissiveTexture!==void 0&&a!==Un&&l.push(t.assignTexture(o,"emissiveMap",r.emissiveTexture,vt)),Promise.all(l).then(function(){const u=new a(o);return r.name&&(u.name=r.name),Wn(u,r),t.associations.set(u,{materials:e}),r.extensions&&Li(i,u,r),u})}createUniqueName(e){const t=$e.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,n=this.extensions,i=this.primitiveCache;function r(o){return n[Ye.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(c){return fu(c,o,t)})}const a=[];for(let o=0,c=e.length;o<c;o++){const l=e[o],h=xx(l),u=i[h];if(u)a.push(u.promise);else{let d;l.extensions&&l.extensions[Ye.KHR_DRACO_MESH_COMPRESSION]?d=r(l):d=fu(new kt,l,t),i[h]={primitive:l,promise:d},a.push(d)}}return Promise.all(a)}loadMesh(e){const t=this,n=this.json,i=this.extensions,r=n.meshes[e],a=r.primitives,o=[];for(let c=0,l=a.length;c<l;c++){const h=a[c].material===void 0?gx(this.cache):this.getDependency("material",a[c].material);o.push(h)}return o.push(t.loadGeometries(a)),Promise.all(o).then(function(c){const l=c.slice(0,c.length-1),h=c[c.length-1],u=[];for(let f=0,g=h.length;f<g;f++){const A=h[f],m=a[f];let p;const E=l[f];if(m.mode===An.TRIANGLES||m.mode===An.TRIANGLE_STRIP||m.mode===An.TRIANGLE_FAN||m.mode===void 0)p=r.isSkinnedMesh===!0?new wd(A,E):new Tt(A,E),p.isSkinnedMesh===!0&&p.normalizeSkinWeights(),m.mode===An.TRIANGLE_STRIP?p.geometry=cu(p.geometry,gc):m.mode===An.TRIANGLE_FAN&&(p.geometry=cu(p.geometry,uo));else if(m.mode===An.LINES)p=new wc(A,E);else if(m.mode===An.LINE_STRIP)p=new Lr(A,E);else if(m.mode===An.LINE_LOOP)p=new Rd(A,E);else if(m.mode===An.POINTS)p=new Dd(A,E);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(p.geometry.morphAttributes).length>0&&vx(p,r),p.name=t.createUniqueName(r.name||"mesh_"+e),Wn(p,r),m.extensions&&Li(i,p,m),t.assignFinalMaterial(p),u.push(p)}for(let f=0,g=u.length;f<g;f++)t.associations.set(u[f],{meshes:e,primitives:f});if(u.length===1)return r.extensions&&Li(i,u[0],r),u[0];const d=new $t;r.extensions&&Li(i,d,r),t.associations.set(d,{meshes:e});for(let f=0,g=u.length;f<g;f++)d.add(u[f]);return d})}loadCamera(e){let t;const n=this.json.cameras[e],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new zt(Mt.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2e6):n.type==="orthographic"&&(t=new Ur(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),Wn(t,n),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],n=[];for(let i=0,r=t.joints.length;i<r;i++)n.push(this._loadNodeShallow(t.joints[i]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(i){const r=i.pop(),a=i,o=[],c=[];for(let l=0,h=a.length;l<h;l++){const u=a[l];if(u){o.push(u);const d=new Be;r!==null&&d.fromArray(r.array,l*16),c.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[l])}return new Lo(o,c)})}loadAnimation(e){const t=this.json,n=this,i=t.animations[e],r=i.name?i.name:"animation_"+e,a=[],o=[],c=[],l=[],h=[];for(let u=0,d=i.channels.length;u<d;u++){const f=i.channels[u],g=i.samplers[f.sampler],A=f.target,m=A.node,p=i.parameters!==void 0?i.parameters[g.input]:g.input,E=i.parameters!==void 0?i.parameters[g.output]:g.output;A.node!==void 0&&(a.push(this.getDependency("node",m)),o.push(this.getDependency("accessor",p)),c.push(this.getDependency("accessor",E)),l.push(g),h.push(A))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(c),Promise.all(l),Promise.all(h)]).then(function(u){const d=u[0],f=u[1],g=u[2],A=u[3],m=u[4],p=[];for(let w=0,v=d.length;w<v;w++){const M=d[w],y=f[w],T=g[w],C=A[w],x=m[w];if(M===void 0)continue;M.updateMatrix&&M.updateMatrix();const _=n._createAnimationTracks(M,y,T,C,x);if(_)for(let R=0;R<_.length;R++)p.push(_[R])}const E=new Ao(r,void 0,p);return Wn(E,i),E})}createNodeMesh(e){const t=this.json,n=this,i=t.nodes[e];return i.mesh===void 0?null:n.getDependency("mesh",i.mesh).then(function(r){const a=n._getNodeRef(n.meshCache,i.mesh,r);return i.weights!==void 0&&a.traverse(function(o){if(o.isMesh)for(let c=0,l=i.weights.length;c<l;c++)o.morphTargetInfluences[c]=i.weights[c]}),a})}loadNode(e){const t=this.json,n=this,i=t.nodes[e],r=n._loadNodeShallow(e),a=[],o=i.children||[];for(let l=0,h=o.length;l<h;l++)a.push(n.getDependency("node",o[l]));const c=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([r,Promise.all(a),c]).then(function(l){const h=l[0],u=l[1],d=l[2];d!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(d,yx)});for(let f=0,g=u.length;f<g;f++)h.add(u[f]);return h})}_loadNodeShallow(e){const t=this.json,n=this.extensions,i=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const r=t.nodes[e],a=r.name?i.createUniqueName(r.name):"",o=[],c=i._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(e)});return c&&o.push(c),r.camera!==void 0&&o.push(i.getDependency("camera",r.camera).then(function(l){return i._getNodeRef(i.cameraCache,r.camera,l)})),i._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(e)}).forEach(function(l){o.push(l)}),this.nodeCache[e]=Promise.all(o).then(function(l){let h;if(r.isBone===!0?h=new Tc:l.length>1?h=new $t:l.length===1?h=l[0]:h=new ft,h!==l[0])for(let u=0,d=l.length;u<d;u++)h.add(l[u]);if(r.name&&(h.userData.name=r.name,h.name=a),Wn(h,r),r.extensions&&Li(n,h,r),r.matrix!==void 0){const u=new Be;u.fromArray(r.matrix),h.applyMatrix4(u)}else r.translation!==void 0&&h.position.fromArray(r.translation),r.rotation!==void 0&&h.quaternion.fromArray(r.rotation),r.scale!==void 0&&h.scale.fromArray(r.scale);if(!i.associations.has(h))i.associations.set(h,{});else if(r.mesh!==void 0&&i.meshCache.refs[r.mesh]>1){const u=i.associations.get(h);i.associations.set(h,{...u})}return i.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){const t=this.extensions,n=this.json.scenes[e],i=this,r=new $t;n.name&&(r.name=i.createUniqueName(n.name)),Wn(r,n),n.extensions&&Li(t,r,n);const a=n.nodes||[],o=[];for(let c=0,l=a.length;c<l;c++)o.push(i.getDependency("node",a[c]));return Promise.all(o).then(function(c){for(let h=0,u=c.length;h<u;h++)r.add(c[h]);const l=h=>{const u=new Map;for(const[d,f]of i.associations)(d instanceof Sn||d instanceof wt)&&u.set(d,f);return h.traverse(d=>{const f=i.associations.get(d);f!=null&&u.set(d,f)}),u};return i.associations=l(r),r})}_createAnimationTracks(e,t,n,i,r){const a=[],o=e.name?e.name:e.uuid,c=[];vi[r.path]===vi.weights?e.traverse(function(d){d.morphTargetInfluences&&c.push(d.name?d.name:d.uuid)}):c.push(o);let l;switch(vi[r.path]){case vi.weights:l=Zi;break;case vi.rotation:l=Ji;break;case vi.translation:case vi.scale:l=$i;break;default:switch(n.itemSize){case 1:l=Zi;break;case 2:case 3:default:l=$i;break}break}const h=i.interpolation!==void 0?mx[i.interpolation]:Bs,u=this._getArrayFromAccessor(n);for(let d=0,f=c.length;d<f;d++){const g=new l(c[d]+"."+vi[r.path],t.array,u,h);i.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(g),a.push(g)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const n=Yl(t.constructor),i=new Float32Array(t.length);for(let r=0,a=t.length;r<a;r++)i[r]=t[r]*n;t=i}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){const i=this instanceof Ji?px:cf;return new i(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function Sx(s,e,t){const n=e.attributes,i=new Ht;if(n.POSITION!==void 0){const o=t.json.accessors[n.POSITION],c=o.min,l=o.max;if(c!==void 0&&l!==void 0){if(i.set(new I(c[0],c[1],c[2]),new I(l[0],l[1],l[2])),o.normalized){const h=Yl(Cs[o.componentType]);i.min.multiplyScalar(h),i.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const r=e.targets;if(r!==void 0){const o=new I,c=new I;for(let l=0,h=r.length;l<h;l++){const u=r[l];if(u.POSITION!==void 0){const d=t.json.accessors[u.POSITION],f=d.min,g=d.max;if(f!==void 0&&g!==void 0){if(c.setX(Math.max(Math.abs(f[0]),Math.abs(g[0]))),c.setY(Math.max(Math.abs(f[1]),Math.abs(g[1]))),c.setZ(Math.max(Math.abs(f[2]),Math.abs(g[2]))),d.normalized){const A=Yl(Cs[d.componentType]);c.multiplyScalar(A)}o.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}i.expandByVector(o)}s.boundingBox=i;const a=new zn;i.getCenter(a.center),a.radius=i.min.distanceTo(i.max)/2,s.boundingSphere=a}function fu(s,e,t){const n=e.attributes,i=[];function r(a,o){return t.getDependency("accessor",a).then(function(c){s.setAttribute(o,c)})}for(const a in n){const o=Ql[a]||a.toLowerCase();o in s.attributes||i.push(r(n[a],o))}if(e.indices!==void 0&&!s.index){const a=t.getDependency("accessor",e.indices).then(function(o){s.setIndex(o)});i.push(a)}return qe.workingColorSpace!==Ft&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${qe.workingColorSpace}" not supported.`),Wn(s,e),Sx(s,e,t),Promise.all(i).then(function(){return e.targets!==void 0?Ax(s,e.targets,t):s})}const Tl=new WeakMap;class Ex extends ui{constructor(e){super(e),this.decoderPath="",this.decoderConfig={},this.decoderBinary=null,this.decoderPending=null,this.workerLimit=4,this.workerPool=[],this.workerNextTaskID=1,this.workerSourceURL="",this.defaultAttributeIDs={position:"POSITION",normal:"NORMAL",color:"COLOR",uv:"TEX_COORD"},this.defaultAttributeTypes={position:"Float32Array",normal:"Float32Array",color:"Float32Array",uv:"Float32Array"}}setDecoderPath(e){return this.decoderPath=e,this}setDecoderConfig(e){return this.decoderConfig=e,this}setWorkerLimit(e){return this.workerLimit=e,this}load(e,t,n,i){const r=new Fs(this.manager);r.setPath(this.path),r.setResponseType("arraybuffer"),r.setRequestHeader(this.requestHeader),r.setWithCredentials(this.withCredentials),r.load(e,a=>{this.parse(a,t,i)},n,i)}parse(e,t,n=()=>{}){this.decodeDracoFile(e,t,null,null,vt,n).catch(n)}decodeDracoFile(e,t,n,i,r=Ft,a=()=>{}){const o={attributeIDs:n||this.defaultAttributeIDs,attributeTypes:i||this.defaultAttributeTypes,useUniqueIDs:!!n,vertexColorSpace:r};return this.decodeGeometry(e,o).then(t).catch(a)}decodeGeometry(e,t){const n=JSON.stringify(t);if(Tl.has(e)){const c=Tl.get(e);if(c.key===n)return c.promise;if(e.byteLength===0)throw new Error("THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred.")}let i;const r=this.workerNextTaskID++,a=e.byteLength,o=this._getWorker(r,a).then(c=>(i=c,new Promise((l,h)=>{i._callbacks[r]={resolve:l,reject:h},i.postMessage({type:"decode",id:r,taskConfig:t,buffer:e},[e])}))).then(c=>this._createGeometry(c.geometry));return o.catch(()=>!0).then(()=>{i&&r&&this._releaseTask(i,r)}),Tl.set(e,{key:n,promise:o}),o}_createGeometry(e){const t=new kt;e.index&&t.setIndex(new mt(e.index.array,1));for(let n=0;n<e.attributes.length;n++){const i=e.attributes[n],r=i.name,a=i.array,o=i.itemSize,c=new mt(a,o);r==="color"&&(this._assignVertexColorSpace(c,i.vertexColorSpace),c.normalized=!(a instanceof Float32Array)),t.setAttribute(r,c)}return t}_assignVertexColorSpace(e,t){if(t!==vt)return;const n=new Ce;for(let i=0,r=e.count;i<r;i++)n.fromBufferAttribute(e,i),qe.colorSpaceToWorking(n,vt),e.setXYZ(i,n.r,n.g,n.b)}_loadLibrary(e,t){const n=new Fs(this.manager);return n.setPath(this.decoderPath),n.setResponseType(t),n.setWithCredentials(this.withCredentials),new Promise((i,r)=>{n.load(e,i,void 0,r)})}preload(){return this._initDecoder(),this}_initDecoder(){if(this.decoderPending)return this.decoderPending;const e=typeof WebAssembly!="object"||this.decoderConfig.type==="js",t=[];return e?t.push(this._loadLibrary("draco_decoder.js","text")):(t.push(this._loadLibrary("draco_wasm_wrapper.js","text")),t.push(this._loadLibrary("draco_decoder.wasm","arraybuffer"))),this.decoderPending=Promise.all(t).then(n=>{const i=n[0];e||(this.decoderConfig.wasmBinary=n[1]);const r=bx.toString(),a=["/* draco decoder */",i,"","/* worker */",r.substring(r.indexOf("{")+1,r.lastIndexOf("}"))].join(`
`);this.workerSourceURL=URL.createObjectURL(new Blob([a]))}),this.decoderPending}_getWorker(e,t){return this._initDecoder().then(()=>{if(this.workerPool.length<this.workerLimit){const i=new Worker(this.workerSourceURL);i._callbacks={},i._taskCosts={},i._taskLoad=0,i.postMessage({type:"init",decoderConfig:this.decoderConfig}),i.onmessage=function(r){const a=r.data;switch(a.type){case"decode":i._callbacks[a.id].resolve(a);break;case"error":i._callbacks[a.id].reject(a);break;default:console.error('THREE.DRACOLoader: Unexpected message, "'+a.type+'"')}},this.workerPool.push(i)}else this.workerPool.sort(function(i,r){return i._taskLoad>r._taskLoad?-1:1});const n=this.workerPool[this.workerPool.length-1];return n._taskCosts[e]=t,n._taskLoad+=t,n})}_releaseTask(e,t){e._taskLoad-=e._taskCosts[t],delete e._callbacks[t],delete e._taskCosts[t]}debug(){console.log("Task load: ",this.workerPool.map(e=>e._taskLoad))}dispose(){for(let e=0;e<this.workerPool.length;++e)this.workerPool[e].terminate();return this.workerPool.length=0,this.workerSourceURL!==""&&URL.revokeObjectURL(this.workerSourceURL),this}}function bx(){let s,e;onmessage=function(a){const o=a.data;switch(o.type){case"init":s=o.decoderConfig,e=new Promise(function(h){s.onModuleLoaded=function(u){h({draco:u})},DracoDecoderModule(s)});break;case"decode":const c=o.buffer,l=o.taskConfig;e.then(h=>{const u=h.draco,d=new u.Decoder;try{const f=t(u,d,new Int8Array(c),l),g=f.attributes.map(A=>A.array.buffer);f.index&&g.push(f.index.array.buffer),self.postMessage({type:"decode",id:o.id,geometry:f},g)}catch(f){console.error(f),self.postMessage({type:"error",id:o.id,error:f.message})}finally{u.destroy(d)}});break}};function t(a,o,c,l){const h=l.attributeIDs,u=l.attributeTypes;let d,f;const g=o.GetEncodedGeometryType(c);if(g===a.TRIANGULAR_MESH)d=new a.Mesh,f=o.DecodeArrayToMesh(c,c.byteLength,d);else if(g===a.POINT_CLOUD)d=new a.PointCloud,f=o.DecodeArrayToPointCloud(c,c.byteLength,d);else throw new Error("THREE.DRACOLoader: Unexpected geometry type.");if(!f.ok()||d.ptr===0)throw new Error("THREE.DRACOLoader: Decoding failed: "+f.error_msg());const A={index:null,attributes:[]};for(const m in h){const p=self[u[m]];let E,w;if(l.useUniqueIDs)w=h[m],E=o.GetAttributeByUniqueId(d,w);else{if(w=o.GetAttributeId(d,a[h[m]]),w===-1)continue;E=o.GetAttribute(d,w)}const v=i(a,o,d,m,p,E);m==="color"&&(v.vertexColorSpace=l.vertexColorSpace),A.attributes.push(v)}return g===a.TRIANGULAR_MESH&&(A.index=n(a,o,d)),a.destroy(d),A}function n(a,o,c){const h=c.num_faces()*3,u=h*4,d=a._malloc(u);o.GetTrianglesUInt32Array(c,u,d);const f=new Uint32Array(a.HEAPF32.buffer,d,h).slice();return a._free(d),{array:f,itemSize:1}}function i(a,o,c,l,h,u){const d=u.num_components(),g=c.num_points()*d,A=g*h.BYTES_PER_ELEMENT,m=r(a,h),p=a._malloc(A);o.GetAttributeDataArrayForAllPoints(c,u,m,A,p);const E=new h(a.HEAPF32.buffer,p,g).slice();return a._free(p),{name:l,array:E,itemSize:d}}function r(a,o){switch(o){case Float32Array:return a.DT_FLOAT32;case Int8Array:return a.DT_INT8;case Int16Array:return a.DT_INT16;case Int32Array:return a.DT_INT32;case Uint8Array:return a.DT_UINT8;case Uint16Array:return a.DT_UINT16;case Uint32Array:return a.DT_UINT32}}}class Oo extends Tt{constructor(){const e=Oo.SkyShader,t=new St({name:e.name,uniforms:Mn.clone(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,side:Yt,depthWrite:!1});super(new ns(1,1,1),t),this.isSky=!0}}Oo.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new I},up:{value:new I(0,1,0)}},vertexShader:`
		uniform vec3 sunPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;
		uniform vec3 up;

		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		// constants for atmospheric scattering
		const float e = 2.71828182845904523536028747135266249775724709369995957;
		const float pi = 3.141592653589793238462643383279502884197169;

		// wavelength of used primaries, according to preetham
		const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
		// this pre-calculation replaces older TotalRayleigh(vec3 lambda) function:
		// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
		const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		// mie stuff
		// K coefficient for the primaries
		const float v = 4.0;
		const vec3 K = vec3( 0.686, 0.678, 0.666 );
		// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
		const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		// earth shadow hack
		// cutoffAngle = pi / 1.95;
		const float cutoffAngle = 1.6110731556870734;
		const float steepness = 1.5;
		const float EE = 1000.0;

		float sunIntensity( float zenithAngleCos ) {
			zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
		}

		vec3 totalMie( float T ) {
			float c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}

		void main() {

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			gl_Position.z = gl_Position.w; // set z to camera.far

			vSunDirection = normalize( sunPosition );

			vSunE = sunIntensity( dot( vSunDirection, up ) );

			vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

			float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

			// extinction (absorption + out scattering)
			// rayleigh coefficients
			vBetaR = totalRayleigh * rayleighCoefficient;

			// mie coefficients
			vBetaM = totalMie( turbidity ) * mieCoefficient;

		}`,fragmentShader:`
		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		uniform float mieDirectionalG;
		uniform vec3 up;

		// constants for atmospheric scattering
		const float pi = 3.141592653589793238462643383279502884197169;

		const float n = 1.0003; // refractive index of air
		const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

		// optical length at zenith for molecules
		const float rayleighZenithLength = 8.4E3;
		const float mieZenithLength = 1.25E3;
		// 66 arc seconds -> degrees, and the cosine of that
		const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

		// 3.0 / ( 16.0 * pi )
		const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
		// 1.0 / ( 4.0 * pi )
		const float ONE_OVER_FOURPI = 0.07957747154594767;

		float rayleighPhase( float cosTheta ) {
			return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
		}

		float hgPhase( float cosTheta, float g ) {
			float g2 = pow( g, 2.0 );
			float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
			return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
		}

		void main() {

			vec3 direction = normalize( vWorldPosition - cameraPosition );

			// optical length
			// cutoff angle at 90 to avoid singularity in next formula.
			float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
			float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
			float sR = rayleighZenithLength * inverse;
			float sM = mieZenithLength * inverse;

			// combined extinction factor
			vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

			// in scattering
			float cosTheta = dot( direction, vSunDirection );

			float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
			vec3 betaRTheta = vBetaR * rPhase;

			float mPhase = hgPhase( cosTheta, mieDirectionalG );
			vec3 betaMTheta = vBetaM * mPhase;

			vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

			// nightsky
			float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
			float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;

			// composition + solar disc
			float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
			L0 += ( vSunE * 19000.0 * Fex ) * sundisk;

			vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

			vec3 retColor = pow( texColor, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

			gl_FragColor = vec4( retColor, 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};const Sa={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class rs{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const Tx=new Ur(-1,1,1,-1,0,1);class wx extends kt{constructor(){super(),this.setAttribute("position",new En([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new En([0,2,0,0,2,0],2))}}const Cx=new wx;class Fo{constructor(e){this._mesh=new Tt(Cx,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Tx)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class jl extends rs{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof St?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Mn.clone(e.uniforms),this.material=new St({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new Fo(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class pu extends rs{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){const i=e.getContext(),r=e.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),r.buffers.stencil.setFunc(i.ALWAYS,a,4294967295),r.buffers.stencil.setClear(o),r.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(i.EQUAL,1,4294967295),r.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),r.buffers.stencil.setLocked(!0)}}class Rx extends rs{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class Dx{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const n=e.getSize(new we);this._width=n.width,this._height=n.height,t=new en(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Ot}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new jl(Sa),this.copyPass.material.blending=Bt,this.clock=new jd}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let n=!1;for(let i=0,r=this.passes.length;i<r;i++){const a=this.passes[i];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),a.needsSwap){if(n){const o=this.renderer.getContext(),c=this.renderer.state.buffers.stencil;c.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),c.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}pu!==void 0&&(a instanceof pu?n=!0:a instanceof Rx&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new we);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const n=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(n,i),this.renderTarget2.setSize(n,i);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,i)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class Px extends rs{constructor(e,t,n=null,i=null,r=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=i,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new Ce}render(e,t,n){const i=e.autoClear;e.autoClear=!1;let r,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(r=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=i}}const fa={defines:{PERSPECTIVE_CAMERA:1,SAMPLES:16,NORMAL_VECTOR_TYPE:1,DEPTH_SWIZZLING:"x",SCREEN_SPACE_RADIUS:0,SCREEN_SPACE_RADIUS_SCALE:100,SCENE_CLIP_BOX:0},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new we},cameraNear:{value:null},cameraFar:{value:null},cameraProjectionMatrix:{value:new Be},cameraProjectionMatrixInverse:{value:new Be},cameraWorldMatrix:{value:new Be},radius:{value:.25},distanceExponent:{value:1},thickness:{value:1},distanceFallOff:{value:1},scale:{value:1},sceneBoxMin:{value:new I(-1,-1,-1)},sceneBoxMax:{value:new I(1,1,1)}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		varying vec2 vUv;
		uniform highp sampler2D tNormal;
		uniform highp sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform mat4 cameraWorldMatrix;
		uniform float radius;
		uniform float distanceExponent;
		uniform float thickness;
		uniform float distanceFallOff;
		uniform float scale;
		#if SCENE_CLIP_BOX == 1
			uniform vec3 sceneBoxMin;
			uniform vec3 sceneBoxMax;
		#endif

		#include <common>
		#include <packing>

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(vec3(ao), 1.)
		#endif

		vec3 getViewPosition(const in vec2 screenPosition, const in float depth) {
			vec4 clipSpacePosition = vec4(vec3(screenPosition, depth) * 2.0 - 1.0, 1.0);
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
			return textureLod(tDepth, uv.xy, 0.0).DEPTH_SWIZZLING;
		}

		float fetchDepth(const ivec2 uv) {
			return texelFetch(tDepth, uv.xy, 0).DEPTH_SWIZZLING;
		}

		float getViewZ(const in float depth) {
			#if PERSPECTIVE_CAMERA == 1
				return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
			#else
				return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ? ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz : -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ? ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz : -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
			#if NORMAL_VECTOR_TYPE == 2
				return normalize(textureLod(tNormal, uv, 0.).rgb);
			#elif NORMAL_VECTOR_TYPE == 1
				return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
			#else
				return computeNormalFromDepth(uv);
			#endif
		}

		vec3 getSceneUvAndDepth(vec3 sampleViewPos) {
			vec4 sampleClipPos = cameraProjectionMatrix * vec4(sampleViewPos, 1.);
			vec2 sampleUv = sampleClipPos.xy / sampleClipPos.w * 0.5 + 0.5;
			float sampleSceneDepth = getDepth(sampleUv);
			return vec3(sampleUv, sampleSceneDepth);
		}

		void main() {
			float depth = getDepth(vUv.xy);
			if (depth >= 1.0) {
				discard;
				return;
			}
			vec3 viewPos = getViewPosition(vUv, depth);
			vec3 viewNormal = getViewNormal(vUv);

			float radiusToUse = radius;
			float distanceFalloffToUse = thickness;
			#if SCREEN_SPACE_RADIUS == 1
				float radiusScale = getViewPosition(vec2(0.5 + float(SCREEN_SPACE_RADIUS_SCALE) / resolution.x, 0.0), depth).x;
				radiusToUse *= radiusScale;
				distanceFalloffToUse *= radiusScale;
			#endif

			#if SCENE_CLIP_BOX == 1
				vec3 worldPos = (cameraWorldMatrix * vec4(viewPos, 1.0)).xyz;
				float boxDistance = length(max(vec3(0.0), max(sceneBoxMin - worldPos, worldPos - sceneBoxMax)));
				if (boxDistance > radiusToUse) {
					discard;
					return;
				}
			#endif

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
			vec3 randomVec = noiseTexel.xyz * 2.0 - 1.0;
			vec3 tangent = normalize(vec3(randomVec.xy, 0.));
			vec3 bitangent = vec3(-tangent.y, tangent.x, 0.);
			mat3 kernelMatrix = mat3(tangent, bitangent, vec3(0., 0., 1.));

			const int DIRECTIONS = SAMPLES < 30 ? 3 : 5;
			const int STEPS = (SAMPLES + DIRECTIONS - 1) / DIRECTIONS;
			float ao = 0.0;
			for (int i = 0; i < DIRECTIONS; ++i) {

				float angle = float(i) / float(DIRECTIONS) * PI;
				vec4 sampleDir = vec4(cos(angle), sin(angle), 0., 0.5 + 0.5 * noiseTexel.w);
				sampleDir.xyz = normalize(kernelMatrix * sampleDir.xyz);

				vec3 viewDir = normalize(-viewPos.xyz);
				vec3 sliceBitangent = normalize(cross(sampleDir.xyz, viewDir));
				vec3 sliceTangent = cross(sliceBitangent, viewDir);
				vec3 normalInSlice = normalize(viewNormal - sliceBitangent * dot(viewNormal, sliceBitangent));

				vec3 tangentToNormalInSlice = cross(normalInSlice, sliceBitangent);
				vec2 cosHorizons = vec2(dot(viewDir, tangentToNormalInSlice), dot(viewDir, -tangentToNormalInSlice));

				for (int j = 0; j < STEPS; ++j) {
					vec3 sampleViewOffset = sampleDir.xyz * radiusToUse * sampleDir.w * pow(float(j + 1) / float(STEPS), distanceExponent);

					vec3 sampleSceneUvDepth = getSceneUvAndDepth(viewPos + sampleViewOffset);
					vec3 sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					vec3 viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.x += max(0., (sampleCosHorizon - cosHorizons.x) * mix(1., 2. / float(j + 2), distanceFallOff));
					}

					sampleSceneUvDepth = getSceneUvAndDepth(viewPos - sampleViewOffset);
					sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.y += max(0., (sampleCosHorizon - cosHorizons.y) * mix(1., 2. / float(j + 2), distanceFallOff));
					}
				}

				vec2 sinHorizons = sqrt(1. - cosHorizons * cosHorizons);
				float nx = dot(normalInSlice, sliceTangent);
				float ny = dot(normalInSlice, viewDir);
				float nxb = 1. / 2. * (acos(cosHorizons.y) - acos(cosHorizons.x) + sinHorizons.x * cosHorizons.x - sinHorizons.y * cosHorizons.y);
				float nyb = 1. / 2. * (2. - cosHorizons.x * cosHorizons.x - cosHorizons.y * cosHorizons.y);
				float occlusion = nx * nxb + ny * nyb;
				ao += occlusion;
			}

			ao = clamp(ao / float(DIRECTIONS), 0., 1.);
		#if SCENE_CLIP_BOX == 1
			ao = mix(ao, 1., smoothstep(0., radiusToUse, boxDistance));
		#endif
			ao = pow(ao, scale);

			gl_FragColor = FRAGMENT_OUTPUT;
		}`},pa={defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform sampler2D tDepth;
		uniform float cameraNear;
		uniform float cameraFar;
		varying vec2 vUv;

		#include <packing>

		float getLinearDepth( const in vec2 screenPosition ) {
			#if PERSPECTIVE_CAMERA == 1
				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			#else
				return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		void main() {
			float depth = getLinearDepth( vUv );
			gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );

		}`},wl={uniforms:{tDiffuse:{value:null},intensity:{value:1}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform float intensity;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = vec4(mix(vec3(1.), texel.rgb, intensity), texel.a);
		}`};function Ix(s=5){const e=Math.floor(s)%2===0?Math.floor(s)+1:Math.floor(s),t=Lx(e),n=t.length,i=new Uint8Array(n*4);for(let a=0;a<n;++a){const o=t[a],c=2*Math.PI*o/n,l=new I(Math.cos(c),Math.sin(c),0).normalize();i[a*4]=(l.x*.5+.5)*255,i[a*4+1]=(l.y*.5+.5)*255,i[a*4+2]=127,i[a*4+3]=255}const r=new ks(i,e,e);return r.wrapS=Fn,r.wrapT=Fn,r.needsUpdate=!0,r}function Lx(s){const e=Math.floor(s)%2===0?Math.floor(s)+1:Math.floor(s),t=e*e,n=Array(t).fill(0);let i=Math.floor(e/2),r=e-1;for(let a=1;a<=t;){if(i===-1&&r===e?(r=e-2,i=0):(r===e&&(r=0),i<0&&(i=e-1)),n[i*e+r]!==0){r-=2,i++;continue}else n[i*e+r]=a++;r++,i--}return n}const ma={defines:{SAMPLES:16,SAMPLE_VECTORS:hf(16,2,1),NORMAL_VECTOR_TYPE:1,DEPTH_VALUE_SOURCE:0},uniforms:{tDiffuse:{value:null},tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new we},cameraProjectionMatrixInverse:{value:new Be},lumaPhi:{value:5},depthPhi:{value:5},normalPhi:{value:5},radius:{value:4},index:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`

		varying vec2 vUv;

		uniform sampler2D tDiffuse;
		uniform sampler2D tNormal;
		uniform sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform float lumaPhi;
		uniform float depthPhi;
		uniform float normalPhi;
		uniform float radius;
		uniform int index;

		#include <common>
		#include <packing>

		#ifndef SAMPLE_LUMINANCE
		#define SAMPLE_LUMINANCE dot(vec3(0.2125, 0.7154, 0.0721), a)
		#endif

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(denoised, 1.)
		#endif

		float getLuminance(const in vec3 a) {
			return SAMPLE_LUMINANCE;
		}

		const vec3 poissonDisk[SAMPLES] = SAMPLE_VECTORS;

		vec3 getViewPosition(const in vec2 screenPosition, const in float depth) {
			vec4 clipSpacePosition = vec4(vec3(screenPosition, depth) * 2.0 - 1.0, 1.0);
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
		#if DEPTH_VALUE_SOURCE == 1
			return textureLod(tDepth, uv.xy, 0.0).a;
		#else
			return textureLod(tDepth, uv.xy, 0.0).r;
		#endif
		}

		float fetchDepth(const ivec2 uv) {
			#if DEPTH_VALUE_SOURCE == 1
				return texelFetch(tDepth, uv.xy, 0).a;
			#else
				return texelFetch(tDepth, uv.xy, 0).r;
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ?  ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz
									: -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ?  ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz
									: -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
		#if NORMAL_VECTOR_TYPE == 2
			return normalize(textureLod(tNormal, uv, 0.).rgb);
		#elif NORMAL_VECTOR_TYPE == 1
			return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
		#else
			return computeNormalFromDepth(uv);
		#endif
		}

		void denoiseSample(in vec3 center, in vec3 viewNormal, in vec3 viewPos, in vec2 sampleUv, inout vec3 denoised, inout float totalWeight) {
			vec4 sampleTexel = textureLod(tDiffuse, sampleUv, 0.0);
			float sampleDepth = getDepth(sampleUv);
			vec3 sampleNormal = getViewNormal(sampleUv);
			vec3 neighborColor = sampleTexel.rgb;
			vec3 viewPosSample = getViewPosition(sampleUv, sampleDepth);

			float normalDiff = dot(viewNormal, sampleNormal);
			float normalSimilarity = pow(max(normalDiff, 0.), normalPhi);
			float lumaDiff = abs(getLuminance(neighborColor) - getLuminance(center));
			float lumaSimilarity = max(1.0 - lumaDiff / lumaPhi, 0.0);
			float depthDiff = abs(dot(viewPos - viewPosSample, viewNormal));
			float depthSimilarity = max(1. - depthDiff / depthPhi, 0.);
			float w = lumaSimilarity * depthSimilarity * normalSimilarity;

			denoised += w * neighborColor;
			totalWeight += w;
		}

		void main() {
			float depth = getDepth(vUv.xy);
			vec3 viewNormal = getViewNormal(vUv);
			if (depth == 1. || dot(viewNormal, viewNormal) == 0.) {
				discard;
				return;
			}
			vec4 texel = textureLod(tDiffuse, vUv, 0.0);
			vec3 center = texel.rgb;
			vec3 viewPos = getViewPosition(vUv, depth);

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
      		vec2 noiseVec = vec2(sin(noiseTexel[index % 4] * 2. * PI), cos(noiseTexel[index % 4] * 2. * PI));
    		mat2 rotationMatrix = mat2(noiseVec.x, -noiseVec.y, noiseVec.x, noiseVec.y);

			float totalWeight = 1.0;
			vec3 denoised = texel.rgb;
			for (int i = 0; i < SAMPLES; i++) {
				vec3 sampleDir = poissonDisk[i];
				vec2 offset = rotationMatrix * (sampleDir.xy * (1. + sampleDir.z * (radius - 1.)) / resolution);
				vec2 sampleUv = vUv + offset;
				denoiseSample(center, viewNormal, viewPos, sampleUv, denoised, totalWeight);
			}

			if (totalWeight > 0.) {
				denoised /= totalWeight;
			}
			gl_FragColor = FRAGMENT_OUTPUT;
		}`};function hf(s,e,t){const n=Nx(s,e,t);let i="vec3[SAMPLES](";for(let r=0;r<s;r++){const a=n[r];i+=`vec3(${a.x}, ${a.y}, ${a.z})${r<s-1?",":")"}`}return i}function Nx(s,e,t){const n=[];for(let i=0;i<s;i++){const r=2*Math.PI*e*i/s,a=Math.pow(i/(s-1),t);n.push(new I(Math.cos(r),Math.sin(r),a))}return n}class Bx{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(e.random()*256);this.perm=[];for(let t=0;t<512;t++)this.perm[t]=this.p[t&255];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}noise(e,t){let n,i,r;const a=.5*(Math.sqrt(3)-1),o=(e+t)*a,c=Math.floor(e+o),l=Math.floor(t+o),h=(3-Math.sqrt(3))/6,u=(c+l)*h,d=c-u,f=l-u,g=e-d,A=t-f;let m,p;g>A?(m=1,p=0):(m=0,p=1);const E=g-m+h,w=A-p+h,v=g-1+2*h,M=A-1+2*h,y=c&255,T=l&255,C=this.perm[y+this.perm[T]]%12,x=this.perm[y+m+this.perm[T+p]]%12,_=this.perm[y+1+this.perm[T+1]]%12;let R=.5-g*g-A*A;R<0?n=0:(R*=R,n=R*R*this._dot(this.grad3[C],g,A));let P=.5-E*E-w*w;P<0?i=0:(P*=P,i=P*P*this._dot(this.grad3[x],E,w));let B=.5-v*v-M*M;return B<0?r=0:(B*=B,r=B*B*this._dot(this.grad3[_],v,M)),70*(n+i+r)}noise3d(e,t,n){let i,r,a,o;const l=(e+t+n)*.3333333333333333,h=Math.floor(e+l),u=Math.floor(t+l),d=Math.floor(n+l),f=1/6,g=(h+u+d)*f,A=h-g,m=u-g,p=d-g,E=e-A,w=t-m,v=n-p;let M,y,T,C,x,_;E>=w?w>=v?(M=1,y=0,T=0,C=1,x=1,_=0):E>=v?(M=1,y=0,T=0,C=1,x=0,_=1):(M=0,y=0,T=1,C=1,x=0,_=1):w<v?(M=0,y=0,T=1,C=0,x=1,_=1):E<v?(M=0,y=1,T=0,C=0,x=1,_=1):(M=0,y=1,T=0,C=1,x=1,_=0);const R=E-M+f,P=w-y+f,B=v-T+f,O=E-C+2*f,F=w-x+2*f,U=v-_+2*f,Y=E-1+3*f,V=w-1+3*f,Z=v-1+3*f,te=h&255,ce=u&255,ge=d&255,ze=this.perm[te+this.perm[ce+this.perm[ge]]]%12,Ke=this.perm[te+M+this.perm[ce+y+this.perm[ge+T]]]%12,Xe=this.perm[te+C+this.perm[ce+x+this.perm[ge+_]]]%12,j=this.perm[te+1+this.perm[ce+1+this.perm[ge+1]]]%12;let q=.6-E*E-w*w-v*v;q<0?i=0:(q*=q,i=q*q*this._dot3(this.grad3[ze],E,w,v));let le=.6-R*R-P*P-B*B;le<0?r=0:(le*=le,r=le*le*this._dot3(this.grad3[Ke],R,P,B));let Te=.6-O*O-F*F-U*U;Te<0?a=0:(Te*=Te,a=Te*Te*this._dot3(this.grad3[Xe],O,F,U));let fe=.6-Y*Y-V*V-Z*Z;return fe<0?o=0:(fe*=fe,o=fe*fe*this._dot3(this.grad3[j],Y,V,Z)),32*(i+r+a+o)}noise4d(e,t,n,i){const r=this.grad4,a=this.simplex,o=this.perm,c=(Math.sqrt(5)-1)/4,l=(5-Math.sqrt(5))/20;let h,u,d,f,g;const A=(e+t+n+i)*c,m=Math.floor(e+A),p=Math.floor(t+A),E=Math.floor(n+A),w=Math.floor(i+A),v=(m+p+E+w)*l,M=m-v,y=p-v,T=E-v,C=w-v,x=e-M,_=t-y,R=n-T,P=i-C,B=x>_?32:0,O=x>R?16:0,F=_>R?8:0,U=x>P?4:0,Y=_>P?2:0,V=R>P?1:0,Z=B+O+F+U+Y+V,te=a[Z][0]>=3?1:0,ce=a[Z][1]>=3?1:0,ge=a[Z][2]>=3?1:0,ze=a[Z][3]>=3?1:0,Ke=a[Z][0]>=2?1:0,Xe=a[Z][1]>=2?1:0,j=a[Z][2]>=2?1:0,q=a[Z][3]>=2?1:0,le=a[Z][0]>=1?1:0,Te=a[Z][1]>=1?1:0,fe=a[Z][2]>=1?1:0,Qe=a[Z][3]>=1?1:0,Ct=x-te+l,L=_-ce+l,st=R-ge+l,Fe=P-ze+l,De=x-Ke+2*l,Ae=_-Xe+2*l,rt=R-j+2*l,ve=P-q+2*l,ke=x-le+3*l,xt=_-Te+3*l,ut=R-fe+3*l,D=P-Qe+3*l,S=x-1+4*l,H=_-1+4*l,Q=R-1+4*l,$=P-1+4*l,X=m&255,_e=p&255,re=E&255,me=w&255,Ee=o[X+o[_e+o[re+o[me]]]]%32,ie=o[X+te+o[_e+ce+o[re+ge+o[me+ze]]]]%32,ue=o[X+Ke+o[_e+Xe+o[re+j+o[me+q]]]]%32,Ie=o[X+le+o[_e+Te+o[re+fe+o[me+Qe]]]]%32,be=o[X+1+o[_e+1+o[re+1+o[me+1]]]]%32;let oe=.6-x*x-_*_-R*R-P*P;oe<0?h=0:(oe*=oe,h=oe*oe*this._dot4(r[Ee],x,_,R,P));let Ue=.6-Ct*Ct-L*L-st*st-Fe*Fe;Ue<0?u=0:(Ue*=Ue,u=Ue*Ue*this._dot4(r[ie],Ct,L,st,Fe));let N=.6-De*De-Ae*Ae-rt*rt-ve*ve;N<0?d=0:(N*=N,d=N*N*this._dot4(r[ue],De,Ae,rt,ve));let ee=.6-ke*ke-xt*xt-ut*ut-D*D;ee<0?f=0:(ee*=ee,f=ee*ee*this._dot4(r[Ie],ke,xt,ut,D));let ae=.6-S*S-H*H-Q*Q-$*$;return ae<0?g=0:(ae*=ae,g=ae*ae*this._dot4(r[be],S,H,Q,$)),27*(h+u+d+f+g)}_dot(e,t,n){return e[0]*t+e[1]*n}_dot3(e,t,n,i){return e[0]*t+e[1]*n+e[2]*i}_dot4(e,t,n,i,r){return e[0]*t+e[1]*n+e[2]*i+e[3]*r}}class Xn extends rs{constructor(e,t,n=512,i=512,r,a,o){super(),this.width=n,this.height=i,this.clear=!0,this.camera=t,this.scene=e,this.output=0,this._renderGBuffer=!0,this._visibilityCache=[],this.blendIntensity=1,this.pdRings=2,this.pdRadiusExponent=2,this.pdSamples=16,this.gtaoNoiseTexture=Ix(),this.pdNoiseTexture=this._generateNoise(),this.gtaoRenderTarget=new en(this.width,this.height,{type:Ot}),this.pdRenderTarget=this.gtaoRenderTarget.clone(),this.gtaoMaterial=new St({defines:Object.assign({},fa.defines),uniforms:Mn.clone(fa.uniforms),vertexShader:fa.vertexShader,fragmentShader:fa.fragmentShader,blending:Bt,depthTest:!1,depthWrite:!1}),this.gtaoMaterial.defines.PERSPECTIVE_CAMERA=this.camera.isPerspectiveCamera?1:0,this.gtaoMaterial.uniforms.tNoise.value=this.gtaoNoiseTexture,this.gtaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.normalMaterial=new Pd,this.normalMaterial.blending=Bt,this.pdMaterial=new St({defines:Object.assign({},ma.defines),uniforms:Mn.clone(ma.uniforms),vertexShader:ma.vertexShader,fragmentShader:ma.fragmentShader,depthTest:!1,depthWrite:!1}),this.pdMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.pdMaterial.uniforms.tNoise.value=this.pdNoiseTexture,this.pdMaterial.uniforms.resolution.value.set(this.width,this.height),this.pdMaterial.uniforms.lumaPhi.value=10,this.pdMaterial.uniforms.depthPhi.value=2,this.pdMaterial.uniforms.normalPhi.value=3,this.pdMaterial.uniforms.radius.value=8,this.depthRenderMaterial=new St({defines:Object.assign({},pa.defines),uniforms:Mn.clone(pa.uniforms),vertexShader:pa.vertexShader,fragmentShader:pa.fragmentShader,blending:Bt}),this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new St({uniforms:Mn.clone(Sa.uniforms),vertexShader:Sa.vertexShader,fragmentShader:Sa.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:Ra,blendDst:Ms,blendEquation:_n,blendSrcAlpha:Ca,blendDstAlpha:Ms,blendEquationAlpha:_n}),this.blendMaterial=new St({uniforms:Mn.clone(wl.uniforms),vertexShader:wl.vertexShader,fragmentShader:wl.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blending:sc,blendSrc:Ra,blendDst:Ms,blendEquation:_n,blendSrcAlpha:Ca,blendDstAlpha:Ms,blendEquationAlpha:_n}),this._fsQuad=new Fo(null),this._originalClearColor=new Ce,this.setGBuffer(r?r.depthTexture:void 0,r?r.normalTexture:void 0),a!==void 0&&this.updateGtaoMaterial(a),o!==void 0&&this.updatePdMaterial(o)}setSize(e,t){this.width=e,this.height=t,this.gtaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.pdRenderTarget.setSize(e,t),this.gtaoMaterial.uniforms.resolution.value.set(e,t),this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.pdMaterial.uniforms.resolution.value.set(e,t),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse)}dispose(){this.gtaoNoiseTexture.dispose(),this.pdNoiseTexture.dispose(),this.normalRenderTarget.dispose(),this.gtaoRenderTarget.dispose(),this.pdRenderTarget.dispose(),this.normalMaterial.dispose(),this.pdMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this._fsQuad.dispose()}get gtaoMap(){return this.pdRenderTarget.texture}setGBuffer(e,t){e!==void 0?(this.depthTexture=e,this.normalTexture=t,this._renderGBuffer=!1):(this.depthTexture=new Bo,this.depthTexture.format=Ki,this.depthTexture.type=qi,this.normalRenderTarget=new en(this.width,this.height,{minFilter:Dt,magFilter:Dt,type:Ot,depthTexture:this.depthTexture}),this.normalTexture=this.normalRenderTarget.texture,this._renderGBuffer=!0);const n=this.normalTexture?1:0,i=this.depthTexture===this.normalTexture?"w":"x";this.gtaoMaterial.defines.NORMAL_VECTOR_TYPE=n,this.gtaoMaterial.defines.DEPTH_SWIZZLING=i,this.gtaoMaterial.uniforms.tNormal.value=this.normalTexture,this.gtaoMaterial.uniforms.tDepth.value=this.depthTexture,this.pdMaterial.defines.NORMAL_VECTOR_TYPE=n,this.pdMaterial.defines.DEPTH_SWIZZLING=i,this.pdMaterial.uniforms.tNormal.value=this.normalTexture,this.pdMaterial.uniforms.tDepth.value=this.depthTexture,this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture}setSceneClipBox(e){e?(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX!==1,this.gtaoMaterial.defines.SCENE_CLIP_BOX=1,this.gtaoMaterial.uniforms.sceneBoxMin.value.copy(e.min),this.gtaoMaterial.uniforms.sceneBoxMax.value.copy(e.max)):(this.gtaoMaterial.needsUpdate=this.gtaoMaterial.defines.SCENE_CLIP_BOX===0,this.gtaoMaterial.defines.SCENE_CLIP_BOX=0)}updateGtaoMaterial(e){e.radius!==void 0&&(this.gtaoMaterial.uniforms.radius.value=e.radius),e.distanceExponent!==void 0&&(this.gtaoMaterial.uniforms.distanceExponent.value=e.distanceExponent),e.thickness!==void 0&&(this.gtaoMaterial.uniforms.thickness.value=e.thickness),e.distanceFallOff!==void 0&&(this.gtaoMaterial.uniforms.distanceFallOff.value=e.distanceFallOff,this.gtaoMaterial.needsUpdate=!0),e.scale!==void 0&&(this.gtaoMaterial.uniforms.scale.value=e.scale),e.samples!==void 0&&e.samples!==this.gtaoMaterial.defines.SAMPLES&&(this.gtaoMaterial.defines.SAMPLES=e.samples,this.gtaoMaterial.needsUpdate=!0),e.screenSpaceRadius!==void 0&&(e.screenSpaceRadius?1:0)!==this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS&&(this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS=e.screenSpaceRadius?1:0,this.gtaoMaterial.needsUpdate=!0)}updatePdMaterial(e){let t=!1;e.lumaPhi!==void 0&&(this.pdMaterial.uniforms.lumaPhi.value=e.lumaPhi),e.depthPhi!==void 0&&(this.pdMaterial.uniforms.depthPhi.value=e.depthPhi),e.normalPhi!==void 0&&(this.pdMaterial.uniforms.normalPhi.value=e.normalPhi),e.radius!==void 0&&e.radius!==this.radius&&(this.pdMaterial.uniforms.radius.value=e.radius),e.radiusExponent!==void 0&&e.radiusExponent!==this.pdRadiusExponent&&(this.pdRadiusExponent=e.radiusExponent,t=!0),e.rings!==void 0&&e.rings!==this.pdRings&&(this.pdRings=e.rings,t=!0),e.samples!==void 0&&e.samples!==this.pdSamples&&(this.pdSamples=e.samples,t=!0),t&&(this.pdMaterial.defines.SAMPLES=this.pdSamples,this.pdMaterial.defines.SAMPLE_VECTORS=hf(this.pdSamples,this.pdRings,this.pdRadiusExponent),this.pdMaterial.needsUpdate=!0)}render(e,t,n){switch(this._renderGBuffer&&(this._overrideVisibility(),this._renderOverride(e,this.normalMaterial,this.normalRenderTarget,7829503,1),this._restoreVisibility()),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.gtaoMaterial.uniforms.cameraWorldMatrix.value.copy(this.camera.matrixWorld),this._renderPass(e,this.gtaoMaterial,this.gtaoRenderTarget,16777215,1),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this._renderPass(e,this.pdMaterial,this.pdRenderTarget,16777215,1),this.output){case Xn.OUTPUT.Off:break;case Xn.OUTPUT.Diffuse:this.copyMaterial.uniforms.tDiffuse.value=n.texture,this.copyMaterial.blending=Bt,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case Xn.OUTPUT.AO:this.copyMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.copyMaterial.blending=Bt,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case Xn.OUTPUT.Denoise:this.copyMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this.copyMaterial.blending=Bt,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case Xn.OUTPUT.Depth:this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this._renderPass(e,this.depthRenderMaterial,this.renderToScreen?null:t);break;case Xn.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=Bt,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case Xn.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=n.texture,this.copyMaterial.blending=Bt,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t),this.blendMaterial.uniforms.intensity.value=this.blendIntensity,this.blendMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this._renderPass(e,this.blendMaterial,this.renderToScreen?null:t);break;default:console.warn("THREE.GTAOPass: Unknown output type.")}}_renderPass(e,t,n,i,r){e.getClearColor(this._originalClearColor);const a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,i!=null&&(e.setClearColor(i),e.setClearAlpha(r||0),e.clear()),this._fsQuad.material=t,this._fsQuad.render(e),e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_renderOverride(e,t,n,i,r){e.getClearColor(this._originalClearColor);const a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,i=t.clearColor||i,r=t.clearAlpha||r,i!=null&&(e.setClearColor(i),e.setClearAlpha(r||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=o,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_overrideVisibility(){const e=this.scene,t=this._visibilityCache;e.traverse(function(n){(n.isPoints||n.isLine||n.isLine2)&&n.visible&&(n.visible=!1,t.push(n))})}_restoreVisibility(){const e=this._visibilityCache;for(let t=0;t<e.length;t++)e[t].visible=!0;e.length=0}_generateNoise(e=64){const t=new Bx,n=e*e*4,i=new Uint8Array(n);for(let a=0;a<e;a++)for(let o=0;o<e;o++){const c=a,l=o;i[(a*e+o)*4]=(t.noise(c,l)*.5+.5)*255,i[(a*e+o)*4+1]=(t.noise(c+e,l)*.5+.5)*255,i[(a*e+o)*4+2]=(t.noise(c,l+e)*.5+.5)*255,i[(a*e+o)*4+3]=(t.noise(c+e,l+e)*.5+.5)*255}const r=new ks(i,e,e,an,bn);return r.wrapS=Fn,r.wrapT=Fn,r.needsUpdate=!0,r}}Xn.OUTPUT={Off:-1,Default:0,Diffuse:1,Depth:2,Normal:3,AO:4,Denoise:5};const ga={defines:{SMAA_THRESHOLD:"0.1"},uniforms:{tDiffuse:{value:null},resolution:{value:new we(1/1024,1/512)}},vertexShader:`

		uniform vec2 resolution;

		varying vec2 vUv;
		varying vec4 vOffset[ 3 ];

		void SMAAEdgeDetectionVS( vec2 texcoord ) {
			vOffset[ 0 ] = texcoord.xyxy + resolution.xyxy * vec4( -1.0, 0.0, 0.0,  1.0 ); // WebGL port note: Changed sign in W component
			vOffset[ 1 ] = texcoord.xyxy + resolution.xyxy * vec4(  1.0, 0.0, 0.0, -1.0 ); // WebGL port note: Changed sign in W component
			vOffset[ 2 ] = texcoord.xyxy + resolution.xyxy * vec4( -2.0, 0.0, 0.0,  2.0 ); // WebGL port note: Changed sign in W component
		}

		void main() {

			vUv = uv;

			SMAAEdgeDetectionVS( vUv );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;

		varying vec2 vUv;
		varying vec4 vOffset[ 3 ];

		vec4 SMAAColorEdgeDetectionPS( vec2 texcoord, vec4 offset[3], sampler2D colorTex ) {
			vec2 threshold = vec2( SMAA_THRESHOLD, SMAA_THRESHOLD );

			// Calculate color deltas:
			vec4 delta;
			vec3 C = texture2D( colorTex, texcoord ).rgb;

			vec3 Cleft = texture2D( colorTex, offset[0].xy ).rgb;
			vec3 t = abs( C - Cleft );
			delta.x = max( max( t.r, t.g ), t.b );

			vec3 Ctop = texture2D( colorTex, offset[0].zw ).rgb;
			t = abs( C - Ctop );
			delta.y = max( max( t.r, t.g ), t.b );

			// We do the usual threshold:
			vec2 edges = step( threshold, delta.xy );

			// Then discard if there is no edge:
			if ( dot( edges, vec2( 1.0, 1.0 ) ) == 0.0 )
				discard;

			// Calculate right and bottom deltas:
			vec3 Cright = texture2D( colorTex, offset[1].xy ).rgb;
			t = abs( C - Cright );
			delta.z = max( max( t.r, t.g ), t.b );

			vec3 Cbottom  = texture2D( colorTex, offset[1].zw ).rgb;
			t = abs( C - Cbottom );
			delta.w = max( max( t.r, t.g ), t.b );

			// Calculate the maximum delta in the direct neighborhood:
			float maxDelta = max( max( max( delta.x, delta.y ), delta.z ), delta.w );

			// Calculate left-left and top-top deltas:
			vec3 Cleftleft  = texture2D( colorTex, offset[2].xy ).rgb;
			t = abs( C - Cleftleft );
			delta.z = max( max( t.r, t.g ), t.b );

			vec3 Ctoptop = texture2D( colorTex, offset[2].zw ).rgb;
			t = abs( C - Ctoptop );
			delta.w = max( max( t.r, t.g ), t.b );

			// Calculate the final maximum delta:
			maxDelta = max( max( maxDelta, delta.z ), delta.w );

			// Local contrast adaptation in action:
			edges.xy *= step( 0.5 * maxDelta, delta.xy );

			return vec4( edges, 0.0, 0.0 );
		}

		void main() {

			gl_FragColor = SMAAColorEdgeDetectionPS( vUv, vOffset, tDiffuse );

		}`},Aa={defines:{SMAA_MAX_SEARCH_STEPS:"8",SMAA_AREATEX_MAX_DISTANCE:"16",SMAA_AREATEX_PIXEL_SIZE:"( 1.0 / vec2( 160.0, 560.0 ) )",SMAA_AREATEX_SUBTEX_SIZE:"( 1.0 / 7.0 )"},uniforms:{tDiffuse:{value:null},tArea:{value:null},tSearch:{value:null},resolution:{value:new we(1/1024,1/512)}},vertexShader:`

		uniform vec2 resolution;

		varying vec2 vUv;
		varying vec4 vOffset[ 3 ];
		varying vec2 vPixcoord;

		void SMAABlendingWeightCalculationVS( vec2 texcoord ) {
			vPixcoord = texcoord / resolution;

			// We will use these offsets for the searches later on (see @PSEUDO_GATHER4):
			vOffset[ 0 ] = texcoord.xyxy + resolution.xyxy * vec4( -0.25, 0.125, 1.25, 0.125 ); // WebGL port note: Changed sign in Y and W components
			vOffset[ 1 ] = texcoord.xyxy + resolution.xyxy * vec4( -0.125, 0.25, -0.125, -1.25 ); // WebGL port note: Changed sign in Y and W components

			// And these for the searches, they indicate the ends of the loops:
			vOffset[ 2 ] = vec4( vOffset[ 0 ].xz, vOffset[ 1 ].yw ) + vec4( -2.0, 2.0, -2.0, 2.0 ) * resolution.xxyy * float( SMAA_MAX_SEARCH_STEPS );

		}

		void main() {

			vUv = uv;

			SMAABlendingWeightCalculationVS( vUv );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		#define SMAASampleLevelZeroOffset( tex, coord, offset ) texture2D( tex, coord + float( offset ) * resolution, 0.0 )

		uniform sampler2D tDiffuse;
		uniform sampler2D tArea;
		uniform sampler2D tSearch;
		uniform vec2 resolution;

		varying vec2 vUv;
		varying vec4 vOffset[3];
		varying vec2 vPixcoord;

		#if __VERSION__ == 100
		vec2 round( vec2 x ) {
			return sign( x ) * floor( abs( x ) + 0.5 );
		}
		#endif

		float SMAASearchLength( sampler2D searchTex, vec2 e, float bias, float scale ) {
			// Not required if searchTex accesses are set to point:
			// float2 SEARCH_TEX_PIXEL_SIZE = 1.0 / float2(66.0, 33.0);
			// e = float2(bias, 0.0) + 0.5 * SEARCH_TEX_PIXEL_SIZE +
			//     e * float2(scale, 1.0) * float2(64.0, 32.0) * SEARCH_TEX_PIXEL_SIZE;
			e.r = bias + e.r * scale;
			return 255.0 * texture2D( searchTex, e, 0.0 ).r;
		}

		float SMAASearchXLeft( sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end ) {
			/**
				* @PSEUDO_GATHER4
				* This texcoord has been offset by (-0.25, -0.125) in the vertex shader to
				* sample between edge, thus fetching four edges in a row.
				* Sampling with different offsets in each direction allows to disambiguate
				* which edges are active from the four fetched ones.
				*/
			vec2 e = vec2( 0.0, 1.0 );

			for ( int i = 0; i < SMAA_MAX_SEARCH_STEPS; i ++ ) { // WebGL port note: Changed while to for
				e = texture2D( edgesTex, texcoord, 0.0 ).rg;
				texcoord -= vec2( 2.0, 0.0 ) * resolution;
				if ( ! ( texcoord.x > end && e.g > 0.8281 && e.r == 0.0 ) ) break;
			}

			// We correct the previous (-0.25, -0.125) offset we applied:
			texcoord.x += 0.25 * resolution.x;

			// The searches are bias by 1, so adjust the coords accordingly:
			texcoord.x += resolution.x;

			// Disambiguate the length added by the last step:
			texcoord.x += 2.0 * resolution.x; // Undo last step
			texcoord.x -= resolution.x * SMAASearchLength(searchTex, e, 0.0, 0.5);

			return texcoord.x;
		}

		float SMAASearchXRight( sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end ) {
			vec2 e = vec2( 0.0, 1.0 );

			for ( int i = 0; i < SMAA_MAX_SEARCH_STEPS; i ++ ) { // WebGL port note: Changed while to for
				e = texture2D( edgesTex, texcoord, 0.0 ).rg;
				texcoord += vec2( 2.0, 0.0 ) * resolution;
				if ( ! ( texcoord.x < end && e.g > 0.8281 && e.r == 0.0 ) ) break;
			}

			texcoord.x -= 0.25 * resolution.x;
			texcoord.x -= resolution.x;
			texcoord.x -= 2.0 * resolution.x;
			texcoord.x += resolution.x * SMAASearchLength( searchTex, e, 0.5, 0.5 );

			return texcoord.x;
		}

		float SMAASearchYUp( sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end ) {
			vec2 e = vec2( 1.0, 0.0 );

			for ( int i = 0; i < SMAA_MAX_SEARCH_STEPS; i ++ ) { // WebGL port note: Changed while to for
				e = texture2D( edgesTex, texcoord, 0.0 ).rg;
				texcoord += vec2( 0.0, 2.0 ) * resolution; // WebGL port note: Changed sign
				if ( ! ( texcoord.y > end && e.r > 0.8281 && e.g == 0.0 ) ) break;
			}

			texcoord.y -= 0.25 * resolution.y; // WebGL port note: Changed sign
			texcoord.y -= resolution.y; // WebGL port note: Changed sign
			texcoord.y -= 2.0 * resolution.y; // WebGL port note: Changed sign
			texcoord.y += resolution.y * SMAASearchLength( searchTex, e.gr, 0.0, 0.5 ); // WebGL port note: Changed sign

			return texcoord.y;
		}

		float SMAASearchYDown( sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end ) {
			vec2 e = vec2( 1.0, 0.0 );

			for ( int i = 0; i < SMAA_MAX_SEARCH_STEPS; i ++ ) { // WebGL port note: Changed while to for
				e = texture2D( edgesTex, texcoord, 0.0 ).rg;
				texcoord -= vec2( 0.0, 2.0 ) * resolution; // WebGL port note: Changed sign
				if ( ! ( texcoord.y < end && e.r > 0.8281 && e.g == 0.0 ) ) break;
			}

			texcoord.y += 0.25 * resolution.y; // WebGL port note: Changed sign
			texcoord.y += resolution.y; // WebGL port note: Changed sign
			texcoord.y += 2.0 * resolution.y; // WebGL port note: Changed sign
			texcoord.y -= resolution.y * SMAASearchLength( searchTex, e.gr, 0.5, 0.5 ); // WebGL port note: Changed sign

			return texcoord.y;
		}

		vec2 SMAAArea( sampler2D areaTex, vec2 dist, float e1, float e2, float offset ) {
			// Rounding prevents precision errors of bilinear filtering:
			vec2 texcoord = float( SMAA_AREATEX_MAX_DISTANCE ) * round( 4.0 * vec2( e1, e2 ) ) + dist;

			// We do a scale and bias for mapping to texel space:
			texcoord = SMAA_AREATEX_PIXEL_SIZE * texcoord + ( 0.5 * SMAA_AREATEX_PIXEL_SIZE );

			// Move to proper place, according to the subpixel offset:
			texcoord.y += SMAA_AREATEX_SUBTEX_SIZE * offset;

			return texture2D( areaTex, texcoord, 0.0 ).rg;
		}

		vec4 SMAABlendingWeightCalculationPS( vec2 texcoord, vec2 pixcoord, vec4 offset[ 3 ], sampler2D edgesTex, sampler2D areaTex, sampler2D searchTex, ivec4 subsampleIndices ) {
			vec4 weights = vec4( 0.0, 0.0, 0.0, 0.0 );

			vec2 e = texture2D( edgesTex, texcoord ).rg;

			if ( e.g > 0.0 ) { // Edge at north
				vec2 d;

				// Find the distance to the left:
				vec2 coords;
				coords.x = SMAASearchXLeft( edgesTex, searchTex, offset[ 0 ].xy, offset[ 2 ].x );
				coords.y = offset[ 1 ].y; // offset[1].y = texcoord.y - 0.25 * resolution.y (@CROSSING_OFFSET)
				d.x = coords.x;

				// Now fetch the left crossing edges, two at a time using bilinear
				// filtering. Sampling at -0.25 (see @CROSSING_OFFSET) enables to
				// discern what value each edge has:
				float e1 = texture2D( edgesTex, coords, 0.0 ).r;

				// Find the distance to the right:
				coords.x = SMAASearchXRight( edgesTex, searchTex, offset[ 0 ].zw, offset[ 2 ].y );
				d.y = coords.x;

				// We want the distances to be in pixel units (doing this here allow to
				// better interleave arithmetic and memory accesses):
				d = d / resolution.x - pixcoord.x;

				// SMAAArea below needs a sqrt, as the areas texture is compressed
				// quadratically:
				vec2 sqrt_d = sqrt( abs( d ) );

				// Fetch the right crossing edges:
				coords.y -= 1.0 * resolution.y; // WebGL port note: Added
				float e2 = SMAASampleLevelZeroOffset( edgesTex, coords, ivec2( 1, 0 ) ).r;

				// Ok, we know how this pattern looks like, now it is time for getting
				// the actual area:
				weights.rg = SMAAArea( areaTex, sqrt_d, e1, e2, float( subsampleIndices.y ) );
			}

			if ( e.r > 0.0 ) { // Edge at west
				vec2 d;

				// Find the distance to the top:
				vec2 coords;

				coords.y = SMAASearchYUp( edgesTex, searchTex, offset[ 1 ].xy, offset[ 2 ].z );
				coords.x = offset[ 0 ].x; // offset[1].x = texcoord.x - 0.25 * resolution.x;
				d.x = coords.y;

				// Fetch the top crossing edges:
				float e1 = texture2D( edgesTex, coords, 0.0 ).g;

				// Find the distance to the bottom:
				coords.y = SMAASearchYDown( edgesTex, searchTex, offset[ 1 ].zw, offset[ 2 ].w );
				d.y = coords.y;

				// We want the distances to be in pixel units:
				d = d / resolution.y - pixcoord.y;

				// SMAAArea below needs a sqrt, as the areas texture is compressed
				// quadratically:
				vec2 sqrt_d = sqrt( abs( d ) );

				// Fetch the bottom crossing edges:
				coords.y -= 1.0 * resolution.y; // WebGL port note: Added
				float e2 = SMAASampleLevelZeroOffset( edgesTex, coords, ivec2( 0, 1 ) ).g;

				// Get the area for this direction:
				weights.ba = SMAAArea( areaTex, sqrt_d, e1, e2, float( subsampleIndices.x ) );
			}

			return weights;
		}

		void main() {

			gl_FragColor = SMAABlendingWeightCalculationPS( vUv, vPixcoord, vOffset, tDiffuse, tArea, tSearch, ivec4( 0.0 ) );

		}`},Cl={uniforms:{tDiffuse:{value:null},tColor:{value:null},resolution:{value:new we(1/1024,1/512)}},vertexShader:`

		uniform vec2 resolution;

		varying vec2 vUv;
		varying vec4 vOffset[ 2 ];

		void SMAANeighborhoodBlendingVS( vec2 texcoord ) {
			vOffset[ 0 ] = texcoord.xyxy + resolution.xyxy * vec4( -1.0, 0.0, 0.0, 1.0 ); // WebGL port note: Changed sign in W component
			vOffset[ 1 ] = texcoord.xyxy + resolution.xyxy * vec4( 1.0, 0.0, 0.0, -1.0 ); // WebGL port note: Changed sign in W component
		}

		void main() {

			vUv = uv;

			SMAANeighborhoodBlendingVS( vUv );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform sampler2D tColor;
		uniform vec2 resolution;

		varying vec2 vUv;
		varying vec4 vOffset[ 2 ];

		vec4 SMAANeighborhoodBlendingPS( vec2 texcoord, vec4 offset[ 2 ], sampler2D colorTex, sampler2D blendTex ) {
			// Fetch the blending weights for current pixel:
			vec4 a;
			a.xz = texture2D( blendTex, texcoord ).xz;
			a.y = texture2D( blendTex, offset[ 1 ].zw ).g;
			a.w = texture2D( blendTex, offset[ 1 ].xy ).a;

			// Is there any blending weight with a value greater than 0.0?
			if ( dot(a, vec4( 1.0, 1.0, 1.0, 1.0 )) < 1e-5 ) {
				return texture2D( colorTex, texcoord, 0.0 );
			} else {
				// Up to 4 lines can be crossing a pixel (one through each edge). We
				// favor blending by choosing the line with the maximum weight for each
				// direction:
				vec2 offset;
				offset.x = a.a > a.b ? a.a : -a.b; // left vs. right
				offset.y = a.g > a.r ? -a.g : a.r; // top vs. bottom // WebGL port note: Changed signs

				// Then we go in the direction that has the maximum weight:
				if ( abs( offset.x ) > abs( offset.y )) { // horizontal vs. vertical
					offset.y = 0.0;
				} else {
					offset.x = 0.0;
				}

				// Fetch the opposite color and lerp by hand:
				vec4 C = texture2D( colorTex, texcoord, 0.0 );
				texcoord += sign( offset ) * resolution;
				vec4 Cop = texture2D( colorTex, texcoord, 0.0 );
				float s = abs( offset.x ) > abs( offset.y ) ? abs( offset.x ) : abs( offset.y );

				// WebGL port note: Added gamma correction
				C.xyz = pow(C.xyz, vec3(2.2));
				Cop.xyz = pow(Cop.xyz, vec3(2.2));
				vec4 mixed = mix(C, Cop, s);
				mixed.xyz = pow(mixed.xyz, vec3(1.0 / 2.2));

				return mixed;
			}
		}

		void main() {

			gl_FragColor = SMAANeighborhoodBlendingPS( vUv, vOffset, tColor, tDiffuse );

		}`};class Ux extends rs{constructor(){super(),this._edgesRT=new en(1,1,{depthBuffer:!1,type:Ot}),this._edgesRT.texture.name="SMAAPass.edges",this._weightsRT=new en(1,1,{depthBuffer:!1,type:Ot}),this._weightsRT.texture.name="SMAAPass.weights";const e=this,t=new Image;t.src=this._getAreaTexture(),t.onload=function(){e._areaTexture.needsUpdate=!0},this._areaTexture=new wt,this._areaTexture.name="SMAAPass.area",this._areaTexture.image=t,this._areaTexture.minFilter=Et,this._areaTexture.generateMipmaps=!1,this._areaTexture.flipY=!1;const n=new Image;n.src=this._getSearchTexture(),n.onload=function(){e._searchTexture.needsUpdate=!0},this._searchTexture=new wt,this._searchTexture.name="SMAAPass.search",this._searchTexture.image=n,this._searchTexture.magFilter=Dt,this._searchTexture.minFilter=Dt,this._searchTexture.generateMipmaps=!1,this._searchTexture.flipY=!1,this._uniformsEdges=Mn.clone(ga.uniforms),this._materialEdges=new St({defines:Object.assign({},ga.defines),uniforms:this._uniformsEdges,vertexShader:ga.vertexShader,fragmentShader:ga.fragmentShader}),this._uniformsWeights=Mn.clone(Aa.uniforms),this._uniformsWeights.tDiffuse.value=this._edgesRT.texture,this._uniformsWeights.tArea.value=this._areaTexture,this._uniformsWeights.tSearch.value=this._searchTexture,this._materialWeights=new St({defines:Object.assign({},Aa.defines),uniforms:this._uniformsWeights,vertexShader:Aa.vertexShader,fragmentShader:Aa.fragmentShader}),this._uniformsBlend=Mn.clone(Cl.uniforms),this._uniformsBlend.tDiffuse.value=this._weightsRT.texture,this._materialBlend=new St({uniforms:this._uniformsBlend,vertexShader:Cl.vertexShader,fragmentShader:Cl.fragmentShader}),this._fsQuad=new Fo(null)}render(e,t,n){this._uniformsEdges.tDiffuse.value=n.texture,this._fsQuad.material=this._materialEdges,e.setRenderTarget(this._edgesRT),this.clear&&e.clear(),this._fsQuad.render(e),this._fsQuad.material=this._materialWeights,e.setRenderTarget(this._weightsRT),this.clear&&e.clear(),this._fsQuad.render(e),this._uniformsBlend.tColor.value=n.texture,this._fsQuad.material=this._materialBlend,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(),this._fsQuad.render(e))}setSize(e,t){this._edgesRT.setSize(e,t),this._weightsRT.setSize(e,t),this._materialEdges.uniforms.resolution.value.set(1/e,1/t),this._materialWeights.uniforms.resolution.value.set(1/e,1/t),this._materialBlend.uniforms.resolution.value.set(1/e,1/t)}dispose(){this._edgesRT.dispose(),this._weightsRT.dispose(),this._areaTexture.dispose(),this._searchTexture.dispose(),this._materialEdges.dispose(),this._materialWeights.dispose(),this._materialBlend.dispose(),this._fsQuad.dispose()}_getAreaTexture(){return"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAAIwCAIAAACOVPcQAACBeklEQVR42u39W4xlWXrnh/3WWvuciIzMrKxrV8/0rWbY0+SQFKcb4owIkSIFCjY9AC1BT/LYBozRi+EX+cV+8IMsYAaCwRcBwjzMiw2jAWtgwC8WR5Q8mDFHZLNHTarZGrLJJllt1W2qKrsumZWZcTvn7L3W54e1vrXX3vuciLPPORFR1XE2EomorB0nVuz//r71re/y/1eMvb4Cb3N11xV/PP/2v4UBAwJG/7H8urx6/25/Gf8O5hypMQ0EEEQwAqLfoN/Z+97f/SW+/NvcgQk4sGBJK6H7N4PFVL+K+e0N11yNfkKvwUdwdlUAXPHHL38oa15f/i/46Ih6SuMSPmLAYAwyRKn7dfMGH97jaMFBYCJUgotIC2YAdu+LyW9vvubxAP8kAL8H/koAuOKP3+q6+xGnd5kdYCeECnGIJViwGJMAkQKfDvB3WZxjLKGh8VSCCzhwEWBpMc5/kBbjawT4HnwJfhr+pPBIu7uu+OOTo9vsmtQcniMBGkKFd4jDWMSCRUpLjJYNJkM+IRzQ+PQvIeAMTrBS2LEiaiR9b/5PuT6Ap/AcfAFO4Y3dA3DFH7/VS+M8k4baEAQfMI4QfbVDDGIRg7GKaIY52qAjTAgTvGBAPGIIghOCYAUrGFNgzA7Q3QhgCwfwAnwe5vDejgG44o/fbm1C5ZlYQvQDARPAIQGxCWBM+wWl37ZQESb4gImexGMDouhGLx1Cst0Saa4b4AqO4Hk4gxo+3DHAV/nx27p3JziPM2pVgoiia5MdEzCGULprIN7gEEeQ5IQxEBBBQnxhsDb5auGmAAYcHMA9eAAz8PBol8/xij9+C4Djlim4gJjWcwZBhCBgMIIYxGAVIkH3ZtcBuLdtRFMWsPGoY9rN+HoBji9VBYdwD2ZQg4cnO7OSq/z4rU5KKdwVbFAjNojCQzTlCLPFSxtamwh2jMUcEgg2Wm/6XgErIBhBckQtGN3CzbVacERgCnfgLswhnvqf7QyAq/z4rRZm1YglYE3affGITaZsdIe2FmMIpnOCap25I6jt2kCwCW0D1uAD9sZctNGXcQIHCkINDQgc78aCr+zjtw3BU/ijdpw3zhCwcaONwBvdeS2YZKkJNJsMPf2JKEvC28RXxxI0ASJyzQCjCEQrO4Q7sFArEzjZhaFc4cdv+/JFdKULM4px0DfUBI2hIsy06BqLhGTQEVdbfAIZXYMPesq6VoCHICzUyjwInO4Y411//LYLs6TDa9wvg2CC2rElgAnpTBziThxaL22MYhzfkghz6GAs2VHbbdM91VZu1MEEpupMMwKyVTb5ij9+u4VJG/5EgEMMmFF01cFai3isRbKbzb+YaU/MQbAm2XSMoUPAmvZzbuKYRIFApbtlrfFuUGd6vq2hXNnH78ZLh/iFhsQG3T4D1ib7k5CC6vY0DCbtrohgLEIClXiGtl10zc0CnEGIhhatLBva7NP58Tvw0qE8yWhARLQ8h4+AhQSP+I4F5xoU+VilGRJs6wnS7ruti/4KvAY/CfdgqjsMy4pf8fodQO8/gnuX3f/3xi3om1/h7THr+co3x93PP9+FBUfbNUjcjEmhcrkT+8K7ml7V10Jo05mpIEFy1NmCJWx9SIKKt+EjAL4Ez8EBVOB6havuT/rByPvHXK+9zUcfcbb254+9fydJknYnRr1oGfdaiAgpxu1Rx/Rek8KISftx3L+DfsLWAANn8Hvw0/AFeAGO9DFV3c6D+CcWbL8Dj9e7f+T1k8AZv/d7+PXWM/Z+VvdCrIvuAKO09RpEEQJM0Ci6+B4xhTWr4cZNOvhktabw0ta0rSJmqz3Yw5/AKXwenod7cAhTmBSPKf6JBdvH8IP17h95pXqw50/+BFnj88fev4NchyaK47OPhhtI8RFSvAfDSNh0Ck0p2gLxGkib5NJj/JWCr90EWQJvwBzO4AHcgztwAFN1evHPUVGwfXON+0debT1YeGON9Yy9/63X+OguiwmhIhQhD7l4sMqlG3D86Suc3qWZ4rWjI1X7u0Ytw6x3rIMeIOPDprfe2XzNgyj6PahhBjO4C3e6puDgXrdg+/5l948vF3bqwZetZ+z9Rx9zdIY5pInPK4Nk0t+l52xdK2B45Qd87nM8fsD5EfUhIcJcERw4RdqqH7Yde5V7m1vhNmtedkz6EDzUMF/2jJYWbC+4fzzA/Y+/8PPH3j9dcBAPIRP8JLXd5BpAu03aziOL3VVHZzz3CXWDPWd+SH2AnxIqQoTZpo9Ckc6HIrFbAbzNmlcg8Ag8NFDDAhbJvTBZXbC94P7t68EXfv6o+21gUtPETU7bbkLxvNKRFG2+KXzvtObonPP4rBvsgmaKj404DlshFole1Glfh02fE7bYR7dZ82oTewIBGn1Md6CG6YUF26X376oevOLzx95vhUmgblI6LBZwTCDY7vMq0op5WVXgsObOXJ+1x3qaBl9j1FeLxbhU9w1F+Wiba6s1X/TBz1LnUfuYDi4r2C69f1f14BWfP+p+W2GFKuC9phcELMYRRLur9DEZTUdEH+iEqWdaM7X4WOoPGI+ZYD2+wcQ+y+ioHUZ9dTDbArzxmi/bJI9BND0Ynd6lBdve/butBw8+f/T9D3ABa3AG8W3VPX4hBin+bj8dMMmSpp5pg7fJ6xrBFE2WQQEWnV8Qg3FbAWzYfM1rREEnmvkN2o1+acG2d/9u68GDzx91v3mAjb1zkpqT21OipPKO0b9TO5W0nTdOmAQm0TObts3aBKgwARtoPDiCT0gHgwnbArzxmtcLc08HgF1asN0C4Ms/fvD5I+7PhfqyXE/b7RbbrGyRQRT9ARZcwAUmgdoz0ehJ9Fn7QAhUjhDAQSw0bV3T3WbNa59jzmiP6GsWbGXDX2ytjy8+f9T97fiBPq9YeLdBmyuizZHaqXITnXiMUEEVcJ7K4j3BFPurtB4bixW8wTpweL8DC95szWMOqucFYGsWbGU7p3TxxxefP+r+oTVktxY0v5hbq3KiOKYnY8ddJVSBxuMMVffNbxwIOERShst73HZ78DZrHpmJmH3K6sGz0fe3UUj0eyRrSCGTTc+rjVNoGzNSv05srAxUBh8IhqChiQgVNIIBH3AVPnrsnXQZbLTm8ammv8eVXn/vWpaTem5IXRlt+U/LA21zhSb9cye6jcOfCnOwhIAYXAMVTUNV0QhVha9xjgA27ODJbLbmitt3tRN80lqG6N/khgot4ZVlOyO4WNg3OIMzhIZQpUEHieg2im6F91hB3I2tubql6BYNN9Hj5S7G0G2tahslBWKDnOiIvuAEDzakDQKDNFQT6gbn8E2y4BBubM230YIpBnDbMa+y3dx0n1S0BtuG62lCCXwcY0F72T1VRR3t2ONcsmDjbmzNt9RFs2LO2hQNyb022JisaI8rAWuw4HI3FuAIhZdOGIcdjLJvvObqlpqvWTJnnQbyi/1M9O8UxWhBs//H42I0q1Yb/XPGONzcmm+ri172mHKvZBpHkJaNJz6v9jxqiklDj3U4CA2ugpAaYMWqNXsdXbmJNd9egCnJEsphXNM+MnK3m0FCJ5S1kmJpa3DgPVbnQnPGWIDspW9ozbcO4K/9LkfaQO2KHuqlfFXSbdNzcEcwoqNEFE9zcIXu9/6n/ym/BC/C3aJLzEKPuYVlbFnfhZ8kcWxV3dbv4bKl28566wD+8C53aw49lTABp9PWbsB+knfc/Li3eVizf5vv/xmvnPKg5ihwKEwlrcHqucuVcVOxEv8aH37E3ZqpZypUulrHEtIWKUr+txHg+ojZDGlwnqmkGlzcVi1dLiNSJiHjfbRNOPwKpx9TVdTn3K05DBx4psIk4Ei8aCkJahRgffk4YnEXe07T4H2RR1u27E6wfQsBDofUgjFUFnwC2AiVtA+05J2zpiDK2Oa0c5fmAecN1iJzmpqFZxqYBCYhFTCsUNEmUnIcZ6aEA5rQVhEywG6w7HSW02XfOoBlQmjwulOFQAg66SvJblrTEX1YtJ3uG15T/BH1OfOQeuR8g/c0gdpT5fx2SKbs9EfHTKdM8A1GaJRHLVIwhcGyydZsbifAFVKl5EMKNU2Hryo+06BeTgqnxzYjThVySDikbtJPieco75lYfKAJOMEZBTjoITuWHXXZVhcUDIS2hpiXHV9Ku4u44bN5OYLDOkJo8w+xJSMbhBRHEdEs9JZUCkQrPMAvaHyLkxgkEHxiNkx/x2YB0mGsQ8EUWj/stW5YLhtS5SMu+/YBbNPDCkGTUybN8krRLBGPlZkVOA0j+a1+rkyQKWGaPHPLZOkJhioQYnVZ2hS3zVxMtgC46KuRwbJNd9nV2PHgb36F194ecf/Yeu2vAFe5nm/bRBFrnY4BauE8ERmZRFUn0k8hbftiVYSKMEme2dJCJSCGYAlNqh87bXOPdUkGy24P6d1ll21MBqqx48Fvv8ZHH8HZFY7j/uAq1xMJUFqCSUlJPmNbIiNsmwuMs/q9CMtsZsFO6SprzCS1Z7QL8xCQClEelpjTduDMsmWD8S1PT152BtvmIGvUeDA/yRn83u/x0/4qxoPHjx+PXY9pqX9bgMvh/Nz9kpP4pOe1/fYf3axUiMdHLlPpZCNjgtNFAhcHEDxTumNONhHrBduW+vOyY++70WWnPXj98eA4kOt/mj/5E05l9+O4o8ePx67HFqyC+qSSnyselqjZGaVK2TadbFLPWAQ4NBhHqDCCV7OTpo34AlSSylPtIdd2AJZlyzYQrDJ5lcWGNceD80CunPLGGzsfD+7wRb95NevJI5docQ3tgCyr5bGnyaPRlmwNsFELViOOx9loebGNq2moDOKpHLVP5al2cymWHbkfzGXL7kfRl44H9wZy33tvt+PB/Xnf93e+nh5ZlU18wCiRUa9m7kib9LYuOk+hudQNbxwm0AQqbfloimaB2lM5fChex+ylMwuTbfmXQtmWlenZljbdXTLuOxjI/fDDHY4Hjx8/Hrse0zXfPFxbUN1kKqSCCSk50m0Ajtx3ub9XHBKHXESb8iO6E+qGytF4nO0OG3SXzbJlhxBnKtKyl0NwybjvYCD30aMdjgePHz8eu56SVTBbgxJMliQ3Oauwg0QHxXE2Ez/EIReLdQj42Gzb4CLS0YJD9xUx7bsi0vJi5mUbW1QzL0h0PFk17rtiIPfJk52MB48fPx67npJJwyrBa2RCCQRTbGZSPCxTPOiND4G2pYyOQ4h4jINIJh5wFU1NFZt+IsZ59LSnDqBjZ2awbOku+yInunLcd8VA7rNnOxkPHj9+PGY9B0MWJJNozOJmlglvDMXDEozdhQWbgs/U6oBanGzLrdSNNnZFjOkmbi5bNt1lX7JLLhn3vXAg9/h4y/Hg8ePHI9dzQMEkWCgdRfYykYKnkP7D4rIujsujaKPBsB54vE2TS00ccvFY/Tth7JXeq1hz+qgVy04sAJawTsvOknHfCwdyT062HA8eP348Zj0vdoXF4pilKa2BROed+9fyw9rWRXeTFXESMOanvDZfJuJaSXouQdMdDJZtekZcLLvEeK04d8m474UDuaenW44Hjx8/Xns9YYqZpszGWB3AN/4VHw+k7WSFtJ3Qicuqb/NlVmgXWsxh570xg2UwxUw3WfO6B5nOuO8aA7lnZxuPB48fPx6znm1i4bsfcbaptF3zNT78eFPtwi1OaCNOqp1x3zUGcs/PN++AGD1+fMXrSVm2baTtPhPahbPhA71wIHd2bXzRa69nG+3CraTtPivahV/55tXWg8fyRY/9AdsY8VbSdp8V7cKrrgdfM//z6ILQFtJ2nxHtwmuoB4/kf74+gLeRtvvMaBdeSz34+vifx0YG20jbfTa0C6+tHrwe//NmOG0L8EbSdp8R7cLrrQe/996O+ai3ujQOskpTNULa7jOjXXj99eCd8lHvoFiwsbTdZ0a78PrrwTvlo966pLuRtB2fFe3Cm6oHP9kNH/W2FryxtN1nTLvwRurBO+Kj3pWXHidtx2dFu/Bm68Fb81HvykuPlrb7LGkX3mw9eGs+6h1Y8MbSdjegXcguQLjmevDpTQLMxtJ2N6NdyBZu9AbrwVvwUW+LbteULUpCdqm0HTelXbhNPe8G68Gb8lFvVfYfSNuxvrTdTWoXbozAzdaDZzfkorOj1oxVxlIMlpSIlpLrt8D4hrQL17z+c3h6hU/wv4Q/utps4+bm+6P/hIcf0JwQ5oQGPBL0eKPTYEXTW+eL/2DKn73J9BTXYANG57hz1cEMviVf/4tf5b/6C5pTQkMIWoAq7hTpOJjtAM4pxKu5vg5vXeUrtI09/Mo/5H+4z+Mp5xULh7cEm2QbRP2tFIKR7WM3fPf/jZ3SWCqLM2l4NxID5zB72HQXv3jj/8mLR5xXNA5v8EbFQEz7PpRfl1+MB/hlAN65qgDn3wTgH13hK7T59bmP+NIx1SHHU84nLOITt3iVz8mNO+lPrjGAnBFqmioNn1mTyk1ta47R6d4MrX7tjrnjYUpdUbv2rVr6YpVfsGG58AG8Ah9eyUN8CX4WfgV+G8LVWPDGb+Zd4cU584CtqSbMKxauxTg+dyn/LkVgA+IR8KHtejeFKRtTmLLpxN6mYVLjYxwXf5x2VofiZcp/lwKk4wGOpYDnoIZPdg/AAbwMfx0+ge9dgZvYjuqKe4HnGnykYo5TvJbG0Vj12JagRhwKa44H95ShkZa5RyLGGdfYvG7aw1TsF6iapPAS29mNS3NmsTQZCmgTzFwgL3upCTgtBTRwvGMAKrgLn4evwin8+afJRcff+8izUGUM63GOOuAs3tJkw7J4kyoNreqrpO6cYLQeFUd7TTpr5YOTLc9RUUogUOVJQ1GYJaFLAW0oTmKyYS46ZooP4S4EON3xQ5zC8/CX4CnM4c1PE8ApexpoYuzqlP3d4S3OJP8ZDK7cKWNaTlqmgDiiHwl1YsE41w1zT4iRTm3DBqxvOUsbMKKDa/EHxagtnta072ejc3DOIh5ojvh8l3tk1JF/AV6FU6jh3U8HwEazLgdCLYSQ+MYiAI2ltomkzttUb0gGHdSUUgsIYjTzLG3mObX4FBRaYtpDVNZrih9TgTeYOBxsEnN1gOCTM8Bsw/ieMc75w9kuAT6A+/AiHGvN/+Gn4KRkiuzpNNDYhDGFndWRpE6SVfm8U5bxnSgVV2jrg6JCKmneqey8VMFgq2+AM/i4L4RUbfSi27lNXZ7R7W9RTcq/q9fk4Xw3AMQd4I5ifAZz8FcVtm9SAom/dyN4lczJQW/kC42ZrHgcCoIf1oVMKkVItmMBi9cOeNHGLqOZk+QqQmrbc5YmYgxELUUN35z2iohstgfLIFmcMV7s4CFmI74L9+EFmGsi+tGnAOD4Yk9gIpo01Y4cA43BWGygMdr4YZekG3OBIUXXNukvJS8tqa06e+lSDCtnqqMFu6hWHXCF+WaYt64m9QBmNxi7Ioy7D+fa1yHw+FMAcPt7SysFLtoG4PXAk7JOA3aAxBRqUiAdU9Yp5lK3HLSRFtOim0sa8euEt08xvKjYjzeJ2GU7YawexrnKI9tmobInjFXCewpwriY9+RR4aaezFhMhGCppKwom0ChrgFlKzyPKkGlTW1YQrE9HJqu8hKGgMc6hVi5QRq0PZxNfrYNgE64utmRv6KKHRpxf6VDUaOvNP5jCEx5q185My/7RKz69UQu2im5k4/eownpxZxNLwiZ1AZTO2ZjWjkU9uaB2HFn6Q3u0JcsSx/qV9hTEApRzeBLDJQXxYmTnq7bdLa3+uqFrxLJ5w1TehnNHx5ECvCh2g2c3hHH5YsfdaSKddztfjQ6imKFGSyFwlLzxEGPp6r5IevVjk1AMx3wMqi1NxDVjLBiPs9tbsCkIY5we5/ML22zrCScFxnNtzsr9Wcc3CnD+pYO+4VXXiDE0oc/vQQ/fDK3oPESJMYXNmJa/DuloJZkcTpcYE8lIH8Dz8DJMiynNC86Mb2lNaaqP/+L7f2fcE/yP7/Lde8xfgSOdMxvOixZf/9p3+M4hT1+F+zApxg9XfUvYjc8qX2lfOOpK2gNRtB4flpFu9FTKCp2XJRgXnX6olp1zyYjTKJSkGmLE2NjUr1bxFM4AeAAHBUFIeSLqXR+NvH/M9fOnfHzOD2vCSyQJKzfgsCh+yi/Mmc35F2fUrw7miW33W9hBD1vpuUojFphIyvg7aTeoymDkIkeW3XLHmguMzbIAJejN6B5MDrhipE2y6SoFRO/AK/AcHHZHNIfiWrEe/C6cr3f/yOvrQKB+zMM55/GQdLDsR+ifr5Fiuu+/y+M78LzOE5dsNuXC3PYvYWd8NXvphLSkJIasrlD2/HOqQ+RjcRdjKTGWYhhVUm4yxlyiGPuMsZR7sMCHUBeTuNWA7if+ifXgc/hovftHXs/DV+Fvwe+f8shzMiMcweFgBly3//vwJfg5AN4450fn1Hd1Rm1aBLu22Dy3y3H2+OqMemkbGZ4jozcDjJf6596xOLpC0eMTHbKnxLxH27uZ/bMTGs2jOaMOY4m87CfQwF0dw53oa1k80JRuz/XgS+8fX3N9Af4qPIMfzKgCp4H5TDGe9GGeFPzSsZz80SlPTxXjgwJmC45njzgt2vbQ4b4OAdUK4/vWhO8d8v6EE8fMUsfakXbPpFJeLs2ubM/qdm/la3WP91uWhxXHjoWhyRUq2iJ/+5mA73zwIIo+LoZ/SgvIRjAd1IMvvn98PfgOvAJfhhm8scAKVWDuaRaK8aQ9f7vuPDH6Bj47ZXau7rqYJ66mTDwEDU6lLbCjCK0qTXyl5mnDoeNRxanj3FJbaksTk0faXxHxLrssgPkWB9LnA/MFleXcJozzjwsUvUG0X/QCve51qkMDXp9mtcyOy3rwBfdvVJK7D6/ACSzg3RoruIq5UDeESfEmVclDxnniU82vxMLtceD0hGZWzBNPMM/jSPne2OVatiTKUpY5vY7gc0LdUAWeWM5tH+O2I66AOWw9xT2BuyRVLGdoDHUsVRXOo/c+ZdRXvFfnxWyIV4upFLCl9eAL7h8Zv0QH8Ry8pA2cHzQpGesctVA37ZtklBTgHjyvdSeKY/RZw/kJMk0Y25cSNRWSigQtlULPTw+kzuJPeYEkXjQRpoGZobYsLF79pyd1dMRHInbgFTZqNLhDqiIsTNpoex2WLcy0/X6rHcdMMQvFSd5dWA++4P7xv89deACnmr36uGlL69bRCL6BSZsS6c0TU2TKK5gtWCzgAOOwQcurqk9j8whvziZSMLcq5hbuwBEsYjopUBkqw1yYBGpLA97SRElEmx5MCInBY5vgLk94iKqSWmhIGmkJ4Bi9m4L645J68LyY4wsFYBfUg5feP/6gWWm58IEmKQM89hq7KsZNaKtP5TxxrUZZVkNmMJtjbKrGxLNEbHPJxhqy7lAmbC32ZqeF6lTaknRWcYaFpfLUBh/rwaQycCCJmW15Kstv6jRHyJFry2C1ahkkIW0LO75s61+owxK1y3XqweX9m5YLM2DPFeOjn/iiqCKJ+yKXF8t5Yl/kNsqaSCryxPq5xWTFIaP8KSW0RYxqupaUf0RcTNSSdJZGcKYdYA6kdtrtmyBckfKXwqk0pHpUHlwWaffjNRBYFPUDWa8e3Lt/o0R0CdisKDM89cX0pvRHEfM8ca4t0s2Xx4kgo91MPQJ/0c9MQYq0co8MBh7bz1fio0UUHLR4aAIOvOmoYO6kwlEVODSSTliWtOtH6sPkrtctF9ZtJ9GIerBskvhdVS5cFNv9s1BU0AbdUgdK4FG+dRnjFmDTzniRMdZO1QhzMK355vigbdkpz9P6qjUGE5J2qAcXmwJ20cZUiAD0z+pGMx6xkzJkmEf40Hr4qZfVg2XzF9YOyoV5BjzVkUJngKf8lgNYwKECEHrCNDrWZzMlflS3yBhr/InyoUgBc/lKT4pxVrrC6g1YwcceK3BmNxZcAtz3j5EIpqguh9H6wc011YN75cKDLpFDxuwkrPQmUwW4KTbj9mZTwBwLq4aQMUZbHm1rylJ46dzR0dua2n3RYCWZsiHROeywyJGR7mXKlpryyCiouY56sFkBWEnkEB/raeh/Sw4162KeuAxMQpEkzy5alMY5wamMsWKKrtW2WpEWNnReZWONKWjrdsKZarpFjqCslq773PLmEhM448Pc3+FKr1+94vv/rfw4tEcu+lKTBe4kZSdijBrykwv9vbCMPcLQTygBjzVckSLPRVGslqdunwJ4oegtFOYb4SwxNgWLCmD7T9kVjTv5YDgpo0XBmN34Z/rEHp0sgyz7lngsrm4lvMm2Mr1zNOJYJ5cuxuQxwMGJq/TP5emlb8fsQBZviK4t8hFL+zbhtlpwaRSxQRWfeETjuauPsdGxsBVdO7nmP4xvzSoT29pRl7kGqz+k26B3Oy0YNV+SXbbQas1ctC/GarskRdFpKczVAF1ZXnLcpaMuzVe6lZ2g/1ndcvOVgRG3sdUAY1bKD6achijMPdMxV4muKVorSpiDHituH7rSTs7n/4y5DhRXo4FVBN4vO/zbAcxhENzGbHCzU/98Mcx5e7a31kWjw9FCe/zNeYyQjZsWb1uc7U33pN4Mji6hCLhivqfa9Ss6xLg031AgfesA/l99m9fgvnaF9JoE6bYKmkGNK3aPbHB96w3+DnxFm4hs0drLsk7U8kf/N/CvwQNtllna0rjq61sH8L80HAuvwH1tvBy2ChqWSCaYTaGN19sTvlfzFD6n+iKTbvtayfrfe9ueWh6GJFoxLdr7V72a5ZpvHcCPDzma0wTO4EgbLyedxstO81n57LYBOBzyfsOhUKsW1J1BB5vr/tz8RyqOFylQP9Tvst2JALsC5lsH8PyQ40DV4ANzYa4dedNiKNR1s+x2wwbR7q4/4cTxqEk4LWDebfisuo36JXLiWFjOtLrlNWh3K1rRS4xvHcDNlFnNmWBBAl5SWaL3oPOfnvbr5pdjVnEaeBJSYjuLEkyLLsWhKccadmOphZkOPgVdalj2QpSmfOsADhMWE2ZBu4+EEJI4wKTAuCoC4xwQbWXBltpxbjkXJtKxxabo9e7tyhlgb6gNlSbUpMh+l/FaqzVwewGu8BW1Zx7pTpQDJUjb8tsUTW6+GDXbMn3mLbXlXJiGdggxFAoUrtPS3wE4Nk02UZG2OOzlk7fRs7i95QCLo3E0jtrjnM7SR3uS1p4qtS2nJ5OwtQVHgOvArLBFijZUV9QtSl8dAY5d0E0hM0w3HS2DpIeB6m/A1+HfhJcGUq4sOxH+x3f5+VO+Ds9rYNI7zPXOYWPrtf8bYMx6fuOAX5jzNR0PdsuON+X1f7EERxMJJoU6GkTEWBvVolVlb5lh3tKCg6Wx1IbaMDdJ+9sUCc5KC46hKGCk3IVOS4TCqdBNfUs7Kd4iXf2RjnT/LLysJy3XDcHLh/vde3x8DoGvwgsa67vBk91G5Pe/HbOe7xwym0NXbtiuuDkGO2IJDh9oQvJ4cY4vdoqLDuoH9Zl2F/ofsekn8lkuhIlhQcffUtSjytFyp++p6NiE7Rqx/lodgKVoceEp/CP4FfjrquZaTtj2AvH5K/ywpn7M34K/SsoYDAdIN448I1/0/wveW289T1/lX5xBzc8N5IaHr0XMOQdHsIkDuJFifj20pBm5jzwUv9e2FhwRsvhAbalCIuIw3bhJihY3p6nTFFIZgiSYjfTf3aXuOjmeGn4bPoGvwl+CFzTRczBIuHBEeImHc37/lGfwZR0cXzVDOvaKfNHvwe+suZ771K/y/XcBlsoN996JpBhoE2toYxOznNEOS5TJc6Id5GEXLjrWo+LEWGNpPDU4WAwsIRROu+1vM+0oW37z/MBN9kqHnSArwPfgFJ7Cq/Ai3Ie7g7ncmI09v8sjzw9mzOAEXoIHxURueaAce5V80f/DOuuZwHM8vsMb5wBzOFWM7wymTXPAEvm4vcFpZ2ut0VZRjkiP2MlmLd6DIpbGSiHOjdnUHN90hRYmhTnmvhzp1iKDNj+b7t5hi79lWGwQ+HN9RsfFMy0FXbEwhfuczKgCbyxYwBmcFhhvo/7a44v+i3XWcwDP86PzpGQYdWh7csP5dBvZ1jNzdxC8pBGuxqSW5vw40nBpj5JhMwvOzN0RWqERHMr4Lv1kWX84xLR830G3j6yqZ1a8UstTlW+qJPOZ+sZ7xZPKTJLhiNOAFd6tk+jrTH31ncLOxid8+nzRb128HhUcru/y0Wn6iT254YPC6FtVSIMoW2sk727AhvTtrWKZTvgsmckfXYZWeNRXx/3YQ2OUxLDrbHtN11IwrgXT6c8dATDwLniYwxzO4RzuQqTKSC5gAofMZ1QBK3zQ4JWobFbcvJm87FK+6JXrKahLn54m3p+McXzzYtP8VF/QpJuh1OwieElEoI1pRxPS09FBrkq2tWCU59+HdhNtTIqKm8EBrw2RTOEDpG3IKo2Y7mFdLm3ZeVjYwVw11o/oznceMve4CgMfNym/utA/d/ILMR7gpXzRy9eDsgLcgbs8O2Va1L0zzIdwGGemTBuwROHeoMShkUc7P+ISY3KH5ZZeWqO8mFTxQYeXTNuzvvK5FGPdQfuu00DwYFY9dyhctEt+OJDdnucfpmyhzUJzfsJjr29l8S0bXBfwRS9ZT26tmMIdZucch5ZboMz3Nio3nIOsYHCGoDT4kUA9MiXEp9Xsui1S8th/kbWIrMBxDGLodWUQIWcvnXy+9M23xPiSMOiRPqM+YMXkUN3gXFrZJwXGzUaMpJfyRS9ZT0lPe8TpScuRlbMHeUmlaKDoNuy62iWNTWNFYjoxFzuJs8oR+RhRx7O4SVNSXpa0ZJQ0K1LAHDQ+D9IepkMXpcsq5EVCvClBUIzDhDoyKwDw1Lc59GbTeORivugw1IcuaEOaGWdNm+Ps5fQ7/tm0DjMegq3yM3vb5j12qUId5UZD2oxDSEWOZMSqFl/W+5oynWDa/aI04tJRQ2eTXusg86SQVu/nwSYwpW6wLjlqIzwLuxGIvoAvul0PS+ZNz0/akp/pniO/8JDnGyaCkzbhl6YcqmK/69prxPqtpx2+Km9al9sjL+rwMgHw4jE/C8/HQ3m1vBuL1fldbzd8mOueVJ92syqdEY4KJjSCde3mcRw2TA6szxedn+zwhZMps0XrqEsiUjnC1hw0TELC2Ek7uAAdzcheXv1BYLagspxpzSAoZZUsIzIq35MnFQ9DOrlNB30jq3L4pkhccKUAA8/ocvN1Rzx9QyOtERs4CVsJRK/DF71kPYrxYsGsm6RMh4cps5g1DOmM54Ly1ii0Hd3Y/BMk8VWFgBVmhqrkJCPBHAolwZaWzLR9Vb7bcWdX9NyUYE+uB2BKfuaeBUcjDljbYVY4DdtsVWvzRZdWnyUzDpjNl1Du3aloAjVJTNDpcIOVVhrHFF66lLfJL1zJr9PQ2nFJSBaKoDe+sAvLufZVHVzYh7W0h/c6AAZ+7Tvj6q9j68G/cTCS/3n1vLKHZwNi+P+pS0WkZNMBMUl+LDLuiE4omZy71r3UFMwNJV+VJ/GC5ixVUkBStsT4gGKh0Gm4Oy3qvq7Lbmq24nPdDuDR9deR11XzP4vFu3TYzfnIyiSVmgizUYGqkIXNdKTY9pgb9D2Ix5t0+NHkVzCdU03suWkkVZAoCONCn0T35gAeW38de43mf97sMOpSvj4aa1KYUm58USI7Wxxes03bAZdRzk6UtbzMaCQ6IxO0dy7X+XsjoD16hpsBeGz9dfzHj+R/Hp8nCxZRqkEDTaCKCSywjiaoMJ1TITE9eg7Jqnq8HL6gDwiZb0u0V0Rr/rmvqjxKuaLCX7ZWXTvAY+uvm3z8CP7nzVpngqrJpZKwWnCUjIviYVlirlGOzPLI3SMVyp/elvBUjjDkNhrtufFFErQ8pmdSlbK16toBHlt/HV8uHMX/vEGALkV3RJREiSlopxwdMXOZPLZ+ix+kAHpMKIk8UtE1ygtquttwxNhphrIZ1IBzjGF3IIGxGcBj6q8bHJBG8T9vdsoWrTFEuebEZuVxhhClH6P5Zo89OG9fwHNjtNQTpD0TG9PJLEYqvEY6Rlxy+ZZGfL0Aj62/bnQCXp//eeM4KzfQVJbgMQbUjlMFIm6TpcfWlZje7NBSV6IsEVmumWIbjiloUzQX9OzYdo8L1wjw2PrrpimONfmfNyzKklrgnEkSzT5QWYQW40YShyzqsRmMXbvVxKtGuYyMKaU1ugenLDm5Ily4iT14fP11Mx+xJv+zZ3MvnfdFqxU3a1W/FTB4m3Qfsyc1XUcdVhDeUDZXSFHHLQj/Y5jtC7ZqM0CXGwB4bP11i3LhOvzPGygYtiUBiwQV/4wFO0majijGsafHyRLu0yG6q35cL1rOpVxr2s5cM2jJYMCdc10Aj6q/blRpWJ//+dmm5psMl0KA2+AFRx9jMe2WbC4jQxnikd4DU8TwUjRVacgdlhmr3bpddzuJ9zXqr2xnxJfzP29RexdtjDVZqzkqa6PyvcojGrfkXiJ8SEtml/nYskicv0ivlxbqjemwUjMw5evdg8fUX9nOiC/lf94Q2i7MURk9nW1MSj5j8eAyV6y5CN2S6qbnw3vdA1Iwq+XOSCl663udN3IzLnrt+us25cI1+Z83SXQUldqQq0b5XOT17bGpLd6ssN1VMPf8c+jG8L3NeCnMdF+Ra3fRa9dft39/LuZ/3vwHoHrqGmQFafmiQw6eyzMxS05K4bL9uA+SKUQzCnSDkqOGokXyJvbgJ/BHI+qvY69//4rl20NsmK2ou2dTsyIALv/91/8n3P2Aao71WFGi8KKv1fRC5+J67Q/507/E/SOshqN5TsmYIjVt+kcjAx98iz/4SaojbIV1rexE7/C29HcYD/DX4a0rBOF5VTu7omsb11L/AWcVlcVZHSsqGuXLLp9ha8I//w3Mv+T4Ew7nTBsmgapoCrNFObIcN4pf/Ob/mrvHTGqqgAupL8qWjWPS9m/31jAe4DjA+4+uCoQoT/zOzlrNd3qd4SdphFxsUvYwGWbTWtISc3wNOWH+kHBMfc6kpmpwPgHWwqaSUG2ZWWheYOGQGaHB+eQ/kn6b3pOgLV+ODSn94wDvr8Bvb70/LLuiPPEr8OGVWfDmr45PZyccEmsVXZGe1pRNX9SU5+AVQkNTIVPCHF/jGmyDC9j4R9LfWcQvfiETmgMMUCMN1uNCakkweZsowdYobiMSlnKA93u7NzTXlSfe+SVbfnPQXmg9LpYAQxpwEtONyEyaueWM4FPjjyjG3uOaFmBTWDNgBXGEiQpsaWhnAqIijB07Dlsy3fUGeP989xbWkyf+FF2SNEtT1E0f4DYYVlxFlbaSMPIRMk/3iMU5pME2SIWJvjckciebkQuIRRyhUvkHg/iUljG5kzVog5hV7vIlCuBrmlhvgPfNHQM8lCf+FEGsYbMIBC0qC9a0uuy2wLXVbLBaP5kjHokCRxapkQyzI4QEcwgYHRZBp+XEFTqXFuNVzMtjXLJgX4gAid24Hjwc4N3dtVSe+NNiwTrzH4WVUOlDobUqr1FuAgYllc8pmzoVrELRHSIW8ViPxNy4xwjBpyR55I6J220qQTZYR4guvUICJiSpr9gFFle4RcF/OMB7BRiX8sSfhpNSO3lvEZCQfLUVTKT78Ek1LRLhWN+yLyTnp8qWUZ46b6vxdRGXfHVqx3eI75YaLa4iNNiK4NOW7wPW6lhbSOF9/M9qw8e/aoB3d156qTzxp8pXx5BKAsYSTOIIiPkp68GmTq7sZtvyzBQaRLNxIZ+paozHWoLFeExIhRBrWitHCAHrCF7/thhD8JhYz84wg93QRV88wLuLY8zF8sQ36qF1J455bOlgnELfshKVxYOXKVuKx0jaj22sczTQqPqtV/XDgpswmGTWWMSDw3ssyUunLLrVPGjYRsH5ggHeHSWiV8kT33ycFSfMgkoOK8apCye0J6VW6GOYvffgU9RWsukEi2kUV2nl4dOYUzRik9p7bcA4ggdJ53LxKcEe17B1R8eqAd7dOepV8sTXf5lhejoL85hUdhDdknPtKHFhljOT+bdq0hxbm35p2nc8+Ja1Iw+tJykgp0EWuAAZYwMVwac5KzYMslhvgHdHRrxKnvhTYcfKsxTxtTETkjHO7rr3zjoV25lAQHrqpV7bTiy2aXMmUhTBnKS91jhtR3GEoF0oLnWhWNnYgtcc4N0FxlcgT7yz3TgNIKkscx9jtV1ZKpWW+Ub1tc1eOv5ucdgpx+FJy9pgbLE7xDyXb/f+hLHVGeitHOi6A7ybo3sF8sS7w7cgdk0nJaOn3hLj3uyD0Zp5pazFIUXUpuTTU18d1EPkDoX8SkmWTnVIozEdbTcZjoqxhNHf1JrSS/AcvHjZ/SMHhL/7i5z+POsTUh/8BvNfYMTA8n+yU/MlTZxSJDRStqvEuLQKWwDctMTQogUDyQRoTQG5Kc6oQRE1yV1jCA7ri7jdZyK0sYTRjCR0Hnnd+y7nHxNgTULqw+8wj0mQKxpYvhjm9uSUxg+TTy7s2GtLUGcywhXSKZN275GsqlclX90J6bRI1aouxmgL7Q0Nen5ziM80SqMIo8cSOo+8XplT/5DHNWsSUr/6lLN/QQ3rDyzLruEW5enpf7KqZoShEduuSFOV7DLX7Ye+GmXb6/hnNNqKsVXuMDFpb9Y9eH3C6NGEzuOuI3gpMH/I6e+zDiH1fXi15t3vA1czsLws0TGEtmPEJdiiFPwlwKbgLHAFk4P6ZyPdymYYHGE0dutsChQBl2JcBFlrEkY/N5bQeXQ18gjunuMfMfsBlxJSx3niO485fwO4fGD5T/+3fPQqkneWVdwnw/3bMPkW9Wbqg+iC765Zk+xcT98ibKZc2EdgHcLoF8cSOo/Oc8fS+OyEULF4g4sJqXVcmfMfsc7A8v1/yfGXmL9I6Fn5pRwZhsPv0TxFNlAfZCvG+Oohi82UC5f/2IsJo0cTOm9YrDoKhFPEUr/LBYTUNht9zelHXDqwfPCIw4owp3mOcIQcLttWXFe3VZ/j5H3cIc0G6oPbCR+6Y2xF2EC5cGUm6wKC5tGEzhsWqw5hNidUiKX5gFWE1GXh4/Qplw4sVzOmx9QxU78g3EF6wnZlEN4FzJ1QPSLEZz1KfXC7vd8ssGdIbNUYpVx4UapyFUHzJoTOo1McSkeNn1M5MDQfs4qQuhhX5vQZFw8suwWTcyYTgioISk2YdmkhehG4PkE7w51inyAGGaU+uCXADabGzJR1fn3lwkty0asIo8cROm9Vy1g0yDxxtPvHDAmpu+PKnM8Ix1wwsGw91YJqhteaWgjYBmmQiebmSpwKKzE19hx7jkzSWOm66oPbzZ8Yj6kxVSpYjVAuvLzYMCRo3oTQecOOjjgi3NQ4l9K5/hOGhNTdcWVOTrlgYNkEXINbpCkBRyqhp+LdRB3g0OU6rMfW2HPCFFMV9nSp+uB2woepdbLBuJQyaw/ZFysXrlXwHxI0b0LovEkiOpXGA1Ijagf+KUNC6rKNa9bQnLFqYNkEnMc1uJrg2u64ELPBHpkgWbmwKpJoDhMwNbbGzAp7Yg31wS2T5rGtzit59PrKhesWG550CZpHEzpv2NGRaxlNjbMqpmEIzygJqQfjypycs2pg2cS2RY9r8HUqkqdEgKTWtWTKoRvOBPDYBltja2SO0RGjy9UHtxwRjA11ujbKF+ti5cIR9eCnxUg6owidtyoU5tK4NLji5Q3HCtiyF2IqLGYsHViOXTXOYxucDqG0HyttqYAKqYo3KTY1ekyDXRAm2AWh9JmsVh/ccg9WJ2E8YjG201sPq5ULxxX8n3XLXuMInbft2mk80rRGjCGctJ8/GFdmEQ9Ug4FlE1ll1Y7jtiraqm5Fe04VV8lvSVBL8hiPrfFVd8+7QH3Qbu2ipTVi8cvSGivc9cj8yvH11YMHdNSERtuOslM97feYFOPKzGcsI4zW0YGAbTAOaxCnxdfiYUmVWslxiIblCeAYr9VYR1gM7GmoPrilunSxxeT3DN/2eBQ9H11+nk1adn6VK71+5+Jfct4/el10/7KBZfNryUunWSCPxPECk1rdOv1WVSrQmpC+Tl46YD3ikQYcpunSQgzVB2VHFhxHVGKDgMEY5GLlQnP7FMDzw7IacAWnO6sBr12u+XanW2AO0wQ8pknnFhsL7KYIqhkEPmEXFkwaN5KQphbkUmG72wgw7WSm9RiL9QT925hkjiVIIhphFS9HKI6/8QAjlpXqg9W2C0apyaVDwKQwrwLY3j6ADR13ZyUNByQXHQu6RY09Hu6zMqXRaNZGS/KEJs0cJEe9VH1QdvBSJv9h09eiRmy0V2uJcqHcShcdvbSNg5fxkenkVprXM9rDVnX24/y9MVtncvbKY706anNl3ASll9a43UiacVquXGhvq4s2FP62NGKfQLIQYu9q1WmdMfmUrDGt8eDS0cXozH/fjmUH6Jruvm50hBDSaEU/2Ru2LEN/dl006TSc/g7tfJERxGMsgDUEr104pfWH9lQaN+M4KWQjwZbVc2rZVNHsyHal23wZtIs2JJqtIc/WLXXRFCpJkfE9jvWlfFbsNQ9pP5ZBS0zKh4R0aMFj1IjTcTnvi0Zz2rt7NdvQb2mgbju1plsH8MmbnEk7KbK0b+wC2iy3aX3szW8xeZvDwET6hWZYwqTXSSG+wMETKum0Dq/q+x62gt2ua2ppAo309TRk9TPazfV3qL9H8z7uhGqGqxNVg/FKx0HBl9OVUORn8Q8Jx9gFttGQUDr3tzcXX9xGgN0EpzN9mdZ3GATtPhL+CjxFDmkeEU6x56kqZRusLzALXVqkCN7zMEcqwjmywDQ6OhyUe0Xao1Qpyncrg6wKp9XfWDsaZplElvQ/b3sdweeghorwBDlHzgk1JmMc/wiERICVy2VJFdMjFuLQSp3S0W3+sngt2njwNgLssFGVQdJ0tu0KH4ky1LW4yrbkuaA6Iy9oz/qEMMXMMDWyIHhsAyFZc2peV9hc7kiKvfULxCl9iddfRK1f8kk9qvbdOoBtOg7ZkOZ5MsGrSHsokgLXUp9y88smniwWyuFSIRVmjplga3yD8Uij5QS1ZiM4U3Qw5QlSm2bXjFe6jzzBFtpg+/YBbLAWG7OPynNjlCw65fukGNdkJRf7yM1fOxVzbxOJVocFoYIaGwH22mIQkrvu1E2nGuebxIgW9U9TSiukPGU+Lt++c3DJPKhyhEEbXCQLUpae2exiKy6tMPe9mDRBFCEMTWrtwxN8qvuGnt6MoihKWS5NSyBhbH8StXoAz8PLOrRgLtOT/+4vcu+7vDLnqNvztOq7fmd8sMmY9Xzn1zj8Dq8+XVdu2Nv0IIySgEdQo3xVHps3Q5i3fLFsV4aiqzAiBhbgMDEd1uh8qZZ+lwhjkgokkOIv4xNJmyncdfUUzgB4oFMBtiu71Xumpz/P+cfUP+SlwFExwWW62r7b+LSPxqxn/gvMZ5z9C16t15UbNlq+jbGJtco7p8wbYlL4alSyfWdeuu0j7JA3JFNuVAwtst7F7FhWBbPFNKIUORndWtLraFLmMu7KFVDDOzqkeaiN33YAW/r76wR4XDN/yN1z7hejPau06EddkS/6XThfcz1fI/4K736fO48vlxt2PXJYFaeUkFS8U15XE3428xdtn2kc8GQlf1vkIaNRRnOMvLTWrZbElEHeLWi1o0dlKPAh1MVgbbVquPJ5+Cr8LU5/H/+I2QlHIU2ClXM9G8v7Rr7oc/hozfUUgsPnb3D+I+7WF8kNO92GY0SNvuxiE+2Bt8prVJTkzE64sfOstxuwfxUUoyk8VjcTlsqe2qITSFoSj6Epd4KsT6BZOWmtgE3hBfir8IzZDwgV4ZTZvD8VvPHERo8v+vL1DASHTz/i9OlKueHDjK5Rnx/JB1Vb1ioXdBra16dmt7dgik10yA/FwJSVY6XjA3oy4SqM2frqDPPSRMex9qs3XQtoWxMj7/Er8GWYsXgjaVz4OYumP2+9kbxvny/6kvWsEBw+fcb5bInc8APdhpOSs01tEqIkoiZjbAqKMruLbJYddHuHFRIyJcbdEdbl2sVLaySygunutBg96Y2/JjKRCdyHV+AEFtTvIpbKIXOamknYSiB6KV/0JetZITgcjjk5ZdaskBtWO86UF0ap6ozGXJk2WNiRUlCPFir66lzdm/SLSuK7EUdPz8f1z29Skq6F1fXg8+5UVR6bszncP4Tn4KUkkdJ8UFCY1zR1i8RmL/qQL3rlei4THG7OODlnKko4oI01kd3CaM08Ia18kC3GNoVaO9iDh+hWxSyTXFABXoau7Q6q9OxYg/OVEMw6jdbtSrJ9cBcewGmaZmg+bvkUnUUaGr+ZfnMH45Ivevl61hMcXsxYLFTu1hTm2zViCp7u0o5l+2PSUh9bDj6FgYypufBDhqK2+oXkiuHFHR3zfj+9PtA8oR0xnqX8qn+sx3bFODSbbF0X8EUvWQ8jBIcjo5bRmLOljDNtcqNtOe756h3l0VhKa9hDd2l1eqmsnh0MNMT/Cqnx6BInumhLT8luljzQ53RiJeA/0dxe5NK0o2fA1+GLXr6eNQWHNUOJssQaTRlGpLHKL9fD+IrQzTOMZS9fNQD4AnRNVxvTdjC+fJdcDDWQcyB00B0t9BDwTxXgaAfzDZ/DBXzRnfWMFRwuNqocOmX6OKNkY63h5n/fFcB28McVHqnXZVI27K0i4rDLNE9lDKV/rT+udVbD8dFFu2GGZ8mOt0kAXcoX3ZkIWVtw+MNf5NjR2FbivROHmhV1/pj2egv/fMGIOWTIWrV3Av8N9imV9IWml36H6cUjqEWNv9aNc+veb2sH46PRaHSuMBxvtW+twxctq0z+QsHhux8Q7rCY4Ct8lqsx7c6Sy0dl5T89rIeEuZKoVctIk1hNpfavER6yyH1Vvm3MbsUHy4ab4hWr/OZPcsRBphnaV65/ZcdYPNNwsjN/djlf9NqCw9U5ExCPcdhKxUgLSmfROpLp4WSUr8ojdwbncbvCf+a/YzRaEc6QOvXcGO256TXc5Lab9POvB+AWY7PigWYjzhifbovuunzRawsO24ZqQQAqguBtmpmPB7ysXJfyDDaV/aPGillgz1MdQg4u5MYaEtBNNHFjkRlSpd65lp4hd2AVPTfbV7FGpyIOfmNc/XVsPfg7vzaS/3nkvLL593ANLvMuRMGpQIhiF7kUEW9QDpAUbTWYBcbp4WpacHHY1aacqQyjGZS9HI3yCBT9kUZJhVOD+zUDvEH9ddR11fzPcTDQ5TlgB0KwqdXSavk9BC0pKp0WmcuowSw07VXmXC5guzSa4p0UvRw2lbDiYUx0ExJJRzWzi6Gm8cnEkfXXsdcG/M/jAJa0+bmCgdmQ9CYlNlSYZOKixmRsgiFxkrmW4l3KdFKv1DM8tk6WxPYJZhUUzcd8Kdtgrw/gkfXXDT7+avmfVak32qhtkg6NVdUS5wgkru1YzIkSduTW1FDwVWV3JQVJVuieTc0y4iDpFwc7/BvSalvKdQM8sv662cevz/+8sQVnjVAT0W2wLllw1JiMhJRxgDjCjLQsOzSFSgZqx7lAW1JW0e03yAD3asC+GD3NbQhbe+mN5GXH1F83KDOM4n/e5JIuH4NpdQARrFPBVptUNcjj4cVMcFSRTE2NpR1LEYbYMmfWpXgP9KejaPsLUhuvLCsVXznAG9dfx9SR1ud/3hZdCLHb1GMdPqRJgqDmm76mHbvOXDtiO2QPUcKo/TWkQ0i2JFXpBoo7vij1i1Lp3ADAo+qvG3V0rM//vFnnTE4hxd5Ka/Cor5YEdsLVJyKtDgVoHgtW11pWSjolPNMnrlrVj9Fv2Qn60twMwKPqr+N/wvr8z5tZcDsDrv06tkqyzESM85Ycv6XBWA2birlNCXrI6VbD2lx2L0vQO0QVTVVLH4SE67fgsfVXv8n7sz7/85Z7cMtbE6f088wSaR4kCkCm10s6pKbJhfqiUNGLq+0gLWC6eUAZFPnLjwqtKd8EwGvWX59t7iPW4X/eAN1svgRVSY990YZg06BD1ohLMtyFTI4pKTJsS9xREq9EOaPWiO2gpms7397x6nQJkbh+Fz2q/rqRROX6/M8bJrqlVW4l6JEptKeUFuMYUbtCQ7CIttpGc6MY93x1r1vgAnRXvY5cvwWPqb9uWQm+lP95QxdNMeWhOq1x0Db55C7GcUv2ZUuN6n8iKzsvOxibC//Yfs9Na8r2Rlz02vXXDT57FP/zJi66/EJSmsJKa8QxnoqW3VLQ+jZVUtJwJ8PNX1NQCwfNgdhhHD9on7PdRdrdGPF28rJr1F+3LBdeyv+8yYfLoMYet1vX4upNAjVvwOUWnlNXJXlkzk5Il6kqeoiL0C07qno+/CYBXq/+utlnsz7/Mzvy0tmI4zm4ag23PRN3t/CWryoUVJGm+5+K8RJ0V8Hc88/XHUX/HfiAq7t+BH+x6v8t438enWmdJwFA6ZINriLGKv/95f8lT9/FnyA1NMVEvQyaXuu+gz36f/DD73E4pwqpLcvm/o0Vle78n//+L/NPvoefp1pTJye6e4A/D082FERa5/opeH9zpvh13cNm19/4v/LDe5xMWTi8I0Ta0qKlK27AS/v3/r+/x/2GO9K2c7kVMonDpq7//jc5PKCxeNPpFVzaRr01wF8C4Pu76hXuX18H4LduTr79guuFD3n5BHfI+ZRFhY8w29TYhbbLi/bvBdqKE4fUgg1pBKnV3FEaCWOWyA+m3WpORZr/j+9TKJtW8yBTF2/ZEODI9/QavHkVdGFp/Pjn4Q+u5hXapsP5sOH+OXXA1LiKuqJxiMNbhTkbdJTCy4llEt6NnqRT4dhg1V3nbdrm6dYMecA1yTOL4PWTE9L5VzPFlLBCvlG58AhehnN4uHsAYinyJ+AZ/NkVvELbfOBUuOO5syBIEtiqHU1k9XeISX5bsimrkUUhnGDxourN8SgUsCZVtKyGbyGzHXdjOhsAvOAswSRyIBddRdEZWP6GZhNK/yjwew9ehBo+3jEADu7Ay2n8mDc+TS7awUHg0OMzR0LABhqLD4hJEh/BEGyBdGlSJoXYXtr+3HS4ijzVpgi0paWXtdruGTknXBz+11qT1Q2inxaTzQCO46P3lfLpyS4fou2PH/PupwZgCxNhGlj4IvUuWEsTkqMWm6i4xCSMc9N1RDQoCVcuGItJ/MRWefais+3synowi/dESgJjkilnWnBTGvRWmaw8oR15257t7CHmCf8HOn7cwI8+NQBXMBEmAa8PMRemrNCEhLGEhDQKcGZWS319BX9PFBEwGTbRBhLbDcaV3drFcDqk5kCTd2JF1Wp0HraqBx8U0wwBTnbpCadwBA/gTH/CDrcCs93LV8E0YlmmcyQRQnjBa8JESmGUfIjK/7fkaDJpmD2QptFNVJU1bbtIAjjWQizepOKptRjbzR9Kag6xZmMLLjHOtcLT3Tx9o/0EcTT1XN3E45u24AiwEypDJXihKjQxjLprEwcmRKclaDNZCVqr/V8mYWyFADbusiY5hvgFoU2vio49RgJLn5OsReRFN6tabeetiiy0V7KFHT3HyZLx491u95sn4K1QQSPKM9hNT0wMVvAWbzDSVdrKw4zRjZMyJIHkfq1VAVCDl/bUhNKlGq0zGr05+YAceXVPCttVk0oqjVwMPt+BBefx4yPtGVkUsqY3CHDPiCM5ngupUwCdbkpd8kbPrCWHhkmtIKLEetF2499eS1jZlIPGYnlcPXeM2KD9vLS0bW3ktYNqUllpKLn5ZrsxlIzxvDu5eHxzGLctkZLEY4PgSOg2IUVVcUONzUDBEpRaMoXNmUc0tFZrTZquiLyKxrSm3DvIW9Fil+AkhXu5PhEPx9mUNwqypDvZWdKlhIJQY7vn2OsnmBeOWnYZ0m1iwbbw1U60by5om47iHRV6fOgzjMf/DAZrlP40Z7syxpLK0lJ0gqaAK1c2KQKu7tabTXkLFz0sCftuwX++MyNeNn68k5Buq23YQhUh0SNTJa1ioQ0p4nUG2y0XilF1JqODqdImloPS4Bp111DEWT0jJjVv95uX9BBV7eB3bUWcu0acSVM23YZdd8R8UbQUxJ9wdu3oMuhdt929ME+mh6JXJ8di2RxbTi6TbrDquqV4aUKR2iwT6aZbyOwEXN3DUsWr8Hn4EhwNyHuXHh7/pdaUjtR7vnDh/d8c9xD/s5f501eQ1+CuDiCvGhk1AN/4Tf74RfxPwD3toLarR0zNtsnPzmS64KIRk861dMWCU8ArasG9T9H0ZBpsDGnjtAOM2+/LuIb2iIUGXNgl5ZmKD/Tw8TlaAuihaFP5yrw18v4x1898zIdP+DDAX1bM3GAMvPgRP/cJn3zCW013nrhHkrITyvYuwOUkcHuKlRSW5C6rzIdY4ppnF7J8aAJbQepgbJYBjCY9usGXDKQxq7RZfh9eg5d1UHMVATRaD/4BHK93/1iAgYZ/+jqPn8Dn4UExmWrpa3+ZOK6MvM3bjwfzxNWA2dhs8+51XHSPJiaAhGSpWevEs5xHLXcEGFXYiCONySH3fPWq93JIsBiSWvWyc3CAN+EcXoT7rCSANloPPoa31rt/5PUA/gp8Q/jDD3hyrjzlR8VkanfOvB1XPubt17vzxAfdSVbD1pzAnfgyF3ycadOTOTXhpEUoLC1HZyNGW3dtmjeXgr2r56JNmRwdNNWaQVBddd6rh4MhviEB9EFRD/7RGvePvCbwAL4Mx/D6M541hHO4D3e7g6PafdcZVw689z7NGTwo5om7A8sPhccT6qKcl9NJl9aM/9kX+e59Hh1yPqGuCCZxuITcsmNaJ5F7d0q6J3H48TO1/+M57085q2icdu2U+W36Ldllz9Agiv4YGljoEN908EzvDOrBF98/vtJwCC/BF2AG75xxEmjmMIcjxbjoaxqOK3/4hPOZzhMPBpYPG44CM0dTVm1LjLtUWWVz1Bcf8tEx0zs8O2A2YVHRxKYOiy/aOVoAaMu0i7ubu43njjmd4ibMHU1sIDHaQNKrZND/FZYdk54oCXetjq7E7IVl9eAL7t+oHnwXXtLx44czzoRFHBztYVwtH1d+NOMkupZ5MTM+gUmq90X+Bh9zjRlmaQ+m7YMqUL/veemcecAtOJ0yq1JnVlN27di2E0+Klp1tAJ4KRw1eMI7aJjsO3R8kPSI3fUFXnIOfdQe86sIIVtWDL7h//Ok6vj8vwDk08NEcI8zz7OhBy+WwalzZeZ4+0XniRfst9pAJqQHDGLzVQ2pheZnnv1OWhwO43/AgcvAEXEVVpa4db9sGvNK8wjaENHkfFQ4Ci5i7dqnQlPoLQrHXZDvO3BIXZbJOBrOaEbML6sFL798I4FhKihjHMsPjBUZYCMFr6nvaArxqXPn4lCa+cHfSa2cP27g3Z3ziYTRrcbQNGLQmGF3F3cBdzzzX7AILx0IB9rbwn9kx2G1FW3Inic+ZLIsVvKR8Zwfj0l1fkqo8LWY1M3IX14OX3r9RKTIO+d9XzAI8qRPGPn/4NC2n6o4rN8XJ82TOIvuVA8zLKUHRFgBCetlDZlqR1gLKjS39xoE7Bt8UvA6BxuEDjU3tFsEijgA+615tmZkXKqiEENrh41iLDDZNq4pKTWR3LZfnos81LOuNa15cD956vLMsJd1rqYp51gDUQqMYm2XsxnUhD2jg1DM7SeuJxxgrmpfISSXVIJIS5qJJSvJPEQ49DQTVIbYWJ9QWa/E2+c/oPK1drmC7WSfJRNKBO5Yjvcp7Gc3dmmI/Xh1kDTEuiSnWqQf37h+fTMhGnDf6dsS8SQfQWlqqwXXGlc/PEZ/SC5mtzIV0nAshlQdM/LvUtYutrEZ/Y+EAFtq1k28zQhOwLr1AIeANzhF8t9qzTdZf2qRKO6MWE9ohBYwibbOmrFtNmg3mcS+tB28xv2uKd/agYCvOP+GkSc+0lr7RXzyufL7QbkUpjLjEWFLqOIkAGu2B0tNlO9Eau2W1qcOUvVRgKzypKIQZ5KI3q0MLzqTNRYqiZOqmtqloIRlmkBHVpHmRYV6/HixbO6UC47KOFJnoMrVyr7wYz+SlW6GUaghYbY1I6kkxA2W1fSJokUdSh2LQ1GAimRGm0MT+uu57H5l7QgOWxERpO9moLRPgTtquWCfFlGlIjQaRly9odmzMOWY+IBO5tB4sW/0+VWGUh32qYk79EidWKrjWuiLpiVNGFWFRJVktyeXWmbgBBzVl8anPuXyNJlBJOlKLTgAbi/EYHVHxWiDaVR06GnHQNpJcWcK2jJtiCfG2sEHLzuI66sGrMK47nPIInPnu799935aOK2cvmvubrE38ZzZjrELCmXM2hM7UcpXD2oC3+ECVp7xtIuxptJ0jUr3sBmBS47TVxlvJ1Sqb/E0uLdvLj0lLr29ypdd/eMX3f6lrxGlKwKQxEGvw0qHbkbwrF3uHKwVENbIV2wZ13kNEF6zD+x24aLNMfDTCbDPnEikZFyTNttxWBXDaBuM8KtI2rmaMdUY7cXcUPstqTGvBGSrFWIpNMfbdea990bvAOC1YX0qbc6smDS1mPxSJoW4fwEXvjMmhlijDRq6qale6aJEuFGoppYDoBELQzLBuh/mZNx7jkinv0EtnUp50lO9hbNK57lZaMAWuWR5Yo9/kYwcYI0t4gWM47Umnl3YmpeBPqSyNp3K7s2DSAS/39KRuEN2bS4xvowV3dFRMx/VFcp2Yp8w2nTO9hCXtHG1kF1L4KlrJr2wKfyq77R7MKpFKzWlY9UkhYxyHWW6nBWPaudvEAl3CGcNpSXPZ6R9BbBtIl6cHL3gIBi+42CYXqCx1gfGWe7Ap0h3luyXdt1MKy4YUT9xSF01G16YEdWsouW9mgDHd3veyA97H+Ya47ZmEbqMY72oPztCGvK0onL44AvgC49saZKkWRz4veWljE1FHjbRJaWv6ZKKtl875h4CziFCZhG5rx7tefsl0aRT1bMHZjm8dwL/6u7wCRysaQblQoG5yAQN5zpatMNY/+yf8z+GLcH/Qn0iX2W2oEfXP4GvwQHuIL9AYGnaO3zqAX6946nkgqZNnUhx43DIdQtMFeOPrgy/y3Yd85HlJWwjLFkU3kFwq28xPnuPhMWeS+tDLV9Otllq7pQCf3uXJDN9wFDiUTgefHaiYbdfi3b3u8+iY6TnzhgehI1LTe8lcd7s1wJSzKbahCRxKKztTLXstGAiu3a6rPuQs5pk9TWAan5f0BZmGf7Ylxzzk/A7PAs4QPPPAHeFQ2hbFHszlgZuKZsJcUmbDC40sEU403cEjczstOEypa+YxevL4QBC8oRYqWdK6b7sK25tfE+oDZgtOQ2Jg8T41HGcBE6fTWHn4JtHcu9S7uYgU5KSCkl/mcnq+5/YBXOEr6lCUCwOTOM1taOI8mSxx1NsCXBEmLKbMAg5MkwbLmpBaFOPrNSlO2HnLiEqW3tHEwd8AeiQLmn+2gxjC3k6AxREqvKcJbTEzlpLiw4rNZK6oJdidbMMGX9FULKr0AkW+2qDEPBNNm5QAt2Ik2nftNWHetubosHLo2nG4vQA7GkcVCgVCgaDixHqo9UUn1A6OshapaNR/LPRYFV8siT1cCtJE0k/3WtaNSuUZYKPnsVIW0xXWnMUxq5+En4Kvw/MqQmVXnAXj9Z+9zM98zM/Agy7F/qqj2Nh67b8HjFnPP3iBn/tkpdzwEJX/whIcQUXOaikeliCRGUk7tiwF0rItwMEhjkZ309hikFoRAmLTpEXWuHS6y+am/KB/fM50aLEhGnSMwkpxzOov4H0AvgovwJ1iGzDLtJn/9BU+fAINfwUe6FHSLhu83viV/+/HrOePX+STT2B9uWGbrMHHLldRBlhS/CJQmcRxJFqZica01XixAZsYiH1uolZxLrR/SgxVIJjkpQP4PE9sE59LKLr7kltSBogS5tyszzH8Fvw8/AS8rNOg0xUS9fIaHwb+6et8Q/gyvKRjf5OusOzGx8evA/BP4IP11uN/grca5O0lcsPLJ5YjwI4QkJBOHa0WdMZYGxPbh2W2nR9v3WxEWqgp/G3+6VZbRLSAAZ3BhdhAaUL33VUSw9yjEsvbaQ9u4A/gGXwZXoEHOuU1GSj2chf+Mo+f8IcfcAxfIKVmyunRbYQVnoevwgfw3TXXcw++xNuP4fhyueEUNttEduRVaDttddoP0eSxLe2LENk6itYxlrxBNBYrNNKSQmeaLcm9c8UsaB5WyO6675yyQIAWSDpBVoA/gxmcwEvwoDv0m58UE7gHn+fJOa8/Ywan8EKRfjsopF83eCglX/Sfr7OeaRoQfvt1CGvIDccH5BCvw1sWIzRGC/66t0VTcLZQZtm6PlAasbOJ9iwWtUo7biktTSIPxnR24jxP1ZKaqq+2RcXM9OrBAm/AAs7hDJ5bNmGb+KIfwCs8a3jnjBrOFeMjHSCdbKr+2uOLfnOd9eiA8Hvvwwq54VbP2OqwkB48Ytc4YEOiH2vTXqodabfWEOzso4qxdbqD5L6tbtNPECqbhnA708DZH4QOJUXqScmUlks7Ot6FBuZw3n2mEbaUX7kDzxHOOQk8nKWMzAzu6ZZ8sOFw4RK+6PcuXo9tB4SbMz58ApfKDXf3szjNIIbGpD5TKTRxGkEMLjLl+K3wlWXBsCUxIDU+jbOiysESqAy1MGUJpXgwbTWzNOVEziIXZrJ+VIztl1PUBxTSo0dwn2bOmfDRPD3TRTGlfbCJvO9KvuhL1hMHhB9wPuPRLGHcdOWG2xc0U+5bQtAJT0nRTewXL1pgk2+rZAdeWmz3jxAqfNQQdzTlbF8uJ5ecEIWvTkevAHpwz7w78QujlD/Lr491bD8/1vhM2yrUQRrWXNQY4fGilfctMWYjL72UL/qS9eiA8EmN88nbNdour+PBbbAjOjIa4iBhfFg6rxeKdEGcL6p3EWR1Qq2Qkhs2DrnkRnmN9tG2EAqmgPw6hoL7Oza7B+3SCrR9tRftko+Lsf2F/mkTndN2LmzuMcKTuj/mX2+4Va3ki16+nnJY+S7MefpkidxwnV+4wkXH8TKnX0tsYzYp29DOOoSW1nf7nTh2akYiWmcJOuTidSaqESrTYpwjJJNVGQr+rLI7WsqerHW6Kp/oM2pKuV7T1QY9gjqlZp41/WfKpl56FV/0kvXQFRyeQ83xaTu5E8p5dNP3dUF34ihyI3GSpeCsywSh22ZJdWto9winhqifb7VRvgktxp13vyjrS0EjvrRfZ62uyqddSWaWYlwTPAtJZ2oZ3j/Sgi/mi+6vpzesfAcWNA0n8xVyw90GVFGuZjTXEQy+6GfLGLMLL523f5E0OmxVjDoOuRiH91RKU+vtoCtH7TgmvBLvtFXWLW15H9GTdVw8ow4IlRLeHECN9ym1e9K0I+Cbnhgv4Yu+aD2HaQJ80XDqOzSGAV4+4yCqBxrsJAX6ZTIoX36QnvzhhzzMfFW2dZVLOJfo0zbce5OvwXMFaZ81mOnlTVXpDZsQNuoYWveketKb5+6JOOsgX+NTm7H49fUTlx+WLuWL7qxnOFh4BxpmJx0p2gDzA/BUARuS6phR+pUsY7MMboAHx5xNsSVfVZcYSwqCKrqon7zM+8ecCkeS4nm3rINuaWvVNnMRI1IRpxTqx8PZUZ0Br/UEduo3B3hNvmgZfs9gQPj8vIOxd2kndir3awvJ6BLvoUuOfFWNYB0LR1OQJoUySKb9IlOBx74q1+ADC2G6rOdmFdJcD8BkfualA+BdjOOzP9uUhGUEX/TwhZsUduwRr8wNuXKurCixLBgpQI0mDbJr9dIqUuV+92ngkJZ7xduCk2yZKbfWrH1VBiTg9VdzsgRjW3CVXCvAwDd+c1z9dWw9+B+8MJL/eY15ZQ/HqvTwVdsZn5WQsgRRnMaWaecu3jFvMBEmgg+FJFZsnSl0zjB9OqPYaBD7qmoVyImFvzi41usesV0julaAR9dfR15Xzv9sEruRDyk1nb+QaLU67T885GTls6YgcY+UiMa25M/pwGrbCfzkvR3e0jjtuaFtnwuagHTSb5y7boBH119HXhvwP487jJLsLJ4XnUkHX5sLbS61dpiAXRoZSCrFJ+EjpeU3puVfitngYNo6PJrAigKktmwjyQdZpfq30mmtulaAx9Zfx15Xzv+cyeuiBFUs9zq8Kq+XB9a4PVvph3GV4E3y8HENJrN55H1X2p8VyqSKwVusJDKzXOZzplWdzBUFK9e+B4+uv468xvI/b5xtSAkBHQaPvtqWzllVvEOxPbuiE6+j2pvjcKsbvI7txnRErgfH7LdXqjq0IokKzga14GzQ23SSbCQvO6r+Or7SMIr/efOkkqSdMnj9mBx2DRsiY29Uj6+qK9ZrssCKaptR6HKURdwUYeUWA2kPzVKQO8ku2nU3Anhs/XWkBx3F/7wJtCTTTIKftthue1ty9xvNYLY/zo5KSbIuKbXpbEdSyeRyYdAIwKY2neyoc3+k1XUaufYga3T9daMUx/r8z1s10ITknIO0kuoMt+TB8jK0lpayqqjsJ2qtXAYwBU932zinimgmd6mTRDnQfr88q36NAI+tv24E8Pr8zxtasBqx0+xHH9HhlrwsxxNUfKOHQaZBITNf0uccj8GXiVmXAuPEAKSdN/4GLHhs/XWj92dN/uetNuBMnVR+XWDc25JLjo5Mg5IZIq226tmCsip2zZliL213YrTlL2hcFjpCduyim3M7/eB16q/blQsv5X/esDRbtJeabLIosWy3ycavwLhtxdWzbMmHiBTiVjJo6lCLjXZsi7p9PEPnsq6X6wd4bP11i0rD5fzPm/0A6brrIsllenZs0lCJlU4abakR59enZKrKe3BZihbTxlyZ2zl1+g0wvgmA166/bhwDrcn/7Ddz0eWZuJvfSESug6NzZsox3Z04FIxz0mUjMwVOOVTq1CQ0AhdbBGVdjG/CgsfUX7esJl3K/7ytWHRv683praW/8iDOCqWLLhpljDY1ZpzK75QiaZoOTpLKl60auHS/97oBXrv+umU9+FL+5+NtLFgjqVLCdbmj7pY5zPCPLOHNCwXGOcLquOhi8CmCWvbcuO73XmMUPab+ug3A6/A/78Bwe0bcS2+tgHn4J5pyS2WbOck0F51Vq3LcjhLvZ67p1ABbaL2H67bg78BfjKi/jr3+T/ABV3ilLmNXTI2SpvxWBtt6/Z//D0z/FXaGbSBgylzlsEGp+5//xrd4/ae4d8DUUjlslfIYS3t06HZpvfQtvv0N7AHWqtjP2pW08QD/FLy//da38vo8PNlKHf5y37Dxdfe/oj4kVIgFq3koLReSR76W/bx//n9k8jonZxzWTANVwEniDsg87sOSd/z7//PvMp3jQiptGVWFX2caezzAXwfgtzYUvbr0iozs32c3Uge7varH+CNE6cvEYmzbPZ9hMaYDdjK4V2iecf6EcEbdUDVUARda2KzO/JtCuDbNQB/iTeL0EG1JSO1jbXS+nLxtPMDPw1fh5+EPrgSEKE/8Gry5A73ui87AmxwdatyMEBCPNOCSKUeRZ2P6Myb5MRvgCHmA9ywsMifU+AYXcB6Xa5GibUC5TSyerxyh0j6QgLVpdyhfArRTTLqQjwe4HOD9s92D4Ap54odXAPBWLAwB02igG5Kkc+piN4lvODIFGAZgT+EO4Si1s7fjSR7vcQETUkRm9O+MXyo9OYhfe4xt9STQ2pcZRLayCV90b4D3jR0DYAfyxJ+eywg2IL7NTMXna7S/RpQ63JhWEM8U41ZyQGjwsVS0QBrEKLu8xwZsbi4wLcCT+OGidPIOCe1PiSc9Qt+go+vYqB7cG+B9d8cAD+WJPz0Am2gxXgU9IneOqDpAAXOsOltVuMzpdakJXrdPCzXiNVUpCeOos5cxnpQT39G+XVLhs1osQVvJKPZyNq8HDwd4d7pNDuWJPxVX7MSzqUDU6gfadKiNlUFTzLeFHHDlzO4kpa7aiKhBPGKwOqxsBAmYkOIpipyXcQSPlRTf+Tii0U3EJGaZsDER2qoB3h2hu0qe+NNwUooYU8y5mILbJe6OuX+2FTKy7bieTDAemaQyQ0CPthljSWO+xmFDIYiESjM5xKd6Ik5lvLq5GrQ3aCMLvmCA9wowLuWJb9xF59hVVP6O0CrBi3ZjZSNOvRy+I6klNVRJYRBaEzdN+imiUXQ8iVF8fsp+W4JXw7WISW7fDh7lptWkCwZ4d7QTXyBPfJMYK7SijjFppGnlIVJBJBYj7eUwtiP1IBXGI1XCsjNpbjENVpSAJ2hq2LTywEly3hUYazt31J8w2+aiLx3g3fohXixPfOMYm6zCGs9LVo9MoW3MCJE7R5u/WsOIjrqBoHUO0bJE9vxBpbhsd3+Nb4/vtPCZ4oZYCitNeYuC/8UDvDvy0qvkiW/cgqNqRyzqSZa/s0mqNGjtKOoTm14zZpUauiQgVfqtQiZjq7Q27JNaSK5ExRcrGCXO1FJYh6jR6CFqK7bZdQZ4t8g0rSlPfP1RdBtqaa9diqtzJkQ9duSryi2brQXbxDwbRUpFMBHjRj8+Nt7GDKgvph9okW7LX47gu0SpGnnFQ1S1lYldOsC7hYteR574ZuKs7Ei1lBsfdz7IZoxzzCVmmVqaSySzQbBVAWDek+N4jh9E/4VqZrJjPwiv9BC1XcvOWgO8275CVyBPvAtTVlDJfZkaZGU7NpqBogAj/xEHkeAuJihWYCxGN6e8+9JtSegFXF1TrhhLGP1fak3pebgPz192/8gB4d/6WT7+GdYnpH7hH/DJzzFiYPn/vjW0SgNpTNuPIZoAEZv8tlGw4+RLxy+ZjnKa5NdFoC7UaW0aduoYse6+bXg1DLg6UfRYwmhGEjqPvF75U558SANrElK/+MdpXvmqBpaXOa/MTZaa1DOcSiLaw9j0NNNst3c+63c7EKTpkvKHzu6bPbP0RkuHAVcbRY8ijP46MIbQeeT1mhA+5PV/inyDdQipf8LTvMXbwvoDy7IruDNVZKTfV4CTSRUYdybUCnGU7KUTDxLgCknqUm5aAW6/1p6eMsOYsphLzsHrE0Y/P5bQedx1F/4yPHnMB3/IOoTU9+BL8PhtjuFKBpZXnYNJxTuv+2XqolKR2UQgHhS5novuxVySJhBNRF3SoKK1XZbbXjVwWNyOjlqWJjrWJIy+P5bQedyldNScP+HZ61xKSK3jyrz+NiHG1hcOLL/+P+PDF2gOkekKGiNWKgJ+8Z/x8Iv4DdQHzcpZyF4v19I27w9/yPGDFQvmEpKtqv/TLiWMfn4sofMm9eAH8Ao0zzh7h4sJqYtxZd5/D7hkYPneDzl5idlzNHcIB0jVlQ+8ULzw/nc5/ojzl2juE0apD7LRnJxe04dMz2iOCFNtGFpTuXA5AhcTRo8mdN4kz30nVjEC4YTZQy4gpC7GlTlrePKhGsKKgeXpCYeO0MAd/GH7yKQUlXPLOasOH3FnSphjHuDvEu4gB8g66oNbtr6eMbFIA4fIBJkgayoXriw2XEDQPJrQeROAlY6aeYOcMf+IVYTU3XFlZufMHinGywaW3YLpObVBAsbjF4QJMsVUSayjk4voPsHJOQfPWDhCgDnmDl6XIRerD24HsGtw86RMHOLvVSHrKBdeVE26gKB5NKHzaIwLOmrqBWJYZDLhASG16c0Tn+CdRhWDgWXnqRZUTnPIHuMJTfLVpkoYy5CzylHVTGZMTwkGAo2HBlkQplrJX6U+uF1wZz2uwS1SQ12IqWaPuO4baZaEFBdukksJmkcTOm+YJSvoqPFzxFA/YUhIvWxcmSdPWTWwbAKVp6rxTtPFUZfKIwpzm4IoMfaYQLWgmlG5FME2gdBgm+J7J+rtS/XBbaVLsR7bpPQnpMFlo2doWaVceHk9+MkyguZNCJ1He+kuHTWyQAzNM5YSUg/GlTk9ZunAsg1qELVOhUSAK0LABIJHLKbqaEbHZLL1VA3VgqoiOKXYiS+HRyaEKgsfIqX64HYWbLRXy/qWoylIV9gudL1OWBNgBgTNmxA6b4txDT4gi3Ri7xFSLxtXpmmYnzAcWDZgY8d503LFogz5sbonDgkKcxGsWsE1OI+rcQtlgBBCSOKD1mtqYpIU8cTvBmAT0yZe+zUzeY92fYjTtGipXLhuR0ePoHk0ofNWBX+lo8Z7pAZDk8mEw5L7dVyZZoE/pTewbI6SNbiAL5xeygW4xPRuLCGbhcO4RIeTMFYHEJkYyEO9HmJfXMDEj/LaH781wHHZEtqSQ/69UnGpzH7LKIAZEDSPJnTesJTUa+rwTepI9dLJEawYV+ZkRn9g+QirD8vF8Mq0jFQ29js6kCS3E1+jZIhgPNanHdHFqFvPJLHqFwQqbIA4jhDxcNsOCCQLDomaL/dr5lyJaJU6FxPFjO3JOh3kVMcROo8u+C+jo05GjMF3P3/FuDLn5x2M04xXULPwaS6hBYki+MrMdZJSgPHlcB7nCR5bJ9Kr5ACUn9jk5kivdd8tk95SOGrtqu9lr2IhK65ZtEl7ZKrp7DrqwZfRUSN1el7+7NJxZbywOC8neNKTch5vsTEMNsoCCqHBCqIPRjIPkm0BjvFODGtto99rCl+d3wmHkW0FPdpZtC7MMcVtGFQjJLX5bdQ2+x9ypdc313uj8xlsrfuLgWXz1cRhZvJYX0iNVBRcVcmCXZs6aEf3RQF2WI/TcCbKmGU3IOoDJGDdDub0+hYckt6PlGu2BcxmhbTdj/klhccLGJMcqRjMJP1jW2ETqLSWJ/29MAoORluJ+6LPffBZbi5gqi5h6catQpmOT7/OFf5UorRpLzCqcMltBLhwd1are3kztrSzXO0LUbXRQcdLh/RdSZ+swRm819REDrtqzC4es6Gw4JCKlSnjYVpo0xeq33PrADbFLL3RuCmObVmPN+24kfa+AojDuM4umKe2QwCf6EN906HwjujaitDs5o0s1y+k3lgbT2W2i7FJdnwbLXhJUBq/9liTctSmFC/0OqUinb0QddTWamtjbHRFuWJJ6NpqZ8vO3fZJ37Db+2GkaPYLGHs7XTTdiFQJ68SkVJFVmY6McR5UycflNCsccHFaV9FNbR4NttLxw4pQ7wJd066Z0ohVbzihaxHVExd/ay04oxUKWt+AsdiQ9OUyZ2krzN19IZIwafSTFgIBnMV73ADj7V/K8u1MaY2sJp2HWm0f41tqwajEvdHWOJs510MaAqN4aoSiPCXtN2KSi46dUxHdaMquar82O1x5jqhDGvqmoE9LfxcY3zqA7/x3HA67r9ZG4O6Cuxu12/+TP+eLP+I+HErqDDCDVmBDO4larujNe7x8om2rMug0MX0rL1+IWwdwfR+p1TNTyNmVJ85ljWzbWuGv8/C7HD/izjkHNZNYlhZcUOKVzKFUxsxxN/kax+8zPWPSFKw80rJr9Tizyj3o1gEsdwgWGoxPezDdZ1TSENE1dLdNvuKL+I84nxKesZgxXVA1VA1OcL49dFlpFV5yJMhzyCmNQ+a4BqusPJ2bB+xo8V9u3x48VVIEPS/mc3DvAbXyoYr6VgDfh5do5hhHOCXMqBZUPhWYbWZECwVJljLgMUWOCB4MUuMaxGNUQDVI50TQ+S3kFgIcu2qKkNSHVoM0SHsgoZxP2d5HH8B9woOk4x5bPkKtAHucZsdykjxuIpbUrSILgrT8G7G5oCW+K0990o7E3T6AdW4TilH5kDjds+H64kS0mz24grtwlzDHBJqI8YJQExotPvoC4JBq0lEjjQkyBZ8oH2LnRsQ4Hu1QsgDTJbO8fQDnllitkxuVskoiKbRF9VwzMDvxHAdwB7mD9yCplhHFEyUWHx3WtwCbSMMTCUCcEmSGlg4gTXkHpZXWQ7kpznK3EmCHiXInqndkQjunG5kxTKEeGye7jWz9cyMR2mGiFQ15ENRBTbCp+Gh86vAyASdgmJq2MC6hoADQ3GosP0QHbnMHjyBQvQqfhy/BUbeHd5WY/G/9LK/8Ka8Jd7UFeNWEZvzPb458Dn8DGLOe3/wGL/4xP+HXlRt+M1PE2iLhR8t+lfgxsuh7AfO2AOf+owWhSZRYQbd622hbpKWKuU+XuvNzP0OseRDa+mObgDHJUSc/pKx31QdKffQ5OIJpt8GWjlgTwMc/w5MPCR/yl1XC2a2Yut54SvOtMev55Of45BOat9aWG27p2ZVORRvnEk1hqWMVUmqa7S2YtvlIpspuF1pt0syuZS2NV14mUidCSfzQzg+KqvIYCMljIx2YK2AO34fX4GWdu5xcIAb8MzTw+j/lyWM+Dw/gjs4GD6ehNgA48kX/AI7XXM/XAN4WHr+9ntywqoCakCqmKP0rmQrJJEErG2Upg1JObr01lKQy4jskWalKYfJ/EDLMpjNSHFEUAde2fltaDgmrNaWQ9+AAb8I5vKjz3L1n1LriB/BXkG/wwR9y/oRX4LlioHA4LzP2inzRx/DWmutRweFjeP3tNeSGlaE1Fde0OS11yOpmbIp2u/jF1n2RRZviJM0yBT3IZl2HWImKjQOxIyeU325b/qWyU9Moj1o07tS0G7qJDoGHg5m8yeCxMoEH8GU45tnrNM84D2l297DQ9t1YP7jki/7RmutRweEA77/HWXOh3HCxkRgldDQkAjNTMl2Iloc1qN5JfJeeTlyTRzxURTdn1Ixv2uKjs12AbdEWlBtmVdk2k7FFwj07PCZ9XAwW3dG+8xKzNFr4EnwBZpy9Qzhh3jDXebBpYcpuo4fQ44u+fD1dweEnHzI7v0xuuOALRUV8rXpFyfSTQYkhd7IHm07jpyhlkCmI0ALYqPTpUxXS+z4jgDj1Pflvmz5ecuItpIBxyTHpSTGWd9g1ApfD/bvwUhL4nT1EzqgX7cxfCcNmb3mPL/qi9SwTHJ49oj5ZLjccbTG3pRmlYi6JCG0mQrAt1+i2UXTZ2dv9IlQpN5naMYtviaXlTrFpoMsl3bOAFEa8sqPj2WCMrx3Yjx99qFwO59Aw/wgx+HlqNz8oZvA3exRDvuhL1jMQHPaOJ0+XyA3fp1OfM3qObEVdhxjvynxNMXQV4+GJyvOEFqeQBaIbbO7i63rpxCltdZShPFxkjM2FPVkn3TG+Rp9pO3l2RzFegGfxGDHIAh8SteR0C4HopXzRF61nheDw6TFN05Ebvq8M3VKKpGjjO6r7nhudTEGMtYM92HTDaR1FDMXJ1eThsbKfywyoWwrzRSXkc51flG3vIid62h29bIcFbTGhfV+faaB+ohj7dPN0C2e2lC96+XouFByen9AsunLDJZ9z7NExiUc0OuoYW6UZkIyx2YUR2z6/TiRjyKMx5GbbjLHvHuf7YmtKghf34LJfx63Yg8vrvN2zC7lY0x0tvKezo4HmGYDU+Gab6dFL+KI761lDcNifcjLrrr9LWZJctG1FfU1uwhoQE22ObjdfkSzY63CbU5hzs21WeTddH2BaL11Gi7lVdlxP1nkxqhnKhVY6knS3EPgVGg1JpN5cP/hivujOelhXcPj8HC/LyI6MkteVjlolBdMmF3a3DbsuAYhL44dxzthWSN065xxUd55Lmf0wRbOYOqH09/o9WbO2VtFdaMb4qBgtFJoT1SqoN8wPXMoXLb3p1PUEhxfnnLzGzBI0Ku7FxrKsNJj/8bn/H8fPIVOd3rfrklUB/DOeO+nkghgSPzrlPxluCMtOnDL4Yml6dK1r3vsgMxgtPOrMFUZbEUbTdIzii5beq72G4PD0DKnwjmBULUVFmy8t+k7fZ3pKc0Q4UC6jpVRqS9Umv8bxw35flZVOU1X7qkjnhZlsMbk24qQ6Hz7QcuL6sDC0iHHki96Uh2UdvmgZnjIvExy2TeJdMDZNSbdZyAHe/Yd1xsQhHiKzjh7GxQ4yqMPaywPkjMamvqrYpmO7Knad+ZQC5msCuAPWUoxrxVhrGv7a+KLXFhyONdTMrZ7ke23qiO40ZJUyzgYyX5XyL0mV7NiUzEs9mjtbMN0dERqwyAJpigad0B3/zRV7s4PIfXSu6YV/MK7+OrYe/JvfGMn/PHJe2fyUdtnFrKRNpXV0Y2559aWPt/G4BlvjTMtXlVIWCnNyA3YQBDmYIodFz41PvXPSa6rq9lWZawZ4dP115HXV/M/tnFkkrBOdzg6aP4pID+MZnTJ1SuuB6iZlyiox4HT2y3YBtkUKWooacBQUDTpjwaDt5poBHl1/HXltwP887lKKXxNUEyPqpGTyA699UqY/lt9yGdlUKra0fFWS+36iylVWrAyd7Uw0CZM0z7xKTOduznLIjG2Hx8cDPLb+OvK6Bv7n1DYci4CxUuRxrjBc0bb4vD3rN5Zz36ntLb83eVJIB8LiIzCmn6SMPjlX+yNlTjvIGjs+QzHPf60Aj62/jrzG8j9vYMFtm1VoRWCJdmw7z9N0t+c8cxZpPeK4aTRicS25QhrVtUp7U578chk4q04Wx4YoQSjFryUlpcQ1AbxZ/XVMknIU//OGl7Q6z9Zpxi0+3yFhSkjUDpnCIUhLWVX23KQ+L9vKvFKI0ZWFQgkDLvBoylrHNVmaw10zwCPrr5tlodfnf94EWnQ0lFRWy8pW9LbkLsyUVDc2NSTHGDtnD1uMtchjbCeb1mpxFP0YbcClhzdLu6lfO8Bj6q+bdT2sz/+8SZCV7VIxtt0DUn9L7r4cLYWDSXnseEpOGFuty0qbOVlS7NNzs5FOGJUqQpl2Q64/yBpZf90sxbE+//PGdZ02HSipCbmD6NItmQ4Lk5XUrGpDMkhbMm2ZVheNYV+VbUWTcv99+2NyX1VoafSuC+AN6q9bFIMv5X/eagNWXZxEa9JjlMwNWb00akGUkSoepp1/yRuuqHGbUn3UdBSTxBU6SEVklzWRUkPndVvw2PrrpjvxOvzPmwHc0hpmq82npi7GRro8dXp0KXnUQmhZbRL7NEVp1uuZmO45vuzKsHrktS3GLWXODVjw+vXXLYx4Hf7njRPd0i3aoAGX6W29GnaV5YdyDj9TFkakje7GHYzDoObfddHtOSpoi2SmzJHrB3hM/XUDDEbxP2/oosszcRlehWXUvzHv4TpBVktHqwenFo8uLVmy4DKLa5d3RtLrmrM3aMFr1183E4sewf+85VWeg1c5ag276NZrM9IJVNcmLEvDNaV62aq+14IAOGFsBt973Ra8Xv11YzXwNfmft7Jg2oS+XOyoC8/cwzi66Dhmgk38kUmP1CUiYWOX1bpD2zWXt2FCp7uq8703APAa9dfNdscR/M/bZLIyouVxqJfeWvG9Je+JVckHQ9+CI9NWxz+blX/KYYvO5n2tAP/vrlZ7+8/h9y+9qeB/Hnt967e5mevX10rALDWK//FaAT5MXdBXdP0C/BAes792c40H+AiAp1e1oH8HgH94g/Lttx1gp63op1eyoM/Bvw5/G/7xFbqJPcCXnmBiwDPb/YKO4FX4OjyCb289db2/Noqicw4i7N6TVtoz8tNwDH+8x/i6Ae7lmaQVENzJFb3Di/BFeAwz+Is9SjeQySpPqbLFlNmyz47z5a/AF+AYFvDmHqibSXTEzoT4Gc3OALaqAP4KPFUJ6n+1x+rGAM6Zd78bgJ0a8QN4GU614vxwD9e1Amy6CcskNrczLx1JIp6HE5UZD/DBHrFr2oNlgG4Odv226BodoryjGJ9q2T/AR3vQrsOCS0ctXZi3ruLlhpFDJYl4HmYtjQCP9rhdn4suySLKDt6wLcC52h8xPlcjju1fn+yhuw4LZsAGUuo2b4Fx2UwQu77uqRHXGtg92aN3tQCbFexc0uk93vhTXbct6y7MulLycoUljx8ngDMBg1tvJjAazpEmOtxlzclvj1vQf1Tx7QlPDpGpqgtdSKz/d9/hdy1vTfFHSmC9dGDZbLiezz7Ac801HirGZsWjydfZyPvHXL/Y8Mjzg8BxTZiuwKz4Eb8sBE9zznszmjvFwHKPIWUnwhqfVRcd4Ck0K6ate48m1oOfrX3/yOtvAsJ8zsPAM89sjnddmuLuDPjX9Bu/L7x7xpMzFk6nWtyQfPg278Gn4Aekz2ZgOmU9eJ37R14vwE/BL8G3aibCiWMWWDQ0ZtkPMnlcGeAu/Ag+8ZyecU5BPuy2ILD+sQqyZhAKmn7XZd+jIMTN9eBL7x95xVLSX4On8EcNlXDqmBlqS13jG4LpmGbkF/0CnOi3H8ETOIXzmnmtb0a16Tzxj1sUvQCBiXZGDtmB3KAefPH94xcUa/6vwRn80GOFyjEXFpba4A1e8KQfFF+259tx5XS4egYn8fQsLGrqGrHbztr+uByTahWuL1NUGbDpsnrwBfePPwHHIf9X4RnM4Z2ABWdxUBlqQ2PwhuDxoS0vvqB1JzS0P4h2nA/QgTrsJFn+Y3AOjs9JFC07CGWX1oNX3T/yHOzgDjwPn1PM3g9Jk9lZrMEpxnlPmBbjyo2+KFXRU52TJM/2ALcY57RUzjObbjqxVw++4P6RAOf58pcVsw9Daje3htriYrpDOonre3CudSe6bfkTEgHBHuDiyu5MCsc7BHhYDx7ePxLjqigXZsw+ijMHFhuwBmtoTPtOxOrTvYJDnC75dnUbhfwu/ZW9AgYd+peL68HD+0emKquiXHhWjJg/UrkJYzuiaL3E9aI/ytrCvAd4GcYZMCkSQxfUg3v3j8c4e90j5ZTPdvmJJGHnOCI2nHS8081X013pHuBlV1gB2MX1YNmWLHqqGN/TWmG0y6clJWthxNUl48q38Bi8vtMKyzzpFdSDhxZ5WBA5ZLt8Jv3895DduBlgbPYAj8C4B8hO68FDkoh5lydC4FiWvBOVqjYdqjiLv92t8yPDjrDaiHdUD15qkSURSGmXJwOMSxWAXYwr3zaAufJ66l+94vv3AO+vPcD7aw/w/toDvL/2AO+vPcD7aw/wHuD9tQd4f+0B3l97gPfXHuD9tQd4f+0B3l97gG8LwP8G/AL8O/A5OCq0Ys2KIdv/qOIXG/4mvFAMF16gZD+2Xvu/B8as5+8bfllWyg0zaNO5bfXj6vfhhwD86/Aq3NfRS9t9WPnhfnvCIw/CT8GLcFTMnpntdF/z9V+PWc/vWoIH+FL3Znv57PitcdGP4R/C34avw5fgRVUInCwbsn1yyA8C8zm/BH8NXoXnVE6wVPjdeCI38kX/3+Ct9dbz1pTmHFRu+Hm4O9Ch3clr99negxfwj+ER/DR8EV6B5+DuQOnTgUw5rnkY+FbNU3gNXh0o/JYTuWOvyBf9FvzX663HH/HejO8LwAl8Hl5YLTd8q7sqA3wbjuExfAFegQdwfyDoSkWY8swzEf6o4Qyewefg+cHNbqMQruSL/u/WWc+E5g7vnnEXgDmcDeSGb/F4cBcCgT+GGRzDU3hZYburAt9TEtHgbM6JoxJ+6NMzzTcf6c2bycv2+KK/f+l6LBzw5IwfqZJhA3M472pWT/ajKxnjv4AFnMEpnBTPND6s2J7qHbPAqcMK74T2mZ4VGB9uJA465It+/eL1WKhYOD7xHOkr1ajK7d0C4+ke4Hy9qXZwpgLr+Znm/uNFw8xQOSy8H9IzjUrd9+BIfenYaylf9FsXr8fBAadnPIEDna8IBcwlxnuA0/Wv6GAWPd7dDIKjMdSWueAsBj4M7TOd06qBbwDwKr7oleuxMOEcTuEZTHWvDYUO7aHqAe0Bbq+HEFRzOz7WVoTDQkVds7A4sIIxfCQdCefFRoIOF/NFL1mPab/nvOakSL/Q1aFtNpUb/nFOVX6gzyg/1nISyDfUhsokIzaBR9Kxm80s5mK+6P56il1jXic7nhQxsxSm3OwBHl4fFdLqi64nDQZvqE2at7cWAp/IVvrN6/BFL1mPhYrGMBfOi4PyjuSGf6wBBh7p/FZTghCNWGgMzlBbrNJoPJX2mW5mwZfyRffXo7OFi5pZcS4qZUrlViptrXtw+GQoyhDPS+ANjcGBNRiLCQDPZPMHuiZfdFpPSTcQwwKYdRNqpkjm7AFeeT0pJzALgo7g8YYGrMHS0iocy+YTm2vyRUvvpXCIpQ5pe666TJrcygnScUf/p0NDs/iAI/nqDHC8TmQT8x3NF91l76oDdQGwu61Z6E0ABv7uO1dbf/37Zlv+Zw/Pbh8f1s4Avur6657/+YYBvur6657/+YYBvur6657/+YYBvur6657/+aYBvuL6657/+VMA8FXWX/f8zzcN8BXXX/f8zzcNMFdbf93zP38KLPiK6697/uebtuArrr/u+Z9vGmCusP6653/+1FjwVdZf9/zPN7oHX339dc//fNMu+irrr3v+50+Bi+Zq6697/uebA/jz8Pudf9ht/fWv517J/XUzAP8C/BAeX9WCDrUpZ3/dEMBxgPcfbtTVvsYV5Yn32u03B3Ac4P3b8I+vxNBKeeL9dRMAlwO83959qGO78sT769oB7g3w/vGVYFzKE++v6wV4OMD7F7tckFkmT7y/rhHgpQO8b+4Y46XyxPvrugBeNcB7BRiX8sT767oAvmCA9woAHsoT76+rBJjLBnh3txOvkifeX1dswZcO8G6N7sXyxPvr6i340gHe3TnqVfLE++uKAb50gHcXLnrX8sR7gNdPRqwzwLu7Y/FO5Yn3AK9jXCMGeHdgxDuVJ75VAI8ljP7PAb3/RfjcZfePHBB+79dpfpH1CanN30d+mT1h9GqAxxJGM5LQeeQ1+Tb+EQJrElLb38VHQ94TRq900aMIo8cSOo+8Dp8QfsB8zpqE1NO3OI9Zrj1h9EV78PqE0WMJnUdeU6E+Jjyk/hbrEFIfeWbvId8H9oTRFwdZaxJGvziW0Hn0gqYB/wyZ0PwRlxJST+BOw9m77Amj14ii1yGM/txYQudN0qDzGe4EqfA/5GJCagsHcPaEPWH0esekSwmjRxM6b5JEcZ4ww50ilvAOFxBSx4yLW+A/YU8YvfY5+ALC6NGEzhtmyZoFZoarwBLeZxUhtY4rc3bKnjB6TKJjFUHzJoTOozF2YBpsjcyxDgzhQ1YRUse8+J4wenwmaylB82hC5w0zoRXUNXaRBmSMQUqiWSWkLsaVqc/ZE0aPTFUuJWgeTei8SfLZQeMxNaZSIzbII4aE1Nmr13P2hNHjc9E9guYNCZ032YlNwESMLcZiLQHkE4aE1BFg0yAR4z1h9AiAGRA0jyZ03tyIxWMajMPWBIsxYJCnlITU5ShiHYdZ94TR4wCmSxg9jtB5KyPGYzymAYexWEMwAPIsAdYdV6aObmNPGD0aYLoEzaMJnTc0Ygs+YDw0GAtqxBjkuP38bMRWCHn73xNGjz75P73WenCEJnhwyVe3AEe8TtKdJcYhBl97wuhNAObK66lvD/9J9NS75v17wuitAN5fe4D31x7g/bUHeH/tAd5fe4D3AO+vPcD7aw/w/toDvL/2AO+vPcD7aw/w/toDvAd4f/24ABzZ8o+KLsSLS+Pv/TqTb3P4hKlQrTGh+fbIBT0Axqznnb+L/V2mb3HkN5Mb/nEHeK7d4IcDld6lmDW/iH9E+AH1MdOw/Jlu2T1xNmY98sv4wHnD7D3uNHu54WUuOsBTbQuvBsPT/UfzNxGYzwkP8c+Yz3C+r/i6DcyRL/rZ+utRwWH5PmfvcvYEt9jLDS/bg0/B64DWKrQM8AL8FPwS9beQCe6EMKNZYJol37jBMy35otdaz0Bw2H/C2Smc7+WGB0HWDELBmOByA3r5QONo4V+DpzR/hFS4U8wMW1PXNB4TOqYz9urxRV++ntWCw/U59Ty9ebdWbrgfRS9AYKKN63ZokZVygr8GZ/gfIhZXIXPsAlNjPOLBby5c1eOLvmQ9lwkOy5x6QV1j5TYqpS05JtUgUHUp5toHGsVfn4NX4RnMCe+AxTpwmApTYxqMxwfCeJGjpXzRF61nbcHhUBPqWze9svwcHJ+S6NPscKrEjug78Dx8Lj3T8D4YxGIdxmJcwhi34fzZUr7olevZCw5vkOhoClq5zBPZAnygD/Tl9EzDh6kl3VhsHYcDEb+hCtJSvuiV69kLDm+WycrOTArHmB5/VYyP6jOVjwgGawk2zQOaTcc1L+aLXrKeveDwZqlKrw8U9Y1p66uK8dEzdYwBeUQAY7DbyYNezBfdWQ97weEtAKYQg2xJIkuveAT3dYeLGH+ShrWNwZgN0b2YL7qznr3g8JYAo5bQBziPjx7BPZ0d9RCQp4UZbnFdzBddor4XHN4KYMrB2qHFRIzzcLAHQZ5the5ovui94PCWAPefaYnxIdzRwdHCbuR4B+tbiy96Lzi8E4D7z7S0mEPd+eqO3cT53Z0Y8SV80XvB4Z0ADJi/f7X113f+7p7/+UYBvur6657/+YYBvur6657/+aYBvuL6657/+aYBvuL6657/+aYBvuL6657/+aYBvuL6657/+VMA8FXWX/f8z58OgK+y/rrnf75RgLna+uue//lTA/CV1V/3/M837aKvvv6653++UQvmauuve/7nTwfAV1N/3fM/fzr24Cuuv+75nz8FFnxl9dc9//MOr/8/glixwRuUfM4AAAAASUVORK5CYII="}_getSearchTexture(){return"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAAAhCAAAAABIXyLAAAAAOElEQVRIx2NgGAWjYBSMglEwEICREYRgFBZBqDCSLA2MGPUIVQETE9iNUAqLR5gIeoQKRgwXjwAAGn4AtaFeYLEAAAAASUVORK5CYII="}}const Ox={uniforms:{tDiffuse:{value:null}},vertexShader:`varying vec2 vUv;
    void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`varying vec2 vUv;uniform sampler2D tDiffuse;
    void main(){
      vec4 c=texture2D(tDiffuse,vUv);
      float d=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
      gl_FragColor=vec4(c.rgb-d/255.0,c.a);
    }`},Wi=Object.freeze({name:"edetri-production-baseline",exposure:.75,bloomStrength:.1,bloomThreshold:.06,bloomKnee:.036,bloomClamp:64,aoEnabled:!0,msaaSamples:0,refinement:!1,pathTracing:!1});function Fx(s){s.toneMapping=ac,s.toneMappingExposure=Wi.exposure,s.outputColorSpace=vt,s.transmissionResolutionScale=1,s.shadowMap.type=ic}const er=Object.freeze({lift:Object.freeze([.004,.005,.007]),gain:Object.freeze([1.01,1,.985]),saturation:1.04,grain:0,vignette:Object.freeze([.55,.1,.46])}),kx={uniforms:{tDiffuse:{value:null},uExposure:{value:Wi.exposure},uLift:{value:new I(...er.lift)},uGain:{value:new I(...er.gain)},uSat:{value:er.saturation},uGrain:{value:er.grain},uVig:{value:new I(...er.vignette)}},vertexShader:`varying vec2 vUv;
    void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uExposure,uSat,uGrain;
    uniform vec3 uLift,uGain,uVig;

    vec3 RRTAndODTFit(vec3 v){
      vec3 a=v*(v+0.0245786)-0.000090537;
      vec3 b=v*(0.983729*v+0.4329510)+0.238081;
      return a/b;
    }
    vec3 acesToneMap(vec3 color){
      const mat3 ACESInputMat=mat3(
        vec3(0.59719,0.07600,0.02840),
        vec3(0.35458,0.90834,0.13383),
        vec3(0.04823,0.01566,0.83777));
      const mat3 ACESOutputMat=mat3(
        vec3(1.60475,-0.10208,-0.00327),
        vec3(-0.53108,1.10813,-0.07276),
        vec3(-0.07367,-0.00605,1.07602));
      color*=1.0/0.6;
      color=ACESInputMat*color;
      color=RRTAndODTFit(color);
      color=ACESOutputMat*color;
      return clamp(color,0.0,1.0);
    }
    vec3 linearToSRGB(vec3 c){
      return mix(c*12.92,1.055*pow(max(c,vec3(0.0)),vec3(0.41666))-0.055,step(vec3(0.0031308),c));
    }

    void main(){
      vec3 c=texture2D(tDiffuse,vUv).rgb*uExposure;
      c=uLift+c*(uGain-uLift);
      float lum=dot(c,vec3(0.2126,0.7152,0.0722));
      c=mix(vec3(lum),c,uSat);
      float n=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(0.06711056,0.00583715))))-0.5;
      c+=n*uGrain;
      float dv=distance(vUv,vec2(0.5,uVig.z));
      c*=1.0-smoothstep(uVig.x,0.92,dv)*uVig.y;
      c=acesToneMap(max(c,vec3(0.0)));
      gl_FragColor=vec4(linearToSRGB(c),1.0);
    }`};class zx extends Vd{constructor(e){super(e),this.type=Ot}parse(e){const a=function(C,x){switch(C){case 1:throw new Error("THREE.HDRLoader: Read Error: "+(x||""));case 2:throw new Error("THREE.HDRLoader: Write Error: "+(x||""));case 3:throw new Error("THREE.HDRLoader: Bad File Format: "+(x||""));default:case 4:throw new Error("THREE.HDRLoader: Memory Error: "+(x||""))}},u=function(C,x,_){x=x||1024;let P=C.pos,B=-1,O=0,F="",U=String.fromCharCode.apply(null,new Uint16Array(C.subarray(P,P+128)));for(;0>(B=U.indexOf(`
`))&&O<x&&P<C.byteLength;)F+=U,O+=U.length,P+=128,U+=String.fromCharCode.apply(null,new Uint16Array(C.subarray(P,P+128)));return-1<B?(C.pos+=O+B+1,F+U.slice(0,B)):!1},d=function(C){const x=/^#\?(\S+)/,_=/^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/,R=/^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/,P=/^\s*FORMAT=(\S+)\s*$/,B=/^\s*\-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/,O={valid:0,string:"",comments:"",programtype:"RGBE",format:"",gamma:1,exposure:1,width:0,height:0};let F,U;for((C.pos>=C.byteLength||!(F=u(C)))&&a(1,"no header found"),(U=F.match(x))||a(3,"bad initial token"),O.valid|=1,O.programtype=U[1],O.string+=F+`
`;F=u(C),F!==!1;){if(O.string+=F+`
`,F.charAt(0)==="#"){O.comments+=F+`
`;continue}if((U=F.match(_))&&(O.gamma=parseFloat(U[1])),(U=F.match(R))&&(O.exposure=parseFloat(U[1])),(U=F.match(P))&&(O.valid|=2,O.format=U[1]),(U=F.match(B))&&(O.valid|=4,O.height=parseInt(U[1],10),O.width=parseInt(U[2],10)),O.valid&2&&O.valid&4)break}return O.valid&2||a(3,"missing format specifier"),O.valid&4||a(3,"missing image size specifier"),O},f=function(C,x,_){const R=x;if(R<8||R>32767||C[0]!==2||C[1]!==2||C[2]&128)return new Uint8Array(C);R!==(C[2]<<8|C[3])&&a(3,"wrong scanline width");const P=new Uint8Array(4*x*_);P.length||a(4,"unable to allocate buffer space");let B=0,O=0;const F=4*R,U=new Uint8Array(4),Y=new Uint8Array(F);let V=_;for(;V>0&&O<C.byteLength;){O+4>C.byteLength&&a(1),U[0]=C[O++],U[1]=C[O++],U[2]=C[O++],U[3]=C[O++],(U[0]!=2||U[1]!=2||(U[2]<<8|U[3])!=R)&&a(3,"bad rgbe scanline format");let Z=0,te;for(;Z<F&&O<C.byteLength;){te=C[O++];const ge=te>128;if(ge&&(te-=128),(te===0||Z+te>F)&&a(3,"bad scanline data"),ge){const ze=C[O++];for(let Ke=0;Ke<te;Ke++)Y[Z++]=ze}else Y.set(C.subarray(O,O+te),Z),Z+=te,O+=te}const ce=R;for(let ge=0;ge<ce;ge++){let ze=0;P[B]=Y[ge+ze],ze+=R,P[B+1]=Y[ge+ze],ze+=R,P[B+2]=Y[ge+ze],ze+=R,P[B+3]=Y[ge+ze],B+=4}V--}return P},g=function(C,x,_,R){const P=C[x+3],B=Math.pow(2,P-128)/255;_[R+0]=C[x+0]*B,_[R+1]=C[x+1]*B,_[R+2]=C[x+2]*B,_[R+3]=1},A=function(C,x,_,R){const P=C[x+3],B=Math.pow(2,P-128)/255;_[R+0]=tr.toHalfFloat(Math.min(C[x+0]*B,65504)),_[R+1]=tr.toHalfFloat(Math.min(C[x+1]*B,65504)),_[R+2]=tr.toHalfFloat(Math.min(C[x+2]*B,65504)),_[R+3]=tr.toHalfFloat(1)},m=new Uint8Array(e);m.pos=0;const p=d(m),E=p.width,w=p.height,v=f(m.subarray(m.pos),E,w);let M,y,T;switch(this.type){case Qt:T=v.length/4;const C=new Float32Array(T*4);for(let _=0;_<T;_++)g(v,_*4,C,_*4);M=C,y=Qt;break;case Ot:T=v.length/4;const x=new Uint16Array(T*4);for(let _=0;_<T;_++)A(v,_*4,x,_*4);M=x,y=Ot;break;default:throw new Error("THREE.HDRLoader: Unsupported type: "+this.type)}return{width:E,height:w,data:M,header:p.string,gamma:p.gamma,exposure:p.exposure,type:y}}setDataType(e){return this.type=e,this}load(e,t,n,i){function r(a,o){switch(a.type){case Qt:case Ot:a.colorSpace=Ft,a.minFilter=Et,a.magFilter=Et,a.generateMipmaps=!1,a.flipY=!0;break}t&&t(a,o)}return super.load(e,r,n,i)}}function Hx(s,{latitude:e=39.88,longitude:t=32.73,day:n=172,northRotation:i=0}={}){const r=Math.PI/180,a=2*Math.PI/365*(n-1+(s-12)/24),o=229.18*(75e-6+.001868*Math.cos(a)-.032077*Math.sin(a)-.014615*Math.cos(2*a)-.040849*Math.sin(2*a)),c=.006918-.399912*Math.cos(a)+.070257*Math.sin(a)-.006758*Math.cos(2*a)+907e-6*Math.sin(2*a)-.002697*Math.cos(3*a)+.00148*Math.sin(3*a),l=(s*60+o+4*t-180)/4*r-Math.PI,h=e*r,u=-Math.cos(c)*Math.sin(l),d=Math.cos(h)*Math.sin(c)-Math.sin(h)*Math.cos(c)*Math.cos(l),f=Math.sin(h)*Math.sin(c)+Math.cos(h)*Math.cos(c)*Math.cos(l),g=Math.cos(i),A=Math.sin(i);return{direction:[u*g+d*A,f,u*A-d*g],altitude:Math.asin(Math.max(-1,Math.min(1,f)))/r}}function mu(s){const e=Math.round(s*60);return`${String(Math.floor(e/60)).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`}function Vx(s=""){return s=s.replace(/\.\d{3}$/,""),/clay tile|^roof$|green tiles/i.test(s)?"roof":/glass|mirror/i.test(s)?"other":/stucco|neighbor_wall|white_trim|limestone|stone_tile|retaining stone|asphalt/i.test(s)?"masonry":/grass|foliage|hedge|needle|leaf/i.test(s)?"landscape":/wood_floor|terra_floor/i.test(s)?"floor":/^ceiling$/.test(s)?"soffit":/^interior$/.test(s)?"plaster":"other"}function Gx(s,{context:e=!1}={}){if(!s?.isMeshStandardMaterial||s.userData.presentationR27)return;const t=Vx(s.name);s.userData.presentationR27={family:t,context:e,normal:s.normalScale?.clone()},["roof","masonry","landscape","floor","plaster","soffit"].includes(t)&&(s.metalness=0);const n={roof:.8,masonry:.72,landscape:.88,floor:.58}[t];if(n){const i=s.onBeforeCompile,r=s.customProgramCacheKey();s.onBeforeCompile=(a,o)=>{i.call(s,a,o),a.fragmentShader=a.fragmentShader.replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
roughnessFactor = max(roughnessFactor, ${n.toFixed(2)});`)},s.customProgramCacheKey=()=>r+"|angora-r27-"+t}if(t==="roof")s.normalScale?.multiplyScalar(e?.18:.3),s.envMapIntensity=.65,e||(s.polygonOffset=!0,s.polygonOffsetFactor=-1,s.polygonOffsetUnits=-2);else if(t==="masonry")s.normalScale?.multiplyScalar(e?.3:.55),s.envMapIntensity=.8;else if(t==="landscape")s.normalScale?.multiplyScalar(.25);else if(t==="plaster")s.envMapIntensity=0,s.normalMap=null,s.bumpMap=null,s.color.setRGB(.94,.94,.94),s.vertexColors=!1,s.emissive?.setRGB(.22,.22,.22),s.emissiveIntensity=1;else if(t==="soffit"){s.normalMap=null,s.bumpMap=null,s.map=null,s.color.setRGB(.94,.94,.94),s.vertexColors=!1,s.envMapIntensity=0,s.emissive?.setRGB(.35,.35,.35),s.emissiveIntensity=1;const i=s.onBeforeCompile,r=s.customProgramCacheKey();s.onBeforeCompile=(a,o)=>{i.call(s,a,o);const c=Ge.envmap_physical_pars_fragment.replaceAll("envMapColor.rgb","vec3(dot(envMapColor.rgb, vec3(0.2126, 0.7152, 0.0722)))");a.fragmentShader=a.fragmentShader.replace("#include <envmap_physical_pars_fragment>",c)},s.customProgramCacheKey=()=>r+"|neutral-ceiling-probe"}else t==="floor"&&(s.normalScale?.multiplyScalar(.3),s.envMapIntensity=.75,s.isMeshPhysicalMaterial&&(s.clearcoat=Math.min(s.clearcoat,.08),s.clearcoatRoughness=.65));s.needsUpdate=!0}function Wx(s,e){const t=s.userData.presentationR27;if(t?.family!=="roof"||!t.normal)return;const n=e==="region"?.06:e==="neighborhood"?.14:t.context?.18:.3;s.normalScale.copy(t.normal).multiplyScalar(n)}function Xx(s,e){const t=s?.userData?.presentationR27;t?.family==="soffit"&&(t.walk||(t.walk={color:s.color.clone(),map:s.map,normalMap:s.normalMap,bumpMap:s.bumpMap,envMapIntensity:s.envMapIntensity,vertexColors:s.vertexColors,emissive:s.emissive?.clone(),emissiveIntensity:s.emissiveIntensity}),e?(s.color.setRGB(.94,.94,.94),s.map=null,s.normalMap=null,s.bumpMap=null,s.envMapIntensity=0,s.vertexColors=!1,s.emissive?.setRGB(.35,.35,.35),s.emissiveIntensity=1):(s.color.copy(t.walk.color),s.map=t.walk.map,s.normalMap=t.walk.normalMap,s.bumpMap=t.walk.bumpMap,s.envMapIntensity=t.walk.envMapIntensity,s.vertexColors=t.walk.vertexColors,t.walk.emissive&&s.emissive.copy(t.walk.emissive),s.emissiveIntensity=t.walk.emissiveIntensity),s.needsUpdate=!0)}function Qx(s,e,t=.58,n=0,i=16){const r=s.getCenter(new I),a=Math.tan(Mt.degToRad(i/2)),o=new I().setFromSphericalCoords(1,t,n),c=new I(Math.cos(n),0,-Math.sin(n)),l=new I().crossVectors(o,c);let h=1;for(const u of[s.min.x,s.max.x])for(const d of[s.min.y,s.max.y])for(const f of[s.min.z,s.max.z]){const g=new I(u,d,f).sub(r),A=g.dot(o);h=Math.max(h,A+Math.abs(g.dot(c))/(a*e)*1.1,A+Math.abs(g.dot(l))/a*1.35)}return{target:r,span:h*2*a,polar:t,azimuth:n}}function uf(s,e=!1){const t=s.attributes.position,n=s.index,i=new Map,r=[],a=new I,o=new I,c=new I;for(let u=0;u<t.count;u++)r.push([t.getX(u),t.getY(u),t.getZ(u)].map(d=>Math.round(d*1e3)).join(","));const l=n?.count??t.count;for(let u=0;u<l;u+=3){const d=[0,1,2].map(f=>n?n.getX(u+f):u+f);a.fromBufferAttribute(t,d[0]),o.fromBufferAttribute(t,d[1]),c.fromBufferAttribute(t,d[2]),o.sub(a).cross(c.sub(a)),e&&o.y<0&&o.negate();for(const f of d){const g=r[f];i.has(g)||i.set(g,new I),i.get(g).add(o)}}const h=new Float32Array(t.count*3);for(let u=0;u<t.count;u++){const d=i.get(r[u])??new I(0,1,0);a.copy(d).normalize().toArray(h,u*3)}s.setAttribute("normal",new mt(h,3))}function Yx(s){uf(s,!0)}const jx=/(^|\b)grass( ground)?$|continuous grass/i,qx=/grass|asphalt|stone_tile|retaining|boundary limestone|soil body/i;function Kx(s,e){let t;if(s.traverse(a=>{a.isMesh&&!Array.isArray(a.material)&&jx.test(a.material.name)&&!a.material.userData.plotSoil&&(t=a)}),!t)return;Yx(t.geometry),t.castShadow=!1;const n=new Ht().setFromObject(t),i=new Ze(n.min.x,n.min.z,n.max.x,n.max.z),r=new Set;return s.traverse(a=>{if(a.isMesh)for(const o of Array.isArray(a.material)?a.material:[a.material]){if(r.has(o)||o.userData.contextBuilding||o.userData.plotSoil||!qx.test(o.name))continue;r.add(o);const c=o.onBeforeCompile,l=o.customProgramCacheKey();o.onBeforeCompile=(h,u)=>{c.call(o,h,u),h.uniforms.contextEdge={value:i},h.uniforms.contextBackground={value:e},h.vertexShader=`varying vec3 contextWorldPosition;
`+h.vertexShader,h.vertexShader=h.vertexShader.replace("#include <project_vertex>",`#include <project_vertex>
contextWorldPosition = (modelMatrix * vec4(transformed,1.0)).xyz;`),h.fragmentShader=`varying vec3 contextWorldPosition;
uniform vec4 contextEdge;
uniform vec3 contextBackground;
`+h.fragmentShader,h.fragmentShader=h.fragmentShader.replace("#include <opaque_fragment>",`#include <opaque_fragment>
          vec2 edgeDistance = min(contextWorldPosition.xz-contextEdge.xy,contextEdge.zw-contextWorldPosition.xz);
          float edgeFade = 1.0-smoothstep(0.0,18.0,min(edgeDistance.x,edgeDistance.y));
          gl_FragColor.rgb=mix(gl_FragColor.rgb,contextBackground,edgeFade);`)},o.customProgramCacheKey=()=>l+"|context-boundary-r27",o.needsUpdate=!0}}),n}function Zx(s,{beauty:e,ao:t,smaa:n,bloom:i,output:r,dither:a}){for(const o of[e,t,n,i,r,a])s.addPass(o)}const Jx=`varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,Rl=(s,e)=>new St({uniforms:s,vertexShader:Jx,fragmentShader:e,depthTest:!1,depthWrite:!1,toneMapped:!1}),Dl=()=>new en(1,1,{type:Ot,minFilter:Et,magFilter:Et,depthBuffer:!1}),gu="vec3 finiteRgb(vec3 c,float limit){return min(mix(vec3(0.0),c,vec3(equal(c,c))),vec3(limit));}";class $x extends rs{constructor(e=Wi){super(),this.bright=Dl(),this.blurA=Dl(),this.blurB=Dl(),this.extract=Rl({source:{value:null},threshold:{value:e.bloomThreshold},knee:{value:e.bloomKnee},clampMax:{value:e.bloomClamp}},`
      varying vec2 vUv;uniform sampler2D source;uniform float threshold,knee,clampMax;
      ${gu}
      void main(){
        vec3 c=finiteRgb(texture2D(source,vUv).rgb,clampMax);
        float l=dot(c,vec3(.2126,.7152,.0722));
        float s=clamp(l-threshold+knee,0.0,2.0*knee);
        float contribution=max(l-threshold,s*s/(4.0*knee+1e-5))/max(l,1e-5);
        gl_FragColor=vec4(c*contribution,1.0);
      }`),this.blur=Rl({source:{value:null},direction:{value:new we}},`
      varying vec2 vUv;uniform sampler2D source;uniform vec2 direction;
      void main(){
        vec3 sum=texture2D(source,vUv).rgb*.227027;
        sum+=(texture2D(source,vUv+direction*1.384615).rgb+texture2D(source,vUv-direction*1.384615).rgb)*.316216;
        sum+=(texture2D(source,vUv+direction*3.230769).rgb+texture2D(source,vUv-direction*3.230769).rgb)*.070270;
        gl_FragColor=vec4(sum,1.0);
      }`),this.combine=Rl({source:{value:null},glare:{value:this.blurB.texture},strength:{value:e.bloomStrength},clampMax:{value:e.bloomClamp}},`
      varying vec2 vUv;uniform sampler2D source,glare;uniform float strength,clampMax;
      ${gu}
      void main(){
        vec4 c=texture2D(source,vUv);
        gl_FragColor=vec4(finiteRgb(c.rgb,clampMax)+finiteRgb(texture2D(glare,vUv).rgb,clampMax)*strength,c.a);}`),this.quad=new Fo(null)}setSize(e,t){this.bright.setSize(Math.max(1,Math.floor(e/2)),Math.max(1,Math.floor(t/2)));for(const n of[this.blurA,this.blurB])n.setSize(Math.max(1,Math.floor(e/4)),Math.max(1,Math.floor(t/4)))}render(e,t,n){const i=e.getRenderTarget(),r=(a,o)=>{this.quad.material=a,e.setRenderTarget(o),this.quad.render(e)};try{this.extract.uniforms.source.value=n.texture,r(this.extract,this.bright);let a=this.bright.texture;for(const[o,c,l]of[[this.blurA,1,0],[this.blurB,0,1],[this.blurA,1.7,0],[this.blurB,0,1.7]])this.blur.uniforms.source.value=a,this.blur.uniforms.direction.value.set(c/o.width,l/o.height),r(this.blur,o),a=o.texture;this.combine.uniforms.source.value=n.texture,r(this.combine,this.renderToScreen?null:t)}finally{e.setRenderTarget(i)}}dispose(){for(const e of[this.bright,this.blurA,this.blurB,this.extract,this.blur,this.combine,this.quad])e.dispose()}}class e_{constructor(e,{fadeMs:t=300,hysteresisMetres:n=.6}={}){if(!(t>0))throw new Error("A positive light fade duration is required");this.fadeMs=t,this.hysteresisMetres=n,this.slots=e.map(i=>({light:i,source:null,desired:null,level:0,fade:null})),this.fixtures=[],this.floor=null,this.position=[0,0,0],this.enabled=!0}setFixtures(e,t=performance.now()){this.fixtures=e??[],this.choose(t)}select(e,t,n=performance.now()){this.floor=e,this.position=t??[0,0,0],this.choose(n)}setEnabled(e,t=performance.now()){this.enabled=e,this.choose(t)}choose(e){const t=new Set(this.slots.map(o=>o.desired)),n=o=>Math.hypot(...o.position.map((c,l)=>c-this.position[l]))-(t.has(o)?this.hysteresisMetres:0),i=this.enabled&&this.floor!==null?this.fixtures.filter(o=>o.floor_index===this.floor).sort((o,c)=>n(o)-n(c)).slice(0,this.slots.length):[],r=new Set(i),a=this.slots.map(()=>null);for(const o of["source","desired"])this.slots.forEach((c,l)=>{!a[l]&&r.has(c[o])&&(a[l]=c[o],r.delete(c[o]))});this.slots.forEach((o,c)=>{!a[c]&&r.size&&(a[c]=r.values().next().value,r.delete(a[c]))}),this.slots.forEach((o,c)=>{o.desired!==a[c]&&(o.desired=a[c],this.fadeTo(o,o.source&&o.source===o.desired?1:0,e))})}fadeTo(e,t,n){e.fade={from:e.level,to:t,start:n,end:n+Math.abs(t-e.level)*this.fadeMs}}get active(){return this.slots.some(e=>e.source!==e.desired||e.fade!==null)}update(e){let t=!1,n=!1;for(const i of this.slots){const{light:r}=i,a=r.visible,o=r.intensity;for(;i.fade;){const c=i.fade;if(e<c.end){const l=c.end===c.start?0:Math.max(0,(e-c.start)/(c.end-c.start));i.level=c.from+(c.to-c.from)*l;break}i.level=c.to,i.fade=null,i.source!==i.desired&&(i.source=i.desired,i.source&&(r.position.fromArray(i.source.position),r.target.position.fromArray(i.source.direction).add(r.position),r.color.fromArray(i.source.color),this.fadeTo(i,1,c.end)),t=!0,n=!0)}r.intensity=i.source?i.source.intensity_cd*i.level:0,r.visible=r.intensity>0,t||=o!==r.intensity||a!==r.visible,n||=a!==r.visible}return{active:this.active,changed:t,shadowChanged:n}}snapshot(){return this.slots.filter(e=>e.source).map(({source:e,desired:t,level:n,light:i})=>({fixture:e.name??e.object,position:[...e.position],floor:e.floor_index,source_intensity_cd:e.intensity_cd,rendered_intensity_cd:i.intensity,intensity_status:e.intensity_status,weight:n,transitioning:e!==t||n<1}))}}class t_ extends Xn{constructor(e,t,n,i){super(e,t,1,1),this.resolutionScale=i,this.normalMaterial.side=Zt,this.clip=n,this.sectionPlanes=[new xn(n.normal.clone(),n.constant)],this.updateGtaoMaterial({radius:.28,distanceExponent:1,thickness:1,scale:1.05,samples:12,distanceFallOff:1,screenSpaceRadius:!1}),this.updatePdMaterial({radius:5,samples:8,depthPhi:3,normalPhi:4}),this.blendIntensity=.8}setSize(e,t){const n=this.resolutionScale??1;super.setSize(Math.max(1,Math.round(e*n)),Math.max(1,Math.round(t*n)))}_overrideVisibility(){super._overrideVisibility(),this.scene.traverse(e=>{e.visible&&(e.userData.aoExcluded||e.isSprite)&&(e.visible=!1,this._visibilityCache.push(e))})}setCamera(e){this.camera=e;for(const t of[this.gtaoMaterial,this.depthRenderMaterial]){const n=e.isPerspectiveCamera?1:0;t.defines.PERSPECTIVE_CAMERA!==n&&(t.defines.PERSPECTIVE_CAMERA=n,t.needsUpdate=!0)}}_renderOverride(e,t,n,i,r){const a=e.clippingPlanes;this.sectionPlanes[0].copy(this.clip),this.sectionPlanes[0].constant+=.004,e.clippingPlanes=this.sectionPlanes;try{super._renderOverride(e,t,n,i,r)}finally{e.clippingPlanes=a}}}const n_="#6f7a60";function Au(s,{sky:e=null,background:t=null}){const n=new Po;e&&n.add(e),t&&(t.mapping=Ps,n.background=t);const i=new Tt(new Hs(8e3,8e3),new Un({color:new Ce(n_)}));i.rotation.x=-Math.PI/2,i.position.y=-1,n.add(i);const r=new vo(s),a=r.fromScene(n,.035,.1,2e4);return n.remove(i),i.geometry.dispose(),i.material.dispose(),r.dispose(),a}function vu(s){return df(s)||/glass|glazing|cam yüzey/i.test(s.name)}function df(s){return s.transmission>0||s.transparent&&s.opacity<.98}function i_(s,e,t,n){const i=matchMedia("(pointer: coarse)").matches;s.shadowMap.enabled=!0,s.shadowMap.autoUpdate=!1,Fx(s);const r=new Ce("#e4e9ed"),a=new Wd(15463167,12104360,.5);e.add(a);const o=new Nc(16773855,1.55),c=new I(-.45,.85,-.3).normalize();o.castShadow=!0,o.shadow.mapSize.setScalar(i?1024:4096),o.shadow.bias=-25e-6,o.shadow.normalBias=.018,o.shadow.radius=2.5,o.shadow.camera.near=.5,o.shadow.camera.far=700,e.add(o,o.target);const l=new Oo;l.scale.setScalar(1e4),l.material.uniforms.turbidity.value=3,l.material.uniforms.rayleigh.value=2,l.material.uniforms.mieCoefficient.value=.003,l.material.uniforms.sunPosition.value.copy(c);let h=Au(s,{sky:l});e.environment=h.texture,e.environmentIntensity=1;const u=new Po;u.add(l);const d=new bc(256,{type:Ot}),f=new Sc(1,2e4,d);e.background=d.texture,e.backgroundIntensity=.55,e.fog=null;let g=null,A=null,m=null;if(!i){const P=new en(1,1,{type:Ot,samples:Wi.msaaSamples});g=new Dx(s,P),A=new Px(e,t),m=new t_(e,t,n,.85);const B=new Ux,O=new $x;m.enabled=Wi.aoEnabled,Zx(g,{beauty:A,ao:m,smaa:B,bloom:O,output:new jl(kx),dither:new jl(Ox)})}let p=172,E=12.5,w="procedural-sky";const v=new I;let M=!1,y=!0,T=110;const C=new Set,x=Array.from({length:4},()=>{const P=new Lc(16771797,0,6,Math.PI*.37,.72,2);return P.castShadow=!i,P.shadow.mapSize.setScalar(512),P.shadow.bias=-1e-4,P.shadow.normalBias=.01,P.shadow.camera.near=.06,P.visible=!1,e.add(P,P.target),P}),_=new e_(x);function R(P=E,B=p){E=P,p=B;const O=Hx(E,{day:p});c.fromArray(O.direction);const F=Mt.smoothstep(O.altitude,-6,28),U=Mt.smoothstep(O.altitude,0,35);return o.intensity=(y?1.55:2.25)*Mt.smoothstep(O.altitude,-.5,20),o.color.set(16759931).lerp(new Ce(16774633),U),a.intensity=.08+.42*F,e.environmentIntensity=.08+(y?.85:.65)*F,o.shadow.radius=y?2.5:1,o.shadow.intensity=y?.82:1,r.set(1582900).lerp(new Ce(15002093),F),l.material.uniforms.sunPosition.value.copy(c),(!M||v.dot(c)<.9999)&&(v.copy(c),M=!0,f.update(s,u)),o.position.copy(o.target.position).addScaledVector(c,T),s.shadowMap.needsUpdate=!0,O}return{async loadEnvironment(P){const B=await new zx().setDataType(Qt).loadAsync(P);B.mapping=Ps;const O=B.image.data;for(let U=0;U<O.length;U+=4){const Y=.2126*O[U]+.7152*O[U+1]+.0722*O[U+2];if(Y>8){const V=8/Y;O[U]*=V,O[U+1]*=V,O[U+2]*=V}}B.needsUpdate=!0;const F=Au(s,{background:B});e.environment=F.texture,h.dispose(),h=F,B.dispose(),w="hdr",R()},horizonColour:r,setFixtures(P){_.setFixtures(P)},interior(P,B,O){_.select(P,B,O)},setLights(P){_.setEnabled(P)},setTime:R,setWalkInterior(P){for(const B of C)Xx(B,P);R(E,p)},update(P){const B=_.update(P);return B.shadowChanged&&(s.shadowMap.needsUpdate=!0),B.active},snapshot(){return{environment:w,interior:_.snapshot()}},setStyle(P){y=P!=="sun",R()},prepareMesh(P,{clipped:B,context:O}){P.userData.sectionClipped=B;const F=Array.isArray(P.material)?P.material:[P.material];F.every(Y=>/^(foliage(?:_light)?|hedge)$/.test(Y.name))&&uf(P.geometry);const U=F.every(vu);P.userData.aoExcluded=U,P.castShadow=!U,P.receiveShadow=!U;for(const Y of F){Gx(Y,{context:O}),C.add(Y),["plaster","soffit"].includes(Y.userData.presentationR27?.family)&&(Y.envMap=h.texture),Y.clipShadows=!0,vu(Y)&&(Y.metalness=0,df(Y)&&(Y.depthWrite=!1));for(const V of Object.values(Y))V?.isTexture&&(V.anisotropy=Math.min(i?8:16,s.capabilities.getMaxAnisotropy()))}},frame(P,B){const O=B?.getSize(new I),F=P==="neighborhood"?52:P==="region"?Math.max(O?.x??320,O?.z??320)*.65:24;o.shadow.normalBias=P==="region"?.09:P==="neighborhood"?.035:.018,T=P==="region"?340:110,o.target.position.set(0,4,-5),P==="region"&&B&&o.target.position.copy(B.getCenter(new I)),o.position.copy(o.target.position).addScaledVector(c,T),Object.assign(o.shadow.camera,{left:-F,right:F,top:F,bottom:-F}),o.shadow.camera.updateProjectionMatrix(),s.shadowMap.needsUpdate=!0,m&&(m.enabled=Wi.aoEnabled&&P!=="region"),R();for(const U of C)Wx(U,P)},pixelRatio(P){g?.setPixelRatio(P)},resize(P,B){g?.setSize(P,B)},render(P){if(!g||s.xr.isPresenting){s.render(e,P);return}A.camera=P,m.setCamera(P),g.render()}}}function s_(s,e,t=0){return s.left<e.right+t&&s.right>e.left-t&&s.top<e.bottom+t&&s.bottom>e.top-t}function ff(s,{width:e,height:t,obstacles:n=[],gap:i=6,padding:r=8,maxDisplacement:a=24}){const o=[],c=n.slice();for(const l of s){if(![l.x,l.y,l.width,l.height].every(Number.isFinite)||l.width<=0||l.height<=0||l.x<0||l.x>e||l.y<0||l.y>t)continue;const h=l.width/2,u=l.height/2;if(l.width+2*r>e||l.height+2*r>t)continue;const d=Math.max(r+h,Math.min(e-r-h,l.x)),f=Math.max(r+u,Math.min(t-r-u,l.y));if(Math.hypot(d-l.x,f-l.y)>a)continue;const g={left:d-h,right:d+h,top:f-u,bottom:f+u};c.some(A=>s_(g,A,i))||(c.push(g),o.push({...l,x:d,y:f,rect:g}))}return o}let Pl=null,xu=0,_u=null;function pf(s,e=!1){const t=typeof performance=="object"?performance.now():Date.now();return!e&&Pl&&_u===s&&t-xu<250?Pl:(_u=s,xu=t,Pl=r_(s))}function r_(s){const e=s.getBoundingClientRect();return[...document.querySelectorAll(".topbar,.scale-picker,.view-description,.side-tools,.explore-dock,.panel,.region-panel,.model-scale,.walk-close,.walk-room-panel,.walk-pad,.load-status,.gesture-help,.device-qa-status")].filter(t=>t.getClientRects().length>0).map(t=>{const n=t.getBoundingClientRect();return{left:n.left-e.left,right:n.right-e.left,top:n.top-e.top,bottom:n.bottom-e.top}})}const mf={"f1-Z06":53.2,"f1-Z04":25.84,"f1-Z07":20.86,"f1-Z02":11.56,"f1-Z01":5.04,"f1-Z03":2.04,"f2-102":22.07,"f2-105":14.59,"f2-106":13.41,"f2-107":12.05,"f2-101":8.72,"f2-104":8.55,"f2-108":7.88,"f2-103":7.55,"f3-C05":23.63,"f3-C04":19.77,"f3-C02":10.53,"f3-C03":5.74},a_={"f0-B02":26.56,"f1-Z08":5.56};Object.assign(mf,a_);function o_(s){return Mt.clamp(7+Math.log2(Math.max(1,s)/12)*1.9,7,11)}function gf(s){return`${s.toLocaleString("tr-TR",{minimumFractionDigits:1,maximumFractionDigits:1})} m`}function zc(s,e){const t=mf[s?.id]??(Number.isFinite(s?.area_m2)?s.area_m2:null);if(t!==null)return`${t.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})} m²`;const n=(s?.dimensions??[]).map(i=>e?.dimensions?.find(r=>r.id===i)).filter(i=>i?.basis==="dwg_verified"&&i.dimension_label_allowed);return n[0]?gf(n[0].metres):""}function l_(s,e,t){if(s.coordinate_system!=="glTF_Y_up")throw Error("Invalid room annotations");const n=new $t;n.name="Source dimensions",n.userData.aoExcluded=!0;const i=document.createElement("div");i.className="annotation-overlay",e.append(i);const r=[],a=[],o=new I,c=new zs({color:3235420,depthTest:!1,depthWrite:!1,toneMapped:!1}),l=new Nd({color:7178882,dashSize:.16,gapSize:.12,depthTest:!1,depthWrite:!1,toneMapped:!1});for(const u of s.rooms){const d=document.createElement("button");d.type="button",d.className="room-label";const f=document.createElement("strong");f.textContent=u.name;const g=document.createElement("span");g.textContent=zc(u,s);const A=document.createElement("small");u.label_only||(A.textContent="360°",A.setAttribute("aria-hidden","true"));const m=document.createElement("i"),p=document.createElement("em");p.append(g,A),m.append(f,p),d.append(m),d.setAttribute("aria-label",u.label_only?u.name:g.textContent?`${u.name}, ${g.textContent}, 360 derece gez`:`${u.name}, 360 derece gez`),d.title=u.label_only?"Açık balkon":`${u.name} · 360° keşfet`,u.label_only?d.disabled=!0:d.onclick=E=>{E.stopPropagation(),t(u.id)},i.append(d),r.push({el:d,position:new I(...u.position),floor:u.floor_index})}for(const u of s.dimensions){const d=!u.dimension_label_allowed;if(d&&u.basis!=="model_measured")continue;const f=new I(...u.a),g=new I(...u.b),A=g.clone().sub(f).normalize().cross(new I(0,1,0)).multiplyScalar(.12),m=new wc(new kt().setFromPoints([f,g,f.clone().add(A),f.clone().sub(A),g.clone().add(A),g.clone().sub(A)]),d?l:c);d&&m.computeLineDistances(),m.renderOrder=105,m.userData.aoExcluded=!0,n.add(m);const p=document.createElement("span");p.className=d?"dimension-label measured":"dimension-label",p.textContent=gf(u.metres),p.title=u.basis==="dwg_verified"?"Çizimde belirtilen ölçü":"Model üzerinden ölçülen açıklık",i.append(p),a.push({el:p,line:m,position:f.clone().add(g).multiplyScalar(.5),floor:u.floor_index,roomId:u.room_id,measured:d})}function h(u,d,f,g,A){o.copy(u.position).project(d);const m=o.z>-1&&o.z<1&&Math.abs(o.x)<1.1&&Math.abs(o.y)<1.1;if(u.el.hidden=!m,!m)return null;const p=(o.x+1)*f/2,E=(1-o.y)*g/2;return u.el.style.left=`${p}px`,u.el.style.top=`${E}px`,u.el.style.fontSize=`${A}px`,{x:p,y:E}}return{group:n,data:s,update(u,d,f,g,A,m,p){const E=/^f[0-3]$/.test(u)?Number(u[1]):-1,w=e.clientWidth,v=e.clientHeight;m.updateMatrixWorld();const M=pf(e),y=[];for(const x of r){if(x.el.hidden=!(x.floor===E&&d&&!g&&!A),x.el.hidden)continue;const _=Math.max(1,x.position.distanceTo(m.position)),R=m.isPerspectiveCamera?v*m.zoom/(2*Math.tan(Mt.degToRad(m.fov/2))*_):v*m.zoom/(m.top-m.bottom);h(x,m,w,v,o_(R))}for(const x of a){const _=x.floor===E&&f&&!g&&(!A||x.roomId===p);if(x.line.visible=_,x.el.hidden=!_,_){const R=h(x,m,w,v,A?15:14);R&&y.push({...R,entry:x,width:x.el.offsetWidth,height:x.el.offsetHeight})}}y.sort((x,_)=>Number(x.entry.measured)-Number(_.entry.measured));const T=ff(y,{width:w,height:v,obstacles:M}),C=new Map(T.map(x=>[x.entry,x]));for(const x of y){const _=C.get(x.entry);x.entry.el.hidden=!1,x.entry.el.style.left=`${(_??x).x}px`,x.entry.el.style.top=`${(_??x).y}px`}},dispose(){i.remove(),n.traverse(u=>u.geometry?.dispose()),c.dispose(),l.dispose()}}}class c_{constructor(e){if(e.coordinate_system!=="glTF_Y_up"||e.layers?.length!==4)throw Error("Invalid walking surface");this.data=e,this.grid=e.grid;const t=e.grid.width*e.grid.height;this.layers=e.layers.map(n=>{const i=new Int16Array(t).fill(-32768),r=new Uint8Array(t).fill(1);return n.rows.forEach((a,o)=>a.forEach(([c,l,h,u])=>{for(let d=c;d<c+l;d++){const f=o*e.grid.width+d;i[f]=h,r[f]=u}})),{heights:i,masks:r}})}index(e,t){const{x:n,z:i,step:r,width:a,height:o}=this.grid,c=Math.floor((e-n)/r),l=Math.floor((t-i)/r);return c<0||l<0||c>=a||l>=o?-1:l*a+c}sample(e,t,n,i=!0,r=this.data.maximum_step_m){const a=this.index(e,t);if(a<0)return null;let o=null;return this.layers.forEach((c,l)=>{if(c.masks[a]&(i?3:1)||c.heights[a]===-32768)return;const h=c.heights[a]/1e3,u=Math.abs(h-n);u<=r&&(o===null||u<o.difference)&&(o={height:h,difference:u,floor:l})}),o}move(e,t,n,i=!0){const r=Math.hypot(t,n),a=Math.max(1,Math.ceil(r/(this.grid.step*.4)));let o=!1;for(let c=0;c<a;c++){const l=t/a,h=n/a,u=e.y-this.data.eye_height_m,d=this.sample(e.x+l,e.z+h,u,i);if(d)e.x+=l,e.z+=h,e.y=d.height+this.data.eye_height_m,o=!0;else{const f=this.sample(e.x+l,e.z,u,i);f&&(e.x+=l,e.y=f.height+this.data.eye_height_m,o||=Math.abs(l)>0);const g=this.sample(e.x,e.z+h,e.y-this.data.eye_height_m,i);g&&(e.z+=h,e.y=g.height+this.data.eye_height_m,o||=Math.abs(h)>0)}}return o}station(e){return this.data.stations.find(t=>t.room_id===e)}path(e,t,n=!0){const i=this.grid.width*this.grid.height,r=n?3:1,a=this.sample(e[0],e[2],e[1]-this.data.eye_height_m,n,.3),o=this.sample(t[0],t[2],t[1]-this.data.eye_height_m,n,.3);if(!a||!o)return null;const c=a.floor*i+this.index(e[0],e[2]),l=o.floor*i+this.index(t[0],t[2]),h=new Int32Array(i*4).fill(-1),u=new Int32Array(i*4);let d=0,f=1;for(u[0]=c,h[c]=c;d<f&&h[l]===-1;){const m=u[d++],p=Math.floor(m/i),E=m%i,w=E%this.grid.width,v=Math.floor(E/this.grid.width),M=this.layers[p].heights[E];for(const[y,T]of[[1,0],[-1,0],[0,1],[0,-1]]){const C=w+y,x=v+T;if(C<0||x<0||C>=this.grid.width||x>=this.grid.height)continue;const _=x*this.grid.width+C;for(let R=0;R<4;R++){const P=R*i+_,B=this.layers[R];h[P]!==-1||B.masks[_]&r||B.heights[_]===-32768||Math.abs(B.heights[_]-M)>this.data.maximum_step_m*1e3||(h[P]=m,u[f++]=P)}}}if(h[l]===-1)return null;const g=[];let A=l;for(;A!==c;){const m=Math.floor(A/i),p=A%i;g.push([this.grid.x+(p%this.grid.width+.5)*this.grid.step,this.layers[m].heights[p]/1e3+this.data.eye_height_m,this.grid.z+(Math.floor(p/this.grid.width)+.5)*this.grid.step]),A=h[A]}return g.reverse(),g.push(t),g}}const h_=95;class u_{constructor(e,t,n){this.surface=new c_(e),this.canvas=t,this.invalidate=n,this.camera=new zt(60,1,.045,450),this.camera.rotation.order="YXZ",this.rig=new $t,this.rig.add(this.camera),this.active=!1,this.xrActive=!1,this.keys=new Set,this.furniture=!0,this.yaw=.85,this.pitch=-.04,this.pointer=null,this.lastTime=null,t.addEventListener("pointerdown",a=>{!this.active||this.inputSuspended||this.xrActive||this.pointer||(this.pointer={id:a.pointerId,x:a.clientX,y:a.clientY},t.setPointerCapture(a.pointerId))}),t.addEventListener("pointermove",a=>{this.inputSuspended||!this.pointer||this.pointer.id!==a.pointerId||(this.yaw-=(a.clientX-this.pointer.x)*.004,this.pitch=Mt.clamp(this.pitch-(a.clientY-this.pointer.y)*.004,-1.25,1.25),Object.assign(this.pointer,{x:a.clientX,y:a.clientY}),this.pose(),n())});const i=a=>{this.pointer?.id===a.pointerId&&(this.pointer=null)};t.addEventListener("pointerup",i),t.addEventListener("pointercancel",i),t.addEventListener("lostpointercapture",i);const r=["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"];window.addEventListener("keydown",a=>{!this.active||this.inputSuspended||a.altKey||a.ctrlKey||a.metaKey||a.target.isContentEditable||/INPUT|SELECT|TEXTAREA/.test(a.target.tagName)||r.includes(a.code)&&(a.preventDefault(),this.keys.add(a.code),n())}),window.addEventListener("keyup",a=>{this.keys.delete(a.code),this.active&&n()}),window.addEventListener("blur",()=>{this.keys.clear(),this.pointer=null,this.lastTime=null}),document.addEventListener("visibilitychange",()=>{this.visibilityPaused=document.hidden,this.keys.clear(),this.pointer=null,this.lastTime=null,!document.hidden&&this.active&&n()}),document.querySelectorAll("[data-walk-direction]").forEach(a=>{const o=a.dataset.walkDirection;a.addEventListener("pointerdown",l=>{!this.active||this.inputSuspended||(l.preventDefault(),a.setPointerCapture(l.pointerId),this.keys.add(o),n())});const c=()=>{this.keys.delete(o),n()};a.addEventListener("pointerup",c),a.addEventListener("pointercancel",c),a.addEventListener("lostpointercapture",c),a.addEventListener("keydown",l=>{this.active&&!this.inputSuspended&&["Enter"," "].includes(l.key)&&(l.preventDefault(),this.keys.add(o),n())}),a.addEventListener("keyup",l=>{["Enter"," "].includes(l.key)&&c()}),a.addEventListener("blur",c)})}pose(){this.xrActive||this.camera.rotation.set(this.pitch,this.yaw,0,"YXZ")}resize(e,t){this.camera.aspect=e/t;const n=Mt.degToRad(h_);this.camera.fov=Mt.clamp(Mt.radToDeg(2*Math.atan(Math.tan(n/2)/this.camera.aspect)),46,82),this.camera.updateProjectionMatrix()}enter(e){const t=this.surface.station(e);if(!t)throw Error("Unknown room");return this.active=!0,this.keys.clear(),this.lastTime=null,this.route=null,this.rig.position.set(0,0,0),this.rig.rotation.set(0,0,0),this.camera.position.fromArray(t.position),this.yaw=t.view_yaw_rad??.85,this.pitch=t.view_pitch_rad??-.04,this.pose(),this.room=t.room_id,this.floor=t.floor_index,this.invalidate(),t}leave(){this.active=!1,this.keys.clear(),this.pointer=null,this.lastTime=null,this.route=null}travel(e,t){const n=this.surface.station(e);if(!n)return!1;const i=this.surface.path(this.camera.position.toArray(),n.position,this.furniture);return i?(this.route={points:i,index:0,room:e,onArrive:t},this.keys.clear(),this.invalidate(),!0):!1}update(e,t){const n=this.lastTime===null?0:Math.min(.05,(e-this.lastTime)/1e3);if(this.lastTime=e,!this.active||this.inputSuspended||this.visibilityPaused)return!1;if(this.route&&!this.xrActive)if(this.keys.size)this.route=null;else{const u=this.route;let d=n*2.1;for(;d>0&&u.index<u.points.length;){const g=new I(...u.points[u.index]),A=this.camera.position.distanceTo(g);A<=d?(this.camera.position.copy(g),u.index++,d-=A):(this.camera.position.lerp(g,d/A),d=0)}const f=this.surface.sample(this.camera.position.x,this.camera.position.z,this.camera.position.y-this.surface.data.eye_height_m,this.furniture,.3);return f&&(this.floor=f.floor),u.index>=u.points.length&&(this.room=u.room,this.route=null,u.onArrive?.(this.surface.station(u.room))),!0}let i=(this.keys.has("KeyW")||this.keys.has("ArrowUp")?1:0)-(this.keys.has("KeyS")||this.keys.has("ArrowDown")?1:0),r=(this.keys.has("KeyD")||this.keys.has("ArrowRight")?1:0)-(this.keys.has("KeyA")||this.keys.has("ArrowLeft")?1:0),a=this.yaw;if(this.xrActive&&t){const u=[...t.inputSources].find(f=>f.handedness==="left"&&f.gamepad);if(u){const f=u.gamepad.axes,g=f.length>=4?2:0;r=f[g]??0,i=-(f[g+1]??0),Math.abs(r)<.18&&(r=0),Math.abs(i)<.18&&(i=0)}const d=this.camera.getWorldDirection(new I);a=Math.atan2(-d.x,-d.z)}const o=Math.hypot(i,r);if(!o)return!1;i/=Math.max(1,o),r/=Math.max(1,o);const c=1.25*n,l=(-Math.sin(a)*i+Math.cos(a)*r)*c,h=(-Math.cos(a)*i-Math.sin(a)*r)*c;if(this.xrActive){const u=this.camera.getWorldPosition(new I);u.y=this.rig.position.y+this.surface.data.eye_height_m;const d=u.clone();this.surface.move(u,l,h,this.furniture),this.rig.position.add(u.sub(d))}else this.surface.move(this.camera.position,l,h,this.furniture);return!0}startXR(){const e=this.camera.getWorldPosition(new I);this.rig.position.set(e.x,e.y-this.surface.data.eye_height_m,e.z),this.rig.rotation.y=this.yaw,this.camera.position.set(0,0,0),this.camera.rotation.set(0,0,0),this.xrActive=!0,this.keys.clear()}endXR(){const e=this.camera.getWorldPosition(new I),t=this.camera.getWorldDirection(new I),n=this.rig.position.y;this.rig.position.set(0,0,0),this.rig.rotation.set(0,0,0),this.camera.position.copy(e),this.camera.position.y=n+this.surface.data.eye_height_m,this.xrActive=!1,this.yaw=Math.atan2(-t.x,-t.z),this.pitch=Math.asin(Mt.clamp(t.y,-1,1)),this.pose()}teleportXR(e){const t=this.surface.sample(e.x,e.z,e.y,this.furniture,.18);if(!t)return!1;const n=this.camera.getWorldPosition(new I);return this.rig.position.x+=e.x-n.x,this.rig.position.z+=e.z-n.z,this.rig.position.y=t.height,!0}}async function d_(s,e,t,n,i,r){const a=document.querySelector("#enter-vr");if(!navigator.xr||!window.isSecureContext)return;let o=!1;try{o=await navigator.xr.isSessionSupported("immersive-vr")}catch{return}if(!o)return;s.xr.enabled=!0,s.xr.setReferenceSpaceType("local-floor"),a.hidden=!1;const c=new Oc,l=new Be;for(let h=0;h<2;h++){const u=s.xr.getController(h);t.rig.add(u);const d=new Lr(new kt().setFromPoints([new I,new I(0,0,-5)]),new zs({color:7524351}));d.userData.aoExcluded=!0,u.add(d),u.addEventListener("select",()=>{u.updateWorldMatrix(!0,!1),l.extractRotation(u.matrixWorld),c.ray.origin.setFromMatrixPosition(u.matrixWorld),c.ray.direction.set(0,0,-1).applyMatrix4(l),c.far=12;const g=c.intersectObjects([...n.values()],!0).filter(m=>m.object.visible)[0];if(!g?.face)return;g.face.normal.clone().transformDirection(g.object.matrixWorld).y>.7&&t.teleportXR(g.point)})}a.onclick=async()=>{try{if(s.xr.isPresenting){await s.xr.getSession().end();return}i();const h=await navigator.xr.requestSession("immersive-vr",{optionalFeatures:["local-floor","bounded-floor"]});await s.xr.setSession(h)}catch(h){a.textContent="VR’a tekrar gir",console.warn("XR session could not start",h)}},s.xr.addEventListener("sessionstart",()=>{t.startXR(),a.textContent="VR’dan çık"}),s.xr.addEventListener("sessionend",()=>{t.endXR(),a.textContent="VR’a gir",r()})}const fr=[0,3.0996,6.3714,9.4705];function ql(s,e){return/^f[0-3]$/.test(s)?fr[Number(s[1])]+(s==="f3"?1.3:1.6):e}function Af(s){return s=Math.max(0,Math.min(1,s)),s*s*(3-2*s)}const f_={pitch:.14,duty:.065,ground:[.02,.02,.023],ink:[.32,.31,.29],strength:.62},p_={pitch:.55,duty:.075,ground:[.58,.568,.527],ink:[.015,.015,.016],strength:1};function vf({pitch:s,duty:e,ground:t,ink:n,strength:i=.62}){return new St({side:Zt,vertexShader:`varying vec3 worldPosition;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        worldPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,fragmentShader:`varying vec3 worldPosition;
      // how much of one period is inked, and the ruling's antiderivative
      const float INK = ${(2*e).toFixed(5)};
      float ruled(float x) { return floor(x) * INK + min(fract(x), INK); }
      void main() {
        float v = (worldPosition.x + worldPosition.y + worldPosition.z) / ${s.toFixed(4)};
        float w = max(fwidth(v), 1e-5);
        float hatch = clamp((ruled(v + 0.5 * w) - ruled(v - 0.5 * w)) / w, 0.0, 1.0);
        gl_FragColor = vec4(mix(vec3(${t.map(r=>r.toFixed(3)).join(", ")}), vec3(${n.map(r=>r.toFixed(3)).join(", ")}), hatch * ${i.toFixed(2)}), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`})}function m_(s){const e=new $t;e.name="Geometric wall sections";const t=s.slices;if(!t?.length||s.coordinate_system!=="glTF_XZ")throw Error("Invalid section atlas");const n=vf(f_),i=l=>{const h=new Tt(new kt,n);return h.name=l,h.renderOrder=2,e.add(h),h},r=[{mesh:i("Solid hatched wall cross section"),p:"p",i:"i"},{mesh:i("Solid hatched fixture cross section"),p:"q",i:"j"},{mesh:i("Solid hatched furniture cross section"),p:"fq",i:"fj",furniture:!0}];let a=-1,o=!0;function c(l){const h=t[l];for(const u of r){const d=h[u.p],f=h[u.i],g=new kt;if(d?.length&&f?.length){const A=new Float32Array(d.length/2*3);for(let m=0;m<d.length/2;m++)A[m*3]=d[m*2],A[m*3+2]=d[m*2+1];g.setAttribute("position",new mt(A,3)),g.setIndex(f),g.computeVertexNormals(),g.computeBoundingSphere()}u.mesh.geometry.dispose(),u.mesh.geometry=g}}return{group:e,update(l,h){if(e.visible=h&&l<=t.at(-1).height,!e.visible)return;let u=0,d=t.length-1;for(;u<d;){const f=u+d>>>1;t[f].height<l?u=f+1:d=f}u>0&&l-t[u-1].height<t[u].height-l&&u--,u!==a&&(a=u,c(u));for(const f of r)f.mesh.visible=!f.furniture||o,f.mesh.position.y=l},setFurnitureVisible(l){o=l}}}const xo=1.6;function g_(s){const e=new $t;e.name="Authored soil section";const t=[];if(s.updateMatrixWorld(!0),s.traverse(i=>{const r=Array.isArray(i.material)?i.material:[i.material];i.isMesh&&r.some(a=>a?.name==="R32 | soil section hatch")&&!/^R42[_ ]F0[_ ]site[_ ]section[_ ]field$/i.test(i.name)&&t.push(i)}),!t.length)return null;const n=vf(p_);for(const i of t){const r=new Tt(i.geometry,n);r.name="Solid hatched soil cross section",r.applyMatrix4(i.matrixWorld),r.renderOrder=2,r.castShadow=r.receiveShadow=!1,i.geometry=null,e.add(r)}return s.traverse(i=>{i.isMesh&&i.geometry&&i.geometry.dispose();for(const r of Array.isArray(i.material)?i.material:[i.material])if(r){for(const a of Object.values(r))a?.isTexture&&a.dispose();r.dispose()}}),{group:e,update(i,r){e.visible=r&&Math.abs(i-xo)<.001}}}const yu=1250;class A_{constructor(e,t,n,i){Object.assign(this,{camera:e,controls:t,resize:n,invalidate:i}),this.active=null}go({target:e,polar:t,span:n,zoom:i=1,azimuth:r,fov:a},o=!1){const{camera:c,controls:l}=this,h=new br().setFromVector3(c.position.clone().sub(l.target)),u=a??c.fov,d=n/(2*Math.tan(Mt.degToRad(u/2))),f=r??h.theta,g=Math.atan2(Math.sin(f-h.theta),Math.cos(f-h.theta)),A={target:e.clone(),polar:t,radius:d,zoom:i,azimuth:h.theta+g,fov:u},m=performance.now();this.active={start:m,endTime:m+yu,from:{target:l.target.clone(),polar:h.phi,radius:h.radius,zoom:c.zoom,azimuth:h.theta,fov:c.fov},to:A},l.enabled=!1,(o||matchMedia("(prefers-reduced-motion: reduce)").matches)&&this.update(this.active.endTime),this.invalidate()}update(e){if(!this.active)return!1;const t=this.active,n=e>=t.endTime,i=n?1:Mt.clamp((e-t.start)/yu,0,1),r=Af(i),a=Mt.lerp,o=a(t.from.polar,t.to.polar,r);return this.controls.minPolarAngle=this.controls.maxPolarAngle=o,this.controls.target.lerpVectors(t.from.target,t.to.target,r),this.camera.position.copy(this.controls.target).add(new I().setFromSpherical(new br(a(t.from.radius,t.to.radius,r),o,a(t.from.azimuth,t.to.azimuth,r)))),this.camera.zoom=a(t.from.zoom,t.to.zoom,r),this.camera.fov=a(t.from.fov,t.to.fov,r),this.camera.updateProjectionMatrix(),this.camera.lookAt(this.controls.target),n&&(this.active=null,this.controls.enabled=!0,this.controls.update()),!0}cancel(){this.active=null,this.controls.enabled=!0}}function v_(s,e,t){const n=document.createElement("div");n.className="hotspot-overlay",s.append(n);const i=new I,r=[];let a="";function o(){const c=`${e.room}:${e.floor}:${e.furniture}`;if(c===a||(a=c,n.replaceChildren(),r.length=0,!e.surface.station(e.room)))return;const h=e.camera.position,u=e.surface.data.stations.filter(f=>f.floor_index===e.floor&&f.room_id!==e.room).sort((f,g)=>h.distanceToSquared(new I(...f.position))-h.distanceToSquared(new I(...g.position))).slice(0,4),d=[-1,1].map(f=>e.surface.data.stations.find(g=>g.floor_index===e.floor+f&&/hol|antre/i.test(g.name))).filter(Boolean);for(const f of[...u,...d]){const g=f.floor_index!==e.floor,A=g?e.surface.path(h.toArray(),f.position,e.furniture):null;if(g&&!A)continue;const m=g?A[Math.min(20,A.length-1)]:f.position,p=document.createElement("button");p.type="button",p.className="hotspot";const E=document.createElement("i"),w=document.createElement("span");w.textContent=g?`${f.floor_index<e.floor?"↓":"↑"} ${["Bodrum","Giriş","1. kat","Çatı"][f.floor_index]}`:f.name,p.append(E,w),p.setAttribute("aria-label",`${w.textContent} odasına ilerle`),p.onclick=v=>{v.stopPropagation(),t(f.room_id)},n.append(p),r.push({el:p,position:new I(m[0],m[1]-e.surface.data.eye_height_m+.035,m[2])})}}return{update(c,l){if(n.hidden=!l,!!l){o(),c.updateMatrixWorld();for(const h of r){i.copy(h.position).project(c);const u=h.position.distanceTo(c.position);h.el.hidden=i.z<=-1||i.z>=1||Math.abs(i.x)>.94||Math.abs(i.y)>.88||u<.5,h.el.hidden||(h.el.style.left=`${(i.x+1)*s.clientWidth/2}px`,h.el.style.top=`${(1-i.y)*s.clientHeight/2}px`)}}},reset(){a=""}}}function Hc(s,e,t){s.replaceChildren();const n=/^f[0-3]$/.test(t)?Number(t[1]):-1,i=document.createElement("div");i.className="property-grid",s.append(i);function r(o,c){const l=document.createElement("div");l.className="property-stat";const h=document.createElement("strong"),u=document.createElement("span");h.textContent=o,u.textContent=c,l.append(h,u),i.append(l)}if(n>=0){const o=e.floor_areas?.find(l=>l.floor_index===n);r(o?`${o.area_m2.toLocaleString("tr-TR",{maximumFractionDigits:1})} m²`:"—","Kaplama izdüşümü · model hesabı"),r(String(e.rooms.filter(l=>l.floor_index===n).length),"Plan üzerinde alan");const c=document.createElement("ul");c.className="property-room-list";for(const l of e.rooms.filter(h=>h.floor_index===n)){const h=document.createElement("li"),u=document.createElement("div"),d=document.createElement("span");u.textContent=l.name,d.textContent=zc(l,e),h.append(u,d),c.append(h)}s.append(c)}else if(r("500 m²","Brüt alan · RE/MAX ilanı"),r("400 m²","Net alan · RE/MAX ilanı"),r("4","Kat"),r("5 + 4","Oda · RE/MAX ilanı"),e.site_areas){const o=document.createElement("ul");o.className="property-room-list";for(const c of e.site_areas){const l=document.createElement("li"),h=document.createElement("div"),u=document.createElement("span");h.textContent=c.name,u.textContent=`${c.estimated?"≈ ":""}${c.area_m2.toLocaleString("tr-TR",{maximumFractionDigits:1})} m²`,l.append(h,u),o.append(l)}s.append(o)}const a=document.createElement("p");a.className="small-note",a.textContent=n>=0?"Kat değeri, kaynak modeldeki kaplama yüzeylerinin yatay izdüşümüdür; kot farkları dahil, çakışan yüzeyler tek sayılır. Kullanılabilir net alan veya tapu alanı değildir. Oda sınırları ayrı doğrulanmadan oda m² değeri gösterilmez.":"İlan alanları RE/MAX P56131836 kaynağındandır. ≈, yorumlanmış bahçe sınırları içindeki model arazi yüzeyini veya fotoğrafa dayalı havuz tahminini belirtir; yerinde ölçüm ve parsel alanı değildir.",s.append(a)}function x_(s,e){s.enableDamping=!0,s.dampingFactor=.12,s.screenSpacePanning=!1,s.minZoom=.35,s.maxZoom=12,s.rotateSpeed=.6,s.touches.ONE=e.TOUCH.ROTATE,s.touches.TWO=e.TOUCH.DOLLY_PAN;let t=null;s.addEventListener("start",()=>{t=s.object.isPerspectiveCamera?s.object.position.distanceTo(s.target):null}),s.addEventListener("change",()=>{const n=s.object;if(t===null||!n.isPerspectiveCamera)return;const i=n.position.clone().sub(s.target),r=i.length();r<1e-9||Math.abs(r-t)<1e-9||(n.zoom=e.MathUtils.clamp(n.zoom*t/r,s.minZoom,s.maxZoom),n.position.copy(s.target).add(i.multiplyScalar(t/r)),n.updateProjectionMatrix(),n.lookAt(s.target))}),s.addEventListener("end",()=>{t=null})}class __{constructor(e=setTimeout,t=clearTimeout){this.schedule=e,this.clear=t,this.timer=null,this.revision=0}cancel(){this.revision++,this.timer!==null&&this.clear(this.timer),this.timer=null}run(e,t){this.cancel();const n=this.revision;this.timer=this.schedule(()=>{n===this.revision&&(this.timer=null,e())},t)}}function y_(s,e,t){const n=document.createElement("div");n.className="site-overlay",e.append(n);const i=s.buildings.slice().sort((d,f)=>(f.number===21)-(d.number===21)).map(d=>{const f=document.createElement(d.number===21?"button":"span");return f.className=d.number===21?"site-label site-label-villa":"site-label",f.textContent=d.number===21?"Villa 21":String(d.number),d.number===21?(f.type="button",f.setAttribute("aria-label","Villa 21’e yaklaş"),f.onclick=t):f.title=`Vaziyet planı · Yapı ${d.number}`,n.append(f),{el:f,p:new I(...d.position)}}),r=document.querySelector("#model-scale"),a=r.querySelector("i"),o=r.querySelector("span"),c=new I,l=new I,h=new I,u=new I;return{update(d,f,g,A,m){const p=["region","neighborhood"].includes(d)&&!A&&!m;if(n.hidden=!p,r.hidden=m||A,!f||!g)return;f.updateMatrixWorld();const E=e.clientWidth,w=e.clientHeight,v=[];if(p)for(const C of i){c.copy(C.p).project(f);const x=(c.x+1)*E/2,_=(1-c.y)*w/2;C.el.hidden=c.z<-1||c.z>1||x<0||x>E||_<0||_>w,!C.el.hidden&&v.push({x,y:_,entry:C,width:C.el.offsetWidth,height:C.el.offsetHeight})}u.set(1,0,0).applyQuaternion(f.quaternion),u.y=0,u.normalize(),l.copy(g).project(f),h.copy(g).add(u).project(f);const M=Math.abs(h.x-l.x)*E/2,y=[.5,1,2,5,10,20,50,100].filter(C=>C*M<110).at(-1)??.5;a.style.width=Math.max(1,y*M)+"px",o.textContent=y.toLocaleString("tr-TR")+" m";const T=ff(v,{width:E,height:w,obstacles:pf(e),maxDisplacement:0});for(const C of v)C.entry.el.hidden=!0;for(const{entry:C,x,y:_}of T)C.el.hidden=!1,C.el.style.left=x+"px",C.el.style.top=_+"px"},dispose(){n.remove()}}}const M_=[[-6.3,-2.1],[-4.4,-4.8],[-4,-5.1],[-1.4,-6.9],[1.1,-8],[7.1,-8],[9.6,-1.4],[9.6,4.9],[5.1,10],[-4.4,10],[-5.5,6.9],[-6.3,4.2]],S_=[[-10.4,-20.5],[-9.7,-20.5],[12.3,-20.5],[12.3,14.6],[-10.4,14.6]],E_=[[[47.9,-77.7],[52.6,-81.1],[53.2,-81.6],[53.6,-81.9],[54.1,-82.2],[54.2,-82.3],[54.3,-82.4],[55,-82.9],[56,-83.6],[62.3,-81.9],[64.8,-78.4],[66.4,-76.3],[68,-74.1],[63,-67.2],[62.9,-67.2],[60.3,-65.2],[55.1,-64.7],[49.6,-72.2],[49.4,-72.5],[48.4,-76]],[[60,-80.2],[60.3,-86.8],[61.1,-87.4],[63.6,-89.2],[68.3,-92.7],[69.7,-91.7],[72.9,-89.7],[73.1,-89.4],[73.9,-88.3],[76,-85.5],[78.6,-81.9],[76.5,-77.1],[76.4,-77.1],[73.9,-75.2],[73.8,-75.2],[65.7,-72.4],[63.9,-74.9],[62.5,-76.9],[61.6,-78],[60.4,-79.7]],[[89.4,-107.7],[90.9,-108.4],[94.2,-110.1],[95.9,-110.2],[99.1,-110.5],[103.9,-111],[106.9,-106.8],[106.9,-106.7],[106.9,-106.2],[107.1,-104.9],[107.1,-104.2],[107.2,-103.4],[105.4,-95.1],[100.1,-94.6],[96.4,-94.2],[95.7,-94.2],[90.3,-97.8],[90.2,-99],[90,-100.9],[89.9,-101.9]],[[93.8,-92.7],[98.5,-97.3],[102.8,-97.7],[105.4,-97.9],[108.1,-98.2],[111.5,-90.3],[111.8,-87],[109.6,-82.3],[100.3,-81.4],[100,-81.4],[96.4,-82.3],[94.7,-82.8],[94.2,-88.6],[94.1,-89.4],[94.1,-89.8],[94,-90.4],[94,-90.6],[94,-90.7],[93.9,-91.5]],[[96.2,-69.8],[99.8,-75.2],[99.9,-75.3],[100.8,-75.3],[102.1,-75.5],[103.9,-75.6],[109.7,-76.2],[110.5,-74.7],[112.1,-71.3],[112.1,-71],[112.2,-70.3],[112.5,-66.8],[113,-61.7],[108.8,-58.7],[108.7,-58.7],[107.9,-58.6],[105.5,-58.3],[97.1,-60.2],[96.6,-66]],[[97.2,-57.5],[101.9,-62.1],[106.2,-62.5],[108.9,-62.7],[111.5,-63],[114.9,-55.1],[114.9,-55],[115.2,-51.8],[113.1,-47.1],[103.7,-46.2],[103.4,-46.2],[99.8,-47.1],[98.2,-47.6],[97.6,-53.4],[97.6,-54.3],[97.5,-54.6],[97.5,-55.2],[97.4,-55.4],[97.4,-56.3]],[[99.5,-34.9],[101.4,-38.1],[103.1,-40.3],[103.8,-40.4],[104.6,-40.5],[105,-40.5],[106.5,-40.7],[107.2,-40.7],[113,-41.3],[113.8,-39.8],[115.4,-36.4],[115.5,-35.4],[115.9,-31.9],[116.3,-26.8],[112.1,-23.7],[112,-23.7],[111.9,-23.7],[109.7,-23.5],[108.8,-23.4],[100.4,-25.3],[99.9,-31.1]],[[100.4,-25.3],[108.3,-28.6],[108.4,-28.6],[111.6,-29],[116.3,-26.8],[116.6,-24.1],[116.8,-21.5],[117.3,-17.1],[116.3,-13.5],[115.8,-11.9],[110,-11.4],[109.1,-11.3],[108.8,-11.2],[108.2,-11.2],[108,-11.2],[107.1,-11.1],[105.9,-11],[103.8,-12.9],[101.4,-15.6],[101.3,-15.9]],[[102.4,-3.1],[103.9,-3.9],[107.3,-5.5],[108,-5.5],[113.5,-6.1],[116.9,-6.4],[120,-2.2],[120,-2.1],[120,-1.6],[120.1,-.3],[120.2,.4],[120.3,1.2],[118.4,9.5],[114.7,9.9],[109.1,10.4],[108.8,10.4],[103.4,6.8],[103.2,5.6],[103.1,3.7],[103,2.7]],[[71.3,28.4],[73.2,20.1],[75.9,19.8],[79,19.5],[82.5,19.2],[82.8,19.2],[88.3,22.8],[88.4,24.5],[88.6,26.9],[89.2,32.7],[87.7,33.4],[84.3,35.1],[83.3,35.2],[77.4,35.7],[74.7,36],[71.7,31.8],[71.7,31.7],[71.6,31.5],[71.6,31.1],[71.5,30.1],[71.4,29.3]],[[69.8,11.7],[71.9,7],[81.3,6.1],[81.6,6.1],[85.2,7],[86.8,7.5],[86.8,7.6],[87.4,13.3],[87.7,17.4],[83.1,22],[78.8,22.4],[76.1,22.6],[73.5,22.9],[70.1,15],[70,14.7],[69.9,13.4]],[[58.8,-9.7],[64.9,-15.3],[65.9,-16.3],[72.4,-16.7],[72.5,-16.6],[73.3,-15.7],[74.5,-14.5],[74.8,-14.1],[75.2,-13.6],[79.2,-9.3],[78.4,-7.8],[76.7,-4.5],[76.5,-4.3],[74.7,-2.6],[72.4,-.5],[69.6,2.1],[64.6,.5],[64.5,.3],[63.4,-.8],[62.6,-1.7],[62.4,-2]],[[49.9,-19.4],[56.8,-25.7],[57,-25.9],[60.5,-27.3],[62.1,-28],[62.2,-27.9],[66,-23.7],[68.8,-20.6],[67.8,-14.2],[64.6,-11.2],[62.7,-9.5],[60.7,-7.6],[53.3,-11.9],[53.1,-12.1],[52.2,-13.1],[51,-14.3]],[[30.9,-24.8],[32.8,-34],[32.9,-34.3],[34.9,-37.5],[35.8,-38.9],[35.9,-38.9],[41.5,-37.7],[45.5,-36.8],[48.5,-31],[47.6,-26.8],[47.1,-24.2],[46.5,-21.6],[38,-20.7],[37.7,-20.7],[36.4,-21],[34.7,-21.4]],[[10.6,-28.9],[11.3,-31.9],[12.6,-38.1],[12.6,-38.4],[17.7,-42.5],[21.7,-41.7],[27.4,-40.5],[27.7,-38.8],[28.3,-35.1],[27.8,-32.8],[27.4,-31],[27.2,-30],[26.3,-25.7],[21.4,-24],[18.1,-24.7]],[[-2.2,-31.6],[-.3,-40.8],[-.2,-41.1],[1.8,-44.2],[2.7,-45.7],[2.8,-45.6],[8.4,-44.5],[12.4,-43.6],[15.4,-37.8],[14.5,-33.6],[14,-31],[13.4,-28.4],[4.9,-27.5],[4.6,-27.5],[3.3,-27.8],[1.6,-28.1]],[[-39.7,-4.9],[-35.2,-7.5],[-31.8,-7.5],[-23.7,-4.9],[-23.7,4.8],[-27.8,9.9],[-31.9,9.9],[-37.7,9.9],[-38.4,8.3],[-39.7,4.8]],[[-26.4,-4.9],[-25.1,-5.9],[-18.3,-7.5],[-14.9,-7.5],[-10.4,-4.9],[-10.4,4.8],[-11.7,8.3],[-12.3,9.9],[-18.2,9.9],[-19.1,9.9],[-19.4,9.9],[-20,9.9],[-20.2,9.9],[-21.1,9.9],[-22.3,9.9],[-26.4,4.8]],[[14.6,6.4],[15.3,4.9],[17,1.6],[17.5,1.1],[19.3,-.6],[24.2,-5],[29.1,-3.5],[29.3,-3.3],[30.9,-1.6],[31.3,-1],[31.4,-1],[35,6.8],[28.1,13.1],[27.8,13.3],[21.3,13.7],[20.9,13.3],[19.4,11.7],[19.1,11.3],[18.5,10.7]],[[27.2,15.7],[28.1,9.2],[31.3,6.3],[33.3,4.5],[35.3,2.7],[42.7,6.9],[42.7,7],[45,9.4],[46.1,14.4],[39.2,20.8],[38.9,21],[35.5,22.4],[33.9,23],[30,18.7],[29.3,18],[29.1,17.8],[28.7,17.4],[28.6,17.2],[28,16.6]],[[38.8,29.1],[40.2,28.2],[43.3,26.2],[43.6,26.1],[44,26],[48.8,25],[49.8,24.8],[52.8,24.1],[56.3,28],[56.4,28.7],[56.5,29.1],[56.7,30],[57,31.3],[56.1,39.8],[53.5,40.3],[50.1,41.1],[46.7,41.8],[40.8,38.8],[40.2,35.9],[40.1,35.5],[40,34.8]],[[42,44.1],[46.1,39],[50.3,38.1],[52.9,37.6],[55.5,37],[59.8,44.4],[59.8,44.5],[60.5,47.7],[58.9,52.6],[49.7,54.6],[49.4,54.6],[45.7,54.1],[44.1,53.8],[42.8,48.1],[42.7,47.4],[42.5,46.4],[42.4,46.2],[42.4,46.1],[42.2,45.3]],[[13,71.2],[13.8,62.7],[17.5,61.9],[19,61.5],[22,60.9],[23.3,60.6],[29.1,63.6],[30,67.6],[31.2,73.3],[29.8,74.3],[26.6,76.3],[26.3,76.3],[23.9,76.8],[22.4,77.2],[17.2,78.3],[13.7,74.4],[13.4,73.2],[13.3,72.8]],[[11.9,54.2],[13.5,49.3],[22.7,47.3],[23,47.3],[26.7,47.8],[28.4,48.1],[28.4,48.2],[29.6,53.8],[30.4,57.8],[26.3,62.9],[22.1,63.8],[19.5,64.3],[16.9,64.9],[12.6,57.5],[12.5,57.2],[12.3,55.9]],[[-17.7,38.9],[-17.7,35.8],[-17.7,35.5],[-17.7,31.3],[-17.7,29.2],[-13.6,24.1],[-11.6,24.1],[-10.4,24.1],[-10.2,24.1],[-9.5,24.1],[-3.6,24.1],[-3,25.7],[-1.7,29.2],[-1.7,30.2],[-1.7,32],[-1.7,38.9],[-6.2,41.5],[-6.8,41.5],[-8.2,41.5],[-9,41.5],[-9.5,41.5],[-9.6,41.5]],[[-30.8,29.2],[-29.5,25.7],[-28.9,24.1],[-23.1,24.1],[-19,24.1],[-14.9,29.2],[-14.9,33.5],[-14.9,36.2],[-14.9,38.9],[-23,41.5],[-26.3,41.5],[-30.8,38.9],[-30.8,29.5]],[[-52.9,35.8],[-52.9,33],[-52.9,32.4],[-50.3,24.3],[-44.8,24.3],[-40.9,24.3],[-40.6,24.3],[-37.6,26.4],[-35.5,28.4],[-35.5,29.7],[-35.5,31.3],[-35.5,32.5],[-35.5,38.4],[-37.1,39],[-40.6,40.3],[-41.3,40.3],[-46.2,40.3],[-50.3,40.3]],[[-64.8,31.8],[-63.5,28.3],[-62.9,26.7],[-57.1,26.7],[-53,26.7],[-48.9,31.8],[-48.9,36.1],[-48.9,38.7],[-48.9,41.4],[-57,44],[-60.3,44],[-64.8,41.4],[-64.8,32.1]],[[-83.7,57.2],[-79.3,54.6],[-75.9,54.6],[-67.8,57.2],[-67.8,66.9],[-71.9,72],[-76,72],[-81.8,72],[-82.4,70.4],[-83.7,66.9]],[[-70.6,57.2],[-62.5,54.6],[-59.1,54.6],[-54.6,57.2],[-54.6,66.9],[-55.9,70.4],[-56.5,72],[-62.4,72],[-63.3,72],[-63.6,72],[-64.2,72],[-64.4,72],[-65.3,72],[-66.5,72],[-70.6,66.9]],[[-50.2,57.3],[-45.7,54.6],[-42.3,54.6],[-34.2,57.3],[-34.2,66.9],[-38.3,72],[-42.4,72],[-48.2,72],[-48.8,70.4],[-50.2,66.9]],[[-37,60.3],[-28.9,57.6],[-25.5,57.6],[-21,60.3],[-21,69.9],[-22.3,73.4],[-22.9,75],[-28.8,75],[-29.7,75],[-30,75],[-30.6,75],[-30.8,75],[-31.7,75],[-32.9,75],[-37,69.9]],[[-17.9,78.2],[-16.5,77.2],[-13.3,75.2],[-12.7,75.1],[-11.7,74.9],[-10.6,74.7],[-7.2,73.9],[-3.9,73.2],[-.4,77],[-.4,77.1],[-.1,78.3],[.2,79.6],[.3,80],[.3,80.3],[-.5,88.8],[-3.2,89.4],[-7.3,90.3],[-9.7,90.8],[-10,90.9],[-15.8,87.9],[-15.8,87.8],[-16.5,84.6],[-16.7,83.9]],[[-15.1,90.5],[-7.7,86.2],[-4.4,85.5],[.5,87.2],[1.1,89.8],[1.6,92.4],[2.5,96.6],[2,100.3],[1.7,102],[-4,103.2],[-4.9,103.4],[-5.2,103.5],[-5.8,103.6],[-6,103.6],[-6.8,103.8],[-8,104.1],[-10.4,102.4],[-13.1,100],[-13.2,99.7]],[[-41.9,140.7],[-41,132.2],[-38.1,131.6],[-32.2,130.4],[-31.9,130.3],[-31.6,130.2],[-25.8,133.2],[-25.7,133.2],[-25.4,135],[-25.1,136.1],[-24.9,137.2],[-23.7,142.9],[-25.1,143.8],[-28.2,145.8],[-28.5,145.9],[-29.2,146],[-33.3,146.9],[-37.7,147.9],[-41.2,144],[-41.2,143.9],[-41.4,142.9],[-41.8,141]],[[-40.5,123.3],[-38.9,118.3],[-29.8,116.4],[-29.4,116.3],[-25.8,116.9],[-24.1,117.1],[-24.1,117.2],[-22.9,122.8],[-22,126.9],[-26.1,131.9],[-30.3,132.8],[-32.9,133.4],[-35.6,134],[-39.8,126.6],[-40.2,124.9]],[[-47.2,100.9],[-44.5,98.4],[-42.7,96.8],[-40.9,95.1],[-40.3,94.6],[-40.1,94.4],[-33.6,94],[-33.2,94.5],[-31.8,95.9],[-31.3,96.5],[-30.8,97],[-26.9,101.3],[-27.6,102.9],[-29.3,106.2],[-29.5,106.4],[-30.1,106.9],[-31.1,107.8],[-33.9,110.4],[-36.4,112.7],[-41.4,111.2],[-41.5,111.1],[-42.3,110.3],[-43.5,108.9],[-43.7,108.7]],[[-59.1,94],[-52.2,87.6],[-51.9,87.4],[-48.5,86],[-46.9,85.4],[-46.8,85.5],[-43,89.7],[-40.2,92.7],[-41.1,99.2],[-44.3,102.1],[-46.3,103.9],[-48.3,105.7],[-55.7,101.5],[-55.9,101.3],[-56.8,100.3],[-58,99]],[[-80.8,100.8],[-80.8,96.7],[-80.8,92.2],[-80.8,91.2],[-76.7,86.1],[-73.8,86.1],[-73.5,86.1],[-72.6,86.1],[-66.8,86.1],[-66.2,87.7],[-64.9,91.2],[-64.9,92.5],[-64.9,92.9],[-64.9,95.3],[-64.9,100.8],[-69.4,103.4],[-69.6,103.4],[-70.1,103.4],[-71.9,103.4],[-72.2,103.4],[-72.6,103.4],[-72.7,103.4]],[[-94.2,89.7],[-89.1,85.6],[-84.8,85.6],[-82.1,85.6],[-79.4,85.6],[-76.8,93.7],[-76.8,93.8],[-76.8,97.1],[-79.4,101.5],[-88.8,101.5],[-89.1,101.5],[-92.6,100.2],[-94.2,99.6],[-94.2,93.8],[-94.2,93],[-94.2,92.6],[-94.2,92],[-94.2,91.8],[-94.2,91.7],[-94.2,90.9]],[[-115.4,106.4],[-112.6,101.3],[-112.2,100.6],[-112,100.2],[-111.7,99.7],[-111.6,99.5],[-111.1,98.8],[-110.5,97.7],[-104.1,96.6],[-100.3,98.7],[-98,100],[-95.7,101.3],[-97.4,109.7],[-99,112.6],[-103.5,115.3],[-111.7,110.7],[-111.9,110.5],[-114.3,107.7]]],b_={png:"data:image/png;base64,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",x:-135.2,y:-146.5,w:312,h:312},xi={villa:M_,plot:S_,buildings:E_,roads:b_},T_="2026-09-10",w_=1580,C_=["#8298b4","#c08e9a","#c8a976","#b7a06c","#8fae8b","#a2a8a2"],R_=[{name:"Durak · Hitit Bulvarı",kind:"durak",category:"public_transport",g:5,d:158,x:-117,y:106},{name:"Mutlu Çocuklar Anaokulu",kind:"anaokulu",category:"education_research",g:0,d:234,x:-232,y:-34},{name:"Şehitler Parkı",kind:"park",category:"parks_recreation",g:4,d:293,x:-125,y:-264},{name:"GMO Simitçii",kind:"kafe",category:"food_drink",g:2,d:307,x:-114,y:-285},{name:"Ankara Güzel Sanatlar Lisesi",kind:"lise",category:"education_research",g:0,d:437,x:185,y:-396},{name:"Çim Saha",kind:"spor",category:"sport",g:4,d:433,x:-124,y:-415},{name:"Çağdaş Market",kind:"market",category:"retail",g:3,d:813,x:-724,y:372},{name:"Total",kind:"akaryakit",category:"mobility_parking",g:5,d:832,x:-614,y:563},{name:"Sahib-ül Hayrat Ecdatlar Camii",kind:"cami",category:"religion",g:5,d:836,x:-54,y:833},{name:"Organik Eczanesi",kind:"eczane",category:"health",g:1,d:866,x:-799,y:337},{name:"Beytepe Aile Sağlığı Merkezi",kind:"saglik",category:"health",g:1,d:1012,x:-362,y:945},{name:"Spor Bilimleri Fakültesi",kind:"kampus",category:"education_research",g:0,d:1064,x:1040,y:-231},{name:"A101",kind:"supermarket",category:"retail",g:3,d:1136,x:1115,y:222},{name:"PTT - Beytepe Şubesi",kind:"ptt",category:"business_services",g:5,d:1448,x:1447,y:-87},{name:"Yapı Kredi Hacettepe Beytepe Kampüsü Şubesi",kind:"banka",category:"finance",g:5,d:1488,x:1484,y:131},{name:"Medisun Hastanesi",kind:"hastane",category:"health",g:1,d:2395,x:-699,y:-2290}],D_=JSON.parse(`[[-232,-34,0,"Mutlu Çocuklar Anaokulu"],[-41,-241,5,"Possible Electrician"],[-125,-264,4,"Şehitler Parkı"],[-90,-405,5,"Terk Edilmiş Bekçi Kulubesi"],[378,190,5,"Kimlik kontrol"],[-124,-415,4,"Çim Saha"],[185,-396,0,"Ankara Güzel Sanatlar Lisesi"],[7,-494,5,"Toplu Yapı Yönetimi"],[277,417,1,"Güzelsanatlar ve Spor Lisesi Bahçesi"],[-94,553,5,"BGES KUAFÖR"],[-151,-574,3,"BEYSUPARK ANGORA OPTİK"],[-57,688,3,"Lucenti"],[-435,566,0,"Gazi Anadolu Lisesi"],[-33,735,5,"MIA Gayrimenkul"],[-673,390,5,"Paris Kuaför - Beytepe"],[-704,338,2,"Barbec'cue Burger&Hot Dog"],[-29,787,5,"Beytepe Modern Ofis"],[-591,523,5,"Dry Vip Kuru Temizleme | Beytepe terzi kurutemizleme"],[-28,796,2,"Buff.et Steak Burger House"],[-587,554,5,"Pet's World"],[-683,436,3,"Orjinal Officium"],[-724,372,3,"Çağdaş Market"],[-707,446,3,"KARAMELA"],[-54,833,5,"Sahib-ül Hayrat Ecdatlar Camii"],[-761,357,5,"OJEMOJE The Nail House Ankara Çayyolu tırnak nailart protez tırnak"],[-773,351,5,"Backstage kuafor"],[-752,400,3,"AYŞEGÜL ERBİL EXCLUSİVE"],[-614,591,3,"Luna Flowers / Beytepe Çiçekçi"],[-799,337,1,"Organik Eczanesi"],[-696,586,3,"40 MİLLİON OPTİK BEYTEPE"],[-533,749,3,"Esra Semiz Beytepe"],[-656,648,3,"Macrocenter"],[-416,824,1,"Platin Eczanesi"],[-652,-684,1,"Altınışık Eczanesi"],[955,-35,0,"Nüfus Etütleri Enstitüsü"],[29,-957,1,"Altınışık Eczanesi"],[-257,924,5,"Sanatölye"],[851,-447,5,"Amfitiyatro"],[542,-841,4,"Beytepe Ormanı"],[977,233,5,"Prof. Dr. Süleyman Sağlam Büstü"],[1008,-53,0,"Yurt Kazan Dairesi"],[-431,912,2,"ChefMade Coffee House"],[-362,945,1,"Beytepe Aile Sağlığı Merkezi"],[-439,911,1,"Parçal Eczanesi"],[-864,543,5,"Keyvan Acrux Ticari"],[-511,894,3,"Yatsan"],[-599,843,2,"Mio Coffee"],[1040,-231,0,"Spor Bilimleri Fakültesi"],[-603,877,3,"İşbir Yatak"],[-589,902,2,"Bambino Mia Fırın"],[-495,966,3,"Auto Vogue"],[1086,-134,4,"Spor Fakültesi Spor Salonu"],[982,490,0,"Doğramacı Binası"],[1095,-88,4,"Kapalı Basketbol ve Tenis Kortu"],[1055,322,5,"Sağlık, Kültür ve Spor Daire Başkanlığı(Beytepe Ofisi)"],[-604,923,5,"Mira Ofis Beytepe"],[-1106,47,3,"Yaşar Optik"],[-503,997,3,"Bosch"],[1088,304,0,"Bisiklet klübü"],[1114,202,2,"Bunn"],[-1150,-6,5,"St Aktaş Sigorta"],[1134,191,3,"Beytepe Alışveriş Merkezi"],[-407,-1075,0,"Angora Sınav Koleji"],[1126,254,2,"Atatepe Kafe"],[-580,998,3,"Vestel"],[1144,205,2,"01 Adana Sofrası"],[-1163,-15,5,"Ametist Park"],[1153,157,2,"Geyik Cafe Bistro"],[-563,1018,3,"My Opticiens Optik"],[1157,144,3,"Şok"],[1156,199,3,"Enka Copy Kırtasiye"],[1156,-208,4,"Hacettepe Üniversitesi Beytepe Pisti"],[1163,187,2,"Coffy BAM"],[-1179,-36,2,"Botka Beytepe"],[-640,992,3,"Migros"],[-1181,53,5,"Keller Williams Borsa"],[-588,1028,2,"Harper's Coffee Beytepe"],[-1188,-33,5,"Ametist Grup Sigorta Aracılık Hizmetleri"],[-1192,-77,2,"Cicala Ristorante"],[-471,1098,3,"BeeGross"],[1009,658,0,"Eğitim Fakültesi"],[-1206,-62,1,"Mehtap Uysal Eczanesi"],[-583,1056,5,"Serap Engin Beauty Beytepe | Güzellik Merkezi"],[-769,937,3,"Nail Lab Beytepe"],[-602,1059,3,"TTO Body Shop - Beytepe"],[-1220,-80,5,"Kanıkey Kurutemizleme & Terzi"],[-1229,-58,3,"Yucca Concept - Beytepe"],[-1206,-298,4,"Lodumlu Parkı"],[-1246,-20,2,"Work Inn"],[1245,-252,5,"İnsanın Yükselişi Heykeli"],[-599,1132,5,"Zade Erkek Kuaförü Beytepe"],[-945,-879,5,"Beysupark Tanıtım Ofisi"],[1292,-48,2,"Coffy Hacettepe Üniversitesi"],[-464,1204,5,"Fly Technology Beytepe"],[-1294,-37,2,"Vesperna"],[-548,1172,5,"Ünsal Özkan Kuaför Beytepe"],[1278,264,1,"Beytepe Semt Polikliniği"],[1294,215,5,"Güvenlik"],[1320,85,0,"Fizik Mühendisliği Bölümü"],[1120,702,0,"Hukuk Fakültesi Kütüphanesi"],[1332,-45,5,"Exchange Heykeli"],[-1113,-737,3,"Dükkan Kasap"],[1329,144,0,"Nükleer Enerji Mühendisliği Bölümü"],[1339,-68,2,"Hacettepe kahvebahane"],[-456,-1260,2,"Frön Haus"],[1151,688,0,"Hacettepe Üniversitesi Hukuk Fakültesi"],[-1045,-848,4,"Base Life Club"],[1309,368,4,"Güneş Saatleri Parkı"],[1362,42,0,"Elektrik ve Elektronik Mühendisliği Bölümü"],[-1119,-776,3,"Migros Beysupark"],[-1097,-808,2,"SushiCo"],[-1137,-752,1,"Beysupark Eczanesi"],[1295,434,5,"Gazze Cami"],[-1159,-739,5,"Dry Diamond Kuru Temizleme"],[1377,-48,2,"Florida Coffee"],[1360,284,0,"Rektörlük"],[1297,517,0,"Harita Mühendisliği"],[-1132,-822,5,"Base Life Day Spa"],[1381,293,0,"Öğrenci İşleri Dairesi"],[1291,596,2,"Camlı Yemekhane"],[1423,199,0,"Hacettepe Üniversitesi Beytepe Kampüsü"],[1434,-141,0,"Biyoloji Bölümü"],[1446,24,5,"Yıldız Amfi"],[1447,-87,5,"PTT - Beytepe Şubesi"],[1405,389,2,"Container Coffee"],[1440,-243,0,"Hacettepe Mimarlık Fakültesi"],[1338,605,2,"Piramit Kafe"],[-514,1383,3,"Ünal Kuruyemiş"],[-380,-1426,3,"EMEL MANAV"],[1476,-100,0,"Fen Bilimleri Enstitüsü, Bilgi İşlem Daire Başkanlığı"],[1484,131,5,"Yapı Kredi Hacettepe Beytepe Kampüsü Şubesi"],[1494,-66,0,"Hacettepe Üniversitesi Yer Bilimleri Binası"],[-891,1209,5,"Hacı İbrahim Babaoğlu Camii"],[-422,-1440,1,"Mutlukent Eczanesi"],[1501,-92,0,"Bilgi İşlem Daire Başkanlığı"],[1344,679,0,"İnşaat Mühendisliği"],[1317,734,0,"Hacettepe Üniversitesi Makine Mühendisliği"],[1510,-32,0,"Jeoloji Mühendisliği Y1"],[1492,241,5,"Atatürk Anıtı"],[1444,455,0,"Hacettepe Üniversitesi Güzel Sanatlar Fakültesi"],[1512,114,0,"Kimya Bölümü"],[1515,-136,0,"Bilgisayar Mühendisliği ve Yapay Zeka Mühendisliği"],[1295,799,5,"TaleWorlds Entertainment"],[1527,-83,0,"Jeoloji Mühendisliği Y3"],[1418,581,0,"Yabancı Diller Yüksekokulu"],[1541,12,0,"Matematik Bölümü"],[1521,-251,0,"B9"],[-808,-1311,5,"Marin SPA Lokasyon Beysukent"],[1544,-50,0,"Jeoloji Mühendisliği Y4"],[1552,-75,0,"Jeoloji Mühendisliği"],[1528,-286,0,"İletişim Fakültesi"],[1537,-285,0,"B10"],[-1415,666,2,"01 Adanalı İsmail Usta Çayyolu"],[1516,392,0,"Hacettepe Üniversitesi Heykel Bölümü"],[1545,-255,0,"Tiyatro ve Konferans Salonu"],[1545,-267,0,"Amfi"],[1476,544,0,"İktisadi ve İdari Bilimler Fakültesi"],[1517,418,0,"Hacettepe Üniversitesi Güzel Sanatlar Enstitüsü"],[1577,127,0,"Kimya Mühendisliği"],[1554,-319,0,"B11"],[1579,-149,2,"Sinyor Cheff"],[-1443,659,4,"H2O Gym"],[1593,-49,0,"İnce Kesit Laboratuvarı"],[1588,-218,0,"B5"],[-1463,663,2,"Sagaris Ege ve Akdeniz Mutfağı"],[1570,-353,0,"B12"],[1588,252,0,"Mehmet Akif Ersoy ve K Salonları"],[1586,-276,0,"Edebiyat Fakültesi"],[1587,-302,0,"B4"],[1330,930,4,"Hacettepe Teknokent Beytepe Parkı"],[-530,1532,3,"ZERA Optik"],[1605,-251,0,"B2"],[1483,664,0,"Hacettepe Üniversitesi Sosyal Bilimler Meslek Yükek Okulu"],[1622,-202,0,"B6"],[-522,1547,1,"Beril Bulut Eczanesi"],[1604,-336,0,"B13"],[1621,-286,0,"B3"],[1639,-235,0,"B7"],[1496,716,0,"Beytepe Ortaokulu"],[-1559,-607,2,"Kahve Dünyası"],[-1562,-617,2,"Kahve Dünyası - ANKARA POİNT ÇAYYOLU AVM"],[1630,412,0,"Hacettepe Üniversitesi Gıda Mühendisliği Bölümü"],[1424,896,0,"BTK Piyasa Gözetim Laboratuvarı Müdürlüğü"],[1523,722,0,"Beytepe Anaokulu"],[1468,838,5,"OfficeTeam Kirtasiye&Kopyalama"],[1458,856,2,"Coffee Break"],[-544,1606,3,"Mercan Organik Gıda Beytepe"],[-283,-1681,5,"Beysukent Emlak"],[1543,741,4,"Beytepe Ortaokulu Halısahası"],[1609,624,0,"Beytepe İlköğretim Okulu"],[-275,-1704,3,"Genç Yıldırım Süpermarket"],[-571,1631,3,"Gümüş Satır Kasap&Steakhouse"],[-1614,626,3,"Beytepe Cheers Market Tekel"],[1511,851,5,"EHSiM Elektronik Harp Sistemleri Mühendislik Ticaret Anonim Şirketi"],[1517,844,2,"Starbucks"],[1498,903,5,"Hacettepe Teknokent Safir Blokları"],[1546,837,3,"Ofiss Kırtasiye Hacettepe Teknokent Şube"],[1520,889,3,"Şok"],[1481,952,5,"Türk Havacılık ve Uzay Sanayi"],[-236,-1753,3,"Karaf Tekel Market ( Çayyolu )"],[-212,-1763,2,"Kurabiyem Simit Kafe"],[1295,-1220,5,"Hacettepe Üniversitesi Kongre Salonu"],[1567,869,5,"Hacettepe Teknokent ArGe 1"],[1323,-1211,5,"Beytepe Kültür ve Kongre Merkezi"],[-1765,-365,3,"VEGAS OPTİK"],[-1767,-385,1,"Vitrin Eczanesi"],[1811,57,4,"Yeşil Vadi"],[1725,-567,5,"Geyik Bakım Alanı"],[-1797,-287,3,"File Market"],[-1034,-1497,0,"Beysukent Koleji"],[-191,-1822,2,"FUNDA MiNİ PATİSSERİE"],[-1804,-344,1,"Asel Eczanesi"],[1663,861,5,"Hacettepe Teknokent 4.Arge"],[-158,-1870,3,"Ünal Kuruyemiş"],[-150,-1876,3,"Zeki Kırtasiye Angora"],[-124,-1898,1,"Ankara Eczanesi"],[-1590,-1065,5,"So Çayyolu"],[1731,843,0,"Hacettepe Teknokent 5. Arge"],[-1493,1258,5,"Aziz Sancar Fen Lisesi Pansiyonu"],[-1658,-1037,2,"Peçenek Döner Çayyolu"],[-1518,-1233,0,"Final Okulları Çayyolu Kampüsü"],[1006,1684,2,"Gözlemeci"],[1961,135,0,"Ahşap Teknolojileri"],[1934,354,0,"Hacettepe Üniversitesi Çevre Eğitimi Kuş Araştırma ve Halkalama Merkezi"],[1958,220,0,"Endüstri Mühendisliği"],[1900,-526,4,"Beytepe Ormanı 2"],[1970,138,0,"Eski KOSGEP Binası"],[-1903,581,1,"Active Veteriner Kliniği"],[-1958,403,5,"DFS Bilgisayar"],[-1552,1291,0,"Aziz Sancar Fen Lisesi"],[1025,1739,5,"Uzman Tesisatcin"],[-2010,-295,2,"ANKARA DENİZ YILDIZI RESTORAN"],[1988,449,3,"Tepe Home Outlet"],[-2072,-336,4,"Güldünya Parkı"],[1347,-1609,2,"Beyaz Ev Restoran"],[-2000,709,2,"Etmanyak Burger Sosis"],[-246,-2113,4,"Kamer Genç Parkı"],[1263,1716,3,"A101"],[2134,78,5,"Cyberpark Tepe Binası"],[1306,1688,2,"Hemşin Lokantası Beytepe"],[1859,1058,1,"Özsan Eczanesi"],[1291,1706,1,"Beytepe Eczanesi"],[1406,1614,2,"Sözeri Fırın"],[1312,1701,3,"Migros"],[2154,71,5,"Bilişim A.Ş"],[2155,78,5,"Cerebrum Tech"],[1267,1754,5,"Sadık Kalemci Cami"],[-2171,90,5,"Hisar Sigorta Ltd."],[-244,-2165,1,"Kamer Genç Parkı"],[1881,-1136,4,"Beytepe Göleti"],[2207,64,5,"Datateam Bilgi Teknolojileri"],[-1444,-1668,0,"Kids Aloud Anaokulu"],[-2208,-214,3,"Morty Tekel & Market Çayyolu"],[-45,-2217,5,"AND HARİTA İMAR PLANLAMA"],[1605,1535,5,"Ankara Beytepe Tesisat"],[2191,-378,0,"İletişim ve Spektrum Yönetimi Araştırma Merkezi"],[-68,-2223,5,"Evren Yiğit Mimarlık"],[-1542,-1624,1,"Santra Eczanesi"],[2179,523,2,"Sözeri Pide & Kebap"],[-1316,-1816,1,"M.Ali Güler Parkı"],[2250,7,5,"Cyberplaza C Blok"],[2193,575,0,"Bilkent Anaokulu"],[2265,-106,5,"Bilkent Cyberpark"],[-2235,-418,4,"Ceren Parkı"],[-2201,-622,0,"Hacı Sadri Baday Koleji"],[2208,610,5,"Sivil Savunma ve Güvenlik Müdürlüğü"],[-2291,-116,3,"Nail Shop Türkiye"],[2294,52,5,"Cyberplaza B Blok"],[2209,628,5,"Rektörlük İdari Birimler"],[2301,42,5,"Netcad Ulusal Cad Ve Gis Çözümleri A.Ş"],[2217,654,5,"PTT Bilkent Şubesi"],[158,-2314,0,"Ayten-Şaban Diri İlköğretim Okulu"],[2182,822,4,"Kapalı Tenis Kortu"],[2306,-360,0,"Aysel Sabuncu Beyin Araştırmaları Merkezi"],[-2334,118,5,"Sentez CRO"],[2311,-376,0,"Ulusal Manyetik Rezonans Araştırma Merkezi"],[294,-2321,2,"Kepos Balık Evi"],[2251,658,0,"Uluslararası Öğrenciler ve Değişim Programları Ofisi"],[-833,2190,5,"Space Gayrimenkul - Ankara Şubesi"],[-1548,-1763,2,"Fevzi Hoca Balık-Köfte Çayyolu"],[-1206,-2021,4,"Ayfer Yargıç Parkı"],[-1589,-1746,4,"Kurtuluş Savaşı Parkı"],[1953,1339,1,"Misak-ı Milli İlkokulu Bahçesi"],[2370,-8,5,"Ekinoks Yazılım"],[2373,-87,3,"Bilmarket"],[2376,-33,5,"Cyberpark H Blok"],[-798,2239,2,"Beytepe Kebapçısı"],[2387,-10,2,"Central"],[1935,1397,0,"Ceviz Anaokulları Beytepe"],[-1586,-1784,4,"Kurtuluş Savaşı Parkı"],[-683,-2286,3,"Çayyolu Optik"],[-26,-2387,5,"Arter Teknik Cihazlar"],[2305,643,0,"Kapalı Yüzme Havuzu"],[-2197,-958,5,"Yenidoğan Fotoğraf Çekimi - Sweet Dreams Photography"],[2331,572,3,"Erkek Kuaförü"],[-745,-2279,3,"A101"],[2403,71,3,"Sözeri Büfe"],[2298,710,0,"Yurtlar Spor Salonu"],[-2022,-1303,3,"Dora Peyzaj"],[-1719,-1695,1,"Çayyolu 1 Nolu Aile Sağlığı Merkezi"],[-1120,-2142,0,"Ankara Türk Telekom Sosyal Bilimler Lisesi"],[-825,-2272,1,"Seferoğlu Eczanesi"],[-2403,322,4,"Prof. Dr. Türkan Saylan Parkı"],[-2421,149,2,"Brand Burger Çayyolu"],[387,-2392,1,"Aker Eczanesi"],[-1740,-1690,1,"Merve Baysal Eczanesi"],[-1728,-1711,1,"Çavdar Eczanesi"],[-1767,-1676,3,"LastikMarket"],[2428,238,5,"AB Mikro Nano - Aselsan Bilkent Mikro Nano Teknolojileri"],[-2437,190,5,"SERDAR KUVVET PHOTOGRAPHY"],[-2442,-132,2,"Balıkçı Halil Faros"],[-2023,-1373,3,"Samart Peyzaj & Fidancılık"],[-1290,-2076,1,"Erguvan Eczanesi"],[2430,293,0,"Nanoteknoloji Araştırma Merkezi (NANOTAM)"],[-2449,43,3,"Dogalecza"],[-1808,-1660,2,"Mupa Taş Fırın"],[-2461,-144,3,"İpek Hanım Çiftliği"],[-1424,-2018,3,"Derya Çiçek Evi"],[-2017,-1428,3,"Ege Grup Fidan"],[2383,664,3,"Kadın Kuaförü"],[-1051,2242,2,"Locus Coffee Roastery"],[-1613,-1882,2,"Ankara Gece Dönercisi"],[-1968,-1517,3,"Emba Peyzaj"],[-1072,2242,2,"Domino's Pizza Beytepe"],[446,-2447,3,"Macrocenter"],[-1296,-2127,3,"Çağdaş"],[-1642,-1876,2,"Guşgana kebap"],[-1737,-1791,2,"Dalyan Balıkçısı"],[2481,275,0,"SU Building"],[-2395,-722,3,"BİM"],[-1655,-1873,5,"Çayyolu Ümit Tesisat"],[-2417,-651,4,"Erguvan Parkı"],[-2404,-704,3,"Serdar Ayakkabıcılık"],[2391,-751,5,"Heartsapiens Medikal Teknoloji A.Ş"],[-2022,-1479,3,"Özbaşkent Peyzaj & Çiçekçilik"],[232,-2493,3,"Migros"],[2505,159,0,"B Building"],[-2370,-824,4,"Doktorlar Parkı"],[-1295,-2152,5,"Gala Gayrimenkul"],[2407,730,2,"Çatı"],[2515,169,0,"Hukuk Fakültesi & Bilgisayar Merkezi (B)"],[-2027,-1499,3,"DM Peyzaj"],[2520,217,0,"Fen Fakültesi (SB)"],[-1749,-1827,1,"Ümitköy Eczanesi"],[2521,263,0,"Bilkent Fizik Bölümü"],[2515,334,0,"SN Building"],[2474,556,4,"Yurtlar Çim Alanı"],[-2500,-448,5,"Vivian Kuaför"],[-2533,-193,2,"Tavacı Recep Usta Ümitköy Şubesi"],[-2034,-1530,3,"Karaoğlu Peyzaj"],[2536,281,0,"Fen Fakültesi (SA)"],[-2512,-447,5,"Halkbank Alacaatlı Şubesi"],[-2525,-388,5,"Albaraka Türk"],[-2533,-339,1,"Alpan Eczanesi"],[2538,336,0,"İleri Araştırmalar Laboratuvarı"],[2474,661,5,"Bilkent Üniversitesi PTT Kargomatı"],[2427,-822,5,"Open Zeka Bilgi Teknolojileri Tic.Ltd.Şti."],[2532,397,0,"Merkez Spor Salonu"],[-2544,-340,1,"Özel Ata Grup Tıp Merkezi"],[-1128,2302,2,"GUA Coffee Company Beytepe"],[-2537,-387,5,"Vakıfbank"],[2490,627,2,"76. Yurt Kantini"],[2551,298,0,"Bilkent Matematik Bölümü"],[2529,459,0,"Food Court"],[2525,480,2,"Kıraç"],[2569,151,5,"İhsan Doğramacı Heykeli"],[-1751,-1887,5,"İkizler Kuru Temizleme"],[-2573,-186,5,"City Park"],[2542,438,3,"Meteksan Kitapevi"],[-2052,-1562,3,"Babil SPP"],[-2042,-1580,3,"Koç Peyzaj"],[-2550,-419,3,"Konsept Çayyolu"],[-1758,-1894,5,"Güngör moda terzi"],[2497,680,2,"75. Yurt Kantini"],[-1884,-1773,5,"By Adem Çakır"],[-1853,-1809,1,"Çayyolu Eczanesi"],[-2570,-341,2,"Uludağ Et lokantası"],[-1914,-1747,5,"DHL eCommerce - Çayyolu Şubesi"],[-2588,-164,2,"Kraz Cafe"],[-1818,-1852,5,"Öztaş elektrik elektronik"],[-2037,-1612,3,"Çamlıkaya"],[-2485,766,3,"BİM"],[31,-2596,5,"İşlem GIS Kampüs"],[-2574,-386,1,"Mavi Güneş Eczanesi"],[1061,-2373,0,"Hacettepe Üniversitesi Ankara Devlet Konservatuarı"]]`),P_=JSON.parse('{"png":"data:image/png;base64,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","x":-2600,"y":-2600,"w":5200,"h":5200}'),dn={atlas_generated_at:T_,total:w_,groups:C_,curated:R_,dots:D_,base:P_},I_=[],L_=[],N_=[],ir={roads:I_,buildings:L_,green:N_},B_=[{name:"Angora Evleri",x:40,y:-195},{name:"Beysukent",x:-640,y:-430}],U_=["Eğitim","Sağlık","Yeme içme","Alışveriş","Spor · Park","Hizmet"],Il="http://www.w3.org/2000/svg",Mu=s=>s<950?`${s} m`:`${(s/1e3).toFixed(1).replace(".",",")} km`,Su=`${dn.total} donatı · Atlas ${dn.atlas_generated_at}`+(ir.roads.length?" · Plan © OpenStreetMap":" (OSM)");function xf(s){const e=document.createElement("div");e.className="region-map",e.hidden=!0,e.setAttribute("aria-hidden","true");const t=document.createElementNS(Il,"svg");t.setAttribute("class","rm-svg");const n=document.createElementNS(Il,"g");t.append(n);const i=document.createElement("div");i.className="rm-labels",e.append(t,i);const r=(v,M,y={})=>{const T=document.createElementNS(Il,v);M&&T.setAttribute("class",M);for(const[C,x]of Object.entries(y))T.setAttribute(C,x);return n.append(T),T},a=v=>v.map(([M,y])=>`${M},${y}`).join(" "),o=v=>{let M="";for(let y=0;y<v.length;y+=2)M+=`${v[y]},${v[y+1]} `;return M.trim()};if(ir.roads.length){for(const v of ir.green)r("polygon","rm-green",{points:o(v)});for(const v of ir.buildings)r("polygon","rm-bldg",{points:o(v)});for(const v of[3,2,1,0])for(const[M,,y]of ir.roads)M===v&&r("polyline",`rm-road rm-road-${M}`,{points:o(y)})}else r("image","rm-base",{href:dn.base.png,x:dn.base.x,y:dn.base.y,width:dn.base.w,height:dn.base.h,preserveAspectRatio:"none"});r("image","rm-roads",{href:xi.roads.png,x:xi.roads.x,y:xi.roads.y,width:xi.roads.w,height:xi.roads.h,preserveAspectRatio:"none"}),r("polygon","rm-plot",{points:a(xi.plot)});for(const v of xi.buildings)r("polygon","rm-building",{points:a(v)});for(const[v,M,y,T]of dn.dots)if(r("circle",`rm-dot rm-g${y}`,{cx:v,cy:M,r:9,fill:dn.groups[y]}),T){const C=r("text",`rm-dot-label rm-g${y}`,{x:v+14,y:M+10});C.textContent=T}for(const v of[500,1e3,2e3])r("circle","rm-ring",{cx:0,cy:0,r:v,"vector-effect":"non-scaling-stroke"});r("circle","rm-pulse",{cx:0,cy:0,r:26}),r("polygon","rm-villa",{points:a(xi.villa)});for(const v of dn.curated)v.d<=2e3&&r("circle",`rm-poi rm-g${v.g}`,{cx:v.x,cy:v.y,r:4,"vector-effect":"non-scaling-stroke"});const c=[],l=(v,M,y,T,C=!1)=>{const x=document.createElement("span");return x.className="rm-chip "+v,x.innerHTML=M,i.append(x),c.push({el:x,mx:y,my:T,clamp:C}),x};l("rm-chip-villa","<strong>Villa 21</strong>",4,-16);for(const v of[500,1e3,2e3])l("rm-chip-ring",v<1e3?"500 m":`${v/1e3} km`,0,-v);for(const v of B_)l("rm-chip-area",v.name,v.x,v.y);for(const v of dn.curated){const M=Math.atan2(v.y,v.x)*180/Math.PI,y=l("rm-chip-poi",`${v.name} <b>${Mu(v.d)}</b>`+(v.d>2e3?` <em style="transform:rotate(${M.toFixed(0)}deg)">→</em>`:""),v.x,v.y,v.d>2e3);y.dataset.distance=v.d,y.dataset.g=v.g}const h=document.createElement("span");h.className="rm-compass",h.innerHTML="<i>↑</i>K",i.append(h);const u=Object.fromEntries(dn.curated.map(v=>[v.kind,v])),d=(v,M)=>M?`<li><b>${Mu(M.d)}</b><span>${v}</span></li>`:"",f=document.createElement("aside");f.className="rm-info",f.setAttribute("aria-label","Angora Evleri hakkında"),f.innerHTML='<h3>Angora Evleri</h3><p class="rm-info-set">Beysukent · Çankaya, Ankara</p><p class="rm-info-body">Ankara’nın batı yakasında, Hacettepe Beytepe kampüsünün yeşiline komşu, alçak yoğunluklu bir villa yerleşkesi. Planlı sokak dokusu ve olgun bahçeleri gündelik hayatı yerleşke içinde tutar; Eskişehir Yolu ve Bilkent bağlantısı kenti dakikalar uzağında bırakır.</p><ul class="rm-info-facts">'+d("park",u.park)+d("okul",u.lise)+d("market",u.market)+d("eczane",u.eczane)+"</ul>";const g=document.createElement("div");g.className="rm-filters",g.setAttribute("role","group"),g.setAttribute("aria-label","Donatı filtreleri");const A=new Set;dn.groups.forEach((v,M)=>{const y=document.createElement("button");y.type="button",y.setAttribute("aria-pressed","true"),y.innerHTML=`<i style="background:${v}"></i>${U_[M]??"Diğer"}`,y.onclick=()=>{const T=A.has(M);T?A.delete(M):A.add(M),y.setAttribute("aria-pressed",String(T)),e.classList.toggle(`rm-off-${M}`,!T),p()},g.append(y)}),e.append(f,g);let m=1e3;const p=()=>{const v=e.clientWidth||innerWidth,M=e.clientHeight||innerHeight,y=Math.min(v,M)<560?46:72,T=(Math.min(v,M)/2-y)/m,C=v/2,x=M/2;n.style.transform=`translate(${C}px, ${x}px) scale(${T})`;let _=0;const R=[{x:C-60,y:x-32,w:120,h:58},v<560?{x:8,y:M-276,w:v-16,h:276}:{x:C-170,y:M-190,w:340,h:190}],P=e.getBoundingClientRect();for(const F of[f,g,document.querySelector(".topbar"),document.querySelector(".view-description")]){const U=F?.getBoundingClientRect();U?.width&&R.push({x:U.left-P.left-6,y:U.top-P.top-6,w:U.width+12,h:U.height+12})}const B=F=>R.some(U=>F.x<U.x+U.w&&F.x+F.w>U.x&&F.y<U.y+U.h&&F.y+F.h>U.y),O=[...c].sort((F,U)=>(Number(F.el.dataset.distance)||0)-(Number(U.el.dataset.distance)||0));for(const F of O){let{mx:U,my:Y}=F;if(F.clamp){const te=Math.hypot(U,Y)||1,ce=m*(.94-_++%3*.085);te>ce&&(U=U/te*ce,Y=Y/te*ce)}let V=C+U*T,Z=x+Y*T;if(F.el.classList.contains("rm-chip-poi")){const te=A.has(Number(F.el.dataset.g))||!F.clamp&&Number(F.el.dataset.distance)>m*1.12;F.el.style.opacity=te?0:1;const ce=(F.el.offsetWidth||168)+10,ge=(F.el.offsetHeight||26)+6;if(V=Math.max(ce/2,Math.min(v-ce/2,V)),Z=Math.max(96,Math.min(M-110,Z)),!te){const ze=Z,Ke=q=>{let le=ze,Te={x:V-ce/2,y:le-ge/2,w:ce,h:ge};for(let fe=0;fe<60&&B(Te);fe++)le+=q,Te.y=le-ge/2;return{y:le,ok:!B({x:V-ce/2,y:le-ge/2,w:ce,h:ge})&&le>90&&le<M-104}},Xe=Ke(Z>=x?15:-15),j=Xe.ok?Xe:Ke(Z>=x?-15:15);j.ok?(Z=Math.max(96,Math.min(M-110,j.y)),R.push({x:V-ce/2,y:Z-ge/2,w:ce,h:ge})):F.el.style.opacity=0}}F.el.style.transform=`translate(-50%, -50%) translate(${V}px, ${Z}px)`}e.dataset.radius=m};let E=0;const w=()=>{cancelAnimationFrame(E),E=requestAnimationFrame(p)};return s.append(e),{element:e,get radius(){return m},setRadius(v){m=v,p()},show(){e.hidden&&(e.hidden=!1,e.setAttribute("aria-hidden","false"),p(),addEventListener("resize",w),requestAnimationFrame(()=>requestAnimationFrame(()=>e.classList.add("rm-active"))))},hide(){if(e.hidden)return;e.classList.remove("rm-active"),e.setAttribute("aria-hidden","true"),removeEventListener("resize",w);const v=()=>{e.hidden=!0,e.removeEventListener("transitionend",v)};e.addEventListener("transitionend",v),setTimeout(v,900)}}}function _f(s,e,t,n){return Math.max(1,Math.min(t,2,Math.sqrt((n?15e5:5e6)/Math.max(1,s*e))))}function O_(s,e,t){const n=s.position.distanceTo(e),i=t?.getSize(new I).length()??450,r=Math.max(.2,n*.04),a=Math.max(r+100,n+i+40);return(Math.abs(s.near-r)>.001||Math.abs(s.far-a)>.01)&&(s.near=r,s.far=a,s.updateProjectionMatrix()),{near:r,far:a}}const Eu=48,F_=/grass|soil|asphalt|terrain|curb/i;function k_(s){s.updateMatrixWorld(!0);const e=new Map,t=new Set,n=[],i=new Be;let r=!0;const a=new I;if(s.traverse(h=>{if(!h.isMesh)return;const u=h.geometry;if(Array.isArray(h.material)||h.isSkinnedMesh||Object.keys(u.attributes).some(d=>!["position","normal","uv"].includes(d))){r=!1;return}u.boundingSphere||u.computeBoundingSphere();for(let d=0;d<(h.isInstancedMesh?h.count:1);d++){h.isInstancedMesh?(h.getMatrixAt(d,i),i.premultiply(h.matrixWorld)):i.copy(h.matrixWorld),a.copy(u.boundingSphere.center).applyMatrix4(i);const f=F_.test(h.material.name)?"site":`${Math.floor(a.x/Eu)},${Math.floor(a.z/Eu)}`,g=h.material.uuid+"|"+f,A=e.get(g)??{material:h.material,entries:[],vertices:0,indices:0};e.set(g,A),A.entries.push({g:u,matrix:i.clone()}),A.vertices+=u.attributes.position.count,A.indices+=u.index?.count??u.attributes.position.count}t.add(u),h.isInstancedMesh&&n.push(h)}),!r)return s;const o=new $t;o.name=s.name,o.userData={...s.userData};const c=new I,l=new Ve;for(const[,h]of e){const u=h.material,d=new Float32Array(h.vertices*3),f=new Float32Array(h.vertices*3),g=new Float32Array(h.vertices*2),A=new Uint32Array(h.indices);let m=0,p=0;for(const{g:v,matrix:M}of h.entries){const y=v.attributes.position,T=v.attributes.normal,C=v.attributes.uv;l.getNormalMatrix(M);for(let R=0;R<y.count;R++)c.fromBufferAttribute(y,R).applyMatrix4(M).toArray(d,(m+R)*3),T&&c.fromBufferAttribute(T,R).applyNormalMatrix(l).toArray(f,(m+R)*3),C&&(g[(m+R)*2]=C.getX(R),g[(m+R)*2+1]=C.getY(R));const x=v.index?.count??y.count,_=M.determinant()<0;for(let R=0;R<x;R+=3)for(let P=0;P<3;P++){const B=R+(_?P===0?0:3-P:P);A[p+R+P]=m+(v.index?v.index.getX(B):B)}m+=y.count,p+=x}const E=new kt;E.setAttribute("position",new mt(d,3)),E.setAttribute("normal",new mt(f,3)),E.setAttribute("uv",new mt(g,2)),E.setIndex(new mt(A,1)),E.computeBoundingBox(),E.computeBoundingSphere();const w=new Tt(E,u);w.name="Context | "+u.name+(u.userData.contextBuilding?" · massing":""),o.add(w)}for(const h of t)h.dispose();for(const h of n)h.dispose();return o}const z_="#f4f3f0",H_=.86,V_=900,G_="#9ea3a8",bu=/^B\d+(\s|$)/,W_=/^R35 \| Garage vehicle(\s|$)/,Tr=(s="")=>s.replace(/_/g," ").replace(/\s+/g," ").trim(),X_=s=>s?.isTexture?s.uuid:s===void 0?"-":String(s),Q_=(s="")=>{const e=s.replace(/\.\d{3}$/,"");return/^ceiling$/i.test(e)?"ceiling":/^interior$/i.test(e)?"interior":/clay tile|^roof$|green tiles/i.test(e)?"roof":""};function Y_(s){return JSON.stringify([s.type,Q_(s.name),s.color?.getHex(),s.roughness,s.metalness,s.emissive?.getHex(),s.emissiveIntensity,s.opacity,s.transparent,s.alphaTest,s.side,s.flatShading,s.vertexColors,s.transmission,s.clearcoat,s.clearcoatRoughness,s.ior,s.sheen,s.specularIntensity,s.normalScale?.toArray(),s.aoMapIntensity,s.envMapIntensity,s.displacementScale,["map","normalMap","roughnessMap","metalnessMap","aoMap","emissiveMap","alphaMap","bumpMap"].map(e=>X_(s[e]))])}function j_(s){const e=new Map,t=new WeakMap;let n=0;return s.traverse(i=>{if(!i.isMesh)return;const a=(Array.isArray(i.material)?i.material:[i.material]).map(o=>{if(!o)return o;let c=t.get(o);c===void 0&&t.set(o,c=Y_(o));const l=e.get(c);return l?(l!==o&&n++,l):(e.set(c,o),o)});i.material=Array.isArray(i.material)?a:a[0]}),n}function q_(s){let e=null,t=0;return s.traverse(n=>{!n.isMesh||!W_.test(Tr(n.name))||(e??=new Nr({name:"R35 | Garage vehicle abstract base",color:new Ce(G_),roughness:.45,metalness:.12}),n.material=e,t++)}),t}const K_=/^R32 \| Continuous local soil volume\b/,Z_=s=>{for(let e=s;e;e=e.parent)if(K_.test(Tr(e.name)))return!0;return!1};function J_(s){const e=new Map;return s.traverse(t=>{if(!t.isMesh||!Z_(t))return;const n=i=>{if(!i)return i;let r=e.get(i);return r||(r=i.clone(),r.name=i.name+" · plot section",r.userData={...i.userData,plotSoil:!0},e.set(i,r)),r};t.material=Array.isArray(t.material)?t.material.map(n):n(t.material)}),s}function $_(s){const e=new Map;s.traverse(n=>{if(!n.isMesh)return;const i=bu.test(Tr(n.name));for(const r of Array.isArray(n.material)?n.material:[n.material]){if(!r)continue;const a=e.get(r)??{building:!1,site:!1};a[i?"building":"site"]=!0,e.set(r,a)}});const t=new Map;for(const[n,i]of e){if(!i.building)continue;if(!i.site){n.userData.contextBuilding=!0;continue}const r=n.clone();r.userData={...n.userData,contextBuilding:!0},t.set(n,r)}return t.size&&s.traverse(n=>{if(!n.isMesh||!bu.test(Tr(n.name)))return;const i=r=>t.get(r)??r;n.material=Array.isArray(n.material)?n.material.map(i):i(n.material)}),s}function ey(s){const e={value:0},t={value:new Ce(z_)},n=new Set;s.traverse(c=>{if(c.isMesh)for(const l of Array.isArray(c.material)?c.material:[c.material]){if(!l?.userData?.contextBuilding||n.has(l))continue;n.add(l);const h=l.onBeforeCompile,u=l.customProgramCacheKey();l.onBeforeCompile=(d,f)=>{h.call(l,d,f),d.uniforms.massingBlend=e,d.uniforms.massingColour=t,d.fragmentShader=`uniform float massingBlend;
uniform vec3 massingColour;
`+d.fragmentShader,d.fragmentShader=d.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
diffuseColor.rgb = mix(diffuseColor.rgb, massingColour, massingBlend);`),d.fragmentShader=d.fragmentShader.replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, ${H_.toFixed(2)}, massingBlend);`),d.fragmentShader=d.fragmentShader.replace("#include <metalnessmap_fragment>",`#include <metalnessmap_fragment>
metalnessFactor = mix(metalnessFactor, 0.0, massingBlend);`),l.normalMap&&(d.fragmentShader=d.fragmentShader.replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
normal = normalize(mix(normal, nonPerturbedNormal, massingBlend));`))},l.customProgramCacheKey=()=>u+"|massing-r39",l.needsUpdate=!0}});let i=0,r=0,a=0;const o=c=>c*c*(3-2*c);return{surfaces:n.size,get value(){return e.value},set(c,l=!1){const h=c==="building"||/^f\d$/.test(c)?1:0;if(h===r)return;r=h;const u=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;if(l||u){e.value=i=r;return}i=e.value,a=performance.now()},update(c){if(e.value===r)return!1;const l=Math.min(1,(c-a)/V_);return e.value=Mt.lerp(i,r,o(l)),l>=1&&(e.value=r),!0}}}const yf="R39_lift_cabin_travel",ti=[0,1,2],ty=/^Lift_(door_stile|door_rail|door_pull|floral_textured_glass|floral_lead_stem|glass_rose_lead|stained-glass_leaf)\d*$/,ny=-1.53,iy=-1.33,Tu=Math.PI/2,wu=Math.PI/2,sy=1,ry=["Bodrum katına gönder","Giriş katına gönder","1. kata gönder"],ay=s=>(s%46+46)%46;function oy(s){const e=s.tracks.find(n=>n.name===yf+".position");if(!e)throw Error("Lift clip has no cabin position track");const t=new Map;for(let n=0;n+1<e.times.length;n++){const i=e.values[n*3+1],r=e.values[n*3+4];if(i!==r)continue;const a=fr.findIndex(o=>Math.abs(o-i)<.001);if(a<0)throw Error(`Lift stop at ${i} m matches no floor datum`);t.has(a)||t.set(a,(e.times[n]+e.times[n+1])/2)}if(t.size<2)throw Error("Lift clip has fewer than two stops");return t}function ly(s,e,t){const n=t===(e+1)%3?1:-1,i=s.get(e),r=s.get(t);return{a:i,b:r,dir:n,dur:((n>0?r-i:i-r)+46)%46}}function cy({groups:s,clips:e,clipPlane:t,fullHeight:n,shadowsDirty:i,onSettled:r}){const a=e.find(y=>y.tracks?.some(T=>T.name.startsWith(yf+"."))),o=s.get("villa")??s.get("level-0");if(!a||!o)return null;const c=oy(a),l=new Zd(o),h=l.clipAction(a);h.play(),h.paused=!0;const u=y=>{h.time=ay(y),l.update(0)},d=new Map(ti.map(y=>[y,[]])),f=new Ht;o.updateMatrixWorld(!0),o.traverse(y=>{if(!ty.test(y.name)&&!y.userData?.lift_leaf_closed_pose)return;const T=f.setFromObject(y).min.y;let C=ti[0];for(const x of ti)Math.abs(T-fr[x])<Math.abs(T-fr[C])&&(C=x);d.get(C).push(y)});const g=new Map;for(const y of ti){const T=d.get(y);if(!T.length)continue;const C=new $t;C.name="Lift landing door pivot | F"+y,C.userData.closedPose=T.some(x=>x.userData?.lift_leaf_closed_pose),C.position.set(ny,fr[y],iy),o.add(C);for(const x of T)C.attach(x);g.set(y,C)}const A=(y,T)=>{const C=g.get(y);C&&(C.rotation.y=C.userData.closedPose?wu*T:Tu*(1-T))},m=y=>{const T=g.get(y);return T?T.userData.closedPose?T.rotation.y/wu:1-T.rotation.y/Tu:0};let p=0,E=null,w=!1,v=null;u(c.get(0));for(const y of ti)A(y,0);const M=y=>Math.min(y??0,ti.at(-1));return{get travelling(){return!!E},get floor(){return p},get walkFloor(){return v},park(y){const T=y==="f3"?2:/^f[0-2]$/.test(y)?Number(y[1]):null;if(!(T===null||T===p&&!E)){E=null,p=T,u(c.get(T));for(const C of ti)A(C,0);i()}},canRun(){return w&&t.constant>=n-.001&&c.has(this.target())},target(){const y=M(v??p);return p===y?(p+1)%3:y},run(y){if(!this.canRun()||E)return!1;const T=this.target();return T===p?!1:(E={from:p,to:T,phase:"close",t0:y,...ly(c,p,T)},i(),!0)},update(y){if(!E)return!1;E.t0||(E.t0=y);const T=(y-E.t0)/1e3/(E.phase==="move"?E.dur:sy);if(E.phase==="close")A(E.from,Math.max(0,1-T)),T>=1&&(E.phase="move",E.t0=y);else if(E.phase==="move")u(E.a+E.dir*Math.min(1,T)*E.dur),T>=1&&(E.phase="open",E.t0=y,p=E.to);else if(A(E.to,Math.min(1,T)),T>=1)return E=null,i(),r?.(),!1;return!0},cancel(){if(!E)return;const y=E.phase==="open"?E.to:E.from;E=null,p=y,u(c.get(y));for(const T of ti)A(T,0);i()},setWalkActive(y){w=y},setWalkFloor(y){v=y},snapshot(){return{floor:p,travelling:!!E,target:this.target(),clip_time:h.time,doors:ti.map(y=>Number(m(y).toFixed(3)))}}}}function hy(s,{panelOpen:e,closePanel:t,walkActive:n,immersive:i,exitWalk:r}){return s.key!=="Escape"&&s.code!=="Escape"?null:e?(s.preventDefault(),t(),"panel"):n&&!i?(s.preventDefault(),r(),"walk"):null}function uy({button:s,root:e=document,storage:t,Context:n=globalThis.AudioContext??globalThis.webkitAudioContext}={}){let i=!1,r=null,a=-1/0,o=0;if(t===void 0)try{t=globalThis.localStorage}catch{}try{i=t?.getItem("angora.interface-sound")==="on"}catch{}const c=()=>{s.setAttribute("aria-pressed",String(i)),s.textContent=i?"Arayüz sesi açık":"Arayüz sesi kapalı"},l=()=>{try{r?.suspend?.()?.catch(()=>{})}catch{}};async function h(){if(!i||!n||e.hidden)return;const u=o;try{if(r??=new n,r.state==="suspended"&&await r.resume(),!i||u!==o||e.hidden||r.state!=="running")return;const d=r.currentTime;if(d-a<.08)return;a=d;const f=r.createOscillator(),g=r.createGain();f.type="sine",f.frequency.setValueAtTime(620,d),f.frequency.exponentialRampToValueAtTime(420,d+.055),g.gain.setValueAtTime(1e-4,d),g.gain.exponentialRampToValueAtTime(.025,d+.007),g.gain.exponentialRampToValueAtTime(1e-4,d+.07),f.connect(g),g.connect(r.destination),f.start(d),f.stop(d+.08),f.onended=()=>{f.disconnect(),g.disconnect()}}catch{}}return s.disabled=!n,c(),s.addEventListener("click",()=>{i=!i,o++,c();try{t?.setItem("angora.interface-sound",i?"on":"off")}catch{}i?h():l()}),e.addEventListener("click",u=>{const d=u.target.closest?.("button");d&&d!==s&&!d.disabled&&h()}),e.addEventListener("visibilitychange",()=>{e.hidden&&(o++,l())}),{play:h,get enabled(){return i}}}function Cu(s,e){return s[Math.max(0,Math.ceil(s.length*e)-1)]??null}function dy(s){const e=s.map(n=>n.interval_ms).filter(n=>Number.isFinite(n)&&n>0).sort((n,i)=>n-i),t=e.reduce((n,i)=>n+i,0);return{frames:e.length,elapsed_ms:t,fps:t?e.length*1e3/t:null,frame_ms_p50:Cu(e,.5),frame_ms_p95:Cu(e,.95),frame_ms_max:e.at(-1)??null,frames_over_33_4_ms:e.filter(n=>n>33.4).length,draw_calls_max:Math.max(0,...s.map(n=>n.draw_calls??0)),triangles_max:Math.max(0,...s.map(n=>n.triangles??0)),drawing_buffers:[...new Set(s.map(n=>n.drawing_buffer).filter(Boolean))],views:[...new Set(s.map(n=>n.view).filter(Boolean))]}}class fy{constructor(e=15e3){this.duration=e,this.active=!1,this.result=null}start(e,t){this.startTime=e,this.lastTime=null,this.metadata=t,this.samples=[],this.active=!0,this.result=null}sample(e,t){return this.active?(this.lastTime!==null&&e>this.lastTime&&this.samples.push({...t,offset_ms:e-this.startTime,interval_ms:e-this.lastTime}),this.lastTime=e,e>=this.startTime+this.duration?(this.finish("recorded"),!0):!1):!1}finish(e="interrupted"){return this.active?(this.active=!1,this.result={schema_version:1,status:e,visual_acceptance:"not_reviewed",physical_device_verified:!1,measurement:"requestAnimationFrame intervals during continuous full-scene rendering; not GPU timer queries",metadata:this.metadata,summary:dy(this.samples),samples:this.samples},this.result):this.result}}function Ru(s,e){const t=URL.createObjectURL(s),n=document.createElement("a");n.href=t,n.download=e,document.body.append(n),n.click(),n.remove(),setTimeout(()=>URL.revokeObjectURL(t),6e4)}function py({getState:s,invalidate:e,closePanel:t,capture:n}){const i=A=>document.querySelector(A),r=new fy,a=i("#qa-start"),o=i("#qa-save"),c=i("#qa-screenshot"),l=i("#qa-result"),h=i("#qa-status");let u=-1,d=null;function f(){return{...s(),device_note:i("#qa-device").value.trim(),captured_at:new Date().toISOString(),user_agent:navigator.userAgent,device_pixel_ratio:devicePixelRatio,screen:{width:screen.width,height:screen.height,orientation:screen.orientation?.type??null}}}function g(){r.result.end_state=f(),a.disabled=!1,o.disabled=!r.result&&!d,h.hidden=!0;const A=r.result,m=A.summary;l.textContent=A.status==="recorded"?`${m.fps?.toFixed(1)??"—"} FPS · p95 ${m.frame_ms_p95?.toFixed(1)??"—"} ms · ${m.draw_calls_max} çizim (tüm geçişler). Görsel kabul yapılmadı.`:"Ölçüm kesildi; arka plana geçiş veya 3D bağlam kaybı. Tamamlanmış test sayılmaz.",e()}return a.onclick=()=>{r.start(performance.now(),f()),u=-1,a.disabled=!0,o.disabled=!0,l.textContent="Ölçüm sürüyor. Sahneyi döndür veya oda içinde yürü.",t(),h.hidden=!1,h.textContent="15 sn ölçüm · sahneyi hareket ettir",e()},o.onclick=()=>{const A=r.result??{schema_version:1,status:"image_only",visual_acceptance:"not_reviewed",physical_device_verified:!1};(r.result||d)&&Ru(new Blob([JSON.stringify({...A,scene_capture:d},null,2)],{type:"application/json"}),"angora-device-evidence.json")},c.onclick=()=>{t(),c.disabled=!0,n((A,m,p)=>{if(c.disabled=!1,m||!A){l.textContent="Görüntü alınamadı; cihazın ekran görüntüsü işlevini kullan.";return}d={filename:"angora-scene.png",state:p},o.disabled=!1,Ru(A,"angora-scene.png"),l.textContent="Sahne indirildi. Aynı karenin ayarları Raporu indir ile alınabilir. Safari arayüzü için ayrıca cihaz ekran görüntüsü al."})},document.addEventListener("visibilitychange",()=>{document.hidden&&r.active&&(r.finish(),g())}),{snapshot:f,get active(){return r.active},sample(A,m){if(!r.active)return;const p=r.sample(A,m),E=Math.max(0,Math.ceil((r.startTime+r.duration-A)/1e3));E!==u&&(u=E,h.textContent=`${E} sn ölçüm · sahneyi hareket ettir`),p&&g()},interrupt(){r.active&&(r.finish(),g())}}}const Mf=["region","neighborhood","building","f0","f1","f2","f3"],Sf=["172","80","355"],Ef=["soft","sun"],va={view:"neighborhood",hour:12.5,season:"172",style:"soft"},Vc=s=>Math.round(s*12)/12,my=s=>String(Number(Vc(s).toFixed(2)));function gy(s){const e=new URLSearchParams(s),t={};Mf.includes(e.get("view"))&&(t.view=e.get("view"));const n=Number(e.get("hour"));return e.has("hour")&&Number.isFinite(n)&&n>=6&&n<=21&&(t.hour=Vc(n)),Sf.includes(e.get("season"))&&(t.season=e.get("season")),Ef.includes(e.get("light"))&&(t.style=e.get("light")),t}function Ay(s){const e=new URLSearchParams;Mf.includes(s.view)&&s.view!==va.view&&e.set("view",s.view),Number.isFinite(s.hour)&&Vc(s.hour)!==va.hour&&e.set("hour",my(s.hour)),Sf.includes(s.season)&&s.season!==va.season&&e.set("season",s.season),Ef.includes(s.style)&&s.style!==va.style&&e.set("light",s.style);const t=e.toString();return t?`?${t}`:""}const vy=/spruce|needle|foliage|hedge|leaves|leaf|shrub|tree|branch|trunk|planting/i,J=s=>document.querySelector(s),Jt=J("#viewport"),Kl=J("#load-status"),Gc=new URL("./",document.baseURI),ni=new URL("build/web/full/",Gc),xy=new URL("viewer/public/draco/",Gc),_y=new URL("assets/lighting/kloofendal_48d_partly_cloudy_puresky_1k.hdr",Gc),Wc={region:"Bölge",neighborhood:"Yakın çevre",building:"Villa 21",f0:"Bodrum",f1:"Giriş katı",f2:"1. kat",f3:"Çatı katı"},Wt=new Map,wr=new __,Zl=(()=>{const s=new URLSearchParams(location.search).get("model");return s==="lite"?!0:s==="full"?!1:matchMedia("(pointer: coarse)").matches&&Math.min(screen.width,screen.height)<=820||navigator.deviceMemory!==void 0&&navigator.deviceMemory<=4})();let zi=null;const Ll=[],Xc=[],rn=new xn(new I(0,-1,0),30),ai=new xn(new I(0,-1,0),30);let yt=null,Rs,bf,yi=!1,Mi,sr=!0,rr=null,sn,pt,Ne,Ut,pr,bs,Hi,Ea,In,ct,Tf,tt="neighborhood",Si=!1,Nl=!1,ko=!0,mr=!0,gr=!1,Jl,Se,xa=40,ba=!1,fn=30,vn=null,Ar,wf=null,Vi=null,zo=!1,Cr=null,Xt=null;function Oi(s,e=!1){Kl.hidden=!1,J("#load-message").textContent=s,J("#retry").hidden=!e,Kl.classList.toggle("error",e)}function Bl(s){const e=J("#load-bar"),t=J("#load-percent");if(s===null){e.hidden=!0,t.textContent="";return}const n=Math.max(0,Math.min(100,Math.round(s*100)));e.hidden=!1,e.firstElementChild.style.width=`${n}%`,t.textContent=`%${n}`}let Du=null;function $l(){clearTimeout(Du),Du=setTimeout(()=>{const s=Ay({view:tt,hour:Number(J("#daylight-hour").value),season:J("#daylight-season").value,style:J("#lighting-style").value});history.replaceState(null,"",(s||location.pathname)+location.hash)},400)}function yy(s){const e=new Set,t=new Set,n=new Set;s?.traverse(i=>{if(i.isMesh){e.add(i.geometry);for(const r of Array.isArray(i.material)?i.material:[i.material]){t.add(r);for(const a of Object.values(r))a?.isTexture&&n.add(a)}}}),e.forEach(i=>i.dispose()),t.forEach(i=>i.dispose()),n.forEach(i=>{i.source?.data?.close?.(),i.dispose()})}function Cf(s){ko=s;for(const e of Wt.values())e.traverse(t=>{t.isMesh&&t.userData.category==="furniture"&&(t.visible=s)});bs?.setFurnitureVisible(s),J("#toggle-furniture").setAttribute("aria-pressed",String(s)),J("#toggle-furniture").textContent="Mobilya",Ne&&(Ne.shadowMap.needsUpdate=!0),Se&&(Se.furniture=s,Se.active&&s&&!Se.xrActive&&!Se.surface.sample(Se.camera.position.x,Se.camera.position.z,Se.camera.position.y-Se.surface.data.eye_height_m)&&Xi(Se.room)),bt()}function bt(){ba||!Ne||zo||Ne.xr.isPresenting||(ba=!0,requestAnimationFrame(s=>{Ne.xr.isPresenting?ba=!1:Rf(s)}))}function Rf(s){if(ba=!1,zo)return;if(vn){const o=Math.min(1,(s-vn.start)/vn.span);rn.constant=Mt.lerp(vn.from,vn.to,Af(o)),o>=1&&(vn=null,Ne.shadowMap.needsUpdate=!0)}const e=Rs?.update(s);if(yt){const o=yi&&!Se?.active?1:0,c=Math.min(.1,(s-(yt.userData.time??s))/1e3);yt.userData.time=s;const l=Mt.damp(yt.userData.level,o,6,c);if(Math.abs(l-yt.userData.level)>5e-4){yt.userData.level=l;for(const h of yt.userData.overlays)h.opacity=l*h.userData.washBase;bt()}yt.visible=yt.userData.level>.01}bs?.update(rn.constant,rn.constant<fn-.001),rr?.update(ai.constant,ai.constant<fn-.001&&Wt.has("context"));const t=Se?.active?Se.update(s,Ne.xr.getSession()):e?!1:Ut.update(),n=Se?.active?Se.camera:pt;if(Se?.active||O_(pt,Ut.target,In),Se?.active){const o=Se.surface.sample(Se.camera.position.x,Se.camera.position.z,Se.camera.position.y-Se.surface.data.eye_height_m,Se.furniture,.3);o&&Se.floor!==o.floor?(Se.floor=o.floor,tt="f"+o.floor,Xt?.setWalkFloor(o.floor),es()):o&&(Se.floor=o.floor,tt="f"+o.floor),ct.interior(Se.floor,Se.camera.position.toArray(),s)}const i=ct.update(s),r=Cr?.update(s),a=Xt?.update(s);if(Jl?.update(tt,mr,gr,!!(vn||Rs?.active),Se?.active,n,Se?.room),bf?.update(n,Se?.active&&!Se.xrActive&&!Se.route),Tf?.update(tt,n,Ut.target,!!(vn||Rs?.active),Se?.active),Ne.info.reset(),ct.render(n),Vi){const o=Vi,c=Ar.snapshot();Vi=null;try{Ne.domElement.toBlob(l=>o(l,null,c),"image/png")}catch(l){o(null,l)}}Ar?.sample(s,{draw_calls:Ne.info.render.calls,triangles:Ne.info.render.triangles,drawing_buffer:`${Ne.domElement.width}×${Ne.domElement.height}`,view:Se?.active?`${tt}:walk`:tt}),(t||vn||e||i||r||a||Ar?.active)&&bt()}function Ds(){if(!Ne)return;const s=Jt.clientWidth,e=Math.max(1,Jt.clientHeight),t=s/e,n=_f(s,e,devicePixelRatio,matchMedia("(pointer: coarse)").matches);Ne.getPixelRatio()!==n&&(Ne.setPixelRatio(n),ct?.pixelRatio(n)),pt.aspect=t,pt.updateProjectionMatrix(),Ne.setSize(s,e),ct?.resize(s,e),bt(),Se?.resize(s,e)}function Rr(s=!1,e=!1){if(!Hi)return;const t=tt.startsWith("f"),n=Jt.clientWidth/Math.max(1,Jt.clientHeight);let i=Hi.clone();tt==="f0"&&i.union(Ea);const r=i.getCenter(new I);r.y=t?[0,3.0996,6.3714,9.4705][Number(tt[1])]:2;let a=i.getSize(new I);if(tt==="building")if((matchMedia("(pointer: coarse)").matches||n<.9)&&Ea){const l=Hi.clone().union(Ea);a.set(2*Math.max(r.x-l.min.x,l.max.x-r.x),a.y,2*Math.max(r.z-l.min.z,l.max.z-r.z))}else a.multiplyScalar(1.18);tt==="neighborhood"&&(a.set(66,21,70),r.set(0,3,-5)),tt==="region"&&In&&(a=In.getSize(new I),r.copy(In.getCenter(new I)));const o=yi?.02:tt==="region"?.58:t?.56:.78;xa=Math.max(a.z*Math.cos(o)+a.y*Math.sin(o),a.x/n)*(t?1.17:1.14),tt==="region"&&In&&(xa=Qx(In,n,o).span),e&&(r.copy(Ut.target),t&&(r.y=[0,3.0996,6.3714,9.4705][Number(tt[1])]),xa=pt.position.distanceTo(Ut.target)*2*Math.tan(Mt.degToRad(pt.fov/2))),Rs.go({target:r,polar:o,span:xa,zoom:e?pt.zoom:1,fov:yi?4:35,azimuth:tt==="region"||yi?0:s?.804:void 0},s===!0),Ds()}function _i(s,e){Se&&(Se.inputSuspended=e,Se.keys.clear(),Se.lastTime=null);const t=document.querySelector(".panel:not([hidden])");for(const n of["options-panel","info-panel"]){const i=n===s&&e;J("#"+n).hidden=!i,J("#"+(n==="options-panel"?"open-options":"open-info")).setAttribute("aria-expanded",i)}e?J("#"+s).querySelector("[data-close-panel]")?.focus():t&&J("#"+(t.id==="options-panel"?"open-options":"open-info")).focus(),bt()}function Df(){const s=J("#cloud-transition");s.classList.remove("travel"),s.offsetWidth,s.classList.add("travel")}function es(){const s=J("#lift-call"),e=J("#lift-call-target");if(!s)return;if(Xt?.travelling){s.disabled=!0,e.textContent="hareket ediyor…",s.setAttribute("aria-label","Asansör hareket ediyor");return}const t=!!Xt&&Si&&!zo&&Xt.canRun();if(s.disabled=!t,!t){e.textContent="bu katta",s.setAttribute("aria-label","Asansör bu katta");return}const n=Xt.target();e.textContent=n===Xt.walkFloor?"bu kata çağır":ry[n],s.setAttribute("aria-label","Asansörü "+e.textContent)}function Pf(s){tt="f"+s.floor_index,J("#walk-room").value=s.room_id,Xt?.setWalkFloor(s.floor_index),es(),J("#view-title").textContent=s.name,J("#section-label").textContent=Wc[tt]+" · 360° oda turu",J("#walk-room-area").textContent=zc(Mi.rooms.find(e=>e.id===s.room_id),Mi),Hc(J("#property-info"),Mi,tt)}function Qc(s){if(wr.cancel(),!Se?.active)return Xi(s);if(_i("",!1),matchMedia("(prefers-reduced-motion: reduce)").matches){Xi(s);return}Se.travel(s,Pf)||(Df(),wr.run(()=>Xi(s),480))}function My(){sn=new Po,sn.background=new Ce("#e9eeed"),pt=new zt(16,1,1,2e3),pt.position.set(60,100,60);const s=matchMedia("(pointer: coarse)").matches;Ne=new af({antialias:s,alpha:!1,powerPreference:"high-performance"}),Ne.setPixelRatio(_f(Jt.clientWidth,Jt.clientHeight,devicePixelRatio,s)),Ne.outputColorSpace=vt,Ne.localClippingEnabled=!0,Ne.info.autoReset=!1,Jt.append(Ne.domElement),Ne.domElement.setAttribute("aria-label","3D model; döndürmek için sürükleyin"),Ut=new Dv(pt,Ne.domElement),x_(Ut,Cv),Rs=new A_(pt,Ut,Ds,bt),Ut.addEventListener("change",bt),ct=i_(Ne,sn,pt,rn),ct.setStyle(J("#lighting-style").value),J("#daylight-hour").oninput(),Ar=py({invalidate:bt,closePanel:()=>_i("",!1),capture:t=>{Vi=t,bt()},getState:()=>{const t=Se?.active?Se.camera:pt;return{revision:"R29",bundle:import.meta.url,models:wf,view:tt,walking:!!Se?.active,css_viewport:{width:Jt.clientWidth,height:Jt.clientHeight},drawing_buffer:{width:Ne.domElement.width,height:Ne.domElement.height},camera:{position:t.position.toArray(),quaternion:t.quaternion.toArray(),target:Ut.target.toArray(),fov:t.fov,zoom:t.zoom,near:t.near,far:t.far},settings:{section_height:rn.constant,plan:yi,furniture:ko,room_names:mr,dimensions:gr,hour:Number(J("#daylight-hour").value),day:Number(J("#daylight-season").value),light_style:J("#lighting-style").value,interior_lights:sr,lift:Xt?.snapshot()??null},lighting:ct.snapshot(),renderer:{profile:Wi,three:Pr,exposure:Ne.toneMappingExposure,tone_mapping:Ne.toneMapping,output_color_space:Ne.outputColorSpace,max_samples:Ne.capabilities.maxSamples,geometries:Ne.info.memory.geometries,textures:Ne.info.memory.textures},elapsed_since_navigation_ms:performance.now()}}}),Ne.domElement.addEventListener("webglcontextlost",t=>{t.preventDefault(),zo=!0,Ar.interrupt(),document.querySelectorAll("[data-needs-model]").forEach(n=>n.disabled=!0),Vi&&(Vi(null,new Error("WebGL context lost")),Vi=null),Oi("3D grafik bağlantısı kesildi. Sayfayı yeniden açarak devam edebilirsin.",!0),J("#retry").onclick=()=>location.reload()});const e=new Ex;e.setDecoderPath(xy.href),e.setWorkerLimit(Zl?1:Math.max(2,Math.min(s?3:4,(navigator.hardwareConcurrency||4)-1))),pr=new Gv,pr.setDRACOLoader(e),window.addEventListener("resize",()=>{const t=pt.aspect<1;Ds(),Si&&!Se?.active&&t!==pt.aspect<1&&Rr(!0)}),Ne.xr.addEventListener("sessionstart",()=>Ne.setAnimationLoop(Rf)),Ne.xr.addEventListener("sessionend",()=>{Ne.setAnimationLoop(null),Ds(),bt()})}function Dr(s,e=!1){if(wr.cancel(),Se?.active&&s.startsWith("f")){const r=Se.surface.data.stations.find(a=>a.floor_index===Number(s[1]));Qc(r.room_id);return}Se?.active&&ec(!1);const t=tt;if(tt=s,J("#app").dataset.scale=s.startsWith("f")?"floor":s,document.querySelectorAll("[data-view]").forEach(r=>r.setAttribute("aria-pressed",r.dataset.view===s)),J("#view-title").textContent=Wc[s],J("#section-label").textContent=s.startsWith("f")?s==="f3"?"1,30 m kesit":"1,60 m kesit":s==="building"?"Bahçe · Havuz · Villa":s==="region"?"Angora Evleri · Beysukent, Ankara":"Angora Evleri · Ankara",J("#region-panel").hidden=s!=="region",s==="region"?(zi??=xf(J("#app")),e?zi.show():setTimeout(()=>zi.show(),180)):zi?.hide(),_i("",!1),!Si)return;const n=ql(s,fn),i=s==="f0"?xo:fn;for(const r of Xc)r.visible=s!=="f0";ai.constant!==i&&(ai.constant=i,Ne.shadowMap.needsUpdate=!0),ct.frame(s,In),Cr?.set(s),Xt?.park(s),ct.interior(s.startsWith("f")?Number(s[1]):null,null),Mi&&Hc(J("#property-info"),Mi,s),!e&&(s==="region"||t==="region")&&Df(),e||matchMedia("(prefers-reduced-motion: reduce)").matches?(rn.constant=n,vn=null):vn={from:rn.constant,to:n,start:performance.now(),span:matchMedia("(pointer: coarse)").matches?520:820},e||!t.startsWith("f")||!s.startsWith("f")?Rr(e):t!==s&&Rr(!1,!0),Jt.dataset.view=s,Jt.dataset.loaded="true",$l(),bt()}function Xi(s){if(wr.cancel(),!Se||!Si)return;const e=tt.startsWith("f")?Number(tt[1]):1;s||=Se.surface.data.stations.find(n=>n.floor_index===e).room_id,Rs.cancel(),_i("",!1);const t=Se.enter(s);tt="f"+t.floor_index,Pf(t),ct.interior(t.floor_index,t.position),Ut.enabled=!1,rn.constant=fn,ai.constant=fn,vn=null,ct.frame("building"),Cr?.set("building"),ct.setWalkInterior(!0),Xt?.setWalkActive(!0),Xt?.setWalkFloor(t.floor_index),es(),zi?.hide();for(const n of Xc)n.visible=!0;J("#app").dataset.walk="true",J(".camera-tools").hidden=!0,J("#walk-tools").hidden=!1,J("#enter-walk").hidden=!0,J("#walk-room").value=t.room_id,document.querySelectorAll("[data-view]").forEach(n=>n.setAttribute("aria-pressed",n.dataset.view===tt)),J("#gesture-help").textContent="Sürükle: 360° bak · Yerdeki noktalara dokun: ilerle",Ds(),bt()}function ec(s=!0){wr.cancel(),Se?.active&&(Se.leave(),Ut.enabled=!0,J("#app").dataset.walk="false",ct.setWalkInterior(!1),ct.interior(null,null),Xt?.setWalkActive(!1),Xt?.cancel(),es(),J(".camera-tools").hidden=!1,J("#walk-tools").hidden=!0,J("#enter-walk").hidden=!1,yi=!1,J("#toggle-plan").setAttribute("aria-pressed",!1),pt.fov=35,pt.updateProjectionMatrix(),Ut.enableRotate=!0,J("#rotate-mode").disabled=!1,s&&(Dr(tt),Rr(!1)),J("#gesture-help").textContent="Sürükle: döndür · İki parmak: kaydır / yakınlaştır")}async function If(){if(Nl||Si)return;Nl=!0,Jt.dataset.loaded="false",Bl(null),Oi("Bütün model yükleniyor…");const s=new Map,e=new Map;try{let t=function(M){const y=s.get(M);Wt.set(M,y),sn.add(y),y.updateMatrixWorld(!0),y.traverse(T=>{if(!T.isMesh)return;T.renderOrder=5;const C=M!=="context"&&M!=="garden",x=M==="garden"&&vy.test(Tr(T.name));x&&Ll.push(T);const _=x?[]:C||M==="garden"?[rn]:(Array.isArray(T.material)?T.material:[T.material]).some(R=>R?.userData.plotSoil)?[ai]:[];if(ct.prepareMesh(T,{clipped:_[0]===rn,context:!C}),M==="context"&&(T.userData.aoExcluded=!0),T.userData.clipPlanes=_,_.length)for(const R of Array.isArray(T.material)?T.material:[T.material])R.clippingPlanes=_,R.side=Zt})},n=Zl?await fetch(new URL("manifest-mobile.json",ni),{cache:"no-cache"}).catch(()=>null):null;if(n?.ok||(n=await fetch(new URL("manifest.json",ni),{cache:"no-cache"})),!n.ok)throw Error(`Manifest HTTP ${n.status}`);const i=await n.json();if(wf=i.assets?.map(({file:M,sha256:y})=>({file:M,sha256:y})),!i.full_scene||i.geometry_preclipped||i.assets?.length!==3)throw Error("Whole-scene manifest required");const r=["villa","garden","context"],a=i.assets.slice().sort((M,y)=>r.indexOf(M.id)-r.indexOf(y.id));let o=0;const c=i.assets.reduce((M,y)=>M+(y.bytes||0),0)+(i.section_cap_asset?.bytes||0),l=new Map,h=()=>{let M=0;for(const y of l.values())M+=y;Bl(c?M/c:0)};Bl(0);async function u(M){for(;M.length;){const y=M.shift(),T=new URL(y.file,ni);T.searchParams.set("v",y.sha256.slice(0,12));const C=await pr.loadAsync(T.href,x=>{l.set(y.id,Math.min(x.loaded,y.bytes||x.loaded)),h()});l.set(y.id,y.bytes||0),j_(C.scene),q_(C.scene),s.set(y.id,y.id==="context"?k_($_(J_(C.scene))):C.scene),C.animations?.length&&e.set(y.id,C.animations),h(),Si?++o:Oi(`Model yükleniyor… ${++o}/${i.assets.length}`)}}async function d(){const M=new URL(i.section_atlas?.file??"sections.json",ni);i.section_atlas?.sha256&&M.searchParams.set("v",i.section_atlas.sha256.slice(0,12));const y=await fetch(M);if(!y.ok)throw Error(`Section atlas HTTP ${y.status}`);return y.json()}async function f(){const M=new URL(i.room_annotations?.file??"rooms.json",ni);i.room_annotations?.sha256&&M.searchParams.set("v",i.room_annotations.sha256.slice(0,12));const y=await fetch(M);if(!y.ok)throw Error(`Room annotations HTTP ${y.status}`);return y.json()}async function g(){if(!i.section_cap_asset)return null;const M=new URL(i.section_cap_asset.file,ni);M.searchParams.set("v",i.section_cap_asset.sha256.slice(0,12));try{const y=await pr.loadAsync(M.href,T=>{l.set("section-caps",Math.min(T.loaded,i.section_cap_asset.bytes||T.loaded)),h()});return l.set("section-caps",i.section_cap_asset.bytes||0),h(),y.scene}catch(y){return console.warn("Section caps unavailable",y),null}}async function A(){const M=new URL(i.navigation?.file??"navigation.json",ni);i.navigation?.sha256&&M.searchParams.set("v",i.navigation.sha256.slice(0,12));const y=await fetch(M);if(!y.ok)throw Error(`Navigation HTTP ${y.status}`);const T=await y.json();if(i.native_delivery){if(T.source_native_sha256!==i.source_native_sha256)throw Error("Navigation/native model revision mismatch")}else{if(T.source_architecture_sha256!==i.library_hashes["build/blender/layers/10-architecture.blend"])throw Error("Navigation/architecture revision mismatch");if(T.source_furniture_sha256!==i.library_hashes["build/blender/layers/30-furniture-placeholders.blend"])throw Error("Navigation/furniture revision mismatch");if(T.source_fittings_sha256!==i.library_hashes["build/blender/layers/20-fixed-fittings.blend"])throw Error("Navigation/fittings revision mismatch")}return T}const m=await Promise.allSettled([u(a),Zl?Promise.resolve():u(a),d(),f(),A(),ct.loadEnvironment(_y.href).catch(M=>console.warn("HDR unavailable; atmospheric daylight retained",M)),g()]),p=m.find(M=>M.status==="rejected");if(p)throw p.reason;for(const M of s.keys())t(M);pr.dracoLoader?.dispose();{const M=[];Wt.get("context")?.traverse(_=>{_.isMesh&&(Array.isArray(_.material)?_.material:[_.material]).some(R=>R?.userData.plotSoil)&&M.push(_)});const y=new Oc;y.far=80;const T=new I(0,-1,0),C=new Ht,x=new I;for(const _ of Ll){C.setFromObject(_).getCenter(x),y.set(new I(x.x,60,x.z),T);const R=M.length?y.intersectObjects(M,!1)[0]:null;(R?R.point.y:C.min.y)>xo-.15&&Xc.push(_)}Ll.length=0}{yt=new $t,yt.name="Plan paper wash",yt.visible=!1,yt.userData={level:0,overlays:[]};const M=new Map,y=new Map,T=_=>(M.has(_)||M.set(_,M.size),M.get(_)),C=(_,R)=>{const P=`${R}|${(_??[]).map(T).join(",")}`;if(!y.has(P)){const B={clippingPlanes:_??null,side:Zt,transparent:!0},O=new Un({colorWrite:!1,...B}),F=new Un({color:16777215,opacity:0,depthWrite:!1,depthFunc:vr,...B});F.userData.washBase=R,yt.userData.overlays.push(F),y.set(P,[O,F])}return y.get(P)},x=(_,R)=>{_&&(_.updateMatrixWorld(!0),_.traverse(P=>{if(!P.isMesh)return;const B=Array.isArray(P.material)?P.material[0]:P.material,[O,F]=C(B?.clippingPlanes??null,R);for(const[U,Y]of[[O,7],[F,8]]){const V=new Tt(P.geometry,U);V.matrixAutoUpdate=!1,V.matrix.copy(P.matrixWorld),V.renderOrder=Y,V.userData.aoExcluded=!0,V.castShadow=!1,V.receiveShadow=!1,yt.add(V)}}))};x(Wt.get("villa"),.3),x(Wt.get("garden"),.8),x(Wt.get("context"),.8),sn.add(yt)}Hi=new Ht().setFromObject(Wt.get("villa")),Ea=new Ht(new I(-10.2,-4,-29.1),new I(12.5,3.4,11)),In=Hi.clone();try{const M=await fetch(new URL("../site-context.json",ni),{cache:"no-cache"});if(!M.ok)throw Error("Context labels unavailable");const y=await M.json(),T=new Ht;for(const C of y.buildings)if(C.bounds)for(const x of C.bounds)T.expandByPoint(new I(...x));T.isEmpty()||(In=T.union(Hi)),Tf=y_(y,Jt,()=>Dr("building")),J("#context-count").textContent=`${y.buildings.length} yapı · ${Su}`}catch(M){console.warn(M),J("#context-count").textContent=Su}Wt.has("context")&&(In.union(new Ht().setFromObject(Wt.get("context"))),Kx(Wt.get("context"),ct.horizonColour),Cr=ey(Wt.get("context"))),fn=Hi.max.y+2,bs=m_(m[2].value),sn.add(bs.group);const E=m[6].status==="fulfilled"?m[6].value:null;E&&(rr=g_(E),rr&&sn.add(rr.group)),Mi=m[3].value,Jl=l_(Mi,Jt,Xi),sn.add(Jl.group),Se=new u_(m[4].value,Ne.domElement,bt),sn.add(Se.rig),ct.setFixtures(m[4].value.lights),bf=v_(Jt,Se,Qc),Xt=cy({groups:Wt,clips:e.get("villa")??[],clipPlane:rn,fullHeight:fn,shadowsDirty:()=>{Ne.shadowMap.needsUpdate=!0},onSettled:()=>es()}),es();for(let M=0;M<4;M++){const y=document.createElement("optgroup");y.label=Wc["f"+M];for(const T of m[4].value.stations.filter(C=>C.floor_index===M)){const C=m[3].value.rooms.find(x=>x.id===T.room_id);y.append(new Option(T.name+" · "+C.code,T.room_id))}J("#walk-room").append(y)}Oi("Görünüm hazırlanıyor…");try{Ne.compileAsync?await Promise.race([Ne.compileAsync(sn,pt),new Promise(M=>setTimeout(M,8e3))]):Ne.compile(sn,pt)}catch(M){console.warn("Shader pre-compile unavailable; first view will compile on demand",M)}Si=!0,J("#toggle-furniture").disabled=!1,Cf(ko),J("#toggle-rooms").disabled=!1,J("#toggle-measurements").disabled=!1,J("#enter-walk").disabled=!1,document.querySelectorAll("[data-needs-model]").forEach(M=>M.disabled=!1),d_(Ne,sn,Se,Wt,()=>{Se.active||Xi()},()=>{Ds(),bt()});for(const M of["f0","f1","f2","f3"])bs.update(ql(M,fn),!0);Oi("Görünümler hazırlanıyor…"),await new Promise(M=>setTimeout(M,0));const w=[];sn.traverse(M=>{M.isMesh&&M.frustumCulled&&(M.frustumCulled=!1,w.push(M))});for(const M of["building","f3","f2","f1","f0"]){if(rn.constant=ql(M,fn),ai.constant=M==="f0"?xo:fn,bs?.update(rn.constant,rn.constant<fn-.001),rr?.update(ai.constant,ai.constant<fn-.001&&Wt.has("context")),ct.frame(M,In),Cr?.set(M),ct.interior(M.startsWith("f")?Number(M[1]):null,null),ct.update(performance.now()+6e4),yt&&M==="f1"){yt.visible=!0;for(const y of yt.userData.overlays)y.opacity=y.userData.washBase}if(Ne.shadowMap.needsUpdate=!0,ct.render(pt),yt&&M==="f1"){yt.visible=!1;for(const y of yt.userData.overlays)y.opacity=0}await new Promise(y=>setTimeout(y,0))}for(const M of w)M.frustumCulled=!0;Dr(tt,!0),ct.render(pt),Kl.hidden=!0;const v=J("#boot");v&&(J("#app").append(J("#load-status")),v.classList.add("boot-done"),setTimeout(()=>v.remove(),720)),delete J("#app").dataset.booting}catch(t){for(const n of s.values())sn.remove(n),yy(n);Wt.clear(),Oi("Model yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.",!0),console.error("Model load failed",t)}finally{Nl=!1}}function Pu(s){Si&&(pt.zoom=Mt.clamp(pt.zoom*s,Ut.minZoom,Ut.maxZoom),pt.updateProjectionMatrix(),bt())}function Iu(s){yi=s,J("#toggle-plan").setAttribute("aria-pressed",s),Ut.enableRotate=!s,J("#rotate-mode").disabled=s,s&&tc(!0),Rr(!1)}function tc(s){Ut.touches.ONE=s?ri.PAN:ri.ROTATE,Ut.mouseButtons.LEFT=s?oi.PAN:oi.ROTATE,J("#rotate-mode").setAttribute("aria-pressed",!s),J("#pan-mode").setAttribute("aria-pressed",s),J("#gesture-help").textContent=s?"Sürükle: kaydır · İki parmak: kaydır ve yakınlaştır":"Sürükle: döndür · İki parmak: kaydır ve yakınlaştır"}function Sy(){const s=gy(location.search);s.view&&(tt=s.view),s.hour!==void 0&&(J("#daylight-hour").value=s.hour),s.season&&(J("#daylight-season").value=s.season),s.style&&(J("#lighting-style").value=s.style);for(const e of["toggle-plan","reset-view","rotate-mode","pan-mode","zoom-in","zoom-out"]){const t=J("#"+e);t.dataset.needsModel="",t.disabled=!0}document.querySelectorAll("[data-view]").forEach(e=>{e.dataset.needsModel="",e.disabled=!0,e.addEventListener("click",()=>Dr(e.dataset.view))}),J("#rotate-mode").onclick=()=>tc(!1),J("#pan-mode").onclick=()=>tc(!0),J("#zoom-in").onclick=()=>Pu(1.3),J("#zoom-out").onclick=()=>Pu(1/1.3),J("#reset-view").onclick=()=>Iu(!1),J("#retry").onclick=If,J("#lift-call").onclick=()=>{Xt?.run(performance.now())&&(es(),bt())},J("#toggle-furniture").onclick=()=>Cf(!ko),J("#toggle-rooms").onclick=()=>{mr=!mr,J("#toggle-rooms").setAttribute("aria-pressed",mr),bt()},J("#toggle-measurements").onclick=()=>{gr=!gr,J("#toggle-measurements").setAttribute("aria-pressed",gr),bt()},J("#enter-walk").onclick=()=>Xi(),J("#exit-walk").onclick=()=>ec(),J("#walk-room").onchange=e=>Qc(e.target.value),J("#toggle-plan").onclick=()=>Iu(!yi),J("#open-options").onclick=()=>_i("options-panel",J("#options-panel").hidden),J("#open-info").onclick=()=>_i("info-panel",J("#info-panel").hidden),document.querySelectorAll("[data-close-panel]").forEach(e=>e.onclick=()=>_i("",!1)),J("#daylight-hour").oninput=()=>{const e=Number(J("#daylight-hour").value);J("#daylight-time").textContent=mu(e),J("#daylight-hour").setAttribute("aria-valuetext",mu(e)),ct?.setTime(e,Number(J("#daylight-season").value)),$l(),bt()},J("#daylight-season").onchange=()=>J("#daylight-hour").oninput(),J("#toggle-lights").onclick=()=>{sr=!sr,J("#toggle-lights").setAttribute("aria-pressed",sr),ct?.setLights(sr),bt()},J("#lighting-style").onchange=e=>{ct?.setStyle(e.target.value),$l(),bt()},J("#return-villa").onclick=()=>Dr("building"),document.querySelectorAll(".region-radius button").forEach(e=>e.onclick=()=>{zi??=xf(J("#app")),zi.setRadius(Number(e.dataset.radius)),document.querySelectorAll(".region-radius button").forEach(t=>t.setAttribute("aria-pressed",String(t===e)))}),window.addEventListener("keydown",e=>hy(e,{panelOpen:!!document.querySelector(".panel:not([hidden])"),closePanel:()=>_i("",!1),walkActive:Se?.active,immersive:Ne?.xr.isPresenting,exitWalk:ec})),document.querySelectorAll(".panel").forEach(e=>e.addEventListener("keydown",t=>{if(t.key!=="Tab")return;const n=[...e.querySelectorAll("button:not(:disabled),a[href],input,select,summary")].filter(a=>a.getClientRects().length>0),i=n[0],r=n.at(-1);t.shiftKey&&document.activeElement===i?(t.preventDefault(),r.focus()):!t.shiftKey&&document.activeElement===r&&(t.preventDefault(),i.focus())}))}Sy();uy({button:J("#toggle-sound")});try{My(),If()}catch(s){Oi("3D görünüm başlatılamadı. Güncel Safari veya Chrome ile tekrar açabilirsin.",!0),J("#retry").onclick=()=>location.reload(),console.error(s),J("#app").dataset.renderError="true",fetch(new URL("rooms.json",ni),{cache:"no-cache"}).then(e=>{if(!e.ok)throw Error("Property info unavailable");return e.json()}).then(e=>{Mi=e,Hc(J("#property-info"),e,"building")}).catch(console.warn)}

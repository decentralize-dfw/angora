import json,struct,numpy as np
from pathlib import Path
from PIL import Image
D=Path(r'C:\Users\yigit\angora-git\teslim-tur10/web');C=Path(r'C:\Users\yigit\angora-tur10/adim10/web-calisma');p=D/'BUILDING-opt-v6-alt.glb';raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];j=json.loads(raw[20:20+n]);buf=bytearray(raw[28+n:])
def read(i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];w={'VEC2':2,'VEC3':3,'VEC4':4,'SCALAR':1}[a['type']];dt={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']];return np.ndarray((a['count'],w),dtype=dt,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',w*np.dtype(dt).itemsize),np.dtype(dt).itemsize)).copy()
def add(a,typ,target):
 global buf
 a=np.asarray(a,dtype='<u4' if typ=='SCALAR' else '<f4');buf+=b'\0'*((-len(buf))%4);view=len(j['bufferViews']);j['bufferViews'].append(dict(buffer=0,byteOffset=len(buf),byteLength=a.nbytes,target=target));buf+=a.tobytes();acc=dict(bufferView=view,componentType=5125 if typ=='SCALAR' else 5126,count=len(a),type=typ)
 if typ=='VEC3':acc.update(min=a.min(0).tolist(),max=a.max(0).tolist())
 i=len(j['accessors']);j['accessors'].append(acc);return i
rec=next(x for x in json.loads((C/'ham-dokular.json').read_text(encoding='utf-8')) if x['kaynak']=='cam40');alpha=np.array(Image.open(rec['ham']).convert('RGBA'))[:,:,3]/255
count=0
for mi,mat in enumerate(j['materials']):
 if 'M3G_Foto40' not in mat.get('name',''):continue
 mat['pbrMetallicRoughness']['baseColorFactor'][3]=1;mat.setdefault('extras',{})['alfa_yontemi']='128x256 grid COLOR_0 alpha; JPEG RGB korunur'
 for mesh in j['meshes']:
  for pr in mesh['primitives']:
   if pr.get('material')!=mi:continue
   attrs=pr['attributes'];pos=read(attrs['POSITION']);uv=read(attrs['TEXCOORD_0']);normal=read(attrs['NORMAL']);tangent=read(attrs['TANGENT']);oldidx=read(pr['indices']).ravel();nu,nv=128,256;u=np.linspace(uv[:,0].min(),uv[:,0].max(),nu+1);v=np.linspace(uv[:,1].min(),uv[:,1].max(),nv+1);uu,vv=np.meshgrid(u,v);uvnew=np.stack([uu.ravel(),vv.ravel()],1);basis=np.c_[uv,np.ones(len(uv))];coeff=np.linalg.lstsq(basis,pos,rcond=None)[0];newpos=np.c_[uvnew,np.ones(len(uvnew))]@coeff
   x=np.clip(uvnew[:,0]*(alpha.shape[1]-1),0,alpha.shape[1]-1);y=np.clip(uvnew[:,1]*(alpha.shape[0]-1),0,alpha.shape[0]-1);x0=x.astype(int);y0=y.astype(int);x1=np.minimum(x0+1,alpha.shape[1]-1);y1=np.minimum(y0+1,alpha.shape[0]-1);dx=x-x0;dy=y-y0;aa=alpha[y0,x0]*(1-dx)*(1-dy)+alpha[y0,x1]*dx*(1-dy)+alpha[y1,x0]*(1-dx)*dy+alpha[y1,x1]*dx*dy;col=np.ones((len(newpos),4));col[:,3]=aa
   faces=[]
   for row in range(nv):
    for column in range(nu):
     a=row*(nu+1)+column;b=a+1;c=a+nu+1;d=c+1;faces.extend([(a,b,d),(a,d,c)])
   faces=np.asarray(faces);oldsign=np.cross(pos[oldidx[1]]-pos[oldidx[0]],pos[oldidx[2]]-pos[oldidx[0]]);newsign=np.cross(newpos[faces[0,1]]-newpos[faces[0,0]],newpos[faces[0,2]]-newpos[faces[0,0]])
   if np.dot(oldsign,newsign)<0:faces=faces[:,[0,2,1]]
   pr['attributes']={'POSITION':add(newpos,'VEC3',34962),'NORMAL':add(np.tile(normal[0],(len(newpos),1)),'VEC3',34962),'TEXCOORD_0':add(uvnew,'VEC2',34962),'TANGENT':add(np.tile(tangent[0],(len(newpos),1)),'VEC4',34962),'COLOR_0':add(col,'VEC4',34962)};pr['indices']=add(faces.ravel(),'SCALAR',34963);count+=1
j['buffers'][0]['byteLength']=len(buf);raw=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);buf+=b'\0'*((-len(buf))%4);p.write_bytes(struct.pack('<III',0x46546c67,2,28+len(raw)+len(buf))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(buf),0x004e4942)+buf)
q=D/'web-kontrol.json';r=json.loads(q.read_text(encoding='utf-8'));r['cam40_alfa']={'panel':count,'yontem':'JPEG RGB + COLOR_0 alpha','ornekleme':[128,256],'kaynak_alfa_araligi':[float(alpha.min()),float(alpha.max())]};r['notlar']=[x for x in r['notlar'] if 'M3G_Foto40' not in str(x)];q.write_text(json.dumps(r,ensure_ascii=False,indent=1),encoding='utf-8');print('[web] CAM ALFA',count,'panel',p.stat().st_size)

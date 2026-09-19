export function alphaBounds(data,width,height) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||data?.length!==width*height*4)throw new Error('잘못된 이미지 크기예요.');
  let left=width,top=height,right=-1,bottom=-1,transparent=false;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const a=data[(y*width+x)*4+3];
    if(a<250)transparent=true;
    if(a>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  }
  if(right<left)return null;
  if(!transparent)throw new Error('배경을 구분하지 못했어요. 원래 사진을 사용해 주세요.');
  const padding=Math.max(4,Math.round(Math.max(right-left+1,bottom-top+1)*.025));
  left=Math.max(0,left-padding);top=Math.max(0,top-padding);right=Math.min(width-1,right+padding);bottom=Math.min(height-1,bottom+padding);
  return {left,top,width:right-left+1,height:bottom-top+1};
}

export function startCutout(blob,onProgress=()=>{}, {WorkerClass=globalThis.Worker,timeoutMs=90000}={}) {
  let worker,timer,settled=false,abort=()=>{};
  const promise=new Promise((resolve,reject)=>{
    const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);worker?.terminate();error?reject(error):resolve(value);};
    abort=()=>finish(new DOMException('누끼 작업을 중단했어요.','AbortError'));
    if(!(blob instanceof Blob)||!blob.size||blob.size>2*1024*1024||!['image/webp','image/png','image/jpeg','image/avif'].includes(blob.type)){finish(new Error('먼저 사진 한 장을 선택해 주세요.'));return;}
    if(typeof WorkerClass!=='function'){finish(new Error('이 브라우저는 기기 내 누끼 처리를 지원하지 않아요.'));return;}
    try {
      worker=new WorkerClass(new URL('./vendor/cutout/worker.mjs',import.meta.url),{type:'module'});
      worker.onerror=()=>finish(new Error('AI 도구를 실행하지 못했어요. 사진 그대로 저장할 수 있어요.'));
      worker.onmessage=({data})=>{
        if(settled)return;
        if(data?.type==='progress'){onProgress(data);return;}
        if(data?.type==='error'){finish(new Error(data.message||'배경을 지우지 못했어요.'));return;}
        if(data?.type==='result'){
          if(!(data.blob instanceof Blob)||!data.blob.size||data.blob.size>2*1024*1024||!['image/png','image/webp'].includes(data.blob.type)||!Number.isInteger(data.width)||!Number.isInteger(data.height)||data.width<1||data.height<1||Math.max(data.width,data.height)>1024){finish(new Error('스티커 결과를 읽지 못했어요.'));return;}
          finish(null,{blob:data.blob,width:data.width,height:data.height});
        }
      };
      timer=setTimeout(()=>finish(new Error('누끼 작업이 오래 걸려 중단했어요. 사진 그대로 저장할 수 있어요.')),timeoutMs);
      worker.postMessage({blob});
    }catch{finish(new Error('AI 도구를 실행하지 못했어요. 사진 그대로 저장할 수 있어요.'));}
  });
  return {promise,cancel:()=>abort()};
}

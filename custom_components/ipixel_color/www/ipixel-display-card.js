(()=>{var W="2.11.0";var k=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._config={},this._hass=null}set hass(e){this._hass=e,this.render()}setConfig(e){if(!e.entity)throw new Error("Please define an entity");this._config=e,this.render()}getEntity(){return!this._hass||!this._config.entity?null:this._hass.states[this._config.entity]}getRelatedEntity(e,t=""){if(!this._hass||!this._config.entity)return null;let r=this._config.entity.replace(/^[^.]+\./,"").replace(/_?(text|display|gif_url)$/i,""),i=`${e}.${r}${t}`;if(this._hass.states[i])return this._hass.states[i];let s=Object.keys(this._hass.states).filter(o=>{if(!o.startsWith(`${e}.`))return!1;let n=o.replace(/^[^.]+\./,"");return n.includes(r)||r.includes(n.replace(t,""))});if(t){let o=s.find(n=>n.endsWith(t));if(o)return this._hass.states[o]}else{let o=s.sort((n,a)=>n.length-a.length);if(o.length>0)return this._hass.states[o[0]]}return s.length>0?this._hass.states[s[0]]:null}async callService(e,t,r={}){if(this._hass)try{await this._hass.callService(e,t,r)}catch(i){console.error(`iPIXEL service call failed: ${e}.${t}`,i)}}getResolution(){let e=this.getRelatedEntity("sensor","_width")||this._hass?.states["sensor.display_width"],t=this.getRelatedEntity("sensor","_height")||this._hass?.states["sensor.display_height"];if(e&&t){let r=parseInt(e.state),i=parseInt(t.state);if(!isNaN(r)&&!isNaN(i)&&r>0&&i>0)return[r,i]}return[64,16]}isOn(){return this.getRelatedEntity("switch")?.state==="on"}hexToRgb(e){let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:[255,255,255]}render(){}getCardSize(){return 2}};var C=`
  :host {
    --ipixel-primary: var(--primary-color, #03a9f4);
    --ipixel-accent: var(--accent-color, #ff9800);
    --ipixel-text: var(--primary-text-color, #fff);
    --ipixel-bg: var(--ha-card-background, #1c1c1c);
    --ipixel-border: var(--divider-color, #333);
  }

  .card-content { padding: 16px; }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .card-title {
    font-size: 1.1em;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4caf50;
  }
  .status-dot.off { background: #f44336; }
  .status-dot.unavailable { background: #9e9e9e; }

  .section-title {
    font-size: 0.85em;
    font-weight: 500;
    margin-bottom: 8px;
    opacity: 0.8;
  }

  .control-row { margin-bottom: 12px; }

  /* Buttons */
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85em;
    font-weight: 500;
    transition: all 0.2s;
  }
  .btn-primary { background: var(--ipixel-primary); color: #fff; }
  .btn-primary:hover { opacity: 0.9; }
  .btn-secondary {
    background: rgba(255,255,255,0.1);
    color: var(--ipixel-text);
    border: 1px solid var(--ipixel-border);
  }
  .btn-secondary:hover { background: rgba(255,255,255,0.15); }
  .btn-danger { background: #f44336; color: #fff; }
  .btn-success { background: #4caf50; color: #fff; }

  .icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.1);
    border: 1px solid var(--ipixel-border);
    border-radius: 6px;
    cursor: pointer;
    color: inherit;
  }
  .icon-btn:hover { background: rgba(255,255,255,0.15); }
  .icon-btn.active {
    background: rgba(3, 169, 244, 0.3);
    border-color: var(--ipixel-primary);
  }
  .icon-btn svg { width: 20px; height: 20px; fill: currentColor; }

  /* Slider */
  .slider-row { display: flex; align-items: center; gap: 12px; }
  .slider-label { min-width: 70px; font-size: 0.85em; }
  .slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right,
      var(--ipixel-primary) 0%,
      var(--ipixel-primary) var(--value, 50%),
      rgba(255,255,255,0.25) var(--value, 50%),
      rgba(255,255,255,0.25) 100%);
    outline: none;
    cursor: pointer;
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--ipixel-primary);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--ipixel-primary);
    cursor: pointer;
  }
  .slider-value { min-width: 40px; text-align: right; font-size: 0.85em; font-weight: 500; }

  /* Dropdown */
  .dropdown {
    width: 100%;
    padding: 8px 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid var(--ipixel-border);
    border-radius: 6px;
    color: inherit;
    font-size: 0.9em;
    cursor: pointer;
  }

  /* Input */
  .text-input {
    width: 100%;
    padding: 10px 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid var(--ipixel-border);
    border-radius: 6px;
    color: inherit;
    font-size: 0.9em;
    box-sizing: border-box;
  }
  .text-input:focus { outline: none; border-color: var(--ipixel-primary); }

  /* Button Grid */
  .button-grid { display: grid; gap: 8px; }
  .button-grid-4 { grid-template-columns: repeat(4, 1fr); }
  .button-grid-3 { grid-template-columns: repeat(3, 1fr); }
  .button-grid-2 { grid-template-columns: repeat(2, 1fr); }

  /* Mode buttons */
  .mode-btn {
    padding: 10px 8px;
    background: rgba(255,255,255,0.08);
    border: 1px solid var(--ipixel-border);
    border-radius: 6px;
    cursor: pointer;
    text-align: center;
    font-size: 0.8em;
    color: inherit;
    transition: all 0.2s;
  }
  .mode-btn:hover { background: rgba(255,255,255,0.12); }
  .mode-btn.active { background: rgba(3, 169, 244, 0.25); border-color: var(--ipixel-primary); }

  /* Color picker */
  .color-row { display: flex; align-items: center; gap: 12px; }
  .color-picker {
    width: 40px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--ipixel-border);
    border-radius: 4px;
    cursor: pointer;
    background: none;
  }

  /* List items */
  .list-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    background: rgba(255,255,255,0.05);
    border-radius: 6px;
    margin-bottom: 8px;
    gap: 12px;
  }
  .list-item:last-child { margin-bottom: 0; }
  .list-item-info { flex: 1; }
  .list-item-name { font-weight: 500; font-size: 0.9em; }
  .list-item-meta { font-size: 0.75em; opacity: 0.6; margin-top: 2px; }
  .list-item-actions { display: flex; gap: 4px; }

  /* Empty state */
  .empty-state { text-align: center; padding: 24px; opacity: 0.6; font-size: 0.9em; }

  @media (max-width: 400px) {
    .button-grid-4 { grid-template-columns: repeat(2, 1fr); }
  }
`;var S={A:[124,18,17,18,124],B:[127,73,73,73,54],C:[62,65,65,65,34],D:[127,65,65,34,28],E:[127,73,73,73,65],F:[127,9,9,9,1],G:[62,65,73,73,122],H:[127,8,8,8,127],I:[0,65,127,65,0],J:[32,64,65,63,1],K:[127,8,20,34,65],L:[127,64,64,64,64],M:[127,2,12,2,127],N:[127,4,8,16,127],O:[62,65,65,65,62],P:[127,9,9,9,6],Q:[62,65,81,33,94],R:[127,9,25,41,70],S:[70,73,73,73,49],T:[1,1,127,1,1],U:[63,64,64,64,63],V:[31,32,64,32,31],W:[63,64,56,64,63],X:[99,20,8,20,99],Y:[7,8,112,8,7],Z:[97,81,73,69,67],a:[32,84,84,84,120],b:[127,72,68,68,56],c:[56,68,68,68,32],d:[56,68,68,72,127],e:[56,84,84,84,24],f:[8,126,9,1,2],g:[12,82,82,82,62],h:[127,8,4,4,120],i:[0,68,125,64,0],j:[32,64,68,61,0],k:[127,16,40,68,0],l:[0,65,127,64,0],m:[124,4,24,4,120],n:[124,8,4,4,120],o:[56,68,68,68,56],p:[124,20,20,20,8],q:[8,20,20,24,124],r:[124,8,4,4,8],s:[72,84,84,84,32],t:[4,63,68,64,32],u:[60,64,64,32,124],v:[28,32,64,32,28],w:[60,64,48,64,60],x:[68,40,16,40,68],y:[12,80,80,80,60],z:[68,100,84,76,68],0:[62,81,73,69,62],1:[0,66,127,64,0],2:[66,97,81,73,70],3:[33,65,69,75,49],4:[24,20,18,127,16],5:[39,69,69,69,57],6:[60,74,73,73,48],7:[1,113,9,5,3],8:[54,73,73,73,54],9:[6,73,73,41,30]," ":[0,0,0,0,0],".":[0,96,96,0,0],",":[0,128,96,0,0],":":[0,54,54,0,0],";":[0,128,54,0,0],"!":[0,0,95,0,0],"?":[2,1,81,9,6],"-":[8,8,8,8,8],"+":[8,8,62,8,8],"=":[20,20,20,20,20],_:[64,64,64,64,64],"/":[32,16,8,4,2],"\\":[2,4,8,16,32],"(":[0,28,34,65,0],")":[0,65,34,28,0],"[":[0,127,65,65,0],"]":[0,65,65,127,0],"<":[8,20,34,65,0],">":[0,65,34,20,8],"*":[20,8,62,8,20],"#":[20,127,20,127,20],"@":[62,65,93,85,30],"&":[54,73,85,34,80],"%":[35,19,8,100,98],$:[18,42,127,42,36],"'":[0,0,7,0,0],'"':[0,7,0,7,0],"`":[0,1,2,0,0],"^":[4,2,1,2,4],"~":[8,4,8,16,8]};function T(x,e,t,r="#ff6600",i="#111"){let s=[],a=Math.floor((t-7)/2);for(let d=0;d<t;d++)for(let b=0;b<e;b++)s.push(i);let c=x.length*6-1,h=Math.max(1,Math.floor((e-c)/2));for(let d of x){let b=S[d]||S[" "];for(let g=0;g<5;g++)for(let p=0;p<7;p++){let m=b[g]>>p&1,u=h+g,E=a+p;u>=0&&u<e&&E<t&&E>=0&&(s[E*e+u]=m?r:i)}h+=6}return s}function N(x,e,t,r="#ff6600",i="#111"){let n=Math.floor((t-7)/2),a=x.length*6,c=e+a+e,l=[];for(let d=0;d<t;d++)for(let b=0;b<c;b++)l.push(i);let h=e;for(let d of x){let b=S[d]||S[" "];for(let g=0;g<5;g++)for(let p=0;p<7;p++){let m=b[g]>>p&1,u=h+g,E=n+p;u>=0&&u<c&&E<t&&E>=0&&(l[E*c+u]=m?r:i)}h+=6}return{pixels:l,width:c}}var L=class{constructor(e){this.renderer=e}init(e,t){let{width:r,height:i}=this.renderer;switch(e){case"scroll_ltr":case"scroll_rtl":t.offset=0;break;case"blink":t.visible=!0;break;case"snow":case"breeze":t.phases=[];for(let s=0;s<r*i;s++)t.phases[s]=Math.random()*Math.PI*2;break;case"laser":t.position=0;break;case"fade":t.opacity=0,t.direction=1;break;case"typewriter":t.charIndex=0,t.cursorVisible=!0;break;case"bounce":t.offset=0,t.direction=1;break;case"sparkle":t.sparkles=[];for(let s=0;s<Math.floor(r*i*.1);s++)t.sparkles.push({x:Math.floor(Math.random()*r),y:Math.floor(Math.random()*i),brightness:Math.random(),speed:.05+Math.random()*.1});break}}step(e,t){let{width:r,extendedWidth:i}=this.renderer;switch(e){case"scroll_ltr":t.offset-=1,t.offset<=-(i||r)&&(t.offset=r);break;case"scroll_rtl":t.offset+=1,t.offset>=(i||r)&&(t.offset=-r);break;case"blink":t.visible=!t.visible;break;case"laser":t.position=(t.position+1)%r;break;case"fade":t.opacity+=t.direction*.05,t.opacity>=1?(t.opacity=1,t.direction=-1):t.opacity<=0&&(t.opacity=0,t.direction=1);break;case"typewriter":t.tick%3===0&&t.charIndex++,t.cursorVisible=t.tick%10<5;break;case"bounce":t.offset+=t.direction;let s=Math.max(0,(i||r)-r);t.offset>=s?(t.offset=s,t.direction=-1):t.offset<=0&&(t.offset=0,t.direction=1);break;case"sparkle":for(let o of t.sparkles)o.brightness+=o.speed,o.brightness>1&&(o.brightness=0,o.x=Math.floor(Math.random()*r),o.y=Math.floor(Math.random()*this.renderer.height));break}}render(e,t,r,i,s){let{width:o,height:n}=this.renderer,a=i||r||[],c=r||[],l=s||o;for(let h=0;h<n;h++)for(let d=0;d<o;d++){let b,g=d;if(e==="scroll_ltr"||e==="scroll_rtl"||e==="bounce"){for(g=d-(t.offset||0);g<0;)g+=l;for(;g>=l;)g-=l;b=a[h*l+g]||"#111"}else if(e==="typewriter"){let v=(t.charIndex||0)*6;d<v?b=c[h*o+d]||"#111":d===v&&t.cursorVisible?b="#ffffff":b="#111"}else b=c[h*o+d]||"#111";let[p,m,u]=this._hexToRgb(b);if(p>20||m>20||u>20)switch(e){case"blink":t.visible||(p=m=u=17);break;case"snow":{let w=t.phases?.[h*o+d]||0,v=t.tick||0,y=.3+.7*Math.abs(Math.sin(w+v*.3));p*=y,m*=y,u*=y;break}case"breeze":{let w=t.phases?.[h*o+d]||0,v=t.tick||0,y=.4+.6*Math.abs(Math.sin(w+v*.15+d*.2));p*=y,m*=y,u*=y;break}case"laser":{let w=t.position||0,y=Math.abs(d-w)<3?1:.3;p*=y,m*=y,u*=y;break}case"fade":{let w=t.opacity||1;p*=w,m*=w,u*=w;break}}if(e==="sparkle"&&t.sparkles){for(let w of t.sparkles)if(w.x===d&&w.y===h){let v=Math.sin(w.brightness*Math.PI);p=Math.min(255,p+v*200),m=Math.min(255,m+v*200),u=Math.min(255,u+v*200)}}this.renderer.setPixel(d,h,[p,m,u])}}_hexToRgb(e){if(!e||e==="#111"||e==="#000")return[17,17,17];if(e==="#050505")return[5,5,5];let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:[17,17,17]}};function q(x,e,t){let r,i,s,o=Math.floor(x*6),n=x*6-o,a=t*(1-e),c=t*(1-n*e),l=t*(1-(1-n)*e);switch(o%6){case 0:r=t,i=l,s=a;break;case 1:r=c,i=t,s=a;break;case 2:r=a,i=t,s=l;break;case 3:r=a,i=c,s=t;break;case 4:r=l,i=a,s=t;break;case 5:r=t,i=a,s=c;break}return[r*255,i*255,s*255]}var P=class{constructor(e){this.renderer=e}init(e,t){let{width:r,height:i}=this.renderer;switch(e){case"rainbow":t.position=0;break;case"matrix":let s=[[0,255,0],[0,255,255],[255,0,255]];t.colorMode=s[Math.floor(Math.random()*s.length)],t.buffer=[];for(let n=0;n<i;n++)t.buffer.push(Array(r).fill(null).map(()=>[0,0,0]));break;case"plasma":t.time=0;break;case"gradient":t.time=0;break;case"fire":t.heat=[];for(let n=0;n<r*i;n++)t.heat[n]=0;t.palette=this._createFirePalette();break;case"water":t.current=[],t.previous=[];for(let n=0;n<r*i;n++)t.current[n]=0,t.previous[n]=0;t.damping=.95;break;case"stars":t.stars=[];let o=Math.floor(r*i*.15);for(let n=0;n<o;n++)t.stars.push({x:Math.floor(Math.random()*r),y:Math.floor(Math.random()*i),brightness:Math.random(),speed:.02+Math.random()*.05,phase:Math.random()*Math.PI*2});break;case"confetti":t.particles=[];for(let n=0;n<20;n++)t.particles.push(this._createConfettiParticle(r,i,!0));break}}step(e,t){let{width:r,height:i}=this.renderer;switch(e){case"rainbow":t.position=(t.position+.01)%1;break;case"matrix":this._stepMatrix(t,r,i);break;case"plasma":case"gradient":t.time=(t.time||0)+.05;break;case"fire":this._stepFire(t,r,i);break;case"water":this._stepWater(t,r,i);break;case"stars":for(let s of t.stars)s.phase+=s.speed;break;case"confetti":for(let s=0;s<t.particles.length;s++){let o=t.particles[s];o.y+=o.speed,o.x+=o.drift,o.rotation+=o.rotationSpeed,o.y>i&&(t.particles[s]=this._createConfettiParticle(r,i,!1))}break}}render(e,t){switch(e){case"rainbow":this._renderRainbow(t);break;case"matrix":this._renderMatrix(t);break;case"plasma":this._renderPlasma(t);break;case"gradient":this._renderGradient(t);break;case"fire":this._renderFire(t);break;case"water":this._renderWater(t);break;case"stars":this._renderStars(t);break;case"confetti":this._renderConfetti(t);break}}_renderRainbow(e){let{width:t,height:r}=this.renderer,i=e.position||0;for(let s=0;s<t;s++){let o=(i+s/t)%1,[n,a,c]=q(o,1,.6);for(let l=0;l<r;l++)this.renderer.setPixel(s,l,[n,a,c])}}_stepMatrix(e,t,r){let i=e.buffer,s=e.colorMode,o=.15;i.pop();let n=i[0].map(([a,c,l])=>[a*(1-o),c*(1-o),l*(1-o)]);i.unshift(JSON.parse(JSON.stringify(n)));for(let a=0;a<t;a++)Math.random()<.08&&(i[0][a]=[Math.floor(Math.random()*s[0]),Math.floor(Math.random()*s[1]),Math.floor(Math.random()*s[2])])}_renderMatrix(e){let{width:t,height:r}=this.renderer,i=e.buffer;if(i)for(let s=0;s<r;s++)for(let o=0;o<t;o++){let[n,a,c]=i[s]?.[o]||[0,0,0];this.renderer.setPixel(o,s,[n,a,c])}}_renderPlasma(e){let{width:t,height:r}=this.renderer,i=e.time||0,s=t/2,o=r/2;for(let n=0;n<t;n++)for(let a=0;a<r;a++){let c=n-s,l=a-o,h=Math.sqrt(c*c+l*l),d=Math.sin(n/8+i),b=Math.sin(a/6+i*.8),g=Math.sin(h/6-i*1.2),p=Math.sin((n+a)/10+i*.5),m=(d+b+g+p+4)/8,u=Math.sin(m*Math.PI*2)*.5+.5,E=Math.sin(m*Math.PI*2+2)*.5+.5,w=Math.sin(m*Math.PI*2+4)*.5+.5;this.renderer.setPixel(n,a,[u*255,E*255,w*255])}}_renderGradient(e){let{width:t,height:r}=this.renderer,s=(e.time||0)*10;for(let o=0;o<t;o++)for(let n=0;n<r;n++){let a=(Math.sin((o+s)*.05)*.5+.5)*255,c=(Math.cos((n+s)*.05)*.5+.5)*255,l=(Math.sin((o+n+s)*.03)*.5+.5)*255;this.renderer.setPixel(o,n,[a,c,l])}}_createFirePalette(){let e=[];for(let t=0;t<256;t++){let r,i,s;t<64?(r=t*4,i=0,s=0):t<128?(r=255,i=(t-64)*4,s=0):t<192?(r=255,i=255,s=(t-128)*4):(r=255,i=255,s=255),e.push([r,i,s])}return e}_stepFire(e,t,r){let i=e.heat;for(let s=0;s<t*r;s++)i[s]=Math.max(0,i[s]-Math.random()*10);for(let s=0;s<r-1;s++)for(let o=0;o<t;o++){let n=s*t+o,a=(s+1)*t+o,c=s*t+Math.max(0,o-1),l=s*t+Math.min(t-1,o+1);i[n]=(i[a]+i[c]+i[l])/3.05}for(let s=0;s<t;s++)Math.random()<.6&&(i[(r-1)*t+s]=180+Math.random()*75)}_renderFire(e){let{width:t,height:r}=this.renderer,i=e.heat,s=e.palette;for(let o=0;o<r;o++)for(let n=0;n<t;n++){let a=o*t+n,c=Math.floor(Math.min(255,i[a])),[l,h,d]=s[c];this.renderer.setPixel(n,o,[l,h,d])}}_stepWater(e,t,r){let{current:i,previous:s,damping:o}=e,n=[...s];for(let a=0;a<i.length;a++)s[a]=i[a];for(let a=1;a<r-1;a++)for(let c=1;c<t-1;c++){let l=a*t+c;i[l]=(n[(a-1)*t+c]+n[(a+1)*t+c]+n[a*t+(c-1)]+n[a*t+(c+1)])/2-i[l],i[l]*=o}if(Math.random()<.1){let a=Math.floor(Math.random()*(t-2))+1,c=Math.floor(Math.random()*(r-2))+1;i[c*t+a]=255}}_renderWater(e){let{width:t,height:r}=this.renderer,i=e.current;for(let s=0;s<r;s++)for(let o=0;o<t;o++){let n=s*t+o,a=Math.abs(i[n]),c=Math.min(255,a*2),l=c>200?c:0,h=c>150?c*.8:c*.3,d=Math.min(255,50+c);this.renderer.setPixel(o,s,[l,h,d])}}_renderStars(e){let{width:t,height:r}=this.renderer;for(let i=0;i<r;i++)for(let s=0;s<t;s++)this.renderer.setPixel(s,i,[5,5,15]);for(let i of e.stars){let s=(Math.sin(i.phase)*.5+.5)*255,o=Math.floor(i.x),n=Math.floor(i.y);o>=0&&o<t&&n>=0&&n<r&&this.renderer.setPixel(o,n,[s,s,s*.9])}}_createConfettiParticle(e,t,r){let i=[[255,0,0],[0,255,0],[0,0,255],[255,255,0],[255,0,255],[0,255,255],[255,128,0],[255,192,203]];return{x:Math.random()*e,y:r?Math.random()*t:-2,speed:.2+Math.random()*.3,drift:(Math.random()-.5)*.3,color:i[Math.floor(Math.random()*i.length)],size:1+Math.random(),rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-.5)*.2}}_renderConfetti(e){let{width:t,height:r}=this.renderer;for(let i=0;i<r;i++)for(let s=0;s<t;s++)this.renderer.setPixel(s,i,[10,10,10]);for(let i of e.particles){let s=Math.floor(i.x),o=Math.floor(i.y);if(s>=0&&s<t&&o>=0&&o<r){this.renderer.setPixel(s,o,i.color);let n=Math.abs(Math.sin(i.rotation))*.5+.5,[a,c,l]=i.color;this.renderer.setPixel(s,o,[a*n,c*n,l*n])}}}};function z(x,e,t){let r,i,s,o=Math.floor(x*6),n=x*6-o,a=t*(1-e),c=t*(1-n*e),l=t*(1-(1-n)*e);switch(o%6){case 0:r=t,i=l,s=a;break;case 1:r=c,i=t,s=a;break;case 2:r=a,i=t,s=l;break;case 3:r=a,i=c,s=t;break;case 4:r=l,i=a,s=t;break;case 5:r=t,i=a,s=c;break}return[r*255,i*255,s*255]}var R=class{constructor(e){this.renderer=e}init(e,t){switch(e){case"color_cycle":t.hue=0;break;case"rainbow_text":t.offset=0;break;case"neon":t.glowIntensity=0,t.direction=1,t.baseColor=t.fgColor||"#ff00ff";break}}step(e,t){switch(e){case"color_cycle":t.hue=(t.hue+.01)%1;break;case"rainbow_text":t.offset=(t.offset+.02)%1;break;case"neon":t.glowIntensity+=t.direction*.05,t.glowIntensity>=1?(t.glowIntensity=1,t.direction=-1):t.glowIntensity<=.3&&(t.glowIntensity=.3,t.direction=1);break}}render(e,t,r){let{width:i,height:s}=this.renderer,o=r||[];for(let n=0;n<s;n++)for(let a=0;a<i;a++){let c=o[n*i+a]||"#111",[l,h,d]=this._hexToRgb(c);if(l>20||h>20||d>20)switch(e){case"color_cycle":{let[g,p,m]=z(t.hue,1,.8),u=(l+h+d)/(3*255);l=g*u,h=p*u,d=m*u;break}case"rainbow_text":{let g=(t.offset+a/i)%1,[p,m,u]=z(g,1,.8),E=(l+h+d)/(3*255);l=p*E,h=m*E,d=u*E;break}case"neon":{let g=this._hexToRgb(t.baseColor||"#ff00ff"),p=t.glowIntensity||.5;if(l=g[0]*p,h=g[1]*p,d=g[2]*p,p>.8){let m=(p-.8)*5;l=l+(255-l)*m*.3,h=h+(255-h)*m*.3,d=d+(255-d)*m*.3}break}}this.renderer.setPixel(a,n,[l,h,d])}}_hexToRgb(e){if(!e||e==="#111"||e==="#000")return[17,17,17];if(e==="#050505")return[5,5,5];let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:[17,17,17]}};var f={TEXT:"text",AMBIENT:"ambient",COLOR:"color"},_={fixed:{category:f.TEXT,name:"Fixed",description:"Static display"},scroll_ltr:{category:f.TEXT,name:"Scroll Left",description:"Text scrolls left to right"},scroll_rtl:{category:f.TEXT,name:"Scroll Right",description:"Text scrolls right to left"},blink:{category:f.TEXT,name:"Blink",description:"Text blinks on/off"},breeze:{category:f.TEXT,name:"Breeze",description:"Gentle wave brightness"},snow:{category:f.TEXT,name:"Snow",description:"Sparkle effect"},laser:{category:f.TEXT,name:"Laser",description:"Scanning beam"},fade:{category:f.TEXT,name:"Fade",description:"Fade in/out"},typewriter:{category:f.TEXT,name:"Typewriter",description:"Characters appear one by one"},bounce:{category:f.TEXT,name:"Bounce",description:"Text bounces back and forth"},sparkle:{category:f.TEXT,name:"Sparkle",description:"Random sparkle overlay"},rainbow:{category:f.AMBIENT,name:"Rainbow",description:"HSV rainbow gradient"},matrix:{category:f.AMBIENT,name:"Matrix",description:"Digital rain effect"},plasma:{category:f.AMBIENT,name:"Plasma",description:"Classic plasma waves"},gradient:{category:f.AMBIENT,name:"Gradient",description:"Moving color gradients"},fire:{category:f.AMBIENT,name:"Fire",description:"Fire/flame simulation"},water:{category:f.AMBIENT,name:"Water",description:"Ripple/wave effect"},stars:{category:f.AMBIENT,name:"Stars",description:"Twinkling starfield"},confetti:{category:f.AMBIENT,name:"Confetti",description:"Falling colored particles"},color_cycle:{category:f.COLOR,name:"Color Cycle",description:"Cycle through colors"},rainbow_text:{category:f.COLOR,name:"Rainbow Text",description:"Rainbow gradient on text"},neon:{category:f.COLOR,name:"Neon",description:"Pulsing neon glow"}},I=class{constructor(e){this.renderer=e,this.textEffects=new L(e),this.ambientEffects=new P(e),this.colorEffects=new R(e),this.currentEffect="fixed",this.effectState={}}getEffectInfo(e){return _[e]||_.fixed}getEffectsByCategory(e){return Object.entries(_).filter(([t,r])=>r.category===e).map(([t,r])=>({name:t,...r}))}initEffect(e,t={}){let r=this.getEffectInfo(e);switch(this.currentEffect=e,this.effectState={tick:0,...t},r.category){case f.TEXT:this.textEffects.init(e,this.effectState);break;case f.AMBIENT:this.ambientEffects.init(e,this.effectState);break;case f.COLOR:this.colorEffects.init(e,this.effectState);break}return this.effectState}step(){let e=this.getEffectInfo(this.currentEffect);switch(this.effectState.tick=(this.effectState.tick||0)+1,e.category){case f.TEXT:this.textEffects.step(this.currentEffect,this.effectState);break;case f.AMBIENT:this.ambientEffects.step(this.currentEffect,this.effectState);break;case f.COLOR:this.colorEffects.step(this.currentEffect,this.effectState);break}}render(e,t,r){switch(this.getEffectInfo(this.currentEffect).category){case f.AMBIENT:this.ambientEffects.render(this.currentEffect,this.effectState);break;case f.TEXT:this.textEffects.render(this.currentEffect,this.effectState,e,t,r);break;case f.COLOR:this.colorEffects.render(this.currentEffect,this.effectState,e);break}}isAmbient(e){return this.getEffectInfo(e).category===f.AMBIENT}needsAnimation(e){return e!=="fixed"}},at=Object.entries(_).filter(([x,e])=>e.category===f.TEXT).map(([x])=>x),ct=Object.entries(_).filter(([x,e])=>e.category===f.AMBIENT).map(([x])=>x),lt=Object.entries(_).filter(([x,e])=>e.category===f.COLOR).map(([x])=>x),dt=Object.keys(_);var F=class{constructor(e,t={}){this.container=e,this.width=t.width||64,this.height=t.height||16,this.pixelGap=t.pixelGap||.1,this.buffer=[],this.prevBuffer=[],this._initBuffer(),this._colorPixels=[],this._extendedColorPixels=[],this.extendedWidth=this.width,this.effect="fixed",this.speed=50,this.animationId=null,this.lastFrameTime=0,this._isRunning=!1,this.pixelElements=[],this.svgCreated=!1,this._svg=null,this.effectManager=new I(this)}_initBuffer(){this.buffer=[],this.prevBuffer=[];for(let e=0;e<this.width*this.height;e++)this.buffer.push([0,0,0]),this.prevBuffer.push([-1,-1,-1])}_createSvg(){let t=100/this.width,r=t,i=this.height*r,s=this.pixelGap,o=document.createElementNS("http://www.w3.org/2000/svg","svg");o.setAttribute("viewBox",`0 0 100 ${i}`),o.setAttribute("preserveAspectRatio","xMidYMid meet"),o.style.width="100%",o.style.height="100%",o.style.display="block",this.pixelElements=[];for(let n=0;n<this.height;n++)for(let a=0;a<this.width;a++){let c=document.createElementNS("http://www.w3.org/2000/svg","rect");c.setAttribute("x",a*t),c.setAttribute("y",n*r),c.setAttribute("width",t-s),c.setAttribute("height",r-s),c.setAttribute("rx","0.3"),c.setAttribute("fill","rgb(17, 17, 17)"),o.appendChild(c),this.pixelElements.push(c)}this.container&&this.container.isConnected!==!1&&(this.container.innerHTML="",this.container.appendChild(o)),this._svg=o,this.svgCreated=!0}_ensureSvgInContainer(){return this.container?this._svg&&this._svg.parentNode===this.container?!0:this._svg&&this.container.isConnected!==!1?(this.container.innerHTML="",this.container.appendChild(this._svg),!0):!1:!1}setPixel(e,t,r){if(e>=0&&e<this.width&&t>=0&&t<this.height){let i=t*this.width+e;i<this.buffer.length&&(this.buffer[i]=r)}}clear(){for(let e=0;e<this.buffer.length;e++)this.buffer[e]=[0,0,0]}flush(){this.svgCreated?this._ensureSvgInContainer()||this._createSvg():this._createSvg();for(let e=0;e<this.buffer.length;e++){let t=this.buffer[e],r=this.prevBuffer[e];if(!t||!Array.isArray(t))continue;if(!r||!Array.isArray(r)){this.prevBuffer[e]=[-1,-1,-1];continue}let[i,s,o]=t,[n,a,c]=r;if(i!==n||s!==a||o!==c){let l=this.pixelElements[e];if(l){let h=i>20||s>20||o>20;l.setAttribute("fill",`rgb(${Math.round(i)}, ${Math.round(s)}, ${Math.round(o)})`),h?l.style.filter=`drop-shadow(0 0 2px rgb(${Math.round(i)}, ${Math.round(s)}, ${Math.round(o)}))`:l.style.filter=""}this.prevBuffer[e]=[i,s,o]}}}setData(e,t=null,r=null){this._colorPixels=e||[],t?(this._extendedColorPixels=t,this.extendedWidth=r||this.width):(this._extendedColorPixels=e||[],this.extendedWidth=this.width)}setEffect(e,t=50){let r=this._isRunning;this.effect!==e&&(this.effect=e,this.effectManager.initEffect(e,{speed:t})),this.speed=t,r&&e!=="fixed"&&this.start()}start(){this._isRunning||(this._isRunning=!0,this.lastFrameTime=performance.now(),this._animate())}stop(){this._isRunning=!1,this.animationId&&(cancelAnimationFrame(this.animationId),this.animationId=null)}get isRunning(){return this._isRunning}_animate(){if(!this._isRunning)return;let e=performance.now(),t=500-(this.speed-1)*4.7;e-this.lastFrameTime>=t&&(this.lastFrameTime=e,this.effectManager.step()),this._renderFrame(),this.animationId=requestAnimationFrame(()=>this._animate())}_renderFrame(){this.effectManager.render(this._colorPixels,this._extendedColorPixels,this.extendedWidth),this.flush()}renderStatic(){this.svgCreated||this._createSvg(),this._renderFrame()}setDimensions(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.extendedWidth=e,this._initBuffer(),this.svgCreated=!1,this.effectManager=new I(this),this.effect!=="fixed"&&this.effectManager.initEffect(this.effect,{speed:this.speed}))}setContainer(e){e!==this.container&&(this.container=e,this._svg&&e&&(e.innerHTML="",e.appendChild(this._svg)))}destroy(){this.stop(),this.pixelElements=[],this._svg=null,this.svgCreated=!1}};function j(x,e,t,r=1){let s=100/x,o=s,n=e*o,a=r*.1,c="";for(let l=0;l<e;l++)for(let h=0;h<x;h++){let d=t[l*x+h]||"#111",g=d!=="#111"&&d!=="#000"&&d!=="#1a1a1a"&&d!=="#050505"?`filter:drop-shadow(0 0 2px ${d});`:"";c+=`<rect x="${h*s}" y="${l*o}" width="${s-a}" height="${o-a}" fill="${d}" rx="0.3" style="${g}"/>`}return`
    <svg viewBox="0 0 100 ${n}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
      ${c}
    </svg>`}var V="iPIXEL_DisplayState",U={text:"",mode:"text",effect:"fixed",speed:50,fgColor:"#ff6600",bgColor:"#000000",lastUpdate:0};function J(){try{let x=localStorage.getItem(V);if(x)return JSON.parse(x)}catch(x){console.warn("iPIXEL: Could not load saved state",x)}return{...U}}function Y(x){try{localStorage.setItem(V,JSON.stringify(x))}catch(e){console.warn("iPIXEL: Could not save state",e)}}window.iPIXELDisplayState||(window.iPIXELDisplayState=J());function G(){return window.iPIXELDisplayState}function M(x){return window.iPIXELDisplayState={...window.iPIXELDisplayState,...x,lastUpdate:Date.now()},Y(window.iPIXELDisplayState),window.dispatchEvent(new CustomEvent("ipixel-display-update",{detail:window.iPIXELDisplayState})),window.iPIXELDisplayState}var A=new Map,$=class extends k{constructor(){super(),this._renderer=null,this._displayContainer=null,this._lastState=null,this._cachedResolution=null,this._rendererId=null,this._handleDisplayUpdate=e=>{this._updateDisplay(e.detail)},window.addEventListener("ipixel-display-update",this._handleDisplayUpdate)}connectedCallback(){this._rendererId||(this._rendererId=`renderer_${Date.now()}_${Math.random().toString(36).substr(2,9)}`),A.has(this._rendererId)&&(this._renderer=A.get(this._rendererId))}disconnectedCallback(){window.removeEventListener("ipixel-display-update",this._handleDisplayUpdate),this._renderer&&this._rendererId&&(this._renderer.stop(),A.set(this._rendererId,this._renderer))}_getResolutionCached(){let[e,t]=this.getResolution();if(e>0&&t>0&&e!==64){this._cachedResolution=[e,t];try{localStorage.setItem("iPIXEL_Resolution",JSON.stringify([e,t]))}catch{}}if(this._cachedResolution)return this._cachedResolution;try{let r=localStorage.getItem("iPIXEL_Resolution");if(r){let i=JSON.parse(r);if(Array.isArray(i)&&i.length===2)return this._cachedResolution=i,i}}catch{}return this._config?.width&&this._config?.height?[this._config.width,this._config.height]:[e||64,t||16]}_updateDisplay(e){if(!this._displayContainer)return;let[t,r]=this._getResolutionCached(),i=this.isOn();if(this._renderer?(this._renderer.setContainer(this._displayContainer),(this._renderer.width!==t||this._renderer.height!==r)&&this._renderer.setDimensions(t,r)):(this._renderer=new F(this._displayContainer,{width:t,height:r}),this._rendererId&&A.set(this._rendererId,this._renderer)),!i){this._renderer.stop();let p=T("",t,r,"#111","#050505");this._displayContainer.innerHTML=j(t,r,p);return}let s=e?.text||"",o=e?.effect||"fixed",n=e?.speed||50,a=e?.fgColor||"#ff6600",c=e?.bgColor||"#111",l=e?.mode||"text",h=s,d=a;if(l==="clock"?(h=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!1}),d="#00ff88"):l==="gif"?(h="GIF",d="#ff44ff"):l==="rhythm"&&(h="***",d="#44aaff"),_[o]?.category==="ambient")this._renderer.setData([],[],t);else{let p=h.length*6;if((o==="scroll_ltr"||o==="scroll_rtl"||o==="bounce")&&p>t){let{pixels:u,width:E}=N(h,t,r,d,c),w=T(h,t,r,d,c);this._renderer.setData(w,u,E)}else{let u=T(h,t,r,d,c);this._renderer.setData(u)}}this._renderer.setEffect(o,n),o==="fixed"?(this._renderer.stop(),this._renderer.renderStatic()):this._renderer.start()}render(){if(!this._hass)return;let[e,t]=this._getResolutionCached(),r=this.isOn(),i=this._config.name||this.getEntity()?.attributes?.friendly_name||"iPIXEL Display",s=G(),n=this.getEntity()?.state||"",c=this.getRelatedEntity("select","_mode")?.state||s.mode||"text",l=s.text||n,h=s.effect||"fixed",d=s.speed||50,b=s.fgColor||"#ff6600",g=s.bgColor||"#111",m=_[h]?.category==="ambient",u=Object.entries(_).filter(([v,y])=>y.category==="text").map(([v,y])=>`<option value="${v}">${y.name}</option>`).join(""),E=Object.entries(_).filter(([v,y])=>y.category==="ambient").map(([v,y])=>`<option value="${v}">${y.name}</option>`).join(""),w=Object.entries(_).filter(([v,y])=>y.category==="color").map(([v,y])=>`<option value="${v}">${y.name}</option>`).join("");this.shadowRoot.innerHTML=`
      <style>${C}
        .display-container { background: #000; border-radius: 8px; padding: 8px; border: 2px solid #222; }
        .display-screen {
          background: #000;
          border-radius: 4px;
          overflow: hidden;
          min-height: 60px;
        }
        .display-footer { display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75em; opacity: 0.6; }
        .mode-badge { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; text-transform: capitalize; }
        .effect-badge { background: rgba(100,149,237,0.2); padding: 2px 6px; border-radius: 3px; margin-left: 4px; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">
              <span class="status-dot ${r?"":"off"}"></span>
              ${i}
            </div>
            <button class="icon-btn ${r?"active":""}" id="power-btn">
              <svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>
            </button>
          </div>
          <div class="display-container">
            <div class="display-screen" id="display-screen"></div>
            <div class="display-footer">
              <span>${e} x ${t}</span>
              <span>
                <span class="mode-badge">${r?c:"Off"}</span>
                ${r&&h!=="fixed"?`<span class="effect-badge">${_[h]?.name||h}</span>`:""}
              </span>
            </div>
          </div>
        </div>
      </ha-card>`,this._displayContainer=this.shadowRoot.getElementById("display-screen"),this._updateDisplay({text:l,effect:h,speed:d,fgColor:b,bgColor:g,mode:c}),this._attachPowerButton()}_attachPowerButton(){this.shadowRoot.getElementById("power-btn")?.addEventListener("click",()=>{let e=this._switchEntityId;if(!e){let t=this.getRelatedEntity("switch");t&&(this._switchEntityId=t.entity_id,e=t.entity_id)}if(e&&this._hass.states[e])this._hass.callService("switch","toggle",{entity_id:e});else{let t=Object.keys(this._hass.states).filter(s=>s.startsWith("switch.")),r=this._config.entity?.replace(/^[^.]+\./,"").replace(/_?(text|display|gif_url)$/i,"")||"",i=t.find(s=>s.includes(r.substring(0,10)));i?(this._switchEntityId=i,this._hass.callService("switch","toggle",{entity_id:i})):console.warn("iPIXEL: No switch found. Entity:",this._config.entity,"Available:",t)}})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var B=class extends k{render(){if(!this._hass)return;let e=this.isOn();this.shadowRoot.innerHTML=`
      <style>${C}</style>
      <ha-card>
        <div class="card-content">
          <div class="section-title">Quick Actions</div>
          <div class="control-row">
            <div class="button-grid button-grid-4">
              <button class="icon-btn ${e?"active":""}" data-action="power" title="Power">
                <svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>
              </button>
              <button class="icon-btn" data-action="clear" title="Clear">
                <svg viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
              </button>
              <button class="icon-btn" data-action="clock" title="Clock">
                <svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/></svg>
              </button>
              <button class="icon-btn" data-action="sync" title="Sync Time">
                <svg viewBox="0 0 24 24"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4M18.2,7.27L19.62,5.85C18.27,4.5 16.5,3.5 14.5,3.13V5.17C15.86,5.5 17.08,6.23 18.2,7.27M20,12H22A10,10 0 0,0 12,2V4A8,8 0 0,1 20,12M5.8,16.73L4.38,18.15C5.73,19.5 7.5,20.5 9.5,20.87V18.83C8.14,18.5 6.92,17.77 5.8,16.73M4,12H2A10,10 0 0,0 12,22V20A8,8 0 0,1 4,12Z"/></svg>
              </button>
            </div>
          </div>
          <div class="section-title">Brightness</div>
          <div class="control-row">
            <div class="slider-row">
              <input type="range" class="slider" id="brightness" min="1" max="100" value="50">
              <span class="slider-value" id="brightness-val">50%</span>
            </div>
          </div>
          <div class="section-title">Display Mode</div>
          <div class="control-row">
            <div class="button-grid button-grid-3">
              <button class="mode-btn" data-mode="textimage">Text+Image</button>
              <button class="mode-btn" data-mode="text">Text</button>
              <button class="mode-btn" data-mode="clock">Clock</button>
              <button class="mode-btn" data-mode="gif">GIF</button>
              <button class="mode-btn" data-mode="rhythm">Rhythm</button>
            </div>
          </div>
          <div class="section-title">Orientation</div>
          <div class="control-row">
            <select class="dropdown" id="orientation">
              <option value="0">0\xB0 (Normal)</option>
              <option value="90">90\xB0</option>
              <option value="180">180\xB0</option>
              <option value="270">270\xB0</option>
            </select>
          </div>
        </div>
      </ha-card>`,this._attachControlListeners()}_attachControlListeners(){this.shadowRoot.querySelectorAll("[data-action]").forEach(t=>{t.addEventListener("click",r=>{let i=r.currentTarget.dataset.action;if(i==="power"){let s=this.getRelatedEntity("switch");s&&this._hass.callService("switch","toggle",{entity_id:s.entity_id})}else i==="clear"?(M({text:"",mode:"text",effect:"fixed",speed:50,fgColor:"#ff6600",bgColor:"#000000"}),this.callService("ipixel_color","clear_pixels")):i==="clock"?(M({text:"",mode:"clock",effect:"fixed",speed:50,fgColor:"#00ff88",bgColor:"#000000"}),this.callService("ipixel_color","set_clock_mode",{style:1})):i==="sync"&&this.callService("ipixel_color","sync_time")})});let e=this.shadowRoot.getElementById("brightness");e&&(e.style.setProperty("--value",`${e.value}%`),e.addEventListener("input",t=>{t.target.style.setProperty("--value",`${t.target.value}%`),this.shadowRoot.getElementById("brightness-val").textContent=`${t.target.value}%`}),e.addEventListener("change",t=>{this.callService("ipixel_color","set_brightness",{level:parseInt(t.target.value)})})),this.shadowRoot.querySelectorAll("[data-mode]").forEach(t=>{t.addEventListener("click",r=>{let i=r.currentTarget.dataset.mode,s=this.getRelatedEntity("select","_mode");s&&this._hass.callService("select","select_option",{entity_id:s.entity_id,option:i}),M({mode:i,fgColor:{text:"#ff6600",textimage:"#ff6600",clock:"#00ff88",gif:"#ff44ff",rhythm:"#44aaff"}[i]||"#ff6600",text:i==="clock"?"":window.iPIXELDisplayState?.text||""}),this.shadowRoot.querySelectorAll("[data-mode]").forEach(n=>n.classList.remove("active")),r.currentTarget.classList.add("active")})}),this.shadowRoot.getElementById("orientation")?.addEventListener("change",t=>{let r=this.getRelatedEntity("select","_orientation");r&&this._hass.callService("select","select_option",{entity_id:r.entity_id,option:t.target.value})})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var O=class extends k{_buildEffectOptions(){let e=Object.entries(_).filter(([i,s])=>s.category===f.TEXT).map(([i,s])=>`<option value="${i}">${s.name}</option>`).join(""),t=Object.entries(_).filter(([i,s])=>s.category===f.COLOR).map(([i,s])=>`<option value="${i}">${s.name}</option>`).join(""),r=Object.entries(_).filter(([i,s])=>s.category===f.AMBIENT).map(([i,s])=>`<option value="${i}">${s.name}</option>`).join("");return`
      <optgroup label="Text Effects">
        ${e}
      </optgroup>
      <optgroup label="Color Effects">
        ${t}
      </optgroup>
      <optgroup label="Ambient Effects">
        ${r}
      </optgroup>
    `}render(){this._hass&&(this.shadowRoot.innerHTML=`
      <style>${C}
        .input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .input-row .text-input { flex: 1; }
        select optgroup { font-weight: bold; color: var(--primary-text-color, #fff); }
        select option { font-weight: normal; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="section-title">Display Text</div>
          <div class="input-row">
            <input type="text" class="text-input" id="text-input" placeholder="Enter text to display...">
            <button class="btn btn-primary" id="send-btn">Send</button>
          </div>
          <div class="section-title">Effect</div>
          <div class="control-row">
            <select class="dropdown" id="effect">
              ${this._buildEffectOptions()}
            </select>
          </div>
          <div class="section-title">Speed</div>
          <div class="control-row">
            <div class="slider-row">
              <input type="range" class="slider" id="speed" min="1" max="100" value="50">
              <span class="slider-value" id="speed-val">50</span>
            </div>
          </div>
          <div class="section-title">Colors</div>
          <div class="control-row">
            <div class="color-row">
              <span style="font-size: 0.85em;">Text:</span>
              <input type="color" class="color-picker" id="text-color" value="#ff6600">
              <span style="font-size: 0.85em; margin-left: 16px;">Background:</span>
              <input type="color" class="color-picker" id="bg-color" value="#000000">
            </div>
          </div>
        </div>
      </ha-card>`,this._attachListeners())}_getFormValues(){return{text:this.shadowRoot.getElementById("text-input")?.value||"",effect:this.shadowRoot.getElementById("effect")?.value||"fixed",speed:parseInt(this.shadowRoot.getElementById("speed")?.value||"50"),fgColor:this.shadowRoot.getElementById("text-color")?.value||"#ff6600",bgColor:this.shadowRoot.getElementById("bg-color")?.value||"#000000"}}_updatePreview(){let{text:e,effect:t,speed:r,fgColor:i,bgColor:s}=this._getFormValues();M({text:e||"Preview",mode:"text",effect:t,speed:r,fgColor:i,bgColor:s})}_attachListeners(){let e=this.shadowRoot.getElementById("speed");e&&(e.style.setProperty("--value",`${e.value}%`),e.addEventListener("input",t=>{t.target.style.setProperty("--value",`${t.target.value}%`),this.shadowRoot.getElementById("speed-val").textContent=t.target.value,this._updatePreview()})),this.shadowRoot.getElementById("effect")?.addEventListener("change",()=>{this._updatePreview()}),this.shadowRoot.getElementById("text-color")?.addEventListener("input",()=>{this._updatePreview()}),this.shadowRoot.getElementById("bg-color")?.addEventListener("input",()=>{this._updatePreview()}),this.shadowRoot.getElementById("text-input")?.addEventListener("input",()=>{this._updatePreview()}),this.shadowRoot.getElementById("send-btn")?.addEventListener("click",()=>{let{text:t,effect:r,speed:i,fgColor:s,bgColor:o}=this._getFormValues();t&&(M({text:t,mode:"text",effect:r,speed:i,fgColor:s,bgColor:o}),this._config.entity&&this._hass.callService("text","set_value",{entity_id:this._config.entity,value:t}),this.callService("ipixel_color","display_text",{text:t,effect:r,speed:i,color_fg:this.hexToRgb(s),color_bg:this.hexToRgb(o)}))})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var X=class extends k{render(){if(!this._hass)return;let e=this._config.items||[];this.shadowRoot.innerHTML=`
      <style>${C}
        .playlist-actions { display: flex; gap: 8px; margin-top: 12px; }
        .playlist-actions .btn { flex: 1; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header"><div class="card-title">Playlist</div></div>
          <div id="playlist-items">
            ${e.length===0?'<div class="empty-state">No playlist items yet</div>':e.map((t,r)=>`
                <div class="list-item">
                  <div class="list-item-info">
                    <div class="list-item-name">${t.name||`Item ${r+1}`}</div>
                    <div class="list-item-meta">${t.mode||"text"} - ${(t.duration_ms||5e3)/1e3}s</div>
                  </div>
                  <div class="list-item-actions">
                    <button class="icon-btn" style="width:28px;height:28px;">
                      <svg viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
                    </button>
                  </div>
                </div>`).join("")}
          </div>
          <div class="playlist-actions">
            <button class="btn btn-success" id="start-btn">\u25B6 Start</button>
            <button class="btn btn-danger" id="stop-btn">\u25A0 Stop</button>
            <button class="btn btn-secondary" id="add-btn">+ Add</button>
          </div>
        </div>
      </ha-card>`,this.shadowRoot.getElementById("start-btn")?.addEventListener("click",()=>{this.callService("ipixel_color","start_playlist")}),this.shadowRoot.getElementById("stop-btn")?.addEventListener("click",()=>{this.callService("ipixel_color","stop_playlist")})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var D=class extends k{render(){if(!this._hass)return;let e=new Date,t=(e.getHours()*60+e.getMinutes())/1440*100;this.shadowRoot.innerHTML=`
      <style>${C}
        .timeline { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
        .timeline-header { display: flex; justify-content: space-between; font-size: 0.7em; opacity: 0.5; margin-bottom: 6px; }
        .timeline-bar { height: 24px; background: rgba(255,255,255,0.1); border-radius: 4px; position: relative; overflow: hidden; }
        .timeline-now { position: absolute; width: 2px; height: 100%; background: #f44336; left: ${t}%; }
        .power-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .power-row label { font-size: 0.85em; }
        .power-row input[type="time"] { padding: 6px 10px; background: rgba(255,255,255,0.08); border: 1px solid var(--ipixel-border); border-radius: 4px; color: inherit; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="section-title">Today's Timeline</div>
          <div class="timeline">
            <div class="timeline-header"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
            <div class="timeline-bar"><div class="timeline-now"></div></div>
          </div>
          <div class="section-title">Power Schedule</div>
          <div class="control-row">
            <div class="power-row">
              <label>On:</label><input type="time" id="power-on" value="07:00">
              <label>Off:</label><input type="time" id="power-off" value="22:00">
              <button class="btn btn-primary" id="save-power">Save</button>
            </div>
          </div>
          <div class="section-title">Time Slots</div>
          <div id="time-slots"><div class="empty-state">No time slots configured</div></div>
          <button class="btn btn-secondary" id="add-slot" style="width: 100%; margin-top: 8px;">+ Add Time Slot</button>
        </div>
      </ha-card>`,this.shadowRoot.getElementById("save-power")?.addEventListener("click",()=>{this.callService("ipixel_color","set_power_schedule",{enabled:!0,on_time:this.shadowRoot.getElementById("power-on")?.value,off_time:this.shadowRoot.getElementById("power-off")?.value})})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var H=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}setConfig(e){this._config=e,this.render()}set hass(e){this._hass=e,this.render()}render(){if(!this._hass)return;let e=Object.keys(this._hass.states).filter(t=>t.startsWith("text.")||t.startsWith("switch.")).sort();this.shadowRoot.innerHTML=`
      <style>
        .row { margin-bottom: 12px; }
        label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 0.9em; }
        select, input {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 4px;
          background: var(--card-background-color);
          color: inherit;
          box-sizing: border-box;
        }
      </style>
      <div class="row">
        <label>Entity</label>
        <select id="entity">
          <option value="">Select entity</option>
          ${e.map(t=>`
            <option value="${t}" ${this._config?.entity===t?"selected":""}>
              ${this._hass.states[t]?.attributes?.friendly_name||t}
            </option>
          `).join("")}
        </select>
      </div>
      <div class="row">
        <label>Name (optional)</label>
        <input type="text" id="name" value="${this._config?.name||""}" placeholder="Display name">
      </div>`,this.shadowRoot.querySelectorAll("select, input").forEach(t=>{t.addEventListener("change",()=>this.fireConfig())})}fireConfig(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:{type:this._config?.type||"custom:ipixel-display-card",entity:this.shadowRoot.getElementById("entity")?.value,name:this.shadowRoot.getElementById("name")?.value||void 0}},bubbles:!0,composed:!0}))}};customElements.define("ipixel-display-card",$);customElements.define("ipixel-controls-card",B);customElements.define("ipixel-text-card",O);customElements.define("ipixel-playlist-card",X);customElements.define("ipixel-schedule-card",D);customElements.define("ipixel-simple-editor",H);window.customCards=window.customCards||[];[{type:"ipixel-display-card",name:"iPIXEL Display",description:"LED matrix preview with power control"},{type:"ipixel-controls-card",name:"iPIXEL Controls",description:"Brightness, mode, and orientation controls"},{type:"ipixel-text-card",name:"iPIXEL Text",description:"Text input with effects and colors"},{type:"ipixel-playlist-card",name:"iPIXEL Playlist",description:"Playlist management"},{type:"ipixel-schedule-card",name:"iPIXEL Schedule",description:"Power schedule and time slots"}].forEach(x=>window.customCards.push({...x,preview:!0,documentationURL:"https://github.com/cagcoach/ha-ipixel-color"}));console.info(`%c iPIXEL Cards %c ${W} `,"background:#03a9f4;color:#fff;padding:2px 6px;border-radius:4px 0 0 4px;","background:#333;color:#fff;padding:2px 6px;border-radius:0 4px 4px 0;");})();

(()=>{var $="2.9.0";var g=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._config={},this._hass=null}set hass(e){this._hass=e,this.render()}setConfig(e){if(!e.entity)throw new Error("Please define an entity");this._config=e,this.render()}getEntity(){return!this._hass||!this._config.entity?null:this._hass.states[this._config.entity]}getRelatedEntity(e,t=""){if(!this._hass||!this._config.entity)return null;let i=this._config.entity.replace(/^[^.]+\./,"").replace(/_?(text|display|gif_url)$/i,""),s=`${e}.${i}${t}`;if(this._hass.states[s])return this._hass.states[s];let o=Object.keys(this._hass.states).filter(r=>{if(!r.startsWith(`${e}.`))return!1;let a=r.replace(/^[^.]+\./,"");return a.includes(i)||i.includes(a.replace(t,""))});if(t){let r=o.find(a=>a.endsWith(t));if(r)return this._hass.states[r]}else{let r=o.sort((a,c)=>a.length-c.length);if(r.length>0)return this._hass.states[r[0]]}return o.length>0?this._hass.states[o[0]]:null}async callService(e,t,i={}){if(this._hass)try{await this._hass.callService(e,t,i)}catch(s){console.error(`iPIXEL service call failed: ${e}.${t}`,s)}}getResolution(){let e=this.getRelatedEntity("sensor","_width")||this._hass?.states["sensor.display_width"],t=this.getRelatedEntity("sensor","_height")||this._hass?.states["sensor.display_height"];if(e&&t){let i=parseInt(e.state),s=parseInt(t.state);if(!isNaN(i)&&!isNaN(s)&&i>0&&s>0)return[i,s]}return[64,16]}isOn(){return this.getRelatedEntity("switch")?.state==="on"}hexToRgb(e){let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:[255,255,255]}render(){}getCardSize(){return 2}};var m=`
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
`;var _={A:[124,18,17,18,124],B:[127,73,73,73,54],C:[62,65,65,65,34],D:[127,65,65,34,28],E:[127,73,73,73,65],F:[127,9,9,9,1],G:[62,65,73,73,122],H:[127,8,8,8,127],I:[0,65,127,65,0],J:[32,64,65,63,1],K:[127,8,20,34,65],L:[127,64,64,64,64],M:[127,2,12,2,127],N:[127,4,8,16,127],O:[62,65,65,65,62],P:[127,9,9,9,6],Q:[62,65,81,33,94],R:[127,9,25,41,70],S:[70,73,73,73,49],T:[1,1,127,1,1],U:[63,64,64,64,63],V:[31,32,64,32,31],W:[63,64,56,64,63],X:[99,20,8,20,99],Y:[7,8,112,8,7],Z:[97,81,73,69,67],a:[32,84,84,84,120],b:[127,72,68,68,56],c:[56,68,68,68,32],d:[56,68,68,72,127],e:[56,84,84,84,24],f:[8,126,9,1,2],g:[12,82,82,82,62],h:[127,8,4,4,120],i:[0,68,125,64,0],j:[32,64,68,61,0],k:[127,16,40,68,0],l:[0,65,127,64,0],m:[124,4,24,4,120],n:[124,8,4,4,120],o:[56,68,68,68,56],p:[124,20,20,20,8],q:[8,20,20,24,124],r:[124,8,4,4,8],s:[72,84,84,84,32],t:[4,63,68,64,32],u:[60,64,64,32,124],v:[28,32,64,32,28],w:[60,64,48,64,60],x:[68,40,16,40,68],y:[12,80,80,80,60],z:[68,100,84,76,68],0:[62,81,73,69,62],1:[0,66,127,64,0],2:[66,97,81,73,70],3:[33,65,69,75,49],4:[24,20,18,127,16],5:[39,69,69,69,57],6:[60,74,73,73,48],7:[1,113,9,5,3],8:[54,73,73,73,54],9:[6,73,73,41,30]," ":[0,0,0,0,0],".":[0,96,96,0,0],",":[0,128,96,0,0],":":[0,54,54,0,0],";":[0,128,54,0,0],"!":[0,0,95,0,0],"?":[2,1,81,9,6],"-":[8,8,8,8,8],"+":[8,8,62,8,8],"=":[20,20,20,20,20],_:[64,64,64,64,64],"/":[32,16,8,4,2],"\\":[2,4,8,16,32],"(":[0,28,34,65,0],")":[0,65,34,28,0],"[":[0,127,65,65,0],"]":[0,65,65,127,0],"<":[8,20,34,65,0],">":[0,65,34,20,8],"*":[20,8,62,8,20],"#":[20,127,20,127,20],"@":[62,65,93,85,30],"&":[54,73,85,34,80],"%":[35,19,8,100,98],$:[18,42,127,42,36],"'":[0,0,7,0,0],'"':[0,7,0,7,0],"`":[0,1,2,0,0],"^":[4,2,1,2,4],"~":[8,4,8,16,8]};function E(l,e,t,i="#ff6600",s="#111"){let o=[],c=Math.floor((t-7)/2);for(let n=0;n<t;n++)for(let f=0;f<e;f++)o.push(s);let d=l.length*6-1,x=Math.max(1,Math.floor((e-d)/2));for(let n of l){let f=_[n]||_[" "];for(let u=0;u<5;u++)for(let p=0;p<7;p++){let w=f[u]>>p&1,b=x+u,v=c+p;b>=0&&b<e&&v<t&&v>=0&&(o[v*e+b]=w?i:s)}x+=6}return o}function F(l,e,t,i="#ff6600",s="#111"){let a=Math.floor((t-7)/2),c=l.length*6,d=e+c+e,h=[];for(let n=0;n<t;n++)for(let f=0;f<d;f++)h.push(s);let x=e;for(let n of l){let f=_[n]||_[" "];for(let u=0;u<5;u++)for(let p=0;p<7;p++){let w=f[u]>>p&1,b=x+u,v=a+p;b>=0&&b<d&&v<t&&v>=0&&(h[v*d+b]=w?i:s)}x+=6}return{pixels:h,width:d}}var C=class{constructor(e,t={}){this.container=e,this.width=t.width||64,this.height=t.height||16,this.pixelGap=t.pixelGap||.1,this.buffer=[],this.prevBuffer=[],this._initBuffer(),this.extendedPixels=[],this.extendedWidth=this.width,this.offset=0,this.effect="fixed",this.speed=50,this.animationId=null,this.lastFrameTime=0,this.effectState={},this.pixelElements=[],this.svgCreated=!1}_initBuffer(){this.buffer=[],this.prevBuffer=[];for(let e=0;e<this.width*this.height;e++)this.buffer.push([0,0,0]),this.prevBuffer.push([-1,-1,-1])}_createSvg(){let t=100/this.width,i=t,s=this.height*i,o=this.pixelGap,r=document.createElementNS("http://www.w3.org/2000/svg","svg");r.setAttribute("viewBox",`0 0 100 ${s}`),r.setAttribute("preserveAspectRatio","xMidYMid meet"),r.style.width="100%",r.style.height="100%",r.style.display="block",this.pixelElements=[];for(let a=0;a<this.height;a++)for(let c=0;c<this.width;c++){let d=document.createElementNS("http://www.w3.org/2000/svg","rect");d.setAttribute("x",c*t),d.setAttribute("y",a*i),d.setAttribute("width",t-o),d.setAttribute("height",i-o),d.setAttribute("rx","0.3"),d.setAttribute("fill","rgb(17, 17, 17)"),r.appendChild(d),this.pixelElements.push(d)}this.container.innerHTML="",this.container.appendChild(r),this.svgCreated=!0}setPixel(e,t,i){if(e>=0&&e<this.width&&t>=0&&t<this.height){let s=t*this.width+e;this.buffer[s]=i}}clear(){for(let e=0;e<this.buffer.length;e++)this.buffer[e]=[0,0,0]}flush(){this.svgCreated||this._createSvg();for(let e=0;e<this.buffer.length;e++){let[t,i,s]=this.buffer[e],[o,r,a]=this.prevBuffer[e];if(t!==o||i!==r||s!==a){let c=this.pixelElements[e];if(c){let d=t>20||i>20||s>20;c.setAttribute("fill",`rgb(${Math.round(t)}, ${Math.round(i)}, ${Math.round(s)})`),d?c.style.filter=`drop-shadow(0 0 2px rgb(${t}, ${i}, ${s}))`:c.style.filter=""}this.prevBuffer[e]=[t,i,s]}}}setData(e,t=null,i=null){this._colorPixels=e,t?(this._extendedColorPixels=t,this.extendedWidth=i||this.width):(this._extendedColorPixels=e,this.extendedWidth=this.width)}_hexToRgb(e){if(!e||e==="#111"||e==="#000")return[17,17,17];if(e==="#050505")return[5,5,5];let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:[17,17,17]}setEffect(e,t=50){if(this.effect=e,this.speed=t,this.offset=0,this.effectState={},e==="snow"||e==="breeze"){this.effectState.phases=[];for(let i=0;i<this.width*this.height;i++)this.effectState.phases[i]=Math.random()*Math.PI*2}e==="blink"&&(this.effectState.visible=!0)}start(){this.animationId||(this.lastFrameTime=performance.now(),this._animate())}stop(){this.animationId&&(cancelAnimationFrame(this.animationId),this.animationId=null)}_animate(){let e=performance.now(),t=500-(this.speed-1)*4.7;e-this.lastFrameTime>=t&&(this.lastFrameTime=e,this._step()),this._renderFrame(),this.animationId=requestAnimationFrame(()=>this._animate())}_step(){this.effect==="scroll_ltr"?(this.offset-=1,this.offset<=-this.extendedWidth&&(this.offset=this.width)):this.effect==="scroll_rtl"?(this.offset+=1,this.offset>=this.extendedWidth&&(this.offset=-this.width)):this.effect==="blink"?this.effectState.visible=!this.effectState.visible:(this.effect==="snow"||this.effect==="breeze"||this.effect==="laser")&&(this.effectState.tick=(this.effectState.tick||0)+1)}_renderFrame(){let e=this._extendedColorPixels||this._colorPixels||[],t=this._colorPixels||[];for(let i=0;i<this.height;i++)for(let s=0;s<this.width;s++){let o;if(this.effect==="scroll_ltr"||this.effect==="scroll_rtl"){let h=s-this.offset;for(;h<0;)h+=this.extendedWidth;for(;h>=this.extendedWidth;)h-=this.extendedWidth;o=e[i*this.extendedWidth+h]||"#111"}else o=t[i*this.width+s]||"#111";let[r,a,c]=this._hexToRgb(o);if(r>20||a>20||c>20){if(this.effect==="blink")this.effectState.visible||(r=a=c=17);else if(this.effect==="snow"){let h=this.effectState.phases?.[i*this.width+s]||0,x=this.effectState.tick||0,n=.3+.7*Math.abs(Math.sin(h+x*.3));r*=n,a*=n,c*=n}else if(this.effect==="breeze"){let h=this.effectState.phases?.[i*this.width+s]||0,x=this.effectState.tick||0,n=.4+.6*Math.abs(Math.sin(h+x*.15+s*.2));r*=n,a*=n,c*=n}else if(this.effect==="laser"){let n=((this.effectState.tick||0)+s)%this.width<3?1:.3;r*=n,a*=n,c*=n}}this.setPixel(s,i,[r,a,c])}this.flush()}renderStatic(){this.svgCreated||this._createSvg(),this._renderFrame()}setDimensions(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this._initBuffer(),this.svgCreated=!1)}};function A(l,e,t,i=1){let o=100/l,r=o,a=e*r,c=i*.1,d="";for(let h=0;h<e;h++)for(let x=0;x<l;x++){let n=t[h*l+x]||"#111",u=n!=="#111"&&n!=="#000"&&n!=="#1a1a1a"&&n!=="#050505"?`filter:drop-shadow(0 0 2px ${n});`:"";d+=`<rect x="${x*o}" y="${h*r}" width="${o-c}" height="${r-c}" fill="${n}" rx="0.3" style="${u}"/>`}return`
    <svg viewBox="0 0 100 ${a}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
      ${d}
    </svg>`}var B="iPIXEL_DisplayState",M={text:"",mode:"text",effect:"fixed",speed:50,fgColor:"#ff6600",bgColor:"#000000",lastUpdate:0};function T(){try{let l=localStorage.getItem(B);if(l)return JSON.parse(l)}catch(l){console.warn("iPIXEL: Could not load saved state",l)}return{...M}}function H(l){try{localStorage.setItem(B,JSON.stringify(l))}catch(e){console.warn("iPIXEL: Could not save state",e)}}window.iPIXELDisplayState||(window.iPIXELDisplayState=T());function D(){return window.iPIXELDisplayState}function y(l){return window.iPIXELDisplayState={...window.iPIXELDisplayState,...l,lastUpdate:Date.now()},H(window.iPIXELDisplayState),window.dispatchEvent(new CustomEvent("ipixel-display-update",{detail:window.iPIXELDisplayState})),window.iPIXELDisplayState}var S=class extends g{constructor(){super(),this._renderer=null,this._displayContainer=null,this._lastState=null,this._handleDisplayUpdate=e=>{this._updateDisplay(e.detail)},window.addEventListener("ipixel-display-update",this._handleDisplayUpdate)}disconnectedCallback(){window.removeEventListener("ipixel-display-update",this._handleDisplayUpdate),this._renderer&&(this._renderer.stop(),this._renderer=null)}_updateDisplay(e){if(!this._renderer||!this._displayContainer)return;let[t,i]=this.getResolution();if(!this.isOn()){this._renderer.stop();let p=E("",t,i,"#111","#050505");this._displayContainer.innerHTML=A(t,i,p);return}let o=e?.text||"",r=e?.effect||"fixed",a=e?.speed||50,c=e?.fgColor||"#ff6600",d=e?.bgColor||"#111",h=e?.mode||"text",x=o,n=c;h==="clock"?(x=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!1}),n="#00ff88"):h==="gif"?(x="GIF",n="#ff44ff"):h==="rhythm"&&(x="***",n="#44aaff"),(this._renderer.width!==t||this._renderer.height!==i)&&(this._renderer.width=t,this._renderer.height=i);let f=x.length*6;if((r==="scroll_ltr"||r==="scroll_rtl")&&f>t){let{pixels:p,width:w}=F(x,t,i,n,d),b=E(x,t,i,n,d);this._renderer.setData(b,p,w)}else{let p=E(x,t,i,n,d);this._renderer.setData(p)}this._renderer.setEffect(r,a),r==="fixed"?(this._renderer.stop(),this._renderer.renderStatic()):this._renderer.start()}render(){if(!this._hass)return;let[e,t]=this.getResolution(),i=this.isOn(),s=this._config.name||this.getEntity()?.attributes?.friendly_name||"iPIXEL Display",o=D(),a=this.getEntity()?.state||"",d=this.getRelatedEntity("select","_mode")?.state||o.mode||"text",h=o.text||a,x=o.effect||"fixed",n=o.speed||50,f=o.fgColor||"#ff6600",u=o.bgColor||"#111";this.shadowRoot.innerHTML=`
      <style>${m}
        .display-container { background: #000; border-radius: 8px; padding: 8px; border: 2px solid #222; }
        .display-screen {
          background: #000;
          border-radius: 4px;
          overflow: hidden;
          min-height: 60px;
        }
        .display-footer { display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75em; opacity: 0.6; }
        .mode-badge { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; text-transform: capitalize; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">
              <span class="status-dot ${i?"":"off"}"></span>
              ${s}
            </div>
            <button class="icon-btn ${i?"active":""}" id="power-btn">
              <svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>
            </button>
          </div>
          <div class="display-container">
            <div class="display-screen" id="display-screen"></div>
            <div class="display-footer">
              <span>${e} x ${t}</span>
              <span class="mode-badge">${i?x!=="fixed"?x.replace("_"," "):d:"Off"}</span>
            </div>
          </div>
        </div>
      </ha-card>`,this._displayContainer=this.shadowRoot.getElementById("display-screen"),this._renderer?(this._renderer.container=this._displayContainer,this._renderer.width=e,this._renderer.height=t):this._renderer=new C(this._displayContainer,{width:e,height:t}),this._updateDisplay({text:h,effect:x,speed:n,fgColor:f,bgColor:u,mode:d}),this._attachPowerButton()}_attachPowerButton(){this.shadowRoot.getElementById("power-btn")?.addEventListener("click",()=>{let e=this._switchEntityId;if(!e){let t=this.getRelatedEntity("switch");t&&(this._switchEntityId=t.entity_id,e=t.entity_id)}if(e&&this._hass.states[e])this._hass.callService("switch","toggle",{entity_id:e});else{let t=Object.keys(this._hass.states).filter(o=>o.startsWith("switch.")),i=this._config.entity?.replace(/^[^.]+\./,"").replace(/_?(text|display|gif_url)$/i,"")||"",s=t.find(o=>o.includes(i.substring(0,10)));s?(this._switchEntityId=s,this._hass.callService("switch","toggle",{entity_id:s})):console.warn("iPIXEL: No switch found. Entity:",this._config.entity,"Available:",t)}})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var L=class extends g{render(){if(!this._hass)return;let e=this.isOn();this.shadowRoot.innerHTML=`
      <style>${m}</style>
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
      </ha-card>`,this._attachControlListeners()}_attachControlListeners(){this.shadowRoot.querySelectorAll("[data-action]").forEach(t=>{t.addEventListener("click",i=>{let s=i.currentTarget.dataset.action;if(s==="power"){let o=this.getRelatedEntity("switch");o&&this._hass.callService("switch","toggle",{entity_id:o.entity_id})}else s==="clear"?(y({text:"",mode:"text",effect:"fixed",speed:50,fgColor:"#ff6600",bgColor:"#000000"}),this.callService("ipixel_color","clear_pixels")):s==="clock"?(y({text:"",mode:"clock",effect:"fixed",speed:50,fgColor:"#00ff88",bgColor:"#000000"}),this.callService("ipixel_color","set_clock_mode",{style:1})):s==="sync"&&this.callService("ipixel_color","sync_time")})});let e=this.shadowRoot.getElementById("brightness");e&&(e.style.setProperty("--value",`${e.value}%`),e.addEventListener("input",t=>{t.target.style.setProperty("--value",`${t.target.value}%`),this.shadowRoot.getElementById("brightness-val").textContent=`${t.target.value}%`}),e.addEventListener("change",t=>{this.callService("ipixel_color","set_brightness",{level:parseInt(t.target.value)})})),this.shadowRoot.querySelectorAll("[data-mode]").forEach(t=>{t.addEventListener("click",i=>{let s=i.currentTarget.dataset.mode,o=this.getRelatedEntity("select","_mode");o&&this._hass.callService("select","select_option",{entity_id:o.entity_id,option:s}),y({mode:s,fgColor:{text:"#ff6600",textimage:"#ff6600",clock:"#00ff88",gif:"#ff44ff",rhythm:"#44aaff"}[s]||"#ff6600",text:s==="clock"?"":window.iPIXELDisplayState?.text||""}),this.shadowRoot.querySelectorAll("[data-mode]").forEach(a=>a.classList.remove("active")),i.currentTarget.classList.add("active")})}),this.shadowRoot.getElementById("orientation")?.addEventListener("change",t=>{let i=this.getRelatedEntity("select","_orientation");i&&this._hass.callService("select","select_option",{entity_id:i.entity_id,option:t.target.value})})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var I=class extends g{render(){this._hass&&(this.shadowRoot.innerHTML=`
      <style>${m}
        .input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .input-row .text-input { flex: 1; }
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
              <option value="fixed">Fixed</option>
              <option value="scroll_ltr" selected>Scroll Left to Right</option>
              <option value="scroll_rtl">Scroll Right to Left</option>
              <option value="blink">Blink</option>
              <option value="breeze">Breeze</option>
              <option value="snow">Snow</option>
              <option value="laser">Laser</option>
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
              <input type="color" class="color-picker" id="text-color" value="#ffffff">
              <span style="font-size: 0.85em; margin-left: 16px;">Background:</span>
              <input type="color" class="color-picker" id="bg-color" value="#000000">
            </div>
          </div>
        </div>
      </ha-card>`,this._attachListeners())}_attachListeners(){let e=this.shadowRoot.getElementById("speed");e&&(e.style.setProperty("--value",`${e.value}%`),e.addEventListener("input",t=>{t.target.style.setProperty("--value",`${t.target.value}%`),this.shadowRoot.getElementById("speed-val").textContent=t.target.value})),this.shadowRoot.getElementById("send-btn")?.addEventListener("click",()=>{let t=this.shadowRoot.getElementById("text-input")?.value,i=this.shadowRoot.getElementById("effect")?.value||"fixed",s=parseInt(this.shadowRoot.getElementById("speed")?.value||"50"),o=this.shadowRoot.getElementById("text-color")?.value||"#ff6600",r=this.shadowRoot.getElementById("bg-color")?.value||"#000000";t&&(y({text:t,mode:"text",effect:i,speed:s,fgColor:o,bgColor:r}),this._config.entity&&this._hass.callService("text","set_value",{entity_id:this._config.entity,value:t}),this.callService("ipixel_color","display_text",{text:t,effect:i,speed:s,color_fg:this.hexToRgb(o),color_bg:this.hexToRgb(r)}))})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var k=class extends g{render(){if(!this._hass)return;let e=this._config.items||[];this.shadowRoot.innerHTML=`
      <style>${m}
        .playlist-actions { display: flex; gap: 8px; margin-top: 12px; }
        .playlist-actions .btn { flex: 1; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header"><div class="card-title">Playlist</div></div>
          <div id="playlist-items">
            ${e.length===0?'<div class="empty-state">No playlist items yet</div>':e.map((t,i)=>`
                <div class="list-item">
                  <div class="list-item-info">
                    <div class="list-item-name">${t.name||`Item ${i+1}`}</div>
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
      </ha-card>`,this.shadowRoot.getElementById("start-btn")?.addEventListener("click",()=>{this.callService("ipixel_color","start_playlist")}),this.shadowRoot.getElementById("stop-btn")?.addEventListener("click",()=>{this.callService("ipixel_color","stop_playlist")})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var P=class extends g{render(){if(!this._hass)return;let e=new Date,t=(e.getHours()*60+e.getMinutes())/1440*100;this.shadowRoot.innerHTML=`
      <style>${m}
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
      </ha-card>`,this.shadowRoot.getElementById("save-power")?.addEventListener("click",()=>{this.callService("ipixel_color","set_power_schedule",{enabled:!0,on_time:this.shadowRoot.getElementById("power-on")?.value,off_time:this.shadowRoot.getElementById("power-off")?.value})})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var R=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}setConfig(e){this._config=e,this.render()}set hass(e){this._hass=e,this.render()}render(){if(!this._hass)return;let e=Object.keys(this._hass.states).filter(t=>t.startsWith("text.")||t.startsWith("switch.")).sort();this.shadowRoot.innerHTML=`
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
      </div>`,this.shadowRoot.querySelectorAll("select, input").forEach(t=>{t.addEventListener("change",()=>this.fireConfig())})}fireConfig(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:{type:this._config?.type||"custom:ipixel-display-card",entity:this.shadowRoot.getElementById("entity")?.value,name:this.shadowRoot.getElementById("name")?.value||void 0}},bubbles:!0,composed:!0}))}};customElements.define("ipixel-display-card",S);customElements.define("ipixel-controls-card",L);customElements.define("ipixel-text-card",I);customElements.define("ipixel-playlist-card",k);customElements.define("ipixel-schedule-card",P);customElements.define("ipixel-simple-editor",R);window.customCards=window.customCards||[];[{type:"ipixel-display-card",name:"iPIXEL Display",description:"LED matrix preview with power control"},{type:"ipixel-controls-card",name:"iPIXEL Controls",description:"Brightness, mode, and orientation controls"},{type:"ipixel-text-card",name:"iPIXEL Text",description:"Text input with effects and colors"},{type:"ipixel-playlist-card",name:"iPIXEL Playlist",description:"Playlist management"},{type:"ipixel-schedule-card",name:"iPIXEL Schedule",description:"Power schedule and time slots"}].forEach(l=>window.customCards.push({...l,preview:!0,documentationURL:"https://github.com/cagcoach/ha-ipixel-color"}));console.info(`%c iPIXEL Cards %c ${$} `,"background:#03a9f4;color:#fff;padding:2px 6px;border-radius:4px 0 0 4px;","background:#333;color:#fff;padding:2px 6px;border-radius:0 4px 4px 0;");})();

(()=>{var yt="2.11.1";var O=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._config={},this._hass=null}set hass(e){this._hass=e,this.render()}setConfig(e){if(!e.entity)throw new Error("Please define an entity");this._config=e,this.render()}getEntity(){return!this._hass||!this._config.entity?null:this._hass.states[this._config.entity]}getRelatedEntity(e,t=""){if(!this._hass||!this._config.entity)return null;let s=this._config.entity.replace(/^[^.]+\./,"").replace(/_?(text|display|gif_url)$/i,""),i=`${e}.${s}${t}`;if(this._hass.states[i])return this._hass.states[i];let n=Object.keys(this._hass.states).filter(r=>{if(!r.startsWith(`${e}.`))return!1;let a=r.replace(/^[^.]+\./,"");return a.includes(s)||s.includes(a.replace(t,""))});if(t){let r=n.find(a=>a.endsWith(t));if(r)return this._hass.states[r]}else{let r=n.sort((a,o)=>a.length-o.length);if(r.length>0)return this._hass.states[r[0]]}return n.length>0?this._hass.states[n[0]]:null}async callService(e,t,s={}){if(this._hass)try{await this._hass.callService(e,t,s)}catch(i){console.error(`iPIXEL service call failed: ${e}.${t}`,i)}}getResolution(){let e=this.getRelatedEntity("sensor","_width")||this._hass?.states["sensor.display_width"],t=this.getRelatedEntity("sensor","_height")||this._hass?.states["sensor.display_height"];if(e&&t){let s=parseInt(e.state),i=parseInt(t.state);if(!isNaN(s)&&!isNaN(i)&&s>0&&i>0)return[s,i]}return[64,16]}isOn(){return this.getRelatedEntity("switch")?.state==="on"}hexToRgb(e){let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:[255,255,255]}render(){}getCardSize(){return 2}};var P=`
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
`;var Y={A:[124,18,17,18,124],B:[127,73,73,73,54],C:[62,65,65,65,34],D:[127,65,65,34,28],E:[127,73,73,73,65],F:[127,9,9,9,1],G:[62,65,73,73,122],H:[127,8,8,8,127],I:[0,65,127,65,0],J:[32,64,65,63,1],K:[127,8,20,34,65],L:[127,64,64,64,64],M:[127,2,12,2,127],N:[127,4,8,16,127],O:[62,65,65,65,62],P:[127,9,9,9,6],Q:[62,65,81,33,94],R:[127,9,25,41,70],S:[70,73,73,73,49],T:[1,1,127,1,1],U:[63,64,64,64,63],V:[31,32,64,32,31],W:[63,64,56,64,63],X:[99,20,8,20,99],Y:[7,8,112,8,7],Z:[97,81,73,69,67],a:[32,84,84,84,120],b:[127,72,68,68,56],c:[56,68,68,68,32],d:[56,68,68,72,127],e:[56,84,84,84,24],f:[8,126,9,1,2],g:[12,82,82,82,62],h:[127,8,4,4,120],i:[0,68,125,64,0],j:[32,64,68,61,0],k:[127,16,40,68,0],l:[0,65,127,64,0],m:[124,4,24,4,120],n:[124,8,4,4,120],o:[56,68,68,68,56],p:[124,20,20,20,8],q:[8,20,20,24,124],r:[124,8,4,4,8],s:[72,84,84,84,32],t:[4,63,68,64,32],u:[60,64,64,32,124],v:[28,32,64,32,28],w:[60,64,48,64,60],x:[68,40,16,40,68],y:[12,80,80,80,60],z:[68,100,84,76,68],0:[62,81,73,69,62],1:[0,66,127,64,0],2:[66,97,81,73,70],3:[33,65,69,75,49],4:[24,20,18,127,16],5:[39,69,69,69,57],6:[60,74,73,73,48],7:[1,113,9,5,3],8:[54,73,73,73,54],9:[6,73,73,41,30]," ":[0,0,0,0,0],".":[0,96,96,0,0],",":[0,128,96,0,0],":":[0,54,54,0,0],";":[0,128,54,0,0],"!":[0,0,95,0,0],"?":[2,1,81,9,6],"-":[8,8,8,8,8],"+":[8,8,62,8,8],"=":[20,20,20,20,20],_:[64,64,64,64,64],"/":[32,16,8,4,2],"\\":[2,4,8,16,32],"(":[0,28,34,65,0],")":[0,65,34,28,0],"[":[0,127,65,65,0],"]":[0,65,65,127,0],"<":[8,20,34,65,0],">":[0,65,34,20,8],"*":[20,8,62,8,20],"#":[20,127,20,127,20],"@":[62,65,93,85,30],"&":[54,73,85,34,80],"%":[35,19,8,100,98],$:[18,42,127,42,36],"'":[0,0,7,0,0],'"':[0,7,0,7,0],"`":[0,1,2,0,0],"^":[4,2,1,2,4],"~":[8,4,8,16,8]};function ht(f,e,t,s="#ff6600",i="#111"){let n=[],o=Math.floor((t-7)/2);for(let h=0;h<t;h++)for(let p=0;p<e;p++)n.push(i);let l=f.length*6-1,d=Math.max(1,Math.floor((e-l)/2));for(let h of f){let p=Y[h]||Y[" "];for(let x=0;x<5;x++)for(let u=0;u<7;u++){let m=p[x]>>u&1,b=d+x,_=o+u;b>=0&&b<e&&_<t&&_>=0&&(n[_*e+b]=m?s:i)}d+=6}return n}function vt(f,e,t,s="#ff6600",i="#111"){let a=Math.floor((t-7)/2),o=f.length*6,l=e+o+e,c=[];for(let h=0;h<t;h++)for(let p=0;p<l;p++)c.push(i);let d=e;for(let h of f){let p=Y[h]||Y[" "];for(let x=0;x<5;x++)for(let u=0;u<7;u++){let m=p[x]>>u&1,b=d+x,_=a+u;b>=0&&b<l&&_<t&&_>=0&&(c[_*l+b]=m?s:i)}d+=6}return{pixels:c,width:l}}var wt={VCR_OSD_MONO:{16:{font_size:16,offset:[0,0],pixel_threshold:70,var_width:!0},24:{font_size:24,offset:[0,0],pixel_threshold:70,var_width:!0},32:{font_size:28,offset:[-1,2],pixel_threshold:30,var_width:!1}},CUSONG:{16:{font_size:16,offset:[0,-1],pixel_threshold:70,var_width:!1},24:{font_size:24,offset:[0,0],pixel_threshold:70,var_width:!1},32:{font_size:32,offset:[0,0],pixel_threshold:70,var_width:!1}}},X={},q={};function Xt(f){return window.location.pathname.includes("preview.html")||window.location.port==="8080"?`./fonts/${f}.ttf`:`/hacsfiles/ipixel_color/fonts/${f}.ttf`}async function H(f){return X[f]===!0?!0:X[f]===!1?!1:(q[f]||(q[f]=(async()=>{let e=Xt(f);try{let s=await new FontFace(f,`url(${e})`).load();return document.fonts.add(s),X[f]=!0,console.log(`iPIXEL: Font ${f} loaded successfully`),!0}catch(t){return console.warn(`iPIXEL: Failed to load font ${f}:`,t),X[f]=!1,!1}})()),q[f])}function J(f){return X[f]===!0}function Et(f){return f<=18?16:f<=28?24:32}function _t(f){let e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(f);return e?{r:parseInt(e[1],16),g:parseInt(e[2],16),b:parseInt(e[3],16)}:{r:0,g:0,b:0}}function St(f,e,t,s="#ff6600",i="#111",n="VCR_OSD_MONO"){let r=wt[n];if(!r)return console.warn(`iPIXEL: Unknown font: ${n}`),null;if(!J(n))return H(n),null;let a=Et(t),o=r[a],l=document.createElement("canvas");l.width=e,l.height=t;let c=l.getContext("2d");if(c.imageSmoothingEnabled=!1,c.fillStyle=i,c.fillRect(0,0,e,t),!f||f.trim()===""){let g=[];for(let v=0;v<e*t;v++)g.push(i);return g}c.font=`${o.font_size}px "${n}"`,c.fillStyle=s,c.textBaseline="top";let h=c.measureText(f).width,p=Math.floor((e-h)/2)+o.offset[0],x=Math.floor((t-o.font_size)/2)+o.offset[1];c.fillText(f,p,x);let u=c.getImageData(0,0,e,t),m=[],b=_t(s),_=_t(i);for(let g=0;g<u.data.length;g+=4){let v=u.data[g],y=u.data[g+1],S=u.data[g+2];(v+y+S)/3>=o.pixel_threshold?m.push(s):m.push(i)}return m}function It(f,e,t,s="#ff6600",i="#111",n="VCR_OSD_MONO"){let r=wt[n];if(!r)return null;if(!J(n))return H(n),null;let a=Et(t),o=r[a],c=document.createElement("canvas").getContext("2d");c.font=`${o.font_size}px "${n}"`;let d=Math.ceil(c.measureText(f).width),h=e+d+e,p=document.createElement("canvas");p.width=h,p.height=t;let x=p.getContext("2d");if(x.imageSmoothingEnabled=!1,x.fillStyle=i,x.fillRect(0,0,h,t),!f||f.trim()===""){let g=[];for(let v=0;v<h*t;v++)g.push(i);return{pixels:g,width:h}}x.font=`${o.font_size}px "${n}"`,x.fillStyle=s,x.textBaseline="top";let u=e+o.offset[0],m=Math.floor((t-o.font_size)/2)+o.offset[1];x.fillText(f,u,m);let b=x.getImageData(0,0,h,t),_=[];for(let g=0;g<b.data.length;g+=4){let v=b.data[g],y=b.data[g+1],S=b.data[g+2];(v+y+S)/3>=o.pixel_threshold?_.push(s):_.push(i)}return{pixels:_,width:h}}var Ht=function(f,e,t,s){return new(t||(t=Promise))(function(i,n){function r(l){try{o(s.next(l))}catch(c){n(c)}}function a(l){try{o(s.throw(l))}catch(c){n(c)}}function o(l){var c;l.done?i(l.value):(c=l.value,c instanceof t?c:new t(function(d){d(c)})).then(r,a)}o((s=s.apply(f,e||[])).next())})},A=function(f){return this instanceof A?(this.v=f,this):new A(f)},zt=function(f,e,t){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var s,i=t.apply(f,e||[]),n=[];return s={},r("next"),r("throw"),r("return"),s[Symbol.asyncIterator]=function(){return this},s;function r(d){i[d]&&(s[d]=function(h){return new Promise(function(p,x){n.push([d,h,p,x])>1||a(d,h)})})}function a(d,h){try{(p=i[d](h)).value instanceof A?Promise.resolve(p.value.v).then(o,l):c(n[0][2],p)}catch(x){c(n[0][3],x)}var p}function o(d){a("next",d)}function l(d){a("throw",d)}function c(d,h){d(h),n.shift(),n.length&&a(n[0][0],n[0][1])}};function kt(f,{includeLastEmptyLine:e=!0,encoding:t="utf-8",delimiter:s=/\r?\n/g}={}){return zt(this,arguments,function*(){let i=yield A((d=>Ht(void 0,void 0,void 0,function*(){let h=yield fetch(d);if(h.body===null)throw new Error("Cannot read file");return h.body.getReader()}))(f)),{value:n,done:r}=yield A(i.read()),a=new TextDecoder(t),o,l=n?a.decode(n):"";if(typeof s=="string"){if(s==="")throw new Error("delimiter cannot be empty string!");o=new RegExp(s.replace(/[.*+\-?^${}()|[\]\\]/g,"\\$&"),"g")}else o=/g/.test(s.flags)===!1?new RegExp(s.source,s.flags+"g"):s;let c=0;for(;;){let d=o.exec(l);if(d!==null)yield yield A(l.substring(c,d.index)),c=o.lastIndex;else{if(r===!0)break;let h=l.substring(c);({value:n,done:r}=yield A(i.read())),l=h+(l?a.decode(n):""),c=0}}(e||c<l.length)&&(yield yield A(l.substring(c)))})}var B=function(f,e,t,s){return new(t||(t=Promise))(function(i,n){function r(l){try{o(s.next(l))}catch(c){n(c)}}function a(l){try{o(s.throw(l))}catch(c){n(c)}}function o(l){var c;l.done?i(l.value):(c=l.value,c instanceof t?c:new t(function(d){d(c)})).then(r,a)}o((s=s.apply(f,e||[])).next())})},Vt=function(f){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var e,t=f[Symbol.asyncIterator];return t?t.call(f):(f=typeof __values=="function"?__values(f):f[Symbol.iterator](),e={},s("next"),s("throw"),s("return"),e[Symbol.asyncIterator]=function(){return this},e);function s(i){e[i]=f[i]&&function(n){return new Promise(function(r,a){(function(o,l,c,d){Promise.resolve(d).then(function(h){o({value:h,done:c})},l)})(r,a,(n=f[i](n)).done,n.value)})}}},Mt="[\\s]+",Wt={glyphname:"empty",codepoint:8203,bbw:0,bbh:0,bbxoff:0,bbyoff:0,swx0:0,swy0:0,dwx0:0,dwy0:0,swx1:0,swy1:0,dwx1:0,dwy1:0,vvectorx:0,vvectory:0,hexdata:[]},Gt=["glyphname","codepoint","bbw","bbh","bbxoff","bbyoff","swx0","swy0","dwx0","dwy0","swx1","swy1","dwx1","dwy1","vvectorx","vvectory","hexdata"],jt={lr:"lrtb",rl:"rltb",tb:"tbrl",bt:"btrl",lrtb:void 0,lrbt:void 0,rltb:void 0,rlbt:void 0,tbrl:void 0,tblr:void 0,btrl:void 0,btlr:void 0},K={lr:1,rl:2,tb:0,bt:-1},ft=class{constructor(){this.headers=void 0,this.__headers={},this.props={},this.glyphs=new Map,this.__glyph_count_to_check=null,this.__curline_startchar=null,this.__curline_chars=null}load_filelines(e){var t,s;return B(this,void 0,void 0,function*(){try{this.__f=e,yield this.__parse_headers()}finally{if(typeof Deno<"u"&&this.__f!==void 0)try{for(var i,n=Vt(this.__f);!(i=yield n.next()).done;)i.value}catch(r){t={error:r}}finally{try{i&&!i.done&&(s=n.return)&&(yield s.call(n))}finally{if(t)throw t.error}}}return this})}__parse_headers(){var e,t;return B(this,void 0,void 0,function*(){for(;;){let s=(t=yield(e=this.__f)===null||e===void 0?void 0:e.next())===null||t===void 0?void 0:t.value,i=s.split(/ (.+)/,2),n=i.length,r;if(n===2){let a=i[0],o=i[1].trim();switch(a){case"STARTFONT":this.__headers.bdfversion=parseFloat(o);break;case"FONT":this.__headers.fontname=o;break;case"SIZE":r=o.split(" "),this.__headers.pointsize=parseInt(r[0],10),this.__headers.xres=parseInt(r[1],10),this.__headers.yres=parseInt(r[2],10);break;case"FONTBOUNDINGBOX":r=o.split(" "),this.__headers.fbbx=parseInt(r[0],10),this.__headers.fbby=parseInt(r[1],10),this.__headers.fbbxoff=parseInt(r[2],10),this.__headers.fbbyoff=parseInt(r[3],10);break;case"STARTPROPERTIES":return this.__parse_headers_after(),void(yield this.__parse_props());case"COMMENT":"comment"in this.__headers&&Array.isArray(this.__headers.comment)||(this.__headers.comment=[]),this.__headers.comment.push(o.replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g,""));break;case"SWIDTH":r=o.split(" "),this.__headers.swx0=parseInt(r[0],10),this.__headers.swy0=parseInt(r[1],10);break;case"DWIDTH":r=o.split(" "),this.__headers.dwx0=parseInt(r[0],10),this.__headers.dwy0=parseInt(r[1],10);break;case"SWIDTH1":r=o.split(" "),this.__headers.swx1=parseInt(r[0],10),this.__headers.swy1=parseInt(r[1],10);break;case"DWIDTH1":r=o.split(" "),this.__headers.dwx1=parseInt(r[0],10),this.__headers.dwy1=parseInt(r[1],10);break;case"VVECTOR":r=Mt.split(o),this.__headers.vvectorx=parseInt(r[0],10),this.__headers.vvectory=parseInt(r[1],10);break;case"METRICSSET":case"CONTENTVERSION":this.__headers[a.toLowerCase()]=parseInt(o,10);break;case"CHARS":return console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword"),this.__parse_headers_after(),this.__curline_chars=s,void(yield this.__parse_glyph_count());case"STARTCHAR":return console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword"),console.warn("Cannot find 'CHARS' line"),this.__parse_headers_after(),this.__curline_startchar=s,void(yield this.__prepare_glyphs())}}if(n===1&&i[0].trim()==="ENDFONT")return console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword"),void console.warn("This font does not have any glyphs")}})}__parse_headers_after(){"metricsset"in this.__headers||(this.__headers.metricsset=0),this.headers=this.__headers}__parse_props(){var e,t;return B(this,void 0,void 0,function*(){for(;;){let s=((t=yield(e=this.__f)===null||e===void 0?void 0:e.next())===null||t===void 0?void 0:t.value).split(/ (.+)/,2),i=s.length;if(i===2){let n=s[0],r=s[1].replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g,"");n==="COMMENT"?("comment"in this.props&&Array.isArray(this.props.comment)||(this.props.comment=[]),this.props.comment.push(r.replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g,""))):this.props[n.toLowerCase()]=r}else if(i===1){let n=s[0].trim();if(n==="ENDPROPERTIES")return void(yield this.__parse_glyph_count());if(n==="ENDFONT")return void console.warn("This font does not have any glyphs");this.props[n]=null}}})}__parse_glyph_count(){var e,t;return B(this,void 0,void 0,function*(){let s;if(this.__curline_chars===null?s=(t=yield(e=this.__f)===null||e===void 0?void 0:e.next())===null||t===void 0?void 0:t.value:(s=this.__curline_chars,this.__curline_chars=null),s.trim()==="ENDFONT")return void console.warn("This font does not have any glyphs");let i=s.split(/ (.+)/,2);i[0]==="CHARS"?this.__glyph_count_to_check=parseInt(i[1].trim(),10):(this.__curline_startchar=s,console.warn("Cannot find 'CHARS' line next to 'ENDPROPERTIES' line")),yield this.__prepare_glyphs()})}__prepare_glyphs(){var e,t;return B(this,void 0,void 0,function*(){let s=0,i=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],n=[],r=!1,a=!1;for(;;){let o;if(this.__curline_startchar===null?o=(t=yield(e=this.__f)===null||e===void 0?void 0:e.next())===null||t===void 0?void 0:t.value:(o=this.__curline_startchar,this.__curline_startchar=null),o==null)return console.warn("This font does not have 'ENDFONT' keyword"),void this.__prepare_glyphs_after();let l=o.split(/ (.+)/,2),c=l.length;if(c===2){let d=l[0],h=l[1].trim(),p;switch(d){case"STARTCHAR":i=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],i[0]=h,a=!1;break;case"ENCODING":s=parseInt(h,10),i[1]=s;break;case"BBX":p=h.split(" "),i[2]=parseInt(p[0],10),i[3]=parseInt(p[1],10),i[4]=parseInt(p[2],10),i[5]=parseInt(p[3],10);break;case"SWIDTH":p=h.split(" "),i[6]=parseInt(p[0],10),i[7]=parseInt(p[1],10);break;case"DWIDTH":p=h.split(" "),i[8]=parseInt(p[0],10),i[9]=parseInt(p[1],10);break;case"SWIDTH1":p=h.split(" "),i[10]=parseInt(p[0],10),i[11]=parseInt(p[1],10);break;case"DWIDTH1":p=h.split(" "),i[12]=parseInt(p[0],10),i[13]=parseInt(p[1],10);break;case"VVECTOR":p=Mt.split(h),i[14]=parseInt(p[0],10),i[15]=parseInt(p[1],10)}}else if(c===1){let d=l[0].trim();switch(d){case"BITMAP":n=[],r=!0;break;case"ENDCHAR":r=!1,i[16]=n,this.glyphs.set(s,i),a=!0;break;case"ENDFONT":if(a)return void this.__prepare_glyphs_after();default:r&&n.push(d)}}}})}__prepare_glyphs_after(){let e=this.glyphs.size;this.__glyph_count_to_check!==e&&(this.__glyph_count_to_check===null?console.warn("The glyph count next to 'CHARS' keyword does not exist"):console.warn(`The glyph count next to 'CHARS' keyword is ${this.__glyph_count_to_check.toString()}, which does not match the actual glyph count ${e.toString()}`))}get length(){return this.glyphs.size}itercps(e,t){let s=e??1,i=t??null,n,r=[...this.glyphs.keys()];switch(s){case 1:n=r.sort((a,o)=>a-o);break;case 0:n=r;break;case 2:n=r.sort((a,o)=>o-a);break;case-1:n=r.reverse()}if(i!==null){let a=o=>{if(typeof i=="number")return o<i;if(Array.isArray(i)&&i.length===2&&typeof i[0]=="number"&&typeof i[1]=="number")return o<=i[1]&&o>=i[0];if(Array.isArray(i)&&Array.isArray(i[0]))for(let l of i){let[c,d]=l;if(o<=d&&o>=c)return!0}return!1};n=n.filter(a)}return n}*iterglyphs(e,t){for(let s of this.itercps(e,t))yield this.glyphbycp(s)}glyphbycp(e){let t=this.glyphs.get(e);if(t==null)return console.warn(`Glyph "${String.fromCodePoint(e)}" (codepoint ${e.toString()}) does not exist in the font. Will return 'null'`),null;{let s={};return Gt.forEach((i,n)=>{var r,a,o;r=s,a=i,o=t[n],r[a]=o}),new D(s,this)}}glyph(e){let t=e.codePointAt(0);return t===void 0?null:this.glyphbycp(t)}lacksglyphs(e){let t=[],s=e.length;for(let i,n=0;n<s;n++){i=e[n];let r=i.codePointAt(0);r!==void 0&&this.glyphs.has(r)||t.push(i)}return t.length!==0?t:null}drawcps(e,t={}){var s,i,n,r,a,o,l;let c=(s=t.linelimit)!==null&&s!==void 0?s:512,d=(i=t.mode)!==null&&i!==void 0?i:1,h=(n=t.direction)!==null&&n!==void 0?n:"lrtb",p=(r=t.usecurrentglyphspacing)!==null&&r!==void 0&&r,x=(a=t.missing)!==null&&a!==void 0?a:null;if(this.headers===void 0)throw new Error("Font is not loaded");let u,m,b,_,g,v,y,S,E,M,I,T,R,C,F,W,G,j,pt=(o=jt[h])!==null&&o!==void 0?o:h,xt=pt.slice(0,2),ut=pt.slice(2,4);xt in K&&ut in K?(v=K[xt],y=K[ut]):(v=1,y=0),y===0||y===2?u=1:y!==1&&y!==-1||(u=0),v===1||v===-1?m=1:v!==2&&v!==0||(m=0),d===1&&(S=v>0?this.headers.fbbx:this.headers.fbby,v>0?(T="dwx0",R="dwy0"):(T="dwx1",R="dwy1"),I=T in this.headers?this.headers[T]:R in this.headers?this.headers[R]:null);let bt=[];_=[];let gt=[];F=[],W=0;let mt=()=>{bt.push(_),p?F.shift():F.pop(),gt.push(F)},Bt=e[Symbol.iterator]();for(G=!1;;){if(G)G=!1;else{if(g=(l=Bt.next())===null||l===void 0?void 0:l.value,g===void 0)break;let U=this.glyphbycp(g);E=U!==null?U:x?x instanceof D?x:new D(x,this):new D(Wt,this),b=E.draw(),j=b.width(),C=0,d===1&&T!==void 0&&R!==void 0&&(M=E.meta[T]||E.meta[R],M==null&&(M=I),M!=null&&S!==void 0&&(C=M-S))}if(j!==void 0&&C!==void 0&&b!==void 0&&E!==void 0&&g!==void 0)if(W+=j+C,W<=c)_.push(b),F.push(C);else{if(_.length===0)throw new Error(`\`_linelimit\` (${c}) is too small the line can't even contain one glyph: "${E.chr()}" (codepoint ${g}, width: ${j})`);mt(),W=0,_=[],F=[],G=!0}}_.length!==0&&mt();let Dt=bt.map((U,Nt)=>z.concatall(U,{direction:v,align:u,offsetlist:gt[Nt]}));return z.concatall(Dt,{direction:y,align:m})}draw(e,t={}){let{linelimit:s,mode:i,direction:n,usecurrentglyphspacing:r,missing:a}=t;return this.drawcps(e.split("").map(o=>{let l=o.codePointAt(0);return l===void 0?8203:l}),{linelimit:s,mode:i,direction:n,usecurrentglyphspacing:r,missing:a})}drawall(e={}){let{order:t,r:s,linelimit:i,mode:n,direction:r,usecurrentglyphspacing:a}=e,o=n??0;return this.drawcps(this.itercps(t,s),{linelimit:i,mode:o,direction:r,usecurrentglyphspacing:a})}},D=class{constructor(e,t){this.meta=e,this.font=t}toString(){return this.draw().toString()}repr(){var e;return"Glyph("+JSON.stringify(this.meta,null,2)+", Font(<"+((e=this.font.headers)===null||e===void 0?void 0:e.fontname)+">)"}cp(){return this.meta.codepoint}chr(){return String.fromCodePoint(this.cp())}draw(e,t){let s=t??null,i;switch(e??0){case 0:i=this.__draw_fbb();break;case 1:i=this.__draw_bb();break;case 2:i=this.__draw_original();break;case-1:if(s===null)throw new Error("Parameter bb in draw() method must be set when mode=-1");i=this.__draw_user_specified(s)}return i}__draw_user_specified(e){let t=this.meta.bbxoff,s=this.meta.bbyoff,[i,n,r,a]=e;return this.__draw_bb().crop(i,n,-t+r,-s+a)}__draw_original(){return new z(this.meta.hexdata.map(e=>e?parseInt(e,16).toString(2).padStart(4*e.length,"0"):""))}__draw_bb(){let e=this.meta.bbw,t=this.meta.bbh,s=this.__draw_original(),i=s.bindata,n=i.length;return n!==t&&console.warn(`Glyph "${this.meta.glyphname.toString()}" (codepoint ${this.meta.codepoint.toString()})'s bbh, ${t.toString()}, does not match its hexdata line count, ${n.toString()}`),s.bindata=i.map(r=>r.slice(0,e)),s}__draw_fbb(){let e=this.font.headers;if(e===void 0)throw new Error("Font is not loaded");return this.__draw_user_specified([e.fbbx,e.fbby,e.fbbxoff,e.fbbyoff])}origin(e={}){var t,s,i,n;let r=(t=e.mode)!==null&&t!==void 0?t:0,a=(s=e.fromorigin)!==null&&s!==void 0&&s,o=(i=e.xoff)!==null&&i!==void 0?i:null,l=(n=e.yoff)!==null&&n!==void 0?n:null,c,d=this.meta.bbxoff,h=this.meta.bbyoff;switch(r){case 0:let p=this.font.headers;if(p===void 0)throw new Error("Font is not loaded");c=[p.fbbxoff,p.fbbyoff];break;case 1:case 2:c=[d,h];break;case-1:if(o===null||l===null)throw new Error("Parameter xoff and yoff in origin() method must be all set when mode=-1");c=[o,l]}return a?c:[0-c[0],0-c[1]]}},z=class f{constructor(e){this.bindata=e}toString(){return this.bindata.join(`
`).replace(/0/g,".").replace(/1/g,"#").replace(/2/g,"&")}repr(){return`Bitmap(${JSON.stringify(this.bindata,null,2)})`}width(){return this.bindata[0].length}height(){return this.bindata.length}clone(){return new f([...this.bindata])}static __crop_string(e,t,s){let i=e,n=e.length,r=0;t<0&&(r=0-t,i=i.padStart(r+n,"0")),t+s>n&&(i=i.padEnd(t+s-n+i.length,"0"));let a=t+r;return i.slice(a,a+s)}static __string_offset_concat(e,t,s){let i=s??0;if(i===0)return e+t;let n=e.length,r=n+i,a=r+t.length,o=Math.min(0,r),l=Math.max(n,a),c=f.__crop_string(e,o,l-o),d=f.__crop_string(t,o-r,l-o);return c.split("").map((h,p)=>(parseInt(d[p],10)||parseInt(h,10)).toString()).join("")}static __listofstr_offset_concat(e,t,s){let i=s??0,n,r;if(i===0)return e.concat(t);let a=e[0].length,o=e.length,l=o+i,c=l+t.length,d=Math.min(0,l),h=Math.max(o,c),p=[];for(let x=d;x<h;x++)n=x<0||x>=o?"0".repeat(a):e[x],r=x<l||x>=c?"0".repeat(a):t[x-l],p.push(n.split("").map((u,m)=>(parseInt(r[m],10)||parseInt(u,10)).toString()).join(""));return p}static __crop_bitmap(e,t,s,i,n){let r,a=[],o=e.length;for(let l=0;l<s;l++)r=o-n-s+l,r<0||r>=o?a.push("0".repeat(t)):a.push(f.__crop_string(e[r],i,t));return a}crop(e,t,s,i){let n=s??0,r=i??0;return this.bindata=f.__crop_bitmap(this.bindata,e,t,n,r),this}overlay(e){let t=this.bindata,s=e.bindata;return t.length!==s.length&&console.warn("the bitmaps to overlay have different height"),t[0].length!==s[0].length&&console.warn("the bitmaps to overlay have different width"),this.bindata=t.map((i,n)=>{let r=i,a=s[n];return r.split("").map((o,l)=>(parseInt(a[l],10)||parseInt(o,10)).toString()).join("")}),this}static concatall(e,t={}){var s,i,n;let r=(s=t.direction)!==null&&s!==void 0?s:1,a=(i=t.align)!==null&&i!==void 0?i:1,o=(n=t.offsetlist)!==null&&n!==void 0?n:null,l,c,d,h,p,x,u;if(r>0){d=Math.max(...e.map(b=>b.height())),p=Array(d).fill("");let m=(b,_,g)=>r===1?f.__string_offset_concat(b,_,g):f.__string_offset_concat(_,b,g);for(let b=0;b<d;b++){c=a?-b-1:b,h=0;let _=e.length;for(let g=0;g<_;g++){let v=e[g];o&&g!==0&&(h=o[g-1]),b<v.height()?c>=0?p[c]=m(p[c],v.bindata[c],h):p[d+c]=m(p[d+c],v.bindata[v.height()+c],h):c>=0?p[c]=m(p[c],"0".repeat(v.width()),h):p[d+c]=m(p[d+c],"0".repeat(v.width()),h)}}}else{d=Math.max(...e.map(b=>b.width())),p=[],h=0;let m=e.length;for(let b=0;b<m;b++){let _=e[b];o&&b!==0&&(h=o[b-1]),l=_.bindata,x=_.width(),x!==d&&(u=a?0:x-d,l=this.__crop_bitmap(l,d,_.height(),u,0)),p=r===0?f.__listofstr_offset_concat(p,l,h):f.__listofstr_offset_concat(l,p,h)}}return new this(p)}concat(e,t={}){let{direction:s,align:i,offset:n}=t,r=n??0;return this.bindata=f.concatall([this,e],{direction:s,align:i,offsetlist:[r]}).bindata,this}static __enlarge_bindata(e,t,s){let i=t??1,n=s??1,r=[...e];return i>1&&(r=r.map(a=>a.split("").reduce((o,l)=>o.concat(Array(i).fill(l)),[]).join(""))),n>1&&(r=r.reduce((a,o)=>a.concat(Array(n).fill(o)),[])),r}enlarge(e,t){return this.bindata=f.__enlarge_bindata(this.bindata,e,t),this}replace(e,t){let s=typeof e=="number"?e.toString():e,i=typeof t=="number"?t.toString():t;return this.bindata=this.bindata.map(n=>((r,a,o)=>{if("replaceAll"in String.prototype)return r.replaceAll(a,o);{let l=c=>c.replace(/[.*+\-?^${}()|[\]\\]/g,"\\$&");return r.replace(new RegExp(l(a),"g"),o)}})(n,s,i)),this}shadow(e,t){let s=e??1,i=t??-1,n,r,a,o,l,c,d=this.clone();return c=this.width(),n=this.height(),c+=Math.abs(s),n+=Math.abs(i),d.bindata=d.bindata.map(h=>h.replace(/1/g,"2")),s>0?(r=0,o=-s):(r=s,o=0),i>0?(a=0,l=-i):(a=i,l=0),this.crop(c,n,r,a),d.crop(c,n,o,l),d.overlay(this),this.bindata=d.bindata,this}glow(e){var t,s,i,n,r,a,o,l,c,d,h,p,x,u;let m=e??0,b,_,g,v;g=this.width(),v=this.height(),g+=2,v+=2,this.crop(g,v,-1,-1);let y=this.todata(2),S=y.length;for(let E=0;E<S;E++){b=y[E];let M=b.length;for(let I=0;I<M;I++)_=b[I],_===1&&((t=y[E])[s=I-1]||(t[s]=2),(i=y[E])[n=I+1]||(i[n]=2),(r=y[E-1])[I]||(r[I]=2),(a=y[E+1])[I]||(a[I]=2),m===1&&((o=y[E-1])[l=I-1]||(o[l]=2),(c=y[E-1])[d=I+1]||(c[d]=2),(h=y[E+1])[p=I-1]||(h[p]=2),(x=y[E+1])[u=I+1]||(x[u]=2)))}return this.bindata=y.map(E=>E.map(M=>M.toString()).join("")),this}bytepad(e){let t=e??8,s=this.width(),i=this.height(),n=s%t;return n===0?this:this.crop(s+t-n,i)}todata(e){let t;switch(e??1){case 0:t=this.bindata.join(`
`);break;case 1:t=this.bindata;break;case 2:t=this.bindata.map(s=>s.split("").map(i=>parseInt(i,10)));break;case 3:t=[].concat(...this.todata(2));break;case 4:t=this.bindata.map(s=>{if(!/^[01]+$/.test(s))throw new Error(`Invalid binary string: ${s}`);return parseInt(s,2).toString(16).padStart(-1*Math.floor(-1*this.width()/4),"0")});break;case 5:t=this.bindata.map(s=>{if(!/^[01]+$/.test(s))throw new Error(`Invalid binary string: ${s}`);return parseInt(s,2)})}return t}draw2canvas(e,t){let s=t??{0:null,1:"black",2:"red"};return this.todata(2).forEach((i,n)=>{i.forEach((r,a)=>{let o=r.toString();if(o==="0"||o==="1"||o==="2"){let l=s[o];l!=null&&(e.fillStyle=l,e.fillRect(a,n,1,1))}})}),this}},Ct=f=>B(void 0,void 0,void 0,function*(){return yield new ft().load_filelines(f)});var Ut={VCR_OSD_MONO:{16:{file:"VCR_OSD_MONO_16.bdf",yOffset:0},24:{file:"VCR_OSD_MONO_24.bdf",yOffset:0},32:{file:"VCR_OSD_MONO_32.bdf",yOffset:2}},CUSONG:{16:{file:"CUSONG_16.bdf",yOffset:-1},24:{file:"CUSONG_24.bdf",yOffset:0},32:{file:"CUSONG_32.bdf",yOffset:0}}},N=new Map,Z=new Map;function Yt(f){return window.location.pathname.includes("preview.html")||window.location.port==="8080"?`./fonts/${f}`:`/hacsfiles/ipixel_color/fonts/${f}`}function Q(f){return f<=18?16:f<=28?24:32}async function L(f,e=16){let t=`${f}_${e}`;if(N.has(t))return N.get(t);if(Z.has(t))return Z.get(t);let s=Ut[f];if(!s||!s[e])return console.warn(`iPIXEL BDF: No config for font ${f} at height ${e}`),null;let i=s[e],n=(async()=>{try{let r=Yt(i.file);console.log(`iPIXEL BDF: Loading ${r}...`);let o={font:await Ct(kt(r)),config:i};return N.set(t,o),console.log(`iPIXEL BDF: Font ${f} (${e}px) loaded successfully`),o}catch(r){return console.warn(`iPIXEL BDF: Failed to load font ${f} (${e}px):`,r),Z.delete(t),null}})();return Z.set(t,n),n}function Tt(f,e=16){let t=`${f}_${e}`;return N.has(t)}function Rt(f,e,t,s="#ff6600",i="#111",n="VCR_OSD_MONO"){let r=Q(t),a=`${n}_${r}`,o=N.get(a);if(!o)return L(n,r),null;let{font:l,config:c}=o,d=new Array(e*t).fill(i);if(!f||f.trim()==="")return d;try{let h=l.draw(f,{direction:"lrtb",mode:1}),p=h.bindata,x=h.width(),u=h.height(),m=Math.floor((e-x)/2),b=Math.floor((t-u)/2)+(c.yOffset||0);for(let _=0;_<u;_++){let g=p[_]||"";for(let v=0;v<g.length;v++){let y=m+v,S=b+_;if(y>=0&&y<e&&S>=0&&S<t){let E=S*e+y;d[E]=g[v]==="1"?s:i}}}}catch(h){return console.warn("iPIXEL BDF: Error rendering text:",h),null}return d}function Ot(f,e,t,s="#ff6600",i="#111",n="VCR_OSD_MONO"){let r=Q(t),a=`${n}_${r}`,o=N.get(a);if(!o)return L(n,r),null;let{font:l,config:c}=o;if(!f||f.trim()===""){let d=e*3;return{pixels:new Array(d*t).fill(i),width:d}}try{let d=l.draw(f,{direction:"lrtb",mode:1}),h=d.bindata,p=d.width(),x=d.height(),u=e+p+e,m=new Array(u*t).fill(i),b=e,_=Math.floor((t-x)/2)+(c.yOffset||0);for(let g=0;g<x;g++){let v=h[g]||"";for(let y=0;y<v.length;y++){let S=b+y,E=_+g;if(S>=0&&S<u&&E>=0&&E<t){let M=E*u+S;m[M]=v[y]==="1"?s:i}}}return{pixels:m,width:u}}catch(d){return console.warn("iPIXEL BDF: Error rendering scroll text:",d),null}}var tt=class{constructor(e){this.renderer=e}init(e,t){let{width:s,height:i}=this.renderer;switch(e){case"scroll_ltr":case"scroll_rtl":t.offset=0;break;case"blink":t.visible=!0;break;case"snow":case"breeze":t.phases=[];for(let n=0;n<s*i;n++)t.phases[n]=Math.random()*Math.PI*2;break;case"laser":t.position=0;break;case"fade":t.opacity=0,t.direction=1;break;case"typewriter":t.charIndex=0,t.cursorVisible=!0;break;case"bounce":t.offset=0,t.direction=1;break;case"sparkle":t.sparkles=[];for(let n=0;n<Math.floor(s*i*.1);n++)t.sparkles.push({x:Math.floor(Math.random()*s),y:Math.floor(Math.random()*i),brightness:Math.random(),speed:.05+Math.random()*.1});break}}step(e,t){let{width:s,extendedWidth:i}=this.renderer;switch(e){case"scroll_ltr":t.offset-=1,t.offset<=-(i||s)&&(t.offset=s);break;case"scroll_rtl":t.offset+=1,t.offset>=(i||s)&&(t.offset=-s);break;case"blink":t.visible=!t.visible;break;case"laser":t.position=(t.position+1)%s;break;case"fade":t.opacity+=t.direction*.05,t.opacity>=1?(t.opacity=1,t.direction=-1):t.opacity<=0&&(t.opacity=0,t.direction=1);break;case"typewriter":t.tick%3===0&&t.charIndex++,t.cursorVisible=t.tick%10<5;break;case"bounce":t.offset+=t.direction;let n=Math.max(0,(i||s)-s);t.offset>=n?(t.offset=n,t.direction=-1):t.offset<=0&&(t.offset=0,t.direction=1);break;case"sparkle":for(let r of t.sparkles)r.brightness+=r.speed,r.brightness>1&&(r.brightness=0,r.x=Math.floor(Math.random()*s),r.y=Math.floor(Math.random()*this.renderer.height));break}}render(e,t,s,i,n){let{width:r,height:a}=this.renderer,o=i||s||[],l=s||[],c=n||r;for(let d=0;d<a;d++)for(let h=0;h<r;h++){let p,x=h;if(e==="scroll_ltr"||e==="scroll_rtl"||e==="bounce"){for(x=h-(t.offset||0);x<0;)x+=c;for(;x>=c;)x-=c;p=o[d*c+x]||"#111"}else if(e==="typewriter"){let v=(t.charIndex||0)*6;h<v?p=l[d*r+h]||"#111":h===v&&t.cursorVisible?p="#ffffff":p="#111"}else p=l[d*r+h]||"#111";let[u,m,b]=this._hexToRgb(p);if(u>20||m>20||b>20)switch(e){case"blink":t.visible||(u=m=b=17);break;case"snow":{let g=t.phases?.[d*r+h]||0,v=t.tick||0,y=.3+.7*Math.abs(Math.sin(g+v*.3));u*=y,m*=y,b*=y;break}case"breeze":{let g=t.phases?.[d*r+h]||0,v=t.tick||0,y=.4+.6*Math.abs(Math.sin(g+v*.15+h*.2));u*=y,m*=y,b*=y;break}case"laser":{let g=t.position||0,y=Math.abs(h-g)<3?1:.3;u*=y,m*=y,b*=y;break}case"fade":{let g=t.opacity||1;u*=g,m*=g,b*=g;break}}if(e==="sparkle"&&t.sparkles){for(let g of t.sparkles)if(g.x===h&&g.y===d){let v=Math.sin(g.brightness*Math.PI);u=Math.min(255,u+v*200),m=Math.min(255,m+v*200),b=Math.min(255,b+v*200)}}this.renderer.setPixel(h,d,[u,m,b])}}_hexToRgb(e){if(!e||e==="#111"||e==="#000")return[17,17,17];if(e==="#050505")return[5,5,5];let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:[17,17,17]}};function Pt(f,e,t){let s,i,n,r=Math.floor(f*6),a=f*6-r,o=t*(1-e),l=t*(1-a*e),c=t*(1-(1-a)*e);switch(r%6){case 0:s=t,i=c,n=o;break;case 1:s=l,i=t,n=o;break;case 2:s=o,i=t,n=c;break;case 3:s=o,i=l,n=t;break;case 4:s=c,i=o,n=t;break;case 5:s=t,i=o,n=l;break}return[s*255,i*255,n*255]}var et=class{constructor(e){this.renderer=e}init(e,t){let{width:s,height:i}=this.renderer;switch(e){case"rainbow":t.position=0;break;case"matrix":let n=[[0,255,0],[0,255,255],[255,0,255]];t.colorMode=n[Math.floor(Math.random()*n.length)],t.buffer=[];for(let a=0;a<i;a++)t.buffer.push(Array(s).fill(null).map(()=>[0,0,0]));break;case"plasma":t.time=0;break;case"gradient":t.time=0;break;case"fire":t.heat=[];for(let a=0;a<s*i;a++)t.heat[a]=0;t.palette=this._createFirePalette();break;case"water":t.current=[],t.previous=[];for(let a=0;a<s*i;a++)t.current[a]=0,t.previous[a]=0;t.damping=.95;break;case"stars":t.stars=[];let r=Math.floor(s*i*.15);for(let a=0;a<r;a++)t.stars.push({x:Math.floor(Math.random()*s),y:Math.floor(Math.random()*i),brightness:Math.random(),speed:.02+Math.random()*.05,phase:Math.random()*Math.PI*2});break;case"confetti":t.particles=[];for(let a=0;a<20;a++)t.particles.push(this._createConfettiParticle(s,i,!0));break;case"plasma_wave":t.time=0;break;case"radial_pulse":t.time=0;break;case"hypnotic":t.time=0;break;case"lava":t.time=0,t.noise=[];for(let a=0;a<s*i;a++)t.noise[a]=Math.random()*Math.PI*2;break;case"aurora":t.time=0;break}}step(e,t){let{width:s,height:i}=this.renderer;switch(e){case"rainbow":t.position=(t.position+.01)%1;break;case"matrix":this._stepMatrix(t,s,i);break;case"plasma":case"gradient":t.time=(t.time||0)+.05;break;case"fire":this._stepFire(t,s,i);break;case"water":this._stepWater(t,s,i);break;case"stars":for(let n of t.stars)n.phase+=n.speed;break;case"confetti":for(let n=0;n<t.particles.length;n++){let r=t.particles[n];r.y+=r.speed,r.x+=r.drift,r.rotation+=r.rotationSpeed,r.y>i&&(t.particles[n]=this._createConfettiParticle(s,i,!1))}break;case"plasma_wave":case"radial_pulse":case"hypnotic":case"lava":case"aurora":t.time=(t.time||0)+.03;break}}render(e,t){switch(e){case"rainbow":this._renderRainbow(t);break;case"matrix":this._renderMatrix(t);break;case"plasma":this._renderPlasma(t);break;case"gradient":this._renderGradient(t);break;case"fire":this._renderFire(t);break;case"water":this._renderWater(t);break;case"stars":this._renderStars(t);break;case"confetti":this._renderConfetti(t);break;case"plasma_wave":this._renderPlasmaWave(t);break;case"radial_pulse":this._renderRadialPulse(t);break;case"hypnotic":this._renderHypnotic(t);break;case"lava":this._renderLava(t);break;case"aurora":this._renderAurora(t);break}}_renderRainbow(e){let{width:t,height:s}=this.renderer,i=e.position||0;for(let n=0;n<t;n++){let r=(i+n/t)%1,[a,o,l]=Pt(r,1,.6);for(let c=0;c<s;c++)this.renderer.setPixel(n,c,[a,o,l])}}_stepMatrix(e,t,s){let i=e.buffer,n=e.colorMode,r=.15;i.pop();let a=i[0].map(([o,l,c])=>[o*(1-r),l*(1-r),c*(1-r)]);i.unshift(JSON.parse(JSON.stringify(a)));for(let o=0;o<t;o++)Math.random()<.08&&(i[0][o]=[Math.floor(Math.random()*n[0]),Math.floor(Math.random()*n[1]),Math.floor(Math.random()*n[2])])}_renderMatrix(e){let{width:t,height:s}=this.renderer,i=e.buffer;if(i)for(let n=0;n<s;n++)for(let r=0;r<t;r++){let[a,o,l]=i[n]?.[r]||[0,0,0];this.renderer.setPixel(r,n,[a,o,l])}}_renderPlasma(e){let{width:t,height:s}=this.renderer,i=e.time||0,n=t/2,r=s/2;for(let a=0;a<t;a++)for(let o=0;o<s;o++){let l=a-n,c=o-r,d=Math.sqrt(l*l+c*c),h=Math.sin(a/8+i),p=Math.sin(o/6+i*.8),x=Math.sin(d/6-i*1.2),u=Math.sin((a+o)/10+i*.5),m=(h+p+x+u+4)/8,b=Math.sin(m*Math.PI*2)*.5+.5,_=Math.sin(m*Math.PI*2+2)*.5+.5,g=Math.sin(m*Math.PI*2+4)*.5+.5;this.renderer.setPixel(a,o,[b*255,_*255,g*255])}}_renderGradient(e){let{width:t,height:s}=this.renderer,n=(e.time||0)*10;for(let r=0;r<t;r++)for(let a=0;a<s;a++){let o=(Math.sin((r+n)*.05)*.5+.5)*255,l=(Math.cos((a+n)*.05)*.5+.5)*255,c=(Math.sin((r+a+n)*.03)*.5+.5)*255;this.renderer.setPixel(r,a,[o,l,c])}}_createFirePalette(){let e=[];for(let t=0;t<256;t++){let s,i,n;t<64?(s=t*4,i=0,n=0):t<128?(s=255,i=(t-64)*4,n=0):t<192?(s=255,i=255,n=(t-128)*4):(s=255,i=255,n=255),e.push([s,i,n])}return e}_stepFire(e,t,s){let i=e.heat;for(let n=0;n<t*s;n++)i[n]=Math.max(0,i[n]-Math.random()*10);for(let n=0;n<s-1;n++)for(let r=0;r<t;r++){let a=n*t+r,o=(n+1)*t+r,l=n*t+Math.max(0,r-1),c=n*t+Math.min(t-1,r+1);i[a]=(i[o]+i[l]+i[c])/3.05}for(let n=0;n<t;n++)Math.random()<.6&&(i[(s-1)*t+n]=180+Math.random()*75)}_renderFire(e){let{width:t,height:s}=this.renderer,i=e.heat,n=e.palette;for(let r=0;r<s;r++)for(let a=0;a<t;a++){let o=r*t+a,l=Math.floor(Math.min(255,i[o])),[c,d,h]=n[l];this.renderer.setPixel(a,r,[c,d,h])}}_stepWater(e,t,s){let{current:i,previous:n,damping:r}=e,a=[...n];for(let o=0;o<i.length;o++)n[o]=i[o];for(let o=1;o<s-1;o++)for(let l=1;l<t-1;l++){let c=o*t+l;i[c]=(a[(o-1)*t+l]+a[(o+1)*t+l]+a[o*t+(l-1)]+a[o*t+(l+1)])/2-i[c],i[c]*=r}if(Math.random()<.1){let o=Math.floor(Math.random()*(t-2))+1,l=Math.floor(Math.random()*(s-2))+1;i[l*t+o]=255}}_renderWater(e){let{width:t,height:s}=this.renderer,i=e.current;for(let n=0;n<s;n++)for(let r=0;r<t;r++){let a=n*t+r,o=Math.abs(i[a]),l=Math.min(255,o*2),c=l>200?l:0,d=l>150?l*.8:l*.3,h=Math.min(255,50+l);this.renderer.setPixel(r,n,[c,d,h])}}_renderStars(e){let{width:t,height:s}=this.renderer;for(let i=0;i<s;i++)for(let n=0;n<t;n++)this.renderer.setPixel(n,i,[5,5,15]);for(let i of e.stars){let n=(Math.sin(i.phase)*.5+.5)*255,r=Math.floor(i.x),a=Math.floor(i.y);r>=0&&r<t&&a>=0&&a<s&&this.renderer.setPixel(r,a,[n,n,n*.9])}}_createConfettiParticle(e,t,s){let i=[[255,0,0],[0,255,0],[0,0,255],[255,255,0],[255,0,255],[0,255,255],[255,128,0],[255,192,203]];return{x:Math.random()*e,y:s?Math.random()*t:-2,speed:.2+Math.random()*.3,drift:(Math.random()-.5)*.3,color:i[Math.floor(Math.random()*i.length)],size:1+Math.random(),rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-.5)*.2}}_renderConfetti(e){let{width:t,height:s}=this.renderer;for(let i=0;i<s;i++)for(let n=0;n<t;n++)this.renderer.setPixel(n,i,[10,10,10]);for(let i of e.particles){let n=Math.floor(i.x),r=Math.floor(i.y);if(n>=0&&n<t&&r>=0&&r<s){this.renderer.setPixel(n,r,i.color);let a=Math.abs(Math.sin(i.rotation))*.5+.5,[o,l,c]=i.color;this.renderer.setPixel(n,r,[o*a,l*a,c*a])}}}_renderPlasmaWave(e){let{width:t,height:s}=this.renderer,i=e.time||0;for(let n=0;n<t;n++)for(let r=0;r<s;r++){let a=n/t,o=r/s,l=Math.sin(a*10+i)+Math.sin(o*10+i)+Math.sin((a+o)*10+i)+Math.sin(Math.sqrt((a-.5)**2+(o-.5)**2)*20-i*2),c=Math.sin(l*Math.PI)*.5+.5,d=Math.sin(l*Math.PI+2.094)*.5+.5,h=Math.sin(l*Math.PI+4.188)*.5+.5;this.renderer.setPixel(n,r,[c*255,d*255,h*255])}}_renderRadialPulse(e){let{width:t,height:s}=this.renderer,i=e.time||0,n=t/2,r=s/2;for(let a=0;a<t;a++)for(let o=0;o<s;o++){let l=a-n,c=o-r,d=Math.sqrt(l*l+c*c),h=Math.sin(d*.8-i*3)*.5+.5,p=Math.sin(i*2)*.3+.7,x=(d/20+i*.5)%1,[u,m,b]=Pt(x,.8,h*p);this.renderer.setPixel(a,o,[u,m,b])}}_renderHypnotic(e){let{width:t,height:s}=this.renderer,i=e.time||0,n=t/2,r=s/2;for(let a=0;a<t;a++)for(let o=0;o<s;o++){let l=a-n,c=o-r,d=Math.sqrt(l*l+c*c),h=Math.atan2(c,l),x=Math.sin(h*4+d*.5-i*2)*.5+.5,u=x*(Math.sin(i)*.5+.5),m=x*(Math.sin(i+2.094)*.5+.5),b=x*(Math.sin(i+4.188)*.5+.5);this.renderer.setPixel(a,o,[u*255,m*255,b*255])}}_renderLava(e){let{width:t,height:s}=this.renderer,i=e.time||0;for(let n=0;n<t;n++)for(let r=0;r<s;r++){let a=n/t,o=r/s,l=Math.sin(a*8+i*.7)*Math.cos(o*6+i*.5),c=Math.sin(a*12-i*.3)*Math.sin(o*10+i*.8),d=Math.cos((a+o)*5+i),h=(l+c+d+3)/6,p,x,u;h<.3?(p=h*3*100,x=0,u=0):h<.6?(p=100+(h-.3)*3*155,x=(h-.3)*3*100,u=0):(p=255,x=100+(h-.6)*2.5*155,u=(h-.6)*2.5*100),this.renderer.setPixel(n,r,[p,x,u])}}_renderAurora(e){let{width:t,height:s}=this.renderer,i=e.time||0;for(let n=0;n<t;n++)for(let r=0;r<s;r++){let a=n/t,o=r/s,l=Math.sin(a*6+i)*.3,c=Math.sin(a*4-i*.7)*.2,d=Math.sin(a*8+i*1.3)*.15,h=.5+l+c+d,p=Math.abs(o-h),x=Math.max(0,1-p*4),u=Math.pow(x,1.5),m=Math.sin(a*3+i*.5),b=u*(.2+m*.3)*255,_=u*(.8+Math.sin(i+a)*.2)*255,g=u*(.6+m*.4)*255,v=Math.sin(n*127.1+r*311.7)*.5+.5,y=Math.sin(i*3+n+r)*.5+.5,S=b,E=_,M=g;if(v>.98&&x<.3){let I=y*180;S=Math.max(b,I),E=Math.max(_,I),M=Math.max(g,I*.9)}this.renderer.setPixel(n,r,[S,E,M])}}};function Lt(f,e,t){let s,i,n,r=Math.floor(f*6),a=f*6-r,o=t*(1-e),l=t*(1-a*e),c=t*(1-(1-a)*e);switch(r%6){case 0:s=t,i=c,n=o;break;case 1:s=l,i=t,n=o;break;case 2:s=o,i=t,n=c;break;case 3:s=o,i=l,n=t;break;case 4:s=c,i=o,n=t;break;case 5:s=t,i=o,n=l;break}return[s*255,i*255,n*255]}var it=class{constructor(e){this.renderer=e}init(e,t){switch(e){case"color_cycle":t.hue=0;break;case"rainbow_text":t.offset=0;break;case"neon":t.glowIntensity=0,t.direction=1,t.baseColor=t.fgColor||"#ff00ff";break}}step(e,t){switch(e){case"color_cycle":t.hue=(t.hue+.01)%1;break;case"rainbow_text":t.offset=(t.offset+.02)%1;break;case"neon":t.glowIntensity+=t.direction*.05,t.glowIntensity>=1?(t.glowIntensity=1,t.direction=-1):t.glowIntensity<=.3&&(t.glowIntensity=.3,t.direction=1);break}}render(e,t,s){let{width:i,height:n}=this.renderer,r=s||[];for(let a=0;a<n;a++)for(let o=0;o<i;o++){let l=r[a*i+o]||"#111",[c,d,h]=this._hexToRgb(l);if(c>20||d>20||h>20)switch(e){case"color_cycle":{let[x,u,m]=Lt(t.hue,1,.8),b=(c+d+h)/(3*255);c=x*b,d=u*b,h=m*b;break}case"rainbow_text":{let x=(t.offset+o/i)%1,[u,m,b]=Lt(x,1,.8),_=(c+d+h)/(3*255);c=u*_,d=m*_,h=b*_;break}case"neon":{let x=this._hexToRgb(t.baseColor||"#ff00ff"),u=t.glowIntensity||.5;if(c=x[0]*u,d=x[1]*u,h=x[2]*u,u>.8){let m=(u-.8)*5;c=c+(255-c)*m*.3,d=d+(255-d)*m*.3,h=h+(255-h)*m*.3}break}}this.renderer.setPixel(o,a,[c,d,h])}}_hexToRgb(e){if(!e||e==="#111"||e==="#000")return[17,17,17];if(e==="#050505")return[5,5,5];let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:[17,17,17]}};var w={TEXT:"text",AMBIENT:"ambient",COLOR:"color"},k={fixed:{category:w.TEXT,name:"Fixed",description:"Static display"},scroll_ltr:{category:w.TEXT,name:"Scroll Left",description:"Text scrolls left to right"},scroll_rtl:{category:w.TEXT,name:"Scroll Right",description:"Text scrolls right to left"},blink:{category:w.TEXT,name:"Blink",description:"Text blinks on/off"},breeze:{category:w.TEXT,name:"Breeze",description:"Gentle wave brightness"},snow:{category:w.TEXT,name:"Snow",description:"Sparkle effect"},laser:{category:w.TEXT,name:"Laser",description:"Scanning beam"},fade:{category:w.TEXT,name:"Fade",description:"Fade in/out"},typewriter:{category:w.TEXT,name:"Typewriter",description:"Characters appear one by one"},bounce:{category:w.TEXT,name:"Bounce",description:"Text bounces back and forth"},sparkle:{category:w.TEXT,name:"Sparkle",description:"Random sparkle overlay"},rainbow:{category:w.AMBIENT,name:"Rainbow",description:"HSV rainbow gradient"},matrix:{category:w.AMBIENT,name:"Matrix",description:"Digital rain effect"},plasma:{category:w.AMBIENT,name:"Plasma",description:"Classic plasma waves"},gradient:{category:w.AMBIENT,name:"Gradient",description:"Moving color gradients"},fire:{category:w.AMBIENT,name:"Fire",description:"Fire/flame simulation"},water:{category:w.AMBIENT,name:"Water",description:"Ripple/wave effect"},stars:{category:w.AMBIENT,name:"Stars",description:"Twinkling starfield"},confetti:{category:w.AMBIENT,name:"Confetti",description:"Falling colored particles"},plasma_wave:{category:w.AMBIENT,name:"Plasma Wave",description:"Multi-frequency sine waves"},radial_pulse:{category:w.AMBIENT,name:"Radial Pulse",description:"Expanding ring patterns"},hypnotic:{category:w.AMBIENT,name:"Hypnotic",description:"Spiral pattern"},lava:{category:w.AMBIENT,name:"Lava",description:"Flowing lava/magma"},aurora:{category:w.AMBIENT,name:"Aurora",description:"Northern lights"},color_cycle:{category:w.COLOR,name:"Color Cycle",description:"Cycle through colors"},rainbow_text:{category:w.COLOR,name:"Rainbow Text",description:"Rainbow gradient on text"},neon:{category:w.COLOR,name:"Neon",description:"Pulsing neon glow"}},V=class{constructor(e){this.renderer=e,this.textEffects=new tt(e),this.ambientEffects=new et(e),this.colorEffects=new it(e),this.currentEffect="fixed",this.effectState={}}getEffectInfo(e){return k[e]||k.fixed}getEffectsByCategory(e){return Object.entries(k).filter(([t,s])=>s.category===e).map(([t,s])=>({name:t,...s}))}initEffect(e,t={}){let s=this.getEffectInfo(e);switch(this.currentEffect=e,this.effectState={tick:0,...t},s.category){case w.TEXT:this.textEffects.init(e,this.effectState);break;case w.AMBIENT:this.ambientEffects.init(e,this.effectState);break;case w.COLOR:this.colorEffects.init(e,this.effectState);break}return this.effectState}step(){let e=this.getEffectInfo(this.currentEffect);switch(this.effectState.tick=(this.effectState.tick||0)+1,e.category){case w.TEXT:this.textEffects.step(this.currentEffect,this.effectState);break;case w.AMBIENT:this.ambientEffects.step(this.currentEffect,this.effectState);break;case w.COLOR:this.colorEffects.step(this.currentEffect,this.effectState);break}}render(e,t,s){switch(this.getEffectInfo(this.currentEffect).category){case w.AMBIENT:this.ambientEffects.render(this.currentEffect,this.effectState);break;case w.TEXT:this.textEffects.render(this.currentEffect,this.effectState,e,t,s);break;case w.COLOR:this.colorEffects.render(this.currentEffect,this.effectState,e);break}}isAmbient(e){return this.getEffectInfo(e).category===w.AMBIENT}needsAnimation(e){return e!=="fixed"}},xe=Object.entries(k).filter(([f,e])=>e.category===w.TEXT).map(([f])=>f),ue=Object.entries(k).filter(([f,e])=>e.category===w.AMBIENT).map(([f])=>f),be=Object.entries(k).filter(([f,e])=>e.category===w.COLOR).map(([f])=>f),ge=Object.keys(k);var st=class{constructor(e,t={}){this.container=e,this.width=t.width||64,this.height=t.height||16,this.pixelGap=t.pixelGap||.1,this.buffer=[],this.prevBuffer=[],this._initBuffer(),this._colorPixels=[],this._extendedColorPixels=[],this.extendedWidth=this.width,this.effect="fixed",this.speed=50,this.animationId=null,this.lastFrameTime=0,this._isRunning=!1,this.pixelElements=[],this.svgCreated=!1,this._svg=null,this.effectManager=new V(this)}_initBuffer(){this.buffer=[],this.prevBuffer=[];for(let e=0;e<this.width*this.height;e++)this.buffer.push([0,0,0]),this.prevBuffer.push([-1,-1,-1])}_createSvg(){let t=100/this.width,s=t,i=this.height*s,n=this.pixelGap,r=document.createElementNS("http://www.w3.org/2000/svg","svg");r.setAttribute("viewBox",`0 0 100 ${i}`),r.setAttribute("preserveAspectRatio","xMidYMid meet"),r.style.width="100%",r.style.height="100%",r.style.display="block",this.pixelElements=[];for(let a=0;a<this.height;a++)for(let o=0;o<this.width;o++){let l=document.createElementNS("http://www.w3.org/2000/svg","rect");l.setAttribute("x",o*t),l.setAttribute("y",a*s),l.setAttribute("width",t-n),l.setAttribute("height",s-n),l.setAttribute("rx","0.3"),l.setAttribute("fill","rgb(17, 17, 17)"),r.appendChild(l),this.pixelElements.push(l)}this.container&&this.container.isConnected!==!1&&(this.container.innerHTML="",this.container.appendChild(r)),this._svg=r,this.svgCreated=!0}_ensureSvgInContainer(){return this.container?this._svg&&this._svg.parentNode===this.container?!0:this._svg&&this.container.isConnected!==!1?(this.container.innerHTML="",this.container.appendChild(this._svg),!0):!1:!1}setPixel(e,t,s){if(e>=0&&e<this.width&&t>=0&&t<this.height){let i=t*this.width+e;i<this.buffer.length&&(this.buffer[i]=s)}}clear(){for(let e=0;e<this.buffer.length;e++)this.buffer[e]=[0,0,0]}flush(){this.svgCreated?this._ensureSvgInContainer()||this._createSvg():this._createSvg();for(let e=0;e<this.buffer.length;e++){let t=this.buffer[e],s=this.prevBuffer[e];if(!t||!Array.isArray(t))continue;if(!s||!Array.isArray(s)){this.prevBuffer[e]=[-1,-1,-1];continue}let[i,n,r]=t,[a,o,l]=s;if(i!==a||n!==o||r!==l){let c=this.pixelElements[e];if(c){let d=i>20||n>20||r>20;c.setAttribute("fill",`rgb(${Math.round(i)}, ${Math.round(n)}, ${Math.round(r)})`),d?c.style.filter=`drop-shadow(0 0 2px rgb(${Math.round(i)}, ${Math.round(n)}, ${Math.round(r)}))`:c.style.filter=""}this.prevBuffer[e]=[i,n,r]}}}setData(e,t=null,s=null){this._colorPixels=e||[],t?(this._extendedColorPixels=t,this.extendedWidth=s||this.width):(this._extendedColorPixels=e||[],this.extendedWidth=this.width)}setEffect(e,t=50){let s=this._isRunning;this.effect!==e&&(this.effect=e,this.effectManager.initEffect(e,{speed:t})),this.speed=t,s&&e!=="fixed"&&this.start()}start(){this._isRunning||(this._isRunning=!0,this.lastFrameTime=performance.now(),this._animate())}stop(){this._isRunning=!1,this.animationId&&(cancelAnimationFrame(this.animationId),this.animationId=null)}get isRunning(){return this._isRunning}_animate(){if(!this._isRunning)return;let e=performance.now(),t=500-(this.speed-1)*4.7;e-this.lastFrameTime>=t&&(this.lastFrameTime=e,this.effectManager.step()),this._renderFrame(),this.animationId=requestAnimationFrame(()=>this._animate())}_renderFrame(){this.effectManager.render(this._colorPixels,this._extendedColorPixels,this.extendedWidth),this.flush()}renderStatic(){this.svgCreated||this._createSvg(),this._renderFrame()}setDimensions(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.extendedWidth=e,this._initBuffer(),this.svgCreated=!1,this.effectManager=new V(this),this.effect!=="fixed"&&this.effectManager.initEffect(this.effect,{speed:this.speed}))}setContainer(e){e!==this.container&&(this.container=e,this._svg&&e&&(e.innerHTML="",e.appendChild(this._svg)))}destroy(){this.stop(),this.pixelElements=[],this._svg=null,this.svgCreated=!1}};function $t(f,e,t,s=1){let n=100/f,r=n,a=e*r,o=s*.1,l="";for(let c=0;c<e;c++)for(let d=0;d<f;d++){let h=t[c*f+d]||"#111",x=h!=="#111"&&h!=="#000"&&h!=="#1a1a1a"&&h!=="#050505"?`filter:drop-shadow(0 0 2px ${h});`:"";l+=`<rect x="${d*n}" y="${c*r}" width="${n-o}" height="${r-o}" fill="${h}" rx="0.3" style="${x}"/>`}return`
    <svg viewBox="0 0 100 ${a}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
      ${l}
    </svg>`}var At="iPIXEL_DisplayState",qt={text:"",mode:"text",effect:"fixed",speed:50,fgColor:"#ff6600",bgColor:"#000000",font:"VCR_OSD_MONO",lastUpdate:0};function Jt(){try{let f=localStorage.getItem(At);if(f)return JSON.parse(f)}catch(f){console.warn("iPIXEL: Could not load saved state",f)}return{...qt}}function Kt(f){try{localStorage.setItem(At,JSON.stringify(f))}catch(e){console.warn("iPIXEL: Could not save state",e)}}window.iPIXELDisplayState||(window.iPIXELDisplayState=Jt());function Ft(){return window.iPIXELDisplayState}function $(f){return window.iPIXELDisplayState={...window.iPIXELDisplayState,...f,lastUpdate:Date.now()},Kt(window.iPIXELDisplayState),window.dispatchEvent(new CustomEvent("ipixel-display-update",{detail:window.iPIXELDisplayState})),window.iPIXELDisplayState}var nt=new Map,rt=class extends O{constructor(){super(),this._renderer=null,this._displayContainer=null,this._lastState=null,this._cachedResolution=null,this._rendererId=null,this._handleDisplayUpdate=e=>{this._updateDisplay(e.detail)},window.addEventListener("ipixel-display-update",this._handleDisplayUpdate)}connectedCallback(){this._rendererId||(this._rendererId=`renderer_${Date.now()}_${Math.random().toString(36).substr(2,9)}`),nt.has(this._rendererId)&&(this._renderer=nt.get(this._rendererId)),L("VCR_OSD_MONO",16).then(()=>{this._lastState&&this._updateDisplay(this._lastState)}),L("VCR_OSD_MONO",24),L("VCR_OSD_MONO",32),L("CUSONG",16),L("CUSONG",24),L("CUSONG",32),H("VCR_OSD_MONO"),H("CUSONG")}disconnectedCallback(){window.removeEventListener("ipixel-display-update",this._handleDisplayUpdate),this._renderer&&this._rendererId&&(this._renderer.stop(),nt.set(this._rendererId,this._renderer))}_getResolutionCached(){let[e,t]=this.getResolution();if(e>0&&t>0&&e!==64){this._cachedResolution=[e,t];try{localStorage.setItem("iPIXEL_Resolution",JSON.stringify([e,t]))}catch{}}if(this._cachedResolution)return this._cachedResolution;try{let s=localStorage.getItem("iPIXEL_Resolution");if(s){let i=JSON.parse(s);if(Array.isArray(i)&&i.length===2)return this._cachedResolution=i,i}}catch{}return this._config?.width&&this._config?.height?[this._config.width,this._config.height]:[e||64,t||16]}_updateDisplay(e){if(!this._displayContainer)return;let[t,s]=this._getResolutionCached(),i=this.isOn();if(this._renderer?(this._renderer.setContainer(this._displayContainer),(this._renderer.width!==t||this._renderer.height!==s)&&this._renderer.setDimensions(t,s)):(this._renderer=new st(this._displayContainer,{width:t,height:s}),this._rendererId&&nt.set(this._rendererId,this._renderer)),!i){this._renderer.stop();let m=ht("",t,s,"#111","#050505");this._displayContainer.innerHTML=$t(t,s,m);return}let n=e?.text||"",r=e?.effect||"fixed",a=e?.speed||50,o=e?.fgColor||"#ff6600",l=e?.bgColor||"#111",c=e?.mode||"text",d=e?.font||"VCR_OSD_MONO";this._lastState=e;let h=n,p=o;if(c==="clock"?(h=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!1}),p="#00ff88"):c==="gif"?(h="GIF",p="#ff44ff"):c==="rhythm"&&(h="***",p="#44aaff"),k[r]?.category==="ambient")this._renderer.setData([],[],t);else{let m=Q(s),b=d!=="LEGACY"&&Tt(d,m),_=d!=="LEGACY"&&J(d),g=(E,M,I,T,R)=>{if(b){let C=Rt(E,M,I,T,R,d);if(C)return C}if(_){let C=St(E,M,I,T,R,d);if(C)return C}return ht(E,M,I,T,R)},v=(E,M,I,T,R)=>{if(b){let C=Ot(E,M,I,T,R,d);if(C)return C}if(_){let C=It(E,M,I,T,R,d);if(C)return C}return vt(E,M,I,T,R)},y=_?h.length*10:h.length*6;if((r==="scroll_ltr"||r==="scroll_rtl"||r==="bounce")&&y>t){let E=v(h,t,s,p,l),M=g(h,t,s,p,l);this._renderer.setData(M,E.pixels,E.width)}else{let E=g(h,t,s,p,l);this._renderer.setData(E)}}this._renderer.setEffect(r,a),r==="fixed"?(this._renderer.stop(),this._renderer.renderStatic()):this._renderer.start()}render(){if(!this._hass)return;let[e,t]=this._getResolutionCached(),s=this.isOn(),i=this._config.name||this.getEntity()?.attributes?.friendly_name||"iPIXEL Display",n=Ft(),a=this.getEntity()?.state||"",l=this.getRelatedEntity("select","_mode")?.state||n.mode||"text",c=n.text||a,d=n.effect||"fixed",h=n.speed||50,p=n.fgColor||"#ff6600",x=n.bgColor||"#111",u=n.font||"VCR_OSD_MONO",b=k[d]?.category==="ambient",_=Object.entries(k).filter(([y,S])=>S.category==="text").map(([y,S])=>`<option value="${y}">${S.name}</option>`).join(""),g=Object.entries(k).filter(([y,S])=>S.category==="ambient").map(([y,S])=>`<option value="${y}">${S.name}</option>`).join(""),v=Object.entries(k).filter(([y,S])=>S.category==="color").map(([y,S])=>`<option value="${y}">${S.name}</option>`).join("");this.shadowRoot.innerHTML=`
      <style>${P}
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
              <span class="status-dot ${s?"":"off"}"></span>
              ${i}
            </div>
            <button class="icon-btn ${s?"active":""}" id="power-btn">
              <svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>
            </button>
          </div>
          <div class="display-container">
            <div class="display-screen" id="display-screen"></div>
            <div class="display-footer">
              <span>${e} x ${t}</span>
              <span>
                <span class="mode-badge">${s?l:"Off"}</span>
                ${s&&d!=="fixed"?`<span class="effect-badge">${k[d]?.name||d}</span>`:""}
              </span>
            </div>
          </div>
        </div>
      </ha-card>`,this._displayContainer=this.shadowRoot.getElementById("display-screen"),this._updateDisplay({text:c,effect:d,speed:h,fgColor:p,bgColor:x,mode:l,font:u}),this._attachPowerButton()}_attachPowerButton(){this.shadowRoot.getElementById("power-btn")?.addEventListener("click",()=>{let e=this._switchEntityId;if(!e){let t=this.getRelatedEntity("switch");t&&(this._switchEntityId=t.entity_id,e=t.entity_id)}if(e&&this._hass.states[e])this._hass.callService("switch","toggle",{entity_id:e});else{let t=Object.keys(this._hass.states).filter(n=>n.startsWith("switch.")),s=this._config.entity?.replace(/^[^.]+\./,"").replace(/_?(text|display|gif_url)$/i,"")||"",i=t.find(n=>n.includes(s.substring(0,10)));i?(this._switchEntityId=i,this._hass.callService("switch","toggle",{entity_id:i})):console.warn("iPIXEL: No switch found. Entity:",this._config.entity,"Available:",t)}})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var ot=class extends O{render(){if(!this._hass)return;let e=this.isOn();this.shadowRoot.innerHTML=`
      <style>${P}</style>
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
          <div class="section-title">Screen Buffer</div>
          <div class="control-row">
            <div class="button-grid button-grid-3">
              ${[1,2,3,4,5,6,7,8,9].map(t=>`<button class="mode-btn" data-screen="${t}">${t}</button>`).join("")}
            </div>
          </div>
          <div class="section-title">DIY Mode</div>
          <div class="control-row">
            <select class="dropdown" id="diy-mode">
              <option value="">-- Select Action --</option>
              <option value="1">Enter (Clear Display)</option>
              <option value="3">Enter (Preserve Content)</option>
              <option value="0">Exit (Keep Previous)</option>
              <option value="2">Exit (Keep Current)</option>
            </select>
          </div>
          <div class="section-title">Raw Command</div>
          <div class="control-row" style="margin-top: 8px;">
            <div style="display: flex; gap: 8px;">
              <input type="text" class="text-input" id="raw-command" placeholder="Raw hex (e.g., 05 00 07 01 01)" style="flex: 1;">
              <button class="btn btn-secondary" id="send-raw-btn">Send</button>
            </div>
          </div>
        </div>
      </ha-card>`,this._attachControlListeners()}_attachControlListeners(){this.shadowRoot.querySelectorAll("[data-action]").forEach(t=>{t.addEventListener("click",s=>{let i=s.currentTarget.dataset.action;if(i==="power"){let n=this.getRelatedEntity("switch");n&&this._hass.callService("switch","toggle",{entity_id:n.entity_id})}else i==="clear"?($({text:"",mode:"text",effect:"fixed",speed:50,fgColor:"#ff6600",bgColor:"#000000"}),this.callService("ipixel_color","clear_pixels")):i==="clock"?($({text:"",mode:"clock",effect:"fixed",speed:50,fgColor:"#00ff88",bgColor:"#000000"}),this.callService("ipixel_color","set_clock_mode",{style:1})):i==="sync"&&this.callService("ipixel_color","sync_time")})});let e=this.shadowRoot.getElementById("brightness");e&&(e.style.setProperty("--value",`${e.value}%`),e.addEventListener("input",t=>{t.target.style.setProperty("--value",`${t.target.value}%`),this.shadowRoot.getElementById("brightness-val").textContent=`${t.target.value}%`}),e.addEventListener("change",t=>{this.callService("ipixel_color","set_brightness",{level:parseInt(t.target.value)})})),this.shadowRoot.querySelectorAll("[data-mode]").forEach(t=>{t.addEventListener("click",s=>{let i=s.currentTarget.dataset.mode,n=this.getRelatedEntity("select","_mode");n&&this._hass.callService("select","select_option",{entity_id:n.entity_id,option:i}),$({mode:i,fgColor:{text:"#ff6600",textimage:"#ff6600",clock:"#00ff88",gif:"#ff44ff",rhythm:"#44aaff"}[i]||"#ff6600",text:i==="clock"?"":window.iPIXELDisplayState?.text||""}),this.shadowRoot.querySelectorAll("[data-mode]").forEach(a=>a.classList.remove("active")),s.currentTarget.classList.add("active")})}),this.shadowRoot.getElementById("orientation")?.addEventListener("change",t=>{let s=this.getRelatedEntity("select","_orientation");s&&this._hass.callService("select","select_option",{entity_id:s.entity_id,option:t.target.value})}),this.shadowRoot.querySelectorAll("[data-screen]").forEach(t=>{t.addEventListener("click",s=>{let i=parseInt(s.currentTarget.dataset.screen);this.callService("ipixel_color","set_screen",{screen:i}),this.shadowRoot.querySelectorAll("[data-screen]").forEach(n=>n.classList.remove("active")),s.currentTarget.classList.add("active")})}),this.shadowRoot.getElementById("diy-mode")?.addEventListener("change",t=>{let s=t.target.value;s!==""&&(this.callService("ipixel_color","set_diy_mode",{mode:s}),setTimeout(()=>{t.target.value=""},500))}),this.shadowRoot.getElementById("send-raw-btn")?.addEventListener("click",()=>{let t=this.shadowRoot.getElementById("raw-command")?.value;t&&t.trim()&&this.callService("ipixel_color","send_raw_command",{hex_data:t.trim()})}),this.shadowRoot.getElementById("raw-command")?.addEventListener("keypress",t=>{if(t.key==="Enter"){let s=t.target.value;s&&s.trim()&&this.callService("ipixel_color","send_raw_command",{hex_data:s.trim()})}})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var Zt=[{value:0,name:"None"},{value:1,name:"Rainbow Wave"},{value:2,name:"Rainbow Cycle"},{value:3,name:"Rainbow Pulse"},{value:4,name:"Rainbow Fade"},{value:5,name:"Rainbow Chase"},{value:6,name:"Rainbow Sparkle"},{value:7,name:"Rainbow Gradient"},{value:8,name:"Rainbow Theater"},{value:9,name:"Rainbow Fire"}],Qt=[{value:0,name:"Classic Bars"},{value:1,name:"Mirrored Bars"},{value:2,name:"Center Out"},{value:3,name:"Wave Style"},{value:4,name:"Particle Style"}],at=class extends O{constructor(){super(),this._activeTab="text",this._rhythmLevels=[0,0,0,0,0,0,0,0,0,0,0]}_buildTextEffectOptions(){let e=Object.entries(k).filter(([s,i])=>i.category===w.TEXT).map(([s,i])=>`<option value="${s}">${i.name}</option>`).join(""),t=Object.entries(k).filter(([s,i])=>i.category===w.COLOR).map(([s,i])=>`<option value="${s}">${i.name}</option>`).join("");return`
      <optgroup label="Text Effects">
        ${e}
      </optgroup>
      <optgroup label="Color Effects">
        ${t}
      </optgroup>
    `}_buildAmbientEffectOptions(){return Object.entries(k).filter(([e,t])=>t.category===w.AMBIENT).map(([e,t])=>`<option value="${e}">${t.name}</option>`).join("")}_buildAmbientGrid(){let e=this._selectedAmbient||"rainbow";return Object.entries(k).filter(([t,s])=>s.category===w.AMBIENT).map(([t,s])=>`
        <button class="effect-btn ${t===e?"active":""}" data-effect="${t}">
          ${s.name}
        </button>
      `).join("")}_buildRainbowOptions(){return Zt.map(e=>`<option value="${e.value}">${e.name}</option>`).join("")}_buildRhythmStyleGrid(){let e=this._selectedRhythmStyle||0;return Qt.map(t=>`
      <button class="style-btn ${t.value===e?"active":""}" data-style="${t.value}">
        ${t.name}
      </button>
    `).join("")}_buildRhythmLevelSliders(){let e=["32Hz","64Hz","125Hz","250Hz","500Hz","1kHz","2kHz","4kHz","8kHz","12kHz","16kHz"];return this._rhythmLevels.map((t,s)=>`
      <div class="rhythm-band">
        <label>${e[s]}</label>
        <input type="range" class="rhythm-slider" data-band="${s}" min="0" max="15" value="${t}">
        <span class="rhythm-val">${t}</span>
      </div>
    `).join("")}render(){if(!this._hass)return;let e=this._activeTab==="text",t=this._activeTab==="ambient",s=this._activeTab==="rhythm",i=this._activeTab==="advanced";this.shadowRoot.innerHTML=`
      <style>${P}
        .tabs { display: flex; gap: 4px; margin-bottom: 16px; }
        .tab {
          flex: 1;
          padding: 10px 8px;
          border: none;
          background: rgba(255,255,255,0.05);
          color: var(--primary-text-color, #fff);
          cursor: pointer;
          border-radius: 8px;
          font-size: 0.8em;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .tab:hover { background: rgba(255,255,255,0.1); }
        .tab.active {
          background: var(--primary-color, #03a9f4);
          color: #fff;
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .input-row .text-input { flex: 1; }
        select optgroup { font-weight: bold; color: var(--primary-text-color, #fff); }
        select option { font-weight: normal; }
        .effect-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .effect-btn, .style-btn {
          padding: 12px 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: var(--primary-text-color, #fff);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.75em;
          text-align: center;
          transition: all 0.2s ease;
        }
        .effect-btn:hover, .style-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .effect-btn.active, .style-btn.active {
          background: var(--primary-color, #03a9f4);
          border-color: var(--primary-color, #03a9f4);
        }
        .style-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .rhythm-band {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .rhythm-band label {
          width: 50px;
          font-size: 0.75em;
          opacity: 0.8;
        }
        .rhythm-slider {
          flex: 1;
          height: 4px;
        }
        .rhythm-val {
          width: 20px;
          font-size: 0.75em;
          text-align: right;
        }
        .rhythm-container {
          max-height: 300px;
          overflow-y: auto;
          padding-right: 8px;
        }
        .gfx-textarea {
          width: 100%;
          min-height: 150px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--primary-text-color, #fff);
          font-family: monospace;
          font-size: 0.8em;
          padding: 12px;
          resize: vertical;
        }
        .gfx-textarea:focus {
          outline: none;
          border-color: var(--primary-color, #03a9f4);
        }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="tabs">
            <button class="tab ${e?"active":""}" id="tab-text">Text</button>
            <button class="tab ${t?"active":""}" id="tab-ambient">Ambient</button>
            <button class="tab ${s?"active":""}" id="tab-rhythm">Rhythm</button>
            <button class="tab ${i?"active":""}" id="tab-advanced">GFX</button>
          </div>

          <!-- Text Tab -->
          <div class="tab-content ${e?"active":""}" id="content-text">
            <div class="section-title">Display Text</div>
            <div class="input-row">
              <input type="text" class="text-input" id="text-input" placeholder="Enter text to display...">
              <button class="btn btn-primary" id="send-btn">Send</button>
            </div>
            <div class="two-col">
              <div>
                <div class="section-title">Effect</div>
                <div class="control-row">
                  <select class="dropdown" id="text-effect">
                    ${this._buildTextEffectOptions()}
                  </select>
                </div>
              </div>
              <div>
                <div class="section-title">Rainbow Mode</div>
                <div class="control-row">
                  <select class="dropdown" id="rainbow-mode">
                    ${this._buildRainbowOptions()}
                  </select>
                </div>
              </div>
            </div>
            <div class="section-title">Speed</div>
            <div class="control-row">
              <div class="slider-row">
                <input type="range" class="slider" id="text-speed" min="1" max="100" value="50">
                <span class="slider-value" id="text-speed-val">50</span>
              </div>
            </div>
            <div class="section-title">Font</div>
            <div class="control-row">
              <select class="dropdown" id="font-select">
                <option value="VCR_OSD_MONO">VCR OSD Mono</option>
                <option value="CUSONG">CUSONG</option>
                <option value="LEGACY">Legacy (Bitmap)</option>
              </select>
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

          <!-- Ambient Tab -->
          <div class="tab-content ${t?"active":""}" id="content-ambient">
            <div class="section-title">Ambient Effect</div>
            <div class="effect-grid" id="ambient-grid">
              ${this._buildAmbientGrid()}
            </div>
            <div class="section-title">Speed</div>
            <div class="control-row">
              <div class="slider-row">
                <input type="range" class="slider" id="ambient-speed" min="1" max="100" value="50">
                <span class="slider-value" id="ambient-speed-val">50</span>
              </div>
            </div>
            <button class="btn btn-primary" id="apply-ambient-btn" style="width: 100%; margin-top: 8px;">Apply Effect</button>
          </div>

          <!-- Rhythm Tab -->
          <div class="tab-content ${s?"active":""}" id="content-rhythm">
            <div class="section-title">Visualization Style</div>
            <div class="style-grid" id="rhythm-style-grid">
              ${this._buildRhythmStyleGrid()}
            </div>
            <div class="section-title">Frequency Levels (0-15)</div>
            <div class="rhythm-container">
              ${this._buildRhythmLevelSliders()}
            </div>
            <button class="btn btn-primary" id="apply-rhythm-btn" style="width: 100%; margin-top: 12px;">Apply Rhythm</button>
          </div>

          <!-- Advanced/GFX Tab -->
          <div class="tab-content ${i?"active":""}" id="content-advanced">
            <div class="section-title">GFX JSON Data</div>
            <textarea class="gfx-textarea" id="gfx-json" placeholder='Enter GFX JSON data...
Example:
{
  "width": 64,
  "height": 16,
  "pixels": [
    {"x": 0, "y": 0, "color": "#ff0000"},
    {"x": 1, "y": 0, "color": "#00ff00"}
  ]
}'></textarea>
            <button class="btn btn-primary" id="apply-gfx-btn" style="width: 100%; margin-top: 12px;">Render GFX</button>
            <div class="section-title" style="margin-top: 16px;">Per-Character Colors</div>
            <div class="input-row">
              <input type="text" class="text-input" id="multicolor-text" placeholder="Text (e.g., HELLO)">
            </div>
            <div class="input-row">
              <input type="text" class="text-input" id="multicolor-colors" placeholder="Colors (e.g., #ff0000,#00ff00,#0000ff)">
            </div>
            <button class="btn btn-primary" id="apply-multicolor-btn" style="width: 100%; margin-top: 8px;">Send Multicolor Text</button>
          </div>
        </div>
      </ha-card>`,this._attachListeners()}_getTextFormValues(){return{text:this.shadowRoot.getElementById("text-input")?.value||"",effect:this.shadowRoot.getElementById("text-effect")?.value||"fixed",rainbowMode:parseInt(this.shadowRoot.getElementById("rainbow-mode")?.value||"0"),speed:parseInt(this.shadowRoot.getElementById("text-speed")?.value||"50"),fgColor:this.shadowRoot.getElementById("text-color")?.value||"#ff6600",bgColor:this.shadowRoot.getElementById("bg-color")?.value||"#000000",font:this.shadowRoot.getElementById("font-select")?.value||"VCR_OSD_MONO"}}_getRhythmFormValues(){return{style:this._selectedRhythmStyle||0,levels:[...this._rhythmLevels]}}_getGfxFormValues(){let e=this.shadowRoot.getElementById("gfx-json")?.value||"";try{return JSON.parse(e)}catch{return null}}_getMulticolorFormValues(){let e=this.shadowRoot.getElementById("multicolor-text")?.value||"",s=(this.shadowRoot.getElementById("multicolor-colors")?.value||"").split(",").map(i=>i.trim()).filter(i=>i);return{text:e,colors:s}}_getAmbientFormValues(){return{effect:this._selectedAmbient||"rainbow",speed:parseInt(this.shadowRoot.getElementById("ambient-speed")?.value||"50")}}_updateTextPreview(){let{text:e,effect:t,speed:s,fgColor:i,bgColor:n,font:r}=this._getTextFormValues();$({text:e||"Preview",mode:"text",effect:t,speed:s,fgColor:i,bgColor:n,font:r})}_updateAmbientPreview(){let{effect:e,speed:t}=this._getAmbientFormValues();$({text:"",mode:"ambient",effect:e,speed:t,fgColor:"#ffffff",bgColor:"#000000"})}_attachListeners(){this.shadowRoot.getElementById("tab-text")?.addEventListener("click",()=>{this._activeTab="text",this.render()}),this.shadowRoot.getElementById("tab-ambient")?.addEventListener("click",()=>{this._activeTab="ambient",this.render()});let e=this.shadowRoot.getElementById("text-speed");e&&(e.style.setProperty("--value",`${e.value}%`),e.addEventListener("input",s=>{s.target.style.setProperty("--value",`${s.target.value}%`),this.shadowRoot.getElementById("text-speed-val").textContent=s.target.value,this._updateTextPreview()})),this.shadowRoot.getElementById("text-effect")?.addEventListener("change",()=>{this._updateTextPreview()}),this.shadowRoot.getElementById("font-select")?.addEventListener("change",()=>{this._updateTextPreview()}),this.shadowRoot.getElementById("text-color")?.addEventListener("input",()=>{this._updateTextPreview()}),this.shadowRoot.getElementById("bg-color")?.addEventListener("input",()=>{this._updateTextPreview()}),this.shadowRoot.getElementById("text-input")?.addEventListener("input",()=>{this._updateTextPreview()}),this.shadowRoot.getElementById("send-btn")?.addEventListener("click",()=>{let{text:s,effect:i,speed:n,fgColor:r,bgColor:a,font:o}=this._getTextFormValues();if(s){$({text:s,mode:"text",effect:i,speed:n,fgColor:r,bgColor:a,font:o}),this._config.entity&&this._hass.callService("text","set_value",{entity_id:this._config.entity,value:s});let l=o==="LEGACY"?"CUSONG":o;this.callService("ipixel_color","display_text",{text:s,effect:i,speed:n,color_fg:this.hexToRgb(r),color_bg:this.hexToRgb(a),font:l})}}),this.shadowRoot.querySelectorAll(".effect-btn").forEach(s=>{s.addEventListener("click",i=>{let n=i.target.dataset.effect;this._selectedAmbient=n,this.shadowRoot.querySelectorAll(".effect-btn").forEach(r=>r.classList.remove("active")),i.target.classList.add("active"),this._updateAmbientPreview()})});let t=this.shadowRoot.getElementById("ambient-speed");t&&(t.style.setProperty("--value",`${t.value}%`),t.addEventListener("input",s=>{s.target.style.setProperty("--value",`${s.target.value}%`),this.shadowRoot.getElementById("ambient-speed-val").textContent=s.target.value,this._updateAmbientPreview()})),this.shadowRoot.getElementById("apply-ambient-btn")?.addEventListener("click",()=>{let{effect:s,speed:i}=this._getAmbientFormValues();$({text:"",mode:"ambient",effect:s,speed:i,fgColor:"#ffffff",bgColor:"#000000"})})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var lt=class extends O{render(){if(!this._hass)return;let e=this._config.items||[];this.shadowRoot.innerHTML=`
      <style>${P}
        .playlist-actions { display: flex; gap: 8px; margin-top: 12px; }
        .playlist-actions .btn { flex: 1; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header"><div class="card-title">Playlist</div></div>
          <div id="playlist-items">
            ${e.length===0?'<div class="empty-state">No playlist items yet</div>':e.map((t,s)=>`
                <div class="list-item">
                  <div class="list-item-info">
                    <div class="list-item-name">${t.name||`Item ${s+1}`}</div>
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
      </ha-card>`,this.shadowRoot.getElementById("start-btn")?.addEventListener("click",()=>{this.callService("ipixel_color","start_playlist")}),this.shadowRoot.getElementById("stop-btn")?.addEventListener("click",()=>{this.callService("ipixel_color","stop_playlist")})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var ct=class extends O{render(){if(!this._hass)return;let e=new Date,t=(e.getHours()*60+e.getMinutes())/1440*100;this.shadowRoot.innerHTML=`
      <style>${P}
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
      </ha-card>`,this.shadowRoot.getElementById("save-power")?.addEventListener("click",()=>{this.callService("ipixel_color","set_power_schedule",{enabled:!0,on_time:this.shadowRoot.getElementById("power-on")?.value,off_time:this.shadowRoot.getElementById("power-off")?.value})})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var dt=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}setConfig(e){this._config=e,this.render()}set hass(e){this._hass=e,this.render()}render(){if(!this._hass)return;let e=Object.keys(this._hass.states).filter(t=>t.startsWith("text.")||t.startsWith("switch.")).sort();this.shadowRoot.innerHTML=`
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
      </div>`,this.shadowRoot.querySelectorAll("select, input").forEach(t=>{t.addEventListener("change",()=>this.fireConfig())})}fireConfig(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:{type:this._config?.type||"custom:ipixel-display-card",entity:this.shadowRoot.getElementById("entity")?.value,name:this.shadowRoot.getElementById("name")?.value||void 0}},bubbles:!0,composed:!0}))}};customElements.define("ipixel-display-card",rt);customElements.define("ipixel-controls-card",ot);customElements.define("ipixel-text-card",at);customElements.define("ipixel-playlist-card",lt);customElements.define("ipixel-schedule-card",ct);customElements.define("ipixel-simple-editor",dt);window.customCards=window.customCards||[];[{type:"ipixel-display-card",name:"iPIXEL Display",description:"LED matrix preview with power control"},{type:"ipixel-controls-card",name:"iPIXEL Controls",description:"Brightness, mode, and orientation controls"},{type:"ipixel-text-card",name:"iPIXEL Text",description:"Text input with effects and colors"},{type:"ipixel-playlist-card",name:"iPIXEL Playlist",description:"Playlist management"},{type:"ipixel-schedule-card",name:"iPIXEL Schedule",description:"Power schedule and time slots"}].forEach(f=>window.customCards.push({...f,preview:!0,documentationURL:"https://github.com/cagcoach/ha-ipixel-color"}));console.info(`%c iPIXEL Cards %c ${yt} `,"background:#03a9f4;color:#fff;padding:2px 6px;border-radius:4px 0 0 4px;","background:#333;color:#fff;padding:2px 6px;border-radius:0 4px 4px 0;");})();

(()=>{var vt="2.11.1";var L=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._config={},this._hass=null}set hass(e){this._hass=e,this.render()}setConfig(e){if(!e.entity)throw new Error("Please define an entity");this._config=e,this.render()}getEntity(){return!this._hass||!this._config.entity?null:this._hass.states[this._config.entity]}getRelatedEntity(e,t=""){if(!this._hass||!this._config.entity)return null;let i=this._config.entity.replace(/^[^.]+\./,"").replace(/_?(text|display|gif_url)$/i,""),s=`${e}.${i}${t}`;if(this._hass.states[s])return this._hass.states[s];let n=Object.keys(this._hass.states).filter(r=>{if(!r.startsWith(`${e}.`))return!1;let a=r.replace(/^[^.]+\./,"");return a.includes(i)||i.includes(a.replace(t,""))});if(t){let r=n.find(a=>a.endsWith(t));if(r)return this._hass.states[r]}else{let r=n.sort((a,o)=>a.length-o.length);if(r.length>0)return this._hass.states[r[0]]}return n.length>0?this._hass.states[n[0]]:null}async callService(e,t,i={}){if(this._hass)try{await this._hass.callService(e,t,i)}catch(s){console.error(`iPIXEL service call failed: ${e}.${t}`,s)}}getResolution(){let e=this.getRelatedEntity("sensor","_width")||this._hass?.states["sensor.display_width"],t=this.getRelatedEntity("sensor","_height")||this._hass?.states["sensor.display_height"];if(e&&t){let i=parseInt(e.state),s=parseInt(t.state);if(!isNaN(i)&&!isNaN(s)&&i>0&&s>0)return[i,s]}return[64,16]}isOn(){return this.getRelatedEntity("switch")?.state==="on"}hexToRgb(e){let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:[255,255,255]}render(){}getCardSize(){return 2}};var $=`
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
`;var Y={A:[124,18,17,18,124],B:[127,73,73,73,54],C:[62,65,65,65,34],D:[127,65,65,34,28],E:[127,73,73,73,65],F:[127,9,9,9,1],G:[62,65,73,73,122],H:[127,8,8,8,127],I:[0,65,127,65,0],J:[32,64,65,63,1],K:[127,8,20,34,65],L:[127,64,64,64,64],M:[127,2,12,2,127],N:[127,4,8,16,127],O:[62,65,65,65,62],P:[127,9,9,9,6],Q:[62,65,81,33,94],R:[127,9,25,41,70],S:[70,73,73,73,49],T:[1,1,127,1,1],U:[63,64,64,64,63],V:[31,32,64,32,31],W:[63,64,56,64,63],X:[99,20,8,20,99],Y:[7,8,112,8,7],Z:[97,81,73,69,67],a:[32,84,84,84,120],b:[127,72,68,68,56],c:[56,68,68,68,32],d:[56,68,68,72,127],e:[56,84,84,84,24],f:[8,126,9,1,2],g:[12,82,82,82,62],h:[127,8,4,4,120],i:[0,68,125,64,0],j:[32,64,68,61,0],k:[127,16,40,68,0],l:[0,65,127,64,0],m:[124,4,24,4,120],n:[124,8,4,4,120],o:[56,68,68,68,56],p:[124,20,20,20,8],q:[8,20,20,24,124],r:[124,8,4,4,8],s:[72,84,84,84,32],t:[4,63,68,64,32],u:[60,64,64,32,124],v:[28,32,64,32,28],w:[60,64,48,64,60],x:[68,40,16,40,68],y:[12,80,80,80,60],z:[68,100,84,76,68],0:[62,81,73,69,62],1:[0,66,127,64,0],2:[66,97,81,73,70],3:[33,65,69,75,49],4:[24,20,18,127,16],5:[39,69,69,69,57],6:[60,74,73,73,48],7:[1,113,9,5,3],8:[54,73,73,73,54],9:[6,73,73,41,30]," ":[0,0,0,0,0],".":[0,96,96,0,0],",":[0,128,96,0,0],":":[0,54,54,0,0],";":[0,128,54,0,0],"!":[0,0,95,0,0],"?":[2,1,81,9,6],"-":[8,8,8,8,8],"+":[8,8,62,8,8],"=":[20,20,20,20,20],_:[64,64,64,64,64],"/":[32,16,8,4,2],"\\":[2,4,8,16,32],"(":[0,28,34,65,0],")":[0,65,34,28,0],"[":[0,127,65,65,0],"]":[0,65,65,127,0],"<":[8,20,34,65,0],">":[0,65,34,20,8],"*":[20,8,62,8,20],"#":[20,127,20,127,20],"@":[62,65,93,85,30],"&":[54,73,85,34,80],"%":[35,19,8,100,98],$:[18,42,127,42,36],"'":[0,0,7,0,0],'"':[0,7,0,7,0],"`":[0,1,2,0,0],"^":[4,2,1,2,4],"~":[8,4,8,16,8]};function ft(p,e,t,i="#ff6600",s="#111"){let n=[],o=Math.floor((t-7)/2);for(let h=0;h<t;h++)for(let f=0;f<e;f++)n.push(s);let l=p.length*6-1,d=Math.max(1,Math.floor((e-l)/2));for(let h of p){let f=Y[h]||Y[" "];for(let x=0;x<5;x++)for(let u=0;u<7;u++){let b=f[x]>>u&1,g=d+x,v=o+u;g>=0&&g<e&&v<t&&v>=0&&(n[v*e+g]=b?i:s)}d+=6}return n}function wt(p,e,t,i="#ff6600",s="#111"){let a=Math.floor((t-7)/2),o=p.length*6,l=e+o+e,c=[];for(let h=0;h<t;h++)for(let f=0;f<l;f++)c.push(s);let d=e;for(let h of p){let f=Y[h]||Y[" "];for(let x=0;x<5;x++)for(let u=0;u<7;u++){let b=f[x]>>u&1,g=d+x,v=a+u;g>=0&&g<l&&v<t&&v>=0&&(c[v*l+g]=b?i:s)}d+=6}return{pixels:c,width:l}}var St={VCR_OSD_MONO:{16:{font_size:16,offset:[0,0],pixel_threshold:70,var_width:!0},24:{font_size:24,offset:[0,0],pixel_threshold:70,var_width:!0},32:{font_size:28,offset:[-1,2],pixel_threshold:30,var_width:!1}},CUSONG:{16:{font_size:16,offset:[0,-1],pixel_threshold:70,var_width:!1},24:{font_size:24,offset:[0,0],pixel_threshold:70,var_width:!1},32:{font_size:32,offset:[0,0],pixel_threshold:70,var_width:!1}}},N={},J={};function zt(p){return window.location.pathname.includes("preview.html")||window.location.port==="8080"?`./fonts/${p}.ttf`:`/hacsfiles/ipixel_color/fonts/${p}.ttf`}async function z(p){return N[p]===!0?!0:N[p]===!1?!1:(J[p]||(J[p]=(async()=>{let e=zt(p);try{let i=await new FontFace(p,`url(${e})`).load();return document.fonts.add(i),N[p]=!0,console.log(`iPIXEL: Font ${p} loaded successfully`),!0}catch(t){return console.warn(`iPIXEL: Failed to load font ${p}:`,t),N[p]=!1,!1}})()),J[p])}function K(p){return N[p]===!0}function It(p){return p<=18?16:p<=28?24:32}function Et(p){let e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(p);return e?{r:parseInt(e[1],16),g:parseInt(e[2],16),b:parseInt(e[3],16)}:{r:0,g:0,b:0}}function Ct(p,e,t,i="#ff6600",s="#111",n="VCR_OSD_MONO"){let r=St[n];if(!r)return console.warn(`iPIXEL: Unknown font: ${n}`),null;if(!K(n))return z(n),null;let a=It(t),o=r[a],l=document.createElement("canvas");l.width=e,l.height=t;let c=l.getContext("2d");if(c.imageSmoothingEnabled=!1,c.fillStyle=s,c.fillRect(0,0,e,t),!p||p.trim()===""){let m=[];for(let y=0;y<e*t;y++)m.push(s);return m}c.font=`${o.font_size}px "${n}"`,c.fillStyle=i,c.textBaseline="top";let h=c.measureText(p).width,f=Math.floor((e-h)/2)+o.offset[0],x=Math.floor((t-o.font_size)/2)+o.offset[1];c.fillText(p,f,x);let u=c.getImageData(0,0,e,t),b=[],g=Et(i),v=Et(s);for(let m=0;m<u.data.length;m+=4){let y=u.data[m],_=u.data[m+1],S=u.data[m+2];(y+_+S)/3>=o.pixel_threshold?b.push(i):b.push(s)}return b}function kt(p,e,t,i="#ff6600",s="#111",n="VCR_OSD_MONO"){let r=St[n];if(!r)return null;if(!K(n))return z(n),null;let a=It(t),o=r[a],c=document.createElement("canvas").getContext("2d");c.font=`${o.font_size}px "${n}"`;let d=Math.ceil(c.measureText(p).width),h=e+d+e,f=document.createElement("canvas");f.width=h,f.height=t;let x=f.getContext("2d");if(x.imageSmoothingEnabled=!1,x.fillStyle=s,x.fillRect(0,0,h,t),!p||p.trim()===""){let m=[];for(let y=0;y<h*t;y++)m.push(s);return{pixels:m,width:h}}x.font=`${o.font_size}px "${n}"`,x.fillStyle=i,x.textBaseline="top";let u=e+o.offset[0],b=Math.floor((t-o.font_size)/2)+o.offset[1];x.fillText(p,u,b);let g=x.getImageData(0,0,h,t),v=[];for(let m=0;m<g.data.length;m+=4){let y=g.data[m],_=g.data[m+1],S=g.data[m+2];(y+_+S)/3>=o.pixel_threshold?v.push(i):v.push(s)}return{pixels:v,width:h}}var Vt=function(p,e,t,i){return new(t||(t=Promise))(function(s,n){function r(l){try{o(i.next(l))}catch(c){n(c)}}function a(l){try{o(i.throw(l))}catch(c){n(c)}}function o(l){var c;l.done?s(l.value):(c=l.value,c instanceof t?c:new t(function(d){d(c)})).then(r,a)}o((i=i.apply(p,e||[])).next())})},F=function(p){return this instanceof F?(this.v=p,this):new F(p)},Gt=function(p,e,t){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var i,s=t.apply(p,e||[]),n=[];return i={},r("next"),r("throw"),r("return"),i[Symbol.asyncIterator]=function(){return this},i;function r(d){s[d]&&(i[d]=function(h){return new Promise(function(f,x){n.push([d,h,f,x])>1||a(d,h)})})}function a(d,h){try{(f=s[d](h)).value instanceof F?Promise.resolve(f.value.v).then(o,l):c(n[0][2],f)}catch(x){c(n[0][3],x)}var f}function o(d){a("next",d)}function l(d){a("throw",d)}function c(d,h){d(h),n.shift(),n.length&&a(n[0][0],n[0][1])}};function Rt(p,{includeLastEmptyLine:e=!0,encoding:t="utf-8",delimiter:i=/\r?\n/g}={}){return Gt(this,arguments,function*(){let s=yield F((d=>Vt(void 0,void 0,void 0,function*(){let h=yield fetch(d);if(h.body===null)throw new Error("Cannot read file");return h.body.getReader()}))(p)),{value:n,done:r}=yield F(s.read()),a=new TextDecoder(t),o,l=n?a.decode(n):"";if(typeof i=="string"){if(i==="")throw new Error("delimiter cannot be empty string!");o=new RegExp(i.replace(/[.*+\-?^${}()|[\]\\]/g,"\\$&"),"g")}else o=/g/.test(i.flags)===!1?new RegExp(i.source,i.flags+"g"):i;let c=0;for(;;){let d=o.exec(l);if(d!==null)yield yield F(l.substring(c,d.index)),c=o.lastIndex;else{if(r===!0)break;let h=l.substring(c);({value:n,done:r}=yield F(s.read())),l=h+(l?a.decode(n):""),c=0}}(e||c<l.length)&&(yield yield F(l.substring(c)))})}var B=function(p,e,t,i){return new(t||(t=Promise))(function(s,n){function r(l){try{o(i.next(l))}catch(c){n(c)}}function a(l){try{o(i.throw(l))}catch(c){n(c)}}function o(l){var c;l.done?s(l.value):(c=l.value,c instanceof t?c:new t(function(d){d(c)})).then(r,a)}o((i=i.apply(p,e||[])).next())})},Wt=function(p){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var e,t=p[Symbol.asyncIterator];return t?t.call(p):(p=typeof __values=="function"?__values(p):p[Symbol.iterator](),e={},i("next"),i("throw"),i("return"),e[Symbol.asyncIterator]=function(){return this},e);function i(s){e[s]=p[s]&&function(n){return new Promise(function(r,a){(function(o,l,c,d){Promise.resolve(d).then(function(h){o({value:h,done:c})},l)})(r,a,(n=p[s](n)).done,n.value)})}}},Mt="[\\s]+",jt={glyphname:"empty",codepoint:8203,bbw:0,bbh:0,bbxoff:0,bbyoff:0,swx0:0,swy0:0,dwx0:0,dwy0:0,swx1:0,swy1:0,dwx1:0,dwy1:0,vvectorx:0,vvectory:0,hexdata:[]},Ut=["glyphname","codepoint","bbw","bbh","bbxoff","bbyoff","swx0","swy0","dwx0","dwy0","swx1","swy1","dwx1","dwy1","vvectorx","vvectory","hexdata"],qt={lr:"lrtb",rl:"rltb",tb:"tbrl",bt:"btrl",lrtb:void 0,lrbt:void 0,rltb:void 0,rlbt:void 0,tbrl:void 0,tblr:void 0,btrl:void 0,btlr:void 0},Z={lr:1,rl:2,tb:0,bt:-1},xt=class{constructor(){this.headers=void 0,this.__headers={},this.props={},this.glyphs=new Map,this.__glyph_count_to_check=null,this.__curline_startchar=null,this.__curline_chars=null}load_filelines(e){var t,i;return B(this,void 0,void 0,function*(){try{this.__f=e,yield this.__parse_headers()}finally{if(typeof Deno<"u"&&this.__f!==void 0)try{for(var s,n=Wt(this.__f);!(s=yield n.next()).done;)s.value}catch(r){t={error:r}}finally{try{s&&!s.done&&(i=n.return)&&(yield i.call(n))}finally{if(t)throw t.error}}}return this})}__parse_headers(){var e,t;return B(this,void 0,void 0,function*(){for(;;){let i=(t=yield(e=this.__f)===null||e===void 0?void 0:e.next())===null||t===void 0?void 0:t.value,s=i.split(/ (.+)/,2),n=s.length,r;if(n===2){let a=s[0],o=s[1].trim();switch(a){case"STARTFONT":this.__headers.bdfversion=parseFloat(o);break;case"FONT":this.__headers.fontname=o;break;case"SIZE":r=o.split(" "),this.__headers.pointsize=parseInt(r[0],10),this.__headers.xres=parseInt(r[1],10),this.__headers.yres=parseInt(r[2],10);break;case"FONTBOUNDINGBOX":r=o.split(" "),this.__headers.fbbx=parseInt(r[0],10),this.__headers.fbby=parseInt(r[1],10),this.__headers.fbbxoff=parseInt(r[2],10),this.__headers.fbbyoff=parseInt(r[3],10);break;case"STARTPROPERTIES":return this.__parse_headers_after(),void(yield this.__parse_props());case"COMMENT":"comment"in this.__headers&&Array.isArray(this.__headers.comment)||(this.__headers.comment=[]),this.__headers.comment.push(o.replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g,""));break;case"SWIDTH":r=o.split(" "),this.__headers.swx0=parseInt(r[0],10),this.__headers.swy0=parseInt(r[1],10);break;case"DWIDTH":r=o.split(" "),this.__headers.dwx0=parseInt(r[0],10),this.__headers.dwy0=parseInt(r[1],10);break;case"SWIDTH1":r=o.split(" "),this.__headers.swx1=parseInt(r[0],10),this.__headers.swy1=parseInt(r[1],10);break;case"DWIDTH1":r=o.split(" "),this.__headers.dwx1=parseInt(r[0],10),this.__headers.dwy1=parseInt(r[1],10);break;case"VVECTOR":r=Mt.split(o),this.__headers.vvectorx=parseInt(r[0],10),this.__headers.vvectory=parseInt(r[1],10);break;case"METRICSSET":case"CONTENTVERSION":this.__headers[a.toLowerCase()]=parseInt(o,10);break;case"CHARS":return console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword"),this.__parse_headers_after(),this.__curline_chars=i,void(yield this.__parse_glyph_count());case"STARTCHAR":return console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword"),console.warn("Cannot find 'CHARS' line"),this.__parse_headers_after(),this.__curline_startchar=i,void(yield this.__prepare_glyphs())}}if(n===1&&s[0].trim()==="ENDFONT")return console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword"),void console.warn("This font does not have any glyphs")}})}__parse_headers_after(){"metricsset"in this.__headers||(this.__headers.metricsset=0),this.headers=this.__headers}__parse_props(){var e,t;return B(this,void 0,void 0,function*(){for(;;){let i=((t=yield(e=this.__f)===null||e===void 0?void 0:e.next())===null||t===void 0?void 0:t.value).split(/ (.+)/,2),s=i.length;if(s===2){let n=i[0],r=i[1].replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g,"");n==="COMMENT"?("comment"in this.props&&Array.isArray(this.props.comment)||(this.props.comment=[]),this.props.comment.push(r.replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g,""))):this.props[n.toLowerCase()]=r}else if(s===1){let n=i[0].trim();if(n==="ENDPROPERTIES")return void(yield this.__parse_glyph_count());if(n==="ENDFONT")return void console.warn("This font does not have any glyphs");this.props[n]=null}}})}__parse_glyph_count(){var e,t;return B(this,void 0,void 0,function*(){let i;if(this.__curline_chars===null?i=(t=yield(e=this.__f)===null||e===void 0?void 0:e.next())===null||t===void 0?void 0:t.value:(i=this.__curline_chars,this.__curline_chars=null),i.trim()==="ENDFONT")return void console.warn("This font does not have any glyphs");let s=i.split(/ (.+)/,2);s[0]==="CHARS"?this.__glyph_count_to_check=parseInt(s[1].trim(),10):(this.__curline_startchar=i,console.warn("Cannot find 'CHARS' line next to 'ENDPROPERTIES' line")),yield this.__prepare_glyphs()})}__prepare_glyphs(){var e,t;return B(this,void 0,void 0,function*(){let i=0,s=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],n=[],r=!1,a=!1;for(;;){let o;if(this.__curline_startchar===null?o=(t=yield(e=this.__f)===null||e===void 0?void 0:e.next())===null||t===void 0?void 0:t.value:(o=this.__curline_startchar,this.__curline_startchar=null),o==null)return console.warn("This font does not have 'ENDFONT' keyword"),void this.__prepare_glyphs_after();let l=o.split(/ (.+)/,2),c=l.length;if(c===2){let d=l[0],h=l[1].trim(),f;switch(d){case"STARTCHAR":s=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],s[0]=h,a=!1;break;case"ENCODING":i=parseInt(h,10),s[1]=i;break;case"BBX":f=h.split(" "),s[2]=parseInt(f[0],10),s[3]=parseInt(f[1],10),s[4]=parseInt(f[2],10),s[5]=parseInt(f[3],10);break;case"SWIDTH":f=h.split(" "),s[6]=parseInt(f[0],10),s[7]=parseInt(f[1],10);break;case"DWIDTH":f=h.split(" "),s[8]=parseInt(f[0],10),s[9]=parseInt(f[1],10);break;case"SWIDTH1":f=h.split(" "),s[10]=parseInt(f[0],10),s[11]=parseInt(f[1],10);break;case"DWIDTH1":f=h.split(" "),s[12]=parseInt(f[0],10),s[13]=parseInt(f[1],10);break;case"VVECTOR":f=Mt.split(h),s[14]=parseInt(f[0],10),s[15]=parseInt(f[1],10)}}else if(c===1){let d=l[0].trim();switch(d){case"BITMAP":n=[],r=!0;break;case"ENDCHAR":r=!1,s[16]=n,this.glyphs.set(i,s),a=!0;break;case"ENDFONT":if(a)return void this.__prepare_glyphs_after();default:r&&n.push(d)}}}})}__prepare_glyphs_after(){let e=this.glyphs.size;this.__glyph_count_to_check!==e&&(this.__glyph_count_to_check===null?console.warn("The glyph count next to 'CHARS' keyword does not exist"):console.warn(`The glyph count next to 'CHARS' keyword is ${this.__glyph_count_to_check.toString()}, which does not match the actual glyph count ${e.toString()}`))}get length(){return this.glyphs.size}itercps(e,t){let i=e??1,s=t??null,n,r=[...this.glyphs.keys()];switch(i){case 1:n=r.sort((a,o)=>a-o);break;case 0:n=r;break;case 2:n=r.sort((a,o)=>o-a);break;case-1:n=r.reverse()}if(s!==null){let a=o=>{if(typeof s=="number")return o<s;if(Array.isArray(s)&&s.length===2&&typeof s[0]=="number"&&typeof s[1]=="number")return o<=s[1]&&o>=s[0];if(Array.isArray(s)&&Array.isArray(s[0]))for(let l of s){let[c,d]=l;if(o<=d&&o>=c)return!0}return!1};n=n.filter(a)}return n}*iterglyphs(e,t){for(let i of this.itercps(e,t))yield this.glyphbycp(i)}glyphbycp(e){let t=this.glyphs.get(e);if(t==null)return console.warn(`Glyph "${String.fromCodePoint(e)}" (codepoint ${e.toString()}) does not exist in the font. Will return 'null'`),null;{let i={};return Ut.forEach((s,n)=>{var r,a,o;r=i,a=s,o=t[n],r[a]=o}),new D(i,this)}}glyph(e){let t=e.codePointAt(0);return t===void 0?null:this.glyphbycp(t)}lacksglyphs(e){let t=[],i=e.length;for(let s,n=0;n<i;n++){s=e[n];let r=s.codePointAt(0);r!==void 0&&this.glyphs.has(r)||t.push(s)}return t.length!==0?t:null}drawcps(e,t={}){var i,s,n,r,a,o,l;let c=(i=t.linelimit)!==null&&i!==void 0?i:512,d=(s=t.mode)!==null&&s!==void 0?s:1,h=(n=t.direction)!==null&&n!==void 0?n:"lrtb",f=(r=t.usecurrentglyphspacing)!==null&&r!==void 0&&r,x=(a=t.missing)!==null&&a!==void 0?a:null;if(this.headers===void 0)throw new Error("Font is not loaded");let u,b,g,v,m,y,_,S,E,C,I,R,T,M,A,W,j,U,ut=(o=qt[h])!==null&&o!==void 0?o:h,gt=ut.slice(0,2),bt=ut.slice(2,4);gt in Z&&bt in Z?(y=Z[gt],_=Z[bt]):(y=1,_=0),_===0||_===2?u=1:_!==1&&_!==-1||(u=0),y===1||y===-1?b=1:y!==2&&y!==0||(b=0),d===1&&(S=y>0?this.headers.fbbx:this.headers.fbby,y>0?(R="dwx0",T="dwy0"):(R="dwx1",T="dwy1"),I=R in this.headers?this.headers[R]:T in this.headers?this.headers[T]:null);let mt=[];v=[];let _t=[];A=[],W=0;let yt=()=>{mt.push(v),f?A.shift():A.pop(),_t.push(A)},Xt=e[Symbol.iterator]();for(j=!1;;){if(j)j=!1;else{if(m=(l=Xt.next())===null||l===void 0?void 0:l.value,m===void 0)break;let q=this.glyphbycp(m);E=q!==null?q:x?x instanceof D?x:new D(x,this):new D(jt,this),g=E.draw(),U=g.width(),M=0,d===1&&R!==void 0&&T!==void 0&&(C=E.meta[R]||E.meta[T],C==null&&(C=I),C!=null&&S!==void 0&&(M=C-S))}if(U!==void 0&&M!==void 0&&g!==void 0&&E!==void 0&&m!==void 0)if(W+=U+M,W<=c)v.push(g),A.push(M);else{if(v.length===0)throw new Error(`\`_linelimit\` (${c}) is too small the line can't even contain one glyph: "${E.chr()}" (codepoint ${m}, width: ${U})`);yt(),W=0,v=[],A=[],j=!0}}v.length!==0&&yt();let Ht=mt.map((q,Nt)=>V.concatall(q,{direction:y,align:u,offsetlist:_t[Nt]}));return V.concatall(Ht,{direction:_,align:b})}draw(e,t={}){let{linelimit:i,mode:s,direction:n,usecurrentglyphspacing:r,missing:a}=t;return this.drawcps(e.split("").map(o=>{let l=o.codePointAt(0);return l===void 0?8203:l}),{linelimit:i,mode:s,direction:n,usecurrentglyphspacing:r,missing:a})}drawall(e={}){let{order:t,r:i,linelimit:s,mode:n,direction:r,usecurrentglyphspacing:a}=e,o=n??0;return this.drawcps(this.itercps(t,i),{linelimit:s,mode:o,direction:r,usecurrentglyphspacing:a})}},D=class{constructor(e,t){this.meta=e,this.font=t}toString(){return this.draw().toString()}repr(){var e;return"Glyph("+JSON.stringify(this.meta,null,2)+", Font(<"+((e=this.font.headers)===null||e===void 0?void 0:e.fontname)+">)"}cp(){return this.meta.codepoint}chr(){return String.fromCodePoint(this.cp())}draw(e,t){let i=t??null,s;switch(e??0){case 0:s=this.__draw_fbb();break;case 1:s=this.__draw_bb();break;case 2:s=this.__draw_original();break;case-1:if(i===null)throw new Error("Parameter bb in draw() method must be set when mode=-1");s=this.__draw_user_specified(i)}return s}__draw_user_specified(e){let t=this.meta.bbxoff,i=this.meta.bbyoff,[s,n,r,a]=e;return this.__draw_bb().crop(s,n,-t+r,-i+a)}__draw_original(){return new V(this.meta.hexdata.map(e=>e?parseInt(e,16).toString(2).padStart(4*e.length,"0"):""))}__draw_bb(){let e=this.meta.bbw,t=this.meta.bbh,i=this.__draw_original(),s=i.bindata,n=s.length;return n!==t&&console.warn(`Glyph "${this.meta.glyphname.toString()}" (codepoint ${this.meta.codepoint.toString()})'s bbh, ${t.toString()}, does not match its hexdata line count, ${n.toString()}`),i.bindata=s.map(r=>r.slice(0,e)),i}__draw_fbb(){let e=this.font.headers;if(e===void 0)throw new Error("Font is not loaded");return this.__draw_user_specified([e.fbbx,e.fbby,e.fbbxoff,e.fbbyoff])}origin(e={}){var t,i,s,n;let r=(t=e.mode)!==null&&t!==void 0?t:0,a=(i=e.fromorigin)!==null&&i!==void 0&&i,o=(s=e.xoff)!==null&&s!==void 0?s:null,l=(n=e.yoff)!==null&&n!==void 0?n:null,c,d=this.meta.bbxoff,h=this.meta.bbyoff;switch(r){case 0:let f=this.font.headers;if(f===void 0)throw new Error("Font is not loaded");c=[f.fbbxoff,f.fbbyoff];break;case 1:case 2:c=[d,h];break;case-1:if(o===null||l===null)throw new Error("Parameter xoff and yoff in origin() method must be all set when mode=-1");c=[o,l]}return a?c:[0-c[0],0-c[1]]}},V=class p{constructor(e){this.bindata=e}toString(){return this.bindata.join(`
`).replace(/0/g,".").replace(/1/g,"#").replace(/2/g,"&")}repr(){return`Bitmap(${JSON.stringify(this.bindata,null,2)})`}width(){return this.bindata[0].length}height(){return this.bindata.length}clone(){return new p([...this.bindata])}static __crop_string(e,t,i){let s=e,n=e.length,r=0;t<0&&(r=0-t,s=s.padStart(r+n,"0")),t+i>n&&(s=s.padEnd(t+i-n+s.length,"0"));let a=t+r;return s.slice(a,a+i)}static __string_offset_concat(e,t,i){let s=i??0;if(s===0)return e+t;let n=e.length,r=n+s,a=r+t.length,o=Math.min(0,r),l=Math.max(n,a),c=p.__crop_string(e,o,l-o),d=p.__crop_string(t,o-r,l-o);return c.split("").map((h,f)=>(parseInt(d[f],10)||parseInt(h,10)).toString()).join("")}static __listofstr_offset_concat(e,t,i){let s=i??0,n,r;if(s===0)return e.concat(t);let a=e[0].length,o=e.length,l=o+s,c=l+t.length,d=Math.min(0,l),h=Math.max(o,c),f=[];for(let x=d;x<h;x++)n=x<0||x>=o?"0".repeat(a):e[x],r=x<l||x>=c?"0".repeat(a):t[x-l],f.push(n.split("").map((u,b)=>(parseInt(r[b],10)||parseInt(u,10)).toString()).join(""));return f}static __crop_bitmap(e,t,i,s,n){let r,a=[],o=e.length;for(let l=0;l<i;l++)r=o-n-i+l,r<0||r>=o?a.push("0".repeat(t)):a.push(p.__crop_string(e[r],s,t));return a}crop(e,t,i,s){let n=i??0,r=s??0;return this.bindata=p.__crop_bitmap(this.bindata,e,t,n,r),this}overlay(e){let t=this.bindata,i=e.bindata;return t.length!==i.length&&console.warn("the bitmaps to overlay have different height"),t[0].length!==i[0].length&&console.warn("the bitmaps to overlay have different width"),this.bindata=t.map((s,n)=>{let r=s,a=i[n];return r.split("").map((o,l)=>(parseInt(a[l],10)||parseInt(o,10)).toString()).join("")}),this}static concatall(e,t={}){var i,s,n;let r=(i=t.direction)!==null&&i!==void 0?i:1,a=(s=t.align)!==null&&s!==void 0?s:1,o=(n=t.offsetlist)!==null&&n!==void 0?n:null,l,c,d,h,f,x,u;if(r>0){d=Math.max(...e.map(g=>g.height())),f=Array(d).fill("");let b=(g,v,m)=>r===1?p.__string_offset_concat(g,v,m):p.__string_offset_concat(v,g,m);for(let g=0;g<d;g++){c=a?-g-1:g,h=0;let v=e.length;for(let m=0;m<v;m++){let y=e[m];o&&m!==0&&(h=o[m-1]),g<y.height()?c>=0?f[c]=b(f[c],y.bindata[c],h):f[d+c]=b(f[d+c],y.bindata[y.height()+c],h):c>=0?f[c]=b(f[c],"0".repeat(y.width()),h):f[d+c]=b(f[d+c],"0".repeat(y.width()),h)}}}else{d=Math.max(...e.map(g=>g.width())),f=[],h=0;let b=e.length;for(let g=0;g<b;g++){let v=e[g];o&&g!==0&&(h=o[g-1]),l=v.bindata,x=v.width(),x!==d&&(u=a?0:x-d,l=this.__crop_bitmap(l,d,v.height(),u,0)),f=r===0?p.__listofstr_offset_concat(f,l,h):p.__listofstr_offset_concat(l,f,h)}}return new this(f)}concat(e,t={}){let{direction:i,align:s,offset:n}=t,r=n??0;return this.bindata=p.concatall([this,e],{direction:i,align:s,offsetlist:[r]}).bindata,this}static __enlarge_bindata(e,t,i){let s=t??1,n=i??1,r=[...e];return s>1&&(r=r.map(a=>a.split("").reduce((o,l)=>o.concat(Array(s).fill(l)),[]).join(""))),n>1&&(r=r.reduce((a,o)=>a.concat(Array(n).fill(o)),[])),r}enlarge(e,t){return this.bindata=p.__enlarge_bindata(this.bindata,e,t),this}replace(e,t){let i=typeof e=="number"?e.toString():e,s=typeof t=="number"?t.toString():t;return this.bindata=this.bindata.map(n=>((r,a,o)=>{if("replaceAll"in String.prototype)return r.replaceAll(a,o);{let l=c=>c.replace(/[.*+\-?^${}()|[\]\\]/g,"\\$&");return r.replace(new RegExp(l(a),"g"),o)}})(n,i,s)),this}shadow(e,t){let i=e??1,s=t??-1,n,r,a,o,l,c,d=this.clone();return c=this.width(),n=this.height(),c+=Math.abs(i),n+=Math.abs(s),d.bindata=d.bindata.map(h=>h.replace(/1/g,"2")),i>0?(r=0,o=-i):(r=i,o=0),s>0?(a=0,l=-s):(a=s,l=0),this.crop(c,n,r,a),d.crop(c,n,o,l),d.overlay(this),this.bindata=d.bindata,this}glow(e){var t,i,s,n,r,a,o,l,c,d,h,f,x,u;let b=e??0,g,v,m,y;m=this.width(),y=this.height(),m+=2,y+=2,this.crop(m,y,-1,-1);let _=this.todata(2),S=_.length;for(let E=0;E<S;E++){g=_[E];let C=g.length;for(let I=0;I<C;I++)v=g[I],v===1&&((t=_[E])[i=I-1]||(t[i]=2),(s=_[E])[n=I+1]||(s[n]=2),(r=_[E-1])[I]||(r[I]=2),(a=_[E+1])[I]||(a[I]=2),b===1&&((o=_[E-1])[l=I-1]||(o[l]=2),(c=_[E-1])[d=I+1]||(c[d]=2),(h=_[E+1])[f=I-1]||(h[f]=2),(x=_[E+1])[u=I+1]||(x[u]=2)))}return this.bindata=_.map(E=>E.map(C=>C.toString()).join("")),this}bytepad(e){let t=e??8,i=this.width(),s=this.height(),n=i%t;return n===0?this:this.crop(i+t-n,s)}todata(e){let t;switch(e??1){case 0:t=this.bindata.join(`
`);break;case 1:t=this.bindata;break;case 2:t=this.bindata.map(i=>i.split("").map(s=>parseInt(s,10)));break;case 3:t=[].concat(...this.todata(2));break;case 4:t=this.bindata.map(i=>{if(!/^[01]+$/.test(i))throw new Error(`Invalid binary string: ${i}`);return parseInt(i,2).toString(16).padStart(-1*Math.floor(-1*this.width()/4),"0")});break;case 5:t=this.bindata.map(i=>{if(!/^[01]+$/.test(i))throw new Error(`Invalid binary string: ${i}`);return parseInt(i,2)})}return t}draw2canvas(e,t){let i=t??{0:null,1:"black",2:"red"};return this.todata(2).forEach((s,n)=>{s.forEach((r,a)=>{let o=r.toString();if(o==="0"||o==="1"||o==="2"){let l=i[o];l!=null&&(e.fillStyle=l,e.fillRect(a,n,1,1))}})}),this}},Tt=p=>B(void 0,void 0,void 0,function*(){return yield new xt().load_filelines(p)});var Yt={VCR_OSD_MONO:{16:{file:"VCR_OSD_MONO_16.bdf",yOffset:0},24:{file:"VCR_OSD_MONO_24.bdf",yOffset:0},32:{file:"VCR_OSD_MONO_32.bdf",yOffset:2}},CUSONG:{16:{file:"CUSONG_16.bdf",yOffset:-1},24:{file:"CUSONG_24.bdf",yOffset:0},32:{file:"CUSONG_32.bdf",yOffset:0}}},X=new Map,Q=new Map;function Jt(p){return window.location.pathname.includes("preview.html")||window.location.port==="8080"?`./fonts/${p}`:`/hacsfiles/ipixel_color/fonts/${p}`}function tt(p){return p<=18?16:p<=28?24:32}async function O(p,e=16){let t=`${p}_${e}`;if(X.has(t))return X.get(t);if(Q.has(t))return Q.get(t);let i=Yt[p];if(!i||!i[e])return console.warn(`iPIXEL BDF: No config for font ${p} at height ${e}`),null;let s=i[e],n=(async()=>{try{let r=Jt(s.file);console.log(`iPIXEL BDF: Loading ${r}...`);let o={font:await Tt(Rt(r)),config:s};return X.set(t,o),console.log(`iPIXEL BDF: Font ${p} (${e}px) loaded successfully`),o}catch(r){return console.warn(`iPIXEL BDF: Failed to load font ${p} (${e}px):`,r),Q.delete(t),null}})();return Q.set(t,n),n}function Lt(p,e=16){let t=`${p}_${e}`;return X.has(t)}function $t(p,e,t,i="#ff6600",s="#111",n="VCR_OSD_MONO"){let r=tt(t),a=`${n}_${r}`,o=X.get(a);if(!o)return O(n,r),null;let{font:l,config:c}=o,d=new Array(e*t).fill(s);if(!p||p.trim()==="")return d;try{let h=l.draw(p,{direction:"lrtb",mode:1}),f=h.bindata,x=h.width(),u=h.height(),b=Math.floor((e-x)/2),g=Math.floor((t-u)/2)+(c.yOffset||0);for(let v=0;v<u;v++){let m=f[v]||"";for(let y=0;y<m.length;y++){let _=b+y,S=g+v;if(_>=0&&_<e&&S>=0&&S<t){let E=S*e+_;d[E]=m[y]==="1"?i:s}}}}catch(h){return console.warn("iPIXEL BDF: Error rendering text:",h),null}return d}function Pt(p,e,t,i="#ff6600",s="#111",n="VCR_OSD_MONO"){let r=tt(t),a=`${n}_${r}`,o=X.get(a);if(!o)return O(n,r),null;let{font:l,config:c}=o;if(!p||p.trim()===""){let d=e*3;return{pixels:new Array(d*t).fill(s),width:d}}try{let d=l.draw(p,{direction:"lrtb",mode:1}),h=d.bindata,f=d.width(),x=d.height(),u=e+f+e,b=new Array(u*t).fill(s),g=e,v=Math.floor((t-x)/2)+(c.yOffset||0);for(let m=0;m<x;m++){let y=h[m]||"";for(let _=0;_<y.length;_++){let S=g+_,E=v+m;if(S>=0&&S<u&&E>=0&&E<t){let C=E*u+S;b[C]=y[_]==="1"?i:s}}}return{pixels:b,width:u}}catch(d){return console.warn("iPIXEL BDF: Error rendering scroll text:",d),null}}var et=class{constructor(e){this.renderer=e}init(e,t){let{width:i,height:s}=this.renderer;switch(e){case"scroll_ltr":case"scroll_rtl":t.offset=0;break;case"blink":t.visible=!0;break;case"snow":case"breeze":t.phases=[];for(let n=0;n<i*s;n++)t.phases[n]=Math.random()*Math.PI*2;break;case"laser":t.position=0;break;case"fade":t.opacity=0,t.direction=1;break;case"typewriter":t.charIndex=0,t.cursorVisible=!0;break;case"bounce":t.offset=0,t.direction=1;break;case"sparkle":t.sparkles=[];for(let n=0;n<Math.floor(i*s*.1);n++)t.sparkles.push({x:Math.floor(Math.random()*i),y:Math.floor(Math.random()*s),brightness:Math.random(),speed:.05+Math.random()*.1});break}}step(e,t){let{width:i,extendedWidth:s}=this.renderer;switch(e){case"scroll_ltr":t.offset-=1,t.offset<=-(s||i)&&(t.offset=i);break;case"scroll_rtl":t.offset+=1,t.offset>=(s||i)&&(t.offset=-i);break;case"blink":t.visible=!t.visible;break;case"laser":t.position=(t.position+1)%i;break;case"fade":t.opacity+=t.direction*.05,t.opacity>=1?(t.opacity=1,t.direction=-1):t.opacity<=0&&(t.opacity=0,t.direction=1);break;case"typewriter":t.tick%3===0&&t.charIndex++,t.cursorVisible=t.tick%10<5;break;case"bounce":t.offset+=t.direction;let n=Math.max(0,(s||i)-i);t.offset>=n?(t.offset=n,t.direction=-1):t.offset<=0&&(t.offset=0,t.direction=1);break;case"sparkle":for(let r of t.sparkles)r.brightness+=r.speed,r.brightness>1&&(r.brightness=0,r.x=Math.floor(Math.random()*i),r.y=Math.floor(Math.random()*this.renderer.height));break}}render(e,t,i,s,n){let{width:r,height:a}=this.renderer,o=s||i||[],l=i||[],c=n||r;for(let d=0;d<a;d++)for(let h=0;h<r;h++){let f,x=h;if(e==="scroll_ltr"||e==="scroll_rtl"||e==="bounce"){for(x=h-(t.offset||0);x<0;)x+=c;for(;x>=c;)x-=c;f=o[d*c+x]||"#111"}else if(e==="typewriter"){let y=(t.charIndex||0)*6;h<y?f=l[d*r+h]||"#111":h===y&&t.cursorVisible?f="#ffffff":f="#111"}else f=l[d*r+h]||"#111";let[u,b,g]=this._hexToRgb(f);if(u>20||b>20||g>20)switch(e){case"blink":t.visible||(u=b=g=17);break;case"snow":{let m=t.phases?.[d*r+h]||0,y=t.tick||0,_=.3+.7*Math.abs(Math.sin(m+y*.3));u*=_,b*=_,g*=_;break}case"breeze":{let m=t.phases?.[d*r+h]||0,y=t.tick||0,_=.4+.6*Math.abs(Math.sin(m+y*.15+h*.2));u*=_,b*=_,g*=_;break}case"laser":{let m=t.position||0,_=Math.abs(h-m)<3?1:.3;u*=_,b*=_,g*=_;break}case"fade":{let m=t.opacity||1;u*=m,b*=m,g*=m;break}}if(e==="sparkle"&&t.sparkles){for(let m of t.sparkles)if(m.x===h&&m.y===d){let y=Math.sin(m.brightness*Math.PI);u=Math.min(255,u+y*200),b=Math.min(255,b+y*200),g=Math.min(255,g+y*200)}}this.renderer.setPixel(h,d,[u,b,g])}}_hexToRgb(e){if(!e||e==="#111"||e==="#000")return[17,17,17];if(e==="#050505")return[5,5,5];let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:[17,17,17]}};function Ot(p,e,t){let i,s,n,r=Math.floor(p*6),a=p*6-r,o=t*(1-e),l=t*(1-a*e),c=t*(1-(1-a)*e);switch(r%6){case 0:i=t,s=c,n=o;break;case 1:i=l,s=t,n=o;break;case 2:i=o,s=t,n=c;break;case 3:i=o,s=l,n=t;break;case 4:i=c,s=o,n=t;break;case 5:i=t,s=o,n=l;break}return[i*255,s*255,n*255]}var it=class{constructor(e){this.renderer=e}init(e,t){let{width:i,height:s}=this.renderer;switch(e){case"rainbow":t.position=0;break;case"matrix":let n=[[0,255,0],[0,255,255],[255,0,255]];t.colorMode=n[Math.floor(Math.random()*n.length)],t.buffer=[];for(let a=0;a<s;a++)t.buffer.push(Array(i).fill(null).map(()=>[0,0,0]));break;case"plasma":t.time=0;break;case"gradient":t.time=0;break;case"fire":t.heat=[];for(let a=0;a<i*s;a++)t.heat[a]=0;t.palette=this._createFirePalette();break;case"water":t.current=[],t.previous=[];for(let a=0;a<i*s;a++)t.current[a]=0,t.previous[a]=0;t.damping=.95;break;case"stars":t.stars=[];let r=Math.floor(i*s*.15);for(let a=0;a<r;a++)t.stars.push({x:Math.floor(Math.random()*i),y:Math.floor(Math.random()*s),brightness:Math.random(),speed:.02+Math.random()*.05,phase:Math.random()*Math.PI*2});break;case"confetti":t.particles=[];for(let a=0;a<20;a++)t.particles.push(this._createConfettiParticle(i,s,!0));break;case"plasma_wave":t.time=0;break;case"radial_pulse":t.time=0;break;case"hypnotic":t.time=0;break;case"lava":t.time=0,t.noise=[];for(let a=0;a<i*s;a++)t.noise[a]=Math.random()*Math.PI*2;break;case"aurora":t.time=0;break}}step(e,t){let{width:i,height:s}=this.renderer;switch(e){case"rainbow":t.position=(t.position+.01)%1;break;case"matrix":this._stepMatrix(t,i,s);break;case"plasma":case"gradient":t.time=(t.time||0)+.05;break;case"fire":this._stepFire(t,i,s);break;case"water":this._stepWater(t,i,s);break;case"stars":for(let n of t.stars)n.phase+=n.speed;break;case"confetti":for(let n=0;n<t.particles.length;n++){let r=t.particles[n];r.y+=r.speed,r.x+=r.drift,r.rotation+=r.rotationSpeed,r.y>s&&(t.particles[n]=this._createConfettiParticle(i,s,!1))}break;case"plasma_wave":case"radial_pulse":case"hypnotic":case"lava":case"aurora":t.time=(t.time||0)+.03;break}}render(e,t){switch(e){case"rainbow":this._renderRainbow(t);break;case"matrix":this._renderMatrix(t);break;case"plasma":this._renderPlasma(t);break;case"gradient":this._renderGradient(t);break;case"fire":this._renderFire(t);break;case"water":this._renderWater(t);break;case"stars":this._renderStars(t);break;case"confetti":this._renderConfetti(t);break;case"plasma_wave":this._renderPlasmaWave(t);break;case"radial_pulse":this._renderRadialPulse(t);break;case"hypnotic":this._renderHypnotic(t);break;case"lava":this._renderLava(t);break;case"aurora":this._renderAurora(t);break}}_renderRainbow(e){let{width:t,height:i}=this.renderer,s=e.position||0;for(let n=0;n<t;n++){let r=(s+n/t)%1,[a,o,l]=Ot(r,1,.6);for(let c=0;c<i;c++)this.renderer.setPixel(n,c,[a,o,l])}}_stepMatrix(e,t,i){let s=e.buffer,n=e.colorMode,r=.15;s.pop();let a=s[0].map(([o,l,c])=>[o*(1-r),l*(1-r),c*(1-r)]);s.unshift(JSON.parse(JSON.stringify(a)));for(let o=0;o<t;o++)Math.random()<.08&&(s[0][o]=[Math.floor(Math.random()*n[0]),Math.floor(Math.random()*n[1]),Math.floor(Math.random()*n[2])])}_renderMatrix(e){let{width:t,height:i}=this.renderer,s=e.buffer;if(s)for(let n=0;n<i;n++)for(let r=0;r<t;r++){let[a,o,l]=s[n]?.[r]||[0,0,0];this.renderer.setPixel(r,n,[a,o,l])}}_renderPlasma(e){let{width:t,height:i}=this.renderer,s=e.time||0,n=t/2,r=i/2;for(let a=0;a<t;a++)for(let o=0;o<i;o++){let l=a-n,c=o-r,d=Math.sqrt(l*l+c*c),h=Math.sin(a/8+s),f=Math.sin(o/6+s*.8),x=Math.sin(d/6-s*1.2),u=Math.sin((a+o)/10+s*.5),b=(h+f+x+u+4)/8,g=Math.sin(b*Math.PI*2)*.5+.5,v=Math.sin(b*Math.PI*2+2)*.5+.5,m=Math.sin(b*Math.PI*2+4)*.5+.5;this.renderer.setPixel(a,o,[g*255,v*255,m*255])}}_renderGradient(e){let{width:t,height:i}=this.renderer,n=(e.time||0)*10;for(let r=0;r<t;r++)for(let a=0;a<i;a++){let o=(Math.sin((r+n)*.05)*.5+.5)*255,l=(Math.cos((a+n)*.05)*.5+.5)*255,c=(Math.sin((r+a+n)*.03)*.5+.5)*255;this.renderer.setPixel(r,a,[o,l,c])}}_createFirePalette(){let e=[];for(let t=0;t<256;t++){let i,s,n;t<64?(i=t*4,s=0,n=0):t<128?(i=255,s=(t-64)*4,n=0):t<192?(i=255,s=255,n=(t-128)*4):(i=255,s=255,n=255),e.push([i,s,n])}return e}_stepFire(e,t,i){let s=e.heat;for(let n=0;n<t*i;n++)s[n]=Math.max(0,s[n]-Math.random()*10);for(let n=0;n<i-1;n++)for(let r=0;r<t;r++){let a=n*t+r,o=(n+1)*t+r,l=n*t+Math.max(0,r-1),c=n*t+Math.min(t-1,r+1);s[a]=(s[o]+s[l]+s[c])/3.05}for(let n=0;n<t;n++)Math.random()<.6&&(s[(i-1)*t+n]=180+Math.random()*75)}_renderFire(e){let{width:t,height:i}=this.renderer,s=e.heat,n=e.palette;for(let r=0;r<i;r++)for(let a=0;a<t;a++){let o=r*t+a,l=Math.floor(Math.min(255,s[o])),[c,d,h]=n[l];this.renderer.setPixel(a,r,[c,d,h])}}_stepWater(e,t,i){let{current:s,previous:n,damping:r}=e,a=[...n];for(let o=0;o<s.length;o++)n[o]=s[o];for(let o=1;o<i-1;o++)for(let l=1;l<t-1;l++){let c=o*t+l;s[c]=(a[(o-1)*t+l]+a[(o+1)*t+l]+a[o*t+(l-1)]+a[o*t+(l+1)])/2-s[c],s[c]*=r}if(Math.random()<.1){let o=Math.floor(Math.random()*(t-2))+1,l=Math.floor(Math.random()*(i-2))+1;s[l*t+o]=255}}_renderWater(e){let{width:t,height:i}=this.renderer,s=e.current;for(let n=0;n<i;n++)for(let r=0;r<t;r++){let a=n*t+r,o=Math.abs(s[a]),l=Math.min(255,o*2),c=l>200?l:0,d=l>150?l*.8:l*.3,h=Math.min(255,50+l);this.renderer.setPixel(r,n,[c,d,h])}}_renderStars(e){let{width:t,height:i}=this.renderer;for(let s=0;s<i;s++)for(let n=0;n<t;n++)this.renderer.setPixel(n,s,[5,5,15]);for(let s of e.stars){let n=(Math.sin(s.phase)*.5+.5)*255,r=Math.floor(s.x),a=Math.floor(s.y);r>=0&&r<t&&a>=0&&a<i&&this.renderer.setPixel(r,a,[n,n,n*.9])}}_createConfettiParticle(e,t,i){let s=[[255,0,0],[0,255,0],[0,0,255],[255,255,0],[255,0,255],[0,255,255],[255,128,0],[255,192,203]];return{x:Math.random()*e,y:i?Math.random()*t:-2,speed:.2+Math.random()*.3,drift:(Math.random()-.5)*.3,color:s[Math.floor(Math.random()*s.length)],size:1+Math.random(),rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-.5)*.2}}_renderConfetti(e){let{width:t,height:i}=this.renderer;for(let s=0;s<i;s++)for(let n=0;n<t;n++)this.renderer.setPixel(n,s,[10,10,10]);for(let s of e.particles){let n=Math.floor(s.x),r=Math.floor(s.y);if(n>=0&&n<t&&r>=0&&r<i){this.renderer.setPixel(n,r,s.color);let a=Math.abs(Math.sin(s.rotation))*.5+.5,[o,l,c]=s.color;this.renderer.setPixel(n,r,[o*a,l*a,c*a])}}}_renderPlasmaWave(e){let{width:t,height:i}=this.renderer,s=e.time||0;for(let n=0;n<t;n++)for(let r=0;r<i;r++){let a=n/t,o=r/i,l=Math.sin(a*10+s)+Math.sin(o*10+s)+Math.sin((a+o)*10+s)+Math.sin(Math.sqrt((a-.5)**2+(o-.5)**2)*20-s*2),c=Math.sin(l*Math.PI)*.5+.5,d=Math.sin(l*Math.PI+2.094)*.5+.5,h=Math.sin(l*Math.PI+4.188)*.5+.5;this.renderer.setPixel(n,r,[c*255,d*255,h*255])}}_renderRadialPulse(e){let{width:t,height:i}=this.renderer,s=e.time||0,n=t/2,r=i/2;for(let a=0;a<t;a++)for(let o=0;o<i;o++){let l=a-n,c=o-r,d=Math.sqrt(l*l+c*c),h=Math.sin(d*.8-s*3)*.5+.5,f=Math.sin(s*2)*.3+.7,x=(d/20+s*.5)%1,[u,b,g]=Ot(x,.8,h*f);this.renderer.setPixel(a,o,[u,b,g])}}_renderHypnotic(e){let{width:t,height:i}=this.renderer,s=e.time||0,n=t/2,r=i/2;for(let a=0;a<t;a++)for(let o=0;o<i;o++){let l=a-n,c=o-r,d=Math.sqrt(l*l+c*c),h=Math.atan2(c,l),x=Math.sin(h*4+d*.5-s*2)*.5+.5,u=x*(Math.sin(s)*.5+.5),b=x*(Math.sin(s+2.094)*.5+.5),g=x*(Math.sin(s+4.188)*.5+.5);this.renderer.setPixel(a,o,[u*255,b*255,g*255])}}_renderLava(e){let{width:t,height:i}=this.renderer,s=e.time||0;for(let n=0;n<t;n++)for(let r=0;r<i;r++){let a=n/t,o=r/i,l=Math.sin(a*8+s*.7)*Math.cos(o*6+s*.5),c=Math.sin(a*12-s*.3)*Math.sin(o*10+s*.8),d=Math.cos((a+o)*5+s),h=(l+c+d+3)/6,f,x,u;h<.3?(f=h*3*100,x=0,u=0):h<.6?(f=100+(h-.3)*3*155,x=(h-.3)*3*100,u=0):(f=255,x=100+(h-.6)*2.5*155,u=(h-.6)*2.5*100),this.renderer.setPixel(n,r,[f,x,u])}}_renderAurora(e){let{width:t,height:i}=this.renderer,s=e.time||0;for(let n=0;n<t;n++)for(let r=0;r<i;r++){let a=n/t,o=r/i,l=Math.sin(a*6+s)*.3,c=Math.sin(a*4-s*.7)*.2,d=Math.sin(a*8+s*1.3)*.15,h=.5+l+c+d,f=Math.abs(o-h),x=Math.max(0,1-f*4),u=Math.pow(x,1.5),b=Math.sin(a*3+s*.5),g=u*(.2+b*.3)*255,v=u*(.8+Math.sin(s+a)*.2)*255,m=u*(.6+b*.4)*255,y=Math.sin(n*127.1+r*311.7)*.5+.5,_=Math.sin(s*3+n+r)*.5+.5,S=g,E=v,C=m;if(y>.98&&x<.3){let I=_*180;S=Math.max(g,I),E=Math.max(v,I),C=Math.max(m,I*.9)}this.renderer.setPixel(n,r,[S,E,C])}}};function Ft(p,e,t){let i,s,n,r=Math.floor(p*6),a=p*6-r,o=t*(1-e),l=t*(1-a*e),c=t*(1-(1-a)*e);switch(r%6){case 0:i=t,s=c,n=o;break;case 1:i=l,s=t,n=o;break;case 2:i=o,s=t,n=c;break;case 3:i=o,s=l,n=t;break;case 4:i=c,s=o,n=t;break;case 5:i=t,s=o,n=l;break}return[i*255,s*255,n*255]}var st=class{constructor(e){this.renderer=e}init(e,t){switch(e){case"color_cycle":t.hue=0;break;case"rainbow_text":t.offset=0;break;case"neon":t.glowIntensity=0,t.direction=1,t.baseColor=t.fgColor||"#ff00ff";break}}step(e,t){switch(e){case"color_cycle":t.hue=(t.hue+.01)%1;break;case"rainbow_text":t.offset=(t.offset+.02)%1;break;case"neon":t.glowIntensity+=t.direction*.05,t.glowIntensity>=1?(t.glowIntensity=1,t.direction=-1):t.glowIntensity<=.3&&(t.glowIntensity=.3,t.direction=1);break}}render(e,t,i){let{width:s,height:n}=this.renderer,r=i||[];for(let a=0;a<n;a++)for(let o=0;o<s;o++){let l=r[a*s+o]||"#111",[c,d,h]=this._hexToRgb(l);if(c>20||d>20||h>20)switch(e){case"color_cycle":{let[x,u,b]=Ft(t.hue,1,.8),g=(c+d+h)/(3*255);c=x*g,d=u*g,h=b*g;break}case"rainbow_text":{let x=(t.offset+o/s)%1,[u,b,g]=Ft(x,1,.8),v=(c+d+h)/(3*255);c=u*v,d=b*v,h=g*v;break}case"neon":{let x=this._hexToRgb(t.baseColor||"#ff00ff"),u=t.glowIntensity||.5;if(c=x[0]*u,d=x[1]*u,h=x[2]*u,u>.8){let b=(u-.8)*5;c=c+(255-c)*b*.3,d=d+(255-d)*b*.3,h=h+(255-h)*b*.3}break}}this.renderer.setPixel(o,a,[c,d,h])}}_hexToRgb(e){if(!e||e==="#111"||e==="#000")return[17,17,17];if(e==="#050505")return[5,5,5];let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:[17,17,17]}};var w={TEXT:"text",AMBIENT:"ambient",COLOR:"color"},k={fixed:{category:w.TEXT,name:"Fixed",description:"Static display"},scroll_ltr:{category:w.TEXT,name:"Scroll Left",description:"Text scrolls left to right"},scroll_rtl:{category:w.TEXT,name:"Scroll Right",description:"Text scrolls right to left"},blink:{category:w.TEXT,name:"Blink",description:"Text blinks on/off"},breeze:{category:w.TEXT,name:"Breeze",description:"Gentle wave brightness"},snow:{category:w.TEXT,name:"Snow",description:"Sparkle effect"},laser:{category:w.TEXT,name:"Laser",description:"Scanning beam"},fade:{category:w.TEXT,name:"Fade",description:"Fade in/out"},typewriter:{category:w.TEXT,name:"Typewriter",description:"Characters appear one by one"},bounce:{category:w.TEXT,name:"Bounce",description:"Text bounces back and forth"},sparkle:{category:w.TEXT,name:"Sparkle",description:"Random sparkle overlay"},rainbow:{category:w.AMBIENT,name:"Rainbow",description:"HSV rainbow gradient"},matrix:{category:w.AMBIENT,name:"Matrix",description:"Digital rain effect"},plasma:{category:w.AMBIENT,name:"Plasma",description:"Classic plasma waves"},gradient:{category:w.AMBIENT,name:"Gradient",description:"Moving color gradients"},fire:{category:w.AMBIENT,name:"Fire",description:"Fire/flame simulation"},water:{category:w.AMBIENT,name:"Water",description:"Ripple/wave effect"},stars:{category:w.AMBIENT,name:"Stars",description:"Twinkling starfield"},confetti:{category:w.AMBIENT,name:"Confetti",description:"Falling colored particles"},plasma_wave:{category:w.AMBIENT,name:"Plasma Wave",description:"Multi-frequency sine waves"},radial_pulse:{category:w.AMBIENT,name:"Radial Pulse",description:"Expanding ring patterns"},hypnotic:{category:w.AMBIENT,name:"Hypnotic",description:"Spiral pattern"},lava:{category:w.AMBIENT,name:"Lava",description:"Flowing lava/magma"},aurora:{category:w.AMBIENT,name:"Aurora",description:"Northern lights"},color_cycle:{category:w.COLOR,name:"Color Cycle",description:"Cycle through colors"},rainbow_text:{category:w.COLOR,name:"Rainbow Text",description:"Rainbow gradient on text"},neon:{category:w.COLOR,name:"Neon",description:"Pulsing neon glow"}},G=class{constructor(e){this.renderer=e,this.textEffects=new et(e),this.ambientEffects=new it(e),this.colorEffects=new st(e),this.currentEffect="fixed",this.effectState={}}getEffectInfo(e){return k[e]||k.fixed}getEffectsByCategory(e){return Object.entries(k).filter(([t,i])=>i.category===e).map(([t,i])=>({name:t,...i}))}initEffect(e,t={}){let i=this.getEffectInfo(e);switch(this.currentEffect=e,this.effectState={tick:0,...t},i.category){case w.TEXT:this.textEffects.init(e,this.effectState);break;case w.AMBIENT:this.ambientEffects.init(e,this.effectState);break;case w.COLOR:this.colorEffects.init(e,this.effectState);break}return this.effectState}step(){let e=this.getEffectInfo(this.currentEffect);switch(this.effectState.tick=(this.effectState.tick||0)+1,e.category){case w.TEXT:this.textEffects.step(this.currentEffect,this.effectState);break;case w.AMBIENT:this.ambientEffects.step(this.currentEffect,this.effectState);break;case w.COLOR:this.colorEffects.step(this.currentEffect,this.effectState);break}}render(e,t,i){switch(this.getEffectInfo(this.currentEffect).category){case w.AMBIENT:this.ambientEffects.render(this.currentEffect,this.effectState);break;case w.TEXT:this.textEffects.render(this.currentEffect,this.effectState,e,t,i);break;case w.COLOR:this.colorEffects.render(this.currentEffect,this.effectState,e);break}}isAmbient(e){return this.getEffectInfo(e).category===w.AMBIENT}needsAnimation(e){return e!=="fixed"}},me=Object.entries(k).filter(([p,e])=>e.category===w.TEXT).map(([p])=>p),_e=Object.entries(k).filter(([p,e])=>e.category===w.AMBIENT).map(([p])=>p),ye=Object.entries(k).filter(([p,e])=>e.category===w.COLOR).map(([p])=>p),ve=Object.keys(k);var nt=class{constructor(e,t={}){this.container=e,this.width=t.width||64,this.height=t.height||16,this.pixelGap=t.pixelGap||.1,this.buffer=[],this.prevBuffer=[],this._initBuffer(),this._colorPixels=[],this._extendedColorPixels=[],this.extendedWidth=this.width,this.effect="fixed",this.speed=50,this.animationId=null,this.lastFrameTime=0,this._isRunning=!1,this.pixelElements=[],this.svgCreated=!1,this._svg=null,this.effectManager=new G(this)}_initBuffer(){this.buffer=[],this.prevBuffer=[];for(let e=0;e<this.width*this.height;e++)this.buffer.push([0,0,0]),this.prevBuffer.push([-1,-1,-1])}_createSvg(){let t=100/this.width,i=t,s=this.height*i,n=this.pixelGap,r=document.createElementNS("http://www.w3.org/2000/svg","svg");r.setAttribute("viewBox",`0 0 100 ${s}`),r.setAttribute("preserveAspectRatio","xMidYMid meet"),r.style.width="100%",r.style.height="100%",r.style.display="block",this.pixelElements=[];for(let a=0;a<this.height;a++)for(let o=0;o<this.width;o++){let l=document.createElementNS("http://www.w3.org/2000/svg","rect");l.setAttribute("x",o*t),l.setAttribute("y",a*i),l.setAttribute("width",t-n),l.setAttribute("height",i-n),l.setAttribute("rx","0.3"),l.setAttribute("fill","rgb(17, 17, 17)"),r.appendChild(l),this.pixelElements.push(l)}this.container&&this.container.isConnected!==!1&&(this.container.innerHTML="",this.container.appendChild(r)),this._svg=r,this.svgCreated=!0}_ensureSvgInContainer(){return this.container?this._svg&&this._svg.parentNode===this.container?!0:this._svg&&this.container.isConnected!==!1?(this.container.innerHTML="",this.container.appendChild(this._svg),!0):!1:!1}setPixel(e,t,i){if(e>=0&&e<this.width&&t>=0&&t<this.height){let s=t*this.width+e;s<this.buffer.length&&(this.buffer[s]=i)}}clear(){for(let e=0;e<this.buffer.length;e++)this.buffer[e]=[0,0,0]}flush(){this.svgCreated?this._ensureSvgInContainer()||this._createSvg():this._createSvg();for(let e=0;e<this.buffer.length;e++){let t=this.buffer[e],i=this.prevBuffer[e];if(!t||!Array.isArray(t))continue;if(!i||!Array.isArray(i)){this.prevBuffer[e]=[-1,-1,-1];continue}let[s,n,r]=t,[a,o,l]=i;if(s!==a||n!==o||r!==l){let c=this.pixelElements[e];if(c){let d=s>20||n>20||r>20;c.setAttribute("fill",`rgb(${Math.round(s)}, ${Math.round(n)}, ${Math.round(r)})`),d?c.style.filter=`drop-shadow(0 0 2px rgb(${Math.round(s)}, ${Math.round(n)}, ${Math.round(r)}))`:c.style.filter=""}this.prevBuffer[e]=[s,n,r]}}}setData(e,t=null,i=null){this._colorPixels=e||[],t?(this._extendedColorPixels=t,this.extendedWidth=i||this.width):(this._extendedColorPixels=e||[],this.extendedWidth=this.width)}setEffect(e,t=50){let i=this._isRunning;this.effect!==e&&(this.effect=e,this.effectManager.initEffect(e,{speed:t})),this.speed=t,i&&e!=="fixed"&&this.start()}start(){this._isRunning||(this._isRunning=!0,this.lastFrameTime=performance.now(),this._animate())}stop(){this._isRunning=!1,this.animationId&&(cancelAnimationFrame(this.animationId),this.animationId=null)}get isRunning(){return this._isRunning}_animate(){if(!this._isRunning)return;let e=performance.now(),t=500-(this.speed-1)*4.7;e-this.lastFrameTime>=t&&(this.lastFrameTime=e,this.effectManager.step()),this._renderFrame(),this.animationId=requestAnimationFrame(()=>this._animate())}_renderFrame(){this.effectManager.render(this._colorPixels,this._extendedColorPixels,this.extendedWidth),this.flush()}renderStatic(){this.svgCreated||this._createSvg(),this._renderFrame()}setDimensions(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.extendedWidth=e,this._initBuffer(),this.svgCreated=!1,this.effectManager=new G(this),this.effect!=="fixed"&&this.effectManager.initEffect(this.effect,{speed:this.speed}))}setContainer(e){e!==this.container&&(this.container=e,this._svg&&e&&(e.innerHTML="",e.appendChild(this._svg)))}destroy(){this.stop(),this.pixelElements=[],this._svg=null,this.svgCreated=!1}};function At(p,e,t,i=1){let n=100/p,r=n,a=e*r,o=i*.1,l="";for(let c=0;c<e;c++)for(let d=0;d<p;d++){let h=t[c*p+d]||"#111",x=h!=="#111"&&h!=="#000"&&h!=="#1a1a1a"&&h!=="#050505"?`filter:drop-shadow(0 0 2px ${h});`:"";l+=`<rect x="${d*n}" y="${c*r}" width="${n-o}" height="${r-o}" fill="${h}" rx="0.3" style="${x}"/>`}return`
    <svg viewBox="0 0 100 ${a}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;">
      ${l}
    </svg>`}var Bt="iPIXEL_DisplayState",Kt={text:"",mode:"text",effect:"fixed",speed:50,fgColor:"#ff6600",bgColor:"#000000",font:"VCR_OSD_MONO",lastUpdate:0};function Zt(){try{let p=localStorage.getItem(Bt);if(p)return JSON.parse(p)}catch(p){console.warn("iPIXEL: Could not load saved state",p)}return{...Kt}}function Qt(p){try{localStorage.setItem(Bt,JSON.stringify(p))}catch(e){console.warn("iPIXEL: Could not save state",e)}}window.iPIXELDisplayState||(window.iPIXELDisplayState=Zt());function Dt(){return window.iPIXELDisplayState}function P(p){return window.iPIXELDisplayState={...window.iPIXELDisplayState,...p,lastUpdate:Date.now()},Qt(window.iPIXELDisplayState),window.dispatchEvent(new CustomEvent("ipixel-display-update",{detail:window.iPIXELDisplayState})),window.iPIXELDisplayState}var rt=new Map,ot=class extends L{constructor(){super(),this._renderer=null,this._displayContainer=null,this._lastState=null,this._cachedResolution=null,this._rendererId=null,this._handleDisplayUpdate=e=>{this._updateDisplay(e.detail)},window.addEventListener("ipixel-display-update",this._handleDisplayUpdate)}connectedCallback(){this._rendererId||(this._rendererId=`renderer_${Date.now()}_${Math.random().toString(36).substr(2,9)}`),rt.has(this._rendererId)&&(this._renderer=rt.get(this._rendererId)),O("VCR_OSD_MONO",16).then(()=>{this._lastState&&this._updateDisplay(this._lastState)}),O("VCR_OSD_MONO",24),O("VCR_OSD_MONO",32),O("CUSONG",16),O("CUSONG",24),O("CUSONG",32),z("VCR_OSD_MONO"),z("CUSONG")}disconnectedCallback(){window.removeEventListener("ipixel-display-update",this._handleDisplayUpdate),this._renderer&&this._rendererId&&(this._renderer.stop(),rt.set(this._rendererId,this._renderer))}_getResolutionCached(){let[e,t]=this.getResolution();if(e>0&&t>0&&e!==64){this._cachedResolution=[e,t];try{localStorage.setItem("iPIXEL_Resolution",JSON.stringify([e,t]))}catch{}}if(this._cachedResolution)return this._cachedResolution;try{let i=localStorage.getItem("iPIXEL_Resolution");if(i){let s=JSON.parse(i);if(Array.isArray(s)&&s.length===2)return this._cachedResolution=s,s}}catch{}return this._config?.width&&this._config?.height?[this._config.width,this._config.height]:[e||64,t||16]}_updateDisplay(e){if(!this._displayContainer)return;let[t,i]=this._getResolutionCached(),s=this.isOn();if(this._renderer?(this._renderer.setContainer(this._displayContainer),(this._renderer.width!==t||this._renderer.height!==i)&&this._renderer.setDimensions(t,i)):(this._renderer=new nt(this._displayContainer,{width:t,height:i}),this._rendererId&&rt.set(this._rendererId,this._renderer)),!s){this._renderer.stop();let b=ft("",t,i,"#111","#050505");this._displayContainer.innerHTML=At(t,i,b);return}let n=e?.text||"",r=e?.effect||"fixed",a=e?.speed||50,o=e?.fgColor||"#ff6600",l=e?.bgColor||"#111",c=e?.mode||"text",d=e?.font||"VCR_OSD_MONO";this._lastState=e;let h=n,f=o;if(c==="clock"?(h=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!1}),f="#00ff88"):c==="gif"?(h="GIF",f="#ff44ff"):c==="rhythm"&&(h="***",f="#44aaff"),k[r]?.category==="ambient")this._renderer.setData([],[],t);else{let b=tt(i),g=d!=="LEGACY"&&Lt(d,b),v=d!=="LEGACY"&&K(d),m=(E,C,I,R,T)=>{if(g){let M=$t(E,C,I,R,T,d);if(M)return M}if(v){let M=Ct(E,C,I,R,T,d);if(M)return M}return ft(E,C,I,R,T)},y=(E,C,I,R,T)=>{if(g){let M=Pt(E,C,I,R,T,d);if(M)return M}if(v){let M=kt(E,C,I,R,T,d);if(M)return M}return wt(E,C,I,R,T)},_=v?h.length*10:h.length*6;if((r==="scroll_ltr"||r==="scroll_rtl"||r==="bounce")&&_>t){let E=y(h,t,i,f,l),C=m(h,t,i,f,l);this._renderer.setData(C,E.pixels,E.width)}else{let E=m(h,t,i,f,l);this._renderer.setData(E)}}this._renderer.setEffect(r,a),r==="fixed"?(this._renderer.stop(),this._renderer.renderStatic()):this._renderer.start()}render(){if(!this._hass)return;let[e,t]=this._getResolutionCached(),i=this.isOn(),s=this._config.name||this.getEntity()?.attributes?.friendly_name||"iPIXEL Display",n=Dt(),a=this.getEntity()?.state||"",l=this.getRelatedEntity("select","_mode")?.state||n.mode||"text",c=n.text||a,d=n.effect||"fixed",h=n.speed||50,f=n.fgColor||"#ff6600",x=n.bgColor||"#111",u=n.font||"VCR_OSD_MONO",g=k[d]?.category==="ambient",v=Object.entries(k).filter(([_,S])=>S.category==="text").map(([_,S])=>`<option value="${_}">${S.name}</option>`).join(""),m=Object.entries(k).filter(([_,S])=>S.category==="ambient").map(([_,S])=>`<option value="${_}">${S.name}</option>`).join(""),y=Object.entries(k).filter(([_,S])=>S.category==="color").map(([_,S])=>`<option value="${_}">${S.name}</option>`).join("");this.shadowRoot.innerHTML=`
      <style>${$}
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
              <span>
                <span class="mode-badge">${i?l:"Off"}</span>
                ${i&&d!=="fixed"?`<span class="effect-badge">${k[d]?.name||d}</span>`:""}
              </span>
            </div>
          </div>
        </div>
      </ha-card>`,this._displayContainer=this.shadowRoot.getElementById("display-screen"),this._updateDisplay({text:c,effect:d,speed:h,fgColor:f,bgColor:x,mode:l,font:u}),this._attachPowerButton()}_attachPowerButton(){this.shadowRoot.getElementById("power-btn")?.addEventListener("click",()=>{let e=this._switchEntityId;if(!e){let t=this.getRelatedEntity("switch");t&&(this._switchEntityId=t.entity_id,e=t.entity_id)}if(e&&this._hass.states[e])this._hass.callService("switch","toggle",{entity_id:e});else{let t=Object.keys(this._hass.states).filter(n=>n.startsWith("switch.")),i=this._config.entity?.replace(/^[^.]+\./,"").replace(/_?(text|display|gif_url)$/i,"")||"",s=t.find(n=>n.includes(i.substring(0,10)));s?(this._switchEntityId=s,this._hass.callService("switch","toggle",{entity_id:s})):console.warn("iPIXEL: No switch found. Entity:",this._config.entity,"Available:",t)}})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var at=class extends L{render(){if(!this._hass)return;let e=this.isOn();this.shadowRoot.innerHTML=`
      <style>${$}</style>
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
      </ha-card>`,this._attachControlListeners()}_attachControlListeners(){this.shadowRoot.querySelectorAll("[data-action]").forEach(t=>{t.addEventListener("click",i=>{let s=i.currentTarget.dataset.action;if(s==="power"){let n=this.getRelatedEntity("switch");n&&this._hass.callService("switch","toggle",{entity_id:n.entity_id})}else s==="clear"?(P({text:"",mode:"text",effect:"fixed",speed:50,fgColor:"#ff6600",bgColor:"#000000"}),this.callService("ipixel_color","clear_pixels")):s==="clock"?(P({text:"",mode:"clock",effect:"fixed",speed:50,fgColor:"#00ff88",bgColor:"#000000"}),this.callService("ipixel_color","set_clock_mode",{style:1})):s==="sync"&&this.callService("ipixel_color","sync_time")})});let e=this.shadowRoot.getElementById("brightness");e&&(e.style.setProperty("--value",`${e.value}%`),e.addEventListener("input",t=>{t.target.style.setProperty("--value",`${t.target.value}%`),this.shadowRoot.getElementById("brightness-val").textContent=`${t.target.value}%`}),e.addEventListener("change",t=>{this.callService("ipixel_color","set_brightness",{level:parseInt(t.target.value)})})),this.shadowRoot.querySelectorAll("[data-mode]").forEach(t=>{t.addEventListener("click",i=>{let s=i.currentTarget.dataset.mode,n=this.getRelatedEntity("select","_mode");n&&this._hass.callService("select","select_option",{entity_id:n.entity_id,option:s}),P({mode:s,fgColor:{text:"#ff6600",textimage:"#ff6600",clock:"#00ff88",gif:"#ff44ff",rhythm:"#44aaff"}[s]||"#ff6600",text:s==="clock"?"":window.iPIXELDisplayState?.text||""}),this.shadowRoot.querySelectorAll("[data-mode]").forEach(a=>a.classList.remove("active")),i.currentTarget.classList.add("active")})}),this.shadowRoot.getElementById("orientation")?.addEventListener("change",t=>{let i=this.getRelatedEntity("select","_orientation");i&&this._hass.callService("select","select_option",{entity_id:i.entity_id,option:t.target.value})}),this.shadowRoot.querySelectorAll("[data-screen]").forEach(t=>{t.addEventListener("click",i=>{let s=parseInt(i.currentTarget.dataset.screen);this.callService("ipixel_color","set_screen",{screen:s}),this.shadowRoot.querySelectorAll("[data-screen]").forEach(n=>n.classList.remove("active")),i.currentTarget.classList.add("active")})}),this.shadowRoot.getElementById("diy-mode")?.addEventListener("change",t=>{let i=t.target.value;i!==""&&(this.callService("ipixel_color","set_diy_mode",{mode:i}),setTimeout(()=>{t.target.value=""},500))}),this.shadowRoot.getElementById("send-raw-btn")?.addEventListener("click",()=>{let t=this.shadowRoot.getElementById("raw-command")?.value;t&&t.trim()&&this.callService("ipixel_color","send_raw_command",{hex_data:t.trim()})}),this.shadowRoot.getElementById("raw-command")?.addEventListener("keypress",t=>{if(t.key==="Enter"){let i=t.target.value;i&&i.trim()&&this.callService("ipixel_color","send_raw_command",{hex_data:i.trim()})}})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var te=[{value:0,name:"None"},{value:1,name:"Rainbow Wave"},{value:2,name:"Rainbow Cycle"},{value:3,name:"Rainbow Pulse"},{value:4,name:"Rainbow Fade"},{value:5,name:"Rainbow Chase"},{value:6,name:"Rainbow Sparkle"},{value:7,name:"Rainbow Gradient"},{value:8,name:"Rainbow Theater"},{value:9,name:"Rainbow Fire"}],ee=[{value:0,name:"Classic Bars"},{value:1,name:"Mirrored Bars"},{value:2,name:"Center Out"},{value:3,name:"Wave Style"},{value:4,name:"Particle Style"}],lt=class extends L{constructor(){super(),this._activeTab="text",this._rhythmLevels=[0,0,0,0,0,0,0,0,0,0,0],this._selectedRhythmStyle=0,this._selectedAmbient="rainbow"}_buildTextEffectOptions(){let e=Object.entries(k).filter(([i,s])=>s.category===w.TEXT).map(([i,s])=>`<option value="${i}">${s.name}</option>`).join(""),t=Object.entries(k).filter(([i,s])=>s.category===w.COLOR).map(([i,s])=>`<option value="${i}">${s.name}</option>`).join("");return`
      <optgroup label="Text Effects">
        ${e}
      </optgroup>
      <optgroup label="Color Effects">
        ${t}
      </optgroup>
    `}_buildAmbientEffectOptions(){return Object.entries(k).filter(([e,t])=>t.category===w.AMBIENT).map(([e,t])=>`<option value="${e}">${t.name}</option>`).join("")}_buildAmbientGrid(){let e=this._selectedAmbient||"rainbow";return Object.entries(k).filter(([t,i])=>i.category===w.AMBIENT).map(([t,i])=>`
        <button class="effect-btn ${t===e?"active":""}" data-effect="${t}">
          ${i.name}
        </button>
      `).join("")}_buildRainbowOptions(){return te.map(e=>`<option value="${e.value}">${e.name}</option>`).join("")}_buildRhythmStyleGrid(){let e=this._selectedRhythmStyle||0;return ee.map(t=>`
      <button class="style-btn ${t.value===e?"active":""}" data-style="${t.value}">
        ${t.name}
      </button>
    `).join("")}_buildRhythmLevelSliders(){let e=["32Hz","64Hz","125Hz","250Hz","500Hz","1kHz","2kHz","4kHz","8kHz","12kHz","16kHz"];return this._rhythmLevels.map((t,i)=>`
      <div class="rhythm-band">
        <label>${e[i]}</label>
        <input type="range" class="rhythm-slider" data-band="${i}" min="0" max="15" value="${t}">
        <span class="rhythm-val">${t}</span>
      </div>
    `).join("")}render(){if(!this._hass)return;let e=this._activeTab==="text",t=this._activeTab==="ambient",i=this._activeTab==="rhythm",s=this._activeTab==="advanced";this.shadowRoot.innerHTML=`
      <style>${$}
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
            <button class="tab ${i?"active":""}" id="tab-rhythm">Rhythm</button>
            <button class="tab ${s?"active":""}" id="tab-advanced">GFX</button>
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
          <div class="tab-content ${i?"active":""}" id="content-rhythm">
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
          <div class="tab-content ${s?"active":""}" id="content-advanced">
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
      </ha-card>`,this._attachListeners()}_getTextFormValues(){return{text:this.shadowRoot.getElementById("text-input")?.value||"",effect:this.shadowRoot.getElementById("text-effect")?.value||"fixed",rainbowMode:parseInt(this.shadowRoot.getElementById("rainbow-mode")?.value||"0"),speed:parseInt(this.shadowRoot.getElementById("text-speed")?.value||"50"),fgColor:this.shadowRoot.getElementById("text-color")?.value||"#ff6600",bgColor:this.shadowRoot.getElementById("bg-color")?.value||"#000000",font:this.shadowRoot.getElementById("font-select")?.value||"VCR_OSD_MONO"}}_getRhythmFormValues(){return{style:this._selectedRhythmStyle||0,levels:[...this._rhythmLevels]}}_getGfxFormValues(){let e=this.shadowRoot.getElementById("gfx-json")?.value||"";try{return JSON.parse(e)}catch{return null}}_getMulticolorFormValues(){let e=this.shadowRoot.getElementById("multicolor-text")?.value||"",i=(this.shadowRoot.getElementById("multicolor-colors")?.value||"").split(",").map(s=>s.trim()).filter(s=>s);return{text:e,colors:i}}_getAmbientFormValues(){return{effect:this._selectedAmbient||"rainbow",speed:parseInt(this.shadowRoot.getElementById("ambient-speed")?.value||"50")}}_updateTextPreview(){let{text:e,effect:t,speed:i,fgColor:s,bgColor:n,font:r}=this._getTextFormValues();P({text:e||"Preview",mode:"text",effect:t,speed:i,fgColor:s,bgColor:n,font:r})}_updateAmbientPreview(){let{effect:e,speed:t}=this._getAmbientFormValues();P({text:"",mode:"ambient",effect:e,speed:t,fgColor:"#ffffff",bgColor:"#000000"})}_attachListeners(){this.shadowRoot.getElementById("tab-text")?.addEventListener("click",()=>{this._activeTab="text",this.render()}),this.shadowRoot.getElementById("tab-ambient")?.addEventListener("click",()=>{this._activeTab="ambient",this.render()}),this.shadowRoot.getElementById("tab-rhythm")?.addEventListener("click",()=>{this._activeTab="rhythm",this.render()}),this.shadowRoot.getElementById("tab-advanced")?.addEventListener("click",()=>{this._activeTab="advanced",this.render()});let e=this.shadowRoot.getElementById("text-speed");e&&(e.style.setProperty("--value",`${e.value}%`),e.addEventListener("input",i=>{i.target.style.setProperty("--value",`${i.target.value}%`),this.shadowRoot.getElementById("text-speed-val").textContent=i.target.value,this._updateTextPreview()})),this.shadowRoot.getElementById("text-effect")?.addEventListener("change",()=>{this._updateTextPreview()}),this.shadowRoot.getElementById("rainbow-mode")?.addEventListener("change",()=>{this._updateTextPreview()}),this.shadowRoot.getElementById("font-select")?.addEventListener("change",()=>{this._updateTextPreview()}),this.shadowRoot.getElementById("text-color")?.addEventListener("input",()=>{this._updateTextPreview()}),this.shadowRoot.getElementById("bg-color")?.addEventListener("input",()=>{this._updateTextPreview()}),this.shadowRoot.getElementById("text-input")?.addEventListener("input",()=>{this._updateTextPreview()}),this.shadowRoot.getElementById("send-btn")?.addEventListener("click",()=>{let{text:i,effect:s,rainbowMode:n,speed:r,fgColor:a,bgColor:o,font:l}=this._getTextFormValues();if(i){P({text:i,mode:"text",effect:s,speed:r,fgColor:a,bgColor:o,font:l,rainbowMode:n}),this._config.entity&&this._hass.callService("text","set_value",{entity_id:this._config.entity,value:i});let c=l==="LEGACY"?"CUSONG":l;this.callService("ipixel_color","display_text",{text:i,effect:s,speed:r,color_fg:this.hexToRgb(a),color_bg:this.hexToRgb(o),font:c,rainbow_mode:n})}}),this.shadowRoot.querySelectorAll(".effect-btn").forEach(i=>{i.addEventListener("click",s=>{let n=s.target.dataset.effect;this._selectedAmbient=n,this.shadowRoot.querySelectorAll(".effect-btn").forEach(r=>r.classList.remove("active")),s.target.classList.add("active"),this._updateAmbientPreview()})});let t=this.shadowRoot.getElementById("ambient-speed");t&&(t.style.setProperty("--value",`${t.value}%`),t.addEventListener("input",i=>{i.target.style.setProperty("--value",`${i.target.value}%`),this.shadowRoot.getElementById("ambient-speed-val").textContent=i.target.value,this._updateAmbientPreview()})),this.shadowRoot.getElementById("apply-ambient-btn")?.addEventListener("click",()=>{let{effect:i,speed:s}=this._getAmbientFormValues();P({text:"",mode:"ambient",effect:i,speed:s,fgColor:"#ffffff",bgColor:"#000000"})}),this.shadowRoot.querySelectorAll(".style-btn").forEach(i=>{i.addEventListener("click",s=>{let n=parseInt(s.target.dataset.style);this._selectedRhythmStyle=n,this.shadowRoot.querySelectorAll(".style-btn").forEach(r=>r.classList.remove("active")),s.target.classList.add("active")})}),this.shadowRoot.querySelectorAll(".rhythm-slider").forEach(i=>{i.addEventListener("input",s=>{let n=parseInt(s.target.dataset.band),r=parseInt(s.target.value);this._rhythmLevels[n]=r,s.target.nextElementSibling.textContent=r})}),this.shadowRoot.getElementById("apply-rhythm-btn")?.addEventListener("click",()=>{let{style:i,levels:s}=this._getRhythmFormValues();P({text:"",mode:"rhythm",rhythmStyle:i,rhythmLevels:s}),this.callService("ipixel_color","set_rhythm_level",{style:i,levels:s})}),this.shadowRoot.getElementById("apply-gfx-btn")?.addEventListener("click",()=>{let i=this._getGfxFormValues();if(!i){console.warn("iPIXEL: Invalid GFX JSON");return}P({text:"",mode:"gfx",gfxData:i}),this.callService("ipixel_color","render_gfx",{data:i})}),this.shadowRoot.getElementById("apply-multicolor-btn")?.addEventListener("click",()=>{let{text:i,colors:s}=this._getMulticolorFormValues();i&&s.length>0&&(P({text:i,mode:"multicolor",colors:s}),this.callService("ipixel_color","display_multicolor_text",{text:i,colors:s.map(n=>this.hexToRgb(n))}))})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var ct=class extends L{render(){if(!this._hass)return;let e=this._config.items||[];this.shadowRoot.innerHTML=`
      <style>${$}
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
      </ha-card>`,this.shadowRoot.getElementById("start-btn")?.addEventListener("click",()=>{this.callService("ipixel_color","start_playlist")}),this.shadowRoot.getElementById("stop-btn")?.addEventListener("click",()=>{this.callService("ipixel_color","stop_playlist")})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var dt=class extends L{render(){if(!this._hass)return;let e=new Date,t=(e.getHours()*60+e.getMinutes())/1440*100;this.shadowRoot.innerHTML=`
      <style>${$}
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
      </ha-card>`,this.shadowRoot.getElementById("save-power")?.addEventListener("click",()=>{this.callService("ipixel_color","set_power_schedule",{enabled:!0,on_time:this.shadowRoot.getElementById("power-on")?.value,off_time:this.shadowRoot.getElementById("power-off")?.value})})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var ie=["#FFFFFF","#000000","#FF0000","#00FF00","#0080FF","#FFFF00","#FF00FF","#00FFFF","#FF8000","#8000FF","#2EC4FF","#0010A0","#A0FF00","#FF80C0","#808080","#C0C0C0"],se=[{value:"16x16",label:"16\xD716"},{value:"32x8",label:"32\xD78"},{value:"32x16",label:"32\xD716"},{value:"32x32",label:"32\xD732"},{value:"64x16",label:"64\xD716"},{value:"96x16",label:"96\xD716"},{value:"128x16",label:"128\xD716"}],H={r:25,g:25,b:25},ht=class extends L{constructor(){super(),this._width=64,this._height=16,this._tool="pen",this._drawing=!1,this._gridOn=!0,this._currentColor="#ff6600",this._scale=8,this._sending=!1,this._logicalCanvas=document.createElement("canvas"),this._ctx=this._logicalCanvas.getContext("2d"),this._displayCanvas=null,this._dctx=null,this._initialized=!1}setConfig(e){if(!e.entity)throw new Error("Please define an entity");this._config=e}set hass(e){let t=!!this._hass;if(this._hass=e,!t){let[i,s]=this.getResolution();this._width=i,this._height=s,this._logicalCanvas.width=i,this._logicalCanvas.height=s,this.render()}}render(){if(!this._hass)return;let e=this.getEntity(),t=this.isOn(),[i,s]=this.getResolution(),n=se.map(a=>{let o=a.value===`${this._width}x${this._height}`?"selected":"";return`<option value="${a.value}" ${o}>${a.label}</option>`}).join(""),r=ie.map(a=>`<div class="color-swatch ${a.toLowerCase()===this._currentColor.toLowerCase()?"active":""}" data-color="${a}" style="background:${a}"></div>`).join("");this.shadowRoot.innerHTML=`
      <style>
        ${$}

        .editor-toolbar {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .tool-group {
          display: flex;
          gap: 4px;
        }

        .color-palette {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 12px;
        }

        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          border: 2px solid transparent;
          box-sizing: border-box;
        }

        .color-swatch:hover {
          border-color: rgba(255,255,255,0.5);
        }

        .color-swatch.active {
          border-color: var(--ipixel-primary);
          box-shadow: 0 0 0 1px var(--ipixel-primary);
        }

        .canvas-container {
          background: #050608;
          border-radius: 8px;
          padding: 8px;
          margin-bottom: 12px;
          overflow: auto;
          text-align: center;
        }

        #editor-canvas {
          display: inline-block;
          cursor: crosshair;
          image-rendering: pixelated;
          touch-action: none;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75em;
          opacity: 0.6;
          margin-bottom: 8px;
        }

        .tool-icon {
          font-size: 16px;
        }

        .resolution-select {
          padding: 6px 8px;
          background: rgba(255,255,255,0.08);
          border: 1px solid var(--ipixel-border);
          border-radius: 6px;
          color: inherit;
          font-size: 0.85em;
          cursor: pointer;
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>

      <ha-card>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">
              <span class="status-dot ${t?"":"off"}"></span>
              ${this._config.name||"Pixel Editor"}
            </div>
          </div>

          <!-- Toolbar -->
          <div class="editor-toolbar">
            <div class="tool-group">
              <button class="icon-btn ${this._tool==="pen"?"active":""}" id="pen-tool" title="Pen Tool">
                <span class="tool-icon">&#9998;</span>
              </button>
              <button class="icon-btn ${this._tool==="eraser"?"active":""}" id="eraser-tool" title="Eraser Tool">
                <span class="tool-icon">&#9746;</span>
              </button>
            </div>
            <input type="color" class="color-picker" id="color-picker" value="${this._currentColor}" title="Pick Color">
            <button class="icon-btn ${this._gridOn?"active":""}" id="grid-toggle" title="Toggle LED Grid">
              <span class="tool-icon">&#9638;</span>
            </button>
            <select class="resolution-select" id="resolution-select" title="Canvas Size">
              ${n}
            </select>
          </div>

          <!-- Color Palette -->
          <div class="color-palette" id="palette">
            ${r}
          </div>

          <!-- Canvas -->
          <div class="canvas-container">
            <canvas id="editor-canvas"></canvas>
          </div>

          <!-- Info -->
          <div class="info-row">
            <span>Tool: ${this._tool} | Grid: ${this._gridOn?"LED":"Flat"}</span>
            <span>Device: ${i}\xD7${s}</span>
          </div>

          <!-- Actions -->
          <div class="button-grid button-grid-3">
            <button class="btn btn-secondary" id="clear-btn">Clear</button>
            <button class="btn btn-secondary" id="import-btn">Import</button>
            <button class="btn btn-primary send-btn" id="send-btn" ${this._sending?"disabled":""}>
              ${this._sending?"Sending...":"Send to Device"}
            </button>
          </div>

          <!-- Hidden file input for import -->
          <input type="file" id="file-input" accept="image/png,image/gif,image/jpeg" style="display:none">
        </div>
      </ha-card>
    `,this._initCanvas(),this._attachListeners()}_initCanvas(){this._displayCanvas=this.shadowRoot.getElementById("editor-canvas"),this._displayCanvas&&(this._dctx=this._displayCanvas.getContext("2d"),(this._logicalCanvas.width!==this._width||this._logicalCanvas.height!==this._height)&&(this._logicalCanvas.width=this._width,this._logicalCanvas.height=this._height),this._updateDisplaySize(),this._renderDisplay(),this._initialized=!0)}_updateDisplaySize(){this._displayCanvas&&(this._displayCanvas.width=this._width*this._scale,this._displayCanvas.height=this._height*this._scale)}_renderDisplay(){if(!this._dctx||!this._ctx)return;this._updateDisplaySize(),this._dctx.fillStyle="#050608",this._dctx.fillRect(0,0,this._displayCanvas.width,this._displayCanvas.height);let e=this._ctx.getImageData(0,0,this._width,this._height).data,t=this._scale,i=t*.38;for(let s=0;s<this._height;s++)for(let n=0;n<this._width;n++){let r=(s*this._width+n)*4,a=e[r],o=e[r+1],l=e[r+2],d=e[r+3]===0,h=n*t,f=s*t,x=h+t/2,u=f+t/2;if(this._dctx.fillStyle=`rgb(${H.r},${H.g},${H.b})`,this._dctx.fillRect(h,f,t,t),this._gridOn)if(d)this._dctx.fillStyle="rgb(5,5,5)",this._dctx.beginPath(),this._dctx.arc(x,u,i,0,Math.PI*2),this._dctx.fill();else{let b=this._dctx.createRadialGradient(x,u,i*.3,x,u,i*1.8);b.addColorStop(0,`rgba(${a},${o},${l},0.4)`),b.addColorStop(1,`rgba(${a},${o},${l},0)`),this._dctx.fillStyle=b,this._dctx.beginPath(),this._dctx.arc(x,u,i*1.8,0,Math.PI*2),this._dctx.fill(),this._dctx.fillStyle=`rgb(${a},${o},${l})`,this._dctx.beginPath(),this._dctx.arc(x,u,i,0,Math.PI*2),this._dctx.fill()}else d?this._dctx.fillStyle=`rgb(${H.r},${H.g},${H.b})`:this._dctx.fillStyle=`rgb(${a},${o},${l})`,this._dctx.fillRect(h,f,t,t)}}_getPixelPos(e){if(!this._displayCanvas)return null;let t=this._displayCanvas.getBoundingClientRect(),i=t.width/this._width,s=t.height/this._height,n=e.touches?e.touches[0].clientX:e.clientX,r=e.touches?e.touches[0].clientY:e.clientY,a=Math.floor((n-t.left)/i),o=Math.floor((r-t.top)/s);return a<0||o<0||a>=this._width||o>=this._height?null:{x:a,y:o}}_drawAt(e){let t=this._getPixelPos(e);t&&(this._tool==="pen"?(this._ctx.fillStyle=this._currentColor,this._ctx.fillRect(t.x,t.y,1,1)):this._ctx.clearRect(t.x,t.y,1,1),this._renderDisplay())}_attachListeners(){let e=this.shadowRoot.getElementById("editor-canvas");e&&(e.addEventListener("mousedown",t=>{t.preventDefault(),this._drawing=!0,this._drawAt(t)}),e.addEventListener("mousemove",t=>{this._drawing&&this._drawAt(t)}),window.addEventListener("mouseup",()=>{this._drawing=!1}),e.addEventListener("touchstart",t=>{t.preventDefault(),this._drawing=!0,this._drawAt(t)},{passive:!1}),e.addEventListener("touchmove",t=>{t.preventDefault(),this._drawing&&this._drawAt(t)},{passive:!1}),e.addEventListener("touchend",()=>{this._drawing=!1}),this.shadowRoot.getElementById("pen-tool")?.addEventListener("click",()=>{this._tool="pen",this.render()}),this.shadowRoot.getElementById("eraser-tool")?.addEventListener("click",()=>{this._tool="eraser",this.render()}),this.shadowRoot.getElementById("color-picker")?.addEventListener("input",t=>{this._currentColor=t.target.value,this._updatePaletteSelection()}),this.shadowRoot.querySelectorAll(".color-swatch").forEach(t=>{t.addEventListener("click",()=>{this._currentColor=t.dataset.color,this.shadowRoot.getElementById("color-picker").value=this._currentColor,this._updatePaletteSelection()})}),this.shadowRoot.getElementById("grid-toggle")?.addEventListener("click",()=>{this._gridOn=!this._gridOn,this.render()}),this.shadowRoot.getElementById("resolution-select")?.addEventListener("change",t=>{let[i,s]=t.target.value.split("x").map(n=>parseInt(n,10));this._resizeCanvas(i,s)}),this.shadowRoot.getElementById("clear-btn")?.addEventListener("click",()=>{this._clearCanvas()}),this.shadowRoot.getElementById("import-btn")?.addEventListener("click",()=>{this.shadowRoot.getElementById("file-input")?.click()}),this.shadowRoot.getElementById("file-input")?.addEventListener("change",t=>{let i=t.target.files?.[0];i&&this._handleImport(i)}),this.shadowRoot.getElementById("send-btn")?.addEventListener("click",()=>{this._sendToDevice()}))}_updatePaletteSelection(){this.shadowRoot.querySelectorAll(".color-swatch").forEach(e=>{e.dataset.color.toLowerCase()===this._currentColor.toLowerCase()?e.classList.add("active"):e.classList.remove("active")})}_resizeCanvas(e,t){let i=this._ctx.getImageData(0,0,this._width,this._height);this._width=e,this._height=t,this._logicalCanvas.width=e,this._logicalCanvas.height=t,this._ctx.putImageData(i,0,0),this._updateDisplaySize(),this._renderDisplay();let s=this.shadowRoot.querySelector(".info-row span:first-child");s&&(s.textContent=`Tool: ${this._tool} | Grid: ${this._gridOn?"LED":"Flat"}`)}_clearCanvas(){this._ctx.clearRect(0,0,this._width,this._height),this._renderDisplay()}_handleImport(e){let t=new FileReader;t.onload=i=>{let s=new Image;s.onload=()=>{this._ctx.clearRect(0,0,this._width,this._height),this._ctx.imageSmoothingEnabled=!1,this._ctx.drawImage(s,0,0,this._width,this._height),this._renderDisplay()},s.src=i.target.result},t.readAsDataURL(e)}async _sendToDevice(){if(!this._sending){this._sending=!0,this.render();try{let e=this._ctx.getImageData(0,0,this._width,this._height).data,t=[];for(let i=0;i<this._height;i++)for(let s=0;s<this._width;s++){let n=(i*this._width+s)*4,r=e[n],a=e[n+1],o=e[n+2];e[n+3]>0&&t.push({x:s,y:i,color:this._rgbToHex(r,a,o)})}t.length>0&&await this.callService("ipixel_color","set_pixels",{pixels:t})}catch(e){console.error("Failed to send pixels to device:",e)}finally{this._sending=!1,this.render()}}}_rgbToHex(e,t,i){return(e<<16|t<<8|i).toString(16).padStart(6,"0")}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}getCardSize(){return 4}};var pt=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}setConfig(e){this._config=e,this.render()}set hass(e){this._hass=e,this.render()}render(){if(!this._hass)return;let e=Object.keys(this._hass.states).filter(t=>t.startsWith("text.")||t.startsWith("switch.")).sort();this.shadowRoot.innerHTML=`
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
      </div>`,this.shadowRoot.querySelectorAll("select, input").forEach(t=>{t.addEventListener("change",()=>this.fireConfig())})}fireConfig(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:{type:this._config?.type||"custom:ipixel-display-card",entity:this.shadowRoot.getElementById("entity")?.value,name:this.shadowRoot.getElementById("name")?.value||void 0}},bubbles:!0,composed:!0}))}};customElements.define("ipixel-display-card",ot);customElements.define("ipixel-controls-card",at);customElements.define("ipixel-text-card",lt);customElements.define("ipixel-playlist-card",ct);customElements.define("ipixel-schedule-card",dt);customElements.define("ipixel-editor-card",ht);customElements.define("ipixel-simple-editor",pt);window.customCards=window.customCards||[];[{type:"ipixel-display-card",name:"iPIXEL Display",description:"LED matrix preview with power control"},{type:"ipixel-controls-card",name:"iPIXEL Controls",description:"Brightness, mode, and orientation controls"},{type:"ipixel-text-card",name:"iPIXEL Text",description:"Text input with effects and colors"},{type:"ipixel-playlist-card",name:"iPIXEL Playlist",description:"Playlist management"},{type:"ipixel-schedule-card",name:"iPIXEL Schedule",description:"Power schedule and time slots"},{type:"ipixel-editor-card",name:"iPIXEL Pixel Editor",description:"Draw custom pixel art and send to your LED matrix"}].forEach(p=>window.customCards.push({...p,preview:!0,documentationURL:"https://github.com/cagcoach/ha-ipixel-color"}));console.info(`%c iPIXEL Cards %c ${vt} `,"background:#03a9f4;color:#fff;padding:2px 6px;border-radius:4px 0 0 4px;","background:#333;color:#fff;padding:2px 6px;border-radius:0 4px 4px 0;");})();

(()=>{var Te=Object.defineProperty;var ne=(l,t)=>()=>(l&&(t=l(l=0)),t);var ae=(l,t)=>{for(var e in t)Te(l,e,{get:t[e],enumerable:!0})};var pe={};ae(pe,{$Bitmap:()=>Be,$Font:()=>De,$Glyph:()=>Fe,Bitmap:()=>j,Font:()=>bt,Glyph:()=>G});var q,Re,Le,fe,Pe,Oe,Ae,mt,bt,G,j,De,Fe,Be,ue=ne(()=>{q=function(l,t,e,i){function s(o){return o instanceof e?o:new e(function(n){n(o)})}return new(e||(e=Promise))(function(o,n){function r(d){try{c(i.next(d))}catch(h){n(h)}}function a(d){try{c(i.throw(d))}catch(h){n(h)}}function c(d){d.done?o(d.value):s(d.value).then(r,a)}c((i=i.apply(l,t||[])).next())})},Re=function(l){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var t=l[Symbol.asyncIterator],e;return t?t.call(l):(l=typeof __values=="function"?__values(l):l[Symbol.iterator](),e={},i("next"),i("throw"),i("return"),e[Symbol.asyncIterator]=function(){return this},e);function i(o){e[o]=l[o]&&function(n){return new Promise(function(r,a){n=l[o](n),s(r,a,n.done,n.value)})}}function s(o,n,r,a){Promise.resolve(a).then(function(c){o({value:c,done:r})},n)}},Le=(l,t,e)=>{l[t]=e},fe="[\\s]+",Pe={glyphname:"empty",codepoint:8203,bbw:0,bbh:0,bbxoff:0,bbyoff:0,swx0:0,swy0:0,dwx0:0,dwy0:0,swx1:0,swy1:0,dwx1:0,dwy1:0,vvectorx:0,vvectory:0,hexdata:[]},Oe=["glyphname","codepoint","bbw","bbh","bbxoff","bbyoff","swx0","swy0","dwx0","dwy0","swx1","swy1","dwx1","dwy1","vvectorx","vvectory","hexdata"],Ae={lr:"lrtb",rl:"rltb",tb:"tbrl",bt:"btrl",lrtb:void 0,lrbt:void 0,rltb:void 0,rlbt:void 0,tbrl:void 0,tblr:void 0,btrl:void 0,btlr:void 0},mt={lr:1,rl:2,tb:0,bt:-1},bt=class{constructor(){this.headers=void 0,this.__headers={},this.props={},this.glyphs=new Map,this.__glyph_count_to_check=null,this.__curline_startchar=null,this.__curline_chars=null}load_filelines(t){var e,i;return q(this,void 0,void 0,function*(){try{this.__f=t,yield this.__parse_headers()}finally{if(typeof Deno<"u"&&this.__f!==void 0)try{for(var s=Re(this.__f),o;o=yield s.next(),!o.done;){let n=o.value}}catch(n){e={error:n}}finally{try{o&&!o.done&&(i=s.return)&&(yield i.call(s))}finally{if(e)throw e.error}}}return this})}__parse_headers(){var t,e;return q(this,void 0,void 0,function*(){for(;;){let i=(e=yield(t=this.__f)===null||t===void 0?void 0:t.next())===null||e===void 0?void 0:e.value,s=i.split(/ (.+)/,2),o=s.length,n;if(o===2){let r=s[0],a=s[1].trim();switch(r){case"STARTFONT":this.__headers.bdfversion=parseFloat(a);break;case"FONT":this.__headers.fontname=a;break;case"SIZE":n=a.split(" "),this.__headers.pointsize=parseInt(n[0],10),this.__headers.xres=parseInt(n[1],10),this.__headers.yres=parseInt(n[2],10);break;case"FONTBOUNDINGBOX":n=a.split(" "),this.__headers.fbbx=parseInt(n[0],10),this.__headers.fbby=parseInt(n[1],10),this.__headers.fbbxoff=parseInt(n[2],10),this.__headers.fbbyoff=parseInt(n[3],10);break;case"STARTPROPERTIES":this.__parse_headers_after(),yield this.__parse_props();return;case"COMMENT":(!("comment"in this.__headers)||!Array.isArray(this.__headers.comment))&&(this.__headers.comment=[]),this.__headers.comment.push(a.replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g,""));break;case"SWIDTH":n=a.split(" "),this.__headers.swx0=parseInt(n[0],10),this.__headers.swy0=parseInt(n[1],10);break;case"DWIDTH":n=a.split(" "),this.__headers.dwx0=parseInt(n[0],10),this.__headers.dwy0=parseInt(n[1],10);break;case"SWIDTH1":n=a.split(" "),this.__headers.swx1=parseInt(n[0],10),this.__headers.swy1=parseInt(n[1],10);break;case"DWIDTH1":n=a.split(" "),this.__headers.dwx1=parseInt(n[0],10),this.__headers.dwy1=parseInt(n[1],10);break;case"VVECTOR":n=fe.split(a),this.__headers.vvectorx=parseInt(n[0],10),this.__headers.vvectory=parseInt(n[1],10);break;case"METRICSSET":case"CONTENTVERSION":this.__headers[r.toLowerCase()]=parseInt(a,10);break;case"CHARS":console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword"),this.__parse_headers_after(),this.__curline_chars=i,yield this.__parse_glyph_count();return;case"STARTCHAR":console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword"),console.warn("Cannot find 'CHARS' line"),this.__parse_headers_after(),this.__curline_startchar=i,yield this.__prepare_glyphs();return}}if(o===1&&s[0].trim()==="ENDFONT"){console.warn("It looks like the font does not have property block beginning with 'STARTPROPERTIES' keyword"),console.warn("This font does not have any glyphs");return}}})}__parse_headers_after(){"metricsset"in this.__headers||(this.__headers.metricsset=0),this.headers=this.__headers}__parse_props(){var t,e;return q(this,void 0,void 0,function*(){for(;;){let s=((e=yield(t=this.__f)===null||t===void 0?void 0:t.next())===null||e===void 0?void 0:e.value).split(/ (.+)/,2),o=s.length;if(o===2){let n=s[0],r=s[1].replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g,"");n==="COMMENT"?((!("comment"in this.props)||!Array.isArray(this.props.comment))&&(this.props.comment=[]),this.props.comment.push(r.replace(/^[\s"'\t\r\n]+|[\s"'\t\r\n]+$/g,""))):this.props[n.toLowerCase()]=r}else if(o===1){let n=s[0].trim();if(n==="ENDPROPERTIES"){yield this.__parse_glyph_count();return}if(n==="ENDFONT"){console.warn("This font does not have any glyphs");return}else this.props[n]=null}}})}__parse_glyph_count(){var t,e;return q(this,void 0,void 0,function*(){let i;if(this.__curline_chars===null?i=(e=yield(t=this.__f)===null||t===void 0?void 0:t.next())===null||e===void 0?void 0:e.value:(i=this.__curline_chars,this.__curline_chars=null),i.trim()==="ENDFONT"){console.warn("This font does not have any glyphs");return}let s=i.split(/ (.+)/,2);s[0]==="CHARS"?this.__glyph_count_to_check=parseInt(s[1].trim(),10):(this.__curline_startchar=i,console.warn("Cannot find 'CHARS' line next to 'ENDPROPERTIES' line")),yield this.__prepare_glyphs()})}__prepare_glyphs(){var t,e;return q(this,void 0,void 0,function*(){let i=0,s=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],o=[],n=!1,r=!1;for(;;){let a;if(this.__curline_startchar===null?a=(e=yield(t=this.__f)===null||t===void 0?void 0:t.next())===null||e===void 0?void 0:e.value:(a=this.__curline_startchar,this.__curline_startchar=null),a==null){console.warn("This font does not have 'ENDFONT' keyword"),this.__prepare_glyphs_after();return}let c=a.split(/ (.+)/,2),d=c.length;if(d===2){let h=c[0],f=c[1].trim(),p;switch(h){case"STARTCHAR":s=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],s[0]=f,r=!1;break;case"ENCODING":i=parseInt(f,10),s[1]=i;break;case"BBX":p=f.split(" "),s[2]=parseInt(p[0],10),s[3]=parseInt(p[1],10),s[4]=parseInt(p[2],10),s[5]=parseInt(p[3],10);break;case"SWIDTH":p=f.split(" "),s[6]=parseInt(p[0],10),s[7]=parseInt(p[1],10);break;case"DWIDTH":p=f.split(" "),s[8]=parseInt(p[0],10),s[9]=parseInt(p[1],10);break;case"SWIDTH1":p=f.split(" "),s[10]=parseInt(p[0],10),s[11]=parseInt(p[1],10);break;case"DWIDTH1":p=f.split(" "),s[12]=parseInt(p[0],10),s[13]=parseInt(p[1],10);break;case"VVECTOR":p=fe.split(f),s[14]=parseInt(p[0],10),s[15]=parseInt(p[1],10);break}}else if(d===1){let h=c[0].trim();switch(h){case"BITMAP":o=[],n=!0;break;case"ENDCHAR":n=!1,s[16]=o,this.glyphs.set(i,s),r=!0;break;case"ENDFONT":if(r){this.__prepare_glyphs_after();return}default:n&&o.push(h);break}}}})}__prepare_glyphs_after(){let t=this.glyphs.size;this.__glyph_count_to_check!==t&&(this.__glyph_count_to_check===null?console.warn("The glyph count next to 'CHARS' keyword does not exist"):console.warn(`The glyph count next to 'CHARS' keyword is ${this.__glyph_count_to_check.toString()}, which does not match the actual glyph count ${t.toString()}`))}get length(){return this.glyphs.size}itercps(t,e){let i=t??1,s=e??null,o,n=[...this.glyphs.keys()];switch(i){case 1:o=n.sort((r,a)=>r-a);break;case 0:o=n;break;case 2:o=n.sort((r,a)=>a-r);break;case-1:o=n.reverse();break}if(s!==null){let r=a=>{if(typeof s=="number")return a<s;if(Array.isArray(s)&&s.length===2&&typeof s[0]=="number"&&typeof s[1]=="number")return a<=s[1]&&a>=s[0];if(Array.isArray(s)&&Array.isArray(s[0]))for(let c of s){let[d,h]=c;if(a<=h&&a>=d)return!0}return!1};o=o.filter(r)}return o}*iterglyphs(t,e){for(let i of this.itercps(t,e))yield this.glyphbycp(i)}glyphbycp(t){let e=this.glyphs.get(t);if(e==null)return console.warn(`Glyph "${String.fromCodePoint(t)}" (codepoint ${t.toString()}) does not exist in the font. Will return 'null'`),null;{let i={};return Oe.forEach((s,o)=>{Le(i,s,e[o])}),new G(i,this)}}glyph(t){let e=t.codePointAt(0);return e===void 0?null:this.glyphbycp(e)}lacksglyphs(t){let e=[],i=t.length;for(let s,o=0;o<i;o++){s=t[o];let n=s.codePointAt(0);(n===void 0||!this.glyphs.has(n))&&e.push(s)}return e.length!==0?e:null}drawcps(t,e={}){var i,s,o,n,r,a,c;let d=(i=e.linelimit)!==null&&i!==void 0?i:512,h=(s=e.mode)!==null&&s!==void 0?s:1,f=(o=e.direction)!==null&&o!==void 0?o:"lrtb",p=(n=e.usecurrentglyphspacing)!==null&&n!==void 0?n:!1,u=(r=e.missing)!==null&&r!==void 0?r:null;if(this.headers===void 0)throw new Error("Font is not loaded");let g,b,m,x,_,v,y,S,w,T,E,I,C,L,W,ht,ft,pt,Qt=(a=Ae[f])!==null&&a!==void 0?a:f,te=Qt.slice(0,2),ee=Qt.slice(2,4);te in mt&&ee in mt?(v=mt[te],y=mt[ee]):(v=1,y=0),y===0||y===2?g=1:(y===1||y===-1)&&(g=0),v===1||v===-1?b=1:(v===2||v===0)&&(b=0),h===1&&(S=v>0?this.headers.fbbx:this.headers.fbby,v>0?(I="dwx0",C="dwy0"):(I="dwx1",C="dwy1"),I in this.headers?E=this.headers[I]:C in this.headers?E=this.headers[C]:E=null);let ie=[];x=[];let se=[];W=[],ht=0;let oe=()=>{ie.push(x),p?W.shift():W.pop(),se.push(W)},Ee=t[Symbol.iterator]();for(ft=!1;;){if(ft)ft=!1;else{if(_=(c=Ee.next())===null||c===void 0?void 0:c.value,_===void 0)break;let ut=this.glyphbycp(_);ut!==null?w=ut:u?u instanceof G?w=u:w=new G(u,this):w=new G(Pe,this),m=w.draw(),pt=m.width(),L=0,h===1&&I!==void 0&&C!==void 0&&(T=w.meta[I]||w.meta[C],T==null&&(T=E),T!=null&&S!==void 0&&(L=T-S))}if(pt!==void 0&&L!==void 0&&m!==void 0&&w!==void 0&&_!==void 0)if(ht+=pt+L,ht<=d)x.push(m),W.push(L);else{if(x.length===0)throw new Error(`\`_linelimit\` (${d}) is too small the line can't even contain one glyph: "${w.chr()}" (codepoint ${_}, width: ${pt})`);oe(),ht=0,x=[],W=[],ft=!0}}x.length!==0&&oe();let Ce=ie.map((ut,Ie)=>j.concatall(ut,{direction:v,align:g,offsetlist:se[Ie]}));return j.concatall(Ce,{direction:y,align:b})}draw(t,e={}){let{linelimit:i,mode:s,direction:o,usecurrentglyphspacing:n,missing:r}=e;return this.drawcps(t.split("").map(a=>{let c=a.codePointAt(0);return c===void 0?8203:c}),{linelimit:i,mode:s,direction:o,usecurrentglyphspacing:n,missing:r})}drawall(t={}){let{order:e,r:i,linelimit:s,mode:o,direction:n,usecurrentglyphspacing:r}=t,a=o??0;return this.drawcps(this.itercps(e,i),{linelimit:s,mode:a,direction:n,usecurrentglyphspacing:r})}},G=class{constructor(t,e){this.meta=t,this.font=e}toString(){return this.draw().toString()}repr(){var t;return"Glyph("+JSON.stringify(this.meta,null,2)+", Font(<"+((t=this.font.headers)===null||t===void 0?void 0:t.fontname)+">)"}cp(){return this.meta.codepoint}chr(){return String.fromCodePoint(this.cp())}draw(t,e){let i=t??0,s=e??null,o;switch(i){case 0:o=this.__draw_fbb();break;case 1:o=this.__draw_bb();break;case 2:o=this.__draw_original();break;case-1:if(s!==null)o=this.__draw_user_specified(s);else throw new Error("Parameter bb in draw() method must be set when mode=-1");break}return o}__draw_user_specified(t){let e=this.meta.bbxoff,i=this.meta.bbyoff,[s,o,n,r]=t;return this.__draw_bb().crop(s,o,-e+n,-i+r)}__draw_original(){return new j(this.meta.hexdata.map(t=>t?parseInt(t,16).toString(2).padStart(t.length*4,"0"):""))}__draw_bb(){let t=this.meta.bbw,e=this.meta.bbh,i=this.__draw_original(),s=i.bindata,o=s.length;return o!==e&&console.warn(`Glyph "${this.meta.glyphname.toString()}" (codepoint ${this.meta.codepoint.toString()})'s bbh, ${e.toString()}, does not match its hexdata line count, ${o.toString()}`),i.bindata=s.map(n=>n.slice(0,t)),i}__draw_fbb(){let t=this.font.headers;if(t===void 0)throw new Error("Font is not loaded");return this.__draw_user_specified([t.fbbx,t.fbby,t.fbbxoff,t.fbbyoff])}origin(t={}){var e,i,s,o;let n=(e=t.mode)!==null&&e!==void 0?e:0,r=(i=t.fromorigin)!==null&&i!==void 0?i:!1,a=(s=t.xoff)!==null&&s!==void 0?s:null,c=(o=t.yoff)!==null&&o!==void 0?o:null,d,h=this.meta.bbxoff,f=this.meta.bbyoff;switch(n){case 0:let p=this.font.headers;if(p===void 0)throw new Error("Font is not loaded");d=[p.fbbxoff,p.fbbyoff];break;case 1:d=[h,f];break;case 2:d=[h,f];break;case-1:if(a!==null&&c!==null)d=[a,c];else throw new Error("Parameter xoff and yoff in origin() method must be all set when mode=-1");break}return r?d:[0-d[0],0-d[1]]}},j=class l{constructor(t){this.bindata=t}toString(){return this.bindata.join(`
`).replace(/0/g,".").replace(/1/g,"#").replace(/2/g,"&")}repr(){return`Bitmap(${JSON.stringify(this.bindata,null,2)})`}width(){return this.bindata[0].length}height(){return this.bindata.length}clone(){return new l([...this.bindata])}static __crop_string(t,e,i){let s=t,o=t.length,n=0;e<0&&(n=0-e,s=s.padStart(n+o,"0")),e+i>o&&(s=s.padEnd(e+i-o+s.length,"0"));let r=e+n;return s.slice(r,r+i)}static __string_offset_concat(t,e,i){let s=i??0;if(s===0)return t+e;let o=t.length,n=e.length,r=o+s,a=r+n,c=Math.min(0,r),d=Math.max(o,a),h=l.__crop_string(t,c,d-c),f=l.__crop_string(e,c-r,d-c);return h.split("").map((p,u)=>(parseInt(f[u],10)||parseInt(p,10)).toString()).join("")}static __listofstr_offset_concat(t,e,i){let s=i??0,o,n;if(s===0)return t.concat(e);let r=t[0].length,a=t.length,c=e.length,d=a+s,h=d+c,f=Math.min(0,d),p=Math.max(a,h),u=[];for(let g=f;g<p;g++)g<0||g>=a?o="0".repeat(r):o=t[g],g<d||g>=h?n="0".repeat(r):n=e[g-d],u.push(o.split("").map((b,m)=>(parseInt(n[m],10)||parseInt(b,10)).toString()).join(""));return u}static __crop_bitmap(t,e,i,s,o){let n,r=[],a=t.length;for(let c=0;c<i;c++)n=a-o-i+c,n<0||n>=a?r.push("0".repeat(e)):r.push(l.__crop_string(t[n],s,e));return r}crop(t,e,i,s){let o=i??0,n=s??0;return this.bindata=l.__crop_bitmap(this.bindata,t,e,o,n),this}overlay(t){let e=this.bindata,i=t.bindata;return e.length!==i.length&&console.warn("the bitmaps to overlay have different height"),e[0].length!==i[0].length&&console.warn("the bitmaps to overlay have different width"),this.bindata=e.map((s,o)=>{let n=s,r=i[o];return n.split("").map((a,c)=>(parseInt(r[c],10)||parseInt(a,10)).toString()).join("")}),this}static concatall(t,e={}){var i,s,o;let n=(i=e.direction)!==null&&i!==void 0?i:1,r=(s=e.align)!==null&&s!==void 0?s:1,a=(o=e.offsetlist)!==null&&o!==void 0?o:null,c,d,h,f,p,u,g;if(n>0){h=Math.max(...t.map(m=>m.height())),p=Array(h).fill("");let b=(m,x,_)=>n===1?l.__string_offset_concat(m,x,_):l.__string_offset_concat(x,m,_);for(let m=0;m<h;m++){r?d=-m-1:d=m,f=0;let x=t.length;for(let _=0;_<x;_++){let v=t[_];a&&_!==0&&(f=a[_-1]),m<v.height()?d>=0?p[d]=b(p[d],v.bindata[d],f):p[h+d]=b(p[h+d],v.bindata[v.height()+d],f):d>=0?p[d]=b(p[d],"0".repeat(v.width()),f):p[h+d]=b(p[h+d],"0".repeat(v.width()),f)}}}else{h=Math.max(...t.map(m=>m.width())),p=[],f=0;let b=t.length;for(let m=0;m<b;m++){let x=t[m];a&&m!==0&&(f=a[m-1]),c=x.bindata,u=x.width(),u!==h&&(r?g=0:g=u-h,c=this.__crop_bitmap(c,h,x.height(),g,0)),n===0?p=l.__listofstr_offset_concat(p,c,f):p=l.__listofstr_offset_concat(c,p,f)}}return new this(p)}concat(t,e={}){let{direction:i,align:s,offset:o}=e,n=o??0;return this.bindata=l.concatall([this,t],{direction:i,align:s,offsetlist:[n]}).bindata,this}static __enlarge_bindata(t,e,i){let s=e??1,o=i??1,n=[...t];return s>1&&(n=n.map(r=>r.split("").reduce((a,c)=>a.concat(Array(s).fill(c)),[]).join(""))),o>1&&(n=n.reduce((r,a)=>r.concat(Array(o).fill(a)),[])),n}enlarge(t,e){return this.bindata=l.__enlarge_bindata(this.bindata,t,e),this}replace(t,e){let i=typeof t=="number"?t.toString():t,s=typeof e=="number"?e.toString():e,o=(n,r,a)=>{if("replaceAll"in String.prototype)return n.replaceAll(r,a);{let c=d=>d.replace(/[.*+\-?^${}()|[\]\\]/g,"\\$&");return n.replace(new RegExp(c(r),"g"),a)}};return this.bindata=this.bindata.map(n=>o(n,i,s)),this}shadow(t,e){let i=t??1,s=e??-1,o,n,r,a,c,d,h=this.clone();return d=this.width(),o=this.height(),d+=Math.abs(i),o+=Math.abs(s),h.bindata=h.bindata.map(f=>f.replace(/1/g,"2")),i>0?(n=0,a=-i):(n=i,a=0),s>0?(r=0,c=-s):(r=s,c=0),this.crop(d,o,n,r),h.crop(d,o,a,c),h.overlay(this),this.bindata=h.bindata,this}glow(t){var e,i,s,o,n,r,a,c,d,h,f,p,u,g;let b=t??0,m,x,_,v;_=this.width(),v=this.height(),_+=2,v+=2,this.crop(_,v,-1,-1);let y=this.todata(2),S=y.length;for(let w=0;w<S;w++){m=y[w];let T=m.length;for(let E=0;E<T;E++)x=m[E],x===1&&((e=y[w])[i=E-1]||(e[i]=2),(s=y[w])[o=E+1]||(s[o]=2),(n=y[w-1])[E]||(n[E]=2),(r=y[w+1])[E]||(r[E]=2),b===1&&((a=y[w-1])[c=E-1]||(a[c]=2),(d=y[w-1])[h=E+1]||(d[h]=2),(f=y[w+1])[p=E-1]||(f[p]=2),(u=y[w+1])[g=E+1]||(u[g]=2)))}return this.bindata=y.map(w=>w.map(T=>T.toString()).join("")),this}bytepad(t){let e=t??8,i=this.width(),s=this.height(),o=i%e;return o===0?this:this.crop(i+e-o,s)}todata(t){let e=t??1,i;switch(e){case 0:i=this.bindata.join(`
`);break;case 1:i=this.bindata;break;case 2:i=this.bindata.map(s=>s.split("").map(o=>parseInt(o,10)));break;case 3:i=[].concat(...this.todata(2));break;case 4:i=this.bindata.map(s=>{if(!/^[01]+$/.test(s))throw new Error(`Invalid binary string: ${s}`);return parseInt(s,2).toString(16).padStart(Math.floor(-1*this.width()/4)*-1,"0")});break;case 5:i=this.bindata.map(s=>{if(!/^[01]+$/.test(s))throw new Error(`Invalid binary string: ${s}`);return parseInt(s,2)});break}return i}draw2canvas(t,e){let i=e??{0:null,1:"black",2:"red"};return this.todata(2).forEach((s,o)=>{s.forEach((n,r)=>{let a=n.toString();if(a==="0"||a==="1"||a==="2"){let c=i[a];c!=null&&(t.fillStyle=c,t.fillRect(r,o,1,1))}})}),this}},De=l=>q(void 0,void 0,void 0,function*(){return yield new bt().load_filelines(l)}),Fe=(l,t)=>new G(l,t),Be=l=>new j(l)});var ge={};ae(ge,{default:()=>Ve});function Ve(l,{includeLastEmptyLine:t=!0,encoding:e="utf-8",delimiter:i=/\r?\n/g}={}){return He(this,arguments,function*(){let o=yield V(Ge(l)),{value:n,done:r}=yield V(o.read()),a=new TextDecoder(e),c=n?a.decode(n):"",d;if(typeof i=="string"){if(i==="")throw new Error("delimiter cannot be empty string!");d=new RegExp(Ne(i),"g")}else/g/.test(i.flags)===!1?d=new RegExp(i.source,i.flags+"g"):d=i;let h=0;for(;;){let f=d.exec(c);if(f===null){if(r===!0)break;let p=c.substring(h);({value:n,done:r}=yield V(o.read())),c=p+(c?a.decode(n):""),h=0;continue}yield yield V(c.substring(h,f.index)),h=d.lastIndex}(t||h<c.length)&&(yield yield V(c.substring(h)))})}var ze,V,He,Ne,Ge,me=ne(()=>{ze=function(l,t,e,i){function s(o){return o instanceof e?o:new e(function(n){n(o)})}return new(e||(e=Promise))(function(o,n){function r(d){try{c(i.next(d))}catch(h){n(h)}}function a(d){try{c(i.throw(d))}catch(h){n(h)}}function c(d){d.done?o(d.value):s(d.value).then(r,a)}c((i=i.apply(l,t||[])).next())})},V=function(l){return this instanceof V?(this.v=l,this):new V(l)},He=function(l,t,e){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var i=e.apply(l,t||[]),s,o=[];return s={},n("next"),n("throw"),n("return"),s[Symbol.asyncIterator]=function(){return this},s;function n(f){i[f]&&(s[f]=function(p){return new Promise(function(u,g){o.push([f,p,u,g])>1||r(f,p)})})}function r(f,p){try{a(i[f](p))}catch(u){h(o[0][3],u)}}function a(f){f.value instanceof V?Promise.resolve(f.value.v).then(c,d):h(o[0][2],f)}function c(f){r("next",f)}function d(f){r("throw",f)}function h(f,p){f(p),o.shift(),o.length&&r(o[0][0],o[0][1])}},Ne=l=>l.replace(/[.*+\-?^${}()|[\]\\]/g,"\\$&"),Ge=l=>ze(void 0,void 0,void 0,function*(){let t=yield fetch(l);if(t.body===null)throw new Error("Cannot read file");return t.body.getReader()})});var re="2.11.1";var le="iPIXEL_DisplayState",ce="iPIXEL_TestMode",ke={text:"",mode:"text",effect:"fixed",speed:50,fgColor:"#ff6600",bgColor:"#000000",font:"VCR_OSD_MONO",lastUpdate:0};function Me(){try{let l=localStorage.getItem(le);if(l)return JSON.parse(l)}catch(l){console.warn("iPIXEL: Could not load saved state",l)}return{...ke}}function $e(l){try{localStorage.setItem(le,JSON.stringify(l))}catch(t){console.warn("iPIXEL: Could not save state",t)}}window.iPIXELDisplayState||(window.iPIXELDisplayState=Me());function gt(){return window.iPIXELDisplayState}function k(l){return window.iPIXELDisplayState={...window.iPIXELDisplayState,...l,lastUpdate:Date.now()},$e(window.iPIXELDisplayState),window.dispatchEvent(new CustomEvent("ipixel-display-update",{detail:window.iPIXELDisplayState})),window.iPIXELDisplayState}function U(){if(window.iPIXELTestMode!==void 0)return window.iPIXELTestMode;try{return localStorage.getItem(ce)==="true"}catch{return!1}}function de(l){window.iPIXELTestMode=l;try{localStorage.setItem(ce,String(l))}catch{}window.dispatchEvent(new CustomEvent("ipixel-test-mode-change",{detail:{enabled:l}}))}function F(l,t=null){let e=()=>typeof t=="function"?t():t;return{load(){try{let i=localStorage.getItem(l);if(i!==null)return JSON.parse(i)}catch(i){console.warn(`iPIXEL: Could not load ${l}`,i)}return e()},save(i){try{localStorage.setItem(l,JSON.stringify(i))}catch(s){console.warn(`iPIXEL: Could not save ${l}`,s)}},clear(){try{localStorage.removeItem(l)}catch{}}}}function he(){let l=[];typeof navigator<"u"&&!navigator.bluetooth&&l.push("WebBluetooth");try{document.createElement("canvas").getContext("2d")||l.push("Canvas")}catch{l.push("Canvas")}return l}var O=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._config={},this._hass=null,this._handleTestModeChange=()=>this.render(),window.addEventListener("ipixel-test-mode-change",this._handleTestModeChange)}disconnectedCallback(){window.removeEventListener("ipixel-test-mode-change",this._handleTestModeChange)}set hass(t){this._hass=t,this.render()}setConfig(t){if(!t.entity&&!U()){this._config=t;return}this._config=t,this.render()}isInTestMode(){return U()||!this._config.entity||!this.getEntity()}getEntity(){return!this._hass||!this._config.entity?null:this._hass.states[this._config.entity]}getRelatedEntity(t,e=""){if(!this._hass||!this._config.entity)return null;let i=this._config.entity.replace(/^[^.]+\./,"").replace(/_?(text|display|gif_url)$/i,""),s=`${t}.${i}${e}`;if(this._hass.states[s])return this._hass.states[s];let o=Object.keys(this._hass.states).filter(n=>{if(!n.startsWith(`${t}.`))return!1;let r=n.replace(/^[^.]+\./,"");return r.includes(i)||i.includes(r.replace(e,""))});if(e){let n=o.find(r=>r.endsWith(e));if(n)return this._hass.states[n]}else{let n=o.sort((r,a)=>r.length-a.length);if(n.length>0)return this._hass.states[n[0]]}return o.length>0?this._hass.states[o[0]]:null}async callService(t,e,i={}){if(this._hass){this.isInTestMode()&&console.info(`iPIXEL [Test Mode]: ${t}.${e}`,i);try{await this._hass.callService(t,e,i)}catch(s){console.error(`iPIXEL service call failed: ${t}.${e}`,s)}}}getResolution(){let t=this.getRelatedEntity("sensor","_width")||this._hass?.states["sensor.display_width"],e=this.getRelatedEntity("sensor","_height")||this._hass?.states["sensor.display_height"];if(t&&e){let i=parseInt(t.state),s=parseInt(e.state);if(!isNaN(i)&&!isNaN(s)&&i>0&&s>0)return[i,s]}return[64,16]}isOn(){return this.isInTestMode()?!0:this.getRelatedEntity("switch")?.state==="on"}hexToRgb(t){let e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);return e?[parseInt(e[1],16),parseInt(e[2],16),parseInt(e[3],16)]:[255,255,255]}rgbToHex(t,e,i){return"#"+(t<<16|e<<8|i).toString(16).padStart(6,"0")}escapeHtml(t){let e=document.createElement("div");return e.textContent=t,e.innerHTML}render(){}getCardSize(){return 2}};var A=`
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

  /* Tabs */
  .tabs { display: flex; gap: 4px; margin-bottom: 16px; }
  .tab {
    flex: 1;
    padding: 10px 8px;
    border: none;
    background: rgba(255,255,255,0.05);
    color: var(--ipixel-text);
    cursor: pointer;
    border-radius: 8px;
    font-size: 0.8em;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  .tab:hover { background: rgba(255,255,255,0.1); }
  .tab.active { background: var(--ipixel-primary); color: #fff; }
  .tab-panel { display: block; }
  .tab-panel[hidden] { display: none; }

  /* Toggle switch (iOS style) */
  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
  }
  .toggle-label { font-size: 0.85em; color: var(--ipixel-text); }
  .toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    background: rgba(255,255,255,0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .toggle-switch.active { background: var(--ipixel-primary); }
  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
  }
  .toggle-switch.active::after { transform: translateX(20px); }

  /* Subsection grouping */
  .subsection {
    background: rgba(255,255,255,0.03);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
  }
  .subsection-title {
    font-size: 0.75em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.6;
    margin-bottom: 8px;
  }

  /* Form dialog */
  .form-dialog {
    background: rgba(255,255,255,0.03);
    border-radius: 8px;
    padding: 16px;
    margin-top: 12px;
  }
  .form-row { margin-bottom: 12px; }
  .form-row label { display: block; font-size: 0.8em; opacity: 0.7; margin-bottom: 4px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }

  /* Two-column helper */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  @media (max-width: 400px) {
    .button-grid-4 { grid-template-columns: repeat(2, 1fr); }
    .button-grid-3 { grid-template-columns: repeat(2, 1fr); }
  }

  /* Mobile-friendly touch targets */
  @media (max-width: 600px) {
    .btn { padding: 10px 16px; min-height: 40px; }
    .icon-btn { width: 40px; height: 40px; }
    .slider::-webkit-slider-thumb { width: 24px; height: 24px; }
    .slider::-moz-range-thumb { width: 24px; height: 24px; }
    .dropdown { padding: 10px 12px; }
    .text-input { padding: 12px; }
  }
`;function xt(l){if(!l||l==="#111"||l==="#000")return[17,17,17];if(l==="#050505")return[5,5,5];let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(l);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:[17,17,17]}function it(l,t,e){let i=0,s=0,o=0,n=Math.floor(l*6),r=l*6-n,a=e*(1-t),c=e*(1-r*t),d=e*(1-(1-r)*t);switch(n%6){case 0:i=e,s=d,o=a;break;case 1:i=c,s=e,o=a;break;case 2:i=a,s=e,o=d;break;case 3:i=a,s=c,o=e;break;case 4:i=d,s=a,o=e;break;case 5:i=e,s=a,o=c;break}return[i*255,s*255,o*255]}var yt=class{constructor(t){this.renderer=t}init(t,e){let{width:i,height:s}=this.renderer;switch(t){case"scroll_ltr":case"scroll_rtl":e.offset=0;break;case"blink":e.visible=!0;break;case"snow":case"breeze":e.phases=[];for(let o=0;o<i*s;o++)e.phases.push(Math.random()*Math.PI*2);break;case"laser":e.position=0;break;case"fade":e.opacity=0,e.direction=1;break;case"typewriter":e.charIndex=0,e.cursorVisible=!0;break;case"bounce":e.offset=0,e.direction=1;break;case"sparkle":e.sparkles=[];for(let o=0;o<Math.floor(i*s*.1);o++)e.sparkles.push({x:Math.floor(Math.random()*i),y:Math.floor(Math.random()*s),brightness:Math.random(),speed:.05+Math.random()*.1});break}}step(t,e){let{width:i,extendedWidth:s}=this.renderer;switch(t){case"scroll_ltr":e.offset-=1,e.offset<=-(s||i)&&(e.offset=i);break;case"scroll_rtl":e.offset+=1,e.offset>=(s||i)&&(e.offset=-i);break;case"blink":e.visible=!e.visible;break;case"laser":e.position=(e.position+1)%i;break;case"fade":e.opacity+=e.direction*.05,e.opacity>=1?(e.opacity=1,e.direction=-1):e.opacity<=0&&(e.opacity=0,e.direction=1);break;case"typewriter":e.tick%3===0&&e.charIndex++,e.cursorVisible=e.tick%10<5;break;case"bounce":{e.offset+=e.direction;let o=Math.max(0,(s||i)-i);e.offset>=o?(e.offset=o,e.direction=-1):e.offset<=0&&(e.offset=0,e.direction=1);break}case"sparkle":{let o=e.sparkles;for(let n of o)n.brightness+=n.speed,n.brightness>1&&(n.brightness=0,n.x=Math.floor(Math.random()*i),n.y=Math.floor(Math.random()*this.renderer.height));break}}}render(t,e,i,s,o){let{width:n,height:r}=this.renderer,a=s||i||[],c=i||[],d=o||n;for(let h=0;h<r;h++)for(let f=0;f<n;f++){let p,u=f;if(t==="scroll_ltr"||t==="scroll_rtl"||t==="bounce"){for(u=f-(e.offset||0);u<0;)u+=d;for(;u>=d;)u-=d;p=a[h*d+u]||"#111"}else if(t==="typewriter"){let v=(e.charIndex||0)*6;f<v?p=c[h*n+f]||"#111":f===v&&e.cursorVisible?p="#ffffff":p="#111"}else p=c[h*n+f]||"#111";let[g,b,m]=xt(p);if(g>20||b>20||m>20)switch(t){case"blink":e.visible||(g=b=m=17);break;case"snow":{let _=e.phases,v=_?.[h*n+f]||0,y=e.tick||0,S=.3+.7*Math.abs(Math.sin(v+y*.3));g*=S,b*=S,m*=S;break}case"breeze":{let _=e.phases,v=_?.[h*n+f]||0,y=e.tick||0,S=.4+.6*Math.abs(Math.sin(v+y*.15+f*.2));g*=S,b*=S,m*=S;break}case"laser":{let _=e.position||0,y=Math.abs(f-_)<3?1:.3;g*=y,b*=y,m*=y;break}case"fade":{let _=e.opacity||1;g*=_,b*=_,m*=_;break}}if(t==="sparkle"&&e.sparkles){let _=e.sparkles;for(let v of _)if(v.x===f&&v.y===h){let y=Math.sin(v.brightness*Math.PI);g=Math.min(255,g+y*200),b=Math.min(255,b+y*200),m=Math.min(255,m+y*200)}}this.renderer.setPixel(f,h,[g,b,m])}}},wt=class{constructor(t){this.renderer=t}init(t,e){let{width:i,height:s}=this.renderer;switch(t){case"rainbow":e.position=0;break;case"matrix":{let o=[[0,255,0],[0,255,255],[255,0,255]];e.colorMode=o[Math.floor(Math.random()*o.length)],e.buffer=[];for(let n=0;n<s;n++)e.buffer.push(Array(i).fill(null).map(()=>[0,0,0]));break}case"plasma":case"gradient":e.time=0;break;case"fire":e.heat=[];for(let o=0;o<i*s;o++)e.heat.push(0);e.palette=this._createFirePalette();break;case"water":e.current=[],e.previous=[];for(let o=0;o<i*s;o++)e.current.push(0),e.previous.push(0);e.damping=.95;break;case"stars":{e.stars=[];let o=Math.floor(i*s*.15);for(let n=0;n<o;n++)e.stars.push({x:Math.floor(Math.random()*i),y:Math.floor(Math.random()*s),brightness:Math.random(),speed:.02+Math.random()*.05,phase:Math.random()*Math.PI*2});break}case"confetti":e.particles=[];for(let o=0;o<20;o++)e.particles.push(this._createConfettiParticle(i,s,!0));break;case"plasma_wave":case"radial_pulse":case"hypnotic":case"aurora":e.time=0;break;case"lava":e.time=0,e.noise=[];for(let o=0;o<i*s;o++)e.noise.push(Math.random()*Math.PI*2);break}}step(t,e){let{width:i,height:s}=this.renderer;switch(t){case"rainbow":e.position=(e.position+.01)%1;break;case"matrix":this._stepMatrix(e,i,s);break;case"plasma":case"gradient":e.time=(e.time||0)+.05;break;case"fire":this._stepFire(e,i,s);break;case"water":this._stepWater(e,i,s);break;case"stars":{let o=e.stars;for(let n of o)n.phase+=n.speed;break}case"confetti":{let o=e.particles;for(let n=0;n<o.length;n++){let r=o[n];r.y+=r.speed,r.x+=r.drift,r.rotation+=r.rotationSpeed,r.y>s&&(o[n]=this._createConfettiParticle(i,s,!1))}break}case"plasma_wave":case"radial_pulse":case"hypnotic":case"lava":case"aurora":e.time=(e.time||0)+.03;break}}render(t,e){switch(t){case"rainbow":this._renderRainbow(e);break;case"matrix":this._renderMatrix(e);break;case"plasma":this._renderPlasma(e);break;case"gradient":this._renderGradient(e);break;case"fire":this._renderFire(e);break;case"water":this._renderWater(e);break;case"stars":this._renderStars(e);break;case"confetti":this._renderConfetti(e);break;case"plasma_wave":this._renderPlasmaWave(e);break;case"radial_pulse":this._renderRadialPulse(e);break;case"hypnotic":this._renderHypnotic(e);break;case"lava":this._renderLava(e);break;case"aurora":this._renderAurora(e);break}}_renderRainbow(t){let{width:e,height:i}=this.renderer,s=t.position||0;for(let o=0;o<e;o++){let n=(s+o/e)%1,[r,a,c]=it(n,1,.6);for(let d=0;d<i;d++)this.renderer.setPixel(o,d,[r,a,c])}}_stepMatrix(t,e,i){let s=t.buffer,o=t.colorMode,n=.15;s.pop();let r=s[0].map(([a,c,d])=>[a*(1-n),c*(1-n),d*(1-n)]);s.unshift(JSON.parse(JSON.stringify(r)));for(let a=0;a<e;a++)Math.random()<.08&&(s[0][a]=[Math.floor(Math.random()*o[0]),Math.floor(Math.random()*o[1]),Math.floor(Math.random()*o[2])])}_renderMatrix(t){var e;let{width:i,height:s}=this.renderer,o=t.buffer;if(o)for(let n=0;n<s;n++)for(let r=0;r<i;r++){let[a,c,d]=((e=o[n])==null?void 0:e[r])||[0,0,0];this.renderer.setPixel(r,n,[a,c,d])}}_renderPlasma(t){let{width:e,height:i}=this.renderer,s=t.time||0,o=e/2,n=i/2;for(let r=0;r<e;r++)for(let a=0;a<i;a++){let c=r-o,d=a-n,h=Math.sqrt(c*c+d*d),f=Math.sin(r/8+s),p=Math.sin(a/6+s*.8),u=Math.sin(h/6-s*1.2),g=Math.sin((r+a)/10+s*.5),b=(f+p+u+g+4)/8,m=Math.sin(b*Math.PI*2)*.5+.5,x=Math.sin(b*Math.PI*2+2)*.5+.5,_=Math.sin(b*Math.PI*2+4)*.5+.5;this.renderer.setPixel(r,a,[m*255,x*255,_*255])}}_renderGradient(t){let{width:e,height:i}=this.renderer,o=(t.time||0)*10;for(let n=0;n<e;n++)for(let r=0;r<i;r++){let a=(Math.sin((n+o)*.05)*.5+.5)*255,c=(Math.cos((r+o)*.05)*.5+.5)*255,d=(Math.sin((n+r+o)*.03)*.5+.5)*255;this.renderer.setPixel(n,r,[a,c,d])}}_createFirePalette(){let t=[];for(let e=0;e<256;e++){let i,s,o;e<64?(i=e*4,s=0,o=0):e<128?(i=255,s=(e-64)*4,o=0):e<192?(i=255,s=255,o=(e-128)*4):(i=255,s=255,o=255),t.push([i,s,o])}return t}_stepFire(t,e,i){let s=t.heat;for(let o=0;o<e*i;o++)s[o]=Math.max(0,s[o]-Math.random()*10);for(let o=0;o<i-1;o++)for(let n=0;n<e;n++){let r=o*e+n,a=(o+1)*e+n,c=o*e+Math.max(0,n-1),d=o*e+Math.min(e-1,n+1);s[r]=(s[a]+s[c]+s[d])/3.05}for(let o=0;o<e;o++)Math.random()<.6&&(s[(i-1)*e+o]=180+Math.random()*75)}_renderFire(t){let{width:e,height:i}=this.renderer,s=t.heat,o=t.palette;for(let n=0;n<i;n++)for(let r=0;r<e;r++){let a=n*e+r,c=Math.floor(Math.min(255,s[a])),[d,h,f]=o[c];this.renderer.setPixel(r,n,[d,h,f])}}_stepWater(t,e,i){let s=t.current,o=t.previous,n=t.damping,r=[...o];for(let a=0;a<s.length;a++)o[a]=s[a];for(let a=1;a<i-1;a++)for(let c=1;c<e-1;c++){let d=a*e+c;s[d]=(r[(a-1)*e+c]+r[(a+1)*e+c]+r[a*e+(c-1)]+r[a*e+(c+1)])/2-s[d],s[d]*=n}if(Math.random()<.1){let a=Math.floor(Math.random()*(e-2))+1,c=Math.floor(Math.random()*(i-2))+1;s[c*e+a]=255}}_renderWater(t){let{width:e,height:i}=this.renderer,s=t.current;for(let o=0;o<i;o++)for(let n=0;n<e;n++){let r=o*e+n,a=Math.abs(s[r]),c=Math.min(255,a*2),d=c>200?c:0,h=c>150?c*.8:c*.3,f=Math.min(255,50+c);this.renderer.setPixel(n,o,[d,h,f])}}_renderStars(t){let{width:e,height:i}=this.renderer;for(let o=0;o<i;o++)for(let n=0;n<e;n++)this.renderer.setPixel(n,o,[5,5,15]);let s=t.stars;for(let o of s){let n=(Math.sin(o.phase)*.5+.5)*255,r=Math.floor(o.x),a=Math.floor(o.y);r>=0&&r<e&&a>=0&&a<i&&this.renderer.setPixel(r,a,[n,n,n*.9])}}_createConfettiParticle(t,e,i){let s=[[255,0,0],[0,255,0],[0,0,255],[255,255,0],[255,0,255],[0,255,255],[255,128,0],[255,192,203]];return{x:Math.random()*t,y:i?Math.random()*e:-2,speed:.2+Math.random()*.3,drift:(Math.random()-.5)*.3,color:s[Math.floor(Math.random()*s.length)],size:1+Math.random(),rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-.5)*.2}}_renderConfetti(t){let{width:e,height:i}=this.renderer;for(let o=0;o<i;o++)for(let n=0;n<e;n++)this.renderer.setPixel(n,o,[10,10,10]);let s=t.particles;for(let o of s){let n=Math.floor(o.x),r=Math.floor(o.y);if(n>=0&&n<e&&r>=0&&r<i){let a=Math.abs(Math.sin(o.rotation))*.5+.5,[c,d,h]=o.color;this.renderer.setPixel(n,r,[c*a,d*a,h*a])}}}_renderPlasmaWave(t){let{width:e,height:i}=this.renderer,s=t.time||0;for(let o=0;o<e;o++)for(let n=0;n<i;n++){let r=o/e,a=n/i,c=Math.sin(r*10+s)+Math.sin(a*10+s)+Math.sin((r+a)*10+s)+Math.sin(Math.sqrt((r-.5)**2+(a-.5)**2)*20-s*2),d=Math.sin(c*Math.PI)*.5+.5,h=Math.sin(c*Math.PI+2.094)*.5+.5,f=Math.sin(c*Math.PI+4.188)*.5+.5;this.renderer.setPixel(o,n,[d*255,h*255,f*255])}}_renderRadialPulse(t){let{width:e,height:i}=this.renderer,s=t.time||0,o=e/2,n=i/2;for(let r=0;r<e;r++)for(let a=0;a<i;a++){let c=r-o,d=a-n,h=Math.sqrt(c*c+d*d),f=Math.sin(h*.8-s*3)*.5+.5,p=Math.sin(s*2)*.3+.7,u=(h/20+s*.5)%1,[g,b,m]=it(u,.8,f*p);this.renderer.setPixel(r,a,[g,b,m])}}_renderHypnotic(t){let{width:e,height:i}=this.renderer,s=t.time||0,o=e/2,n=i/2;for(let r=0;r<e;r++)for(let a=0;a<i;a++){let c=r-o,d=a-n,h=Math.sqrt(c*c+d*d),f=Math.atan2(d,c),u=Math.sin(f*4+h*.5-s*2)*.5+.5,g=u*(Math.sin(s)*.5+.5),b=u*(Math.sin(s+2.094)*.5+.5),m=u*(Math.sin(s+4.188)*.5+.5);this.renderer.setPixel(r,a,[g*255,b*255,m*255])}}_renderLava(t){let{width:e,height:i}=this.renderer,s=t.time||0;for(let o=0;o<e;o++)for(let n=0;n<i;n++){let r=o/e,a=n/i,c=Math.sin(r*8+s*.7)*Math.cos(a*6+s*.5),d=Math.sin(r*12-s*.3)*Math.sin(a*10+s*.8),h=Math.cos((r+a)*5+s),f=(c+d+h+3)/6,p,u,g;f<.3?(p=f*3*100,u=0,g=0):f<.6?(p=100+(f-.3)*3*155,u=(f-.3)*3*100,g=0):(p=255,u=100+(f-.6)*2.5*155,g=(f-.6)*2.5*100),this.renderer.setPixel(o,n,[p,u,g])}}_renderAurora(t){let{width:e,height:i}=this.renderer,s=t.time||0;for(let o=0;o<e;o++)for(let n=0;n<i;n++){let r=o/e,a=n/i,c=Math.sin(r*6+s)*.3,d=Math.sin(r*4-s*.7)*.2,h=Math.sin(r*8+s*1.3)*.15,f=.5+c+d+h,p=Math.abs(a-f),u=Math.max(0,1-p*4),g=Math.pow(u,1.5),b=Math.sin(r*3+s*.5),m=g*(.2+b*.3)*255,x=g*(.8+Math.sin(s+r)*.2)*255,_=g*(.6+b*.4)*255,v=Math.sin(o*127.1+n*311.7)*.5+.5,y=Math.sin(s*3+o+n)*.5+.5;if(v>.98&&u<.3){let S=y*180;m=Math.max(m,S),x=Math.max(x,S),_=Math.max(_,S*.9)}this.renderer.setPixel(o,n,[m,x,_])}}},St=class{constructor(t){this.renderer=t}init(t,e){switch(t){case"color_cycle":e.hue=0;break;case"rainbow_text":e.offset=0;break;case"neon":e.glowIntensity=0,e.direction=1,e.baseColor=e.fgColor||"#ff00ff";break}}step(t,e){switch(t){case"color_cycle":e.hue=(e.hue+.01)%1;break;case"rainbow_text":e.offset=(e.offset+.02)%1;break;case"neon":e.glowIntensity+=e.direction*.05,e.glowIntensity>=1?(e.glowIntensity=1,e.direction=-1):e.glowIntensity<=.3&&(e.glowIntensity=.3,e.direction=1);break}}render(t,e,i){let{width:s,height:o}=this.renderer,n=i||[];for(let r=0;r<o;r++)for(let a=0;a<s;a++){let c=n[r*s+a]||"#111",[d,h,f]=xt(c);if(d>20||h>20||f>20)switch(t){case"color_cycle":{let[u,g,b]=it(e.hue,1,.8),m=(d+h+f)/(3*255);d=u*m,h=g*m,f=b*m;break}case"rainbow_text":{let u=(e.offset+a/s)%1,[g,b,m]=it(u,1,.8),x=(d+h+f)/(3*255);d=g*x,h=b*x,f=m*x;break}case"neon":{let u=xt(e.baseColor||"#ff00ff"),g=e.glowIntensity||.5;if(d=u[0]*g,h=u[1]*g,f=u[2]*g,g>.8){let b=(g-.8)*5;d=d+(255-d)*b*.3,h=h+(255-h)*b*.3,f=f+(255-f)*b*.3}break}}this.renderer.setPixel(a,r,[d,h,f])}}},nt={TEXT:"text",AMBIENT:"ambient",COLOR:"color"},M={fixed:{category:"text",name:"Fixed",description:"Static display"},scroll_ltr:{category:"text",name:"Scroll Left",description:"Text scrolls left to right"},scroll_rtl:{category:"text",name:"Scroll Right",description:"Text scrolls right to left"},blink:{category:"text",name:"Blink",description:"Text blinks on/off"},breeze:{category:"text",name:"Breeze",description:"Gentle wave brightness"},snow:{category:"text",name:"Snow",description:"Sparkle effect"},laser:{category:"text",name:"Laser",description:"Scanning beam"},fade:{category:"text",name:"Fade",description:"Fade in/out"},typewriter:{category:"text",name:"Typewriter",description:"Characters appear one by one"},bounce:{category:"text",name:"Bounce",description:"Text bounces back and forth"},sparkle:{category:"text",name:"Sparkle",description:"Random sparkle overlay"},rainbow:{category:"ambient",name:"Rainbow",description:"HSV rainbow gradient"},matrix:{category:"ambient",name:"Matrix",description:"Digital rain effect"},plasma:{category:"ambient",name:"Plasma",description:"Classic plasma waves"},gradient:{category:"ambient",name:"Gradient",description:"Moving color gradients"},fire:{category:"ambient",name:"Fire",description:"Fire/flame simulation"},water:{category:"ambient",name:"Water",description:"Ripple/wave effect"},stars:{category:"ambient",name:"Stars",description:"Twinkling starfield"},confetti:{category:"ambient",name:"Confetti",description:"Falling colored particles"},plasma_wave:{category:"ambient",name:"Plasma Wave",description:"Multi-frequency sine waves"},radial_pulse:{category:"ambient",name:"Radial Pulse",description:"Expanding ring patterns"},hypnotic:{category:"ambient",name:"Hypnotic",description:"Spiral pattern"},lava:{category:"ambient",name:"Lava",description:"Flowing lava/magma"},aurora:{category:"ambient",name:"Aurora",description:"Northern lights"},color_cycle:{category:"color",name:"Color Cycle",description:"Cycle through colors"},rainbow_text:{category:"color",name:"Rainbow Text",description:"Rainbow gradient on text"},neon:{category:"color",name:"Neon",description:"Pulsing neon glow"}},st=class{constructor(t){this.renderer=t,this.textEffects=new yt(t),this.ambientEffects=new wt(t),this.colorEffects=new St(t),this.currentEffect="fixed",this.effectState={tick:0}}getEffectInfo(t){return M[t]||M.fixed}getEffectsByCategory(t){return Object.entries(M).filter(([,e])=>e.category===t).map(([e,i])=>({key:e,...i}))}initEffect(t,e={}){let i=this.getEffectInfo(t);switch(this.currentEffect=t,this.effectState={tick:0,...e},i.category){case"text":this.textEffects.init(t,this.effectState);break;case"ambient":this.ambientEffects.init(t,this.effectState);break;case"color":this.colorEffects.init(t,this.effectState);break}return this.effectState}step(){let t=this.getEffectInfo(this.currentEffect);switch(this.effectState.tick=(this.effectState.tick||0)+1,t.category){case"text":this.textEffects.step(this.currentEffect,this.effectState);break;case"ambient":this.ambientEffects.step(this.currentEffect,this.effectState);break;case"color":this.colorEffects.step(this.currentEffect,this.effectState);break}}render(t,e,i){switch(this.getEffectInfo(this.currentEffect).category){case"ambient":this.ambientEffects.render(this.currentEffect,this.effectState);break;case"text":this.textEffects.render(this.currentEffect,this.effectState,t,e,i);break;case"color":this.colorEffects.render(this.currentEffect,this.effectState,t);break}}isAmbient(t){return this.getEffectInfo(t).category==="ambient"}needsAnimation(t){return t!=="fixed"}},Xe=Object.entries(M).filter(([,l])=>l.category==="text").map(([l])=>l),je=Object.entries(M).filter(([,l])=>l.category==="ambient").map(([l])=>l),We=Object.entries(M).filter(([,l])=>l.category==="color").map(([l])=>l),Ue=Object.keys(M),X=class{constructor(t,e={}){this.container=t,this.width=e.width||64,this.height=e.height||16,this.pixelGap=e.pixelGap||.15,this.glowEnabled=e.glow!==!1,this.scale=e.scale||8,this.buffer=[],this._initBuffer(),this._colorPixels=[],this._extendedColorPixels=[],this.extendedWidth=this.width,this.effect="fixed",this.speed=50,this.animationId=null,this.lastFrameTime=0,this._isRunning=!1,this._canvas=null,this._ctx=null,this._imageData=null,this._glowCanvas=null,this._glowCtx=null,this._wrapper=null,this._canvasCreated=!1,this._pixelTemplate=null,this.effectManager=new st(this)}_initBuffer(){this.buffer=[];for(let t=0;t<this.width*this.height;t++)this.buffer.push([0,0,0])}_createCanvas(){if(typeof document>"u")return;let t=this.width*this.scale,e=this.height*this.scale;this._wrapper=document.createElement("div"),this._wrapper.style.cssText=`
      position: relative;
      width: 100%;
      aspect-ratio: ${this.width} / ${this.height};
      background: #0a0a0a;
      border-radius: 4px;
      overflow: hidden;
    `,this.glowEnabled&&(this._glowCanvas=document.createElement("canvas"),this._glowCanvas.width=t,this._glowCanvas.height=e,this._glowCanvas.style.cssText=`
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        filter: blur(${this.scale*.6}px); opacity: 0.5;
      `,this._glowCtx=this._glowCanvas.getContext("2d",{alpha:!1}),this._wrapper.appendChild(this._glowCanvas)),this._canvas=document.createElement("canvas"),this._canvas.width=t,this._canvas.height=e,this._canvas.style.cssText=`
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      image-rendering: pixelated; image-rendering: crisp-edges;
    `,this._ctx=this._canvas.getContext("2d",{alpha:!1}),this._wrapper.appendChild(this._canvas),this._imageData=this._ctx.createImageData(t,e),this._createPixelTemplate(),this._fillBackground(),this.container&&this.container.isConnected!==!1&&(this.container.innerHTML="",this.container.appendChild(this._wrapper)),this._canvasCreated=!0}_createPixelTemplate(){let t=this.scale,e=Math.max(1,Math.floor(t*this.pixelGap)),i=t-e,s=Math.max(1,Math.floor(t*.15));this._pixelTemplate=[];for(let o=0;o<t;o++)for(let n=0;n<t;n++){let r=!1;if(n<i&&o<i)if(n<s&&o<s){let a=s-n,c=s-o;r=a*a+c*c<=s*s}else if(n>=i-s&&o<s){let a=n-(i-s-1),c=s-o;r=a*a+c*c<=s*s}else if(n<s&&o>=i-s){let a=s-n,c=o-(i-s-1);r=a*a+c*c<=s*s}else if(n>=i-s&&o>=i-s){let a=n-(i-s-1),c=o-(i-s-1);r=a*a+c*c<=s*s}else r=!0;this._pixelTemplate.push(r)}}_fillBackground(){if(!this._imageData)return;let t=this._imageData.data,e=10,i=10,s=10;for(let o=0;o<t.length;o+=4)t[o]=e,t[o+1]=i,t[o+2]=s,t[o+3]=255}_ensureCanvasInContainer(){return this.container?this._wrapper&&this._wrapper.parentNode===this.container?!0:this._wrapper&&this.container.isConnected!==!1?(this.container.innerHTML="",this.container.appendChild(this._wrapper),!0):!1:!1}setPixel(t,e,i){if(t>=0&&t<this.width&&e>=0&&e<this.height){let s=e*this.width+t;s<this.buffer.length&&(this.buffer[s]=i)}}clear(){for(let t=0;t<this.buffer.length;t++)this.buffer[t]=[0,0,0]}flush(){if(this._canvasCreated?this._ensureCanvasInContainer()||this._createCanvas():this._createCanvas(),!this._imageData||!this._ctx||!this._pixelTemplate)return;let t=this._imageData.data,e=this.scale,i=this.width*e,s=this._pixelTemplate,o=10,n=10,r=10;for(let a=0;a<this.height;a++)for(let c=0;c<this.width;c++){let d=a*this.width+c,h=this.buffer[d];if(!h||!Array.isArray(h))continue;let f=Math.round(h[0]),p=Math.round(h[1]),u=Math.round(h[2]),g=c*e,b=a*e;for(let m=0;m<e;m++)for(let x=0;x<e;x++){let _=m*e+x,v=((b+m)*i+(g+x))*4;s[_]?(t[v]=f,t[v+1]=p,t[v+2]=u,t[v+3]=255):(t[v]=o,t[v+1]=n,t[v+2]=r,t[v+3]=255)}}this._ctx.putImageData(this._imageData,0,0),this.glowEnabled&&this._glowCtx&&this._glowCtx.drawImage(this._canvas,0,0)}setData(t,e=null,i=null){this._colorPixels=t||[],e?(this._extendedColorPixels=e,this.extendedWidth=i||this.width):(this._extendedColorPixels=t||[],this.extendedWidth=this.width)}setEffect(t,e=50){let i=this._isRunning;this.effect!==t&&(this.effect=t,this.effectManager.initEffect(t,{speed:e})),this.speed=e,i&&t!=="fixed"&&this.start()}start(){this._isRunning||(this._isRunning=!0,this.lastFrameTime=performance.now(),this._animate())}stop(){this._isRunning=!1,this.animationId&&(cancelAnimationFrame(this.animationId),this.animationId=null)}get isRunning(){return this._isRunning}_animate(){if(!this._isRunning)return;let t=performance.now(),e=500-(this.speed-1)*4.7;t-this.lastFrameTime>=e&&(this.lastFrameTime=t,this.effectManager.step()),this._renderFrame(),this.animationId=requestAnimationFrame(()=>this._animate())}_renderFrame(){this.effectManager.render(this._colorPixels,this._extendedColorPixels,this.extendedWidth),this.flush()}renderStatic(){this._canvasCreated||this._createCanvas(),this._renderFrame()}setDimensions(t,e){(t!==this.width||e!==this.height)&&(this.width=t,this.height=e,this.extendedWidth=t,this._initBuffer(),this._canvasCreated=!1,this.effectManager=new st(this),this.effect!=="fixed"&&this.effectManager.initEffect(this.effect,{speed:this.speed}))}setContainer(t){t!==this.container&&(this.container=t,this._wrapper&&t&&(t.innerHTML="",t.appendChild(this._wrapper)))}destroy(){this.stop(),this._canvas=null,this._ctx=null,this._imageData=null,this._glowCanvas=null,this._glowCtx=null,this._wrapper=null,this._canvasCreated=!1,this._pixelTemplate=null}};var ot={A:[124,18,17,18,124],B:[127,73,73,73,54],C:[62,65,65,65,34],D:[127,65,65,34,28],E:[127,73,73,73,65],F:[127,9,9,9,1],G:[62,65,73,73,122],H:[127,8,8,8,127],I:[0,65,127,65,0],J:[32,64,65,63,1],K:[127,8,20,34,65],L:[127,64,64,64,64],M:[127,2,12,2,127],N:[127,4,8,16,127],O:[62,65,65,65,62],P:[127,9,9,9,6],Q:[62,65,81,33,94],R:[127,9,25,41,70],S:[70,73,73,73,49],T:[1,1,127,1,1],U:[63,64,64,64,63],V:[31,32,64,32,31],W:[63,64,56,64,63],X:[99,20,8,20,99],Y:[7,8,112,8,7],Z:[97,81,73,69,67],a:[32,84,84,84,120],b:[127,72,68,68,56],c:[56,68,68,68,32],d:[56,68,68,72,127],e:[56,84,84,84,24],f:[8,126,9,1,2],g:[12,82,82,82,62],h:[127,8,4,4,120],i:[0,68,125,64,0],j:[32,64,68,61,0],k:[127,16,40,68,0],l:[0,65,127,64,0],m:[124,4,24,4,120],n:[124,8,4,4,120],o:[56,68,68,68,56],p:[124,20,20,20,8],q:[8,20,20,24,124],r:[124,8,4,4,8],s:[72,84,84,84,32],t:[4,63,68,64,32],u:[60,64,64,32,124],v:[28,32,64,32,28],w:[60,64,48,64,60],x:[68,40,16,40,68],y:[12,80,80,80,60],z:[68,100,84,76,68],0:[62,81,73,69,62],1:[0,66,127,64,0],2:[66,97,81,73,70],3:[33,65,69,75,49],4:[24,20,18,127,16],5:[39,69,69,69,57],6:[60,74,73,73,48],7:[1,113,9,5,3],8:[54,73,73,73,54],9:[6,73,73,41,30]," ":[0,0,0,0,0],".":[0,96,96,0,0],",":[0,128,96,0,0],":":[0,54,54,0,0],";":[0,128,54,0,0],"!":[0,0,95,0,0],"?":[2,1,81,9,6],"-":[8,8,8,8,8],"+":[8,8,62,8,8],"=":[20,20,20,20,20],_:[64,64,64,64,64],"/":[32,16,8,4,2],"\\":[2,4,8,16,32],"(":[0,28,34,65,0],")":[0,65,34,28,0],"[":[0,127,65,65,0],"]":[0,65,65,127,0],"<":[8,20,34,65,0],">":[0,65,34,20,8],"*":[20,8,62,8,20],"#":[20,127,20,127,20],"@":[62,65,93,85,30],"&":[54,73,85,34,80],"%":[35,19,8,100,98],$:[18,42,127,42,36],"'":[0,0,7,0,0],'"':[0,7,0,7,0],"`":[0,1,2,0,0],"^":[4,2,1,2,4],"~":[8,4,8,16,8]};function Ht(l,t,e,i="#ff6600",s="#111"){let o=[],a=Math.floor((e-7)/2);for(let f=0;f<e;f++)for(let p=0;p<t;p++)o.push(s);let c=l.length*6-1,h=Math.max(1,Math.floor((t-c)/2));for(let f of l){let p=ot[f]||ot[" "];for(let u=0;u<5;u++)for(let g=0;g<7;g++){let b=p[u]>>g&1,m=h+u,x=a+g;m>=0&&m<t&&x<e&&x>=0&&(o[x*t+m]=b?i:s)}h+=6}return o}function Nt(l,t,e,i="#ff6600",s="#111"){let r=Math.floor((e-7)/2),a=l.length*6,c=t+a+t,d=[];for(let f=0;f<e;f++)for(let p=0;p<c;p++)d.push(s);let h=t;for(let f of l){let p=ot[f]||ot[" "];for(let u=0;u<5;u++)for(let g=0;g<7;g++){let b=p[u]>>g&1,m=h+u,x=r+g;m>=0&&m<c&&x<e&&x>=0&&(d[x*c+m]=b?i:s)}h+=6}return{pixels:d,width:c}}var Gt={VCR_OSD_MONO:{16:{font_size:16,offset:[0,0],pixel_threshold:70,var_width:!0},24:{font_size:24,offset:[0,0],pixel_threshold:70,var_width:!0},32:{font_size:28,offset:[-1,2],pixel_threshold:30,var_width:!1}},CUSONG:{16:{font_size:16,offset:[0,-1],pixel_threshold:70,var_width:!1},24:{font_size:24,offset:[0,0],pixel_threshold:70,var_width:!1},32:{font_size:32,offset:[0,0],pixel_threshold:70,var_width:!1}}},et={},_t={},qe=l=>typeof window>"u"?`/fonts/${l}.ttf`:`${window.location.pathname.substring(0,window.location.pathname.lastIndexOf("/")+1)}fonts/${l}.ttf`,be=qe;function Bt(l){be=l}function at(l){return l<=18?16:l<=28?24:32}async function J(l,t){return et[l]===!0?!0:et[l]===!1?!1:(l in _t||(_t[l]=(async()=>{if(typeof document>"u")return!1;let i=(t||be)(l);try{let o=await new FontFace(l,`url(${i})`).load();return document.fonts.add(o),et[l]=!0,!0}catch(s){return console.warn(`PixelDisplay: Failed to load font ${l}:`,s),et[l]=!1,!1}})()),_t[l])}function rt(l){return et[l]===!0}function Vt(l,t,e,i="#ff6600",s="#111",o="VCR_OSD_MONO"){if(typeof document>"u")return null;let n=Gt[o];if(!n)return null;if(!rt(o))return J(o),null;let r=at(e),a=n[r],c=document.createElement("canvas");c.width=t,c.height=e;let d=c.getContext("2d");if(!d)return null;if(d.imageSmoothingEnabled=!1,d.fillStyle=s,d.fillRect(0,0,t,e),!l||l.trim()===""){let m=[];for(let x=0;x<t*e;x++)m.push(s);return m}d.font=`${a.font_size}px "${o}"`,d.fillStyle=i,d.textBaseline="top";let f=d.measureText(l).width,p=Math.floor((t-f)/2)+a.offset[0],u=Math.floor((e-a.font_size)/2)+a.offset[1];d.fillText(l,p,u);let g=d.getImageData(0,0,t,e),b=[];for(let m=0;m<g.data.length;m+=4){let x=g.data[m],_=g.data[m+1],v=g.data[m+2],y=(x+_+v)/3;b.push(y>=a.pixel_threshold?i:s)}return b}function Xt(l,t,e,i="#ff6600",s="#111",o="VCR_OSD_MONO"){if(typeof document>"u")return null;let n=Gt[o];if(!n)return null;if(!rt(o))return J(o),null;let r=at(e),a=n[r],d=document.createElement("canvas").getContext("2d");if(!d)return null;d.font=`${a.font_size}px "${o}"`;let h=Math.ceil(d.measureText(l).width),f=t+h+t,p=document.createElement("canvas");p.width=f,p.height=e;let u=p.getContext("2d");if(!u)return null;if(u.imageSmoothingEnabled=!1,u.fillStyle=s,u.fillRect(0,0,f,e),!l||l.trim()===""){let _=[];for(let v=0;v<f*e;v++)_.push(s);return{pixels:_,width:f}}u.font=`${a.font_size}px "${o}"`,u.fillStyle=i,u.textBaseline="top";let g=t+a.offset[0],b=Math.floor((e-a.font_size)/2)+a.offset[1];u.fillText(l,g,b);let m=u.getImageData(0,0,f,e),x=[];for(let _=0;_<m.data.length;_+=4){let v=m.data[_],y=m.data[_+1],S=m.data[_+2],w=(v+y+S)/3;x.push(w>=a.pixel_threshold?i:s)}return{pixels:x,width:f}}var Et=null,Ct=null;async function Ye(){if(Et&&Ct)return!0;try{let l=await Promise.resolve().then(()=>(ue(),pe)),t=await Promise.resolve().then(()=>(me(),ge));Et=l.$Font;let e=t;return Ct=e.default||e.$fetchline||t,!0}catch{return console.warn("PixelDisplay: bdfparser/fetchline packages not available. BDF font rendering disabled."),!1}}var _e={VCR_OSD_MONO:{16:{file:"VCR_OSD_MONO_16.bdf",yOffset:0},24:{file:"VCR_OSD_MONO_24.bdf",yOffset:0},32:{file:"VCR_OSD_MONO_32.bdf",yOffset:2}},CUSONG:{16:{file:"CUSONG_16.bdf",yOffset:-1},24:{file:"CUSONG_24.bdf",yOffset:0},32:{file:"CUSONG_32.bdf",yOffset:0}}},Y=new Map,vt=new Map,Je=(l,t)=>typeof window>"u"?`/fonts/${t||l}`:`${window.location.pathname.substring(0,window.location.pathname.lastIndexOf("/")+1)}fonts/${t||l}`,ve=Je;function zt(l){ve=l}function xe(l){return l<=18?16:l<=28?24:32}async function D(l,t=16,e){let i=`${l}_${t}`;if(Y.has(i))return Y.get(i);if(vt.has(i))return vt.get(i);let s=_e[l];if(!s||!s[t])return console.warn(`PixelDisplay BDF: No config for font ${l} at height ${t}`),null;let o=s[t],n=(async()=>{try{if(!await Ye()||!Et||!Ct)return null;let c=(e||ve)(l,o.file),h={font:await Et(Ct(c)),config:o};return Y.set(i,h),h}catch(r){return console.warn(`PixelDisplay BDF: Failed to load font ${l} (${t}px):`,r),vt.delete(i),null}})();return vt.set(i,n),n}function jt(l,t=16){let e=`${l}_${t}`;return Y.has(e)}function Wt(l,t,e,i="#ff6600",s="#111",o="VCR_OSD_MONO"){let n=xe(e),r=`${o}_${n}`,a=Y.get(r);if(!a)return D(o,n),null;let{font:c,config:d}=a,h=new Array(t*e).fill(s);if(!l||l.trim()==="")return h;try{let f=c.draw(l,{direction:"lrtb",mode:1}),p=f.bindata,u=f.width(),g=f.height(),b=Math.floor((t-u)/2),m=Math.floor((e-g)/2)+(d.yOffset||0);for(let x=0;x<g;x++){let _=p[x]||"";for(let v=0;v<_.length;v++){let y=b+v,S=m+x;if(y>=0&&y<t&&S>=0&&S<e){let w=S*t+y;h[w]=_[v]==="1"?i:s}}}}catch(f){return console.warn("PixelDisplay BDF: Error rendering text:",f),null}return h}function Ut(l,t,e,i="#ff6600",s="#111",o="VCR_OSD_MONO"){let n=xe(e),r=`${o}_${n}`,a=Y.get(r);if(!a)return D(o,n),null;let{font:c,config:d}=a;if(!l||l.trim()===""){let h=t*3;return{pixels:new Array(h*e).fill(s),width:h}}try{let h=c.draw(l,{direction:"lrtb",mode:1}),f=h.bindata,p=h.width(),u=h.height(),g=t+p+t,b=new Array(g*e).fill(s),m=t,x=Math.floor((e-u)/2)+(d.yOffset||0);for(let _=0;_<u;_++){let v=f[_]||"";for(let y=0;y<v.length;y++){let S=m+y,w=x+_;if(S>=0&&S<g&&w>=0&&w<e){let T=w*g+S;b[T]=v[y]==="1"?i:s}}}return{pixels:b,width:g}}catch(h){return console.warn("PixelDisplay BDF: Error rendering scroll text:",h),null}}function It(l){if(l.baseUrl){let t=l.baseUrl.replace(/\/+$/,"");Bt(e=>`${t}/${e}.ttf`),zt((e,i)=>`${t}/${i||e}`)}l.ttfResolver&&Bt(l.ttfResolver),l.bdfResolver&&zt(l.bdfResolver)}var Ke=typeof window<"u"&&(typeof window.hassConnection<"u"||document.querySelector("home-assistant")!==null);if(Ke)It({ttfResolver:l=>`/hacsfiles/ipixel_color/fonts/${l}.ttf`,bdfResolver:(l,t)=>`/hacsfiles/ipixel_color/fonts/${t||l}`});else if(typeof window<"u"){let l=window.location.pathname.substring(0,window.location.pathname.lastIndexOf("/")+1);It({baseUrl:`${l}fonts`})}var Tt=new Map,kt=class extends O{constructor(){super(),this._renderer=null,this._displayContainer=null,this._lastState=null,this._cachedResolution=null,this._rendererId=null,this._handleDisplayUpdate=t=>{this._updateDisplay(t.detail)},window.addEventListener("ipixel-display-update",this._handleDisplayUpdate)}connectedCallback(){this._rendererId||(this._rendererId=`renderer_${Date.now()}_${Math.random().toString(36).substr(2,9)}`),Tt.has(this._rendererId)&&(this._renderer=Tt.get(this._rendererId)),D("VCR_OSD_MONO",16).then(()=>{this._lastState&&this._updateDisplay(this._lastState)}),D("VCR_OSD_MONO",24),D("VCR_OSD_MONO",32),D("CUSONG",16),D("CUSONG",24),D("CUSONG",32),J("VCR_OSD_MONO"),J("CUSONG")}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("ipixel-display-update",this._handleDisplayUpdate),this._renderer&&this._rendererId&&(this._renderer.stop(),Tt.set(this._rendererId,this._renderer))}_getResolutionCached(){let[t,e]=this.getResolution();if(t>0&&e>0){this._cachedResolution=[t,e];try{localStorage.setItem("iPIXEL_Resolution",JSON.stringify([t,e]))}catch{}return this._cachedResolution}try{let i=localStorage.getItem("iPIXEL_Resolution");if(i){let s=JSON.parse(i);if(Array.isArray(s)&&s.length===2&&s[0]>0&&s[1]>0)return this._cachedResolution=s,s}}catch{}return this._cachedResolution?this._cachedResolution:this._config?.width&&this._config?.height?[this._config.width,this._config.height]:[t||64,e||16]}_updateDisplay(t){if(!this._displayContainer)return;let[e,i]=this._getResolutionCached(),s=this.isOn();if(this._renderer?(this._renderer.setContainer(this._displayContainer),(this._renderer.width!==e||this._renderer.height!==i)&&this._renderer.setDimensions(e,i)):(this._renderer=new X(this._displayContainer,{width:e,height:i}),this._rendererId&&Tt.set(this._rendererId,this._renderer)),!s){this._renderer.setData([]),this._renderer.setEffect("fixed",50),this._renderer.stop(),this._renderer.renderStatic();return}let o=t?.text||"",n=t?.effect||"fixed",r=t?.speed||50,a=t?.fgColor||"#ff6600",c=t?.bgColor||"#111",d=t?.mode||"text",h=t?.font||"VCR_OSD_MONO";this._lastState=t;let f=o,p=a;if(d==="clock"?(f=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!1}),p="#00ff88"):d==="gif"?(f="GIF",p="#ff44ff"):d==="rhythm"&&(f="***",p="#44aaff"),M[n]?.category==="ambient")this._renderer.setData([],[],e);else{let b=at(i),m=h!=="LEGACY"&&jt(h,b),x=h!=="LEGACY"&&rt(h),_=(w,T,E,I,C)=>{if(m){let L=Wt(w,T,E,I,C,h);if(L)return L}if(x){let L=Vt(w,T,E,I,C,h);if(L)return L}return Ht(w,T,E,I,C)},v=(w,T,E,I,C)=>{if(m){let L=Ut(w,T,E,I,C,h);if(L)return L}if(x){let L=Xt(w,T,E,I,C,h);if(L)return L}return Nt(w,T,E,I,C)},y=x?f.length*10:f.length*6;if((n==="scroll_ltr"||n==="scroll_rtl"||n==="bounce")&&y>e){let w=v(f,e,i,p,c),T=_(f,e,i,p,c);this._renderer.setData(T,w.pixels,w.width)}else{let w=_(f,e,i,p,c);this._renderer.setData(w)}}this._renderer.setEffect(n,r),n==="fixed"?(this._renderer.stop(),this._renderer.renderStatic()):this._renderer.start()}_getTestModeState(){let t=[{text:"iPIXEL",effect:"scroll_ltr",speed:40,fgColor:"#ff6600",bgColor:"#000000",mode:"text",font:"VCR_OSD_MONO"},{text:"Hello!",effect:"rainbow_cycle",speed:50,fgColor:"#00ff88",bgColor:"#000000",mode:"text",font:"VCR_OSD_MONO"},{text:"TEST",effect:"fixed",speed:50,fgColor:"#03a9f4",bgColor:"#111111",mode:"text",font:"VCR_OSD_MONO"},{text:"",effect:"rainbow",speed:60,fgColor:"#ffffff",bgColor:"#000000",mode:"ambient",font:"VCR_OSD_MONO"}],e=Math.floor(Date.now()/1e4)%t.length;return t[e]}render(){let t=this.isInTestMode();if(!this._hass&&!t)return;let[e,i]=this._getResolutionCached(),s=this.isOn(),o=this._config.name||this.getEntity()?.attributes?.friendly_name||"iPIXEL Display",n=gt(),a=this.getEntity()?.state||"",d=this.getRelatedEntity("select","_mode")?.state||n.mode||"text",h=n.text||a||(t?"iPIXEL":""),f=n.effect||"fixed",p=n.speed||50,u=n.fgColor||"#ff6600",g=n.bgColor||"#111",b=n.font||"VCR_OSD_MONO",x=M[f]?.category==="ambient",_=he(),v=U(),y="";if(t){let I=_.length>0?`<div class="test-mode-features">Missing: ${_.join(", ")}</div>`:"";y=`
        <div class="test-mode-banner">
          <div class="test-mode-header">
            <span class="test-mode-label">Test Mode</span>
            <button class="test-mode-toggle ${v?"active":""}" id="test-mode-toggle">
              ${v?"ON":"OFF"}
            </button>
          </div>
          <div class="test-mode-desc">Preview display without a device</div>
          ${I}
        </div>`}else y=`
        <div class="test-mode-hint">
          <button class="test-mode-hint-btn" id="test-mode-toggle" title="Enable test mode for preview without a device">
            <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15Z"/></svg>
            Test
          </button>
        </div>`;let S=Object.entries(M).filter(([I,C])=>C.category==="text").map(([I,C])=>`<option value="${I}">${C.name}</option>`).join(""),w=Object.entries(M).filter(([I,C])=>C.category==="ambient").map(([I,C])=>`<option value="${I}">${C.name}</option>`).join(""),T=Object.entries(M).filter(([I,C])=>C.category==="color").map(([I,C])=>`<option value="${I}">${C.name}</option>`).join("");this.shadowRoot.innerHTML=`
      <style>${A}
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
        .test-mode-banner {
          background: linear-gradient(135deg, rgba(255,152,0,0.15), rgba(255,87,34,0.1));
          border: 1px solid rgba(255,152,0,0.3);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 12px;
        }
        .test-mode-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .test-mode-label {
          font-size: 0.85em;
          font-weight: 600;
          color: #ff9800;
        }
        .test-mode-toggle {
          padding: 3px 10px;
          border: 1px solid rgba(255,152,0,0.4);
          border-radius: 12px;
          background: rgba(255,152,0,0.1);
          color: #ff9800;
          cursor: pointer;
          font-size: 0.75em;
          font-weight: 600;
          transition: all 0.2s;
        }
        .test-mode-toggle.active {
          background: #ff9800;
          color: #000;
        }
        .test-mode-desc {
          font-size: 0.75em;
          opacity: 0.7;
        }
        .test-mode-features {
          font-size: 0.7em;
          opacity: 0.6;
          margin-top: 4px;
          font-style: italic;
        }
        .test-mode-hint {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }
        .test-mode-hint-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border: 1px solid rgba(255,152,0,0.3);
          border-radius: 10px;
          background: rgba(255,152,0,0.08);
          color: #ff9800;
          cursor: pointer;
          font-size: 0.75em;
          opacity: 0.85;
          transition: opacity 0.2s, background 0.2s;
          -webkit-tap-highlight-color: rgba(255,152,0,0.2);
        }
        .test-mode-hint-btn:hover,
        .test-mode-hint-btn:active { opacity: 1; background: rgba(255,152,0,0.15); }
        .test-mode-badge {
          background: rgba(255,152,0,0.2);
          color: #ff9800;
          padding: 2px 6px;
          border-radius: 3px;
          margin-left: 4px;
          font-size: 0.75em;
        }
        .demo-controls {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .demo-btn {
          padding: 5px 10px;
          border: 1px solid rgba(255,152,0,0.3);
          border-radius: 6px;
          background: rgba(255,152,0,0.08);
          color: inherit;
          cursor: pointer;
          font-size: 0.75em;
          transition: all 0.2s;
        }
        .demo-btn:hover { background: rgba(255,152,0,0.2); }
        .demo-btn.active { background: rgba(255,152,0,0.25); border-color: #ff9800; }
      </style>
      <ha-card>
        <div class="card-content">
          ${y}
          <div class="card-header">
            <div class="card-title">
              <span class="status-dot ${s?"":"off"}"></span>
              ${o}
              ${t?'<span class="test-mode-badge">Demo</span>':""}
            </div>
            <button class="icon-btn ${s?"active":""}" id="power-btn">
              <svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>
            </button>
          </div>
          <div class="display-container">
            <div class="display-screen" id="display-screen"></div>
            <div class="display-footer">
              <span>${e} x ${i}</span>
              <span>
                <span class="mode-badge">${s?d:"Off"}</span>
                ${s&&f!=="fixed"?`<span class="effect-badge">${M[f]?.name||f}</span>`:""}
              </span>
            </div>
          </div>
          ${t?`
          <div class="demo-controls">
            <button class="demo-btn" data-demo="text">Text</button>
            <button class="demo-btn" data-demo="scroll">Scroll</button>
            <button class="demo-btn" data-demo="rainbow">Rainbow</button>
            <button class="demo-btn" data-demo="clock">Clock</button>
            <button class="demo-btn" data-demo="fire">Fire</button>
            <button class="demo-btn" data-demo="stars">Stars</button>
          </div>`:""}
        </div>
      </ha-card>`,this._displayContainer=this.shadowRoot.getElementById("display-screen");let E=t&&!n.text&&n.effect==="fixed"?this._getTestModeState():{text:h,effect:f,speed:p,fgColor:u,bgColor:g,mode:d,font:b};this._updateDisplay(E),this._attachPowerButton(),this._attachTestModeListeners()}_attachPowerButton(){this.shadowRoot.getElementById("power-btn")?.addEventListener("click",()=>{if(this.isInTestMode()){this._testPowerState=!this._testPowerState,this.render();return}let t=this._switchEntityId;if(!t){let e=this.getRelatedEntity("switch");e&&(this._switchEntityId=e.entity_id,t=e.entity_id)}if(t&&this._hass?.states[t])this._hass.callService("switch","toggle",{entity_id:t});else{let e=Object.keys(this._hass?.states||{}).filter(o=>o.startsWith("switch.")),i=this._config.entity?.replace(/^[^.]+\./,"").replace(/_?(text|display|gif_url)$/i,"")||"",s=e.find(o=>o.includes(i.substring(0,10)));s?(this._switchEntityId=s,this._hass.callService("switch","toggle",{entity_id:s})):console.warn("iPIXEL: No switch found. Entity:",this._config.entity,"Available:",e)}})}_attachTestModeListeners(){this.shadowRoot.getElementById("test-mode-toggle")?.addEventListener("click",()=>{de(!U())}),this.shadowRoot.querySelectorAll("[data-demo]").forEach(t=>{t.addEventListener("click",e=>{let i=e.currentTarget.dataset.demo,o={text:{text:"iPIXEL",effect:"fixed",speed:50,fgColor:"#ff6600",bgColor:"#000000",mode:"text",font:"VCR_OSD_MONO"},scroll:{text:"Hello World!",effect:"scroll_ltr",speed:40,fgColor:"#00ff88",bgColor:"#000000",mode:"text",font:"VCR_OSD_MONO"},rainbow:{text:"",effect:"rainbow",speed:60,fgColor:"#ffffff",bgColor:"#000000",mode:"ambient",font:"VCR_OSD_MONO"},clock:{text:"",effect:"fixed",speed:50,fgColor:"#00ff88",bgColor:"#000000",mode:"clock",font:"VCR_OSD_MONO"},fire:{text:"",effect:"fire",speed:50,fgColor:"#ffffff",bgColor:"#000000",mode:"ambient",font:"VCR_OSD_MONO"},stars:{text:"",effect:"stars",speed:40,fgColor:"#ffffff",bgColor:"#000000",mode:"ambient",font:"VCR_OSD_MONO"}}[i];o&&(k(o),this.shadowRoot.querySelectorAll("[data-demo]").forEach(n=>n.classList.remove("active")),e.currentTarget.classList.add("active"))})})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};function K({id:l,min:t=0,max:e=100,value:i=50,unit:s="",showValue:o=!0,valueFormatter:n}){let r=(i-t)/(e-t)*100,a=n?n(i):`${i}${s}`;return`
    <div class="slider-row">
      <input type="range" class="slider" id="${l}" min="${t}" max="${e}" value="${i}" style="--value:${r}%">
      ${o?`<span class="slider-value" id="${l}-val">${a}</span>`:""}
    </div>`}function Z(l,t,{onInput:e,onChange:i,unit:s="",valueFormatter:o}={}){let n=l.getElementById(t);if(!n)return;let r=l.getElementById(`${t}-val`),a=Number(n.min),c=Number(n.max),d=h=>{let f=Number(h),p=c>a?(f-a)/(c-a)*100:0;return n.style.setProperty("--value",`${p}%`),r&&(r.textContent=o?o(f):`${f}${s}`),f};d(n.value),n.addEventListener("input",h=>{let f=d(h.target.value);e?.(f,h)}),i&&n.addEventListener("change",h=>i(Number(h.target.value),h))}function $(l,{selected:t,itemClass:e="mode-btn",gridClass:i="button-grid button-grid-3",dataAttr:s="value",label:o=c=>c.name,value:n=c=>c.value,extraClass:r=()=>"",title:a}={}){let c=Array.isArray(t)?h=>t.some(f=>String(f)===String(h)):h=>String(h)===String(t),d=l.map(h=>{let f=n(h),p=c(f)?" active":"",u=r(h),g=u?` ${u}`:"",b=a?` title="${a(h)}"`:"";return`<button class="${e}${p}${g}" data-${s}="${f}"${b}>${o(h)}</button>`}).join("");return`<div class="${i}">${d}</div>`}function P(l,t,{onSelect:e,multi:i=!1,attr:s="value"}={}){l.querySelectorAll(t).forEach(o=>{o.addEventListener("click",n=>{let r=n.currentTarget,a=r.dataset[s];if(i){let c=r.classList.toggle("active");e?.(a,c,r)}else l.querySelectorAll(t).forEach(c=>c.classList.remove("active")),r.classList.add("active"),e?.(a,r)})})}function qt(l){return`<div class="color-row">${l.map((e,i)=>`<span class="color-row-label"${i>0?' style="margin-left:16px;"':""}>${e.label}:</span>
      <input type="color" class="color-picker" id="${e.id}" value="${e.value}">`).join("")}</div>`}function Yt(l,t,e){t.forEach(i=>{l.getElementById(i)?.addEventListener("input",s=>e?.(i,s.target.value,s))})}function B({id:l,active:t=!1,label:e,labelRight:i=!1,padding:s}={}){let o=e?`<span class="toggle-label">${e}</span>`:"";return`
    <div class="toggle-row"${s?` style="padding:${s};"`:""}>
      ${i?"":o}
      <div class="toggle-switch${t?" active":""}" id="${l}"></div>
      ${i?o:""}
    </div>`}function z(l,t,e){let i=l.getElementById(t);i&&i.addEventListener("click",s=>{let o=!s.currentTarget.classList.contains("active");s.currentTarget.classList.toggle("active",o),e?.(o,s)})}function H(l,t){return`<div class="tabs">${l.map(i=>`<button class="${i.id===t?"tab active":"tab"}" data-tab="${i.id}">${i.label}</button>`).join("")}</div>`}function N(l,t){l.querySelectorAll("[data-tab]").forEach(e=>{e.addEventListener("click",i=>{let s=i.currentTarget.dataset.tab;t?.(s,i)})})}function R(l,t,e){return`<div class="tab-panel${t?" active":""}" id="panel-${l}" ${t?"":"hidden"}>${e}</div>`}function lt({id:l="form-dialog",visible:t=!1,body:e="",submitLabel:i="Save",cancelLabel:s="Cancel",submitClass:o="btn btn-primary",cancelClass:n="btn btn-secondary"}={}){return`
    <div class="form-dialog" id="${l}" ${t?"":'style="display:none;"'}>
      ${e}
      <div class="form-actions">
        <button class="${n}" data-form-action="cancel">${s}</button>
        <button class="${o}" data-form-action="submit">${i}</button>
      </div>
    </div>`}function ct(l,t,{onCancel:e,onSubmit:i}={}){let s=l.getElementById(t);return s?(s.querySelector('[data-form-action="cancel"]')?.addEventListener("click",o=>{s.style.display="none",e?.(o)}),s.querySelector('[data-form-action="submit"]')?.addEventListener("click",o=>{i?.(o)}),{show(){s.style.display="block"},hide(){s.style.display="none"},el:s}):null}var dt=F("iPIXEL_SavedSlots",()=>({})),Ze=[{value:1,name:"Style 1 (Digital)"},{value:2,name:"Style 2 (Minimal)"},{value:3,name:"Style 3 (Bold)"},{value:4,name:"Style 4 (Retro)"},{value:5,name:"Style 5 (Neon)"},{value:6,name:"Style 6 (Matrix)"},{value:7,name:"Style 7 (Classic)"},{value:8,name:"Style 8 (Modern)"}],Qe=[{value:0,name:"Static"},{value:1,name:"Scroll Left"},{value:2,name:"Scroll Right"},{value:3,name:"Scroll Up"},{value:4,name:"Scroll Down"},{value:5,name:"Flash"},{value:6,name:"Fade In/Out"},{value:7,name:"Bounce"}],ti=[{value:"textimage",name:"Text+Image"},{value:"text",name:"Text"},{value:"clock",name:"Clock"},{value:"gif",name:"GIF"},{value:"rhythm",name:"Rhythm"}],ei={text:"#ff6600",textimage:"#ff6600",clock:"#00ff88",gif:"#ff44ff",rhythm:"#44aaff"},Mt=[1,2,3,4,5,6,7,8,9],ii=[{id:"main",label:"Main"},{id:"clock",label:"Clock"},{id:"slots",label:"Slots"},{id:"advanced",label:"Advanced"}],si='<svg viewBox="0 0 24 24"><path d="M13,3H11V13H13V3M17.83,5.17L16.41,6.59C18.05,7.91 19,9.9 19,12A7,7 0 0,1 12,19A7,7 0 0,1 5,12C5,9.9 5.95,7.91 7.59,6.59L6.17,5.17C4.23,6.82 3,9.26 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,9.26 19.77,6.82 17.83,5.17Z"/></svg>',oi='<svg viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>',ni='<svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/></svg>',ai='<svg viewBox="0 0 24 24"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4M18.2,7.27L19.62,5.85C18.27,4.5 16.5,3.5 14.5,3.13V5.17C15.86,5.5 17.08,6.23 18.2,7.27M20,12H22A10,10 0 0,0 12,2V4A8,8 0 0,1 20,12M5.8,16.73L4.38,18.15C5.73,19.5 7.5,20.5 9.5,20.87V18.83C8.14,18.5 6.92,17.77 5.8,16.73M4,12H2A10,10 0 0,0 12,22V20A8,8 0 0,1 4,12Z"/></svg>',$t=class extends O{constructor(){super(),this._activeTab="main",this._clockStyle=1,this._is24Hour=!0,this._showDate=!1,this._upsideDown=!1,this._animationMode=0,this._programSlots="",this._fontSize=16,this._fontOffsetX=0,this._fontOffsetY=0,this._saveSlotNum=1,this._saveType="gif",this._saveFrames=30,this._saveDelay=100}_switchTab(t){this._captureSlotsForm(),this._activeTab=t,this.render()}_captureSlotsForm(){let t=e=>this.shadowRoot.getElementById(e);t("font-size")&&(this._fontSize=parseInt(t("font-size").value)||this._fontSize),t("font-offset-x")&&(this._fontOffsetX=parseInt(t("font-offset-x").value)||0),t("font-offset-y")&&(this._fontOffsetY=parseInt(t("font-offset-y").value)||0),t("save-slot")&&(this._saveSlotNum=parseInt(t("save-slot").value)||1),t("save-type")&&(this._saveType=t("save-type").value||"gif"),t("save-frames")&&(this._saveFrames=parseInt(t("save-frames").value)||30),t("save-delay")&&(this._saveDelay=parseInt(t("save-delay").value)||100),t("program-slots")&&(this._programSlots=t("program-slots").value||"")}render(){let t=this.isInTestMode();if(!this._hass&&!t)return;let e=this.isOn(),i=this.getRelatedEntity("switch","_upside_down");i&&(this._upsideDown=i.state==="on");let s=this._activeTab;this.shadowRoot.innerHTML=`
      <style>${A}
        .compact-row { display: flex; gap: 8px; align-items: center; }
        .compact-row select { flex: 1; }
        .screen-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
        .screen-btn {
          padding: 8px 4px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: var(--ipixel-text);
          border-radius: 6px; cursor: pointer;
          font-size: 0.8em; text-align: center; transition: all 0.2s;
        }
        .screen-btn:hover { background: rgba(255,255,255,0.1); }
        .screen-btn.active { background: var(--ipixel-primary); border-color: var(--ipixel-primary); }
        .screen-btn.saved { background: rgba(76,175,80,0.2); border-color: rgba(76,175,80,0.4); }
        .screen-btn.delete { background: rgba(244,67,54,0.2); border-color: rgba(244,67,54,0.3); color: #f44336; }
        .screen-btn.delete:hover { background: rgba(244,67,54,0.4); }
      </style>
      <ha-card>
        <div class="card-content">
          ${H(ii,s)}
          ${R("main",s==="main",this._renderMainTab(e))}
          ${R("clock",s==="clock",this._renderClockTab())}
          ${R("slots",s==="slots",this._renderSlotsTab())}
          ${R("advanced",s==="advanced",this._renderAdvancedTab())}
        </div>
      </ha-card>`,this._attachListeners()}_renderMainTab(t){return`
      <div class="section-title">Quick Actions</div>
      <div class="control-row">
        <div class="button-grid button-grid-4">
          <button class="icon-btn ${t?"active":""}" data-action="power" title="Power">${si}</button>
          <button class="icon-btn" data-action="clear" title="Clear">${oi}</button>
          <button class="icon-btn" data-action="clock" title="Clock">${ni}</button>
          <button class="icon-btn" data-action="sync" title="Sync Time">${ai}</button>
        </div>
      </div>

      <div class="section-title">Brightness</div>
      <div class="control-row">
        ${K({id:"brightness",min:1,max:100,value:50,unit:"%"})}
      </div>

      <div class="section-title">Display Mode</div>
      <div class="control-row">
        ${$(ti,{selected:null,itemClass:"mode-btn",gridClass:"button-grid button-grid-3",dataAttr:"mode"})}
      </div>`}_renderClockTab(){return`
      <div class="section-title">Clock Settings</div>
      <div class="subsection">
        <div class="compact-row" style="margin-bottom: 12px;">
          <select class="dropdown" id="clock-style">
            ${Ze.map(t=>`<option value="${t.value}"${t.value===this._clockStyle?" selected":""}>${t.name}</option>`).join("")}
          </select>
          <button class="btn btn-primary" id="apply-clock-btn">Apply</button>
        </div>
        ${B({id:"toggle-24h",active:this._is24Hour,label:"24-Hour Format"})}
        ${B({id:"toggle-date",active:this._showDate,label:"Show Date"})}
      </div>

      <div class="section-title">Text Animation</div>
      <div class="control-row">
        <select class="dropdown" id="animation-mode">
          ${Qe.map(t=>`<option value="${t.value}"${t.value===this._animationMode?" selected":""}>${t.name}</option>`).join("")}
        </select>
      </div>

      <div class="section-title">Orientation & Display</div>
      <div class="two-col">
        <div>
          <div class="subsection-title">Rotation</div>
          <select class="dropdown" id="orientation">
            <option value="0">0\xB0 (Normal)</option>
            <option value="1">180\xB0</option>
          </select>
        </div>
        <div>
          <div class="subsection-title">Flip</div>
          ${B({id:"toggle-upside-down",active:this._upsideDown,label:"Upside Down",padding:"4px 0"})}
        </div>
      </div>`}_renderSlotsTab(){let t=dt.load(),e=Mt.map(i=>{let s=t[String(i)];return{value:i,name:`${i}${s?"*":""}`,saved:s,title:s?s.name:"Empty"}});return`
      <div class="section-title">Screen Slots</div>
      <div class="subsection">
        <div class="subsection-title">Show Saved Slot</div>
        <div style="margin-bottom: 12px;">
          ${$(e,{selected:null,itemClass:"screen-btn",gridClass:"screen-grid",dataAttr:"show-slot",extraClass:i=>i.saved?"saved":"",title:i=>i.title})}
        </div>
        <div class="subsection-title">Auto-Cycle Slots</div>
        <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 12px;">
          <input type="text" class="text-input" id="program-slots" placeholder="e.g. 1,2,3" style="flex: 1;" value="${this._programSlots}">
          <button class="btn btn-secondary" id="program-mode-btn">Cycle</button>
        </div>
        <div class="subsection-title">Select Screen Buffer (1-9)</div>
        <div style="margin-bottom: 12px;">
          ${$(Mt.map(i=>({value:i,name:String(i)})),{selected:null,itemClass:"screen-btn",gridClass:"screen-grid",dataAttr:"screen"})}
        </div>
        <div class="subsection-title">Save Effect to Slot</div>
        <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 12px;">
          <select class="dropdown" id="save-slot" style="width: 70px;">
            ${Mt.map(i=>`<option value="${i}"${i===this._saveSlotNum?" selected":""}>Slot ${i}</option>`).join("")}
          </select>
          <select class="dropdown" id="save-type" style="flex: 1;">
            <option value="gif"${this._saveType==="gif"?" selected":""}>Animation (GIF)</option>
            <option value="image"${this._saveType==="image"?" selected":""}>Static Image</option>
          </select>
          <button class="btn btn-primary" id="save-to-slot-btn">Save</button>
        </div>
        <div id="save-gif-options" style="display: ${this._saveType==="gif"?"flex":"none"}; gap: 6px; align-items: center; margin-bottom: 12px;">
          <label style="font-size: 0.75em; opacity: 0.6; white-space: nowrap;">Frames</label>
          <input type="number" class="text-input" id="save-frames" value="${this._saveFrames}" min="5" max="120" style="width: 60px;">
          <label style="font-size: 0.75em; opacity: 0.6; white-space: nowrap;">Delay ms</label>
          <input type="number" class="text-input" id="save-delay" value="${this._saveDelay}" min="20" max="500" step="10" style="width: 60px;">
        </div>
        <div id="save-progress" style="display: none; font-size: 0.8em; color: var(--ipixel-primary); margin-bottom: 12px;"></div>
        <div class="subsection-title">Delete Screen</div>
        ${$([...Mt,10].map(i=>({value:i,name:`\xD7${i}`})),{selected:null,itemClass:"screen-btn delete",gridClass:"screen-grid",dataAttr:"delete"})}
      </div>

      <div class="section-title">Font Settings</div>
      <div class="subsection">
        <div class="two-col">
          <div>
            <div class="subsection-title">Size (1-128)</div>
            <input type="number" class="text-input" id="font-size" value="${this._fontSize}" min="1" max="128" style="width: 100%;">
          </div>
          <div>
            <div class="subsection-title">Offset X, Y</div>
            <div style="display: flex; gap: 4px;">
              <input type="number" class="text-input" id="font-offset-x" value="${this._fontOffsetX}" min="-64" max="64" style="width: 50%;">
              <input type="number" class="text-input" id="font-offset-y" value="${this._fontOffsetY}" min="-32" max="32" style="width: 50%;">
            </div>
          </div>
        </div>
      </div>`}_renderAdvancedTab(){return`
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
      </div>`}_attachListeners(){N(this.shadowRoot,t=>this._switchTab(t)),this._attachMainTab(),this._attachClockTab(),this._attachSlotsTab(),this._attachAdvancedTab()}_attachMainTab(){this.shadowRoot.querySelectorAll("[data-action]").forEach(t=>{t.addEventListener("click",e=>this._handleAction(e.currentTarget.dataset.action))}),Z(this.shadowRoot,"brightness",{unit:"%",onChange:t=>this.callService("ipixel_color","set_brightness",{level:t})}),P(this.shadowRoot,"[data-mode]",{onSelect:t=>this._selectMode(t),attr:"mode"})}_attachClockTab(){this.shadowRoot.getElementById("clock-style")?.addEventListener("change",t=>{this._clockStyle=parseInt(t.target.value)}),this.shadowRoot.getElementById("apply-clock-btn")?.addEventListener("click",()=>this._applyClockSettings()),z(this.shadowRoot,"toggle-24h",t=>{this._is24Hour=t}),z(this.shadowRoot,"toggle-date",t=>{this._showDate=t}),this.shadowRoot.getElementById("animation-mode")?.addEventListener("change",t=>{this._animationMode=parseInt(t.target.value),k({animationMode:this._animationMode}),this.callService("ipixel_color","set_animation_mode",{mode:this._animationMode})}),this.shadowRoot.getElementById("orientation")?.addEventListener("change",t=>{this.callService("ipixel_color","set_orientation",{orientation:parseInt(t.target.value)})}),z(this.shadowRoot,"toggle-upside-down",t=>{this._upsideDown=t;let e=this.getRelatedEntity("switch","_upside_down");e?this._hass.callService("switch",t?"turn_on":"turn_off",{entity_id:e.entity_id}):this.callService("ipixel_color","set_upside_down",{enabled:t})})}_attachSlotsTab(){P(this.shadowRoot,"[data-show-slot]",{onSelect:t=>this.callService("ipixel_color","show_slot",{slot:parseInt(t)}),attr:"showSlot"}),this.shadowRoot.getElementById("program-mode-btn")?.addEventListener("click",()=>{let t=this.shadowRoot.getElementById("program-slots")?.value||"",e=t.split(/[,\s]+/).map(Number).filter(i=>i>=1&&i<=255);e.length&&(this._programSlots=t,this.callService("ipixel_color","program_mode",{slots:e}))}),P(this.shadowRoot,"[data-screen]",{onSelect:t=>this.callService("ipixel_color","set_screen",{screen:parseInt(t)}),attr:"screen"}),this.shadowRoot.querySelectorAll("[data-delete]").forEach(t=>{t.addEventListener("click",e=>{let i=parseInt(e.currentTarget.dataset.delete);if(confirm(`Delete screen slot ${i}?`)){this.callService("ipixel_color","delete_screen",{slot:i});let s=dt.load();delete s[String(i)],dt.save(s),this.render()}})}),this.shadowRoot.getElementById("save-type")?.addEventListener("change",t=>{let e=this.shadowRoot.getElementById("save-gif-options");e&&(e.style.display=t.target.value==="gif"?"flex":"none")}),this.shadowRoot.getElementById("save-to-slot-btn")?.addEventListener("click",async()=>{await this._saveToSlot()}),this.shadowRoot.getElementById("font-size")?.addEventListener("change",t=>{let e=parseInt(t.target.value);k({fontSize:e}),this.callService("ipixel_color","set_font_size",{size:e})}),["font-offset-x","font-offset-y"].forEach(t=>{this.shadowRoot.getElementById(t)?.addEventListener("change",()=>this._updateFontOffset())})}_attachAdvancedTab(){this.shadowRoot.getElementById("diy-mode")?.addEventListener("change",e=>{let i=e.target.value;i!==""&&(this.callService("ipixel_color","set_diy_mode",{mode:i}),setTimeout(()=>{e.target.value=""},500))});let t=()=>{let e=this.shadowRoot.getElementById("raw-command")?.value?.trim();e&&this.callService("ipixel_color","send_raw_command",{hex_data:e})};this.shadowRoot.getElementById("send-raw-btn")?.addEventListener("click",t),this.shadowRoot.getElementById("raw-command")?.addEventListener("keypress",e=>{e.key==="Enter"&&t()})}_handleAction(t){if(t==="power"){let e=this.getRelatedEntity("switch");e&&this._hass.callService("switch","toggle",{entity_id:e.entity_id})}else t==="clear"?(k({text:"",mode:"text",effect:"fixed",speed:50,fgColor:"#ff6600",bgColor:"#000000"}),this.callService("ipixel_color","clear_pixels")):t==="clock"?this._applyClockSettings():t==="sync"&&this.callService("ipixel_color","sync_time")}_selectMode(t){let e=this.getRelatedEntity("select","_mode");e&&this._hass.callService("select","select_option",{entity_id:e.entity_id,option:t}),k({mode:t,fgColor:ei[t]||"#ff6600",text:t==="clock"?"":window.iPIXELDisplayState?.text||""})}_applyClockSettings(){k({text:"",mode:"clock",effect:"fixed",speed:50,fgColor:"#00ff88",bgColor:"#000000",clockStyle:this._clockStyle,is24Hour:this._is24Hour,showDate:this._showDate}),this.callService("ipixel_color","set_clock_mode",{style:this._clockStyle,format_24h:this._is24Hour,show_date:this._showDate})}_updateFontOffset(){let t=parseInt(this.shadowRoot.getElementById("font-offset-x")?.value||"0"),e=parseInt(this.shadowRoot.getElementById("font-offset-y")?.value||"0");k({fontOffsetX:t,fontOffsetY:e}),this.callService("ipixel_color","set_font_offset",{x:t,y:e})}async _saveToSlot(){let t=a=>this.shadowRoot.getElementById(a),e=parseInt(t("save-slot")?.value||"1"),i=t("save-type")?.value||"gif",s=parseInt(t("save-frames")?.value||"30"),o=parseInt(t("save-delay")?.value||"100"),n=t("save-progress"),r=t("save-to-slot-btn");n&&(n.style.display="block",n.textContent="Starting..."),r&&(r.disabled=!0);try{await this.callService("ipixel_color","save_to_slot",{slot:e,type:i,frames:s,delay:o});let a=window.iPIXELDisplayState||{},c=dt.load();c[String(e)]={name:a.text||a.effect||i,type:i,frames:i==="gif"?s:1,savedAt:new Date().toISOString()},dt.save(c),n&&(n.textContent="Saved!"),setTimeout(()=>this.render(),1500)}catch(a){n&&(n.textContent="Error: "+a.message)}finally{r&&(r.disabled=!1)}}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var ri=[{value:0,name:"None"},{value:1,name:"Rainbow Wave"},{value:2,name:"Rainbow Cycle"},{value:3,name:"Rainbow Pulse"},{value:4,name:"Rainbow Fade"},{value:5,name:"Rainbow Chase"},{value:6,name:"Rainbow Sparkle"},{value:7,name:"Rainbow Gradient"},{value:8,name:"Rainbow Theater"},{value:9,name:"Rainbow Fire"}],li=[{value:0,name:"Classic Bars"},{value:1,name:"Mirrored Bars"},{value:2,name:"Center Out"},{value:3,name:"Wave Style"},{value:4,name:"Particle Style"}],ci=["32Hz","64Hz","125Hz","250Hz","500Hz","1kHz","2kHz","4kHz","8kHz","12kHz","16kHz"],di=[{id:"text",label:"Text"},{id:"ambient",label:"Ambient"},{id:"rhythm",label:"Rhythm"},{id:"advanced",label:"GFX"}],Rt=class extends O{constructor(){super(),this._activeTab="text",this._rhythmLevels=new Array(11).fill(0),this._selectedRhythmStyle=0,this._selectedAmbient="rainbow"}_ambientItems(){return Object.entries(M).filter(([t,e])=>e.category===nt.AMBIENT).map(([t,e])=>({value:t,name:e.name}))}_buildTextEffectOptions(){let t=e=>Object.entries(M).filter(([i,s])=>s.category===e).map(([i,s])=>`<option value="${i}">${s.name}</option>`).join("");return`
      <optgroup label="Text Effects">${t(nt.TEXT)}</optgroup>
      <optgroup label="Color Effects">${t(nt.COLOR)}</optgroup>`}_renderTextTab(){return`
      <div class="section-title">Display Text</div>
      <div class="input-row">
        <input type="text" class="text-input" id="text-input" placeholder="Enter text to display...">
        <button class="btn btn-primary" id="send-btn">Send</button>
      </div>
      <div class="two-col">
        <div>
          <div class="section-title">Effect</div>
          <div class="control-row">
            <select class="dropdown" id="text-effect">${this._buildTextEffectOptions()}</select>
          </div>
        </div>
        <div>
          <div class="section-title">Rainbow Mode</div>
          <div class="control-row">
            <select class="dropdown" id="rainbow-mode">
              ${ri.map(t=>`<option value="${t.value}">${t.name}</option>`).join("")}
            </select>
          </div>
        </div>
      </div>
      <div class="section-title">Speed</div>
      <div class="control-row">
        ${K({id:"text-speed",min:1,max:100,value:50})}
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
        ${qt([{id:"text-color",label:"Text",value:"#ff6600"},{id:"bg-color",label:"Background",value:"#000000"}])}
      </div>`}_renderAmbientTab(){return`
      <div class="section-title">Ambient Effect</div>
      ${$(this._ambientItems(),{selected:this._selectedAmbient,itemClass:"effect-btn",gridClass:"effect-grid",dataAttr:"effect"})}
      <div class="section-title">Speed</div>
      <div class="control-row">
        ${K({id:"ambient-speed",min:1,max:100,value:50})}
      </div>
      <button class="btn btn-primary" id="apply-ambient-btn" style="width:100%;margin-top:8px;">Apply Effect</button>`}_renderRhythmTab(){return`
      <div class="section-title">Visualization Style</div>
      ${$(li,{selected:this._selectedRhythmStyle,itemClass:"style-btn",gridClass:"style-grid",dataAttr:"style"})}
      <div class="section-title">Frequency Levels (0-15)</div>
      <div class="rhythm-container">
        ${this._rhythmLevels.map((t,e)=>`
          <div class="rhythm-band">
            <label>${ci[e]}</label>
            <input type="range" class="rhythm-slider" data-band="${e}" min="0" max="15" value="${t}">
            <span class="rhythm-val">${t}</span>
          </div>`).join("")}
      </div>
      <button class="btn btn-primary" id="apply-rhythm-btn" style="width:100%;margin-top:12px;">Apply Rhythm</button>`}_renderGfxTab(){return`
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
      <button class="btn btn-primary" id="apply-gfx-btn" style="width:100%;margin-top:12px;">Render GFX</button>
      <div class="section-title" style="margin-top:16px;">Per-Character Colors</div>
      <div class="input-row">
        <input type="text" class="text-input" id="multicolor-text" placeholder="Text (e.g., HELLO)">
      </div>
      <div class="input-row">
        <input type="text" class="text-input" id="multicolor-colors" placeholder="Colors (e.g., #ff0000,#00ff00,#0000ff)">
      </div>
      <button class="btn btn-primary" id="apply-multicolor-btn" style="width:100%;margin-top:8px;">Send Multicolor Text</button>`}render(){let t=this.isInTestMode();if(!this._hass&&!t)return;let e=this._activeTab;this.shadowRoot.innerHTML=`
      <style>${A}
        .input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .input-row .text-input { flex: 1; }
        select optgroup { font-weight: bold; color: var(--ipixel-text); }
        select option { font-weight: normal; }
        .effect-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
        .style-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
        .effect-btn, .style-btn {
          padding: 12px 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: var(--ipixel-text);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.75em;
          text-align: center;
          transition: all 0.2s ease;
        }
        .effect-btn:hover, .style-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .effect-btn.active, .style-btn.active { background: var(--ipixel-primary); border-color: var(--ipixel-primary); }
        .rhythm-band { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .rhythm-band label { width: 50px; font-size: 0.75em; opacity: 0.8; }
        .rhythm-slider { flex: 1; height: 4px; }
        .rhythm-val { width: 20px; font-size: 0.75em; text-align: right; }
        .rhythm-container { max-height: 300px; overflow-y: auto; padding-right: 8px; }
        .gfx-textarea {
          width: 100%; min-height: 150px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--ipixel-text);
          font-family: monospace; font-size: 0.8em;
          padding: 12px; resize: vertical;
        }
        .gfx-textarea:focus { outline: none; border-color: var(--ipixel-primary); }
      </style>
      <ha-card>
        <div class="card-content">
          ${H(di,e)}
          ${R("text",e==="text",this._renderTextTab())}
          ${R("ambient",e==="ambient",this._renderAmbientTab())}
          ${R("rhythm",e==="rhythm",this._renderRhythmTab())}
          ${R("advanced",e==="advanced",this._renderGfxTab())}
        </div>
      </ha-card>`,this._attachListeners()}_getTextFormValues(){let t=e=>this.shadowRoot.getElementById(e);return{text:t("text-input")?.value||"",effect:t("text-effect")?.value||"fixed",rainbowMode:parseInt(t("rainbow-mode")?.value||"0"),speed:parseInt(t("text-speed")?.value||"50"),fgColor:t("text-color")?.value||"#ff6600",bgColor:t("bg-color")?.value||"#000000",font:t("font-select")?.value||"VCR_OSD_MONO"}}_getAmbientFormValues(){return{effect:this._selectedAmbient||"rainbow",speed:parseInt(this.shadowRoot.getElementById("ambient-speed")?.value||"50")}}_getRhythmFormValues(){return{style:this._selectedRhythmStyle||0,levels:[...this._rhythmLevels]}}_getGfxFormValues(){try{return JSON.parse(this.shadowRoot.getElementById("gfx-json")?.value||"")}catch{return null}}_getMulticolorFormValues(){let t=this.shadowRoot.getElementById("multicolor-text")?.value||"",e=(this.shadowRoot.getElementById("multicolor-colors")?.value||"").split(",").map(i=>i.trim()).filter(Boolean);return{text:t,colors:e}}_updateTextPreview(){let{text:t,effect:e,speed:i,fgColor:s,bgColor:o,font:n}=this._getTextFormValues();k({text:t||"Preview",mode:"text",effect:e,speed:i,fgColor:s,bgColor:o,font:n})}_updateAmbientPreview(){let{effect:t,speed:e}=this._getAmbientFormValues();k({text:"",mode:"ambient",effect:t,speed:e,fgColor:"#ffffff",bgColor:"#000000"})}_attachListeners(){N(this.shadowRoot,t=>{this._activeTab=t,this.render()}),Z(this.shadowRoot,"text-speed",{onInput:()=>this._updateTextPreview()}),["text-effect","rainbow-mode","font-select"].forEach(t=>{this.shadowRoot.getElementById(t)?.addEventListener("change",()=>this._updateTextPreview())}),Yt(this.shadowRoot,["text-color","bg-color"],()=>this._updateTextPreview()),this.shadowRoot.getElementById("text-input")?.addEventListener("input",()=>this._updateTextPreview()),this.shadowRoot.getElementById("send-btn")?.addEventListener("click",()=>this._sendText()),P(this.shadowRoot,".effect-btn",{onSelect:t=>{this._selectedAmbient=t,this._updateAmbientPreview()},attr:"effect"}),Z(this.shadowRoot,"ambient-speed",{onInput:()=>this._updateAmbientPreview()}),this.shadowRoot.getElementById("apply-ambient-btn")?.addEventListener("click",()=>{let{effect:t,speed:e}=this._getAmbientFormValues();k({text:"",mode:"ambient",effect:t,speed:e,fgColor:"#ffffff",bgColor:"#000000"})}),P(this.shadowRoot,".style-btn",{onSelect:t=>{this._selectedRhythmStyle=parseInt(t)},attr:"style"}),this.shadowRoot.querySelectorAll(".rhythm-slider").forEach(t=>{t.addEventListener("input",e=>{let i=parseInt(e.target.dataset.band),s=parseInt(e.target.value);this._rhythmLevels[i]=s,e.target.nextElementSibling.textContent=s})}),this.shadowRoot.getElementById("apply-rhythm-btn")?.addEventListener("click",()=>{let{style:t,levels:e}=this._getRhythmFormValues();k({text:"",mode:"rhythm",rhythmStyle:t,rhythmLevels:e}),this.callService("ipixel_color","set_rhythm_level",{style:t,levels:e})}),this.shadowRoot.getElementById("apply-gfx-btn")?.addEventListener("click",()=>{let t=this._getGfxFormValues();if(!t){console.warn("iPIXEL: Invalid GFX JSON");return}k({text:"",mode:"gfx",gfxData:t}),this.callService("ipixel_color","render_gfx",{data:t})}),this.shadowRoot.getElementById("apply-multicolor-btn")?.addEventListener("click",()=>{let{text:t,colors:e}=this._getMulticolorFormValues();!t||!e.length||(k({text:t,mode:"multicolor",colors:e}),this.callService("ipixel_color","display_multicolor_text",{text:t,colors:e.map(i=>this.hexToRgb(i))}))})}_sendText(){let{text:t,effect:e,rainbowMode:i,speed:s,fgColor:o,bgColor:n,font:r}=this._getTextFormValues();if(!t||(k({text:t,mode:"text",effect:e,speed:s,fgColor:o,bgColor:n,font:r,rainbowMode:i}),this.isInTestMode()))return;this._config.entity&&this._hass&&this._hass.callService("text","set_value",{entity_id:this._config.entity,value:t});let a=r==="LEGACY"?"CUSONG":r;this.callService("ipixel_color","display_text",{text:t,effect:e,speed:s,color_fg:this.hexToRgb(o),color_bg:this.hexToRgb(n),font:a,rainbow_mode:i})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var Jt=F("iPIXEL_Presets",()=>[]),Kt=["\u{1F4FA}","\u{1F4AC}","\u23F0","\u{1F3B5}","\u{1F3A8}","\u2B50","\u2764\uFE0F","\u{1F525}","\u{1F4A1}","\u{1F308}","\u{1F3AE}","\u{1F4E2}","\u{1F3E0}","\u{1F514}","\u2728","\u{1F389}"],hi='<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>',fi='<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>',Lt=class extends O{constructor(){super(),this._presets=Jt.load(),this._editingPreset=null,this._selectedIcon=Kt[0],this._formVisible=!1}render(){let t=this.isInTestMode();if(!this._hass&&!t)return;let e=Kt.map(i=>({value:i,name:i}));this.shadowRoot.innerHTML=`
      <style>${A}
        .preset-list {
          display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 16px; max-height: 300px; overflow-y: auto;
        }
        .preset-item {
          display: flex; align-items: center; gap: 8px; padding: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer; transition: all 0.2s;
        }
        .preset-item:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .preset-item.active { border-color: var(--ipixel-primary); background: rgba(3, 169, 244, 0.1); }
        .preset-icon {
          width: 32px; height: 32px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center; font-size: 1.2em;
        }
        .preset-info { flex: 1; min-width: 0; }
        .preset-name { font-weight: 500; font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .preset-desc { font-size: 0.75em; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .preset-actions { display: flex; gap: 4px; }
        .preset-actions button {
          padding: 6px; background: transparent; border: none;
          color: rgba(255,255,255,0.5); cursor: pointer; border-radius: 4px; transition: all 0.2s;
        }
        .preset-actions button:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .preset-actions button.delete:hover { background: rgba(244,67,54,0.2); color: #f44; }
        .empty-state svg { width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5; }
        .icon-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; margin-top: 8px; }
        .icon-option {
          width: 32px; height: 32px;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 1.1em; transition: all 0.2s; background: transparent;
        }
        .icon-option:hover { background: rgba(255,255,255,0.1); }
        .icon-option.active { border-color: var(--ipixel-primary); background: rgba(3, 169, 244, 0.2); }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">Presets</div>
            <button class="icon-btn" id="add-preset-btn" title="Save Current as Preset">
              <svg viewBox="0 0 24 24"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>
            </button>
          </div>

          <div class="preset-list" id="preset-list">
            ${this._presets.length===0?this._renderEmpty():this._presets.map((i,s)=>this._renderPresetItem(i,s)).join("")}
          </div>

          ${lt({id:"preset-form",visible:this._formVisible,submitLabel:"Save Preset",body:`
              <div class="form-row">
                <label>Preset Name</label>
                <input type="text" class="text-input" id="preset-name" placeholder="My Preset">
              </div>
              <div class="form-row">
                <label>Icon</label>
                ${$(e,{selected:this._selectedIcon,itemClass:"icon-option",gridClass:"icon-grid",dataAttr:"icon"})}
              </div>`})}
        </div>
      </ha-card>`,this._attachListeners()}_renderEmpty(){return`
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,20H5V4H7V7H17V4H19M12,2A1,1 0 0,1 13,3A1,1 0 0,1 12,4A1,1 0 0,1 11,3A1,1 0 0,1 12,2M19,2H14.82C14.4,0.84 13.3,0 12,0C10.7,0 9.6,0.84 9.18,2H5A2,2 0 0,0 3,4V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V4A2,2 0 0,0 19,2Z"/></svg>
        <div>No presets saved</div>
        <div style="font-size: 0.85em; margin-top: 4px;">Click + to save current display</div>
      </div>`}_renderPresetItem(t,e){let i=t.text?' \xB7 "'+t.text.substring(0,15)+(t.text.length>15?"...":"")+'"':"";return`
      <div class="preset-item" data-index="${e}">
        <div class="preset-icon" style="background: ${t.fgColor||"#ff6600"}20; color: ${t.fgColor||"#ff6600"}">
          ${t.icon||"\u{1F4FA}"}
        </div>
        <div class="preset-info">
          <div class="preset-name">${this.escapeHtml(t.name)}</div>
          <div class="preset-desc">${t.mode} \xB7 ${t.effect||"fixed"}${i}</div>
        </div>
        <div class="preset-actions">
          <button data-action="edit" data-index="${e}" title="Edit">${hi}</button>
          <button class="delete" data-action="delete" data-index="${e}" title="Delete">${fi}</button>
        </div>
      </div>`}_showForm(t=null,e=null){this._editingPreset=e,this._selectedIcon=t?.icon||Kt[0],this._formVisible=!0,this.render();let i=this.shadowRoot.getElementById("preset-name");i&&(i.value=t?.name||"")}_applyPreset(t,e){k({text:t.text,mode:t.mode,effect:t.effect,speed:t.speed,fgColor:t.fgColor,bgColor:t.bgColor,font:t.font,rainbowMode:t.rainbowMode}),t.mode==="text"&&t.text&&this.callService("ipixel_color","display_text",{text:t.text,effect:t.effect,speed:t.speed,color_fg:this.hexToRgb(t.fgColor),color_bg:this.hexToRgb(t.bgColor),font:t.font,rainbow_mode:t.rainbowMode}),this.shadowRoot.querySelectorAll(".preset-item").forEach(i=>i.classList.remove("active")),e.classList.add("active")}_attachListeners(){this.shadowRoot.getElementById("add-preset-btn")?.addEventListener("click",()=>this._showForm()),ct(this.shadowRoot,"preset-form",{onCancel:()=>{this._formVisible=!1,this._editingPreset=null},onSubmit:()=>this._savePreset()}),P(this.shadowRoot,".icon-option",{onSelect:t=>{this._selectedIcon=t},attr:"icon"}),this.shadowRoot.querySelectorAll(".preset-item").forEach(t=>{t.addEventListener("click",e=>{if(e.target.closest(".preset-actions"))return;let i=this._presets[parseInt(t.dataset.index)];i&&this._applyPreset(i,t)})}),this.shadowRoot.querySelectorAll('[data-action="edit"]').forEach(t=>{t.addEventListener("click",e=>{e.stopPropagation();let i=parseInt(e.currentTarget.dataset.index);this._showForm(this._presets[i],i)})}),this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach(t=>{t.addEventListener("click",e=>{e.stopPropagation();let i=parseInt(e.currentTarget.dataset.index);confirm("Delete this preset?")&&(this._presets.splice(i,1),Jt.save(this._presets),this.render())})})}_savePreset(){let t=(this.shadowRoot.getElementById("preset-name")?.value||"").trim()||"Preset",e=gt(),i={name:t,icon:this._selectedIcon,text:e.text||"",mode:e.mode||"text",effect:e.effect||"fixed",speed:e.speed||50,fgColor:e.fgColor||"#ff6600",bgColor:e.bgColor||"#000000",font:e.font||"VCR_OSD_MONO",rainbowMode:e.rainbowMode||0,createdAt:Date.now()};this._editingPreset!==null?this._presets[this._editingPreset]=i:this._presets.push(i),Jt.save(this._presets),this._formVisible=!1,this._editingPreset=null,this.render()}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var Pt=F("iPIXEL_Schedules",()=>[]),ye=F("iPIXEL_PowerSchedule",()=>({enabled:!1,onTime:"07:00",offTime:"22:00"})),we=["Su","Mo","Tu","We","Th","Fr","Sa"],pi=[{id:"timeline",label:"Timeline"},{id:"power",label:"Power"},{id:"content",label:"Content"}],ui='<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>',gi='<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>',Ot=class extends O{constructor(){super(),this._activeTab="timeline",this._schedules=Pt.load(),this._powerSchedule=ye.load(),this._editingSlot=null,this._formVisible=!1,this._checkInterval=null}connectedCallback(){this._checkInterval=setInterval(()=>this._checkSchedules(),6e4),this._checkSchedules()}disconnectedCallback(){super.disconnectedCallback(),this._checkInterval&&clearInterval(this._checkInterval)}_checkSchedules(){let t=new Date,e=this._formatTime(t),i=t.getDay();for(let s of this._schedules)s.enabled&&(s.days&&!s.days.includes(i)||s.startTime===e&&(k({text:s.text||"",mode:s.mode||"text",effect:s.effect||"fixed",fgColor:s.fgColor||"#ff6600",bgColor:s.bgColor||"#000000"}),s.mode==="text"&&s.text?this.callService("ipixel_color","display_text",{text:s.text,effect:s.effect,color_fg:this.hexToRgb(s.fgColor),color_bg:this.hexToRgb(s.bgColor)}):s.mode==="clock"&&this.callService("ipixel_color","set_clock_mode",{style:1})))}_formatTime(t){return`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}_timeToMinutes(t){let[e,i]=t.split(":").map(Number);return e*60+i}render(){let t=this.isInTestMode();if(!this._hass&&!t)return;let e=this._activeTab;this.shadowRoot.innerHTML=`
      <style>${A}
        .timeline { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
        .timeline-header { display: flex; justify-content: space-between; font-size: 0.7em; opacity: 0.5; margin-bottom: 6px; }
        .timeline-bar { height: 32px; background: rgba(255,255,255,0.1); border-radius: 4px; position: relative; overflow: hidden; }
        .timeline-now { position: absolute; width: 2px; height: 100%; background: #f44336; z-index: 2; }
        .timeline-block { position: absolute; height: 100%; border-radius: 2px; z-index: 1; }
        .power-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .power-row label { font-size: 0.85em; }
        .power-row input[type="time"] {
          padding: 6px 10px; background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: inherit;
        }
        .schedule-list {
          display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 12px; max-height: 250px; overflow-y: auto;
        }
        .schedule-item {
          display: flex; align-items: center; gap: 8px; padding: 10px 12px;
          background: rgba(255,255,255,0.05); border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .schedule-item .toggle-switch { width: 36px; height: 20px; }
        .schedule-item .toggle-switch::after { width: 16px; height: 16px; }
        .schedule-item .toggle-switch.active::after { transform: translateX(16px); }
        .schedule-info { flex: 1; min-width: 0; }
        .schedule-name { font-weight: 500; font-size: 0.9em; }
        .schedule-time { font-size: 0.75em; opacity: 0.6; }
        .schedule-actions button {
          padding: 4px; background: transparent; border: none;
          color: rgba(255,255,255,0.5); cursor: pointer; border-radius: 4px;
        }
        .schedule-actions button:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .day-selector { display: flex; gap: 4px; flex-wrap: wrap; }
        .day-btn {
          width: 32px; height: 32px;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;
          background: transparent; color: rgba(255,255,255,0.6);
          cursor: pointer; font-size: 0.75em; transition: all 0.2s;
        }
        .day-btn.active {
          background: var(--ipixel-primary); border-color: var(--ipixel-primary); color: #fff;
        }
        .current-time { font-size: 0.85em; opacity: 0.7; text-align: right; margin-bottom: 4px; }
      </style>
      <ha-card>
        <div class="card-content">
          ${H(pi,e)}
          ${R("timeline",e==="timeline",this._renderTimelineTab())}
          ${R("power",e==="power",this._renderPowerTab())}
          ${R("content",e==="content",this._renderContentTab())}
        </div>
      </ha-card>`,this._attachListeners()}_renderTimelineTab(){let t=new Date,e=(t.getHours()*60+t.getMinutes())/1440*100,i=this._formatTime(t),s=this._schedules.filter(o=>o.enabled).map(o=>{let n=this._timeToMinutes(o.startTime),r=o.endTime?this._timeToMinutes(o.endTime):n+60,a=n/1440*100,c=(r-n)/1440*100;return`<div class="timeline-block" style="left: ${a}%; width: ${c}%; background: ${o.fgColor||"#03a9f4"}40;" title="${this.escapeHtml(o.name||"Schedule")}"></div>`}).join("");return`
      <div class="current-time">Current: ${i}</div>
      <div class="section-title">24h Timeline</div>
      <div class="timeline">
        <div class="timeline-header">
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
        </div>
        <div class="timeline-bar">
          ${s}
          <div class="timeline-now" style="left: ${e}%;"></div>
        </div>
      </div>
      ${this._schedules.length===0?`
        <div class="empty-state" style="margin-top: 12px;">
          No schedules configured yet \u2014 head to the Content tab to add one.
        </div>`:""}`}_renderPowerTab(){return`
      <div class="section-title">Power Schedule</div>
      <div class="subsection">
        <div class="power-row">
          ${B({id:"power-toggle",active:this._powerSchedule.enabled})}
          <label>On:</label>
          <input type="time" id="power-on" value="${this._powerSchedule.onTime}">
          <label>Off:</label>
          <input type="time" id="power-off" value="${this._powerSchedule.offTime}">
          <button class="btn btn-primary" id="save-power">Save</button>
        </div>
      </div>`}_renderContentTab(){let t=we.map((e,i)=>({value:i,name:e}));return`
      <div class="section-title">Content Schedules</div>
      <div class="schedule-list" id="schedule-list">
        ${this._schedules.length===0?`
          <div class="empty-state" style="padding: 20px;">No schedules configured</div>
        `:this._schedules.map((e,i)=>this._renderScheduleItem(e,i)).join("")}
      </div>

      <button class="btn btn-secondary" id="add-slot" style="width: 100%;">+ Add Schedule</button>

      ${lt({id:"slot-form",visible:this._formVisible,submitLabel:"Save Schedule",body:`
          <div class="form-row">
            <label>Name</label>
            <input type="text" class="text-input" id="slot-name" placeholder="Morning Message">
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label>Start Time</label>
              <input type="time" class="text-input" id="slot-start" value="08:00" style="width: 100%;">
            </div>
            <div class="form-row">
              <label>End Time (optional)</label>
              <input type="time" class="text-input" id="slot-end" style="width: 100%;">
            </div>
          </div>
          <div class="form-row">
            <label>Days</label>
            ${$(t,{selected:[0,1,2,3,4,5,6],itemClass:"day-btn",gridClass:"day-selector",dataAttr:"day"})}
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label>Mode</label>
              <select class="dropdown" id="slot-mode">
                <option value="text">Text</option>
                <option value="clock">Clock</option>
                <option value="off">Power Off</option>
              </select>
            </div>
            <div class="form-row">
              <label>Effect</label>
              <select class="dropdown" id="slot-effect">
                <option value="fixed">Fixed</option>
                <option value="scroll_ltr">Scroll Left</option>
                <option value="scroll_rtl">Scroll Right</option>
                <option value="blink">Blink</option>
              </select>
            </div>
          </div>
          <div class="form-row" id="text-row">
            <label>Text</label>
            <input type="text" class="text-input" id="slot-text" placeholder="Good Morning!">
          </div>
          <div class="form-grid">
            <div class="form-row">
              <label>Text Color</label>
              <input type="color" id="slot-fg-color" value="#ff6600" style="width: 100%; height: 32px;">
            </div>
            <div class="form-row">
              <label>Background</label>
              <input type="color" id="slot-bg-color" value="#000000" style="width: 100%; height: 32px;">
            </div>
          </div>`})}`}_renderScheduleItem(t,e){let i=t.days?t.days.map(o=>we[o]).join(", "):"Daily",s=this.escapeHtml(t.name||`Schedule ${e+1}`);return`
      <div class="schedule-item" data-index="${e}">
        <div class="toggle-switch${t.enabled?" active":""}" data-action="toggle" data-index="${e}"></div>
        <div class="schedule-info">
          <div class="schedule-name">${s}</div>
          <div class="schedule-time">
            ${t.startTime}${t.endTime?" - "+t.endTime:""} \xB7 ${i} \xB7 ${t.mode||"text"}
          </div>
        </div>
        <div class="schedule-actions">
          <button data-action="edit" data-index="${e}" title="Edit">${ui}</button>
          <button data-action="delete" data-index="${e}" title="Delete">${gi}</button>
        </div>
      </div>`}_attachListeners(){N(this.shadowRoot,t=>{this._activeTab=t,this.render()}),z(this.shadowRoot,"power-toggle",t=>{this._powerSchedule.enabled=t}),this.shadowRoot.getElementById("save-power")?.addEventListener("click",()=>{this._powerSchedule.onTime=this.shadowRoot.getElementById("power-on")?.value||"07:00",this._powerSchedule.offTime=this.shadowRoot.getElementById("power-off")?.value||"22:00",ye.save(this._powerSchedule),this.callService("ipixel_color","set_power_schedule",{enabled:this._powerSchedule.enabled,on_time:this._powerSchedule.onTime,off_time:this._powerSchedule.offTime})}),this.shadowRoot.getElementById("add-slot")?.addEventListener("click",()=>this._showForm()),ct(this.shadowRoot,"slot-form",{onCancel:()=>{this._formVisible=!1,this._editingSlot=null},onSubmit:()=>this._saveSlot()}),P(this.shadowRoot,".day-btn",{multi:!0,attr:"day"}),this.shadowRoot.getElementById("slot-mode")?.addEventListener("change",t=>{let e=this.shadowRoot.getElementById("text-row");e&&(e.style.display=t.target.value==="text"?"block":"none")}),this.shadowRoot.querySelectorAll('[data-action="toggle"]').forEach(t=>{t.addEventListener("click",e=>{let i=parseInt(e.currentTarget.dataset.index);this._schedules[i].enabled=!this._schedules[i].enabled,Pt.save(this._schedules),e.currentTarget.classList.toggle("active",this._schedules[i].enabled)})}),this.shadowRoot.querySelectorAll('[data-action="edit"]').forEach(t=>{t.addEventListener("click",e=>{let i=parseInt(e.currentTarget.dataset.index);this._showForm(this._schedules[i],i)})}),this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach(t=>{t.addEventListener("click",e=>{let i=parseInt(e.currentTarget.dataset.index);confirm("Delete this schedule?")&&(this._schedules.splice(i,1),Pt.save(this._schedules),this.render())})})}_showForm(t=null,e=null){this._editingSlot=e,this._formVisible=!0,this.render(),t?this._fillSlotForm(t):this._resetSlotForm()}_resetSlotForm(){let t=e=>this.shadowRoot.getElementById(e);t("slot-name")&&(t("slot-name").value=""),t("slot-start")&&(t("slot-start").value="08:00"),t("slot-end")&&(t("slot-end").value=""),t("slot-mode")&&(t("slot-mode").value="text"),t("slot-effect")&&(t("slot-effect").value="fixed"),t("slot-text")&&(t("slot-text").value=""),t("slot-fg-color")&&(t("slot-fg-color").value="#ff6600"),t("slot-bg-color")&&(t("slot-bg-color").value="#000000"),this.shadowRoot.querySelectorAll(".day-btn").forEach(e=>e.classList.add("active")),t("text-row")&&(t("text-row").style.display="block")}_fillSlotForm(t){let e=s=>this.shadowRoot.getElementById(s);e("slot-name")&&(e("slot-name").value=t.name||""),e("slot-start")&&(e("slot-start").value=t.startTime||"08:00"),e("slot-end")&&(e("slot-end").value=t.endTime||""),e("slot-mode")&&(e("slot-mode").value=t.mode||"text"),e("slot-effect")&&(e("slot-effect").value=t.effect||"fixed"),e("slot-text")&&(e("slot-text").value=t.text||""),e("slot-fg-color")&&(e("slot-fg-color").value=t.fgColor||"#ff6600"),e("slot-bg-color")&&(e("slot-bg-color").value=t.bgColor||"#000000");let i=t.days||[0,1,2,3,4,5,6];this.shadowRoot.querySelectorAll(".day-btn").forEach(s=>{s.classList.toggle("active",i.includes(parseInt(s.dataset.day)))}),e("text-row")&&(e("text-row").style.display=t.mode==="text"?"block":"none")}_saveSlot(){let t=s=>this.shadowRoot.getElementById(s),e=Array.from(this.shadowRoot.querySelectorAll(".day-btn.active")).map(s=>parseInt(s.dataset.day)),i={name:t("slot-name")?.value||"Schedule",startTime:t("slot-start")?.value||"08:00",endTime:t("slot-end")?.value||"",days:e.length===7?null:e,mode:t("slot-mode")?.value||"text",effect:t("slot-effect")?.value||"fixed",text:t("slot-text")?.value||"",fgColor:t("slot-fg-color")?.value||"#ff6600",bgColor:t("slot-bg-color")?.value||"#000000",enabled:!0};this._editingSlot!==null?this._schedules[this._editingSlot]=i:this._schedules.push(i),Pt.save(this._schedules),this._formVisible=!1,this._editingSlot=null,this.render()}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var mi=["#FFFFFF","#000000","#FF0000","#00FF00","#0080FF","#FFFF00","#FF00FF","#00FFFF","#FF8000","#8000FF","#2EC4FF","#0010A0","#A0FF00","#FF80C0","#808080","#C0C0C0"],bi=[{value:"16x16",label:"16\xD716"},{value:"32x8",label:"32\xD78"},{value:"32x16",label:"32\xD716"},{value:"32x32",label:"32\xD732"},{value:"64x16",label:"64\xD716"},{value:"64x20",label:"64\xD720"},{value:"64x64",label:"64\xD764"},{value:"96x16",label:"96\xD716"},{value:"128x16",label:"128\xD716"},{value:"192x16",label:"192\xD716"}],Q={r:25,g:25,b:25},At=class extends O{constructor(){super(),this._width=64,this._height=16,this._tool="pen",this._drawing=!1,this._gridOn=!0,this._currentColor="#ff6600",this._scale=8,this._sending=!1,this._logicalCanvas=document.createElement("canvas"),this._ctx=this._logicalCanvas.getContext("2d"),this._displayCanvas=null,this._dctx=null,this._initialized=!1}setConfig(t){if(!t.entity&&!this.isInTestMode()){this._config=t;return}this._config=t}set hass(t){let e=!!this._hass;this._hass=t;let[i,s]=this.getResolution();e?(i!==this._width||s!==this._height)&&(this._width=i,this._height=s,this._logicalCanvas.width=i,this._logicalCanvas.height=s,this.render()):(this._width=i,this._height=s,this._logicalCanvas.width=i,this._logicalCanvas.height=s,this.render())}render(){let t=this.isInTestMode();if(!this._hass&&!t)return;let e=this.getEntity(),i=this.isOn(),[s,o]=this.getResolution(),n=`${this._width}x${this._height}`,r=$(bi,{selected:n,itemClass:"preset-btn",gridClass:"resolution-presets",dataAttr:"res",label:d=>d.label,value:d=>d.value}),a=this._currentColor.toLowerCase(),c=mi.map(d=>`<div class="color-swatch${d.toLowerCase()===a?" active":""}" data-color="${d}" style="background:${d}"></div>`).join("");this.shadowRoot.innerHTML=`
      <style>
        ${A}

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

        .resolution-inputs {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .resolution-inputs input {
          width: 48px;
          padding: 5px 6px;
          background: rgba(255,255,255,0.08);
          border: 1px solid var(--ipixel-border);
          border-radius: 6px;
          color: inherit;
          font-size: 0.85em;
          text-align: center;
        }

        .resolution-inputs span {
          opacity: 0.5;
          font-size: 0.85em;
        }

        .resolution-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 8px;
        }

        .preset-btn {
          padding: 3px 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--ipixel-border);
          border-radius: 4px;
          color: inherit;
          font-size: 0.7em;
          cursor: pointer;
          opacity: 0.7;
        }

        .preset-btn:hover {
          opacity: 1;
          background: rgba(255,255,255,0.12);
        }

        .preset-btn.active {
          border-color: var(--ipixel-primary);
          opacity: 1;
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
              <span class="status-dot ${i?"":"off"}"></span>
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
            <div class="resolution-inputs">
              <input type="number" id="res-width" value="${this._width}" min="1" max="512" title="Width">
              <span>\xD7</span>
              <input type="number" id="res-height" value="${this._height}" min="1" max="512" title="Height">
            </div>
          </div>

          ${r}

          <div class="color-palette" id="palette">
            ${c}
          </div>

          <!-- Canvas -->
          <div class="canvas-container">
            <canvas id="editor-canvas"></canvas>
          </div>

          <!-- Info -->
          <div class="info-row">
            <span>Tool: ${this._tool} | Grid: ${this._gridOn?"LED":"Flat"}</span>
            <span>Device: ${s}\xD7${o}</span>
          </div>

          <!-- Actions -->
          <div class="button-grid button-grid-3">
            <button class="btn btn-secondary" id="clear-btn">Clear</button>
            <button class="btn btn-secondary" id="import-btn">Import</button>
            <button class="btn btn-primary send-btn" id="send-btn" ${this._sending?"disabled":""}>
              ${this._sending?"Sending...":t?"Preview Only":"Send to Device"}
            </button>
          </div>

          <!-- Hidden file input for import -->
          <input type="file" id="file-input" accept="image/png,image/gif,image/jpeg" style="display:none">
        </div>
      </ha-card>
    `,this._initCanvas(),this._attachListeners()}_initCanvas(){this._displayCanvas=this.shadowRoot.getElementById("editor-canvas"),this._displayCanvas&&(this._dctx=this._displayCanvas.getContext("2d"),(this._logicalCanvas.width!==this._width||this._logicalCanvas.height!==this._height)&&(this._logicalCanvas.width=this._width,this._logicalCanvas.height=this._height),this._updateDisplaySize(),this._renderDisplay(),this._initialized=!0)}_updateDisplaySize(){this._displayCanvas&&(this._displayCanvas.width=this._width*this._scale,this._displayCanvas.height=this._height*this._scale)}_renderDisplay(){if(!this._dctx||!this._ctx)return;this._updateDisplaySize(),this._dctx.fillStyle="#050608",this._dctx.fillRect(0,0,this._displayCanvas.width,this._displayCanvas.height);let t=this._ctx.getImageData(0,0,this._width,this._height).data,e=this._scale,i=e*.38;for(let s=0;s<this._height;s++)for(let o=0;o<this._width;o++){let n=(s*this._width+o)*4,r=t[n],a=t[n+1],c=t[n+2],h=t[n+3]===0,f=o*e,p=s*e,u=f+e/2,g=p+e/2;if(this._dctx.fillStyle=`rgb(${Q.r},${Q.g},${Q.b})`,this._dctx.fillRect(f,p,e,e),this._gridOn)if(h)this._dctx.fillStyle="rgb(5,5,5)",this._dctx.beginPath(),this._dctx.arc(u,g,i,0,Math.PI*2),this._dctx.fill();else{let b=this._dctx.createRadialGradient(u,g,i*.3,u,g,i*1.8);b.addColorStop(0,`rgba(${r},${a},${c},0.4)`),b.addColorStop(1,`rgba(${r},${a},${c},0)`),this._dctx.fillStyle=b,this._dctx.beginPath(),this._dctx.arc(u,g,i*1.8,0,Math.PI*2),this._dctx.fill(),this._dctx.fillStyle=`rgb(${r},${a},${c})`,this._dctx.beginPath(),this._dctx.arc(u,g,i,0,Math.PI*2),this._dctx.fill()}else h?this._dctx.fillStyle=`rgb(${Q.r},${Q.g},${Q.b})`:this._dctx.fillStyle=`rgb(${r},${a},${c})`,this._dctx.fillRect(f,p,e,e)}}_getPixelPos(t){if(!this._displayCanvas)return null;let e=this._displayCanvas.getBoundingClientRect(),i=e.width/this._width,s=e.height/this._height,o=t.touches?t.touches[0].clientX:t.clientX,n=t.touches?t.touches[0].clientY:t.clientY,r=Math.floor((o-e.left)/i),a=Math.floor((n-e.top)/s);return r<0||a<0||r>=this._width||a>=this._height?null:{x:r,y:a}}_drawAt(t){let e=this._getPixelPos(t);e&&(this._tool==="pen"?(this._ctx.fillStyle=this._currentColor,this._ctx.fillRect(e.x,e.y,1,1)):this._ctx.clearRect(e.x,e.y,1,1),this._renderDisplay())}_attachListeners(){let t=this.shadowRoot.getElementById("editor-canvas");if(!t)return;t.addEventListener("mousedown",i=>{i.preventDefault(),this._drawing=!0,this._drawAt(i)}),t.addEventListener("mousemove",i=>{this._drawing&&this._drawAt(i)}),window.addEventListener("mouseup",()=>{this._drawing=!1}),t.addEventListener("touchstart",i=>{i.preventDefault(),this._drawing=!0,this._drawAt(i)},{passive:!1}),t.addEventListener("touchmove",i=>{i.preventDefault(),this._drawing&&this._drawAt(i)},{passive:!1}),t.addEventListener("touchend",()=>{this._drawing=!1}),this.shadowRoot.getElementById("pen-tool")?.addEventListener("click",()=>{this._tool="pen",this.render()}),this.shadowRoot.getElementById("eraser-tool")?.addEventListener("click",()=>{this._tool="eraser",this.render()}),this.shadowRoot.getElementById("color-picker")?.addEventListener("input",i=>{this._currentColor=i.target.value,this._updatePaletteSelection()}),this.shadowRoot.querySelectorAll(".color-swatch").forEach(i=>{i.addEventListener("click",()=>{this._currentColor=i.dataset.color,this.shadowRoot.getElementById("color-picker").value=this._currentColor,this._updatePaletteSelection()})}),this.shadowRoot.getElementById("grid-toggle")?.addEventListener("click",()=>{this._gridOn=!this._gridOn,this.render()});let e=()=>{let i=parseInt(this.shadowRoot.getElementById("res-width")?.value,10),s=parseInt(this.shadowRoot.getElementById("res-height")?.value,10);i>0&&s>0&&(i!==this._width||s!==this._height)&&this._resizeCanvas(i,s)};this.shadowRoot.getElementById("res-width")?.addEventListener("change",e),this.shadowRoot.getElementById("res-height")?.addEventListener("change",e),P(this.shadowRoot,".preset-btn",{attr:"res",onSelect:i=>{let[s,o]=i.split("x").map(a=>parseInt(a,10));this._resizeCanvas(s,o);let n=this.shadowRoot.getElementById("res-width"),r=this.shadowRoot.getElementById("res-height");n&&(n.value=s),r&&(r.value=o)}}),this.shadowRoot.getElementById("clear-btn")?.addEventListener("click",()=>{this._clearCanvas()}),this.shadowRoot.getElementById("import-btn")?.addEventListener("click",()=>{this.shadowRoot.getElementById("file-input")?.click()}),this.shadowRoot.getElementById("file-input")?.addEventListener("change",i=>{let s=i.target.files?.[0];s&&this._handleImport(s)}),this.shadowRoot.getElementById("send-btn")?.addEventListener("click",()=>{this._sendToDevice()})}_updatePaletteSelection(){this.shadowRoot.querySelectorAll(".color-swatch").forEach(t=>{t.dataset.color.toLowerCase()===this._currentColor.toLowerCase()?t.classList.add("active"):t.classList.remove("active")})}_resizeCanvas(t,e){let i=this._ctx.getImageData(0,0,this._width,this._height);this._width=t,this._height=e,this._logicalCanvas.width=t,this._logicalCanvas.height=e,this._ctx.putImageData(i,0,0),this._updateDisplaySize(),this._renderDisplay();let s=this.shadowRoot.querySelector(".info-row span:first-child");s&&(s.textContent=`Tool: ${this._tool} | Grid: ${this._gridOn?"LED":"Flat"}`)}_clearCanvas(){this._ctx.clearRect(0,0,this._width,this._height),this._renderDisplay()}_handleImport(t){let e=new FileReader;e.onload=i=>{let s=new Image;s.onload=()=>{this._ctx.clearRect(0,0,this._width,this._height),this._ctx.imageSmoothingEnabled=!1,this._ctx.drawImage(s,0,0,this._width,this._height),this._renderDisplay()},s.src=i.target.result},e.readAsDataURL(t)}async _sendToDevice(){if(!this._sending){this._sending=!0,this.render();try{let t=this._ctx.getImageData(0,0,this._width,this._height).data,e=[];for(let i=0;i<this._height;i++)for(let s=0;s<this._width;s++){let o=(i*this._width+s)*4,n=t[o],r=t[o+1],a=t[o+2];t[o+3]>0&&e.push({x:s,y:i,color:this.rgbToHex(n,r,a).slice(1)})}e.length>0&&await this.callService("ipixel_color","set_pixels",{pixels:e})}catch(t){console.error("Failed to send pixels to device:",t)}finally{this._sending=!1,this.render()}}}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}getCardSize(){return 4}};var Ms=X.prototype.playFrames,Se=typeof window<"u"&&(typeof window.hassConnection<"u"||document.querySelector("home-assistant")!==null),Zt=Se?"/ipixel_color/gallery":`${window.location.pathname.substring(0,window.location.pathname.lastIndexOf("/")+1)}gallery`,tt=F("iPIXEL_UserGIFs",()=>[]),_i=[{id:"browse",label:"Browse"},{id:"upload",label:"Upload"}],Dt=class extends O{constructor(){super(),this._activeTab="browse",this._manifest=null,this._loading=!1,this._selectedSize=null,this._filter="all",this._sending=null,this._slotMode=!1,this._targetSlot=1,this._dragOver=!1}connectedCallback(){this._loadManifest()}async _loadManifest(){if(!this._manifest){this._loading=!0,this.render();try{let t=await fetch(`${Zt}/manifest.json`);this._manifest=await t.json(),this._autoSelectSize()}catch(t){console.error("iPIXEL Gallery: Failed to load manifest",t),this._manifest={}}this._loading=!1,this.render()}}_autoSelectSize(){if(!this._manifest)return;let[t,e]=this.getResolution(),i=`${t}x${e}`;if(this._manifest[i])this._selectedSize=i;else{let s=Object.keys(this._manifest);this._selectedSize=s.length>0?s[0]:null}}_getSortedSizes(){return this._manifest?Object.keys(this._manifest).sort((t,e)=>{let[i,s]=t.split("x").map(Number),[o,n]=e.split("x").map(Number);return s-n||i-o}):[]}_getItems(){let t=tt.load();if(!this._manifest||!this._selectedSize)return this._filter==="user"||this._filter==="all"?t.map(o=>({...o,type:"user"})):[];let e=this._manifest[this._selectedSize],i=[];return this._filter!=="user"&&((this._filter==="all"||this._filter==="animations")&&(e?.animations||[]).forEach(o=>i.push({...o,type:"bundled"})),(this._filter==="all"||this._filter==="eyes")&&(e?.eyes||[]).forEach(o=>i.push({...o,type:"bundled"}))),[...this._filter==="all"||this._filter==="user"?t.map(o=>({...o,type:"user"})):[],...i]}async _playGifOnPreview(t){let i=document.querySelector("ipixel-display-card")?._renderer;if(!i){console.warn("iPIXEL Gallery: No display renderer found for preview");return}let s=120,o=i.width,n=i.height;try{let a=await(await fetch(t)).blob(),{frames:c,avgDelay:d}=await this._decodeGifFrames(a,o,n,s);i.stopFrames?.(),i.stop(),c.length>1&&i.playFrames?i.playFrames(c,Math.max(20,d)):c.length>0&&(i.setData(c[0]),i.setEffect("fixed",50),i.renderStatic())}catch(r){console.error("iPIXEL Gallery: GIF preview failed",r)}}async _decodeGifFrames(t,e,i,s){let o=[],n=100,r=(a,c,d,h)=>h<128?"#000000":"#"+a.toString(16).padStart(2,"0")+c.toString(16).padStart(2,"0")+d.toString(16).padStart(2,"0");if(typeof ImageDecoder<"u"){let a=new ImageDecoder({data:await t.arrayBuffer(),type:"image/gif"});await a.tracks.ready;let c=Math.min(a.tracks.selectedTrack.frameCount,s),h=new OffscreenCanvas(e,i).getContext("2d",{willReadFrequently:!0});for(let f=0;f<c;f++){let p=await a.decode({frameIndex:f});h.imageSmoothingEnabled=!1,h.clearRect(0,0,e,i),h.drawImage(p.image,0,0,e,i),f===0&&p.image.duration&&(n=p.image.duration/1e3);let u=h.getImageData(0,0,e,i).data,g=[];for(let b=0;b<e*i;b++)g.push(r(u[b*4],u[b*4+1],u[b*4+2],u[b*4+3]));o.push(g),p.image.close()}a.close()}else{let a=new Image;a.src=URL.createObjectURL(t),await new Promise((p,u)=>{a.onload=p,a.onerror=u});let c=document.createElement("canvas");c.width=e,c.height=i;let d=c.getContext("2d");d.imageSmoothingEnabled=!1,d.drawImage(a,0,0,e,i);let h=d.getImageData(0,0,e,i).data,f=[];for(let p=0;p<e*i;p++)f.push(r(h[p*4],h[p*4+1],h[p*4+2],h[p*4+3]));o.push(f),URL.revokeObjectURL(a.src)}return{frames:o,avgDelay:n}}async _sendToDevice(t){this._sending=t.name||t.file,this.render();let e=t.type==="user"?t.dataUrl:`${Zt}/${this._selectedSize}/${t.file}`;(t.type==="user"||Se)&&this._playGifOnPreview(e);try{if(t.type==="user")await this._sendUserGif(t);else{let i={size:this._selectedSize,filename:t.file};this._slotMode&&(i.buffer_slot=this._targetSlot),await this.callService("ipixel_color","display_local_gallery",i)}}catch(i){console.error("iPIXEL Gallery: Send failed",i)}this._sending=null,this.render()}async _sendUserGif(t){let i=await(await fetch(t.dataUrl)).blob();if(window.iPIXEL_BLE&&window.iPIXEL_BLE.isConnected()){let s=new Uint8Array(await i.arrayBuffer()),o=this._slotMode?this._targetSlot:1;await window.iPIXEL_BLE.saveGifToSlot(o,s)}else{console.warn("iPIXEL Gallery: User GIF send requires BLE connection or HA backend support");let s={gif_url:t.dataUrl};this._slotMode&&(s.buffer_slot=this._targetSlot),await this.callService("ipixel_color","upload_gif",s)}}_handleFiles(t){let e=tt.load(),i=0,s=0;for(let o of t){if(!o.type.startsWith("image/"))continue;i++;let n=new FileReader;n.onload=()=>{let r=e.findIndex(c=>c.name===o.name),a={name:o.name,dataUrl:n.result,addedAt:Date.now()};r>=0?e[r]=a:e.push(a),++s===i&&(tt.save(e),this.render())},n.readAsDataURL(o)}}render(){let t=this.isInTestMode();if(!this._hass&&!t)return;let e=this._activeTab;this.shadowRoot.innerHTML=`
      <style>${A}
        .gallery-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px; margin-top: 12px;
        }
        .gallery-item {
          position: relative; background: #000;
          border: 2px solid rgba(255,255,255,0.1); border-radius: 8px;
          overflow: hidden; cursor: pointer; transition: all 0.2s;
          aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
        }
        .gallery-item:hover { border-color: var(--ipixel-primary); transform: scale(1.05); }
        .gallery-item.sending { border-color: var(--ipixel-accent); opacity: 0.7; }
        .gallery-item.user-gif { border-color: rgba(255,152,0,0.3); }
        .gallery-item img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; }
        .item-label {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(0,0,0,0.7);
          font-size: 0.6em; padding: 2px 4px; text-align: center;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sending-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75em; color: var(--ipixel-accent);
        }
        .delete-btn {
          position: absolute; top: 2px; right: 2px;
          width: 18px; height: 18px;
          background: rgba(244,67,54,0.8); border: none; border-radius: 50%;
          color: #fff; font-size: 11px; line-height: 18px; text-align: center;
          cursor: pointer; display: none; padding: 0;
        }
        .gallery-item:hover .delete-btn { display: block; }
        .filter-row, .size-select { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        .filter-btn, .size-btn {
          padding: 5px 12px;
          border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
          background: rgba(255,255,255,0.05); color: inherit;
          cursor: pointer; font-size: 0.75em; transition: all 0.2s;
        }
        .size-btn { padding: 4px 10px; border-radius: 12px; font-size: 0.7em; }
        .filter-btn:hover, .size-btn:hover { background: rgba(255,255,255,0.1); }
        .filter-btn.active, .size-btn.active { background: rgba(3,169,244,0.25); border-color: var(--ipixel-primary); }
        .size-btn.match { border-color: rgba(76,175,80,0.5); }
        .slot-row {
          display: flex; gap: 8px; align-items: center;
          margin-top: 8px; padding: 8px 12px;
          background: rgba(255,255,255,0.03); border-radius: 8px;
        }
        .slot-row label { font-size: 0.8em; opacity: 0.7; white-space: nowrap; }
        .slot-row select {
          padding: 4px 8px; background: rgba(255,255,255,0.08);
          border: 1px solid var(--ipixel-border); border-radius: 4px;
          color: inherit; font-size: 0.8em;
        }
        .slot-row .toggle-switch { width: 36px; height: 20px; }
        .slot-row .toggle-switch::after { width: 16px; height: 16px; }
        .slot-row .toggle-switch.active::after { transform: translateX(16px); }
        .drop-zone {
          border: 2px dashed rgba(255,255,255,0.2);
          border-radius: 10px; padding: 16px; text-align: center;
          margin-top: 12px; transition: all 0.2s; cursor: pointer;
        }
        .drop-zone:hover, .drop-zone.drag-over {
          border-color: var(--ipixel-primary); background: rgba(3,169,244,0.05);
        }
        .drop-zone-text { font-size: 0.8em; opacity: 0.6; }
        .drop-zone-text svg { display: block; margin: 0 auto 6px; opacity: 0.4; }
        .drop-zone input[type="file"] { display: none; }
        .gallery-count { font-size: 0.75em; opacity: 0.5; margin-left: auto; }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" width="20" height="20" style="fill: currentColor; opacity: 0.7;">
                <path d="M22,16V4A2,2 0 0,0 20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16M11,12L13.03,14.71L16,11L20,16H8M2,6V20A2,2 0 0,0 4,22H18V20H4V6" />
              </svg>
              Gallery
              <span class="gallery-count">${this._getItems().length} items</span>
            </div>
          </div>

          ${H(_i,e)}
          ${R("browse",e==="browse",this._renderBrowseTab())}
          ${R("upload",e==="upload",this._renderUploadTab())}
        </div>
      </ha-card>`,this._attachListeners()}_renderBrowseTab(){if(this._loading)return'<div class="empty-state">Loading gallery...</div>';let t=this._getSortedSizes(),e=this._manifest?.[this._selectedSize],i=(e?.animations?.length||0)>0,s=(e?.eyes?.length||0)>0,o=tt.load(),[n,r]=this.getResolution(),a=t.map(d=>({value:d,name:d,isMatch:d===`${n}x${r}`})),c=[{value:"all",name:"All",show:!0},{value:"animations",name:"Animations",show:i},{value:"eyes",name:"Eyes",show:s},{value:"user",name:`My GIFs${o.length?` (${o.length})`:""}`,show:!0}].filter(d=>d.show);return`
      ${t.length>0?`
        <div class="section-title">Display Size</div>
        ${$(a,{selected:this._selectedSize,itemClass:"size-btn",gridClass:"size-select",dataAttr:"size",extraClass:d=>d.isMatch?"match":""})}
      `:""}

      ${$(c,{selected:this._filter,itemClass:"filter-btn",gridClass:"filter-row",dataAttr:"filter"})}

      ${this._renderGalleryItems()}`}_renderUploadTab(){return`
      <div class="section-title">Upload GIFs</div>
      <div class="drop-zone${this._dragOver?" drag-over":""}" id="drop-zone">
        <div class="drop-zone-text">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
          </svg>
          Drop GIF/image files here or tap to upload
        </div>
        <input type="file" id="file-input" accept="image/*,.gif" multiple>
      </div>

      <div class="section-title" style="margin-top: 16px;">Destination</div>
      <div class="slot-row">
        ${B({id:"slot-toggle",active:this._slotMode})}
        <label>Save to slot</label>
        <select id="target-slot" ${this._slotMode?"":"disabled"}>
          ${[1,2,3,4,5,6,7,8,9].map(t=>`<option value="${t}"${t===this._targetSlot?" selected":""}>Slot ${t}</option>`).join("")}
        </select>
      </div>`}_renderGalleryItems(){let t=this._getItems();return t.length===0?`<div class="empty-state">
        ${this._filter==="user"?"No uploaded GIFs yet. Use the Upload tab to add some!":"No items for this filter."}
      </div>`:`<div class="gallery-grid">${t.map(e=>{let i=e.name||e.file,s=this._sending===i,o=e.type==="user",n=o?e.name.replace(/\.[^.]+$/,""):e.side?`Eye ${e.side.toUpperCase()} #${e.num}`:`#${e.num}`,r=o?e.dataUrl:`${Zt}/${this._selectedSize}/${e.file}`;return`
        <div class="gallery-item${s?" sending":""}${o?" user-gif":""}"
             data-id="${i}" data-type="${e.type}" title="${this.escapeHtml(i)}">
          <img src="${r}" loading="lazy" alt="${this.escapeHtml(n)}">
          <div class="item-label">${this.escapeHtml(n)}</div>
          ${o?`<button class="delete-btn" data-delete="${this.escapeHtml(e.name)}">x</button>`:""}
          ${s?'<div class="sending-overlay">Sending...</div>':""}
        </div>`}).join("")}</div>`}_attachListeners(){N(this.shadowRoot,e=>{this._activeTab=e,this.render()}),P(this.shadowRoot,".size-btn",{onSelect:e=>{this._selectedSize=e,this._filter="all",this.render()},attr:"size"}),P(this.shadowRoot,".filter-btn",{onSelect:e=>{this._filter=e,this.render()},attr:"filter"}),z(this.shadowRoot,"slot-toggle",e=>{this._slotMode=e,this.render()}),this.shadowRoot.getElementById("target-slot")?.addEventListener("change",e=>{this._targetSlot=parseInt(e.target.value)});let t=this.shadowRoot.getElementById("drop-zone");t&&(t.addEventListener("dragover",e=>{e.preventDefault(),e.stopPropagation(),this._dragOver||(this._dragOver=!0,t.classList.add("drag-over"))}),t.addEventListener("dragleave",e=>{e.preventDefault(),e.stopPropagation(),this._dragOver=!1,t.classList.remove("drag-over")}),t.addEventListener("drop",e=>{e.preventDefault(),e.stopPropagation(),this._dragOver=!1,e.dataTransfer?.files?.length&&this._handleFiles(e.dataTransfer.files)}),t.addEventListener("click",()=>{this.shadowRoot.getElementById("file-input")?.click()})),this.shadowRoot.getElementById("file-input")?.addEventListener("change",e=>{e.target.files?.length&&this._handleFiles(e.target.files)}),this.shadowRoot.querySelectorAll(".gallery-item").forEach(e=>{e.addEventListener("click",i=>{if(i.target.classList.contains("delete-btn"))return;let s=e.dataset.id,o=this._getItems().find(n=>(n.name||n.file)===s);o&&!this._sending&&this._sendToDevice(o)})}),this.shadowRoot.querySelectorAll("[data-delete]").forEach(e=>{e.addEventListener("click",i=>{i.stopPropagation();let s=i.currentTarget.dataset.delete,o=tt.load().filter(n=>n.name!==s);tt.save(o),this.render()})})}static getConfigElement(){return document.createElement("ipixel-simple-editor")}static getStubConfig(){return{entity:""}}};var Ft=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}setConfig(t){this._config=t,this.render()}set hass(t){this._hass=t,this.render()}render(){if(!this._hass)return;let t=Object.keys(this._hass.states).filter(e=>e.startsWith("text.")||e.startsWith("switch.")).sort();this.shadowRoot.innerHTML=`
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
          ${t.map(e=>`
            <option value="${e}" ${this._config?.entity===e?"selected":""}>
              ${this._hass.states[e]?.attributes?.friendly_name||e}
            </option>
          `).join("")}
        </select>
      </div>
      <div class="row">
        <label>Name (optional)</label>
        <input type="text" id="name" value="${this._config?.name||""}" placeholder="Display name">
      </div>`,this.shadowRoot.querySelectorAll("select, input").forEach(e=>{e.addEventListener("change",()=>this.fireConfig())})}fireConfig(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:{type:this._config?.type||"custom:ipixel-display-card",entity:this.shadowRoot.getElementById("entity")?.value,name:this.shadowRoot.getElementById("name")?.value||void 0}},bubbles:!0,composed:!0}))}};customElements.define("ipixel-display-card",kt);customElements.define("ipixel-controls-card",$t);customElements.define("ipixel-text-card",Rt);customElements.define("ipixel-playlist-card",Lt);customElements.define("ipixel-schedule-card",Ot);customElements.define("ipixel-editor-card",At);customElements.define("ipixel-gallery-card",Dt);customElements.define("ipixel-simple-editor",Ft);window.customCards=window.customCards||[];[{type:"ipixel-display-card",name:"iPIXEL Display",description:"LED matrix preview with power control"},{type:"ipixel-controls-card",name:"iPIXEL Controls",description:"Brightness, mode, and orientation controls"},{type:"ipixel-text-card",name:"iPIXEL Text",description:"Text input with effects and colors"},{type:"ipixel-playlist-card",name:"iPIXEL Playlist",description:"Playlist management"},{type:"ipixel-schedule-card",name:"iPIXEL Schedule",description:"Power schedule and time slots"},{type:"ipixel-editor-card",name:"iPIXEL Pixel Editor",description:"Draw custom pixel art and send to your LED matrix"},{type:"ipixel-gallery-card",name:"iPIXEL Gallery",description:"Browse and send bundled animations to your LED matrix"}].forEach(l=>window.customCards.push({...l,preview:!0,documentationURL:"https://github.com/cagcoach/ha-ipixel-color"}));console.info(`%c iPIXEL Cards %c ${re} `,"background:#03a9f4;color:#fff;padding:2px 6px;border-radius:4px 0 0 4px;","background:#333;color:#fff;padding:2px 6px;border-radius:0 4px 4px 0;");})();

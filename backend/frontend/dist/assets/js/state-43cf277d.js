import{r as b,g as O,a as P}from"./vendor-e048df97.js";import"./ui-f6ae44f1.js";const V=e=>{let t;const o=new Set,n=(s,l)=>{const i=typeof s=="function"?s(t):s;if(!Object.is(i,t)){const a=t;t=(l!=null?l:typeof i!="object"||i===null)?i:Object.assign({},t,i),o.forEach(c=>c(t,a))}},r=()=>t,_={setState:n,getState:r,getInitialState:()=>I,subscribe:s=>(o.add(s),()=>o.delete(s)),destroy:()=>{o.clear()}},I=t=e(n,r,_);return _},R=e=>e?V(e):V;var m={exports:{}},A={},D={exports:{}},y={};/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var f=b;function h(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var M=typeof Object.is=="function"?Object.is:h,g=f.useState,L=f.useEffect,U=f.useLayoutEffect,w=f.useDebugValue;function B(e,t){var o=t(),n=g({inst:{value:o,getSnapshot:t}}),r=n[0].inst,u=n[1];return U(function(){r.value=o,r.getSnapshot=t,v(r)&&u({inst:r})},[e,o,t]),L(function(){return v(r)&&u({inst:r}),e(function(){v(r)&&u({inst:r})})},[e]),w(o),o}function v(e){var t=e.getSnapshot;e=e.value;try{var o=t();return!M(e,o)}catch(n){return!0}}function N(e,t){return t()}var C=typeof window=="undefined"||typeof window.document=="undefined"||typeof window.document.createElement=="undefined"?N:B;y.useSyncExternalStore=f.useSyncExternalStore!==void 0?f.useSyncExternalStore:C;D.exports=y;var j=D.exports;/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var S=b,$=j;function F(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var x=typeof Object.is=="function"?Object.is:F,W=$.useSyncExternalStore,z=S.useRef,G=S.useEffect,K=S.useMemo,X=S.useDebugValue;A.useSyncExternalStoreWithSelector=function(e,t,o,n,r){var u=z(null);if(u.current===null){var E={hasValue:!1,value:null};u.current=E}else E=u.current;u=K(function(){function _(a){if(!I){if(I=!0,s=a,a=n(a),r!==void 0&&E.hasValue){var c=E.value;if(r(c,a))return l=c}return l=a}if(c=l,x(s,a))return c;var T=n(a);return r!==void 0&&r(c,T)?(s=a,c):(s=a,l=T)}var I=!1,s,l,i=o===void 0?null:o;return[function(){return _(t())},i===null?void 0:function(){return _(i())}]},[t,o,n,r]);var d=W(e,u[0],u[1]);return G(function(){E.hasValue=!0,E.value=d},[d]),X(d),d};m.exports=A;var Z=m.exports;const q=O(Z),{useDebugValue:k}=P,{useSyncExternalStoreWithSelector:H}=q;const J=e=>e;function Q(e,t=J,o){const n=H(e.subscribe,e.getState,e.getServerState||e.getInitialState,t,o);return k(n),n}const p=e=>{const t=typeof e=="function"?R(e):e,o=(n,r)=>Q(t,n,r);return Object.assign(o,t),o},te=e=>e?p(e):p;export{te as c};

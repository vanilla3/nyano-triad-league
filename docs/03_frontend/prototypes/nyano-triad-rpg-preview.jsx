import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   Nyano Triad League — RPG Theme Live Preview
   Complete interactive demo of the fantasy RPG board
   ═══════════════════════════════════════════════════════════════ */

// ── Design Tokens ──
const T = {
  frameDark: "#3D2B1F", frameMid: "#5C3D2E", frameLight: "#8B6914",
  frameGold: "#C9A84C", frameGoldBright: "#E8D48B", boardBg: "#2A1F14",
  cellStone: "#C4B59B", cellStoneDark: "#A99E85", cellStoneLight: "#D4C8AF", cellBorder: "#8B7B5E",
  pA: "#38A1E8", pALight: "#5EC4FF", pADark: "#1B6FA8", pAGlow: "rgba(56,161,232,0.6)", pABg: "#1A3A5C", pABgLight: "rgba(56,161,232,0.15)",
  pB: "#E8466A", pBLight: "#FF6B8A", pBDark: "#B8294A", pBGlow: "rgba(232,70,106,0.6)", pBBg: "#5C1A2A", pBBgLight: "rgba(232,70,106,0.15)",
  flip: "#F5A623", flipGlow: "rgba(245,166,35,0.5)", chain: "#9B59FF", chainGlow: "rgba(155,89,255,0.5)",
  victory: "#27AE60", defeat: "#C0392B",
  textGold: "#E8D48B", textLight: "#F5F0E1", textDim: "#8A7E6B",
  turnBannerA: "#1A4A7C", turnBannerB: "#7C1A2A", hp: "#E84646", hpBg: "#3D1A1A",
};
const fontD = "'Cinzel','Playfair Display',serif";
const fontU = "'Nunito',system-ui,sans-serif";
const fontM = "'JetBrains Mono',monospace";

// ── Card Data ──
const CA = [
  { id:1001, edges:{up:7,right:8,down:3,left:5}, j:0, trait:"flame", pw:23 },
  { id:1002, edges:{up:4,right:6,down:9,left:2}, j:1, trait:"aqua", pw:21 },
  { id:1003, edges:{up:6,right:5,down:5,left:8}, j:2, trait:"shadow", pw:24 },
  { id:1004, edges:{up:8,right:3,down:4,left:7}, j:0, trait:"light", pw:22 },
  { id:1005, edges:{up:3,right:7,down:6,left:5}, j:1, trait:"wind", pw:21 },
];
const CB = [
  { id:2001, edges:{up:5,right:7,down:4,left:6}, j:2, trait:"shadow", pw:22 },
  { id:2002, edges:{up:9,right:4,down:3,left:5}, j:0, trait:"cosmic", pw:21 },
  { id:2003, edges:{up:3,right:8,down:7,left:4}, j:1, trait:"thunder", pw:22 },
  { id:2004, edges:{up:6,right:5,down:8,left:3}, j:2, trait:"wind", pw:22 },
  { id:2005, edges:{up:4,right:6,down:5,left:9}, j:0, trait:"flame", pw:24 },
];

const JK = { 0: "✊", 1: "✋", 2: "✌️" };
const TC = {
  flame:{bg:"#8B2500",icon:"🔥",glow:"#FF4500"}, aqua:{bg:"#004466",icon:"💧",glow:"#00BFFF"},
  shadow:{bg:"#1A1A2E",icon:"☾",glow:"#6B5B95"}, light:{bg:"#5C4A00",icon:"☀",glow:"#FFD700"},
  cosmic:{bg:"#2D1B4E",icon:"✦",glow:"#9B59FF"}, wind:{bg:"#1A4A3A",icon:"🍃",glow:"#2ECC71"},
  thunder:{bg:"#4A4A00",icon:"⚡",glow:"#F1C40F"}, earth:{bg:"#4A2A0A",icon:"🪨",glow:"#D4A017"},
  metal:{bg:"#2A2A3A",icon:"⚙",glow:"#95A5A6"}, forest:{bg:"#0A3A1A",icon:"🌿",glow:"#27AE60"},
  none:{bg:"#3A3A3A",icon:"—",glow:"#888"},
};

const MOVES = [
  {cell:4,ci:0,o:0},{cell:0,ci:0,o:1},{cell:2,ci:1,o:0,f:[0]},{cell:6,ci:1,o:1},
  {cell:8,ci:2,o:0,f:[6]},{cell:1,ci:2,o:1,f:[4,2]},{cell:3,ci:3,o:0},{cell:5,ci:3,o:1,f:[4]},{cell:7,ci:4,o:0,f:[8,6]},
];
const COORDS=["A1","B1","C1","A2","B2","C2","A3","B3","C3"];

/* ── Candle ── */
function Candle({s=1}){
  return(
    <div style={{position:"relative",width:24*s,height:60*s,display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{width:12*s,height:18*s,background:"radial-gradient(ellipse at 50% 80%,#FFD700 0%,#FF8C00 40%,#FF4500 70%,transparent 100%)",borderRadius:"50% 50% 50% 50%/60% 60% 40% 40%",animation:`flicker ${1.5+Math.random()}s ease-in-out infinite alternate`,filter:"blur(0.5px)",position:"relative"}}>
        <div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:6*s,height:10*s,background:"radial-gradient(ellipse,#FFF8DC 0%,#FFD700 60%,transparent 100%)",borderRadius:"50% 50% 50% 50%/60% 60% 40% 40%"}}/>
      </div>
      <div style={{position:"absolute",top:-8*s,left:"50%",transform:"translateX(-50%)",width:40*s,height:40*s,background:"radial-gradient(circle,rgba(255,180,50,0.3) 0%,transparent 70%)",animation:`flickerGlow ${2+Math.random()}s ease-in-out infinite alternate`,pointerEvents:"none"}}/>
      <div style={{width:10*s,height:32*s,background:"linear-gradient(to right,#D4C4A0,#F0E6CC,#D4C4A0)",borderRadius:"3px 3px 2px 2px"}}/>
      <div style={{width:18*s,height:6*s,background:"linear-gradient(to bottom,#8B7355,#6B5B45)",borderRadius:"0 0 4px 4px"}}/>
    </div>
  );
}

/* ── PlayerHUD ── */
function PlayerHUD({player,name,score,maxHP=100,hp,isActive}){
  const c=player===0?{main:T.pA,dark:T.pADark,glow:T.pAGlow,bg:T.pABg}:{main:T.pB,dark:T.pBDark,glow:T.pBGlow,bg:T.pBBg};
  const hpPct=Math.max(0,Math.min(100,(hp/maxHP)*100));
  return(
    <div style={{flex:1,display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,background:"linear-gradient(135deg,rgba(0,0,0,0.6),rgba(0,0,0,0.4))",border:`1px solid ${isActive?c.main:"rgba(201,168,76,0.2)"}`,boxShadow:isActive?`0 0 16px ${c.glow}`:"none",backdropFilter:"blur(8px)",transition:"all 0.3s"}}>
      <div style={{width:48,height:48,borderRadius:"50%",border:`2px solid ${c.main}`,overflow:"hidden",background:`linear-gradient(135deg,${c.bg},#111)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
        {player===0?"🐱":"🎭"}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:fontD,fontSize:13,fontWeight:700,color:T.textLight,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{name}</div>
        <div style={{position:"relative",height:8,background:T.hpBg,borderRadius:4,marginTop:4,overflow:"hidden",border:"1px solid rgba(255,255,255,0.1)"}}>
          <div style={{height:"100%",width:`${hpPct}%`,borderRadius:3,background:hpPct<=30?`linear-gradient(90deg,#8B0000,${T.hp})`:`linear-gradient(90deg,${c.dark},${c.main})`,transition:"width 0.6s cubic-bezier(0.4,0,0.2,1)"}}/>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:"white",textShadow:"0 1px 2px rgba(0,0,0,0.6)"}}>❤ {hp}/{maxHP}</div>
        </div>
        <div style={{display:"flex",gap:3,marginTop:4}}>
          {Array.from({length:9},(_,i)=>(
            <div key={i} style={{width:12,height:12,borderRadius:3,border:"1px solid rgba(255,255,255,0.15)",background:i<score?c.main:"rgba(255,255,255,0.08)",boxShadow:i<score?`0 0 4px ${c.glow}`:"none",transition:"all 0.3s"}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── VS Emblem ── */
function VSEmblem(){
  return(
    <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${T.frameDark},${T.frameMid})`,border:`2px solid ${T.frameGold}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 12px rgba(201,168,76,0.3)`,flexShrink:0}}>
      <span style={{fontFamily:fontD,fontSize:14,fontWeight:900,color:T.frameGoldBright,textShadow:"0 1px 3px rgba(0,0,0,0.5)"}}>VS</span>
    </div>
  );
}

/* ── Turn Banner ── */
function TurnBanner({player}){
  const bg=player===0?T.turnBannerA:T.turnBannerB;
  return(
    <div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",zIndex:20,padding:"6px 28px",borderRadius:6,background:`linear-gradient(135deg,${bg},${bg}dd)`,border:`1px solid ${T.frameGold}`,fontFamily:fontD,fontSize:12,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:T.textGold,whiteSpace:"nowrap",animation:"slideDown 0.4s ease-out",boxShadow:"0 4px 16px rgba(0,0,0,0.4)"}}>
      <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:8,color:T.frameGold}}>◆</span>
      {player===0?"YOUR TURN":"ENEMY TURN"}
      <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:8,color:T.frameGold}}>◆</span>
    </div>
  );
}

/* ── Edge Orb ── */
function EdgeOrb({val,owner}){
  let bg,col;
  if(val>=8){bg=`linear-gradient(135deg,${T.frameGold},${T.frameGoldBright})`;col=T.frameDark;}
  else if(val>=6){const c=owner===0?T.pA:T.pB;const d=owner===0?T.pADark:T.pBDark;bg=`linear-gradient(135deg,${d},${c})`;col="white";}
  else{bg="rgba(0,0,0,0.3)";col=T.textDim;}
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:"50%",background:bg,color:col,fontSize:11,fontWeight:800,fontFamily:fontD,margin:"auto",boxShadow:val>=8?"0 0 6px rgba(201,168,76,0.5)":"none"}}>
      {val}
    </div>
  );
}

/* ── Board Card ── */
function BoardCard({card,owner}){
  const t=card.trait||"none";
  const tc=TC[t];
  const bg=owner===0?T.pABgLight:T.pBBgLight;
  return(
    <div style={{position:"relative",width:"100%",height:"100%",borderRadius:6,overflow:"hidden",background:bg,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gridTemplateRows:"1fr 1fr 1fr",gap:1}}>
      {t!=="none"&&<div style={{position:"absolute",inset:0,borderRadius:6,background:`radial-gradient(circle,${tc.glow}40 0%,transparent 70%)`,pointerEvents:"none"}}/>}
      <span style={{position:"absolute",top:2,left:3,fontSize:7,fontFamily:fontM,color:T.textDim,opacity:0.6}}>#{String(card.id).slice(-3)}</span>
      {t!=="none"&&<span style={{position:"absolute",top:2,right:3,fontSize:10}}>{tc.icon}</span>}
      <div/><EdgeOrb val={card.edges.up} owner={owner}/><div/>
      <EdgeOrb val={card.edges.left} owner={owner}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{JK[card.j]}</div>
      <EdgeOrb val={card.edges.right} owner={owner}/>
      <div/><EdgeOrb val={card.edges.down} owner={owner}/><div/>
      <span style={{position:"absolute",bottom:2,left:3,fontSize:7,fontWeight:800,fontFamily:fontD,padding:"1px 4px",borderRadius:3,background:owner===0?T.pA:T.pB,color:"white",letterSpacing:0.5}}>
        {owner===0?"A":"B"}
      </span>
    </div>
  );
}

/* ── Hand Card ── */
function HandCard({card,owner,idx,selected,used,onClick}){
  const c=owner===0?{border:T.pA,bg:`linear-gradient(180deg,${T.pABg},#0D1B2A)`}:{border:T.pB,bg:`linear-gradient(180deg,${T.pBBg},#1A0D14)`};
  const t=card.trait||"none";
  return(
    <div style={{position:"relative"}}>
      <div onClick={!used?onClick:undefined} style={{width:68,height:92,borderRadius:8,border:`2px solid ${selected?T.frameGoldBright:c.border}`,background:c.bg,overflow:"hidden",cursor:used?"default":"pointer",transition:"all 0.2s",opacity:used?0.35:1,transform:selected?"translateY(-8px)":used?"scale(0.9)":"none",boxShadow:selected?`0 0 20px rgba(232,212,139,0.4),0 8px 24px rgba(0,0,0,0.4)`:"none",filter:used?"grayscale(0.6)":"none",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gridTemplateRows:"1fr 1fr 1fr",padding:4,gap:1}}>
        <div/><div style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,fontFamily:fontD,color:T.textGold}}>{card.edges.up}</div><div/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,fontFamily:fontD,color:T.textGold}}>{card.edges.left}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{JK[card.j]}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,fontFamily:fontD,color:T.textGold}}>{card.edges.right}</div>
        <div/><div style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,fontFamily:fontD,color:T.textGold}}>{card.edges.down}</div><div/>
      </div>
      {t!=="none"&&<span style={{position:"absolute",bottom:4,right:6,fontSize:9}}>{TC[t].icon}</span>}
      <div style={{position:"absolute",top:-5,right:-5,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"white",border:`2px solid ${T.frameDark}`,background:used?T.textDim:selected?T.frameGold:owner===0?T.pA:T.pB,zIndex:5}}>{idx+1}</div>
    </div>
  );
}

/* ── Turn Log ── */
function TurnLog({entries}){
  const ref=useRef(null);
  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[entries.length]);
  return(
    <div ref={ref} style={{display:"flex",flexDirection:"column",gap:4,padding:8,background:"rgba(0,0,0,0.4)",borderRadius:8,border:"1px solid rgba(201,168,76,0.1)",maxHeight:200,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:`${T.frameGold} transparent`}}>
      <div style={{fontSize:10,fontFamily:fontD,fontWeight:700,color:T.textGold,letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>Battle Log</div>
      {entries.map((e,i)=>{
        const k=e.o===0?"A":"B";const co=COORDS[e.cell];
        return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 6px",borderRadius:4,fontSize:11,fontFamily:fontU,color:T.textLight,background:i%2===0?"rgba(255,255,255,0.03)":"transparent",animation:"fadeInUp 0.3s ease-out"}}>
            <span style={{fontSize:9,fontWeight:800,fontFamily:fontD,padding:"1px 5px",borderRadius:3,color:"white",background:e.o===0?T.pADark:T.pBDark}}>{k}</span>
            <span style={{fontFamily:fontM,fontSize:10}}>{co}</span>
            <span>{JK[e.j]}</span>
            {e.flips>0&&<span style={{color:T.flip,fontWeight:700,fontSize:10}}>⚔ ×{e.flips}</span>}
          </div>
        );
      })}
      {entries.length===0&&<div style={{fontSize:11,color:T.textDim,fontStyle:"italic"}}>Awaiting first move…</div>}
    </div>
  );
}

/* ── Flip Feedback ── */
function FlipFeedback({cell,count}){
  return(
    <div style={{position:"absolute",bottom:-36,left:"50%",transform:"translateX(-50%)",zIndex:30,padding:"4px 12px",borderRadius:6,background:"rgba(0,0,0,0.85)",border:`1px solid ${T.flip}`,fontSize:11,fontFamily:fontU,fontWeight:600,color:T.textLight,whiteSpace:"nowrap",animation:"flipNotify 2.5s ease forwards",pointerEvents:"none"}}>
      <span style={{color:T.flip,marginRight:4}}>⚔</span>{COORDS[cell]} → Flipped {count}!
    </div>
  );
}

/* ── Result Overlay ── */
function ResultOverlay({winner,scoreA,scoreB,onClose}){
  const isA=winner===0;const isDraw=winner==="draw";
  const title=isDraw?"DRAW":isA?"VICTORY":"DEFEAT";
  const titleColor=isDraw?T.textGold:isA?T.victory:T.defeat;
  return(
    <div style={{position:"absolute",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",animation:"fadeIn 0.5s ease"}}>
      <div style={{position:"relative",minWidth:320,padding:32,borderRadius:16,background:`linear-gradient(145deg,${T.frameDark},#1A1208)`,border:`2px solid ${T.frameGold}`,boxShadow:`0 0 40px rgba(201,168,76,0.3)`,animation:"scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <h2 style={{fontFamily:fontD,fontSize:28,fontWeight:900,letterSpacing:3,color:titleColor,textShadow:`0 0 20px ${titleColor}60`,margin:0}}>{title}</h2>
        <p style={{fontFamily:fontU,fontSize:13,color:T.textDim,margin:"4px 0 20px"}}>{isDraw?"A battle of equals":isA?"You have conquered!":"Fight again, warrior"}</p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,marginBottom:24}}>
          <span style={{fontFamily:fontD,fontSize:42,fontWeight:900,color:T.pA,textShadow:`0 0 12px ${T.pAGlow}`}}>{scoreA}</span>
          <span style={{fontFamily:fontD,fontSize:18,color:T.textDim}}>—</span>
          <span style={{fontFamily:fontD,fontSize:42,fontWeight:900,color:T.pB,textShadow:`0 0 12px ${T.pBGlow}`}}>{scoreB}</span>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={onClose} style={{padding:"8px 20px",borderRadius:8,border:`1px solid ${T.frameGold}`,background:`linear-gradient(135deg,${T.frameGold},${T.frameLight})`,color:T.frameDark,fontFamily:fontD,fontSize:13,fontWeight:700,letterSpacing:1,cursor:"pointer"}}>⚔ Rematch</button>
          <button onClick={onClose} style={{padding:"8px 20px",borderRadius:8,border:`1px solid ${T.frameGold}`,background:`linear-gradient(135deg,${T.frameDark},${T.frameMid})`,color:T.textGold,fontFamily:fontD,fontSize:13,fontWeight:700,letterSpacing:1,cursor:"pointer"}}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Particles ── */
function Particles({count=10}){
  const ps=useMemo(()=>Array.from({length:count},(_,i)=>({id:i,left:`${10+Math.random()*80}%`,bottom:`${Math.random()*30}%`,dur:8+Math.random()*6,delay:Math.random()*8,size:2+Math.random()*2})),[count]);
  return(
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:1}}>
      {ps.map(p=><div key={p.id} style={{position:"absolute",width:p.size,height:p.size,borderRadius:"50%",background:T.frameGoldBright,left:p.left,bottom:p.bottom,opacity:0,animation:`floatParticle ${p.dur}s ease-in-out infinite`,animationDelay:`${p.delay}s`}}/>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PREVIEW APP
   ═══════════════════════════════════════════════════════════════ */

export default function NyanoTriadRPGPreview() {
  const [step,setStep]=useState(0);
  const [board,setBoard]=useState(Array(9).fill(null));
  const [usedA,setUsedA]=useState(new Set());
  const [usedB,setUsedB]=useState(new Set());
  const [placed,setPlaced]=useState(null);
  const [flipped,setFlipped]=useState([]);
  const [hpA,setHpA]=useState(100);
  const [hpB,setHpB]=useState(100);
  const [auto,setAuto]=useState(false);
  const [log,setLog]=useState([]);
  const [showResult,setShowResult]=useState(false);
  const [selCard,setSelCard]=useState(null);

  const score=useMemo(()=>{let a=0,b=0;board.forEach(c=>{if(c){c.owner===0?a++:b++;}});return{a,b};},[board]);
  const currentPlayer=step<MOVES.length?MOVES[step].o:null;

  const applyStep=useCallback((s)=>{
    if(s>=MOVES.length)return;
    const m=MOVES[s];
    const card=m.o===0?CA[m.ci]:CB[m.ci];
    setBoard(prev=>{
      const nb=[...prev];
      nb[m.cell]={card,owner:m.o};
      if(m.f){m.f.forEach(fi=>{if(nb[fi])nb[fi]={...nb[fi],owner:m.o};});}
      return nb;
    });
    if(m.o===0)setUsedA(prev=>new Set([...prev,m.ci]));
    else setUsedB(prev=>new Set([...prev,m.ci]));
    setPlaced(m.cell);
    setFlipped(m.f||[]);
    if(m.f&&m.f.length>0){
      const dmg=m.f.length*5;
      if(m.o===0)setHpB(p=>Math.max(0,p-dmg));
      else setHpA(p=>Math.max(0,p-dmg));
    }
    setLog(prev=>[...prev,{o:m.o,cell:m.cell,j:card.j,flips:(m.f||[]).length}]);
    setTimeout(()=>{setPlaced(null);setFlipped([]);},1200);
  },[]);

  const nextStep=useCallback(()=>{
    if(step>=MOVES.length){setShowResult(true);return;}
    applyStep(step);
    setStep(s=>s+1);
  },[step,applyStep]);

  const reset=useCallback(()=>{
    setStep(0);setBoard(Array(9).fill(null));setUsedA(new Set());setUsedB(new Set());
    setPlaced(null);setFlipped([]);setHpA(100);setHpB(100);setLog([]);setShowResult(false);setSelCard(null);
  },[]);

  useEffect(()=>{
    if(!auto||step>=MOVES.length)return;
    const t=setTimeout(()=>nextStep(),1400);
    return()=>clearTimeout(t);
  },[auto,step,nextStep]);

  useEffect(()=>{if(step>=MOVES.length&&!showResult){const t=setTimeout(()=>setShowResult(true),800);return()=>clearTimeout(t);}},  [step,showResult]);

  return(
    <div style={{position:"relative",minHeight:"100vh",background:"linear-gradient(180deg,#0A0A0A 0%,#1A1208 30%,#0D0D0D 100%)",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 12px",gap:14,overflow:"hidden",fontFamily:fontU}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');
        @keyframes flicker{0%,100%{transform:scaleY(1) scaleX(1);opacity:1}25%{transform:scaleY(1.08) scaleX(0.96);opacity:.92}50%{transform:scaleY(.94) scaleX(1.04);opacity:.88}75%{transform:scaleY(1.06) scaleX(.98);opacity:.95}}
        @keyframes flickerGlow{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.5;transform:scale(1.1)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.65}}
        @keyframes cellPop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
        @keyframes cellFlip{0%{transform:rotateY(0) scale(1)}40%{transform:rotateY(90deg) scale(1.06)}70%{transform:rotateY(180deg) scale(1.03)}100%{transform:rotateY(360deg) scale(1)}}
        @keyframes borderGlow{0%,100%{box-shadow:0 0 15px rgba(201,168,76,.3),inset 0 0 15px rgba(201,168,76,.1)}50%{box-shadow:0 0 25px rgba(201,168,76,.5),inset 0 0 25px rgba(201,168,76,.2)}}
        @keyframes floatParticle{0%{transform:translateY(0) translateX(0) scale(0);opacity:0}10%{opacity:.6;transform:scale(1)}90%{opacity:.1}100%{transform:translateY(-120px) translateX(40px) scale(0);opacity:0}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes flipNotify{0%{transform:translateX(20px);opacity:0}15%{transform:translateX(0);opacity:1}85%{opacity:1}100%{opacity:0;transform:translateX(-10px)}}
      `}</style>

      <Particles/>

      {/* Controls */}
      <div style={{display:"flex",gap:8,zIndex:10}}>
        <button onClick={nextStep} disabled={step>=MOVES.length&&showResult} style={{padding:"6px 16px",borderRadius:8,border:`1px solid ${T.frameGold}`,background:`linear-gradient(135deg,${T.frameDark},${T.frameMid})`,color:T.textGold,fontFamily:fontD,fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1}}>▶ Next</button>
        <button onClick={()=>setAuto(a=>!a)} style={{padding:"6px 16px",borderRadius:8,border:`1px solid ${auto?T.flip:T.frameGold}`,background:auto?`linear-gradient(135deg,${T.flip}30,${T.frameDark})`:`linear-gradient(135deg,${T.frameDark},${T.frameMid})`,color:auto?T.flip:T.textGold,fontFamily:fontD,fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1}}>{auto?"⏸ Pause":"⏵ Auto"}</button>
        <button onClick={reset} style={{padding:"6px 16px",borderRadius:8,border:`1px solid ${T.frameGold}`,background:`linear-gradient(135deg,${T.frameDark},${T.frameMid})`,color:T.textGold,fontFamily:fontD,fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1}}>↺ Reset</button>
      </div>

      {/* HUD Bar */}
      <div style={{display:"flex",alignItems:"center",gap:10,width:"100%",maxWidth:520,zIndex:10}}>
        <PlayerHUD player={0} name="Nyano Master" score={score.a} hp={hpA} isActive={currentPlayer===0}/>
        <VSEmblem/>
        <PlayerHUD player={1} name="Shadow Lord" score={score.b} hp={hpB} isActive={currentPlayer===1}/>
      </div>

      {/* Board */}
      <div style={{position:"relative",width:"100%",maxWidth:520,zIndex:10}}>
        <div style={{position:"relative",background:`linear-gradient(145deg,${T.frameDark},${T.frameMid})`,border:`3px solid ${T.frameGold}`,borderRadius:16,padding:20,animation:"borderGlow 4s ease-in-out infinite"}}>
          {/* Corner ornaments */}
          <div style={{position:"absolute",inset:-3,borderRadius:16,background:`radial-gradient(circle at 0% 0%,${T.frameGoldBright} 0%,transparent 15%),radial-gradient(circle at 100% 0%,${T.frameGoldBright} 0%,transparent 15%),radial-gradient(circle at 0% 100%,${T.frameGoldBright} 0%,transparent 15%),radial-gradient(circle at 100% 100%,${T.frameGoldBright} 0%,transparent 15%)`,opacity:0.4,pointerEvents:"none"}}/>
          {/* Inner border */}
          <div style={{position:"absolute",inset:4,border:"1px solid rgba(201,168,76,0.2)",borderRadius:12,pointerEvents:"none"}}/>

          {/* Turn banner */}
          {currentPlayer!==null&&<TurnBanner player={currentPlayer}/>}

          {/* Candles */}
          <div style={{position:"absolute",left:-30,top:"50%",transform:"translateY(-50%)",zIndex:5}}><Candle/></div>
          <div style={{position:"absolute",right:-30,top:"50%",transform:"translateY(-50%)",zIndex:5}}><Candle/></div>

          {/* Board inner */}
          <div style={{background:T.boardBg,borderRadius:10,border:"1px solid rgba(201,168,76,0.15)",padding:10,position:"relative"}}>
            {/* Flip feedback */}
            {flipped.length>0&&<FlipFeedback cell={flipped[0]} count={flipped.length}/>}

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
              {board.map((cell,idx)=>{
                const isPlaced=placed===idx;
                const isFlipped=flipped.includes(idx);
                const owner=cell?.owner;
                return(
                  <div key={idx} style={{position:"relative",aspectRatio:"1",borderRadius:8,border:`2px solid ${isPlaced?T.flip:isFlipped?T.chain:owner===0?T.pA:owner===1?T.pB:T.cellBorder}`,background:`linear-gradient(135deg,${T.cellStoneLight},${T.cellStone},${T.cellStoneDark})`,overflow:"hidden",boxShadow:isPlaced?`0 0 16px ${T.flipGlow}`:isFlipped?`0 0 16px ${T.chainGlow}`:owner===0?`0 0 8px ${T.pAGlow}`:owner===1?`0 0 8px ${T.pBGlow}`:"none",animation:isPlaced?"cellPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards":isFlipped?"cellFlip 0.55s cubic-bezier(0.4,0,0.2,1) forwards":"none",perspective:600,transition:"border-color 0.2s,box-shadow 0.2s"}}>
                    {/* Stone cracks */}
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(25deg,transparent 40%,rgba(0,0,0,0.05) 41%,transparent 42%),linear-gradient(150deg,transparent 55%,rgba(0,0,0,0.04) 56%,transparent 57%),linear-gradient(70deg,transparent 70%,rgba(255,255,255,0.06) 71%,transparent 72%)",pointerEvents:"none",borderRadius:6}}/>
                    {/* Coord */}
                    <span style={{position:"absolute",bottom:2,right:4,fontSize:8,fontFamily:fontM,color:T.textDim,opacity:0.5,zIndex:2}}>{COORDS[idx]}</span>
                    {/* Card or empty */}
                    {cell?<BoardCard card={cell.card} owner={cell.owner}/>:
                      <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:14,color:T.textDim,opacity:0.2}}>✦</span>
                      </div>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hands */}
      <div style={{display:"flex",justifyContent:"space-between",gap:16,width:"100%",maxWidth:520,zIndex:10}}>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center"}}>
          {CA.map((c,i)=><HandCard key={i} card={c} owner={0} idx={i} selected={selCard===i&&currentPlayer===0} used={usedA.has(i)} onClick={()=>setSelCard(i)}/>)}
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center"}}>
          {CB.map((c,i)=><HandCard key={i} card={c} owner={1} idx={i} selected={false} used={usedB.has(i)} onClick={()=>{}}/>)}
        </div>
      </div>

      {/* Turn Log */}
      <div style={{width:"100%",maxWidth:520,zIndex:10}}>
        <TurnLog entries={log}/>
      </div>

      {/* Result */}
      {showResult&&<ResultOverlay winner={score.a>score.b?0:score.b>score.a?1:"draw"} scoreA={score.a} scoreB={score.b} onClose={()=>{setShowResult(false);reset();}}/>}
    </div>
  );
}

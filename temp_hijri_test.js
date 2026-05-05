function gregorianToHijri(gYear,gMonth,gDay){
  const a=Math.floor((14-gMonth)/12);
  const y=gYear+4800-a;
  const m=gMonth+12*a-3;
  const jd=gDay+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;
  const n=jd+1;
  const q=Math.floor(n/10631);
  const r=n%10631;
  const a2=Math.floor((33*r+3)/10646);
  const w=r-Math.floor((10646*a2-3)/33)+1;
  const hYear=30*q+a2+1;
  const hMonth=Math.floor((11*w+330)/325);
  const hDay=w-Math.floor((325*hMonth-320)/11);
  return {y:hYear,m:hMonth,d:hDay};
}
for(let y=2026;y<=2026;y++){
  for(let m=1;m<=12;m++){
    for(let d=1;d<=3;d++){
      const h=gregorianToHijri(y,m,d);
      console.log(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} => ${h.y}-${String(h.m).padStart(2,'0')}-${String(h.d).padStart(2,'0')}`);
    }
  }
}

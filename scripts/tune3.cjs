// tune3: tests multiple formula STRUCTURES, not just params.
// node scripts/tune3.cjs

const CL_TEAMS = [
  95,92,91,90,90,89,88,86,85,85,83,82,82,82,
  81,81,80,79,79,79,79,78,78,77,77,77,74,72,
  72,71,70,69,66,63,62,
]
const TARGETS = { 88: 1/800, 90: 1/550, 92: 1/350, 95: 1/150, 99: 1/10 }

function poisson(lambda) {
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do { k++; p *= Math.random() } while (p > L)
  return k - 1
}

// Formula types:
// 'linear':   λ = max(FL, BASE + diff/DIV * MUL)   where diff = a-b
// 'quad':     λ = max(FL, BASE + diff/DIV * MUL + (diff/DIV)^2 * MUL2)  -- curves up at top
// 'exp':      λ = BASE * exp(diff/DIV * MUL)  -- exponential advantage
// 'bilinear': like linear but MUL switches at threshold
const formulas = []

// 1. Linear — best from tune1 and some extras
for (const [BASE, DIV, MUL, FL] of [
  [0.85, 10, 1.0, 0.15], [0.95, 14, 1.2, 0.15],
  [1.0, 14, 1.2, 0.1], [1.0, 12, 1.0, 0.1],
  [1.1, 16, 1.4, 0.1], [1.1, 18, 1.6, 0.1],
  [1.0, 16, 1.5, 0.1], [0.95, 12, 1.1, 0.1],
]) {
  formulas.push({ name: `lin BASE=${BASE} DIV=${DIV} MUL=${MUL} FL=${FL}`,
    fn: (a, b) => {
      const d = (a-b)/DIV
      return [Math.max(FL, BASE + d*MUL), Math.max(FL, BASE - d*MUL)]
    }
  })
}

// 2. Quadratic — adds (diff)^2 bonus to amplify top-end advantage
for (const [BASE, DIV, MUL, MUL2, FL] of [
  [1.1, 20, 0.8, 0.4, 0.1], [1.1, 20, 0.8, 0.6, 0.1],
  [1.0, 20, 0.8, 0.4, 0.1], [1.1, 20, 1.0, 0.5, 0.1],
  [1.0, 18, 0.8, 0.5, 0.1], [1.1, 15, 0.6, 0.5, 0.1],
  [1.2, 22, 1.0, 0.4, 0.05],[1.0, 16, 0.7, 0.5, 0.1],
]) {
  formulas.push({ name: `quad BASE=${BASE} DIV=${DIV} MUL=${MUL} MUL2=${MUL2} FL=${FL}`,
    fn: (a, b) => {
      const d = (a-b)/DIV
      const lA = Math.max(FL, BASE + d*MUL + d*d*MUL2)
      const lB = Math.max(FL, BASE - d*MUL - d*d*MUL2)
      return [lA, lB]
    }
  })
}

// 3. Exponential base-scaling: λA = BASE * exp((a-b)/DIV * MUL)
for (const [BASE, DIV, MUL, FL] of [
  [1.2, 30, 1.0, 0.05], [1.1, 25, 1.0, 0.05],
  [1.0, 20, 1.2, 0.05], [1.0, 18, 1.0, 0.05],
  [1.1, 22, 1.2, 0.05], [1.2, 28, 1.2, 0.05],
]) {
  formulas.push({ name: `exp BASE=${BASE} DIV=${DIV} MUL=${MUL} FL=${FL}`,
    fn: (a, b) => {
      const d = (a-b)/DIV
      return [Math.max(FL, BASE * Math.exp(d*MUL)), Math.max(FL, BASE * Math.exp(-d*MUL))]
    }
  })
}

// 4. Higher-BASE linear to boost OVR-88 floor
for (const [BASE, DIV, MUL, FL] of [
  [1.3, 22, 1.5, 0.05], [1.4, 25, 1.8, 0.05],
  [1.3, 20, 1.3, 0.05], [1.4, 28, 2.0, 0.05],
]) {
  formulas.push({ name: `hibase BASE=${BASE} DIV=${DIV} MUL=${MUL} FL=${FL}`,
    fn: (a, b) => {
      const d = (a-b)/DIV
      return [Math.max(FL, BASE + d*MUL), Math.max(FL, BASE - d*MUL)]
    }
  })
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]
  }
  return a
}

function leagueSchedule(n, rounds) {
  const ids = Array.from({length:n},(_,i)=>i)
  const fixed=ids[0]; let rot=ids.slice(1); const fixtures=[]
  for (let r=0;r<rounds;r++) {
    const round=[fixed,...rot]
    for (let k=0;k<n/2;k++) fixtures.push([round[k],round[n-1-k]])
    rot=[rot[rot.length-1],...rot.slice(0,rot.length-1)]
  }
  return fixtures
}

function run(userStrength, fn) {
  const field = shuffle([{s:userStrength,isUser:true},...CL_TEAMS.map(s=>({s,isUser:false}))])
  const n = field.length
  const st = field.map(t=>({s:t.s,gf:0,ga:0,pts:0,isUser:t.isUser}))

  let leagueWins=0,leagueDraws=0
  for (const [i,j] of leagueSchedule(n,8)) {
    const [gi,gj] = fn(field[i].s,field[j].s)
    const [gir,gjr] = [poisson(gi),poisson(gj)]
    st[i].gf+=gir; st[i].ga+=gjr; st[j].gf+=gjr; st[j].ga+=gir
    if (gir>gjr) st[i].pts+=3; else if (gjr>gir) st[j].pts+=3; else {st[i].pts++;st[j].pts++}
    if (field[i].isUser||field[j].isUser) {
      const gf=field[i].isUser?gir:gjr,ga=field[i].isUser?gjr:gir
      if (gf>ga) leagueWins++; else if (gf===ga) leagueDraws++
    }
  }
  st.sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf)
  const pos = st.findIndex(s=>s.isUser)+1
  if (pos>24) return false

  const others=st.filter(s=>!s.isUser)
  const playoffPool=shuffle(others.slice(8,24))
  const koPool=shuffle(others.slice(0,16))
  let ki=0; const nextOpp=()=>koPool[ki++%koPool.length]
  let koWins=0,koDraws=0,totalKo=0

  const playTie=(oppS)=>{
    const [a1l,b1l]=fn(userStrength,oppS); const [a1,b1]=[poisson(a1l),poisson(b1l)]
    const [a2l,b2l]=fn(userStrength,oppS); const [a2,b2]=[poisson(a2l),poisson(b2l)]
    totalKo+=2
    if(a1>b1)koWins++;else if(a1===b1)koDraws++
    if(a2>b2)koWins++;else if(a2===b2)koDraws++
    const agg=a1+a2-b1-b2
    if(agg===0) return Math.random()<0.5
    return agg<0
  }

  const wentPlayoff=pos>8
  if(wentPlayoff){if(playTie((playoffPool[0]??nextOpp()).s))return false}
  for(let r=0;r<3;r++){if(playTie(nextOpp().s))return false}

  const [a1l,b1l]=fn(userStrength,nextOpp().s); const [gf,ga]=[poisson(a1l),poisson(b1l)]
  totalKo++
  const wonFinal=gf>ga?true:ga>gf?false:Math.random()<0.5
  if(!wonFinal)return false
  if(gf>ga)koWins++;else if(gf===ga)koDraws++

  const totalGames=8+totalKo
  const allWins=leagueWins+koWins===totalGames&&leagueDraws===0&&koDraws===0
  return !wentPlayoff&&totalGames===15&&allWins
}

const RUNS = 50_000
const ovrs = [88,90,92,95,99]

console.log(`Testing ${formulas.length} formulas × ${RUNS.toLocaleString()} runs × ${ovrs.length} OVRs\n`)

let bestErr=Infinity,bestName='',bestRates=null

for (const {name,fn} of formulas) {
  const rates={}
  for (const ovr of ovrs) {
    let hits=0
    for (let i=0;i<RUNS;i++){if(run(ovr,fn))hits++}
    rates[ovr]=hits/RUNS
  }
  let err=0
  for (const ovr of ovrs) {
    const got=Math.max(rates[ovr],1e-7),want=TARGETS[ovr]
    err+=(Math.log(got)-Math.log(want))**2
  }
  const tag=ovrs.map(o=>`${o}:${(rates[o]*100).toFixed(3)}%`).join(' ')
  process.stdout.write(`  ${name}\n    → ${tag}\n`)
  if (err<bestErr) {
    bestErr=err; bestName=name; bestRates={...rates}
    process.stdout.write(`    ★ NEW BEST (err=${err.toFixed(2)})\n`)
  }
}

console.log(`\n${'─'.repeat(70)}`)
console.log(`Best: ${bestName}\n`)
console.log(`${'OVR'.padEnd(5)} ${'Target'.padStart(10)} ${'Got'.padStart(10)} ${'Ratio'.padStart(8)}`)
console.log('─'.repeat(36))
for (const ovr of ovrs) {
  const got=bestRates[ovr],want=TARGETS[ovr]
  console.log(`${String(ovr).padEnd(5)} ${(want*100).toFixed(3).padStart(9)}% ${(got*100).toFixed(3).padStart(9)}% ${(got/want).toFixed(2).padStart(7)}x`)
}

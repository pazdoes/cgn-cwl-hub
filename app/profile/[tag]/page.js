"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

const ROLE_LABELS = {
  leader: "Leader", coLeader: "Co-Leader", admin: "Elder", member: "Member"
};

const EQUIPMENT_LOOKUP = {
  "Barbarian Puppet":     { hero: "Barbarian King",  rarity: "Common", order: 1  },
  "Rage Vial":            { hero: "Barbarian King",  rarity: "Common", order: 2  },
  "Earthquake Boots":     { hero: "Barbarian King",  rarity: "Common", order: 3  },
  "Vampstache":           { hero: "Barbarian King",  rarity: "Common", order: 4  },
  "Snake Bracelet":       { hero: "Barbarian King",  rarity: "Epic",   order: 5  },
  "Sneaky Goblin Puppet": { hero: "Barbarian King",  rarity: "Common", order: 6  },
  "Giant Gauntlet":       { hero: "Barbarian King",  rarity: "Epic",   order: 7  },
  "Spiky Ball":           { hero: "Barbarian King",  rarity: "Epic",   order: 8  },
  "Stick Horse":          { hero: "Barbarian King",  rarity: "Epic",   order: 9  },
  "Archer Puppet":        { hero: "Archer Queen",    rarity: "Common", order: 10 },
  "Invisibility Vial":    { hero: "Archer Queen",    rarity: "Common", order: 11 },
  "Giant Arrow":          { hero: "Archer Queen",    rarity: "Common", order: 12 },
  "Healer Puppet":        { hero: "Archer Queen",    rarity: "Common", order: 13 },
  "Frozen Arrow":         { hero: "Archer Queen",    rarity: "Epic",   order: 14 },
  "Monolith Arrow":       { hero: "Archer Queen",    rarity: "Epic",   order: 15 },
  "Magic Mirror":         { hero: "Archer Queen",    rarity: "Epic",   order: 16 },
  "Action Figure":        { hero: "Archer Queen",    rarity: "Epic",   order: 17 },
  "Henchmen Puppet":      { hero: "Minion Prince",   rarity: "Common", order: 18 },
  "Dark Orb":             { hero: "Minion Prince",   rarity: "Common", order: 19 },
  "Metal Pants":          { hero: "Minion Prince",   rarity: "Common", order: 20 },
  "Noble Iron":           { hero: "Minion Prince",   rarity: "Common", order: 21 },
  "Dark Crown":           { hero: "Minion Prince",   rarity: "Epic",   order: 22 },
  "Meteor Staff":         { hero: "Minion Prince",   rarity: "Epic",   order: 23 },
  "Eternal Tome":         { hero: "Grand Warden",    rarity: "Common", order: 24 },
  "Life Gem":             { hero: "Grand Warden",    rarity: "Common", order: 25 },
  "Rage Gem":             { hero: "Grand Warden",    rarity: "Common", order: 26 },
  "Healing Tome":         { hero: "Grand Warden",    rarity: "Common", order: 27 },
  "Heroic Torch":         { hero: "Grand Warden",    rarity: "Epic",   order: 28 },
  "Fireball":             { hero: "Grand Warden",    rarity: "Epic",   order: 29 },
  "Lavaloon Puppet":      { hero: "Grand Warden",    rarity: "Epic",   order: 30 },
  "Seeking Shield":       { hero: "Royal Champion",  rarity: "Common", order: 31 },
  "Royal Gem":            { hero: "Royal Champion",  rarity: "Common", order: 32 },
  "Hog Rider Puppet":     { hero: "Royal Champion",  rarity: "Common", order: 33 },
  "Haste Vial":           { hero: "Royal Champion",  rarity: "Common", order: 34 },
  "Rocket Spear":         { hero: "Royal Champion",  rarity: "Epic",   order: 35 },
  "Electro Boots":        { hero: "Royal Champion",  rarity: "Epic",   order: 36 },
  "Frost Flake":          { hero: "Royal Champion",  rarity: "Epic",   order: 37 },
  "Fire Heart":           { hero: "Dragon Duke",     rarity: "Common", order: 38 },
  "Flame Blower":         { hero: "Dragon Duke",     rarity: "Common", order: 39 },
  "Stun Blaster":         { hero: "Dragon Duke",     rarity: "Common", order: 40 },
  "Electro Fangs":        { hero: "Dragon Duke",     rarity: "Common", order: 41 },
  "Rocket Backpack":      { hero: "Dragon Duke",     rarity: "Epic",   order: 42 },
};

function EqTile({ eq }) {
  const slug = eq.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const isMaxed = eq.level >= eq.maxLevel;
  const isEpic = EQUIPMENT_LOOKUP[eq.name]?.rarity === "Epic";
  return (
    <div className={`relative w-10 h-10 rounded-xl overflow-hidden border ${isMaxed ? "border-amber-500/60" : isEpic ? "border-purple-500/30" : "border-white/[0.08]"}`}>
      <div className="w-full h-full bg-white/[0.05] flex items-center justify-center">
        <img src={`/icons/equipment/${slug}.png`} alt={eq.name} loading="eager"
          className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }}/>
      </div>
      <span className={`absolute top-0.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-sm text-[8px] font-bold px-0.5 ${isMaxed ? "bg-amber-500 text-white" : "bg-black/80 text-white"}`}>
        {eq.level}
      </span>
    </div>
  );
}

function UnitTile({ unit, folder }) {
  const slug = unit.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const isMaxed = unit.level >= unit.maxLevel;
  return (
    <div className={`relative w-10 h-10 rounded-xl overflow-hidden border ${isMaxed ? "border-amber-500/60" : "border-white/[0.08]"}`}>
      <div className="w-full h-full bg-white/[0.05] flex items-center justify-center">
        <img src={`/icons/${folder}/${slug}.png`} alt={unit.name} loading="eager"
          className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }}/>
      </div>
      <span className={`absolute top-0.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-sm text-[8px] font-bold px-0.5 ${isMaxed ? "bg-amber-500 text-white" : "bg-black/80 text-white"}`}>
        {unit.level}
      </span>
    </div>
  );
}

export default function PlayerProfilePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const tag = params?.tag;

  const [army, setArmy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHero, setSelectedHero] = useState(null);
  const [eqSort, setEqSort] = useState("rarity");
  const [showTroops, setShowTroops] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status]);

  useEffect(() => {
    if (!tag || status !== "authenticated") return;
    fetch(`/api/army/${tag}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setArmy(d.army);
        // Preload icons
        const a = d.army;
        [...(a.heroes||[]), ...(a.heroEquipment||[]), ...(a.pets||[]), ...(a.troops||[]), ...(a.spells||[]), ...(a.siegeMachines||[])].forEach(u => {
          const folder = (a.heroes||[]).find(h => h.name === u.name) ? "heroes"
            : (a.heroEquipment||[]).find(e => e.name === u.name) ? "equipment"
            : (a.pets||[]).find(p => p.name === u.name) ? "pets"
            : (a.spells||[]).find(s => s.name === u.name) ? "spells"
            : (a.siegeMachines||[]).find(s => s.name === u.name) ? "siege" : "troops";
          const slug = u.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const img = new Image(); img.src = `/icons/${folder}/${slug}.png`;
        });
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [tag, status]);

  if (status === "loading" || loading) return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="max-w-lg mx-auto space-y-3 pt-6 animate-pulse">
        <div className="h-32 rounded-3xl bg-white/[0.04]"/>
        <div className="h-48 rounded-3xl bg-white/[0.04]"/>
        <div className="h-64 rounded-3xl bg-white/[0.04]"/>
      </div>
    </main>
  );

  if (error) return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 flex items-center justify-center">
      <p className="text-red-400 text-sm">{error}</p>
    </main>
  );

  if (!army) return null;

  const HERO_ORDER = ["Barbarian King","Archer Queen","Minion Prince","Grand Warden","Royal Champion","Dragon Duke"];

  const sortedEq = (() => {
    const eq = army.heroEquipment || [];
    let filtered = selectedHero ? eq.filter(e => EQUIPMENT_LOOKUP[e.name]?.hero === selectedHero) : [...eq];
    filtered.sort((a, b) => {
      const ra = EQUIPMENT_LOOKUP[a.name]?.rarity === "Epic" ? 1 : 0;
      const rb = EQUIPMENT_LOOKUP[b.name]?.rarity === "Epic" ? 1 : 0;
      if (eqSort === "hero" && !selectedHero) {
        const ha = HERO_ORDER.indexOf(EQUIPMENT_LOOKUP[a.name]?.hero || "");
        const hb = HERO_ORDER.indexOf(EQUIPMENT_LOOKUP[b.name]?.hero || "");
        if (ha !== hb) return ha - hb;
      }
      if (ra !== rb) return ra - rb;
      return (EQUIPMENT_LOOKUP[a.name]?.order ?? 99) - (EQUIPMENT_LOOKUP[b.name]?.order ?? 99);
    });
    return filtered;
  })();

  const commonEq = sortedEq.filter(e => EQUIPMENT_LOOKUP[e.name]?.rarity !== "Epic");
  const epicEq = sortedEq.filter(e => EQUIPMENT_LOOKUP[e.name]?.rarity === "Epic");

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#070b17] to-[#05070f] text-white p-4 pb-12">
      <div className="max-w-lg mx-auto space-y-3">

        {/* Back button */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        {/* ── PROFILE HEADER ── */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
          <div className="flex items-start gap-4">
            {/* TH Level */}
            <div className="shrink-0 w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.06] flex flex-col items-center justify-center">
              <span className="text-[8px] text-slate-600 uppercase tracking-widest">TH</span>
              <span className="text-2xl font-thin text-white" style={{fontFamily:"var(--font-orbitron)"}}>{army.townHallLevel}</span>
            </div>
            {/* Name + clan */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-white truncate">{army.name}</h1>
              <p className="text-[10px] text-slate-500 font-mono mb-1">{army.tag}</p>
              {army.clan && (
                <div className="flex items-center gap-1.5">
                  {army.clan.badgeUrl && <img src={army.clan.badgeUrl} alt="" className="w-4 h-4 object-contain"/>}
                  <span className="text-xs text-slate-400">{army.clan.name}</span>
                  {army.role && <span className="text-[9px] text-slate-600">· {ROLE_LABELS[army.role] || army.role}</span>}
                </div>
              )}
            </div>
            {/* League badge */}
            {army.league?.iconUrl && (
              <img src={army.league.iconUrl} alt={army.league.name} className="w-10 h-10 object-contain shrink-0"/>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/[0.06]">
            {[
              { label: "Trophies", value: army.trophies?.toLocaleString() },
              { label: "War Stars", value: army.warStars?.toLocaleString() },
              { label: "Donations", value: army.donations?.toLocaleString() },
              { label: "Exp", value: army.expLevel },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-sm font-semibold text-white">{s.value ?? "—"}</p>
                <p className="text-[8px] text-slate-600 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── HEROES + PETS + EQUIPMENT ── */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4">
          <div className="flex gap-3">
            {/* Left — Heroes + Pets */}
            <div className="flex flex-col gap-2 shrink-0" style={{width:"38%"}}>
              {army.heroes?.length > 0 && (
                <div>
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1.5">Heroes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...army.heroes].sort((a,b) => HERO_ORDER.indexOf(a.name)-HERO_ORDER.indexOf(b.name)).map(hero => {
                      const slug = hero.name.toLowerCase().replace(/[^a-z0-9]+/g,"-");
                      const isMaxed = hero.level >= hero.maxLevel;
                      return (
                        <button key={hero.name} type="button"
                          onClick={() => setSelectedHero(selectedHero === hero.name ? null : hero.name)}
                          className={`relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden border-2 transition ${selectedHero === hero.name ? "border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]" : isMaxed ? "border-amber-500/60" : "border-white/10"}`}>
                          <div className="w-full h-full bg-white/[0.06]">
                            <img src={`/icons/heroes/${slug}.png`} alt={hero.name} loading="eager"
                              className="w-full h-full object-cover object-top" onError={e=>{e.target.style.display="none"}}/>
                          </div>
                          <span className={`absolute top-0.5 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-sm text-[9px] font-bold px-0.5 ${isMaxed?"bg-amber-500 text-white":"bg-black/80 text-white"}`}>
                            {hero.level}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {army.pets?.length > 0 && (
                <div>
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1.5">Pets</p>
                  <div className="flex flex-wrap gap-1.5">
                    {army.pets.map(pet => {
                      const slug = pet.name.toLowerCase().replace(/[^a-z0-9]+/g,"-");
                      const isMaxed = pet.level >= pet.maxLevel;
                      return (
                        <div key={pet.name} className={`relative w-11 h-11 rounded-xl overflow-hidden border ${isMaxed?"border-amber-500/60":"border-white/10"}`}>
                          <div className="w-full h-full bg-white/[0.06]">
                            <img src={`/icons/pets/${slug}.png`} alt={pet.name} loading="eager"
                              className="w-full h-full object-cover" onError={e=>{e.target.style.display="none"}}/>
                          </div>
                          <span className={`absolute top-0.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-sm text-[8px] font-bold px-0.5 ${isMaxed?"bg-amber-500 text-white":"bg-black/80 text-white"}`}>
                            {pet.level}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px bg-white/[0.06] shrink-0"/>

            {/* Right — Equipment */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[8px] text-slate-600 uppercase tracking-widest">
                  {selectedHero ? selectedHero.split(" ")[0]+" Equip." : "Equipment"}
                </p>
                {!selectedHero && (
                  <div className="flex gap-1">
                    {["rarity","hero"].map(m => (
                      <button key={m} type="button" onClick={() => setEqSort(m)}
                        className={`text-[8px] px-2 py-0.5 rounded-lg border transition ${eqSort===m?"border-purple-500/60 bg-purple-500/20 text-purple-300":"border-white/10 text-slate-600 hover:text-slate-400"}`}>
                        {m==="rarity"?"Epic/Common":"By Hero"}
                      </button>
                    ))}
                  </div>
                )}
                {selectedHero && (
                  <button type="button" onClick={() => setSelectedHero(null)}
                    className="text-[8px] text-slate-600 hover:text-slate-300 transition">All</button>
                )}
              </div>
              <div className="space-y-2">
                {commonEq.length > 0 && (
                  <div>
                    <p className="text-[7px] text-slate-600 uppercase tracking-widest mb-1">Common</p>
                    <div className="flex flex-wrap gap-1">{commonEq.map(e => <EqTile key={e.name} eq={e}/>)}</div>
                  </div>
                )}
                {epicEq.length > 0 && (
                  <div>
                    <p className="text-[7px] text-amber-500/60 uppercase tracking-widest mb-1">Epic</p>
                    <div className="flex flex-wrap gap-1">{epicEq.map(e => <EqTile key={e.name} eq={e}/>)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── TROOPS + SPELLS + SIEGE ── */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <button type="button" onClick={() => setShowTroops(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Troops, Spells & Siege</p>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-slate-600 transition-transform ${showTroops?"rotate-180":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          {showTroops && (
            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
              {army.troops?.length > 0 && (
                <div>
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-2">Troops</p>
                  <div className="flex flex-wrap gap-1.5">
                    {army.troops.map(t => <UnitTile key={t.name} unit={t} folder="troops"/>)}
                  </div>
                </div>
              )}
              {army.spells?.length > 0 && (
                <div>
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-2">Spells</p>
                  <div className="flex flex-wrap gap-1.5">
                    {army.spells.map(s => <UnitTile key={s.name} unit={s} folder="spells"/>)}
                  </div>
                </div>
              )}
              {army.siegeMachines?.length > 0 && (
                <div>
                  <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-2">Siege Machines</p>
                  <div className="flex flex-wrap gap-1.5">
                    {army.siegeMachines.map(s => <UnitTile key={s.name} unit={s} folder="siege"/>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-[9px] text-slate-700 text-center">
          {army.tag} · CGN CWL Hub · Data refreshes every 24h
        </p>
      </div>
    </main>
  );
}

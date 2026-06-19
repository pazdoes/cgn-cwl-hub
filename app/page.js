"use client";

import { useEffect, useState } from "react";
import { CWL_ICONS, TH_ICONS } from "../lib/icons";
import { BRANDING } from "../lib/branding";

export default function Home() {

  const [players, setPlayers] = useState([]);
const [selectedClan, setSelectedClan] = useState(null);
const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/roster")
      .then(res => res.json())
      .then(data => setPlayers(data));
  }, []);

  const clans = [...new Set(players.map(p => p.clan))];
  const searchResults = players.filter(player =>
  player.account
    .toLowerCase()
    .includes(search.toLowerCase())
);
  const clanPlayers = selectedClan
  ? players.filter(p => p.clan === selectedClan)
  : [];

  if (selectedClan) {

  const rank =
    clanPlayers[0]?.cwlRank || "";

  const season =
    clanPlayers[0]?.season || "";

  const clanLink =
    clanPlayers[0]?.clanLink || "";

  const format =
    clanPlayers.length >= 30
      ? "30v30"
      : "15v15";

  return (

    <main className="min-h-screen bg-slate-950 text-white p-6 pb-40">

      <div
  className="
    fixed
    top-0
    left-0
    right-0
    z-50
    bg-slate-950
    border-b
    border-slate-800
    backdrop-blur
  "
>
  <div className="relative flex items-center justify-center h-16 px-4">

    <button
      onClick={() => {
        setSelectedClan(null);
        setSearch("");
      }}
      className="absolute left-4"
    >
      <img
        src={BRANDING.backbutton}
        alt="Back"
        className="w-10 h-10 hover:scale-110 transition"
      />
    </button>

    <div className="flex items-center gap-3">
      <span className="text-xl font-bold">
        Cognition
      </span>

      <img
        src={BRANDING.cgnskull}
        alt="CGN Skull"
        className="w-8 h-8"
      />

      <span className="text-xl font-bold">
        Collective
      </span>
    </div>

  </div>
</div>

      <a
  href={clanLink}
  target="_blank"
  rel="noopener noreferrer"
  className="
    fixed
    bottom-4
    right-4
    z-50
  "
>

  <img
    src={BRANDING.openlink}
    alt="Open Clan"
    className="
      w-15
      h-15
      hover:scale-110
      transition
    "
  />

</a>

      <div className="flex flex-wrap items-center gap-4 mb-8 pt-12">

        <div className="flex items-center gap-3">

  <img
    src={BRANDING.cgnshield}
    alt="CGN"
    className="w-20 h-20"
  />

  <h1 className="text-3xl font-bold">
    {selectedClan}
  </h1>

</div>

        <img
          src={CWL_ICONS[rank]}
          alt={rank}
          className="w-12 h-12"
        />

        <div className="font-bold">
          {format}
        </div>

        <div className="font-bold">
          {season}
        </div>

      </div>

      <div className="space-y-3">

        {clanPlayers.map(player => (

          <div
            key={`${player.clan}-${player.account}-${player.position}`}
            className="
              bg-slate-900
              border
              border-slate-800
              rounded-xl
              p-4
            "
          >

            <div className="
              flex
              flex-wrap
              items-center
              gap-3
              font-bold
            ">

              <div className="text-lg font-bold">
                {player.position}
              </div>
              
              <img
                src={TH_ICONS[player.townHall]}
                alt={player.townHall}
                className="w-10 h-10"
              />

              <span>{player.account}</span>

              <span>|</span>

              <span>{player.clan}</span>

              <span>|</span>

              <span>{player.status}</span>

              <span>|</span>

              <span>{player.cwlRank}</span>

            </div>

          </div>

        ))}

      </div>

    </main>

  );
}
  return (
  <main className="min-h-screen bg-slate-950 text-white p-6 pb-40">

    <div className="flex flex-col items-center mb-8">

  <img
    src={BRANDING.cwlhub}
    alt="CWL Hub"
    className="w-32 h-32 mb-4"
  />

  <h1 className="text-4xl font-bold text-center">
    {"{CGN} Collective CWL Hub"}
  </h1>

  <p className="text-slate-400 mt-2">
    Search • Browse • Join
  </p>

</div>

    <div className="grid grid-cols-2 gap-4 mb-8">

      <div className="bg-slate-900 rounded-2xl p-4 text-center border border-slate-800">
        <div className="text-3xl font-bold">
          {players.length}
        </div>
        <div className="text-slate-400">
          Players
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-4 text-center border border-slate-800">
        <div className="text-3xl font-bold">
          {clans.length}
        </div>
        <div className="text-slate-400">
          Clans
        </div>
      </div>

    </div>

    {search ? (

      <div className="space-y-3">

        {searchResults.map(player => (

          <div
            key={`${player.clan}-${player.account}-${player.position}`}
            onClick={() => setSelectedClan(player.clan)}
            className="
              bg-slate-900
              border
              border-slate-800
              rounded-xl
              p-4
              cursor-pointer
            "
          >

            <div className="flex flex-wrap items-center gap-2 font-bold">

  <span>
    {player.position}
  </span>

  <img
    src={TH_ICONS[player.townHall]}
    alt={player.townHall}
    className="w-8 h-8"
  />

  <span>
    {player.account}
  </span>

  <span>|</span>

  <span>
    {player.status}
  </span>

  <span>|</span>

  <span>
    {player.clan}
  </span>

  <img
    src={CWL_ICONS[player.cwlRank]}
    alt={player.cwlRank}
    className="w-6 h-6"
  />

</div>

          </div>

        ))}

      </div>

    ) : (

      <div className="grid grid-cols-2 gap-4">

        {clans.map(clan => {

          const clanPlayers =
            players.filter(p => p.clan === clan);

          const count =
            clanPlayers.length;

          const rank =
            clanPlayers[0]?.cwlRank || "";

          const season =
            clanPlayers[0]?.season || "";

          const format =
            count >= 30 ? "30v30" : "15v15";

          return (

            <div
              key={clan}
              onClick={() => setSelectedClan(clan)}
              className="
                bg-slate-900
                border
                border-slate-800
                rounded-2xl
                p-6
                min-h-[280px]
                flex
                flex-col
                items-center
                justify-between
                cursor-pointer
                hover:border-slate-600
              "
            >

              <div className="text-center">

                <img
                  src={CWL_ICONS[rank]}
                  alt={rank}
                  className="w-24 h-24 mx-auto mb-4"
                />

                <div className="text-xl font-bold">
                  {clan}
                </div>

                <div className="text-lg font-bold mt-3">
                  {format}
                </div>

                <div className="text-base font-bold mt-2">
                  {season}
                </div>

              </div>

              <div className="text-slate-400 text-sm">
                Tap to view roster →
              </div>

            </div>

          );

        })}

      </div>

    )}

    <div
      className="
        fixed
        bottom-0
        left-0
        right-0
        bg-slate-950
        border-t
        border-slate-800
        p-3
        z-50
      "
    >

      <input
        type="text"
        placeholder="🔍 Search any account..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="
          w-full
          rounded-xl
          p-4
          bg-slate-900
          border
          border-slate-700
          text-white
        "
      />

    </div>

  </main>
);
}
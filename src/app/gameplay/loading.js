function PreviewTube({ color, shape }) {
  return (
    <div className="relative h-40 w-14 rounded-b-2xl border-x-2 border-b-2 border-cyan-100/45 bg-gradient-to-r from-white/20 via-white/5 to-white/15">
      <div className={`absolute -left-1 -right-1 -top-1 h-3 rounded-full border border-white/50 ${color}`} />
      <div className="absolute inset-x-0 bottom-2 text-center text-2xl drop-shadow-[0_0_8px_currentColor]">{shape}</div>
      <div className={`absolute -bottom-1 -left-1 -right-1 h-3 rounded-full border border-white/45 ${color}`} />
    </div>
  );
}

export default function GameplayLoading() {
  return (
    <main className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#020912] text-white">
      <div className="absolute inset-0 bg-cover bg-center opacity-75" style={{ backgroundImage: "url('/gameplay-factory.webp')" }} />
      <div className="relative flex h-full w-full max-w-[430px] items-center justify-center gap-4 bg-[#020b15]/20">
        <PreviewTube color="bg-blue-500" shape="●" />
        <PreviewTube color="bg-red-500" shape="◆" />
        <PreviewTube color="bg-yellow-400" shape="★" />
        <PreviewTube color="bg-green-500" shape="▲" />
      </div>
    </main>
  );
}

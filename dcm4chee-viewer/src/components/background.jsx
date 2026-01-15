export default function Background() {
  return (
    <div className="fixed inset-0 -z-10">
      {/* background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.png')" }}
      />

      {/* white blur overlay */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
    </div>
  );
}

export default function Background() {
  return (
    <div className="fixed inset-0 -z-50">
      {/* background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.jpeg')" }}
      />

      {/* white blur overlay */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
    </div>
  );
}

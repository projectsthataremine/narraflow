export default function GeometricPattern() {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center p-12">
      <div className="grid grid-cols-3 gap-0 max-w-md aspect-square">
        {/* Row 1 */}
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-dark to-teal-light rounded-tl-[100px]" />
        </div>
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-light to-white rounded-tr-[100px] rounded-bl-[100px]" />
        </div>
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange to-terracotta rounded-tr-[100px]" />
        </div>

        {/* Row 2 */}
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-terracotta to-orange rounded-tl-[100px] rounded-br-[100px]" />
        </div>
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple to-violet" />
        </div>
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange to-yellow rounded-tr-[100px] rounded-bl-[100px]" />
        </div>

        {/* Row 3 */}
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-light to-white rounded-tl-[100px] rounded-br-[100px]" />
        </div>
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple to-violet rounded-tl-[100px] rounded-br-[100px]" />
        </div>
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow to-gold rounded-tr-[100px] rounded-bl-[100px]" />
        </div>

        {/* Row 4 */}
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange to-terracotta rounded-bl-[100px]" />
        </div>
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-dark to-teal-light rounded-tl-[100px] rounded-br-[100px]" />
        </div>
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-terracotta to-orange rounded-br-[100px]" />
        </div>
      </div>
    </div>
  );
}

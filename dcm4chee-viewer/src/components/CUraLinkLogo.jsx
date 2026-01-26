function CuraLinkLogo({ size = "default", variant = "full" }) {
  const sizes = {
    small: { height: "h-1", text: "text-xs", icon: "w-1 h-1" },
    default: { height: "h-12", text: "text-3xl", icon: "w-8 h-8" },
    large: { height: "h-16", text: "text-4xl", icon: "w-12 h-12" }
  };

  const currentSize = sizes[size] || sizes.default;

  // Icon only variant
  if (variant === "icon") {
    return (
      <div className={`${currentSize.icon} relative flex items-center justify-center`}>
        <span className="text-[rgb(215,160,56)] text-5xl">✴</span>
      </div>
    );
  }

  // Full logo with text
  return (
    <div className={`flex items-center justify-center gap-3 ${currentSize.height}`}>
      {/* Icon */}
      <div className={`${currentSize.icon} relative flex-shrink-0 flex gap-x-4 items-center justify-center`}>
        <span className="text-[rgb(215,160,56)] text-6xl" >✴</span>
      </div>

      {/* Text */}
      <div className={`font-bold ${currentSize.text} tracking-tight `}>
        <span className="bg-gradient-to-r from-[rgb(215,160,56)] to-[rgb(180,130,40)] bg-clip-text text-center  text-3xl text-transparent">
          Cura
        </span>
        <span className="text-slate-700 text-center  text-3xl">Link</span>
      </div>
    </div>
  );
}

// Demo showing different variants
export default function Demo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Logo Variants</h2>
          
          {/* Different Sizes */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-600 mb-2">Small Size</p>
              <CuraLinkLogo size="small" />
            </div>
            
            <div>
              <p className="text-sm text-slate-600 mb-2">Default Size</p>
              <CuraLinkLogo size="default" />
            </div>
            
            <div>
              <p className="text-sm text-slate-600 mb-2">Large Size</p>
              <CuraLinkLogo size="large" />
            </div>
          </div>

          {/* Icon Only */}
          <div className="pt-6 border-t">
            <p className="text-sm text-slate-600 mb-2">Icon Only</p>
            <div className="flex gap-4 items-center">
              <CuraLinkLogo size="small" variant="icon" />
              <CuraLinkLogo size="default" variant="icon" />
              <CuraLinkLogo size="large" variant="icon" />
            </div>
          </div>

          {/* On Dark Background */}
          <div className="pt-6 border-t">
            <p className="text-sm text-slate-600 mb-3">On Dark Background</p>
            <div className="bg-slate-800 rounded-lg p-6">
              <CuraLinkLogo size="default" />
            </div>
          </div>

          {/* Header Example */}
          <div className="pt-6 border-t">
            <p className="text-sm text-slate-600 mb-3">In Header</p>
            <div className="bg-white border-b shadow-sm">
              <div className="flex items-center justify-between px-6 py-4">
                <CuraLinkLogo size="default" />
                <div className="flex gap-4">
                  <button className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">
                    Patients
                  </button>
                  <button className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">
                    Studies
                  </button>
                  <button className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90" style={{backgroundColor: 'rgb(215,160,56)'}}>
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Brand Colors</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-lg" style={{backgroundColor: 'rgb(215,160,56)'}}></div>
              <p className="text-sm font-mono text-slate-600">rgb(215,160,56)</p>
              <p className="text-xs text-slate-500">Primary Gold</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg" style={{backgroundColor: 'rgb(180,130,40)'}}></div>
              <p className="text-sm font-mono text-slate-600">rgb(180,130,40)</p>
              <p className="text-xs text-slate-500">Dark Gold</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-slate-700 rounded-lg"></div>
              <p className="text-sm font-mono text-slate-600">#334155</p>
              <p className="text-xs text-slate-500">Slate Gray</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CuraLinkLogo };
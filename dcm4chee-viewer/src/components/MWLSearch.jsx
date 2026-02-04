export default function MWLSearchBox() {
  return (
    <div className="wallpaper-page w-full bg-white/50  rounded-2xl  backdrop-blur-md border shadow">

      {/* Header */}

      <div className="flex gap-2 px-6 py-3 border-b">
        <span className="text-2xl text-[rgb(215,160,56)]">
            <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block" /></span>
        <h2 className="text-2xl  mt-2  font-semibold">MWL</h2>
      </div>

      {/* Fields */}
      <div className="bg-white/50  rounded-xl p-6 mx-auto" >
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div>
       <label className="block text-lg  text-slate-600 mb-2">
        Patient Family Name
       </label>
       <div className="relative">
        <input className="input w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00768317]-500 bg-[#00768317]"
         placeholder="Patient family name" />
       </div>
        
         </div>
         <div>
           <label className="block text-lg  text-slate-600 mb-2">
       Patient ID
        </label>
        <div className="relative">
          <select className="input w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00768317]-500 bg-[#00768317]">
          <option>Patient ID</option>
        </select>
        </div>
         </div>
       
        <div>
          <label className="block text-lg  text-slate-600 mb-2">
          Admission ID
        </label>
          <div className="relative">
            <select className="input w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00768317]-500 bg-[#00768317]">
          <option>Admission ID</option>
        </select>
          </div>
        </div>
        <div>
          <label className="block text-lg  text-slate-600 mb-2">
          SPS Status
        </label>
          <div className="relative">
            <select className="input w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00768317]-500 bg-[#00768317]">
          <option>SPS Status</option>
        </select>
          </div>
        </div>
        
        
<div>
  <label className="block text-lg  text-slate-600 mb-2">
         Accession Number
        </label>
     <div className="relative">
        <input className="input w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00768317]-500 bg-[#00768317]" 
        placeholder="Accession Number" />

     </div>
</div>
<div>
  <label className="block text-lg  text-slate-600 mb-2">
         Issuer of Patient
        </label>
     <div className="relative">
        <input className="input w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00768317]-500 bg-[#00768317]" 
        placeholder="Issuer of Patient" />

     </div>
</div>
<div>
  <label className="block text-lg  text-slate-600 mb-2">
         Scheduled Station AE Title
        </label>
     <div className="relative">
        <input className="input w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00768317]-500 bg-[#00768317]" 
        placeholder="Scheduled Station AE Title" />

     </div>
</div>
<div>
  <label className="block text-lg  text-slate-600 mb-2">
         Modality
        </label>
     <div className="relative">
      
<select className="input w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00768317]-500 bg-[#00768317]" 
 placeholder="Modality">
          <option>Modality</option>
        </select>
     </div>
</div>
<div>
  <label className="block text-lg  text-slate-600 mb-2">
         SPS Start Time
        </label>
     <div className="relative">
        <input className="input w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00768317]-500 bg-[#00768317]" 
        placeholder="SPS Start Time" />

     </div>
</div>
<div>
  <label className="block text-lg  text-slate-600 mb-2">
         Study Instance UID
        </label>
     <div className="relative">
        <input className="input w-full px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00768317]-500 bg-[#00768317]" 
        placeholder="Study Instance UID" />

     </div>
</div>

      
      
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6">
        <div>
  <label className="block text-lg  text-slate-600 mb-2">
         Web App Service
        </label>
     <div className="relative">
        <select className="input w-50 px-4 py-2 border rounded-2xl outline-none focus:ring-2 focus:ring-[#00768317]-500 bg-[#00768317] ">
          <option >Web App Service</option>
        </select>

     </div>
</div>
       
        </div>
      <div className="flex flex-row-reverse justify-between mt-6">

        <button className="px-8 py-2 text-white rounded-2xl hover:bg-[#05383d] transition disabled:opacity-50 disabled:cursor-not-allowed bg-[#0a6e79]">
          SUBMIT
        </button>
      </div>
    </div>
    </div>
  );
}

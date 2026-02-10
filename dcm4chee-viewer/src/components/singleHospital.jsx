import React, { useState, useEffect ,useRef } from 'react';
export default function SingleHospitalPage() {
       const [isOpen, setIsOpen] = useState(false);
    return (
        
   <React.Fragment>

    
     <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto mb-4">
          <div className=" wallpaper-page w-full bg-white/50  rounded-2xl  backdrop-blur-md border shadow" >
       {/* Header */}
              
          <div className="flex justify-between items-center mb-4 border-b">
            <div className="flex gap-2 px-6 py-3 ">
              <span className="text-2xl text-[rgb(215,160,56)]">
                  <img src="/logo-icon.png" width={50} height={50} alt="icon" className="inline-block" />
                  </span>
              <h2 className="text-2xl  mt-2  font-semibold font-[montserrat]">Hospital Name</h2>
            </div>
             <div className="inline-block relative mr-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex w-full justify-center gap-x-1.5 rounded-full bg-[#00768317] px-16 py-2 text-sm font-medium text-gray-700 border-2 border-[#0a6e79] hover:border-[#14A3B8]"
      >
        filter
       
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Account settings</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Support</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">License</a>
            <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">Sign out</button>
          </div>
        </div>
      )}
    </div>
            
           
          </div>

             {/* Statistics Cards */}
             
          <div className="grid grid-cols-1 md:grid-cols-3  px-4 py-2 gap-4 mb-2">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-[#31B6C5]">
              <p className="text-sm text-black-600  font-semibold font-[montserrat] ">Total Hospitals</p>
              <p className="text-3xl font-bold text-black-800">6</p>
              <p className="text-xs text-black-600 mt-1">3 Active</p>
            </div>
{/*             <div className="bg-white rounded-lg shadow p-4 border-l-4 border-black-500"> */}
{/*               <p className="text-sm text-black-600">Total Beds</p> */}
{/*               <p className="text-3xl font-bold text-black-800">{totalBeds.toLocaleString()}</p> */}
{/*             </div> */}
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-[#1E7586]">
              <p className="text-sm text-black-600 font-semibold font-[montserrat]">Total Patients</p>
              <p className="text-3xl font-bold text-black-800">33</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-[#2F545B]">
              <p className="text-sm text-black-600 font-semibold font-[montserrat]">Total Studies</p>
              <p className="text-3xl font-bold text-black-800">45</p>
            </div>
            

            {/* second row cards new edits updated  */}
             <div className="bg-white rounded-lg shadow p-4 border-l-4 border-[#31B6C5]">
              <p className="text-sm text-black-600  font-semibold font-[montserrat] ">Hospitals Patients</p>
              <p className="text-3xl font-bold text-black-800">12</p>
              <p className="text-xs text-black-600 mt-1">2 Active</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-[#1E7586]">
              <p className="text-sm text-black-600 font-semibold font-[montserrat]">Studies Series</p>
              <p className="text-3xl font-bold text-black-800">44</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-[#2F545B]">
              <p className="text-sm text-black-600 font-semibold font-[montserrat]">Failures Modalities</p>
              <p className="text-3xl font-bold text-black-800">10</p>
            </div>
          </div>
          </div>
          </div>
             <div className=" flex justify-between gap-8  items-stretch">
           <div className=" wallpaper-page w-full bg-white/50  rounded-2xl  backdrop-blur-md border shadow p-5" >
           
           <img
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=250&fit=crop"
                  alt="hospital single one"
                  className="w-full h-full object-cover opacity-80"
                />
           </div>
           <div className=" wallpaper-page w-full bg-white/50  rounded-2xl  backdrop-blur-md border shadow p-5" >
           <img
                  src="../../public/dashboard-graph.png"
                  alt="graph"
                  className="w-full h-full object-cover opacity-80"
                />
           </div>
          </div>
          </div>
   </React.Fragment>
    );
}
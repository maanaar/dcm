export default function Sidebar() {

    return ( 
        <div className="w-64 bg-white/80 backdrop-blur-md border-r shadow h-full slide-in-left">
            {/* Sidebar Header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b">
                <span className="text-2xl text-[rgb(215,160,56)]">✴</span>
                <h2 className="text-2xl font-semibold">Menu</h2>
            </div>      
        </div>
    );
}   
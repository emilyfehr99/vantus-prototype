'use client';

export default function LicenseManagement() {
  return (
    <div className="space-y-6">
      <div className="border border-green-900/30 bg-black/50 p-8">
        <h3 className="text-[10px] font-bold tracking-widest text-green-500 uppercase mb-8">LICENSE STATUS</h3>

        <div className="grid grid-cols-2 gap-12">
          <div>
            <div className="mb-8">
              <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2">LICENSE TYPE</p>
              <p className="text-2xl font-bold text-white font-mono tracking-wider">ENTERPRISE</p>
            </div>

            <div>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2">EXPIRATION</p>
              <p className="text-2xl font-bold text-green-500 font-mono tracking-wider">2027-01-09</p>
            </div>
          </div>

          <div>
            <div className="mb-8">
              <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2">SEATS USED</p>
              <p className="text-2xl font-bold text-white font-mono tracking-wider">
                <span className="text-green-500">12</span> / 50
              </p>
            </div>

            <div>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2">STATUS</p>
              <div className="inline-block border border-green-500 px-4 py-1 bg-green-900/20">
                <span className="text-xs font-bold text-green-500 tracking-widest">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

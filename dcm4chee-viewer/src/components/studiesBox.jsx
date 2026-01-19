/* eslint-disable react-refresh/only-export-components */
export default function studiesBox() {
  return (
    <div className="w-full bg-white/80 backdrop-blur-md border shadow">
      {/* Header */}
      <div className="px-6 py-3 border-b">
        <h2 className="text-2xl font-semibold">Studies</h2>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Column 1 */}
        <div className="space-y-4">
          <Input label="Patient family name" />
          <Input label="Patient ID" />
          <Input label="Accession number" />
          <Checkbox label="Fuzzy Matching" />
          <Input label="Issuer of patient" />
          <Input label="Issuer of accession number" />
        </div>

        {/* Column 2 */}
        <div className="space-y-4">
          <Input label="Study Description" />
          <Select label="Modality" />
          <Input label="Referring physician family" />
          <Input label="Institutional Department Name" />
        </div>

        {/* Column 3 */}
        <div className="space-y-4">
          <Input label="Sending AET of Series" />
          <DateInput label="Study date" />
          <DateInput label="Study time" />
          <DateInput label="Study Received" />
          <DateInput label="Study Access" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 px-6 py-4 border-t">
        <select className="border px-3 py-2 rounded">
          <option>Order By</option>
        </select>
        <select className="border px-3 py-2 rounded">
          <option>Web App Service</option>
        </select>
        <button className="ml-auto bg-slate-800 text-white px-6 py-2 rounded">
          SUBMIT
        </button>
      </div>
    </div>
  );
}

function Input({ label }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <input
        type="text"
        className="mt-1 w-full border-b bg-transparent outline-none"
      />
    </label>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
function DateInput({ label }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <input
        type="date"
        className="mt-1 w-full border-b bg-transparent outline-none"
      />
    </label>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
function Select({ label }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <select className="mt-1 w-full border-b bg-transparent outline-none">
        <option>all</option>
        <option>CT</option>
        <option>MR</option>
        <option>US</option>
      </select>
    </label>
  );
}

function Checkbox({ label }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <input type="checkbox" />
      {label}
    </label>
  );
}

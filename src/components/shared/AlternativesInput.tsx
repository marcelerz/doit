"use client";

interface AlternativesInputProps {
  value: string[];
  onChange: (alternatives: string[]) => void;
  label?: string;
  placeholder?: string;
  showPreview?: boolean;
}

export function AlternativesInput({
  value,
  onChange,
  label = "Alternatives",
  placeholder = "e.g., alias1, alias2, alias3",
  showPreview = true,
}: AlternativesInputProps) {
  const handleChange = (text: string) => {
    const alts = text
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a);
    onChange(alts);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">{label}</label>
      <input
        type="text"
        value={value.join(", ")}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {showPreview && value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((alt, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              aka: {alt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

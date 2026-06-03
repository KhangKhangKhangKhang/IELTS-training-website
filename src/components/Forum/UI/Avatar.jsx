// Avatar - chữ cái đầu với tone màu hex, có dot online tùy chọn
// Props:
//   name: string (lấy chữ cái đầu)
//   tone: hex color (default '#6366f1')
//   size: 'sm' | 'md' | 'lg' (default 'md')
//   online: boolean
//   className: string (override)
const SIZE_CLASS = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

export const Avatar = ({
  name,
  tone = "#6366f1",
  size = "md",
  online = false,
  className = "",
}) => {
  const initial =
    name?.trim().charAt(0).toUpperCase() || "?";
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center font-semibold text-white rounded-full select-none flex-none ${sizeClass} ${className}`}
      style={{ backgroundColor: tone }}
    >
      <span>{initial}</span>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
};

export default Avatar;

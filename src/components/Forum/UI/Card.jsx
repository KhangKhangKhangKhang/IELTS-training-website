// Card - 3D border card theo MagicPath mockup
// Mặc định border-2 border-[#e6e6ed] + shadow-[0_2px_0_#e6e6ed] + rounded-2xl + p-5
// Có thể đổi `as` để dùng semantic tag (section/article/div) phù hợp ngữ cảnh.
export const Card = ({
  as = "div",
  className = "",
  children,
  ...rest
}) => {
  const Tag = as;
  return (
    <Tag
      className={`bg-white border-2 border-[#e6e6ed] rounded-2xl shadow-[0_2px_0_#e6e6ed] p-5 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Card;

export default function TableToolbar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-end md:justify-between">
      {children}
    </div>
  );
}
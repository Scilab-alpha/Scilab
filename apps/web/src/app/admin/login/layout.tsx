export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Provide a minimal layout for the admin login page so it does not inherit
  // the /admin layout (which includes the AdminShell sidebar).
  return <>{children}</>;
}

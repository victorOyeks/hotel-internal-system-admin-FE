export interface PageProps extends AppLayoutProps {}

export interface AppLayoutProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
  children: React.ReactNode;
}

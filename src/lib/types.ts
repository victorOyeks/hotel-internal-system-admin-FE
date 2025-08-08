export interface PageProps extends LayoutProps {}

export interface LayoutProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
  children: React.ReactNode;
}

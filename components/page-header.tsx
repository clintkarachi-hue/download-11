
type PageHeaderProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 print:hidden">
      <div className="flex items-center gap-2">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight text-primary">
                {title}
            </h1>
            <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}
